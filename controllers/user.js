const dbFunctions = require('../utils/mongooseDbFunctions')
const model = require('../models/user')
const { sendCreateUpdateSuccessResponse, createUser, userSearchCommonOptions } = require('../utils/common')

exports.getAll = async (req, res) => {
	try {
		const items = await dbFunctions.find(model, { ...userSearchCommonOptions, sort: { name: 1 } })

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
		const response = await dbFunctions.findOne(model, req?.params?.id, userSearchCommonOptions)
		if (response?.status === 'error') {
			return res.status(500).json(response)
		}

		return res.json({
			status: 'success',
			data
		})
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}

exports.create = async (req, res) => {
	try {
		const response = await createUser(req)
		if (response?.status === 'error') return res.status(500).json(response)

		return res.json({
			status: 'success',
			data: await dbFunctions.findOne(model, response._id, userSearchCommonOptions)
		})
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}

exports.delete = async (req, res) => {
	try {
		if (req?.userData?._id === req.params?.id)
			return res.status(400).json({
				code: 'unable-deactivate-logged-user',
				message: 'No puede desactivar el usuario logueado'
			})

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

		return sendCreateUpdateSuccessResponse(res, model, response?._id, userSearchCommonOptions)
	} catch (err) {
		return res.status(500).json({ status: 'error', message: err.message })
	}
}

exports.reactivate = async (req, res) => {
	try {
		const response = await dbFunctions.reactivate(model, req?.params?.id)

		if (response?.status === 'error') {
			return res.status(500).json(response)
		}

		if (!response) {
			return res.status(404).json({
				code: 'user-not-found',
				message: 'Usuario no encontrado'
			})
		}

		return res.json({
			status: 'success',
			message: 'Usuario reactivado exitosamente',
			data: {
				id: req?.params?.id,
				isActive: true
			}
		})
	} catch (err) {
		return deleteJsonError(res, err)
	}
}
