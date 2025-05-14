const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/subCategory")
const categoryModel = require("../models/category")

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model, {}, { name: 1 });

        res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const response = await dbFunctions.findOne(model, req?.params?.id)
        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }

        res.json({
            status: 'success',
            data: response
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.create = async (req, res) => {
    try {
        const body = { ...req?.body }
        if (req?.body?.newCategory?._id) {
            const categoryResponse = await dbFunctions.insertOne(categoryModel, req?.body?.newCategory)
            if (categoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.category = categoryResponse?._id
        }

        const response = await dbFunctions.insertOne(model, body)
        if (response?.status === 'error')
            res.status(500).json(response)

        res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, response._id)
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }
        res.json({
            status: 'success',
            id: req?.params?.id
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const body = { ...req?.body }
        if (req?.body?.newCategory?._id) {
            const categoryResponse = await dbFunctions.insertOne(categoryModel, req?.body?.newCategory)
            if (categoryResponse?.status === 'error')
                res.status(500).json(response)
            else
                body.category = categoryResponse?._id
        }

        const response = await dbFunctions.updateOne(model, req?.params?.id, body)

        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }


        res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, req?.params?.id)
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}