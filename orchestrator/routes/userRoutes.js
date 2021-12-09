async function userRoutes(fastify) {
  fastify.get('/users', async (request, reply) => {
    const { country, city, page, limit } = request.query;
    try {
      const users = await fastify.userService.getUsersPagination(
        country,
        city,
        page,
        limit,
      );
      return reply.send(users);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).type('text/html').send('Server Error');
    }
  });

  fastify.get('/users/totals', async (request, reply) => {
    try {
      const totals = await fastify.userService.getUsersTotals();
      return reply.send(totals);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).type('text/html').send('Server Error');
    }
  });

  fastify.get('/users/:id', async (request, reply) => {
    const userId = request.params.id;
    try {
      const cacheResult = await fastify.userService.getCachedUserById(userId);
      if (cacheResult) {
        fastify.log.debug(`Extracted from cache ${cacheResult}`);
        return reply.send(cacheResult);
      }
      const result = await fastify.userService.getUserById(userId);
      return reply.send(result);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).type('text/html').send('Server Error');
    }
  });
}

module.exports = userRoutes;
