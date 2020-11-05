const jwt = require('koa-jwt');

async function isAuthenticated(ctx, next) {
  if (!ctx.state.user) {
    ctx.status = 401;
    return;
  }
  await next();
}

function getJwt() {
  const secret = process.env.ENCRYPTION_KEY;
  return jwt({ secret, algorithms: ['HS256'] });
}

module.exports = {
  isAuthenticated,
  jwt: getJwt(),
};
