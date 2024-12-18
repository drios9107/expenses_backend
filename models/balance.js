const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    }
})

module.exports = mongoose.model('balance', schema)