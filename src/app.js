const express = require('express');
const bodyParser = require('body-parser');
const mongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const config = require('./config');
const di = require('./utils/di');
const app = express();

const customers = require('./controller/customers');
const statements = require('./controller/statements');
const { router: users, verifyToken } = require('./controller/users');

mongoClient
	.connect(config.mongouri, { useNewUrlParser: true })
	.then(client => {
		di.set('mongodb', client.db(config.dbName));
		app.use(bodyParser.json());
		app.use(
			cors({
				origin: '*',
			}),
		);
		app.get('/healthcheck', (req, res) => {
			res.send('ok');
		});
		app.use(verifyToken);
		app.use('/backend/api/v1/customers', customers);
		app.use('/backend/api/v1/statements', statements);
		app.use('/backend/api/v1/users', users);

		console.log(`Api start at ${config.port}`);
		app.listen(config.port);
	})
	.catch(err => {
		console.error('Error on Connect mongodb', err);
		process.exit(1);
	});
