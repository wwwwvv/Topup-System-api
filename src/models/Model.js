const di = require('../utils/di');
const ObjectId = require('mongodb').ObjectId;

class Model {
	constructor(collectionName = '') {
		this.collection = collectionName;
	}
	getByFilter(filter = {}) {
		const db = di.get('mongodb');
		let useFilter = {
			...filter,
			deleted_at: { $exists: false },
		};

		if (useFilter._id) {
			useFilter = {
				...useFilter,
				_id: ObjectId(useFilter._id),
			};
		}
		return db.collection(this.collection).find(useFilter);
	}

	create(data) {
		const db = di.get('mongodb');
		const insertData = {
			...data,
			created_at: new Date(),
			updated_at: new Date(),
		};
		return db.collection(this.collection).insertOne(insertData);
	}

	updateData(filter, data) {
		const db = di.get('mongodb');
		const updateData = {
			$set: {
				...data,
			},
			$currentDate: {
				updated_at: { $type: 'timestamp' },
			},
		};
		const filterUpdate = {
			...filter,
			deleted_at: { $exists: false },
		};

		return db.collection(this.collection).updateOne(filterUpdate, updateData, {
			upsert: true,
		});
	}

	delete(filter) {
		const db = di.get('mongodb');
		const updateData = {
			$currentDate: {
				deleted_at: { $type: 'timestamp' },
			},
		};
		return db.collection(this.collection).updateOne(filter, updateData);
	}
}

module.exports = Model;
