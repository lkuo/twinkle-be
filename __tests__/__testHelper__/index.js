const models = require('@models');
const child = require('./child');
const family = require('./family');
const member = require('./member');
const reward = require('./reward');
const task = require('./task');

const mocks = {
  child,
  family,
  member,
  reward,
  task,
};
const dbModels = [
  models.Child,
  models.Family,
  models.Member,
  models.Reward,
  models.Statement,
  models.Task,
];

async function create(model, records) {
  const res = await model.create(records, { returning: true, raw: true });
  if (!res) {
    return res;
  } else if (Array.isArray(res)) {
    return res.map((r) => r.get({ plain: true }));
  } else {
    return res.get({ plain: true });
  }
}

async function dropModel(model) {
  return model.destroy({
    truncate: true,
    force: true,
    cascade: true,
  });
}

async function dropAllModels() {
  return Promise.all(dbModels.map(dropModel));
}

async function createChild(data = {}) {
  return create(models.Child, {
    ...child(),
    ...data,
  });
}

async function createFamily(data = {}) {
  return create(models.Family, {
    ...family(),
    ...data,
  });
}

async function createTask(data = {}) {
  return create(models.Task, {
    ...task(),
    ...data,
  });
}

async function createReward(data = {}) {
  return create(models.Reward, {
    ...reward(),
    ...data,
  });
}

async function createMember(data = {}) {
  return create(models.Member, {
    ...member(),
    ...data,
  });
}

module.exports = {
  mocks,
  createChild,
  createFamily,
  createMember,
  createReward,
  createTask,
  dropModel,
  dropAllModels,
};
