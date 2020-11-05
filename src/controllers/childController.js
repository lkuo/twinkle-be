const { Child } = require('@models');
const { nameValidator } = require('@utils/inputUtils');
const { getScopes } = require('@utils/scopeUtils');
const R = require('ramda');
const createError = require('http-errors');
const validator = require('validator');

async function getAll(ctx) {
  const { familyId } = ctx.state.user;
  const scopes = getScopes();
  const { rows, count } = await Child.scope(scopes).findAndCountAll({
    where: { familyId },
  });

  ctx.body = rows.map(transformChild);
  ctx.set('twinkle-total-count', count);
}

async function get(ctx) {
  const { familyId } = ctx.state.user;
  const { childId } = ctx.data;
  const child = await Child.findOne({ where: { id: childId, familyId } });
  if (!child) {
    throw createError.NotFound();
  }
  ctx.body = transformChild(child);
}

async function post(ctx) {
  const input = ctx.data;
  const { familyId } = ctx.state.user;
  const child = await Child.create({ ...input, familyId });
  ctx.body = transformChild(child);
}

async function validateChildIds(familyId, childIds) {
  const idsSet = new Set(Array.isArray(childIds) ? childIds : [childIds]);
  const count = await Child.count({
    where: { id: Array.from(idsSet), familyId },
  });
  if (count !== idsSet.size) {
    throw createError.BadRequest('Invalid child id');
  }
}

function transformChild(child) {
  return R.pick(['id', 'firstName', 'lastName'], child);
}

const inputs = {
  post: {
    firstName: {
      required: true,
      transformer: validator.trim,
      validator: nameValidator,
    },
    lastName: {
      required: true,
      transformer: validator.trim,
      validator: nameValidator,
    },
  },
  get: {
    childId: {
      required: true,
      transformer: validator.toInt,
      validator: Number.isInteger,
    },
  },
};

module.exports = {
  getAll,
  get,
  post,
  validateChildIds,
  inputs,
};
