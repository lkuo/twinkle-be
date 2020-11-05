const faker = require('faker');

module.exports = (fields = {}) => ({
  name: faker.random.words(),
  description: faker.random.words(),
  amount: faker.random.number(),
  familyId: faker.random.number(),
  childIds: [],
  ...fields,
});
