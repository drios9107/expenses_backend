const express = require('express')
const subCategoryController = require('../controllers/subCategory')
const router = express.Router()

router
    .route('/')
    .post(subCategoryController.create)
    .get(subCategoryController.getAll)

router
    .route('/:id')
    .get(subCategoryController.getDetails)
    .delete(subCategoryController.delete)
    .put(subCategoryController.update)



module.exports = router