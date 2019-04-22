const express = require('express');
const router = express.Router();
const CustomerModel = require('../models/Customers');
const StatementModel = require('../models/Statements');

function CustomerFormat(data) {
	return {
		gameId: `${data.gameId}`,
		fullname: `${data.fullname}`,
		telno: `${data.telno}`,
		email: `${data.email}` || '',
		remark: `${data.remark}` || '',
		bank_info: {
			bank_account_name: `${data.bank_account_name}` || '',
			bank: `${data.bank}` || '',
			bank_account_id: `${data.bank_account_id}` || '',
		},
		referent: {
			type: `${data.referent.type}` || '',
			value: `${data.referent.value}` || '',
		}
	};
}

async function getCustomers(req, res) {
	const { limit, page, filter, options, orderby } = req.query;
	console.log('[GET] /api/v1/customer ', JSON.stringify(req.query));
	try {
		const size = limit ? parseInt(limit, 10) : 10;
		const pageNum = page ? parseInt(page, 10) : 1;
		const search = filter ? JSON.parse(filter) : {};
		const sort = orderby ? JSON.parse(orderby) : { created_at: -1 };
		const customersData = await CustomerModel.getByFilter(search, options)
			.limit(size)
			.skip(size * (pageNum - 1))
			.sort(sort)
			.toArray();
			
		const promises = customersData.map( async customer => {
			const { depositpromo_total, withdrawpromo_total, withdraw_total, deposit_total, total, promotion_total } =  await StatementModel.getAllTotalBalance(customer._id)
			return {
				...customer,
				deposit_total,
				depositpromo_total,
				withdrawpromo_total,
				withdraw_total,
				total,
				promotion_total
			}
		})

		const customers = await Promise.all(promises);

		res.json({
			data: {
				customers,
				count: customers.length,
			},
		});
	} catch (error) {
		console.error(error.stack);
		res.status(500).send('Internal server error');
	}
}

async function createCustomer(req, res) {
	const { data } = req.body;
	const {
		gameId,
		fullname,
		email,
		telno,
		bank_account_name,
		bank,
		bank_account_id,
		remark,
		referent
	} = data;
	console.log('[POST] /api/v1/customer ', JSON.stringify(req.body));

	if (!gameId && !fullname && !telno) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const isExist = await CustomerModel.checkGameIdExists(gameId);
			if (isExist) {
				const result = await CustomerModel.create(
					CustomerFormat({
						gameId,
						fullname,
						email,
						telno,
						bank_account_name,
						bank,
						bank_account_id,
						remark,
						referent
					}),
				);
				res.json({
					data: {
						message: result,
						result: true,
					},
				});
			} else {
				res.json({
					data: {
						message: 'gameId is exists',
						result: false,
					},
				});
			}
		} catch (error) {
			console.log(error);
			res.status(500).send('Internal server Error');
		}
	}
}

async function updateCustomerbyId(req, res) {
	const { data } = req.body;
	const { _id, update } = data;
	console.log('[PUT] /api/v1/customers ', JSON.stringify(req.body));
	if (!_id) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await CustomerModel.updateData({ _id }, update);
			res.json({
				data: {
					result: result.modifiedCount,
					status: result.modifiedCount > 0 ? true : false,
				},
			});
		} catch (error) {
			console.log(error);
			res.status(500).send('Internal Server Error');
		}
	}
}

async function deleteUserById(req, res) {
	const { id } = req.query;
	console.log('[DELETE] /api/v1/customers ', JSON.stringify(req.query));

	if (!id) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await CustomerModel.delete({ _id: id });
			res.json({
				data: {
					result: result.modifiedCount,
					status: result.modifiedCount > 0 ? true : false,
				},
			});
		} catch (err) {
			console.err(err);
			res.status(500).send('Internal server Error');
		}
	}
}

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/', updateCustomerbyId);
router.delete('/', deleteUserById);

module.exports = router;
