const assert = require('assert');

class QueryResult {
	constructor(state, data) {
		this.state = state;
		this.data = data;
	}

	packResponse() {
		return Buffer.from(
			JSON.stringify(
				{
					state: this.state,
					data: this.data,
				},
				(key, value) => {
					if (value instanceof Error) {
						return {
							message: value.message,
							name: value.name,
							stack: value.stack,
							code: value.code,
							fileName: value.fileName,
							lineNumber: value.lineNumber,
							columnNumber: value.columnNumber,
						};
					}
					return value;
				}
			)
		);
	}
	static unpackResponse(buffer) {
		const responseJson = buffer.toString();
		const obj = JSON.parse(responseJson);

		assert(
			obj.state === QueryResult.ResponseState.SUCCESS ||
				obj.state === QueryResult.ResponseState.ERROR,
			`Expected state ${QueryResult.ResponseState.SUCCESS} or ${QueryResult.ResponseState.ERROR} in response not found`
		);

		if (obj.state === QueryResult.ResponseState.ERROR) {
			const error = new Error(
				obj.data.message,
				obj.data.fileName,
				obj.data.lineNumber
			);
			error.stack = obj.data.stack;
			error.code = obj.data.code;
			error.columnNumber = obj.data.columnNumber;
			obj.data = error;
		}

		return new QueryResult(obj.state, obj.data);
	}

	static get ResponseState() {
		return {
			SUCCESS: 'success',
			ERROR: 'error',
		};
	}
}

module.exports = QueryResult;
