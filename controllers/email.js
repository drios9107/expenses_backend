const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const { contactEmail } = require('../utils/emailTemplates/contactEmail')

const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

// Add error listener
oAuth2Client.on('error', err => {
	console.error('OAuth2 Error:', err)
})

const getEnvRefreshToken =
	process.env.NODE_ENV === 'dev' ? process.env.GOOGLE_REFRESH_TOKEN_LOCAL : process.env.GOOGLE_REFRESH_TOKEN

oAuth2Client.setCredentials({
	refresh_token: getEnvRefreshToken
})

const getTransporter = async () => {
	const accessToken = await oAuth2Client.getAccessToken()

	return nodemailer.createTransport({
		host: process.env.GOOGLE_SERVER,
		port: 587,
		secure: false,

		auth: {
			user: process.env.GOOGLE_SENDER_EMAIL,
			pass: process.env.GOOGLE_SENDER_PASSWORD,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			refreshToken: getEnvRefreshToken,
			accessToken: accessToken.token
		},
		pool: true,
		maxConnections: 1,
		maxMessages: 5
	})
}

const getInquiryType = (inquiryType = 'other') => {
	return {
		job: 'Job Opportunity',
		collaboration: 'Collaboration',
		question: 'Technical Question',
		other: 'Other'
	}[inquiryType]
}

exports.sendEmail = async (req, res) => {
	try {
		const { name, email, subject, message, inquiryType } = req?.body ?? {}

		const errors = []

		if (!email) errors.push('email')
		if (!subject) errors.push('subject')
		if (!message) errors.push('message')
		if (!inquiryType) errors.push('inquiryType')

		if (errors.length > 0)
			return res.status(400).json({ code: 400, message: `The required fields are missing: ${errors.join(', ')}` })

		const transporter = await getTransporter()
		await transporter
			.sendMail({
				from: `Portfolio Contact "${name}" <${process.env.GOOGLE_SENDER_EMAIL}>`,
				to: [process.env.GOOGLE_RECEIVER_EMAIL],
				replyTo: email,
				subject,
				html: contactEmail
					.replace('{{name}}', name)
					.replace('{{email}}', email)
					.replace('{{subject}}', subject)
					.replace('{{inquiryType}}', getInquiryType(inquiryType))
					.replace('{{message}}', message)
					.replace('{{timestamp}}', new Date().toLocaleString())
					.replace('{{ipAddress}}', req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress)
			})
			.then(resp => {
				return res.send({ status: 'success', message: resp.messageId })
			})
	} catch (error) {
		console.error('sendEmail error:', error)
		return res.status(500).json({ code: error?.code, message: error?.message })
	}
}
