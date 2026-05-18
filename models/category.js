const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true
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
		const subcategoryModel = mongoose.model('subcategory')
		const transactionModel = mongoose.model('transaction')
		const recurrentTransaction = mongoose.model('recurrentTransaction')
		const defaultTransactionValue = mongoose.model('defaultTransactionValue')

		const [
			existingSubcategory,
			existingTransaction,
			existingRecurrentTransaction,
			existingDefaultTransactionValue
		] = await Promise.all([
			subcategoryModel.findOne({ category: docToDelete._id }),
			transactionModel.findOne({ category: docToDelete._id }),
			recurrentTransaction.findOne({ category: docToDelete._id }),
			defaultTransactionValue.findOne({ category: docToDelete._id })
		])

		if (
			existingSubcategory ||
			existingTransaction ||
			existingRecurrentTransaction ||
			existingDefaultTransactionValue
		)
			throw new Error(`unable-delete-in-use`)
	}
})

module.exports = mongoose.model('category', schema)
