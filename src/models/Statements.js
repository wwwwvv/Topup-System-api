const Model = require('./Model');
const ObjectId = require('mongodb').ObjectId;

class Statements extends Model {
	constructor() {
		super('statements');
	}

	async getAllTotalBalance(customer_id) {
		try {
			const filter = { customer_id: ObjectId(customer_id) };
			const statements = await this.getByFilter(filter)
				.sort('created_at', 1)
				.toArray();
			let total = 0;
			let promotion_total = 0;

			statements.forEach(statement => {
				switch (statement.type) {
					case 'deposit':
						total += parseFloat(statement.value);
						break;
					case 'withdraw':
						total -= parseFloat(statement.value);
						break;

					case 'deposit_promo':
						promotion_total += parseFloat(statement.value);
						break;

					case 'withdraw_promo':
						promotion_total -= parseFloat(statement.value);
						break;
				}
			});
			return {
				total,
				promotion_total,
				statements,
			};
		} catch (err) {
			throw err;
		}
	}

	async updateStatement(customer_id, statementObj) {
		try {
			console.log('update statement');
			const { total, promotion_total } = await this.getAllTotalBalance(
				customer_id,
			);
			console.log(
				`Customer id ${customer_id} Total:${total} PromotionTotal:${promotion_total} `,
			);
			if (statementObj.type === 'withdraw') {
				console.log('Withdrawn operation');
				if (statementObj.value > total) {
					console.log('Cant add statement because balance not enough');
					return false;
				} else {
					console.log('Add statement');
					await this.create({
						customer_id: ObjectId(customer_id),
						...statementObj,
					});
					return true;
				}
			} else if (statementObj.type === 'withdraw_promotion') {
				console.log('withdraw_promotion operation');

				if (statementObj.value > promotion_total) {
					console.log('Cant add statement because balance not enough');
					return false;
				} else {
					console.log('Add statement');
					await this.create({
						customer_id: ObjectId(customer_id),
						...statementObj,
					});
					return true;
				}
			} else {
				console.log('Deposit operation');
				console.log('Add statement');
				await this.create({
					customer_id: ObjectId(customer_id),
					...statementObj,
				});
				return true;
			}
		} catch (err) {
			throw err;
		}
	}
}

module.exports = new Statements();
