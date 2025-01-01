const dbFunctions = require("../utils/mongooseDbFunctions")
const moment = require('moment')
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")

exports.getDashboard = async (req, res) => {
    try {
        const { currentMonth, currentYear } = req.body;
        if (isNaN(currentMonth) || !currentYear)
            res.status(400).json({ status: 'error', message: 'Missing params' })

        const currentMonthFirstDay = moment().set({ D: 1, M: currentMonth, y: currentYear }).valueOf();
        const nextMonthFirstDay = moment(currentMonthFirstDay).add(1, 'month').valueOf();

        const currentMonthTransactions = await dbFunctions.find(transactionsModel, {
            date: {
                $gte: currentMonthFirstDay,
                $lt: nextMonthFirstDay
            },
            isExpense: true,
            type: 'cup'
        }, { amount: -1 });

        console.log('***here', { currentMonthFirstDay, nextMonthFirstDay }, currentMonthTransactions)

        let monthExpenses = 0;

        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses: 0,
                categoryData: { labels: [], values: [] },
                subCategoryData: { labels: [], values: [] }
            })
        }

        const result = await currentMonthTransactions.reduce(async (acc, item) => {
            const category = await dbFunctions.findOne(categoriesModel, item.category)
            const categoryName = category?.name;

            const subCategory = item?.subCategory ?
                await dbFunctions.findOne(subCategoriesModel, item.subCategory) :
                { name: categoryName };
            const subCategoryName = `${subCategory?.name}`;

            const stacked = await acc;
            const stackedCategory = stacked?.category;
            const stackedSubCategory = stacked?.subCategory;
            monthExpenses += item.amount;
            return ({
                category: { ...stackedCategory, [categoryName]: (stacked?.category?.[categoryName] ?? 0) + item.amount },
                subCategory: { ...stackedSubCategory, [subCategoryName]: (stacked?.subCategory?.[subCategoryName] ?? 0) + item.amount }
            })
        }, Promise.resolve([]))


        const categoryData = { labels: Object.keys(result.category), values: Object.values(result.category) };
        const subCategoryData = { labels: Object.keys(result.subCategory)?.slice(0, 10), values: Object.values(result.subCategory)?.slice(0, 10) };
        console.log('****result', { categoryData, subCategoryData })
        res.json({
            status: 'success',
            monthExpenses: parseFloat(monthExpenses).toFixed(2),
            categoryData,
            subCategoryData
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

const balanceFunction = async () => {
    const expenseResponse = await transactionsModel.aggregate([
        {
            $match: {
                type: "cup",
                isExpense: true
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount"
                }
            }
        }
    ])

    const incomeResponse = await transactionsModel.aggregate([
        {
            $match: {
                type: "cup",
                isExpense: false
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$amount"
                }
            }
        }
    ])

    return parseFloat(incomeResponse[0].total - expenseResponse[0].total).toFixed(2);
}

exports.exportedBalanceFunction = async () => {
    return await balanceFunction();
}

exports.getBalance = async (req, res) => {
    const transactionsResponse = await dbFunctions.find(transactionsModel, { isExpense: false, type: 'cup' }, { date: -1 });
    if (transactionsResponse?.status === 'error') {
        res.status(500)
        res.json(transactionsResponse)
    }
    const lastIncome = parseFloat(transactionsResponse?.[0]?.amount ?? 0).toFixed(2);
    const lastIncomeDate = transactionsResponse?.[0]?.date;

    const balance = await balanceFunction();

    res.send({ status: 'success', lastIncome, lastIncomeDate, balance })
}
