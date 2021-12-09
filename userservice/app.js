const mongoose = require('mongoose');
const startUserQueryServer = require('./userQueryServer');

(async function start() {
	await mongoose.connect(process.env.MONGODB_URL);
	await startUserQueryServer();
})().catch((err) => console.error(`Error: ${err}`));
