const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	category: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'category',
		required: true,
		messsage: 'required field'
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

schema.pre('deleteOne', { document: false, query: true }, async function () {
	const docToDelete = await this.model.findOne(this.getFilter())
	if (docToDelete) {
		const transactionModel = mongoose.model('transaction')
		const recurrentTransaction = mongoose.model('recurrentTransaction')
		const defaultTransactionValue = mongoose.model('defaultTransactionValue')

		const [existingTransaction, existingRecurrentTransaction, existingDefaultTransactionValue] = await Promise.all([
			transactionModel.findOne({ subCategory: docToDelete._id }),
			recurrentTransaction.findOne({ subCategory: docToDelete._id }),
			defaultTransactionValue.findOne({ subCategory: docToDelete._id })
		])

		if (existingTransaction || existingRecurrentTransaction || existingDefaultTransactionValue)
			throw new Error(`unable-delete-in-use`)
	}
})

module.exports = mongoose.model('subCategory', schema)
