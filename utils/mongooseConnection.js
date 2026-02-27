const mongoose = require('mongoose')
const { callFirstRun } = require('../controllers/functions')
console.log('***starting connection')
mongoose
	.connect(process.env.MONGO_DB_URL, { dbName: 'expensesDB' })
	.then(async resp => {
		console.log('***connected through mongoose')
		await callFirstRun()
	})
	.catch(error => console.log('***error', error.message))
