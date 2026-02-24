const express = require('express')
const categoryController = require('../controllers/category')
const router = express.Router()

router.route('/:id').get(categoryController.getDetails).delete(categoryController.delete).put(categoryController.update)

router.route('/').post(categoryController.create).get(categoryController.getAll)

module.exports = router
