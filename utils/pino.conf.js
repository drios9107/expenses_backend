const pino = require('pino')
const fs = require('fs')
const path = require('path')

exports.createLoggerForRoute = routeName => {
	const logDir = path.join('logs', routeName)
	if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

	const filePath = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)

	return pino({ level: 'info' }, pino.destination({ dest: filePath, sync: false }))
}
