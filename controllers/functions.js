const moment = require('moment')
const dbFunctions = require("../utils/mongooseDbFunctions")
const usersModel = require("../models/user")
const transactionsModel = require("../models/transaction")
const debtsModel = require("../models/debt")
const rolesModel = require("../models/role")
const categoriesModel = require("../models/category")
const subCategoriesModel = require("../models/subCategory")
const dtvModel = require('../models/defaultTransactionValue')
const recurrentTransactionsModel = require('../models/recurrentTransaction')
const defaultRoles = require("../utils/default/roles.json")
const defaultUsers = require("../utils/default/users.json")
const defaultCategories = require("../utils/default/categories.json")
const defaultSubCategories = require("../utils/default/subCategories.json")
const dtvJson = require("../utils/default/transactionDefaultValues.json")

const { getCurrentMonthTransactions, getAllBalance, getIlikeSearch, populateCategoryAndSubCategory, createUser, populatePerson, currentMonthSearch, emptyDataForCharts } = require("../utils/common")

const getPersonFullName = row => {
    let fullname = row?.name;
    if (row?.lastname)
        fullname += ` ${row?.lastname}`

    return fullname?.trim() ?? 'fullname';
}

const getDebts = async (currentUserData) => {
    try {
        const items = await dbFunctions.find(debtsModel, { search: { isCompleted: false }, sort: { date: -1 }, populate: populatePerson });

        if (items?.length === 0)
            return [];

        const currentUser = await dbFunctions.findOne(usersModel, currentUserData?._id?.toString(), { populate: populatePerson });

        const data = []
        items.forEach(d => {
            const dataIndex = data.findIndex(p => p?.person?._id === d?.person?._id);
            if (dataIndex === -1) {
                data.push({
                    person: {
                        _id: d?.isMyDebt ? currentUser?.id ?? 'user' : d?.person?._id,
                        name: getPersonFullName(d?.isMyDebt ? currentUser?.person ?? 'User' : d?.person),
                    },
                    debts: {
                        [d?.type]: parseFloat(d?.amount ?? 0) - parseFloat(d?.paid ?? 0)
                    }
                })
            } else {
                const currentPersonTotalDebts = { ...data[dataIndex].debts }
                const existsSameCurrency = Object.keys(currentPersonTotalDebts).includes(d?.type)
                const accumulated = existsSameCurrency ? parseFloat(currentPersonTotalDebts[d?.type] ?? 0) : 0;

                currentPersonTotalDebts[d?.type] = accumulated + parseFloat(d?.amount ?? 0) - parseFloat(d?.paid ?? 0)

                data[dataIndex] = {
                    ...data[dataIndex],
                    debts: currentPersonTotalDebts,
                };
            }
        })

        return data;
    } catch (err) {
        throw new Error(err.message)
    }
}

/**
 * Formats the list as an object containing labels and values
 * @param {[]} list 
 * @returns Object containing labels and values for charts
 */
const formatLabelAndValue = (list = []) => {
    const items = { ...emptyDataForCharts }

    list.forEach(c => {
        items.labels = [...items.labels, c._id]
        items.values = [...items.values, c.totalAmount]
    })

    return items
}

/**
 * Returns the amount of checks that are verified, calibrated and can be used for the given search criteria
 * @param {*} search 
 * @returns Object containing each check boolean counter
 */
const getCategoryAndSubcategoryChartData = async (search) => {
    const result = await transactionsModel.aggregate([
        { $match: { ...search, isExpense: true } },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        { $unwind: "$category" },
        {
            $lookup: {
                from: "subcategories",
                localField: "subCategory",
                foreignField: "_id",
                as: "subCategory"
            }
        },
        { $unwind: "$subCategory" },
        {
            $facet: {
                category: [
                    {
                        $group: {
                            _id: "$category.name",
                            totalAmount: { $sum: "$amount" }
                        },
                    },
                    { $sort: { totalAmount: -1 } }
                ],
                subCategory: [
                    {
                        $group: {
                            _id: {
                                subCategory: "$subCategory.name",
                                category: "$category.name"
                            },
                            totalAmount: { $sum: "$amount" }
                        }
                    },
                    {
                        $project: {
                            _id: {
                                $cond: [
                                    { $ifNull: ["$_id.subCategory", false] },
                                    { $concat: ["$_id.subCategory", ":", "$_id.category"] },
                                    "$_id.category"
                                ]
                            },
                            totalAmount: 1
                        }
                    },
                    { $sort: { totalAmount: -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ]);

    return {
        category: formatLabelAndValue(result[0].category),
        subCategory: formatLabelAndValue(result[0].subCategory)
    };
};


/**
 * Returns the amount of money for expenses and income transactions for the given search criteria
 * @param {*} search 
 * @returns Object containing the amount of money for expenses and income transactions, 
 * also the biggest income transaction and the date it was made 
 */
const getExpensesAndIncomesCounters = async (search) => {
    const results = await transactionsModel.aggregate([
        { $match: { ...search, type: 'cup' } },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            monthExpenses: {
                                $sum: { $cond: ["$isExpense", "$amount", 0] }
                            },
                            monthIncome: {
                                $sum: { $cond: ["$isExpense", 0, "$amount"] }
                            }
                        }
                    }
                ],
                biggestIncomeDoc: [
                    { $match: { isExpense: false } },
                    { $sort: { amount: -1 } },
                    { $limit: 1 },
                    { $project: { _id: 0, amount: 1, date: 1 } }
                ]
            }
        },
        {
            $project: {
                monthExpenses: { $arrayElemAt: ["$totals.monthExpenses", 0] },
                monthIncome: { $arrayElemAt: ["$totals.monthIncome", 0] },
                biggestIncome: { $arrayElemAt: ["$biggestIncomeDoc.amount", 0] },
                biggestIncomeDate: { $arrayElemAt: ["$biggestIncomeDoc.date", 0] }
            }
        }
    ]);

    return results[0] ?? {};
};

