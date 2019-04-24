const config = {
	dev: {
		dbName: 'toptest',
		port: 2019,
		SECRET: 'watdoumean',
		mongouri:
			'mongodb+srv://dbza:waveza555@cluster0-dccrs.mongodb.net/test?retryWrites=true',
	},
	product: {
		dbName: 'topup',
		port: 2019,
		SECRET: 'watdoumean',
		mongouri: process.env.mongouri,
	},
};

const env = process.env.NODE_ENV || 'dev';
console.log('env: ', env);

module.exports = config[env];
