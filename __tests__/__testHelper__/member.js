const faker = require('faker');

module.exports = (fields = {}) => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.random.alphaNumeric(10),
  avatar: faker.internet.url(),
  familyId: faker.random.number(),
  ...fields,
});
