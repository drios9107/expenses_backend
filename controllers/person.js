const dbFunctions = require('../utils/mongooseDbFunctions')
const model = require('../models/person')
const userModel = require('../models/user')
const { sendCreateUpdateSuccessResponse, populateUser } = require('../utils/common')

exports.getAll = async (req, res) => {
	try {
		const items = await dbFunctions.find(model, { sort: { name: 1 }, populate: populateUser })

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
		const response = await dbFunctions.findOne(model, req?.params?.id, { populate: populateUser })
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

		if (req?.body?.user) {
			const user = await dbFunctions.findOne(userModel, req.body.user)
			await dbFunctions.updateOne(userModel, { ...user, person: response?._id })
		}

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
		const response = await dbFunctions.deleteOne(model, req?.params?.id)

		if (response?.status === 'error') {
			return res.status(500).json(response)
		}

		const users = (await dbFunctions.find(userModel, { search: { person: req.params.id } })) ?? []
		if (users.length > 0) {
			const u = users[0]
			await dbFunctions.updateOne(userModel, { ...u, person: null })
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

		if (response?.status === 'error') return res.status(500).json(response)

		if (req?.body?.user) {
			const person = await dbFunctions.findOne(model, req?.params?.id)
			if (person.user && person.user !== req.body.user) {
				await Promise.all([
					dbFunctions.updateOne(userModel, person.user, { ...person.user, person: null }),
					dbFunctions.updateOne(userModel, req.body.user, { ...person.user, person: req?.params?.id })
				])
			} else if (!person.user) {
				const user = await dbFunctions.findOne(model, req.body.user)
				await dbFunctions.updateOne(userModel, req.body.user, { ...user, person: req?.params?.id })
			}
		}

		return sendCreateUpdateSuccessResponse(res, model, response?._id)
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}
