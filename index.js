require('dotenv').config()
require('./utils/mongooseConnection')
const express = require('express')
const authRouter = require('./routes/auth')
const categoryRouter = require('./routes/category')
const subCategoryRouter = require('./routes/subCategory')
const transactionRouter = require('./routes/transaction')
const recurrentTransactionRouter = require('./routes/recurrentTransaction')
const dashboardRouter = require('./routes/dashboard')
const balanceRouter = require('./routes/balance')
const { verifyToken } = require('./utils/middlewares')
const app = express()
const cors = require('cors');
const cookieParser = require('cookie-parser');

// app.use(cors({ origin: true, credentials: true }));

const allowedOrigins = [
    'https://expenses91-opal.vercel.app',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(verifyToken);

// Block direct access to root URL
app.get('/', (req, res) => res.status(404).end());

app.use('/auth', authRouter)
app.use('/categories', categoryRouter)
app.use('/subCategories', subCategoryRouter)
app.use('/recurrent-transactions', recurrentTransactionRouter)
app.use('/transactions', transactionRouter)
app.use('/dashboard', dashboardRouter)
app.use('/balance', balanceRouter)


app.listen(3001)

module.exports = app; 
