const express = require('express')
const transactionController = require('../controllers/transaction')
const router = express.Router()

router
    .route('/')
    .post(transactionController.create)
    .get(transactionController.getAll)

router
    .route('/:id')
    .get(transactionController.getDetails)
    .delete(transactionController.delete)
    .put(transactionController.update)



module.exports = router