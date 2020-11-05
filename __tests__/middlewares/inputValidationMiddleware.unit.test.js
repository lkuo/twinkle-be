jest.mock('@utils/validationUtils');

const { validateInput } = require('@middlewares/inputValidationMiddleware');
const { validate } = require('@utils/validationUtils');

describe('inputValidationMiddleware', () => {
  describe('validateInput', () => {
    let ctx = null;
    let next = null;
    const schema = { id: { required: true }, column1: { defaultValue: 3 } };

    beforeEach(() => {
      ctx = {
        request: {},
      };
      next = jest.fn();
    });

    it('validates request body and params against schema', async () => {
      // Given
      const params = { id: 1 };
      const body = { column1: 4 };
      const data = { ...params, ...body };
      ctx.params = params;
      ctx.request.body = body;
      validate.mockResolvedValue(data);

      // When
      await validateInput(schema)(ctx, next);

      // Then
      expect(validate).toHaveBeenCalledWith(schema, data);
      expect(ctx.data).toMatchObject(data);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
