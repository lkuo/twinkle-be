const { validate } = require('@utils/validationUtils');

/**
 * Validation input middleware
 * @param {Schema} schema
 * @returns {function(*, *): Promise<void>}
 */
function validateInput(schema) {
  return async function (ctx, next) {
    const data = Object.assign({}, ctx.request.body, ctx.params);
    ctx.data = await validate(schema, data);
    await next();
  };
}

module.exports = {
  validateInput,
};
