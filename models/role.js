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

schema.pre('deleteOne', { document: false, query: true }, async function () {
	const docToDelete = await this.model.findOne(this.getFilter())
	if (docToDelete) {
		const modelUser = mongoose.model('user')
		const existingUser = await modelUser.findOne({
			role: docToDelete._id
		})

		if (existingUser) throw new Error(`unable-delete-in-use`)
	}
})

module.exports = mongoose.model('role', schema)
