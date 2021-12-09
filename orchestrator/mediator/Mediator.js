/* eslint-disable no-underscore-dangle */
const { AMQClient } = require('commonamq');
const amqplib = require('amqplib');
const {
  MDTR_ERR_HANDLER_ALREADY_PRESENT,
  MDTR_ERR_RABBITMQ_URI_NOT_FOUND,
  MDTR_ERR_COMMAND_KEY_NOT_FOUND,
  MDTR_ERR_QUEUE_NOT_PROVIDED,
  MDTR_ERR_HANDLER_NAME_NOT_FOUND,
} = require('../errors/customErrors');

class Mediator {
  constructor(rabbitUri, logger) {
    if (!rabbitUri) {
      throw new MDTR_ERR_RABBITMQ_URI_NOT_FOUND();
    }
    this._logger = logger;
    this._handlers = new Map();
    this._amqClients = new Map();
    this._rabbitUri = rabbitUri;
  }

  addCommandHandler(handlerName, queueName) {
    if (this._handlers.has(handlerName)) {
      throw new MDTR_ERR_HANDLER_ALREADY_PRESENT(handlerName);
    }

    if (this._amqClients.has(queueName)) {
      throw new MDTR_ERR_QUEUE_NOT_PROVIDED(queueName);
    }

    this._handlers.set(handlerName, async (commandKey, args = []) => {
      const requestQueue = queueName;
      if (!commandKey) {
        throw new MDTR_ERR_COMMAND_KEY_NOT_FOUND();
      }
      let client = await this._createAmqClient(requestQueue);
      this._logger.debug('Strating MQ client');
      await client.start();
      this._logger.debug('MQ client started');
      try {
        await client.sendCommand(commandKey, args);
      } catch (err) {
        this._logger.error(err);
        throw err;
      } finally {
        if (client) {
          await client.disconnect();
          client = null;
        }
      }
    });
  }

  addQueryHandler(handlerName, queueName, replyQueueName) {
    if (this._handlers.has(handlerName)) {
      throw new MDTR_ERR_HANDLER_ALREADY_PRESENT(handlerName);
    }

    if (this._amqClients.has(queueName)) {
      throw new MDTR_ERR_QUEUE_NOT_PROVIDED(queueName);
    }

    this._handlers.set(
      handlerName,
      async (queryKey, args = [], callback = null) => {
        const requestQueue = queueName;
        const replyQueue = replyQueueName;
        if (!queryKey) {
          throw new MDTR_ERR_COMMAND_KEY_NOT_FOUND();
        }
        let client = await this._createAmqClient(requestQueue, replyQueue);
        this._logger.debug('Strating MQ client');
        await client.start();
        this._logger.debug('MQ client started');
        try {
          const result = await client.sendQery(queryKey, args);
          if (callback) {
            await callback(result, this);
          }
          return result;
        } catch (err) {
          this._logger.error(err);
          throw err;
        } finally {
          if (client) {
            await client.disconnect();
            client = null;
          }
        }
      },
    );
  }

  getHandler(handlerName) {
    if (!this._handlers.has(handlerName)) {
      throw new MDTR_ERR_HANDLER_NAME_NOT_FOUND(handlerName);
    }
    return this._handlers.get(handlerName);
  }

  async _createAmqClient(requestsQueue, repliesQueue) {
    /* if (this._amqClients.has(requestsQueue)) {
      return this._amqClients.get(requestsQueue);
    } */
    const connection = await this._getConnection();
    const client = new AMQClient(connection, { requestsQueue, repliesQueue });
    this._amqClients.set(requestsQueue, client);
    return client;
  }

  async _getConnection() {
    if (!this._connection) {
      this._connection = await amqplib.connect(this._rabbitUri);
    }
    return this._connection;
  }
}

module.exports = Mediator;
