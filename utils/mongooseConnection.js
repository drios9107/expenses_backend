const mongoose = require('mongoose');
const { callFirstRun } = require('../controllers/functions');
// Replace the placeholder with your Atlas connection string
console.log('***starting connection')
const url = "mongodb://127.0.0.1:27017/?directConnection=true";
mongoose.connect(url, { dbName: 'expensesDB' })
    .then(resp => {
        console.log('***connected through mongoose')
        callFirstRun()
    })
    .catch(error => console.log('***error', error))

