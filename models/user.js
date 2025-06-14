const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'role',
        required: true,
        default: 'user',
        messsage: 'required field'
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

module.exports = mongoose.model('user', schema)