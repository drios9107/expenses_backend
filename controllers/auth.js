const dbFunctions = require('../utils/mongooseDbFunctions')
const userModel = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { generateAccessToken, createUser, populateRole } = require('../utils/common')
const user = require('../models/user')

exports.register = async (req, res) => {
	if (!req?.body?.email || !req?.body?.password)
		return res.status(400).json({ status: 'error', code: 'missing-params', message: 'Missing params' })
	else {
		const createResponse = await createUser(req)
		if (createResponse?.status === 'error') return res.status(500).json(createResponse)

		return res.send({ email: createResponse?.email, _id: createResponse?._id?.toString() })
	}
}

exports.login = async (req, res) => {
	try {
		if (!req?.body?.email || !req?.body?.password)
			return res.status(400).json({ status: 'error', code: 'missing-params', message: 'Missing params' })
		else {
			const response = await dbFunctions.find(userModel, {
				search: { email: req.body.email },
				populate: populateRole
			})
			if (response?.status === 'error') return res.status(500).json({ message: response })

			if (response.length === 0)
				return res.status(404).json({ code: 'user-not-found', message: "The user doesn't exist" })

			const isValid = await bcrypt.compare(req.body.password, response[0].password)
			if (!isValid)
				return res
					.status(403)
					.json({ code: 'invalid-credentials', message: 'The user/password combination is incorrect' })

			const user = { email: response[0]?.email, role: response[0]?.role?.name, _id: response[0]?._id?.toString() }
			const token = generateAccessToken(user)

			return res.send({ ...user, token })
		}
	} catch (error) {
		console.error('Login error:', error)
		return res.status(500).json({ code: 'internal-server-error', message: 'Internal server error' })
	}
}

exports.verifyOauthAccessToken = async (req, res) => {
	try {
		if (!req?.body?.provider || !req?.body?.accessToken)
			return res.status(400).json({ code: 'missing-params', message: 'Missing params' })

		const url =
			req.body.provider === 'github'
				? 'https://api.github.com/user'
				: 'https://www.googleapis.com/oauth2/v3/userinfo'

		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${req.body.accessToken}` }
		})
		if (!response?.ok) return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })

		userData = await response.json()
		const dbUser = await dbFunctions.find(user, { search: { email: userData?.email }, populate: populateRole })
		if (!dbUser) {
			return res.status(404).json({
				code: 'user-not-found',
				message: 'No user found with this email'
			})
		}

		const tempUser = {
			email: userData?.email,
			role: dbUser?.role?.name,
			_id: dbUser?._id?.toString()
		}

		const token = generateAccessToken(tempUser)

		return res.send({ ...tempUser, token })
	} catch (error) {
		console.error('***verifyOauthAccessToken error:', error)
		return res.status(500).json({ code: 'internal-server-error', message: 'Internal server error' })
	}
}
