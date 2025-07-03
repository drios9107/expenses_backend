const express = require('express')
const emailController = require('../controllers/email')
const functionsController = require('../controllers/functions')
const router = express.Router()

router.post('/send-email', emailController.sendEmail)
router.post('/convert-currency', functionsController.convertCurrency)

module.exports = router