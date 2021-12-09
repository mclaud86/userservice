const assert = require('assert');

class AMQRequest {
	constructor(requestKey, args = []) {
		assert(requestKey, 'requestkey should be provided');
		assert(typeof requestKey === 'string', 'Expect requestkey to be string');
		this._requestType =
			this instanceof Query
				? AMQRequest.RequestType.QUERY
				: AMQRequest.RequestType.COMMAND;

		this.requestKey = requestKey;
		this.args = args;
	}

	packRequest() {
		return Buffer.from(
			JSON.stringify({
				requestType: this._requestType,
				requestKey: this.requestKey,
				args: this.args,
			})
		);
	}

	static get RequestType() {
		return {
			COMMAND: 'command',
			QUERY: 'query',
		};
	}
}

const deserilizeRequest = (buffer) => {
	const requestJson = buffer.toString('utf-8');
	const obj = JSON.parse(requestJson);

	assert(
		obj.requestKey,
		'Expect requestkey field to be present and not false in serialized command'
	);
	assert(
		typeof obj.requestKey === 'string',
		'Expect requestkey field to be string'
	);
	assert(
		obj.args,
		'Expect args field to be present and not false in serialized command'
	);
	assert(obj.args instanceof Array, 'Expect args field to be array');

	return obj.requestType === AMQRequest.RequestType.COMMAND
		? new Command(obj.requestKey, obj.args)
		: new Query(obj.requestKey, obj.args);
};

class Command extends AMQRequest {
	constructor(commandKey, args = []) {
		super(commandKey, args);
	}
}

class Query extends AMQRequest {
	constructor(queryKey, args = []) {
		super(queryKey, args);
	}
}
module.exports = { Command, Query, deserilizeRequest };
