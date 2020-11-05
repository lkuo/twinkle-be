module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  collectCoverage: true,
  coverageReporters: ['json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/**/*.js',
    '!src/models/*.js',
    '!src/__tests__/**',
    '!**/node_modules/**',
    '!**/build/**',
    '!**/coverage/**',
  ],
  moduleNameMapper: {
    '@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '@models': '<rootDir>/src/models/index.js',
    '@modules/(.*)$': '<rootDir>/src/modules/$1',
    '@utils/(.*)$': '<rootDir>/src/utils/$1',
    '@testHelper$': '<rootDir>/__tests__/__testHelper__/index.js',
  },
  setupFilesAfterEnv: ['./jest.int.setup.js'],
  testMatch: ['**/__tests__/**/*.int.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/coverage/'],
  globals: {
    global: {},
  },
};
