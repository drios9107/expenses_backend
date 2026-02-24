const mongoose = require('mongoose')
// const moment = require('moment');
// const balanceModel = require('./balance');

const schema = new mongoose.Schema({
	category: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'category',
		required: true,
		messsage: 'required field'
	},
	subCategory: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'subCategory',
		required: false
	},
	date: {
		type: Number,
		required: true
	},
	amount: {
		type: Number,
		min: 0,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	isExpense: {
		type: Boolean,
		required: false
	},
	description: {
		type: String,
		required: false
	},
	isRecurrent: {
		type: Boolean,
		required: false
	},
	recurrentTransactionId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'recurrentTransaction',
		required: false
	},
	debtId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'debt',
		required: false
	},
	created_at: {
		type: Number,
		default: Date.now()
	},
	update_at: {
		type: Number,
		default: Date.now()
	}
})
// schema.post('save', async (data, next) => {
//     try {
//         if (data?.type === 'cup') {
//             const balance = (await balanceModel.find({}).exec())?.[0];
//             if (balance && !data?.isRecurrent) {
//                 const balanceResult = data?.isExpense ?
//                     balance?.amount - data?.amount :
//                     balance?.amount + data?.amount;

//                 const result = await balanceModel.updateOne({ _id: balance?._id }, { amount: balanceResult }).exec();
//             } else if (!balance)
//                 await balanceModel.create({ amount: data?.amount }).exec();
//         }
//         next()
//     } catch (error) {
//         console.log('***onInsert error', error)
//     }
// })
// schema.pre('deleteOne', async function (doc) {
//     try {
//         const id = this.getFilter()["_id"];
//         const transaction = await this.findOne({ _id: id }).clone();

//         if (transaction?.type === 'cup') {
//             const balance = (await balanceModel.find({}).exec())?.[0];

//             const balanceResult = transaction?.isExpense ?
//                 balance?.amount + transaction?.amount :
//                 balance?.amount - transaction?.amount;

//             const result = await balanceModel.updateOne({ _id: balance?._id }, { amount: balanceResult }).exec();
//         }
//     } catch (error) {
//         console.log('***onDelete error', error)
//     }
// })

module.exports = mongoose.model('transaction', schema)
