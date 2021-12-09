const createErorr = require('fastify-error');

const codes = {
  MDTR_ERR_HANDLER_ALREADY_PRESENT: createErorr(
    'MDTR_ERR_HANDLER_ALREADY_PRESENT',
    'Handler already registered under Mediator',
  ),
  MDTR_ERR_QUEUE_NOT_PROVIDED: createErorr(
    'MDTR_ERR_QUEUE_NOT_PROVIDED',
    'Queue name not provided',
  ),
  MDTR_ERR_RABBITMQ_URI_NOT_FOUND: createErorr(
    'MDTR_ERR_RABBITMQ_URI_NOT_FOUND',
    'Rabbit Uri is not provied',
  ),
  MDTR_ERR_COMMAND_KEY_NOT_FOUND: createErorr(
    'MDTR_ERR_COMMAND_KEY_NOT_FOUND',
    'Command Key should be provided',
  ),
  MDTR_ERR_HANDLER_NAME_NOT_FOUND: createErorr(
    'MDTR_ERR_HANDLER_NAME_NOT_FOUND',
    'Handler Not Found',
  ),
  MDTR_NOT_FOUNS: createErorr('MDTR_NOT_FOUNS', 'Mediator Not Found'),
};

module.exports = codes;
