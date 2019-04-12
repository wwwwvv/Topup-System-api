const express = require('express');
const router = express.Router();
const CustomerModel = require('../models/Customers');

function CustomerFormat(data) {
	return {
		gameId: data.gameId,
		fullname: data.fullname,
		email: data.email || '',
		bank_info: {
			bank_account_name: data.bank_account_name || '',
			bank_name: data.bank_name || '',
			bank_no: data.bank_id || '',
		},
	};
}

async function getCustomers(req, res) {
	const { limit, page, filter } = req.query;
	try {
		const size = limit ? parseInt(limit, 10) : 10;
		const pageNum = page ? parseInt(page, 10) : 1;
		let search = filter ? JSON.parse(filter) : {};

		const customers = await CustomerModel.getByFilter(search)
			.limit(size)
			.skip(size * (pageNum - 1))
			.toArray();

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
		bank_account_name,
		bank_name,
		bank_no,
	} = data;
	if (!gameId && !fullname) {
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
						bank_account_name,
						bank_name,
						bank_no,
					}),
				);
				res.json({
					data: {
						message: result.ok,
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

async function updateCustomerbyGameId(req, res) {
	const { data } = req.body;
	const { gameId, update } = data;
	if (!gameId) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await CustomerModel.updateData({ gameId }, update);
			res.json({
				data: {
					result: result.modifiedCount,
					status: result.modifiedCount > 0 ? true : false,
				},
			});
		} catch (error) {
			res.status(500).send('Internal Server Error');
		}
	}
}

async function deleteUserByGameId(req, res) {
	const { data } = req.body;
	const { gameId } = data;
	if (!gameId) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await CustomerModel.delete({ gameId });
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
router.put('/', updateCustomerbyGameId);
router.delete('/', deleteUserByGameId);

module.exports = router;
