const Cache = require('./Cache');
const path = require('path');
const amqplib = require('amqplib');
const { AMQConsumer } = require('commonamq');

require('dotenv').config({ path: path.join(__dirname, '..', 'env', '.env') });

const cache = new Cache(10000);

async function startCacheCommandServer() {
	const connection = await amqplib.connect(process.env.RABBIT_URL);
	const server = new AMQConsumer(connection, {
		consumptionQueue: process.env.CACHE_COMMAND_QUEUE,
	});
	server.addCommandHandler('setCache', (userId, user) => {
		console.log(`Set cache value for ${userId} - ${user}`);
		cache.set(userId, user);
	});
	try {
		await server.start();
		console.log('Starting Commad Server');
	} catch (err) {
		console.log(err);
	}
}

async function startCacheQueryServer() {
	const connection = await amqplib.connect(process.env.RABBIT_URL);
	const server = new AMQConsumer(connection, {
		consumptionQueue: process.env.CACHE_QUERY_QUEUE,
	});
	server.addQueryHandler('getCache', (userId) => {
		console.log(`Get cache value for ${userId}`);
		return cache.get(userId);
	});
	try {
		await server.start();
		console.log('Starting Query Server');
	} catch (err) {
		console.log(err);
	}
}

(async function start() {
	await startCacheCommandServer();
	await startCacheQueryServer();
})().catch((err) => console.error(`Error: ${err}`));
