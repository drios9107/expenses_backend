const dbFunctions = require('../utils/mongooseDbFunctions')
const userModel = require('../models/user')
const roleModel = require('../models/role')
const bcrypt = require('bcryptjs')
const { generateAccessToken, createUser, populateRole } = require('../utils/common')

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

			const tokenData = {
				email: response[0]?.email,
				role: response[0]?.role?.name,
				_id: response[0]?._id?.toString()
			}
			const token = generateAccessToken(tokenData)

			return res.send({ ...tokenData, token })
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

		oauthUser = await response.json()
		const users = await dbFunctions.find(userModel, { search: { email: oauthUser?.email }, populate: populateRole })

		const user = users?.[0]
		let tokenData = null
		if (users.length === 0) {
			const roles = await dbFunctions.find(roleModel, { search: { name: 'User' } })
			const createdUser = await createUser({
				body: {
					email: oauthUser?.email,
					password: process.env.NODE_DEFAULT_USER_PASSWORD,
					role: roles[0]._id
				}
			})
			tokenData = {
				_id: createdUser._id?.toString(),
				email: createdUser.email,
				role: 'User'
			}
		} else {
			tokenData = {
				email: user?.email,
				role: user?.role?.name ?? 'User',
				_id: user?._id?.toString()
			}
		}

		const token = generateAccessToken(tokenData)

		return res.send({ ...tokenData, token })
	} catch (error) {
		console.error('***verifyOauthAccessToken error:', error)
		return res.status(500).json({ code: 'internal-server-error', message: 'Internal server error' })
	}
}
