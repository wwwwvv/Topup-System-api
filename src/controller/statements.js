const express = require('express');
const router = express.Router();
const statementModel = require('../models/Statements');
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

async function getStatement(req, res) {
	const { id, page, limit, filter, orderby, options } = req.query;
	const pageNum = page || 1;
	const size = parseInt(limit, 10) || 10;
	let search = filter ? JSON.parse(filter) : {};
	const sort = orderby ? JSON.parse(orderby) : { created_at: -1 };
	console.log(' [GET] /api/v1/statements  ', JSON.stringify(req.query));
	if (!id) {
		res.status(400).send(' 400 Bad request');
	} else {
		try {
			search = { ...search, customer_id: ObjectId(id) };
			const statements = await statementModel
				.getByFilter(search, options)
				.limit(size)
				.skip(size * (pageNum - 1))
				.sort(sort)
				.toArray();
			const {
				total,
				promotion_total,
			} = await statementModel.getAllTotalBalance(id);
			res.json({
				data: {
					statements,
					total,
					promotion_total,
					count: statements.length,
				},
			});
		} catch (err) {
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
	}
}

router.post('/', addStatementbyCustomerId);
router.get('/', getStatement);

module.exports = router;
