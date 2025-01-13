const moment = require('moment')
const dbFunctions = require("./mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")

exports.getBalanceFunction = async (type = 'cup') => {
    const groupBy = {
        $group: {
            _id: null,
            total: {
                $sum: "$amount"
            }
        }
    }

    const expenseResponse = await transactionsModel.aggregate([
        {
            $match: {
                type,
                isExpense: true
            }
        },
        { ...groupBy }
    ])

    const incomeResponse = await transactionsModel.aggregate([
        {
            $match: {
                type,
                isExpense: false
            }
        },
        { ...groupBy }
    ])
    const income = incomeResponse[0]?.total ?? 0;
    const expense = expenseResponse[0]?.total ?? 0;

    return parseFloat(income - expense).toFixed(2);
}

exports.getCurrentMonthTransactions = async (currentMonth, currentYear, { showAll = false, replaceFields = false }) => {
    const currentMonthFirstDay = moment().set({ D: 1, M: currentMonth, y: currentYear, h: 0, m: 0, s: 0, milliseconds: 0 }).valueOf();
    const nextMonthFirstDay = moment(currentMonthFirstDay).add(1, 'month').valueOf();
    const search = {
        date: {
            $gte: currentMonthFirstDay,
            $lt: nextMonthFirstDay
        },
    }

    if (!showAll) {
        search['isExpense'] = true
        search['type'] = 'cup'
    }

    const currentMonthTransactions = await dbFunctions.find(transactionsModel, search, { amount: -1 });
    const categories = await dbFunctions.find(categoriesModel);
    const subCategories = await dbFunctions.find(subCategoriesModel);

    if (replaceFields) {
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
