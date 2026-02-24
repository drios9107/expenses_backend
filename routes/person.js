const express = require('express')
const controller = require('../controllers/person')
const router = express.Router()

router.route('/:id').get(controller.getDetails).delete(controller.delete).put(controller.update)

router.route('/').post(controller.create).get(controller.getAll)

module.exports = router
