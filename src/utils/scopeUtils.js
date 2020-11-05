const { Op } = require('sequelize');
const R = require('ramda');

const OPERATOR_MAP = {
  eq: Op.eq,
  not: Op.not,
  lt: Op.lt,
  lte: Op.lte,
  gt: Op.gt,
  gte: Op.gte,
  in: Op.in,
};

/**
 * Transform filter object (qs format) to Sequelize scopes
 * @param {object} [filter]
 * @returns Array
 */
function getFilterScopes(filter) {
  if (R.either(R.isNil, R.isEmpty)(filter)) {
    return [];
  }
  return R.flatten(
    Object.entries(filter).map(([field, operatorValue]) => {
      return isDefaultOperator(operatorValue)
        ? { method: ['filter', field, operatorValue] }
        : Object.entries(operatorValue).map(([operator, value]) => {
            const sequelizeOperator = getSequelizeOperator(operator);
            return { method: ['filter', field, value, sequelizeOperator] };
          });
    })
  );
}

function isDefaultOperator(operatorValue) {
  return (
    typeof operatorValue === 'string' ||
    Array.isArray(operatorValue) ||
    Number.isFinite(operatorValue) ||
    operatorValue === null
  );
}

function getSequelizeOperator(operator) {
  const sequelizeOperator = OPERATOR_MAP[operator];
  if (!sequelizeOperator) {
    throw Error(`${operator} is not supported`);
  }
  return sequelizeOperator;
}

/**
 * Transform page, size and sort
 * @param {number} [page=1]
 * @param {number} [size=10]
 * @param {object} [sort={}] - Sort fields and its order
 * @returns {object}
 */
function getPaginationScope(page = 1, size = 10, sort = {}) {
  const limit = size;
  const offset = (page - 1) * size;
  const order = Object.entries(sort);
  // in case the sort is not decisive, adding an sort by id ensures the results are always the same
  if (!sort['id']) {
    order.push(['id', 'ASC']);
  }

  return { method: ['pagination', limit, offset, order] };
}

function getScopes(filter, sort, page, size) {
  return R.flatten([
    getFilterScopes(filter),
    getPaginationScope(page, size, sort),
  ]);
}

module.exports = {
  getFilterScopes,
  getPaginationScope,
  getScopes,
};
