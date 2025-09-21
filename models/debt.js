const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    date: {
        type: Number,
        required: true
    },
    person: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'person',
        required: true
    },
    amount: {
        type: Number,
        min: 0,
        required: true
    },
    paid: {
        type: Number,
        min: 0,
        required: false
    },
    type: {
        type: String,
        required: true,
    },
    isMyDebt: {
        type: Boolean,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    transferId: {
        type: String,
        required: true,
        default: 'cash'
    },
    isCompleted: {
        type: Boolean,
        required: false,
        default: false
    },
    created_at: {
        type: Number,
        default: Date.now(),
    },
    update_at: {
        type: Number,
        default: Date.now(),
    }
})

module.exports = mongoose.model('debt', schema)