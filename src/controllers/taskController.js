const { Task, Statement } = require('@models');
const { getScopes } = require('@utils/scopeUtils');
const { fields } = require('@utils/inputUtils');
const { validateChildIds } = require('@controllers/childController');
const createError = require('http-errors');
const R = require('ramda');
const validator = require('validator');

async function getAll(ctx) {
  const { familyId } = ctx.state.user;
  const scopes = getScopes();
  const { rows, count } = await Task.scope(scopes).findAndCountAll({
    where: { familyId },
  });

  ctx.body = rows.map(transformTask);
  ctx.set('twinkle-total-count', count);
}

async function get(ctx) {
  const { taskId } = ctx.data;
  const { familyId } = ctx.state.user;
  const task = await findOne(taskId, familyId);

  ctx.body = transformTask(task);
}

async function post(ctx) {
  const input = ctx.data;
  const { familyId } = ctx.state.user;
  await validateChildIds(familyId, input.childIds);
  const task = await Task.create({ ...input, familyId });

  ctx.body = transformTask(task);
}

async function complete(ctx) {
  const input = ctx.data;
  const { memberId, familyId } = ctx.state.user;
  const { taskId, childId } = input;
  const task = await findOne(taskId, familyId);
  await validateComplete(task, childId, familyId);
  await Statement.create({
    childId: input.childId,
    familyId,
    amount: task.amount,
    metadata: transformTask(task),
    actorId: memberId,
  });
  ctx.body = {};
}

async function findOne(taskId, familyId) {
  const task = await Task.findOne({ where: { id: taskId, familyId } });
  if (!task) {
    throw createError.NotFound(`Id ${taskId} not found`);
  }
  return task;
}

async function validateComplete(task, childId, familyId) {
  if (!R.includes(childId, task.childIds)) {
    throw createError.Forbidden();
  }
  await validateChildIds(familyId, childId);
}

function transformTask(task) {
  return R.pick(['id', 'name', 'description', 'amount', 'childIds'], task);
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
      ...fields.ids,
      required: false,
    },
  },
  get: {
    taskId: fields.id,
  },
  complete: {
    taskId: fields.id,
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
