const path = require('path');
const swagger = require('fastify-swagger');
const fastifyEnv = require('fastify-env');
const userRoutes = require('./routes/userRoutes');
const mediatorPlugin = require('./mediator/mediatorPlugin');
const userServicePlugin = require('./serices/userServicePlugin');

const swaggerOption = {
  swagger: {
    info: {
      title: 'Test swagger',
      description: 'testing the fastify swagger api',
      version: '0.1.0',
    },
    host: 'localhost',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
};

const configSchema = {
  type: 'object',
  required: [
    'MONGODB_URL',
    'RABBIT_URL',
    'USER_QUERY_QUEUE',
    'CACHE_COMMAND_QUEUE',
    'REPLY_USER_QUERY_QUEUE',
    'CACHE_QUERY_QUEUE',
    'REPLY_CACHE_QUERY_QUEUE',
  ],
  properties: {
    MONGODB_URL: { type: 'string' },
    RABBIT_URL: { type: 'string' },
    USER_QUERY_QUEUE: { type: 'string' },
    CACHE_COMMAND_QUEUE: { type: 'string' },
    REPLY_USER_QUERY_QUEUE: { type: 'string' },
    CACHE_QUERY_QUEUE: { type: 'string' },
    REPLY_CACHE_QUERY_QUEUE: { type: 'string' },
  },
  additionalProperties: false,
};

const envOptions = {
  schema: configSchema,
  dotenv: {
    path: path.join(__dirname, '..', 'env', '.env'),
    debug: true,
  },
};

module.exports = function (fastify, options, done) {
  fastify
    .register(swagger, swaggerOption)
    .register(fastifyEnv, envOptions)
    .register(mediatorPlugin)
    .register(userServicePlugin)
    .register(userRoutes);

  done();
};
