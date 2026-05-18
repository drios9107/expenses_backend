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

schema.pre('deleteOne', { document: false, query: true }, async function () {
	const docToDelete = await this.model.findOne(this.getFilter())
	if (docToDelete) {
		const debtModel = mongoose.model('debt')
		const userModel = mongoose.model('user')

		const [existingDebt, existingUser] = await Promise.all([
			debtModel.findOne({ person: docToDelete._id }),
			userModel.findOne({ person: docToDelete._id })
		])

		if (existingDebt || existingUser) throw new Error(`unable-delete-in-use`)
	}
})

module.exports = mongoose.model('person', schema)
