exports.find = (model, search = {}, sort = {}) => {
    return model.find(search).sort(sort)
        .catch(error => {
            console.log('***Error2: ' + error)
            throw new Error(error)
        })
}

exports.findOne = (model, id, sort = {}) => model.findById(id).sort(sort)
    .catch(error => {
        console.log('***Error2: ' + error)
        throw new Error(error)
    })

exports.insertOne = (model, data) => model.create(data)
    .catch(error => {
        console.log('***Error2: ' + error)
        throw new Error(error)
    })

exports.deleteOne = (model, id) => model
    // .findByIdAndDelete(id)
    .deleteOne({ _id: id })
    .catch(error => {
        console.log('***Error2: ' + error)
        throw new Error(error)
    })

exports.updateOne = (model, id, { _id, ...data }) => model.findByIdAndUpdate(id, data)
    .catch(error => {
        console.log('***Error2: ' + error)
        throw new Error(error)
    })
