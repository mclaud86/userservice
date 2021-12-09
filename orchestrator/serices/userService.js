const { MDTR_NOT_FOUNS } = require('../errors/customErrors');

module.exports = class UserService {
  constructor(mediator) {
    if (!mediator) {
      throw MDTR_NOT_FOUNS;
    }
    this.mediator = mediator;
  }

  async getCachedUserById(userId) {
    const handler = this.mediator.getHandler('getUserFromCache');
    const result = await handler('getCache', [userId]);
    return result;
  }

  async getUserById(userId) {
    const handler = this.mediator.getHandler('userServiceQuery');
    const result = await handler(
      'getUserById',
      [userId],
      async (user, mediator) => {
        const setCacheHandler = mediator.getHandler('addUserToCache');
        // eslint-disable-next-line no-underscore-dangle
        await setCacheHandler('setCache', [user._id, user]);
      },
    );
    return result;
  }

  async getUsersPagination(country, city, page, limit) {
    const handler = this.mediator.getHandler('userServiceQuery');
    const result = await handler('getUsersPagination', [
      country,
      city,
      page,
      limit,
    ]);
    return result;
  }

  async getUsersTotals() {
    const handler = this.mediator.getHandler('userServiceQuery');
    const result = await handler('getUsersGroupBy', []);
    return result;
  }
};
