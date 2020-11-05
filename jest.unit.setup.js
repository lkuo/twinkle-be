jest.setTimeout(5000);

process.env.ENCRYPTION_KEY = 'ABC';

afterEach(() => {
  jest.resetAllMocks();
});

afterAll(() => {
  jest.clearAllMocks();
});
