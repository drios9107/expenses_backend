const moment = require('moment');

exports.count = (model, search = {}) => {
    return model.countDocuments(search)
        .catch(error => {
            throw new Error(error)
        })
}

exports.search = (model, search = {}, sort = {}, limit = 10, page = 0) => {
    return model.find(search).sort(sort).limit(limit).skip(page * limit)
        .catch(error => {
            throw new Error(error)
        })
}

exports.find = (model, search = {}, sort = {}) => {
    return model.find(search).sort(sort)
        .catch(error => {
            throw new Error(error)
            // throw { ...(new Error("message")), code: 'default' }
        })
}

exports.findOne = (model, id, sort = {}) => model.findById(id).sort(sort)
    .catch(error => {
        throw new Error(error)
    })

exports.insertOne = (model, data) => model.create({ ...data, created_at: moment().valueOf() })
    .catch(error => {
        throw new Error(error)
    })

exports.insertMany = (model, data) => model.insertMany(data)
    .catch(error => {
        throw new Error(error)
    })

exports.deleteOne = (model, id) => model
    // .findByIdAndDelete(id)
    .deleteOne({ _id: id })
    .catch(error => {
        throw new Error(error)
    })

exports.updateOne = (model, id, { _id = null, ...data }) => model.findByIdAndUpdate(id, { ...data, updated_at: moment().valueOf() }, { new: true })
    .catch(error => {
        throw new Error(error)
    })

exports.updateMany = (model, search = {}, { _id, ...data }) => model.updateMany(search, { $set: { ...data, updated_at: moment().valueOf() } })
    .catch(error => {
        throw new Error(error)
    })
