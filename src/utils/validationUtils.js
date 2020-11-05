const R = require('ramda');
const MAX_DEPTH = process.env.MAX_INPUT_DEPTH || 5;
const createError = require('http-errors');

/**
 * A validation schema
 * @typedef {Object} Schema
 * @property {any} default - default value of the field if input is undefined
 * @property {boolean} [required=false] - whether the filed is required to present (not undefined)
 * @property {function} transformer - transforms the input value
 * @property {function} validator - validates the input value
 * @property {Schema} schema - schema of the input field
 */

/**
 * Validates an input against a schema.
 * @param {Schema} schema - schema to validate against
 * @param {Object} input - input object to validate
 * @param {number} [depth=0] - depth of the object
 */
async function validate(schema, input, depth = 0) {
  required(schema, 'schema');
  required(input, 'input');
  const output = {};
  for (const [key, schemaValue] of Object.entries(schema)) {
    const {
      defaultValue,
      required = false,
      transformer,
      validator,
      schema,
    } = schemaValue;
    let value = input[key];
    if (value === undefined) {
      value = defaultValue;
    }
    if (required && value === undefined) {
      throw createError.BadRequest(`${key} is required`);
    }
    if (value !== undefined) {
      if (transformer) {
        value = await transformer(value);
      }
      if (validator) {
        const res = await validator(value);
        if (res === false) {
          throw createError.BadRequest(`${key} is invalid`);
        }
      }
      if (schema) {
        if (depth >= MAX_DEPTH) {
          throw Error(`input depth exceeds ${MAX_DEPTH}`);
        }
        value = await validate(schema, value, depth + 1);
      }
      output[key] = value;
    }
  }

  return output;
}

/**
 * Verifies if the value is defined
 * @param {any} value - value of the parameter
 * @param {string} [name='parameter'] - name of the parameter
 * @param {boolean} [throwError=true] - whether throw an error if validation fails
 */
function required(value, name = 'parameter', throwError = true) {
  const res = R.isNil(value);
  if (res && throwError) {
    throw Error(`${name} is required`);
  }

  return !res;
}

module.exports = {
  required,
  validate,
};
