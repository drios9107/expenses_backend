const mongoose = require('mongoose')
const moment = require('moment')

const schema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: String,
        required: false,
    },
    date: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        min: 0,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    isExpense: {
        type: Boolean,
        required: false,
    },
    isRecurrent: {
        type: Boolean,
        required: false,
    },
    frequency: {
        type: String,
        required: false,
    },
    weekDays: [{ type: String }],
    monthDays: [{ type: Number }],
    description: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        required: false,
    },
})

module.exports = mongoose.model('recurrentTransaction', schema)