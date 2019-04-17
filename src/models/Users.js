const Model = require('./Model');
class Users extends Model {
	constructor() {
		super('users');
	}

	async checkUsernameExists(username) {
		try {
			const filter = { username };
			const count = await this.getByFilter(filter).count();
			if (count > 0) {
				return false;
			}
			return true;
		} catch (err) {
			throw err;
		}
	}
}

module.exports = new Users();
