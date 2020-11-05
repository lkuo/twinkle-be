jest.mock('@models');
jest.mock('@utils/inputUtils');
jest.mock('validator');
jest.mock('@models');

const { post, get, inputs } = require('@controllers/memberController');
const { Member, Family, sequelize } = require('@models');
const { nameValidator } = require('@utils/inputUtils');
const validator = require('validator');
const createError = require('http-errors');
const faker = require('faker');
const testHelper = require('@testHelper');

describe('memberController', () => {
  describe('post', () => {
    const transaction = faker.random.alphaNumeric(10);

    beforeAll(() => {
      sequelize.transaction.mockImplementation(
        async (callback) => await callback(transaction)
      );
    });

    afterEach(() => {
      Member.create.mockClear();
      Family.create.mockClear();
      sequelize.transaction.mockClear();
    });

    it('creates member and family', async () => {
      // Given
      const member = {
        id: faker.random.number,
        ...testHelper.mocks.member(),
      };
      const family = { id: member.familyId };
      const { firstName, lastName, email, password, avatar } = member;
      Family.create.mockResolvedValueOnce(family);
      Member.create.mockResolvedValueOnce(member);

      const ctx = { data: { firstName, lastName, email, password, avatar } };

      // When
      await post(ctx);

      // Then
      expect(Family.create).toHaveBeenCalledWith(
        { name: `The ${lastName}'s` },
        { transaction }
      );
      expect(Member.create).toHaveBeenCalledWith(
        {
          firstName,
          lastName,
          email,
          password,
          avatar,
          familyId: family.id,
        },
        { transaction }
      );
      expect(ctx.body).toMatchObject({
        id: member.id,
        firstName,
        lastName,
        email,
        avatar,
        familyId: family.id,
      });
    });
  });

  describe('get', () => {
    const memberId = faker.random.number();
    const member = {
      id: memberId,
      ...testHelper.mocks.member(),
    };

    afterEach(() => {
      Member.findByPk.mockClear();
    });

    it('finds member by id', async () => {
      // Given
      const ctx = { params: { memberId } };
      Member.findByPk.mockResolvedValueOnce(member);

      // When
      await get(ctx);

      // Then
      expect(Member.findByPk).toHaveBeenCalledWith(memberId);
      expect(ctx.body).toMatchObject({
        id: memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        avatar: member.avatar,
        familyId: member.familyId,
      });
    });

    it('throws 404 if member not found', async () => {
      // Given
      const ctx = { params: { memberId } };

      // When
      // Then
      await expect(get(ctx)).rejects.toThrowError(createError.NotFound());
    });
  });

  describe('inputs', () => {
    afterEach(() => {
      validator.toInt.mockClear();
      validator.trim.mockClear();
      validator.isLength.mockClear();
      validator.isURL.mockClear();
      nameValidator.mockClear();
    });

    it('get.memberId', () => {
      // Given
      const memberId = '123';

      // When
      inputs.get.memberId.transformer(memberId);

      expect(inputs.get.memberId.required).toEqual(true);
      expect(validator.toInt).toHaveBeenCalledWith(memberId);
      expect(inputs.get.memberId.validator('123')).toEqual(false);
      expect(inputs.get.memberId.validator(123)).toEqual(true);
    });

    it('post.firstName/lastName', () => {
      // Given
      const firstName = 'first name';
      const lastName = 'last name';

      // When
      inputs.post.firstName.transformer(firstName);
      inputs.post.lastName.transformer(lastName);
      inputs.post.firstName.validator(firstName);
      inputs.post.lastName.validator(lastName);

      // Then
      expect(validator.trim).toHaveBeenNthCalledWith(1, firstName);
      expect(validator.trim).toHaveBeenNthCalledWith(2, lastName);
      expect(nameValidator).toHaveBeenNthCalledWith(1, firstName);
      expect(nameValidator).toHaveBeenNthCalledWith(2, lastName);
    });

    it('post.email', () => {
      // Given
      const email = 'abc@gmail.com';

      // When
      inputs.post.email.transformer(email);
      inputs.post.email.validator(email);

      // Then
      expect(inputs.post.email.required).toEqual(true);
      expect(validator.normalizeEmail).toHaveBeenCalledWith(email);
      expect(validator.isEmail).toHaveBeenCalledWith(email);
    });

    it('post.password', () => {
      // Given
      const password = 'superStrongPassword';

      // When
      inputs.post.password.validator(password);

      // Then
      expect(inputs.post.email.required).toEqual(true);
      expect(validator.isLength).toHaveBeenCalledWith(password, {
        min: 8,
        max: 255,
      });
    });

    it('post.avatar', () => {
      // Given
      const avatar = 'http://blah.blah';

      // When
      inputs.post.avatar.transformer(avatar);
      inputs.post.avatar.validator(avatar);

      // Then
      expect(inputs.post.avatar.required).toEqual(false);
      expect(inputs.post.avatar.defaultValue).toEqual('http://bite.me');
      expect(validator.trim).toHaveBeenCalledWith(avatar);
      expect(validator.isURL).toHaveBeenCalledWith(avatar);
    })
  });
});
