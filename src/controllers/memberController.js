const { Member, Family, sequelize } = require('@models');
const { nameValidator } = require('@utils/inputUtils');
const validator = require('validator');
const R = require('ramda');
const createError = require('http-errors');

async function post(ctx) {
  const input = ctx.data;
  const member = await sequelize.transaction(async (transaction) => {
    const family = await Family.create(
      { name: `The ${input.lastName}'s` },
      { transaction }
    );
    return await Member.create(
      { ...input, familyId: family.id },
      { transaction }
    );
  });

  ctx.body = transformMember(member);
}

async function get(ctx) {
  const memberId = ctx.params.memberId;
  const member = await Member.findByPk(memberId);
  if (!member) {
    throw createError.NotFound();
  }
  ctx.body = transformMember(member);
}

function transformMember(member) {
  return R.pick(
    ['id', 'firstName', 'lastName', 'email', 'avatar', 'familyId'],
    member
  );
}

const inputs = {
  get: {
    memberId: {
      required: true,
      transformer: validator.toInt,
      validator: Number.isInteger,
    },
  },
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
    email: {
      required: true,
      transformer: validator.normalizeEmail,
      validator: validator.isEmail,
    },
    password: {
      required: true,
      validator: (val) => validator.isLength(val, { min: 8, max: 255 }),
    },
    avatar: {
      required: false,
      defaultValue: 'http://bite.me',
      transformer: validator.trim,
      validator: validator.isURL,
    },
  },
};

module.exports = {
  post,
  get,
  inputs,
};
