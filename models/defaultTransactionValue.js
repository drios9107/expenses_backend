const mongoose = require('mongoose')
// const moment = require('moment');
// const balanceModel = require('./balance');

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
	amount: {
		type: Number,
		min: 0,
		required: true
	},
	description: {
		type: String,
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

module.exports = mongoose.model('defaultTransactionValue', schema)
