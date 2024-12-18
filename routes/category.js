const express = require('express')
const categoryController = require('../controllers/category')
const router = express.Router()

router
    .route('/')
    .post(categoryController.create)
    .get(categoryController.getAll)

router
    .route('/:id')
    .get(categoryController.getDetails)
    .delete(categoryController.delete)
    .put(categoryController.update)



module.exports = router