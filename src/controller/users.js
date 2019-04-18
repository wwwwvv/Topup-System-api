const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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
			const { username, role } = await jwt.verify(token[1], secret);
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

router.post('/login', login);
router.post('/register', createUser);

module.exports = {
	router,
	verifyToken,
};
