const moment = require('moment')
const dbFunctions = require("./mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const jwt = require('jsonwebtoken')

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
