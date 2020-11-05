jest.mock('koa-jwt');

const koaJwt = require('koa-jwt');
require('@middlewares/authenticationMiddleware');

describe('authenticationMiddleware', () => {
  describe('jwt', () => {
    it('parses jwt token using koa-jwt', async () => {
      // Given
      const secret = process.env.ENCRYPTION_KEY;

      // When
      // do nothing because `getJwt` is called on module initialization
      /***
       * can't combine 2 tests together, the mock is reset after each test,
       * then koaJwt invocation was reset and cannot be tested
       */

      // Then
      expect(koaJwt).toHaveBeenCalledTimes(1);
      expect(koaJwt).toHaveBeenCalledWith({ secret, algorithms: ['HS256'] });
    });
  });
});
