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

	async countCustomerbyDate(month, year, mode) {
		try {
			let pipline = [];
			if (mode === 'month') {
				pipline = [
					{
						$match: {
							created_at: {
								$gte: new Date(`${month}/1/${year}`),
								$lt: new Date(`${month}/30/${year}`),
							},
						},
					},
					{
						$group: {
							_id: {
								day: {
									$dayOfMonth: '$created_at',
								},
							},
							create_customer_sum: {
								$sum: 1,
							},
						},
					},
					{
						$sort: {
							'_id.day': 1,
						},
					},
				];
			} else {
				pipline = [
					{
						$match: {
							created_at: {
								$gte: new Date(`1/1/${year}`),
								$lt: new Date(`12/31/${year}`),
							},
						},
					},
					{
						$group: {
							_id: {
								month: {
									$month: '$created_at',
								},
							},
							create_customer_sum: {
								$sum: 1,
							},
						},
					},
					{
						$sort: {
							'_id.month': 1,
						},
					},
				];
			}
			return await this.aggregate(pipline).toArray();
		} catch (err) {
			throw err;
		}
	}
}

module.exports = new Customer();
