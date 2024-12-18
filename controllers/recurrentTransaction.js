const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/recurrentTransaction")
const moment = require('moment');
const { extendMoment } = require('moment-range');
const momentRange = extendMoment(moment);
const recurrentTransactionModel = require("../models/recurrentTransaction")
const transactionsModel = require("../models/transaction");
const { exportedBalanceFunction } = require("./functions");

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model)

        res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const response = await dbFunctions.findOne(model, req?.params?.id)
        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }

        res.json({
            status: 'success',
            data: response
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.create = async (req, res) => {
    try {
        const { isRecurrent, frequency, weekDays, monthDays, ...transaction } = req.body; const recurrentTransactionResponse = await dbFunctions.insertOne(model, { isRecurrent, frequency, weekDays, monthDays, ...transaction });
        if (recurrentTransactionResponse?.status === 'error') {
            res.status(500)
            res.json(recurrentTransactionResponse)
        }

        res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, recurrentTransactionResponse._id)
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }

        res.json({
            status: 'success',
            id: req?.params?.id
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const response = await dbFunctions.updateOne(model, req?.params?.id, req?.body)

        if (response?.status === 'error') {
            res.status(500)
            res.json(response)
        }

        res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, req?.params?.id)
        })
    } catch (err) {
        res.status(500)
        res.json({ status: 'error', message: err.message })
    }
}

/**
 * 
 * @param {number} d Date in timestamp 
 * @param {*} i Recurrent transaction
 */
const handleTransaction = async (d, i) => {
    const date = moment(d).set({ h: 8, m: 0, s: 0, milliseconds: 0 }).valueOf();
    const exists = await transactionsModel.exists({ date, recurrentTransactionId: i?._id }).exec();
    if (!exists) {
        const { category, subCategory, amount, type, isExpense, description, isRecurrent, recurrentTransactionId } = i;
        transactionsModel.create({ category, subCategory, date, amount, type, isExpense, description, isRecurrent, recurrentTransactionId, recurrentTransactionId: i?._id });
        return true
    }
    return false
}

exports.runRecurrence = async (req, res) => {
    const recurrentTransactions = await dbFunctions.find(recurrentTransactionModel);
    if (recurrentTransactions?.status === 'error') {
        res.status(500)
        res.json(recurrentTransactions)
    }

    for (const i of recurrentTransactions) {
        const range = momentRange.range([moment(i?.date), moment()]);
        const days = Array.from(range.by('days'));

        if (i.frequency === 'daily') {
            for (const d of days) {
                await handleTransaction(d, i);
            }
        } else if (i.frequency === 'twoDays') {
            const filteredDays = days.filter((d, index) => index % 2 === 0)
            for (const d of filteredDays) {
                await handleTransaction(d, i);
            }
        } else if (i.frequency === 'daysWeek') {

        } else if (i.frequency === 'daysMonth') {
            const filteredDays = days?.filter(d => i?.monthDays?.includes(parseInt(d.format('DD'))))
            for (const d of filteredDays) {
                await handleTransaction(d, i);
            }
        }
    }

    const balance = await exportedBalanceFunction();
    res.send({ status: 'success', balance })
}