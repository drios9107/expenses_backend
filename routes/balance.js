const express = require('express')
const functionsController = require('../controllers/functions')
const router = express.Router()

router.get('/', functionsController.getBalance)

module.exports = router