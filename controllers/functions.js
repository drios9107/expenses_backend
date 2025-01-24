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
        let monthExpenses = 0;
        let monthIncome = 0;

        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses: 0,
                monthIncome: 0,
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

        const incomeTransactions = await getCurrentMonthIncomeTransactions(currentMonth, currentYear);
        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses,
                monthIncome: 0,
                categoryData,
                subCategoryData
            })
        }

        incomeTransactions.forEach(i => monthIncome += i?.amount);

        res.json({
            status: 'success',
            monthExpenses: parseFloat(monthExpenses).toFixed(2),
            monthIncome: parseFloat(monthIncome).toFixed(2),
            categoryData,
            subCategoryData
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
    const lastIncome = parseFloat(transactionsResponse?.[0]?.amount ?? 0).toFixed(2);
    const lastIncomeDate = transactionsResponse?.[0]?.date;

    const balance = await getBalanceFunction();
    const balanceMLC = await getBalanceFunction('mlc');
    const balanceUSD = await getBalanceFunction('usd');
    const balanceUSDT = await getBalanceFunction('usdt');

    res.send({ status: 'success', lastIncome, lastIncomeDate, balance, balanceMLC, balanceUSD, balanceUSDT })
}
