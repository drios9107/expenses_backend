const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/transaction");
const categories = require("../models/category");
const subCategories = require("../models/subCategory");
const { getCurrentMonthTransactions } = require("../utils/common");
const moment = require('moment')

exports.getTransactionsByCategory = async (req, res) => {
    try {
        const { currentMonth, currentYear, categoryName } = req.params;
        if (isNaN(currentMonth) || !currentYear || !categoryName)
            return res.status(400).json({ status: 'error', message: 'Missing params' })

        const category = await dbFunctions.find(categories, { name: decodeURIComponent(categoryName) })
        if (category.length === 0)
            return res.status(404).json({ status: 'error', message: 'category-not-found' })

        const currentMonthTransactions = await getCurrentMonthTransactions(currentMonth, currentYear, { categoryId: category[0]._id, replaceFields: true, sort: { date: -1, amount: -1 } });
        return res.json({
            status: 'success',
            data: currentMonthTransactions
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getTransactionsByCategoryAndSubCategory = async (req, res) => {
    try {
        const { currentMonth, currentYear, categoryName, subCategoryName } = req.params;
        if (isNaN(currentMonth) || !currentYear || !categoryName || !subCategoryName)
            return res.status(400).json({ status: 'error', message: 'Missing params' })

        const category = await dbFunctions.find(categories, { name: decodeURIComponent(categoryName) })
        if (category.length === 0)
            return res.status(404).json({ status: 'error', message: 'category-not-found' })

        const categoryId = category[0]?._id?.toString();

        const subCategory = await dbFunctions.find(subCategories, { name: decodeURIComponent(subCategoryName), category: categoryId })
        if (subCategory.length === 0)
            return res.status(404).json({ status: 'error', message: 'subCategory-not-found' })

        const currentMonthTransactions = await getCurrentMonthTransactions(currentMonth, currentYear, { subCategoryId: subCategory[0]._id, categoryId, replaceFields: true, sort: { date: -1, amount: -1 } });
        return res.json({
            status: 'success',
            data: currentMonthTransactions
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getCurrentMonth = async (req, res) => {
    try {
        const currentMonth = moment().get('M');
        const currentYear = moment().get('Y');
        const items = await getCurrentMonthTransactions(currentMonth, currentYear, { showAll: true, replaceFields: true });

        return res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model)

        return res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const response = await dbFunctions.findOne(model, req?.params?.id)
        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            data: response
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.create = async (req, res) => {
    try {
        const body = { ...req?.body }
        if (req?.body?.newCategory?._id) {
            const categoryResponse = await dbFunctions.insertOne(categories, req?.body?.newCategory)
            if (categoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.category = categoryResponse?._id
        }

        if (req?.body?.newSubCategory?._id) {
            const subCategoryResponse = await dbFunctions.insertOne(subCategories, { ...req?.body?.newSubCategory, category: req?.body?.newCategory?._id })
            if (subCategoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.subCategory = subCategoryResponse?._id
        }

        const response = await dbFunctions.insertOne(model, body)
        if (response?.status === 'error')
            return res.status(500).res.json(response)

        return res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, response._id)
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        // const transactionData = await dbFunctions.findOne(model, req?.params?.id)
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            id: req?.params?.id
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const body = { ...req?.body }
        if (req?.body?.newCategory?._id) {
            const categoryResponse = await dbFunctions.insertOne(categories, req?.body?.newCategory)
            if (categoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.category = categoryResponse?._id
        }

        if (req?.body?.newSubCategory?._id) {
            const subCategoryResponse = await dbFunctions.insertOne(subCategories, { ...req?.body?.newSubCategory, category: req?.body?.newCategory?._id })
            if (subCategoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.subCategory = subCategoryResponse?._id
        }

        const response = await dbFunctions.updateOne(model, req?.params?.id, body)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, req?.params?.id)
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}