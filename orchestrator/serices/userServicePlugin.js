const fp = require('fastify-plugin');
const UserService = require('./userService');

const decorateUserService = function (fastify, options, done) {
  const { mediator } = fastify;
  const userService = new UserService(mediator);
  fastify.decorate('userService', userService);
  done();
};

module.exports = fp(decorateUserService);
