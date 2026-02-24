const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	lastname: {
		type: String,
		required: true
	},
	user: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'user',
		required: false
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

module.exports = mongoose.model('person', schema)
