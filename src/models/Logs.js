const Model = require('./Model');
class Logs extends Model {
	constructor() {
		super('logs');
	}

	async createLog(type = 'custom', activity) {
		try {
			switch (type) {
				case 'users': {
					const logUser = {
						username: activity.username,
						message: activity.message,
					};
					await this.create(logUser);
					break;
				}
				case 'statement': {
					const logStatement = {
						customer_id: activity.customer_id,
						type: activity.type,
						user_id: activity.user_id,
						message: activity.message,
					};
					await this.create(logStatement);
					break;
				}
				case 'customer': {
					const logCustomer = {
						user_id: activity.user_id,
						action: activity.action,
						customer_id: activity.customer_id,
						message: activity.message,
					};
					await this.create(logCustomer);
					break;
				}
				default: {
					const log = {
						message: activity.message,
					};
					await this.create(log);
				}
			}
		} catch (err) {
			throw err;
		}
	}
}

module.exports = new Logs();
