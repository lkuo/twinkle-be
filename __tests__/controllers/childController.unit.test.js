jest.mock('@models');
jest.mock('validator');
jest.mock('@utils/inputUtils');

const {
  getAll,
  get,
  post,
  validateChildIds,
  inputs,
} = require('@controllers/childController');
const { Child } = require('@models');
const { getScopes } = require('@utils/scopeUtils');
const { nameValidator } = require('@utils/inputUtils');
const R = require('ramda');
const createError = require('http-errors');
const validator = require('validator');
const testHelper = require('@testHelper');
const faker = require('faker');

describe('childController', () => {
  const member = testHelper.mocks.member();
  const { id: memberId, familyId } = member;
  const transformChild = R.pick(['id', 'firstName', 'lastName']);
  let ctx = {};

  beforeAll(() => {
    Child.findOne = jest.fn();
    Child.create = jest.fn();
    Child.count = jest.fn();
  });

  beforeEach(() => {
    ctx = {
      state: { user: { memberId, familyId } },
      set: jest.fn(),
    };
  });

  afterEach(() => {
    Child.findOne.mockClear();
    Child.create.mockClear();
    Child.count.mockClear();
  });

  describe('getAll', () => {
    const findAndCountAll = jest.fn();

    beforeAll(() => {
      Child.scope = jest.fn().mockImplementation(() => ({ findAndCountAll }));
    });

    it('finds and counts child of given family', async () => {
      // Given
      const children = [testHelper.mocks.child(), testHelper.mocks.child()];
      const count = 2;
      findAndCountAll.mockResolvedValueOnce({ rows: children, count });

      // When
      await getAll(ctx);

      // Then
      expect(Child.scope).toHaveBeenCalledWith(getScopes());
      expect(findAndCountAll).toHaveBeenCalledWith({ where: { familyId } });
      expect(ctx.body).toMatchObject(children.map(transformChild));
      expect(ctx.set).toHaveBeenCalledWith('twinkle-total-count', count);
    });
  });

  describe('get', () => {
    const child = testHelper.mocks.child();

    beforeEach(() => {
      ctx.data = { childId: child.id };
    });

    it('finds child by childId', async () => {
      // Given
      Child.findOne.mockResolvedValueOnce(child);

      // When
      await get(ctx);

      // Then
      expect(Child.findOne).toHaveBeenCalledWith({
        where: { id: child.id, familyId },
      });
      expect(ctx.body).toMatchObject(transformChild(child));
    });

    it('throws 404 if child not found by id', async () => {
      // Given
      Child.findOne.mockResolvedValueOnce(null);

      // When
      // Then
      await expect(get(ctx)).rejects.toThrowError(createError.NotFound());
      expect(ctx.body).not.toBeDefined();
    });
  });

  describe('post', () => {
    const child = {
      id: faker.random.number(),
      ...testHelper.mocks.child(),
    };

    it('creates and returns a child record', async () => {
      // Given
      const { firstName, lastName } = child;
      ctx.data = { firstName, lastName };
      Child.create.mockResolvedValueOnce(child);

      // When
      await post(ctx);

      // Then
      expect(Child.create).toHaveBeenCalledWith({
        firstName,
        lastName,
        familyId,
      });
      expect(ctx.body).toMatchObject(transformChild(child));
    });
  });

  describe('validateChildIds', () => {
    const familyId = faker.random.number();

    afterEach(() => {
      Child.count.mockClear();
    });

    it('counts and compares valid child ids', async () => {
      // Given
      const childIds = [1, 2, 2, 3];
      Child.count.mockResolvedValueOnce(3);

      // When
      await validateChildIds(familyId, childIds);

      // Then
      expect(Child.count).toHaveBeenCalledWith({
        where: { id: expect.arrayContaining([1, 2, 3]), familyId },
      });
    });

    it('wraps child id in a array', async () => {
      // Given
      const childIds = 1;
      Child.count.mockResolvedValueOnce(1);

      // When
      await validateChildIds(familyId, childIds);

      // Then
      expect(Child.count).toHaveBeenCalledWith({
        where: { id: expect.arrayContaining([1]), familyId },
      });
    });

    it('throws error if count does not match', async () => {
      // Given
      const childIds = [2, 3, 4];
      Child.count.mockResolvedValueOnce(2);

      // When
      // Then
      await expect(validateChildIds(familyId, childIds)).rejects.toThrowError(
        createError.BadRequest('Invalid child id')
      );
      expect(Child.count).toHaveBeenCalledWith({
        where: { id: expect.arrayContaining([2, 3, 4]), familyId },
      });
    });
  });

  describe('inputs', () => {

    afterEach(() => {
      validator.trim.mockClear();
      validator.toInt.mockClear();
      nameValidator.mockClear();
    });

    describe('post', () => {
      it('requires first and last name', () => {
        expect(inputs.post.firstName.required).toBeTruthy();
        expect(inputs.post.lastName.required).toBeTruthy();
      });

      it('trims first and last name', () => {
        // Given
        const firstName = `  first name with spaces   `;
        const lastName = ` last name with spaces `;

        // When
        inputs.post.firstName.transformer(firstName);
        inputs.post.lastName.transformer(lastName);


        // Then
        expect(validator.trim).toHaveBeenNthCalledWith(1, firstName);
        expect(validator.trim).toHaveBeenNthCalledWith(2, lastName);
      });

      it('validator first and last name', () => {
        // Given
        const firstName = 'fake first name';
        const lastname = 'fake last name';

        // When
        inputs.post.firstName.validator(firstName);
        inputs.post.lastName.validator(lastname);

        // Then
        expect(nameValidator).toHaveBeenNthCalledWith(1, firstName);
        expect(nameValidator).toHaveBeenNthCalledWith(2, lastname);
      });
    });

    describe('get', () => {

      it('requires child id', () => {
        expect(inputs.get.childId.required).toBeTruthy();
      })

      it('transforms child id', () => {
        // Given
        const childId = '123';

        // When
        inputs.get.childId.transformer(childId);

        // Then
        expect(validator.toInt).toHaveBeenCalledWith(childId);
      });

      it('validates child id is a number', () => {
        // Given
        const cases = [[1, true], ['2', false], [NaN, false]];

        // When
        // Then
        for (const [value, expectedResult] of cases) {
          expect(inputs.get.childId.validator(value)).toBe(expectedResult);
        }
      })
    });
  });
});
