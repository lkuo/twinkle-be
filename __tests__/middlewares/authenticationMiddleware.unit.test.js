const { isAuthenticated } = require('@middlewares/authenticationMiddleware');

describe('authenticationMiddleware', () => {
  describe('isAuthenticated', () => {
    let ctx = null;
    let next = null;

    beforeEach(() => {
      ctx = { state: {} };
      next = jest.fn();
    });

    it('sets status to 401 if not authenticated', async () => {
      // Given
      // When
      await isAuthenticated(ctx, next);

      // Then
      expect((ctx.status = 401));
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if is authenticated', async () => {
      // Given
      ctx.state.user = {};

      // When
      await isAuthenticated(ctx, next);

      // Then
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
