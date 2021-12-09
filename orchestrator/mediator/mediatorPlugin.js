const fp = require('fastify-plugin');
const Mediator = require('./Mediator');

const mediatorPlugin = (fastify, options, next) => {
  const mediator = new Mediator(fastify.config.RABBIT_URL, fastify.log);
  mediator.addCommandHandler(
    'addUserToCache',
    fastify.config.CACHE_COMMAND_QUEUE,
  );
  mediator.addQueryHandler('userServiceQuery', fastify.config.USER_QUERY_QUEUE);

  mediator.addQueryHandler(
    'getUserFromCache',
    fastify.config.CACHE_QUERY_QUEUE,
    fastify.config.REPLY_CACHE_QUERY_QUEUE,
  );
  fastify.decorate('mediator', mediator);
  next();
};

module.exports = fp(mediatorPlugin);
