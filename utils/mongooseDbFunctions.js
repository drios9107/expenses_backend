const moment = require('moment')

exports.count = (model, search = {}) => {
	return model.countDocuments(search).catch(error => {
		throw new Error(error)
	})
}

exports.search = (model, { search = {}, restrictSearch = {}, sort = {}, limit = 10, populate = [] }) => {
	return model
		.find(search, restrictSearch)
		.sort(sort)
		.limit(limit)
		.populate(populate)
		.catch(error => {
			throw new Error(error)
		})
}

exports.searchWithSkip = (
	model,
	{ search = {}, restrictSearch = {}, sort = {}, limit = 10, page = 0, populate = [] }
) => {
	return model
		.find(search, restrictSearch)
		.sort(sort)
		.limit(limit)
		.skip(page * limit)
		.populate(populate)
		.catch(error => {
			throw new Error(error)
		})
}

exports.find = (model, { search = {}, restrictSearch = {}, sort = {}, populate = [], session = null } = {}) => {
	return model
		.find(search, restrictSearch)
		.sort(sort)
		.populate(populate)
		.session(session)
		.catch(error => {
			throw new Error(error)
		})
}

exports.findOne = (model, id, { restrictSearch = {}, sort = {}, populate = [], session = null } = {}) =>
	model
		.findById(id, restrictSearch)
		.sort(sort)
		.populate(populate)
		.session(session)
		.lean()
		.catch(error => {
			throw new Error(error)
		})

exports.insertOne = (model, data, { populate = [], session = null } = {}) =>
	model
		.create({ ...data, created_at: moment().valueOf() })
		.then(res => res.populate(populate))
		.catch(error => {
			throw new Error(error)
		})

exports.insertMany = (model, data, { session = null } = {}) =>
	model.insertMany(data, { session }).catch(error => {
		throw new Error(error)
	})

exports.deleteOne = (model, id, { session = null } = {}) =>
	model
		// .findByIdAndDelete(id)
		.deleteOne({ _id: id })
		.session(session)
		.catch(error => {
			throw new Error(error)
		})

exports.deleteMany = (model, search = {}, { session = null } = {}) =>
	model
		.deleteMany(search)
		.session(session)
		.catch(error => {
			throw new Error(error)
		})

exports.updateOne = (model, id, { _id = null, ...data }) =>
	model.findByIdAndUpdate(id, { ...data, updated_at: moment().valueOf() }, { new: true }).catch(error => {
		throw new Error(error)
	})

exports.updateMany = (model, search = {}, { _id, ...data }) =>
	model.updateMany(search, { $set: { ...data, updated_at: moment().valueOf() } }).catch(error => {
		throw new Error(error)
	})

exports.softDelete = (model, id) =>
	model
		.findByIdAndUpdate(
			id,
			{
				isActive: false,
				update_at: moment().valueOf()
			},
			{ new: true }
		)
		.catch(error => {
			throw new Error(error)
		})

exports.reactivate = (model, id) =>
	model
		.findByIdAndUpdate(
			id,
			{
				isActive: true,
				update_at: moment().valueOf()
			},
			{ new: true }
		)
		.catch(error => {
			throw new Error(error)
		})
