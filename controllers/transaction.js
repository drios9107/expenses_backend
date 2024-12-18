const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/transaction")

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model)

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
        const response = await dbFunctions.insertOne(model, req?.body)
        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }

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
        const transactionData = await dbFunctions.findOne(model, req?.params?.id)
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
        const response = await dbFunctions.updateOne(model, req?.params?.id, req?.body)

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