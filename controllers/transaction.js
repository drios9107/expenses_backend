const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/transaction");
const categories = require("../models/category");
const subCategories = require("../models/subCategory");
const { getCurrentMonthTransactions, sendCreateUpdateSuccessResponse, handleDateSearchTerm, getIlikeSearch, populateCategoryAndSubCategory } = require("../utils/common");
const moment = require('moment')
const handleCategories = require("../utils/categoryHandlers");

exports.getTransactionsByCategory = async (req, res) => {
    try {
        const { currentMonth, currentYear, categoryName } = req.params;
        if (isNaN(currentMonth) || !currentYear || !categoryName)
            return res.status(400).json({ status: 'error', message: 'Missing params' })

        const category = await dbFunctions.find(categories, { name: decodeURIComponent(categoryName) })
        if (category.length === 0)
            return res.status(404).json({ status: 'error', message: 'category-not-found' })

        const currentMonthTransactions = await getCurrentMonthTransactions(currentMonth, currentYear, { categoryId: category[0]._id, replaceFields: true, sort: { date: -1, amount: -1 } });
        return res.json({
            status: 'success',
            data: currentMonthTransactions
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getTransactionsByCategoryAndSubCategory = async (req, res) => {
    try {
        const { currentMonth, currentYear, categoryName, subCategoryName } = req.params;
        if (isNaN(currentMonth) || !currentYear || !categoryName || !subCategoryName)
            return res.status(400).json({ status: 'error', message: 'Missing params' })

        const category = await dbFunctions.find(categories, { name: decodeURIComponent(categoryName) })
        if (category.length === 0)
            return res.status(404).json({ status: 'error', message: 'category-not-found' })

        const categoryId = category[0]?._id?.toString();

        const subCategory = await dbFunctions.find(subCategories, { name: decodeURIComponent(subCategoryName), category: categoryId })
        if (subCategory.length === 0)
            return res.status(404).json({ status: 'error', message: 'subCategory-not-found' })

        const subCategoryId = subCategory[0]?._id?.toString();

        const currentMonthTransactions = await getCurrentMonthTransactions(currentMonth, currentYear, { subCategoryId, categoryId, replaceFields: true, sort: { date: -1, amount: -1 } });
        return res.json({
            status: 'success',
            data: currentMonthTransactions
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getCurrentMonth = async (req, res) => {
    try {
        const currentMonth = moment().get('M');
        const currentYear = moment().get('Y');
        const items = await getCurrentMonthTransactions(currentMonth, currentYear, { showAll: true, replaceFields: true });

        return res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

/**
 * This functions searches for transactions using limit and skip (not recommended for large data sets)
 * @param {String} searchTerm Value to search in transaction fields
 * @param {Number} limit Amount of transactions to return
 * @param {Number} page Page number
 * @param {String} sortField Field to sort by
 * @param {String} sortDirection Sort direction
 * @param {Boolean} isExpense Search for expense or income transactions, if it's not set then it returns both
 * @param {Boolean} isRecurrent Search for recurrent or non-recurrent transactions, if it's not set then it returns both
 * @returns Returns a transactions array in "data" property and the total amount of transactions in "total" property
 */
exports.simpleSearch = async (req, res) => {
    try {
        const search = {}

        const {
            searchTerm,
            limit = 50,
            page = 0,
            sortField = 'created_at',
            sortDirection = 'desc',
            isExpense,
            isRecurrent,
        } = req?.body;

        const sort = {
            [sortField]: sortDirection === 'desc' ? -1 : 1,
            created_at: sortDirection === 'desc' ? -1 : 1
        };

        const and = [];
        if (typeof (isExpense) !== 'undefined')
            and.push({ isExpense })

        if (typeof (isRecurrent) !== 'undefined')
            and.push({ isRecurrent })

        if (searchTerm) {
            let or = [{ type: getIlikeSearch(searchTerm) }, { description: getIlikeSearch(searchTerm) }]

            if (!isNaN(searchTerm))
                or.push({ amount: searchTerm })

            if (searchTerm.toString().split('-').length === 3)
                or = handleDateSearchTerm(searchTerm, or);

            and.push({ $or: or });
        }

        search.$and = and;

        const transactions = await dbFunctions.searchWithSkip({ model, search, sort, limit, page, populate: populateCategoryAndSubCategory });
        const total = await dbFunctions.count(model);

        return res.json({
            status: 'success',
            data: transactions,
            length: transactions.length,
            total
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

/**
 * This functions searches for transactions using a pagination token
 * @param {String} searchTerm Value to search in transaction fields
 * @param {Number} limit Amount of transactions to return
 * @param {Number} paginationToken This field defines in which direction and from what point the search should start. Pagination token is an object containing the following properties: direction (previous or next), firstSortField, firstCreatedAt, lastSortField and lastCreatedAt
 * @param {String} sortField Field to sort by
 * @param {String} sortDirection Sort direction
 * @param {Boolean} isExpense Search for expense or income transactions, if it's not set then it returns both
 * @param {Boolean} isRecurrent Search for recurrent or non-recurrent transactions, if it's not set then it returns both
 * @returns Returns a transactions array in "data" property and the total amount of transactions in "total" property
 */
exports.search = async (req, res) => {
    try {
        const search = {}

        const {
            searchTerm,
            limit = 50,
            paginationToken = null,
            sortField = 'created_at',
            sortDirection = 'desc',
            isExpense,
            isRecurrent,
        } = req?.body;

        const properDirection = paginationToken?.direction === 'previous' ?
            (sortDirection === 'desc' ? 1 : -1) :
            (sortDirection === 'desc' ? -1 : 1);

        const sort = {
            [sortField]: properDirection,
            created_at: properDirection
        };

        const and = [];
        if (typeof (isExpense) !== 'undefined')
            and.push({ isExpense })

        if (typeof (isRecurrent) !== 'undefined')
            and.push({ isRecurrent })

        if (searchTerm) {
            const [categoriesData, subCategoriesData] = await Promise.all([
                dbFunctions.find(categories, { name: getIlikeSearch(searchTerm) }),
                dbFunctions.find(subCategories, { name: getIlikeSearch(searchTerm) })
            ])

            let or = [{ type: getIlikeSearch(searchTerm) }, { description: getIlikeSearch(searchTerm) }]

            const categoriesIds = categoriesData.map(i => i?._id);
            if (categoriesIds.length > 0)
                or.push({ category: { $in: categoriesIds } })

            const subCategoriesIds = subCategoriesData.map(i => i?._id);
            if (subCategoriesIds.length > 0)
                or.push({ subCategory: { $in: subCategoriesIds } })

            if (!isNaN(searchTerm))
                or.push({ amount: searchTerm })

            if (searchTerm.toString().split('-').length === 3)
                or = handleDateSearchTerm(searchTerm, or);

            and.push({ $or: or });
        }

        if (paginationToken) {
            and.push({
                $or: paginationToken.direction === 'previous' ?
                    [
                        {
                            [sortField]: {
                                [sortDirection === 'desc' ? '$gt' : '$lt']: paginationToken.firstSortValue
                            }
                        },
                        {
                            [sortField]: paginationToken.firstSortValue,
                            created_at: { $gt: paginationToken.firstCreatedAt }
                        }
                    ] :
                    [
                        {
                            [sortField]: {
                                [sortDirection === 'desc' ? '$lt' : '$gt']: paginationToken.lastSortValue
                            }
                        },
                        {
                            [sortField]: paginationToken.lastSortValue,
                            created_at: { $lt: paginationToken.lastCreatedAt }
                        }
                    ]
            });
        }

        search.$and = and;
        const transactions = await dbFunctions.search({ model, search, sort, limit: limit + 1, populate: populateCategoryAndSubCategory });
        const total = await dbFunctions.count(model, search);

        let hasMore = transactions.length > limit;
        const isFirstSearch = !paginationToken;
        let resultTransactions = hasMore ? transactions.slice(0, -1) : transactions;
        if (paginationToken?.direction === 'previous') {
            resultTransactions = resultTransactions.reverse();
            hasMore = true;
        }
        const amount = resultTransactions?.length;

        const firstTransaction = resultTransactions[0];
        const lastTransaction = resultTransactions[resultTransactions.length - 1];

        return res.json({
            status: 'success',
            data: resultTransactions,
            total,
            length: amount,
            nextPageToken: hasMore ? {
                lastSortValue: lastTransaction[sortField],
                lastCreatedAt: lastTransaction.created_at,
                direction: 'next'
            } : null,
            previousPageToken: !isFirstSearch ? {
                firstSortValue: firstTransaction[sortField],
                firstCreatedAt: firstTransaction.created_at,
                direction: 'previous'
            } : null
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.aggregationSearch = async (req, res) => {
    try {
        const {
            searchTerm,
            limit = 50,
            paginationToken = null,
            sortField = 'created_at',
            sortDirection = 'desc',
            isExpense,
            isRecurrent,
        } = req?.body;

        const properDirection = paginationToken?.direction === 'previous' ?
            (sortDirection === 'desc' ? 1 : -1) :
            (sortDirection === 'desc' ? -1 : 1);

        const sort = {
            [sortField]: properDirection,
            created_at: properDirection
        };

        const and = [];
        if (typeof (isExpense) !== 'undefined')
            and.push({ isExpense })

        if (typeof (isRecurrent) !== 'undefined')
            and.push({ isRecurrent })

        if (searchTerm) {
            let or = [{ type: getIlikeSearch(searchTerm) }, { description: getIlikeSearch(searchTerm) }]


            if (!isNaN(searchTerm))
                or.push({ amount: searchTerm })

            if (searchTerm.toString().split('-').length === 3)
                or = handleDateSearchTerm(searchTerm, or);

            and.push({ $or: or });
        }

        if (paginationToken) {
            and.push({
                $or: paginationToken.direction === 'previous' ?
                    [
                        {
                            [sortField]: {
                                [sortDirection === 'desc' ? '$gt' : '$lt']: paginationToken.firstSortValue
                            }
                        },
                        {
                            [sortField]: paginationToken.firstSortValue,
                            created_at: { $gt: paginationToken.firstCreatedAt }
                        }
                    ] :
                    [
                        {
                            [sortField]: {
                                [sortDirection === 'desc' ? '$lt' : '$gt']: paginationToken.lastSortValue
                            }
                        },
                        {
                            [sortField]: paginationToken.lastSortValue,
                            created_at: { $lt: paginationToken.lastCreatedAt }
                        }
                    ]
            });
        }

        const search = { $and: and };

        const baseAggregationPipeline = [
            { $match: search },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'subCategory',
                    foreignField: '_id',
                    as: 'subCategory'
                }
            },
            { $unwind: '$subCategory' }
        ];

        if (searchTerm) {
            baseAggregationPipeline.push({
                $match: {
                    $or: [
                        { 'category.name': getIlikeSearch(searchTerm) },
                        { 'subCategory.name': getIlikeSearch(searchTerm) }
                    ]
                }
            });
        }

        const totalAggregationPipeline = [...baseAggregationPipeline, { $count: 'total' }];
        const total = (await model.aggregate(totalAggregationPipeline)?.[0]?.total) ?? 0;
        console.log('***total', await model.aggregate(totalAggregationPipeline));

        const resultAggregationPipeline = [
            ...baseAggregationPipeline,
            { $sort: sort },
            { $limit: limit + 1 }
        ];

        const transactions = await model.aggregate(resultAggregationPipeline);

        let hasMore = transactions.length > limit;
        const isFirstSearch = !paginationToken;
        let resultTransactions = hasMore ? transactions.slice(0, -1) : transactions;
        if (paginationToken?.direction === 'previous') {
            resultTransactions = resultTransactions.reverse();
            hasMore = true;
        }
        const amount = resultTransactions?.length;

        const firstTransaction = resultTransactions[0];
        const lastTransaction = resultTransactions[resultTransactions.length - 1];

        return res.json({
            status: 'success',
            data: resultTransactions,
            total,
            length: amount,
            nextPageToken: hasMore ? {
                lastSortValue: lastTransaction[sortField],
                lastCreatedAt: lastTransaction.created_at,
                direction: 'next'
            } : null,
            previousPageToken: !isFirstSearch ? {
                firstSortValue: firstTransaction[sortField],
                firstCreatedAt: firstTransaction.created_at,
                direction: 'previous'
            } : null
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model, {}, {}, populateCategoryAndSubCategory)

        return res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const response = await dbFunctions.findOne(model, req?.params?.id, {}, populateCategoryAndSubCategory)
        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            data: response
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.create = [handleCategories, async (req, res) => {
    try {
        const response = await dbFunctions.insertOne(model, req?.body)
        if (response?.status === 'error')
            return res.status(500).res.json(response)

        return sendCreateUpdateSuccessResponse(res, model, response?._id)
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}]

exports.delete = async (req, res) => {
    try {
        // const transactionData = await dbFunctions.findOne(model, req?.params?.id)
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            id: req?.params?.id
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = [handleCategories, async (req, res) => {
    try {
        const response = await dbFunctions.updateOne(model, req?.params?.id, req?.body)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return sendCreateUpdateSuccessResponse(res, model, response?._id)
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}]