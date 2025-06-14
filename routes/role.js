const express = require('express')
const roleController = require('../controllers/role')
const router = express.Router()

router
    .route('/:id')
    .get(roleController.getDetails)
    .delete(roleController.delete)
    .put(roleController.update)

router
    .route('/')
    .post(roleController.create)
    .get(roleController.getAll)


module.exports = router