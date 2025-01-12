const express = require('express')
const transactionController = require('../controllers/transaction')
const router = express.Router()

router.get('/currentMonth', transactionController.getCurrentMonth)

router
    .route('/:id')
    .get(transactionController.getDetails)
    .delete(transactionController.delete)
    .put(transactionController.update)

router
    .route('/')
    .post(transactionController.create)
    .get(transactionController.getAll)



module.exports = router