const express = require('express')
const functionsController = require('../controllers/functions')
const router = express.Router()

router.post('/', functionsController.getDashboard)

module.exports = router