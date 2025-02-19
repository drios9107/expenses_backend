const mongoose = require('mongoose');
const { checkCategoriesExists, checkSubCategoriesExists } = require('../controllers/functions');
// Replace the placeholder with your Atlas connection string
console.log('***starting connection')
const url = "mongodb://127.0.0.1:27017/?directConnection=true";
mongoose.connect(url, { dbName: 'expensesDB' })
    .then(resp => {
        console.log('***connected through mongoose')
        //call first check and creations
        checkCategoriesExists()
        //call subcategories too
        checkSubCategoriesExists()
    })
    .catch(error => console.log('***error', error))

