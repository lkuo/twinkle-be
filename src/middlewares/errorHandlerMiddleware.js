async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    let statusCode = 500;
    let message = 'internal error';
    if (err.statusCode) {
      statusCode = err.statusCode;
      message = err.message;
    }
    ctx.status = statusCode;
    ctx.body = message;
  }
}

module.exports = {
  errorHandler,
};
