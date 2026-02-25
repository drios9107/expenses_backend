const jwt = require('jsonwebtoken')
const dbFunctions = require('./mongooseDbFunctions')
const userModel = require('../models/user')
const { populateRole } = require('./common')

const authRoutes = ['/auth/login', '/auth/register', '/auth/verifyOauthAccessToken']
const testingEndpoints = []
const freeTest = true

exports.verifyToken = async (req, res, next) => {
	try {
		console.log('***path', req?.path)
		if ([...authRoutes, ...testingEndpoints].includes(req.path) || freeTest) return next()
		else {
			const token = req.headers['authorization']?.split(' ')?.[1]
			if (!token) return res.status(403).json({ code: 'missing-token', message: 'No token provided' })
			const tokenIsValid = jwt.verify(token, process.env.JWT_SECRET)
			if (!tokenIsValid) return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })

			req.userData = tokenIsValid
			return next()
		}
	} catch (err) {
		return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })
	}
}

exports.isAdmin = async (req, res, next) => {
	try {
		if (freeTest) return next()
		if (req?.userData?._id) {
			const loggedUser = await dbFunctions.findOne(userModel, req.userData._id, { populate: populateRole })
			if (loggedUser?.role?.name === 'Admin') return next()
		}
		return res.status(401).json({ code: 'forbidden', message: 'Unauthorized' })
	} catch (err) {
		return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })
	}
}
