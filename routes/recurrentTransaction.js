const express = require('express')
const recurrentTransactionController = require('../controllers/recurrentTransaction')
const router = express.Router()

router.get('/runRecurrence', recurrentTransactionController.runRecurrence)

router
    .route('/')
    .post(recurrentTransactionController.create)
    .get(recurrentTransactionController.getAll)

router
    .route('/:id')
    .get(recurrentTransactionController.getDetails)
    .delete(recurrentTransactionController.delete)
    .put(recurrentTransactionController.update)


module.exports = router