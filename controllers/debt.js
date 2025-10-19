const dbFunctions = require("../utils/mongooseDbFunctions");
const model = require("../models/debt");
const transactionModel = require("../models/transaction");
const categoryModel = require("../models/category");
const subCategoryModel = require("../models/subCategory");
const { sendCreateUpdateSuccessResponse, populatePerson, getIlikeSearch, getProperDebtCategoryOrSubCategory, getProperDebtSubCategory, getProperDebtCategory, generateDebtTransactions, generateDebtCompletedTransaction } = require("../utils/common");
const mongoose = require("mongoose");

exports.getAll = async (req, res) => {
    try {
        const items = await dbFunctions.find(model, { sort: { name: 1 }, populate: populatePerson });

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
        const response = await dbFunctions.findOne(model, req?.params?.id, { populate: populatePerson })
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

exports.create = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const response = await dbFunctions.insertMany(model, [req?.body], { session });
        if (response?.status === 'error')
            return res.status(500).json(response)

        const [categories, subCategories] = await Promise.all([
            dbFunctions.find(categoryModel, { session, search: { $or: [{ name: getIlikeSearch('Ingresos') }, { name: getIlikeSearch('Otros') }] } }),
            dbFunctions.find(subCategoryModel, { session, search: { $or: [{ name: getIlikeSearch('Préstamos') }, { name: getIlikeSearch('Devolución de Préstamos') }] } }),
        ]);
        if (categories.length < 2 || subCategories.length < 2)
            return res.status(500).json({ message: 'missing-category-or-subCategory' })

        const data = generateDebtTransactions(req.body, categories, subCategories, response[0]._id?.toString());
        const transactionResponse = await dbFunctions.insertMany(transactionModel, data, { session })

        if (transactionResponse?.status === 'error')
            return res.status(500).json(transactionResponse)

        await session.commitTransaction();

        return res.json({
            status: 'success',
            data: await dbFunctions.findOne(model, response[0]._id, { populate: populatePerson })
        })
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ status: 'error', message: err.message })
    } finally {
        await session.endSession();
    }
}

exports.delete = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const debtId = req?.params?.id;
        const response = await dbFunctions.deleteOne(model, debtId, { session })
        if (response?.status === 'error')
            return res.status(500).json(response)

        const transactionsResponse = await dbFunctions.deleteMany(transactionModel, { debtId }, { session })
        if (transactionsResponse?.status === 'error')
            return res.status(500).json(transactionsResponse)

        await session.commitTransaction();

        return res.json({
            status: 'success',
            id: debtId
        })
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ status: 'error', message: err.message })
    } finally {
        await session.endSession();
    }
}

exports.update = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const debtId = req?.params?.id;
        const response = await dbFunctions.updateOne(model, debtId, req?.body)

        if (response?.status === 'error')
            return res.status(500).json(response)

        if (req?.body?.isCompleted) {
            const [categories, subCategories] = await Promise.all([
                dbFunctions.find(categoryModel, { session, search: { $or: [{ name: getIlikeSearch('Ingresos') }, { name: getIlikeSearch('Otros') }] } }),
                dbFunctions.find(subCategoryModel, { session, search: { $or: [{ name: getIlikeSearch('Préstamos') }, { name: getIlikeSearch('Devolución de Préstamos') }] } }),
            ]);

            const commonPayload = {
                amount: req?.body?.amount,
                type: req?.body?.type,
                description: req?.body?.description,
                date: req?.body?.date,
                isRecurrent: false,
                debtId
            };

            const data = [generateDebtCompletedTransaction(categories, req?.body?.isMyDebt, subCategories, commonPayload)];
            const transactionResponse = await dbFunctions.insertMany(transactionModel, data, { session })

            if (transactionResponse?.status === 'error')
                return res.status(500).json(transactionResponse)
        }

        await session.commitTransaction();

        return sendCreateUpdateSuccessResponse(res, model, response?._id, { populate: populatePerson });
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ status: 'error', message: err.message })
    } finally {
        await session.endSession();
    }
}