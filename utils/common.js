const moment = require('moment')
const dbFunctions = require("./mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const recurrentTransactionsModel = require("../models/recurrentTransaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');

exports.populateCategory = [
    { path: 'category', select: 'name _id' }
];

exports.populateCategoryAndSubCategory = [
    this.populateCategory,
    { path: 'subCategory', select: 'name _id' },
]

exports.getIlikeSearch = (searchTerm = '') => {
    return { $regex: searchTerm?.toString(), $options: 'i' }
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
    try {
        const [income, expense] = await Promise.all([getTransactionsTotal(type, false), getTransactionsTotal(type, true)]);

        return parseFloat(income - expense).toFixed(2);
    } catch (error) {
        console.error('getBalance error:', error);
        return res.status(500).json({ code: error?.code, message: error?.message });
    }
}

/**
 * This function returns a promise that resolves an array with the balance of each currency 
 * @returns {Promise<Array>} An array with the balance of each currency [balanceCUP, balanceMLC, balanceUSD, balanceUSDT]
 */
exports.getAllBalance = async () => {
    try {
        return Promise.all([
            this.getBalanceFunction(),
            this.getBalanceFunction('mlc'),
            this.getBalanceFunction('usd'),
            this.getBalanceFunction('usdt')
        ])
    } catch (error) {
        console.error('getAllBalance error:', error);
        return res.status(500).json({ code: error?.code, message: error?.message });
    }
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

    const currentMonthTransactions = await dbFunctions.find(transactionsModel, search, sort, this.populateCategoryAndSubCategory);

    if (options?.replaceFields) {
        return currentMonthTransactions.map((i, index) => {
            const data = { ...(i?._doc ?? i) };
            if (data?.category)
                data.category = data?.category?.name;
            if (data?.subCategory)
                data.subCategory = data?.subCategory?.name;

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
exports.changeTransactionsFieldType = async ({ model = 'transactions', field = 'category' }) => {
    const BATCH_SIZE = 200; // Adjust based on performance
    let processed = 0;

    const tempModel = model === 'transactions' ? transactionsModel : recurrentTransactionsModel;

    const search = { [field]: { $type: 'string' } };

    try {
        // Count transactions with string-type category
        const total = await tempModel.countDocuments(search);
        console.log(`Found ${total} transactions to migrate.`);

        while (processed < total) {
            // Fetch a batch of transactions
            const items = await tempModel.find(search)
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

            const result = await tempModel.bulkWrite(bulkOps);
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

exports.removeUnnecessarySubcategories = async () => {
    try {
        const subCategories = await dbFunctions.find(subCategoriesModel);
        const transactions = await dbFunctions.find(transactionsModel);
        console.log(transactions?.length);
        const subCategoriesInUse = Array.from(new Set(
            transactions
                ?.filter(i => {
                    const sc = i.subCategory?.toString() ?? i?.subCategory;

                    return sc && sc !== ''
                })
                ?.map(i => i?.subCategory?.toString() ?? i?.subCategory)
        ));
        const notInUseObjectIds = subCategories.filter(i => !subCategoriesInUse.includes(i._id?.toString()))?.map(i => i?._id)

        const bulkOps = notInUseObjectIds
            .map(i => ({
                deleteOne: {
                    filter: { _id: i._id }
                }
            }));

        const result = await subCategoriesModel.bulkWrite(bulkOps);
        console.log(`Deleted batch: ${result.modifiedCount} deleted`);
    } catch (error) {
        console.error('Deletion failed:', error);
    }
}