const functions = require('firebase-functions');
const axios = require('axios');
exports.healthcheckWeb = functions.pubsub
	.schedule('every 1 hours')
	.timeZone('Asia/Bangkok')
	.onRun(context => {
		axios
			.get('https://pp.10000lan.com')
			.then(response => {
				return console.log(response.status);
			})
			.catch(error => {
        axios.post('https://hooks.slack.com/services/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',{"text":"Error on web"}).then((data) => {
          return console.log(data)
        }).catch(error => {
          console.log(error)
        })
				return console.log(error);
			});
  });
  
  exports.healthcheckApi = functions.pubsub
	.schedule('every 1 hours')
	.timeZone('Asia/Bangkok')
	.onRun(context => {
		axios
			.get('https://pp.10000lan.com/backend/healthcheck')
			.then(response => {
				return console.log(response.status);
			})
			.catch(error => {
        axios.post('https://hooks.slack.com/services/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',{"text":"Error on Api"}).then((data) => {
          return console.log(data)
        }).catch(error => {
          console.log(error)
        })
				return console.log(error);
			});
	});
