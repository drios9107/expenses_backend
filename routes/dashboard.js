const express = require('express')
const functionsController = require('../controllers/functions')
const router = express.Router()

router.post('/addCreatedAt', functionsController.addCreatedAt)
router.post('/', functionsController.getDashboard)


module.exports = router