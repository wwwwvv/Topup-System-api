class Di {
	constructor() {
		this.di = {};
	}

	set(depName, dep) {
		this.di = {
			...this.id,
			[depName]: dep,
		};
	}

	get(depName) {
		return this.di[depName];
	}
}

module.exports = new Di();
