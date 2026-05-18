const mongoose = require('mongoose')

let cached = global.mongoose
if (!cached) {
	cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
	if (cached.conn) return cached.conn
	if (!cached.promise) {
		cached.promise = mongoose.connect(process.env.MONGO_DB_URL, {
			dbName: 'expensesDB',
			bufferCommands: false
		})
	}
	try {
		cached.conn = await cached.promise
		return cached.conn
	} catch (err) {
		cached.promise = null
		console.error('*** Mongo connection error:', err)
		throw err
	}
}

module.exports = connectDB
