const validator = require('validator');
const R = require('ramda');

/**
 * Verifies a name input.
 *  - contains only upper and lower case letters
 *  - contains space, comma, period and apostrophe
 *  - length
 * @param value
 * @returns {boolean}
 */
function nameValidator(value) {
  return (
    !R.isNil(value) &&
    /^[a-zA-Z ,.'-]+$/i.test(value) &&
    validator.isLength(value, { min: 2, max: 25 })
  );
}

const id = {
  required: true,
  transformer: (value) => Number.parseInt(value, 10),
  validator: Number.isInteger,
};

const ids = {
  defaultValue: [],
  validator: R.all(Number.isInteger),
};

module.exports = {
  nameValidator,
  fields: {
    id,
    ids,
  },
};
