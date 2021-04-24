require('dotenv').config();
require('module-alias/register');
const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const routes = require('./routes');
const { errorHandler } = require('@middlewares/errorHandlerMiddleware');
const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(errorHandler);
app.use(routes);

module.exports = app.listen(process.env.PORT, function () {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  console.log(`Example app listening on port ${process.env.PORT}...`);
});
