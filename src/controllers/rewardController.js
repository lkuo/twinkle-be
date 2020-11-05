const { Reward, Statement } = require('@models');
const { getScopes } = require('@utils/scopeUtils');
const { fields } = require('@utils/inputUtils');
const { validateChildIds } = require('@controllers/childController');
const createError = require('http-errors');
const R = require('ramda');
const validator = require('validator');

async function getAll(ctx) {
  const { familyId } = ctx.state.user;
  const scopes = getScopes();
  const { rows, count } = await Reward.scope(scopes).findAndCountAll({
    where: { familyId },
  });

  ctx.body = rows.map(transformReward);
  ctx.set('twinkle-total-count', count);
}

async function get(ctx) {
  const { rewardId } = ctx.data;
  const { familyId } = ctx.state.user;

  const reward = await findOne(rewardId, familyId);
  ctx.body = transformReward(reward);
}

async function complete(ctx) {
  const { memberId, familyId } = ctx.state.user;
  const { rewardId, childId } = ctx.data;
  const reward = await findOne(rewardId, familyId, {
    error: createError.BadRequest(`Id ${rewardId} not found`),
  });
  await validateComplete(reward, childId, familyId);
  await Statement.create({
    childId,
    familyId,
    amount: -1 * reward.amount,
    metadata: transformReward(reward),
    actorId: memberId,
  });
  ctx.body = {};
}

async function findOne(rewardId, familyId, options = {}) {
  const { isThrowError = true, error = createError.NotFound() } = options;
  const reward = await Reward.findOne({ where: { id: rewardId, familyId } });
  if (!reward && isThrowError) {
    throw error;
  }
  return reward;
}

async function validateComplete(reward, childId, familyId) {
  if (!R.includes(childId, reward.childIds)) {
    throw createError.Forbidden();
  }
  await validateChildIds(familyId, childId);
}

async function post(ctx) {
  const input = ctx.data;
  const { familyId } = ctx.state.user;
  await validateChildIds(familyId, input.childIds);
  const reward = await Reward.create({ ...input, familyId });

  ctx.body = transformReward(reward);
}

function transformReward(reward) {
  return R.pick(['id', 'name', 'description', 'amount', 'childIds'], reward);
}

const inputs = {
  post: {
    name: {
      required: true,
      transformer: R.pipe(validator.trim, validator.escape),
      validator: (val) => validator.isLength(val, { min: 1, max: 256 }),
    },
    description: {
      required: false,
      defaultValue: '',
      transformer: R.pipe(validator.trim, validator.escape),
      validator: (val) => validator.isLength(val, { min: 0, max: 1024 }),
    },
    amount: {
      required: true,
      validator: Number.isInteger,
    },
    childIds: {
      required: false,
      defaultValue: [],
      validator: R.all(Number.isInteger),
    },
  },
  get: {
    rewardId: {
      required: true,
      transformer: validator.toInt,
      validator: Number.isInteger,
    },
  },
  complete: {
    rewardId: fields.id,
    childId: fields.id,
  },
};
module.exports = {
  getAll,
  get,
  post,
  complete,
  inputs,
};
