const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true
	},
	created_at: {
		type: Number,
		default: Date.now()
	},
	update_at: {
		type: Number,
		default: Date.now()
	}
})

module.exports = mongoose.model('role', schema)
