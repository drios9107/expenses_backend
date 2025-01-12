const express = require('express')
const recurrentTransactionController = require('../controllers/recurrentTransaction')
const router = express.Router()

router.get('/runRecurrence', recurrentTransactionController.runRecurrence)

router
    .route('/:id')
    .get(recurrentTransactionController.getDetails)
    .delete(recurrentTransactionController.delete)
    .put(recurrentTransactionController.update)

router
    .route('/')
    .post(recurrentTransactionController.create)
    .get(recurrentTransactionController.getAll)


module.exports = router