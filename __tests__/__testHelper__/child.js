const faker = require('faker');

module.exports = (fields = {}) => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  familyId: faker.random.number(),
  ...fields,
});
