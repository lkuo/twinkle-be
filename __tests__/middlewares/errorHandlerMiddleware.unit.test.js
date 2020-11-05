const { errorHandler } = require('@middlewares/errorHandlerMiddleware');

describe('errorHandlerMiddleware', () => {
  describe('errorHandler', () => {
    let ctx = null;
    let next = null;

    beforeEach(() => {
      ctx = {};
      next = jest.fn();
    });

    it('does nothing if next does not throw an error', async () => {
      // Given
      // When
      await errorHandler(ctx, next);

      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.status).not.toBeDefined();
      expect(ctx.body).not.toBeDefined();
    });

    it('gets statusCode and message and assign to ctx', async () => {
      // Given
      const message = 'error message';
      const statusCode = 400;
      const error = new Error(message);
      error.statusCode = statusCode;
      next.mockRejectedValueOnce(error);

      // When
      await errorHandler(ctx, next);

      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.status).toEqual(statusCode);
      expect(ctx.body).toEqual(message);
    });

    it('hides error message when cathing an internal error', async () => {
      // Given
      const message = 'details we do not want to expose';
      const error = new Error(message);
      next.mockRejectedValueOnce(error);

      // When
      await errorHandler(ctx, next);

      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.status).toEqual(500);
      expect(ctx.body).toEqual('internal error');
    });
  });
});
