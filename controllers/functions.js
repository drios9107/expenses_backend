const moment = require('moment')
const dbFunctions = require("../utils/mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const { getCurrentMonthTransactions, getBalanceFunction, getCurrentMonthIncomeTransactions } = require("../utils/common")

exports.getDashboard = async (req, res) => {
    try {
        const { currentMonth, currentYear } = req.body;
        if (isNaN(currentMonth) || !currentYear)
            res.status(400).json({ status: 'error', message: 'Missing params' })

        const currentMonthTransactions = await getCurrentMonthTransactions(currentMonth, currentYear);
        let monthExpenses = 0, monthIncome = 0, biggestIncome = 0, biggestIncomeDate = null;

        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses: 0,
                monthIncome: 0,
                biggestIncome,
                biggestIncomeDate,
                categoryData: { labels: [], values: [] },
                subCategoryData: { labels: [], values: [] },
                days: {}
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
            const stackedDays = stacked?.days;
            const dayName = moment(item?.date).format('YYYY-MM-DD');
            const dayValue = {
                category: categoryName,
                subCategory: subCategoryName,
                amount: item?.amount ?? 0,
                description: item?.description
            }
            monthExpenses += item.amount;

            return ({
                days: { ...stackedDays, [dayName]: [...(stacked?.days?.[dayName] ?? []), dayValue] },
                category: { ...stackedCategory, [categoryName]: (stacked?.category?.[categoryName] ?? 0) + item.amount },
                subCategory: { ...stackedSubCategory, [subCategoryName]: (stacked?.subCategory?.[subCategoryName] ?? 0) + item.amount }
            })
        }, Promise.resolve([]))

        const categoryData = { labels: Object.keys(result.category), values: Object.values(result.category) };
        const subCategoryData = { labels: Object.keys(result.subCategory)?.slice(0, 10), values: Object.values(result.subCategory)?.slice(0, 10) };
        const days = {}
        Object.keys(result?.days ?? {}).sort().map(i => days[i] = result?.days?.[i] ?? []);

        incomeTransactions = await getCurrentMonthIncomeTransactions(currentMonth, currentYear);
        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses,
                monthIncome: 0,
                biggestIncome,
                biggestIncomeDate,
                categoryData,
                subCategoryData,
                days
            })
        }

        biggestIncome = incomeTransactions?.[0]?.amount ?? 0;
        biggestIncomeDate = incomeTransactions?.[0]?.date;
        incomeTransactions.forEach(i => monthIncome += i?.amount);

        res.json({
            status: 'success',
            monthExpenses: parseFloat(monthExpenses).toFixed(2),
            monthIncome: parseFloat(monthIncome).toFixed(2),
            biggestIncome,
            biggestIncomeDate,
            categoryData,
            subCategoryData,
            days
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.getBalance = async (req, res) => {
    const transactionsResponse = await dbFunctions.find(transactionsModel, { isExpense: false, type: 'cup' }, { date: -1 });
    if (transactionsResponse?.status === 'error') {
        res.status(500)
        res.json(transactionsResponse)
    }

    const balance = await getBalanceFunction();
    const balanceMLC = await getBalanceFunction('mlc');
    const balanceUSD = await getBalanceFunction('usd');
    const balanceUSDT = await getBalanceFunction('usdt');

    res.send({ status: 'success', balance, balanceMLC, balanceUSD, balanceUSDT })
}
