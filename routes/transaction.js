const express = require('express')
const transactionController = require('../controllers/transaction')
const router = express.Router()

router.get('/currentMonth', transactionController.getCurrentMonth)
router.post('/search', transactionController.search)
router.post('/simple-search', transactionController.simpleSearch)
router.post('/aggregation-search', transactionController.aggregationSearch)
router.post('/create-many', transactionController.createMany)

router
    .route('/:id')
    .get(transactionController.getDetails)
    .delete(transactionController.delete)
    .put(transactionController.update)

router
    .route('/')
    .post(transactionController.create)
    .get(transactionController.getAll)

router.get('/by-category-in-period/:categoryName/:currentMonth/:currentYear', transactionController.getTransactionsByCategory)
router.get('/by-category-and-subcategory-in-period/:categoryName/:subCategoryName/:currentMonth/:currentYear', transactionController.getTransactionsByCategoryAndSubCategory)


module.exports = router