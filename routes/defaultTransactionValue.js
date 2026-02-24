const express = require('express')
const controller = require('../controllers/defaultTransactionValue')
const router = express.Router()

router.get('/defaults', controller.getDefaultTransactionValuesByCategoryAndSubCategory)

router.route('/:id').get(controller.getDetails).delete(controller.delete).put(controller.update)

router.route('/').post(controller.create).get(controller.getAll)

module.exports = router
