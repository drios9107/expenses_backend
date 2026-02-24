const express = require('express')
const emailController = require('../controllers/email')
const functionsController = require('../controllers/functions')
const router = express.Router()

router.post('/send-email', emailController.sendEmail)
router.post('/convert-currency', functionsController.convertCurrency)
router.get('/backup-db', functionsController.backupMongoDB)

module.exports = router
