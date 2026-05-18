const jwt = require('jsonwebtoken')
const connectDB = require('./mongooseConnection')
const dbFunctions = require('./mongooseDbFunctions')
const userModel = require('../models/user')
const { populateRole } = require('./common')
const { createLoggerForRoute } = require('./pino.conf')

const authRoutes = ['/auth/login', '/auth/register', '/auth/verifyOauthAccessToken', 'functions/create-default']
const testingEndpoints = []
const freeTest = false

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

exports.requestLogger = (req, res, next) => {
	let responseCode = null
	let responseMessage = null
	let responseIndex = null

	const originalJson = res.json

	res.json = function (body) {
		responseCode = body?.code
		responseMessage = body?.message
		responseIndex = body?.index
		return originalJson.call(this, body)
	}

	res.on('finish', () => {
		if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
			const routeName = req.baseUrl.replace('/', '') || 'root'
			const logger = createLoggerForRoute(routeName)

			const data = {
				userId: req?.userdata?._id,
				method: req.method,
				path: req.originalUrl,
				status: res.statusCode,
				payload: req?.body ?? undefined
			}

			if (res.statusCode >= 400) {
				data.error = {
					code: responseCode ?? res.statusCode,
					message: responseMessage ?? res.statusMessage
				}
				if (responseIndex) data.error['index'] = responseIndex
			}

			logger.info(data)
		}
	})

	next()
}

exports.dbMiddleware = async (req, res, next) => {
	try {
		await connectDB()
		next()
	} catch (err) {
		console.error('DB connection error:', err)
		res.status(500).json({ error: 'Database connection failed' })
	}
}
