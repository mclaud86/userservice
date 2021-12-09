const amqplib = require('amqplib');
const userService = require('./services/userService');
const { AMQConsumer } = require('commonamq');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env', '.env') });

async function startUserQueryServer() {
	const connection = await amqplib.connect(process.env.RABBIT_URL);
	const server = new AMQConsumer(connection, {
		consumptionQueue: process.env.USER_QUERY_QUEUE,
	});
	server.addQueryHandler('getUserById', async (userId) => {
		try {
			const user = await userService.getUserById(userId);
			return user;
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
	server.addQueryHandler(
		'getUsersPagination',
		async (country, city, page, limit) => {
			try {
				const users = await userService.getUsersPagination(
					country,
					city,
					page,
					limit
				);
				return users;
			} catch (err) {
				console.error(err);
				throw err;
			}
		}
	);
	server.addQueryHandler('getUsersGroupBy', async () => {
		try {
			const users = await userService.getUsersGroupBy();
			return users;
		} catch (err) {
			console.error(err);
			throw err;
		}
	});
	try {
		await server.start();
		console.log('Starting server');
	} catch (err) {
		console.log(err);
	}
}

module.exports = startUserQueryServer;