exports.getDashboard = async (req, res) => {
    try {
        const { currentMonth, currentYear } = req.body;
        if (isNaN(currentMonth) || !currentYear)
            res.status(400).json({ status: 'error', message: 'Missing params' })

        const search = currentMonthSearch(currentMonth, currentYear);
        const [
            { category: categoryData = { ...emptyDataForCharts }, subCategory: subCategoryData = { ...emptyDataForCharts } },
            { monthExpenses = 0, monthIncome = 0, biggestIncome = 0, biggestIncomeDate = null },
            currentMonthTransactions = []
        ] = await Promise.all([
            getCategoryAndSubcategoryChartData(search),
            getExpensesAndIncomesCounters(search),
            getCurrentMonthTransactions(currentMonth, currentYear, { replaceFields: true, showAll: false, sort: { amount: -1 } })
        ])

        if (currentMonthTransactions?.length === 0) {
            return res.json({
                status: 'success',
                monthExpenses: 0,
                monthIncome: 0,
                biggestIncome,
                biggestIncomeDate,
                categoryData: { ...emptyDataForCharts },
                subCategoryData: { ...emptyDataForCharts },
                days: {},
                debtSection: []
            })
        }

        const result = currentMonthTransactions.reduce((acc, item) => {
            const categoryName = item.category;

            const subCategory = { name: item?.subCategory ?? categoryName }
            const subCategoryName = `${subCategory?.name}:${categoryName}`;

            const dayName = moment(item?.date).format('YYYY-MM-DD');
            const dayValue = {
                date: item?.date,
                category: categoryName,
                subCategory: subCategoryName,
                amount: item?.amount ?? 0,
                description: item?.description
            }

            return ({ ...acc, [dayName]: [...(acc?.[dayName] ?? []), dayValue] })
        }, Promise.resolve([]))

        const days = {}
        Object.keys(result ?? {}).sort().forEach(i => days[i] = result?.[i] ?? []);

        const debtSection = await getDebts(req?.userData);

        return res.json({
            status: 'success',
            monthExpenses: parseFloat(monthExpenses).toFixed(2),
            monthIncome: parseFloat(monthIncome).toFixed(2),
            biggestIncome,
            biggestIncomeDate,
            categoryData,
            subCategoryData,
            days,
            debtSection
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
    if (missingDTV?.length > 0)
        await dbFunctions.insertMany(dtvModel, missingDTV)
}

const checkMissingItemExists = async (model, dataList, jsonValues = [], modelName, checkField = 'name') => {
    try {
        const existingNames = dataList.map(i => i?.[checkField])

        const missingItems = jsonValues.filter(i => !existingNames.includes(i?.[checkField]))
        if (missingItems?.length > 0)
            if (modelName === 'users')
                for (let i = 0; i < missingItems.length; i++)
                    await createUser({ body: missingItems[i] })
            else
                await dbFunctions.insertMany(model, missingItems)
    } catch (e) {
        console.log('***error', e)
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
        if (missingSubCategories?.length > 0)
            await dbFunctions.insertMany(subCategoriesModel, missingSubCategories)

        await checkDefaultTransactionValuesExists(categories, subCategories);
    }
}

exports.callFirstRun = async () => {
    let [categories, roles, users] = await Promise.all([
        dbFunctions.find(categoriesModel),
        dbFunctions.find(rolesModel),
        dbFunctions.find(usersModel)
    ])
    if (categories) {
        await checkMissingItemExists(categoriesModel, categories, defaultCategories, 'categories');
        const [updatedCategories, subCategories] = await Promise.all([
            dbFunctions.find(categoriesModel),
            dbFunctions.find(subCategoriesModel)
        ]);
        if (updatedCategories && subCategories)
            await checkSubCategoriesExists(updatedCategories, subCategories);
    }

    await checkMissingItemExists(rolesModel, roles, defaultRoles, 'roles');
    await checkMissingItemExists(usersModel, users, defaultUsers, 'users', 'email');
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
                if (updateResponse)
                    response.push(updateResponse)
            }

            return res.send({ status: 'success', result: response })
        }
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}
