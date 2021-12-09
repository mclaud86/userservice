const AMQEndpoint = require('./AMQEndpoint');
const assert = require('assert');
const QueryResult = require('./QueryResult');
const { Query, deserilizeRequest } = require('./AMQRequest');

module.exports = class AMQConsumer extends AMQEndpoint {
	constructor(connection, params) {
		assert(params.consumptionQueue, 'Consumtion queue not set');
		super(connection, params);
		this._consumptionQueue = params.consumptionQueue;
		this._commands = {};
		this._queries = {};
	}

	addQueryHandler(key, handler) {
		this._queries[key] = handler;
		return this;
	}

	addCommandHandler(key, handler) {
		this._commands[key] = handler;
		return this;
	}

	async start() {
		await super.start();
		await this._channel.assertQueue(this._consumptionQueue, { durable: false });

		const consumeResult = await this._channel.consume(
			this._consumptionQueue,
			(msg) => this._handleMessage(msg)
		);
		this._consumerTag = consumeResult.consumerTag;
	}

	async disconnect() {
		await this._channel.cancel(this._consumerTag);
		await this._channel.deleteQueue(this._consumptionQueue);
		await super.disconnect();
	}

	static get ConsumerType() {
		return {
			COMMAND: 'command',
			QUERY: 'query',
		};
	}

	_handleMessage(msg) {
		this._channel.ack(msg);
		const request = deserilizeRequest(msg.content);
		if (request instanceof Query) {
			let queryResulBuffered;
			const replyQueue = msg.properties.replyTo;
			const correlationId = msg.properties.correlationId;
			this._proccessQuery(request).then((queryResult) => {
				this._channel.sendToQueue(replyQueue, queryResult, {
					correlationId,
				});
			});
		} else {
			this._processCommand(request).then(() => Promise.resolve());
		}
	}

	async _processCommand(command) {
		try {
			if (
				this._commands[command.requestKey] &&
				this._commands[command.requestKey] instanceof Function
			) {
				await this._commands[command.requestKey].apply(null, command.args);
			} else {
				console.log(command);
				throw new Error(`Unsupported command ${command.requestKey}`);
			}
		} catch (error) {
			console.error(error);
		}
	}
	async _proccessQuery(query) {
		try {
			if (
				this._queries[query.requestKey] &&
				this._queries[query.requestKey] instanceof Function
			) {
				const result = await this._queries[query.requestKey].apply(
					null,
					query.args
				);
				return new QueryResult(
					QueryResult.ResponseState.SUCCESS,
					result
				).packResponse();
			}
			console.log(query);
			throw new Error(`Unsupported query request  ${query.requestKey}`);
		} catch (error) {
			console.error(`Error during  query processing ${error}`);
			return new QueryResult(
				QueryResult.ResponseState.ERROR,
				error
			).packResponse();
		}
	}

	async disconnect() {
		await this._channel.cancel(this._consumerTag);

		if (this._params.requestsQueue === '') {
			await this._channel.deleteQueue(this._requestsQueue);
			this._requestsQueue = '';
		}

		await super.disconnect();
	}
};
