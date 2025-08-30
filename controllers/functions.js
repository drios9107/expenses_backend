const moment = require('moment')
const dbFunctions = require("../utils/mongooseDbFunctions")
const usersModel = require("../models/user")
const transactionsModel = require("../models/transaction")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const dtvModel = require('../models/defaultTransactionValue')
const recurrentTransactionsModel = require('../models/recurrentTransaction')
const defaultCategories = require("../utils/default/categories.json")
const defaultSubCategories = require("../utils/default/subCategories.json")
const dtvJson = require("../utils/default/transactionDefaultValues.json")

const { getCurrentMonthTransactions, getCurrentMonthIncomeTransactions, getAllBalance, getIlikeSearch, populateCategoryAndSubCategory } = require("../utils/common")

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
            const category = await dbFunctions.findOne(categoriesModel, item?.category?._id)
            const categoryName = category?.name;

            const subCategory = item?.subCategory ?
                await dbFunctions.findOne(subCategoriesModel, item?.subCategory?._id) :
                { name: categoryName };
            const subCategoryName = `${subCategory?.name}:${categoryName}`;

            const stacked = await acc;
            const stackedCategory = stacked?.category;
            const stackedSubCategory = stacked?.subCategory;
            const stackedDays = stacked?.days;
            const dayName = moment(item?.date).format('YYYY-MM-DD');
            const dayValue = {
                date: item?.date,
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

        return res.json({
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
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getBalance = async (req, res) => {
    try {
        const [balance, balanceMLC, balanceUSD, balanceUSDT] = await getAllBalance();

        return res.send({ status: 'success', balance, balanceMLC, balanceUSD, balanceUSDT })
    } catch (error) {
        console.error('getBalance error:', error);
        return res.status(500).json({ code: error?.code, message: error?.message });
    }
}

exports.convertCurrency = async (req, res) => {
    try {
        const errors = [];
        if (!req?.body.fromType)
            errors.push('fromType')
        if (!req?.body.toType)
            errors.push('toType')
        if (!req?.body.sourceAmount)
            errors.push('sourceAmount')
        if (!req?.body.finalAmount)
            errors.push('finalAmount')

        if (errors.length > 0)
            return res.status(400).json({ status: 'error', message: `Missing params: ${errors.join(', ')}` })

        const subCategories = await dbFunctions.find(subCategoriesModel, { search: { name: getIlikeSearch('Conversión de Monedas') } })
        if (subCategories?.length === 0)
            return res.status(404).json({ status: 'error', message: 'subCategory-not-found' })

        const subCategory = subCategories[0]?._id;
        const category = subCategories[0]?.category?._id;
        const date = req?.body?.date;

        const commonPayload = {
            category,
            subCategory,
            isRecurrent: false,
            description: req?.body?.description ?? 'Conversión de Monedas',
            created_at: moment().valueOf(),
            date
        };

        const responses = await Promise.all([
            dbFunctions.insertOne(transactionsModel, {
                ...commonPayload,
                amount: req?.body?.sourceAmount,
                type: req?.body?.fromType,
                isExpense: true
            }, { populate: populateCategoryAndSubCategory }),
            dbFunctions.insertOne(transactionsModel, {
                ...commonPayload,
                amount: req?.body?.finalAmount,
                type: req?.body?.toType,
                isExpense: false
            }, { populate: populateCategoryAndSubCategory })
        ]);

        if (responses?.[0]?.status === 'error' || responses?.[1]?.status === 'error')
            return res.status(500).json({ status: 'error', message: responses?.[0]?.message ?? responses?.[1]?.message })

        return res.json({ status: 'success', data: responses })
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message })
    }
}

const defaultTransactionValueExists = (categories, subCategories, dtv, item) => {
    const categoryUid = categories.find(c => c?.name === item?.category)?._id?.toString();
    const subCategoryUid = subCategories.find(s => s.name === item.subCategory && s.category?.toString() === categoryUid)?._id?.toString();
    const exists = dtv.some(s => s.category?.toString() === categoryUid && s.subCategory?.toString() === subCategoryUid)

    return exists
}

const checkDefaultTransactionValuesExists = async (categories, subCategories) => {
    const dtv = await dbFunctions.find(dtvModel);

    const missingDTV = dtvJson
        .filter(i => !defaultTransactionValueExists(categories, subCategories, dtv, i))
        .map(i => ({
            ...i,
            category: categories.find(c => c?.name === i.category)?._id?.toString(),
            subCategory: subCategories.find(c => c?.name === i.subCategory)?._id?.toString()
        }))
    console.log('***missingDTV:', missingDTV?.length)
    if (missingDTV?.length > 0)
        await dbFunctions.insertMany(dtvModel, missingDTV)
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
    const exists = subCategories.some(s => s.name === item.name && s.category?.toString() === categoryUid)

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

        checkDefaultTransactionValuesExists(categories, subCategories);
    }
}

exports.callFirstRun = async () => {
    let categories = await dbFunctions.find(categoriesModel)
    if (categories) {
        checkCategoriesExists(categories);
        const [updatedCategories, subCategories] = await Promise.all([
            dbFunctions.find(categoriesModel),
            dbFunctions.find(subCategoriesModel)
        ]);
        if (updatedCategories && subCategories)
            checkSubCategoriesExists(updatedCategories, subCategories);
    }
}

exports.addCreatedAt = async (req, res) => {
    try {
        if (req?.body?.model) {
            const model = {
                user: usersModel,
                transactions: transactionsModel,
                categories: categoriesModel,
                subCategories: subCategoriesModel,
                recurrentTransactions: recurrentTransactionsModel
            }[req?.body?.model];

            const search = { created_at: { $exists: false } };
            const items = await dbFunctions.find(model, { search });
            const response = []
            for (let index = 0; index < items.length; index++) {
                const temp = items[index];
                const id = temp?._id?.toString();
                const created_at = moment(temp?.date).set({ milliseconds: index + 1 }).valueOf();
                const updateResponse = await dbFunctions.updateOne(model, id, { created_at })
                console.log('***temp', id, created_at, updateResponse?.created_at);
                if (updateResponse)
                    response.push(updateResponse)
            }

            return res.send({ status: 'success', result: response })
        }
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}
