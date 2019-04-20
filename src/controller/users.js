const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/Users');
const logsModel = require('../models/Logs');
const saltround = 8;
const secret = 'whoisyourdaddy';

async function createUser(req, res) {
	const { username, password, fullname, role } = req.body.data;
	console.log('[POST] api/v1/users/register ', JSON.stringify(req.body.data));
	if (!username) {
		res.status(400).send('400 bad request');
	} else {
		if (await userModel.checkUsernameExists(username)) {
			try {
				const addData = {
					username,
					password: await bcrypt.hash(password, saltround),
					fullname,
					role,
				};
				const result = await userModel.create(addData);
				res.json({
					data: {
						result,
						status: true,
					},
				});
			} catch (err) {
				console.log(err);
				res.status(500).send('Internal server Error');
			}
		} else {
			res.json({
				data: {
					message: 'Username already used',
					status: false,
				},
			});
		}
	}
}

async function login(req, res) {
	try {
		const { username, password } = req.body.data;
		if (await userModel.checkUsernameExists(username)) {
			res.json({
				data: {
					message: 'Username is not in database',
					status: false,
				},
			});
		} else {
			const filter = { username };
			const [userInfo] = await userModel
				.getByFilter(filter)
				.limit(1)
				.toArray();
			if (await bcrypt.compare(password, userInfo.password)) {
				const token = jwt.sign(
					{
						username: userInfo.username,
						role: userInfo.role,
					},
					secret,
				);

				await logsModel.createLog('users', {
					username: userInfo.username,
					message: 'Login',
				});
				res.json({
					data: {
						token,
						role: userInfo.role,
						status: true,
						staffid: userInfo._id,
						username: userInfo.username,
					},
				});
			} else {
				res.json({
					data: {
						message: 'password incorrect',
						status: false,
					},
				});
			}
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server error');
	}
}

async function verifyToken(req, res, next) {
	if (req.path.includes('login')) {
		next();
	} else {
		try {
			const token = req.headers.authorization.split(' ');
			const { role } = await jwt.verify(token[1], secret);
			if (role === 99) {
				next();
			} else {
				if (req.path === '/api/v1/statements' && req.method === 'PUT') {
					res.status(403).end();
				} else if (
					req.path === '/api/v1/statements' &&
					req.method === 'DELETE'
				) {
					res.status(403).end();
				} else {
					next();
				}
			}
		} catch (error) {
			console.log(error);
			res.status(400).send('Token incorrect');
		}
	}
}

async function getUsers(req, res) {
	const { limit, page, filter, options, orderby } = req.query;
	console.log('[GET] /api/v1/users ', JSON.stringify(req.query));
	try {
		const size = limit ? parseInt(limit, 10) : 10;
		const pageNum = page ? parseInt(page, 10) : 1;
		const search = filter ? JSON.parse(filter) : {};
		const sort = orderby ? JSON.parse(orderby) : { created_at: -1 };
		const users = await userModel
			.getByFilter(search, options)
			.limit(size)
			.skip(size * (pageNum - 1))
			.sort(sort)
			.toArray();
		res.json({
			data: {
				users,
				count: users.length,
			},
		});
	} catch (error) {
		console.error(error.stack);
		res.status(500).send('Internal server error');
	}
}

async function updateUser(req, res) {
	const { data } = req.body;
	const { _id, update } = data;
	console.log('[PUT] /api/v1/users ', JSON.stringify(data));
	let updateUserData = update;
	delete updateUserData._id;
	if (updateUserData.password) {
		updateUserData.password = await bcrypt.hash(
			updateUserData.password,
			saltround,
		);
	}
	if (!_id) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await userModel.updateDataWithOutUpsert(
				{ _id },
				updateUserData,
			);
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
	console.log('[DELETE] /api/v1/users ', JSON.stringify(req.query));

	if (!id) {
		res.status(400).send('400 bad request');
	} else {
		try {
			const result = await userModel.delete({ _id: id });
			res.json({
				data: {
					result: result.modifiedCount,
					status: result.modifiedCount > 0 ? true : false,
				},
			});
		} catch (err) {
			console.error(err);
			res.status(500).send('Internal server Error');
		}
	}
}

router.get('/', getUsers);
router.post('/login', login);
router.post('/register', createUser);
router.put('/', updateUser);
router.delete('/', deleteUserById);

module.exports = {
	router,
	verifyToken,
};
