const moment = require('moment')
const dbFunctions = require("../utils/mongooseDbFunctions")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const defaultCategories = require("../utils/default/categories.json")
const defaultSubCategories = require("../utils/default/subCategories.json")

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
            const subCategoryName = `${subCategory?.name}:${categoryName}`;

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

const checkCategoriesExists = async (categories) => {
    const existingCategoryNames = categories.map(i => i.name)
    if (categories) {
        const missingCategories = defaultCategories.filter(i => !existingCategoryNames.includes(i?.name))
        console.log('***missingCategories:', missingCategories.length)
        if (missingCategories?.length > 0)
            await dbFunctions.insertMany(categoriesModel, missingCategories)
    }
}

const subCategoryExists = (categories, subCategories, item) => {
    const categoryUid = categories.find(c => c?.name === item?.category)?._id?.toString();
    const exists = subCategories.some(s => s.name === item.name && s.category === categoryUid)

    return exists
}

const checkSubCategoriesExists = async (categories, subCategories) => {
    if (categories && subCategories) {
        const missingSubCategories = defaultSubCategories
            .filter(i => !subCategoryExists(categories, subCategories, i))
            .map(i => ({ ...i, category: categories.find(c => c?.name === i.category)?._id?.toString() }))
        console.log('***missingSubCategories:', missingSubCategories?.length)
        if (missingSubCategories?.length > 0)
            await dbFunctions.insertMany(subCategoriesModel, missingSubCategories)
    }
}

exports.callFirstRun = async () => {
    let categories = await dbFunctions.find(categoriesModel)
    if (categories) {
        checkCategoriesExists(categories);
        categories = await dbFunctions.find(categoriesModel);
        const subCategories = await dbFunctions.find(subCategoriesModel)
        if (categories && subCategories)
            checkSubCategoriesExists(categories, subCategories);
    }
}
