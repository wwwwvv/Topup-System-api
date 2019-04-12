const Model = require('./Model');
class Customer extends Model {
	constructor() {
		super('customers');
	}

	async checkGameIdExists(gameId) {
		try {
			const filter = { gameId };
			const result = await this.getByFilter(filter).count();
			if (result > 0) {
				return false;
			} else {
				return true;
			}
		} catch (error) {
			throw error;
		}
	}
}

module.exports = new Customer();
