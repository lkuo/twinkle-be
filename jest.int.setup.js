const jwt = require('jsonwebtoken');
const testHelper = require('@testHelper');
const { sequelize } = require('@models');

jest.setTimeout(30000);

afterEach(() => {
  jest.resetAllMocks();
});

afterAll(async () => {
  jest.clearAllMocks();
  await testHelper.dropAllModels();
  await sequelize.close();
});

global.BASE_URL = 'http://localhost:3001/api';
global.memberId = 0;
global.familyId = 123;
global.getAuthHeader = (member = {}) => {
  const { id = global.memberId, familyId = global.familyId } = member;
  const token = jwt.sign({ memberId: id, familyId }, 'abc');
  return {
    Authorization: `Bearer ${token}`,
  };
};
