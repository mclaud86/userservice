class AMQEndpoint {
	constructor(connection, params) {
		this._connection = connection;
		this._channel = null;
		this._params = Object.assign({}, params);
	}

	async start() {
		if (!this._channel) {
			try {
				this._channel = await this._connection.createChannel();
			} catch (err) {
				console.error(err);
			}
		}
	}

	async disconnect() {
		if (this._channel) {
			await this._channel.close();
			this._channel = null;
		}
	}

	isConnected() {
		return this._channel != null;
	}
}

module.exports = AMQEndpoint;
