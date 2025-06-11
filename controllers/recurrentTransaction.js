const dbFunctions = require("../utils/mongooseDbFunctions")
const model = require("../models/recurrentTransaction")
const moment = require('moment');
const { extendMoment } = require('moment-range');
const momentRange = extendMoment(moment);
const recurrentTransactionModel = require("../models/recurrentTransaction")
const transactionsModel = require("../models/transaction");
const { getAllBalance, populateCategoryAndSubCategory } = require("../utils/common");
const handleCategories = require("../utils/categoryHandlers");

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model, {}, {}, populateCategoryAndSubCategory)

        return res.json({
            status: 'success',
            data: items
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getDetails = async (req, res) => {
    try {
        const response = await dbFunctions.findOne(model, req?.params?.id, {}, populateCategoryAndSubCategory)
        if (response?.status === 'error') {
            return res.status(500).json(response)
        }

        return res.json({
            status: 'success',
            data: response
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.create = [handleCategories, async (req, res) => {
    try {
        const recurrentTransactionResponse = await dbFunctions.insertOne(model, req.body);
        if (recurrentTransactionResponse?.status === 'error') {
            return res.status(500).json(recurrentTransactionResponse)
        }

        return sendCreateUpdateSuccessResponse(res, model, response?._id);
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}]

exports.delete = async (req, res) => {
    try {
        const response = await dbFunctions.deleteOne(model, req?.params?.id)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return res.json({
            status: 'success',
            id: req?.params?.id
        })
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = [handleCategories, async (req, res) => {
    try {
        const response = await dbFunctions.updateOne(model, req?.params?.id, req?.body)

        if (response?.status === 'error')
            return res.status(500).json(response)

        return sendCreateUpdateSuccessResponse(res, model, response?._id);
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message })
    }
}]

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
    try {
        const recurrentTransactions = await dbFunctions.find(recurrentTransactionModel, { isActive: true });
        if (recurrentTransactions?.status === 'error') {
            return res.status(500).json(recurrentTransactions)
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

        const [balance, balanceMLC, balanceUSD, balanceUSDT] = await getAllBalance();

        return res.send({ status: 'success', balance, balanceMLC, balanceUSD, balanceUSDT })
    } catch (error) {
        console.error('runRecurrence error:', error);
        return res.status(500).json({ code: error?.code, message: error?.message });
    }
}