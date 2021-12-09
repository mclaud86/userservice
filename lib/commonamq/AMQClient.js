const uuid = require('uuid');
const AMQEndpoint = require('./AMQEndpoint');
const AMQRequest = require('./AMQRequest');
const QueryResult = require('./QueryResult');

module.exports = class AMQClient extends AMQEndpoint {
	constructor(connection, params = {}) {
		if (!params.requestsQueue) {
			throw new Error('params.requestsQueue is required');
		}

		params.repliesQueue = params.repliesQueue || '';
		params.timeout = params.timeout || AMQClient.TIMEOUT;
		super(connection, params);

		this._queryRequestNumber = 0;
		this._requests = new Map();
		this._defaultMessageOptions = params.defaultMessageOptions || {};
	}

	async sendQery(requestKey, args, messageOptions = {}) {
		this._cmdNumber = 0;
		const query = new AMQRequest.Query(requestKey, args);
		const correlationId = uuid.v4() + String(this._cmdNumber++);
		const replyTo = this._repliesQueue;
		const timeout = this._params.timeout;
		const requestsQueue = this._params.requestsQueue;
		const commonProperties = { replyTo, correlationId };

		const properties = Object.assign(
			{},
			messageOptions,
			this._defaultMessageOptions,
			commonProperties
		);

		let resolve;
		let reject;
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});

		const timer = setTimeout(
			() => this._cancel(correlationId, `timeout (${timeout})`),
			timeout
		);
		this._requests.set(correlationId, {
			timer,
			resolve,
			reject,
			requestKey,
		});

		this._channel.sendToQueue(requestsQueue, query.packRequest(), properties);

		return promise;
	}

	async sendCommand(requestKey, args, messageOptions = {}) {
		const command = new AMQRequest.Command(requestKey, args);
		const requestsQueue = this._params.requestsQueue;

		const properties = Object.assign(
			{},
			messageOptions,
			this._defaultMessageOptions
		);

		this._channel.sendToQueue(requestsQueue, command.packRequest(), properties);
	}

	async start() {
		await super.start();

		const response = await this._channel.assertQueue(
			this._params.repliesQueue,
			{
				durable: false,
			}
		);
		if (this._params.repliesQueue === '') {
			this._repliesQueue = response.queue;
		} else {
			this._repliesQueue = this._params.repliesQueue;
		}

		const replyResponse = await this._channel.assertQueue(
			this._params.requestsQueue,
			{
				durable: false,
			}
		);

		const consumeResult = await this._channel.consume(
			this._repliesQueue,
			(msg) => this._dispatchReply(msg)
		);
		this._consumerTag = consumeResult.consumerTag;
	}

	async disconnect() {
		await this._channel.cancel(this._consumerTag);

		if (this._params.repliesQueue === '') {
			await this._channel.deleteQueue(this._repliesQueue);
			this._repliesQueue = '';
		}

		this._requests.forEach((context, correlationId) =>
			this._cancel(correlationId, 'client disconnect')
		);
		await super.disconnect();
	}

	async _dispatchReply(msg) {
		this._channel.ack(msg);
		if (!msg) {
			return;
		}

		const correlationId = msg.properties.correlationId;
		const context = this._requests.get(correlationId);
		this._requests.delete(correlationId);
		if (!context) {
			return;
		}

		const { resolve, timer, reject } = context;
		clearTimeout(timer);

		try {
			const response = QueryResult.unpackResponse(msg.content);

			if (response.state === QueryResult.ResponseState.ERROR) {
				reject(response.data);
			} else {
				resolve(response.data);
			}
		} catch (e) {
			reject(e);
		}
	}

	_cancel(correlationId, reason) {
		const context = this._requests.get(correlationId);
		const { timer, reject, requestKey } = context;
		clearTimeout(timer);
		this._requests.delete(correlationId);
		reject(
			new Error(
				`sendCommand canceled due to ${reason}, command:${requestKey}, correlationId:${correlationId}`
			)
		);
	}

	static get TIMEOUT() {
		return 60 * 1000;
	}
};
