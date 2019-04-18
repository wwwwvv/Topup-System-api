const config = {
	dbName: 'toptest',
	port: 2019,
	SECRET: 'watdoumean',
	mongouri:
		process.env.mongouri|| 'mongodb+srv://dbza:waveza555@cluster0-dccrs.mongodb.net/test?retryWrites=true',
};

module.exports = config;
