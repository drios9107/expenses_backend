const moment = require('moment')
const dbFunctions = require("./mongooseDbFunctions")
const transactionsModel = require("../models/transaction")

exports.getCurrentMonthTransactions = async (currentMonth, currentYear, showAll) => {
    const currentMonthFirstDay = moment().set({ D: 1, M: currentMonth, y: currentYear, h: 0, m: 0, s: 0, milliseconds: 0 }).valueOf();
    const nextMonthFirstDay = moment(currentMonthFirstDay).add(1, 'month').valueOf();
    const search = {
        date: {
            $gte: currentMonthFirstDay,
            $lt: nextMonthFirstDay
        },
    }

    if (!showAll) {
        search['isExpense'] = true
        search['type'] = 'cup'
    }
    const currentMonthTransactions = await dbFunctions.find(transactionsModel, search, { amount: -1 });

    return currentMonthTransactions;
}
