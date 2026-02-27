const mongoose = require('mongoose')
console.log('***starting connection')
mongoose
	.connect(process.env.MONGO_DB_URL, { dbName: 'expensesDB' })
	.then(async resp => {
		console.log('***connected through mongoose')
	})
	.catch(error => console.log('***error', error.message))
