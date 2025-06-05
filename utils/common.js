const moment = require('moment')
const dbFunctions = require("./mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');

const categoryPopulateSelect = { path: 'category', select: 'name _id' };

exports.populateCategory = [categoryPopulateSelect];

exports.populateCategoryAndSubCategory = [
    categoryPopulateSelect,
    { path: 'subCategory', select: 'name _id' },
]

exports.getIlikeSearch = (searchTerm) => {
    return { $regex: searchTerm, $options: 'i' }
}

const getTransactionsTotal = async (type, isExpense) => {
    const groupBy = {
        $group: {
            _id: null,
            total: {
                $sum: "$amount"
            }
        }
    }
    const response = await transactionsModel.aggregate([
        {
            $match: {
                type,
                isExpense
            }
        },
        { ...groupBy }
    ])
    return response[0]?.total ?? 0;
}

exports.getBalanceFunction = async (type = 'cup') => {
    const income = await getTransactionsTotal(type, false)
    const expense = await getTransactionsTotal(type, true);

    return parseFloat(income - expense).toFixed(2);
}

const currentMonthSearch = (currentMonth, currentYear) => {
    const currentMonthFirstDay = moment().set({ D: 1, M: currentMonth, y: currentYear, h: 0, m: 0, s: 0, milliseconds: 0 }).valueOf();
    const nextMonthFirstDay = moment(currentMonthFirstDay).add(1, 'month').valueOf();
    const search = {
        date: {
            $gte: currentMonthFirstDay,
            $lt: nextMonthFirstDay
        },
    }
    return search;
}

exports.getCurrentMonthIncomeTransactions = async (currentMonth, currentYear) => {
    const search = currentMonthSearch(currentMonth, currentYear);
    search['isExpense'] = false
    search['type'] = 'cup'

    const currentMonthTransactions = await dbFunctions.find(transactionsModel, search, { amount: -1 });
    return currentMonthTransactions;
}

exports.getCurrentMonthTransactions = async (currentMonth, currentYear, options = { sort: null, showAll: false, replaceFields: false, categoryId: null, subCategoryId: null }) => {
    const search = currentMonthSearch(currentMonth, currentYear);

    let sort = { amount: -1 };
    if (!options?.showAll) {
        search['isExpense'] = true
        search['type'] = 'cup'
    }

    if (options?.categoryId)
        search['category'] = options.categoryId

    if (options?.subCategoryId)
        search['subCategory'] = options.subCategoryId

    if (options?.sort)
        sort = options.sort;

    const currentMonthTransactions = await dbFunctions.find(transactionsModel, search, sort);
    const categories = await dbFunctions.find(categoriesModel);
    const subCategories = await dbFunctions.find(subCategoriesModel);

    if (options?.replaceFields) {
        return currentMonthTransactions.map((i, index) => {
            const data = { ...(i?._doc ?? i) };
            if (data?.category)
                data.category = categories.find(c => c?._id?.toString() === data.category)?.name;
            if (data?.subCategory)
                data.subCategory = subCategories.find(sc => sc?._id?.toString() === data.subCategory)?.name;

            return data;
        })
    }

    return currentMonthTransactions;
}

exports.generateAccessToken = (params) => {
    return jwt.sign(params, process.env.JWT_SECRET, { expiresIn: '24h' });
}

exports.sendCreateUpdateSuccessResponse = async (res, model, id) => {
    const data = await dbFunctions.findOne(model, id);
    return res.status(200).json({ status: 'success', data });
};


/**
 * This function handles the search term if it has this format YYYY-MM-DD, then it changes the query search in the or variable 
 * @params searchTerm {string} 
 * @params or {array}
 * @returns {array}
 */
exports.handleDateSearchTerm = (searchTerm, or) => {
    const year = searchTerm.split('-')[0];
    const month = searchTerm.split('-')[1];
    const date = searchTerm.split('-')[2];
    if (!isNaN(year) && !isNaN(month) && !isNaN(date)) {
        const tempDate = moment().set({ year, month: parseInt(month) - 1, date });
        if (tempDate.isValid()) {
            const startDate = moment(tempDate).startOf('day').valueOf();
            const endDate = moment(tempDate).endOf('day').valueOf(); 111

            return [{ date: { $gte: startDate, $lte: endDate } }]
        }
    }

    return or
}

/**
 * Converts all transactions where the specified field contains a string value
 * into a proper ObjectId reference. Used for migrating String-based IDs to ObjectIds.
 * 
 * @param {string} field - The field name to migrate (e.g., 'category').
 * @throws {Error} If the field is invalid or database operations fail. 
 */
exports.changeTransactionsFieldType = async (field = 'category') => {
    const BATCH_SIZE = 200; // Adjust based on performance
    let processed = 0;

    const search = { [field]: { $type: 'string' } };

    try {
        // Count transactions with string-type category
        const total = await transactionsModel.countDocuments(search);
        console.log(`Found ${total} transactions to migrate.`);

        while (processed < total) {
            // Fetch a batch of transactions
            const items = await transactionsModel.find(search)
                .select(`_id ${field}`)
                .limit(BATCH_SIZE)
                .lean();

            if (items.length === 0) break;

            const bulkOps = items
                .filter(tx => tx?.[field] && tx?.[field] !== '')
                .map(tx => ({
                    updateOne: {
                        filter: { _id: tx._id },
                        update: {
                            $set: {
                                [field]: new mongoose.Types.ObjectId(tx?.[field]) // Convert String → ObjectId
                            }
                        }
                    }
                }));

            const result = await transactionsModel.bulkWrite(bulkOps);
            processed += items.length;
            console.log(`Migrated batch: ${processed}/${total} (${result.modifiedCount} updated)`);
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

/**
 * Converts all subCategory where the specified field contains a string value
 * into a proper ObjectId reference. Used for migrating String-based IDs to ObjectIds.
 * 
 * @param {string} field - The field name to migrate (e.g., 'category').
 * @throws {Error} If the field is invalid or database operations fail. 
 */
exports.changeSubCategoryFieldType = async (field = 'category') => {
    const BATCH_SIZE = 200; // Adjust based on performance
    let processed = 0;

    const search = { [field]: { $type: 'string' } };

    try {
        // Count items with string-type category
        const total = await subCategoriesModel.countDocuments(search);
        console.log(`Found ${total} items to migrate.`);

        while (processed < total) {
            // Fetch a batch of items
            const items = await subCategoriesModel.find(search)
                .select(`_id ${field}`)
                .limit(BATCH_SIZE)
                .lean();

            if (items.length === 0) break;

            const bulkOps = items
                .filter(i => i?.[field] && i?.[field] !== '')
                .map(i => ({
                    updateOne: {
                        filter: { _id: i._id },
                        update: {
                            $set: {
                                [field]: new mongoose.Types.ObjectId(i?.[field]) // Convert String → ObjectId
                            }
                        }
                    }
                }));

            const result = await subCategoriesModel.bulkWrite(bulkOps);
            processed += items.length;
            console.log(`Migrated batch: ${processed}/${total} (${result.modifiedCount} updated)`);
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}