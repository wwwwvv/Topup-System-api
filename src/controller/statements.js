const express = require('express');
const router = express.Router();
const statementModel = require('../models/Statements');
const customerModel = require('../models/Customers');
const logModel = require('../models/Logs');
const ObjectId = require('mongodb').ObjectId;

async function addStatementbyCustomerId(req, res) {
	const { data } = req.body;
	const { customer_id, type, value, staffId, description } = data;
	if (!customer_id || !type || !value || !staffId) {
		res.status(400).send(' 400 Bad request');
	} else {
		console.log('[POST] /api/v1/statements ', JSON.stringify(data));
		try {
			const statementObj = { type, value, staffId, description };
			const status = await statementModel.updateStatement(
				customer_id,
				statementObj,
			);
			const {
				total,
				promotion_total,
			} = await statementModel.getAllTotalBalance(customer_id);
			await logModel.createLog('statement', {
				customer_id,
				type,
				user_id: staffId,
				message: `User ${staffId} do ${type} with ${customer_id} value ${value} remark: ${description} `,
			});
			res.json({
				data: {
					status,
					total,
					promotion_total,
				},
			});
		} catch (error) {
			console.log(error);
			res.status(500).send('Internal Server Error');
		}
	}
}

async function cancelStatementById(req, res) {
	const { data } = req.body;
	console.log('[PUT] api/v1/statements/delete ', data);

	const { staffId, statement_id, remark } = data;

	if (!statement_id || !staffId || !remark) {
		res.status(400).send(' 400 Bad request');
	} else {
		const result = await statementModel.cancelStatement(staffId, statement_id);
		await logModel.createLog('statement', {
			customer_id: '',
			type: 'cancel',
			user_id: staffId,
			message: `User ${staffId} do cancel statement ${statement_id}  remark: ${remark} `,
		});
		if (result) {
			res.json({
				data: {
					status: true,
				},
			});
		} else {
			res.json({
				data: {
					message: 'Cant cancel statement',
					status: false,
				},
			});
		}
	}
}

async function approveStatement(req, res) {
	const { data } = req.body;
	const { staffId, statement_id, remark } = data;
	console.log('[PUT] api/v1/statements ', data);
	if (!statement_id || !staffId || !remark) {
		res.status(400).send(' 400 Bad request');
	} else {
		try {
			const result = await statementModel.approveStatement(
				staffId,
				statement_id,
			);

			await logModel.createLog('statement', {
				customer_id: '',
				type: 'approve',
				user_id: staffId,
				message: `User ${staffId} aprrove statement ${statement_id}  remark: ${remark} `,
			});

			if (result) {
				res.json({
					data: {
						status: true,
					},
				});
			} else {
				res.json({
					data: {
						message: 'Cant cancel statement',
						status: false,
					},
				});
			}
		} catch (err) {
			console.log(err.stack);
			res.status(500).end();
		}
	}
}

async function getStatement(req, res) {
	const { id, page, limit, filter, orderby, options } = req.query;
	const pageNum = page || 1;
	const size = parseInt(limit, 10) || 10;
	let search = filter ? JSON.parse(filter) : {};
	const sort = orderby ? JSON.parse(orderby) : { created_at: -1 };
	console.log(' [GET] /api/v1/statements  ', JSON.stringify(req.query));
	try {
		let result = {};

		if (id) {
			console.log('GET STATEMENT from Customer Object ID ', id);
			search = { ...search, customer_id: ObjectId(id) };
			const {
				total,
				promotion_total,
			} = await statementModel.getAllTotalBalance(id);
			result = {
				data: {
					total,
					promotion_total,
				},
			};
		} else {
			console.log('GET STATEMENT LIST');
			search = { ...search };
		}

		const rawStatements = await statementModel
			.getByFilter(search, options)
			.limit(size)
			.skip(size * (pageNum - 1))
			.sort(sort)
			.toArray();
		const promises = rawStatements.map(async statement => {
			const [CustomerData] = await customerModel
				.getByFilter({ _id: statement.customer_id })
				.toArray();

			return {
				...statement,
				CustomerData,
			};
		});

		const statements = await Promise.all(promises);

		result = {
			data: {
				...result.data,
				statements,
				count: statements.length,
			},
		};

		res.json(result);
	} catch (err) {
		console.log(err);
		res.status(500).send('Internal Server Error');
	}
	// }
}

async function getReportStatement(req, res) {
	const { month, year, mode, type } = req.query;
	console.log(' [GET] /api/v1/statements/report  ', JSON.stringify(req.query));
	try {
		let result = {};
		let report = [];
		if (type === 'balance') {
			report = await statementModel.getReportStatementBalance(
				month,
				year,
				mode,
			);
			const {
				total,
				promotion_total,
			} = await statementModel.getAllTotalBalance();
			result = {
				data: {
					report,
					total,
					promotion_total,
				},
			};
		} else {
			report = await statementModel.getReportStatement(month, year, mode);
			result = {
				data: {
					report,
				},
			};
		}
		res.json(result);
	} catch (err) {
		console.log(err);
		res.status(500).end();
	}
}

router.put('/', approveStatement);
router.put('/delete', cancelStatementById);
router.post('/', addStatementbyCustomerId);
router.get('/', getStatement);
router.get('/report', getReportStatement);

module.exports = router;
