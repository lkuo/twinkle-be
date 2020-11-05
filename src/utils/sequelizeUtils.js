const { required } = require('@utils/validationUtils');
const { Op } = require('sequelize');

/**
 * Filter scope for sequelize models
 * @param {string} field - name of the field
 * @param {any} value - value of the query
 * @param {symbol} [operator=Op.eq] - sequelize operator
 * @returns {{where: {Object}}}
 */
function filterScope(field, value, operator = Op.eq) {
  required(field, 'field');
  required(value, 'value');
  const operatorValue =
    operator === Op.eq
      ? value
      : {
          [operator]: value,
        };

  return {
    where: {
      [field]: operatorValue,
    },
  };
}

/**
 * Pagination scope for sequelize models
 * @param {number} [limit=10] - page size
 * @param {number} [offset=0] - # of skipped records
 * @param {array} [order=[]] - order of the query
 * @returns {{offset, limit, order}}
 */
function paginationScope(limit = 10, offset = 0, order = []) {
  return {
    limit,
    offset,
    order,
  };
}

const SCOPES = {
  FILTER: 'filter',
  PAGINATION: 'pagination',
};

module.exports = {
  filterScope,
  paginationScope,
  SCOPES,
};
