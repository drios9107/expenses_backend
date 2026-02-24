const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	category: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'category',
		required: true,
		messsage: 'required field'
	},
	subCategory: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'subCategory',
		required: false
	},
	date: {
		type: Number,
		required: true
	},
	amount: {
		type: Number,
		min: 0,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	isExpense: {
		type: Boolean,
		required: false
	},
	isRecurrent: {
		type: Boolean,
		required: false
	},
	frequency: {
		type: String,
		required: false
	},
	weekDays: [{ type: String }],
	monthDays: [{ type: Number }],
	description: {
		type: String,
		required: false
	},
	isActive: {
		type: Boolean,
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

module.exports = mongoose.model('recurrentTransaction', schema)
