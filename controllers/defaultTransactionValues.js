const dbFunctions = require("../utils/mongooseDbFunctions");
const model = require("../models/defaultTransactionValue");
const { sendCreateUpdateSuccessResponse, populateCategoryAndSubCategory } = require("../utils/common");

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model, { populate: populateCategoryAndSubCategory });

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
        const response = await dbFunctions.findOne(model, req?.params?.id, { populate: populateCategoryAndSubCategory })
        if (response?.status === 'error') {
            return res.status(500).json(response)
        }

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
        const response = await dbFunctions.insertOne(model, req?.body)
        if (response?.status === 'error') {
            return res.status(500).json(response)
        }

        return res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, response._id, { populate: populateCategoryAndSubCategory })
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error') {
            return res.status(500).json(response)
        }

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
        const response = await dbFunctions.updateOne(model, req?.params?.id, req?.body)

        if (response?.status === 'error') {
            return res.status(500).json(response)
        }

        return sendCreateUpdateSuccessResponse(res, model, response?._id, { populate: populateCategoryAndSubCategory });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}