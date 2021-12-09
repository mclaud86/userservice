module.exports = class Cache {
	constructor(timeout) {
		this._timeout = timeout || 60000;
		this._memoryStorage = new Map();
	}

	set(key, value) {
		if (!value) {
			throw new Error('value should not be empty');
		}
		const timer = setTimeout(() => this._clearCache(key), this._timeout);
		this._memoryStorage.set(key, { timer, value });
	}
	get(key) {
		if (!this._memoryStorage.has(key)) {
			return null;
		}
		const { timer, value } = this._memoryStorage.get(key);
		clearTimeout(timer);
		this.set(key, value);
		return value;
	}

	_clearCache(key) {
		const cacheItem = this._memoryStorage.get(key);
		const { timer } = cacheItem;
		clearTimeout(timer);
		this._memoryStorage.delete(key);
	}
};
