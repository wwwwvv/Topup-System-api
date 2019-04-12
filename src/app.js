const express = require('express');
const bodyParser = require('body-parser');
const mongoClient = require('mongodb').MongoClient;
const config = require('./config');
const di = require('./utils/di');
const app = express();

const customers = require('./controller/customers');

mongoClient
	.connect(config.mongouri, { useNewUrlParser: true })
	.then(client => {
		di.set('mongodb', client.db(config.dbName));
		app.use(bodyParser.json());

		app.use((req, res, next) => {
			if (req.body.data || req.query) {
				next();
			} else {
				res.status(400).send('bad request');
			}
		});

		app.get('/healthcheck', (req, res) => {
			res.send('ok');
		});

		app.use('/api/v1/customers', customers);

		console.log(`Api start at ${config.port}`);
		app.listen(config.port);
	})
	.catch(err => {
		console.error('Error on Connect mongodb', err);
		process.exit(1);
	});
