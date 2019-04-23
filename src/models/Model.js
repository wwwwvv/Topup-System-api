const di = require('../utils/di');
const ObjectID = require('mongodb').ObjectID;
const ObjectId = require('mongodb').ObjectId;

class Model {
	constructor(collectionName = '') {
		this.collection = collectionName;
	}
	getByFilter(filter = {}, options) {
		const db = di.get('mongodb');
		let filtered = filter;
		if (options === 'like') {
			const values = Object.values(filtered).map(value => {
				if (typeof value === 'string') {
					return RegExp(value);
				} else {
					return value;
				}
			});
			Object.keys(filtered).forEach((key, index) => {
				filtered[key] = values[index];
			});
		}
		let useFilter = {
			...filtered,
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
		const _id = new ObjectID();
		const insertData = {
			$set: { _id, ...data },
			$currentDate: {
				created_at: { $type: 'date' },
				updated_at: { $type: 'date' },
			},
		};
		return db
			.collection(this.collection)
			.updateOne({ _id }, insertData, { upsert: true });
	}

	updateData(filter, data) {
		const db = di.get('mongodb');
		delete data.updated_at;
		let useFilter = filter;
		if (useFilter._id) {
			useFilter = {
				...useFilter,
				_id: ObjectId(useFilter._id),
			};
		}
		const updateData = {
			$set: {
				...data,
				created_at: new Date(data.created_at),
			},
			$currentDate: {
				updated_at: { $type: 'date' },
			},
		};
		useFilter = {
			...useFilter,
			deleted_at: { $exists: false },
		};

		return db.collection(this.collection).updateOne(useFilter, updateData, {
			upsert: true,
		});
	}

	updateDataWithOutUpsert(filter, data) {
		const db = di.get('mongodb');
		delete data.updated_at;
		let useFilter = filter;
		if (useFilter._id) {
			useFilter = {
				...useFilter,
				_id: ObjectId(useFilter._id),
			};
		}
		const updateData = {
			$set: {
				...data,
				created_at: new Date(data.created_at),
			},
			$currentDate: {
				updated_at: { $type: 'date' },
			},
		};
		useFilter = {
			...useFilter,
			deleted_at: { $exists: false },
		};

		return db.collection(this.collection).updateOne(useFilter, updateData);
	}

	delete(filter) {
		let updateFilter = filter;
		if (updateFilter._id) {
			updateFilter._id = ObjectId(updateFilter._id);
		}
		const db = di.get('mongodb');
		const updateData = {
			$currentDate: {
				deleted_at: { $type: 'date' },
			},
		};
		return db.collection(this.collection).updateOne(updateFilter, updateData);
	}

	aggregate(pipline, option = {}) {
		const db = di.get('mongodb');

		return db.collection(this.collection).aggregate(pipline, option);
	}
}

module.exports = Model;
