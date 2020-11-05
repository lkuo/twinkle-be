const jwt = require('jsonwebtoken');
const validator = require('validator');
const { Member } = require('@models');
const createError = require('http-errors');

async function authenticate(ctx) {
  const { email, password } = ctx.data;
  const member = await Member.findOne({ where: { email, password } });
  if (!member) {
    throw createError.Unauthorized();
  }
  ctx.body = {
    token: sign({ memberId: member.id, familyId: member.familyId }),
  };
}

// async function revoke(ctx) {
//   ctx.body = { path: ctx.path };
// }

function sign(payload) {
  const secret = process.env.ENCRYPTION_KEY;
  return jwt.sign(payload, secret);
}

const inputs = {
  authenticate: {
    email: {
      required: true,
      transformer: validator.normalizeEmail,
      validator: validator.isEmail,
    },
    password: {
      required: true,
      validator: (val) => validator.isLength(val, { min: 8, max: 50 }),
    },
  },
};

module.exports = {
  authenticate,
  // revoke,
  inputs,
};
