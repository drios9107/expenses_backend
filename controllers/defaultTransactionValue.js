const mongoose = require('mongoose')
const dbFunctions = require('../utils/mongooseDbFunctions')
const model = require('../models/defaultTransactionValue')
const { sendCreateUpdateSuccessResponse, populateCategoryAndSubCategory } = require('../utils/common')

exports.getAll = async (req, res) => {
	try {
		const items = await dbFunctions.find(model, { populate: populateCategoryAndSubCategory })

		return res.json({
			status: 'success',
			data: items
		})
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}

exports.getDefaultTransactionValuesByCategoryAndSubCategory = async (req, res) => {
	try {
		const { category: categoryId, subcategory: subCategoryId } = req.query
		if (!categoryId || !subCategoryId)
			return res.status(400).json({ status: 'error', message: 'Missing params', code: 'no-error-needed' })

		if (!mongoose.isValidObjectId(categoryId))
			return res.status(400).json({ status: 'error', message: 'Wrong categoryId', code: 'no-error-needed' })

		if (!mongoose.isValidObjectId(subCategoryId))
			return res.status(400).json({ status: 'error', message: 'Wrong subCategoryId', code: 'no-error-needed' })

		const items = await dbFunctions.find(model, {
			search: { category: categoryId, subCategory: subCategoryId },
			populate: populateCategoryAndSubCategory
		})

		if (items.length === 0)
			return res
				.status(404)
				.json({
					status: 'error',
					message: 'There are no default transaction values for this category and subcategory',
					code: 'no-error-needed'
				})

		return res.json({
			status: 'success',
			data: items[0]
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

		return sendCreateUpdateSuccessResponse(res, model, response?._id, { populate: populateCategoryAndSubCategory })
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}
