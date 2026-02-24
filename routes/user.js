const express = require('express')
const userController = require('../controllers/user')
const router = express.Router()

router.route('/:id').get(userController.getDetails).delete(userController.delete).put(userController.update)

router.route('/').post(userController.create).get(userController.getAll)

module.exports = router
