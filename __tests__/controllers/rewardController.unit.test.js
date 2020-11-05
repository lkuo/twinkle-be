jest.mock('@models');
jest.mock('@utils/scopeUtils');
jest.mock('@controllers/childController');

const { Reward, Statement } = require('@models');
const { getScopes } = require('@utils/scopeUtils');
const { validateChildIds } = require('@controllers/childController');
const createError = require('http-errors');
const R = require('ramda');
const testHelper = require('@testHelper');
const {
  getAll,
  get,
  post,
  complete,
  inputs,
} = require('@controllers/rewardController');
const faker = require('faker');

describe('rewardController', () => {
  const member = testHelper.mocks.member();
  const familyId = member.familyId;
  const memberId = member.id;
  const transform = R.pick(['id', 'name', 'description', 'amount', 'childIds']);

  describe('getAll', () => {
    let ctx = null;
    const scope = jest.fn();
    const findAndCountAll = jest.fn();

    beforeEach(() => {
      ctx = {
        state: { user: { familyId } },
        set: jest.fn(),
      };
      scope.mockReturnValue({ findAndCountAll });
    });

    afterEach(() => {
      scope.mockClear();
      findAndCountAll.mockClear();
    });

    it('finds and counts rewards of a family', async () => {
      // Given
      Reward.scope = scope;
      const ids = [234, 345];
      const rows = [
        testHelper.mocks.reward({ id: ids[0] }),
        testHelper.mocks.reward({ id: ids[1] }),
      ];
      const count = rows.length;
      findAndCountAll.mockResolvedValueOnce({ rows, count });

      // When
      await getAll(ctx);

      // Then
      expect(Reward.scope).toHaveBeenCalledWith(getScopes());
      expect(findAndCountAll).toHaveBeenCalledWith({
        where: { familyId },
      });
      expect(ctx.body).toHaveLength(2);
      expect(ctx.body).toMatchObject(rows.map(transform));
      expect(ctx.set).toHaveBeenCalledWith('twinkle-total-count', count);
    });
  });

  describe('findOne', () => {
    let ctx = null;

    beforeEach(() => {
      ctx = {
        state: { user: { familyId } },
      };
    });

    afterEach(() => {
      Reward.findOne.mockClear();
    });

    it('finds a reward by id', async () => {
      // Given
      const id = 123;
      const reward = testHelper.mocks.reward({ id });
      Reward.findOne.mockResolvedValueOnce(reward);
      ctx.data = { rewardId: id };

      // When
      await get(ctx);

      // Then
      expect(Reward.findOne).toHaveBeenCalledWith({
        where: { id, familyId },
      });
      expect(ctx.body).toMatchObject(transform(reward));
    });

    it('throws 404 if id not found', async () => {
      const id = 123;
      Reward.findOne.mockResolvedValueOnce(null);
      ctx.data = { rewardId: id };

      // When
      // Then
      await expect(get(ctx)).rejects.toThrowError(createError.NotFound());
      expect(ctx.body).not.toBeDefined();
    });
  });

  describe('complete', () => {
    let ctx = null;
    const rewardId = 456;
    const childId = 789;
    const reward = testHelper.mocks.reward({
      id: rewardId,
      childIds: [childId, 111, 222],
    });

    beforeEach(() => {
      ctx = {
        state: { user: { familyId, memberId } },
      };
      Reward.findOne = jest.fn();
    });

    afterEach(() => {
      Reward.findOne.mockClear();
      validateChildIds.mockClear();
      Statement.create.mockClear();
    });

    it('create completing reward statement', async () => {
      // Given
      ctx.data = { rewardId, childId };
      Reward.findOne.mockResolvedValueOnce(reward);
      validateChildIds.mockResolvedValueOnce();
      Statement.create.mockResolvedValueOnce();

      // When
      await complete(ctx);

      // Then
      expect(Reward.findOne).toHaveBeenCalledWith({
        where: { id: rewardId, familyId },
      });
      expect(validateChildIds).toHaveBeenCalledWith(familyId, childId);
      expect(Statement.create).toHaveBeenCalledWith({
        childId,
        familyId,
        amount: -1 * reward.amount,
        metadata: transform(reward),
        actorId: memberId,
      });
    });

    it('throws 400 if reward not found', async () => {
      // Given
      ctx.data = { rewardId, childId };
      Reward.findOne.mockResolvedValueOnce(null);

      // When
      // Then
      await expect(complete(ctx)).rejects.toThrowError(
        createError.BadRequest(`Id ${rewardId} not found`)
      );
      expect(validateChildIds).not.toHaveBeenCalled();
      expect(Statement.create).not.toHaveBeenCalled();
    });

    it('throws 400 if child has no access to reward', async () => {
      // Given
      const childIdNoAccess = -123;
      ctx.data = { rewardId, childId: childIdNoAccess };
      Reward.findOne.mockResolvedValueOnce(reward);

      // When
      // Then
      await expect(complete(ctx)).rejects.toThrowError(createError.Forbidden());
      expect(validateChildIds).not.toHaveBeenCalled();
      expect(Statement.create).not.toHaveBeenCalled();
    });
  });

  describe('post', () => {
    let ctx = null;

    beforeEach(() => {
      ctx = {
        state: { user: { familyId, memberId } },
      };
      Reward.create = jest.fn();
    });

    afterEach(() => {
      validateChildIds.mockClear();
      Reward.create.mockClear();
    });

    it('creates and returns a reward record', async () => {
      // Given
      const reward = testHelper.mocks.reward({ id: 123, childIds: [1, 2, 3] });
      const { name, description, amount, childIds } = reward;
      ctx.data = { name, description, amount, childIds };
      validateChildIds.mockResolvedValue(null);
      Reward.create.mockResolvedValueOnce(reward);

      // When
      await post(ctx);

      // Then
      expect(ctx.body).toMatchObject({
        id: reward.id,
        name,
        description,
        amount,
        childIds: reward.childIds,
      });
      expect(validateChildIds).toHaveBeenCalledWith(familyId, childIds);
      expect(Reward.create).toHaveBeenCalledWith({
        name,
        description,
        amount,
        childIds,
        familyId,
      });
    });

    it('throws error if child ids is not valid', async () => {
      // Given
      const reward = testHelper.mocks.reward({ id: 123, childIds: [1, 2, 3] });
      const { name, description, amount, childIds } = reward;
      ctx.data = { name, description, amount, childIds };
      const error = createError.BadRequest('Invalid child id');
      validateChildIds.mockRejectedValueOnce(error);

      // When
      // Then
      await expect(post(ctx)).rejects.toThrow(error);
      expect(Reward.create).not.toHaveBeenCalled();
      expect(ctx.body).not.toBeDefined();
    });
  });

  describe('inputs', () => {
    describe('post', () => {
      it('requires fields', () => {
        expect(inputs.post.name.required).toEqual(true);
        expect(inputs.post.description.required).toEqual(false);
        expect(inputs.post.description.defaultValue).toEqual('');
        expect(inputs.post.amount.required).toEqual(true);
        expect(inputs.post.childIds.required).toEqual(false);
        expect(inputs.post.childIds.defaultValue).toEqual([]);
      });

      it('trims name and description', () => {
        expect(inputs.post.name.transformer(' name  ')).toEqual('name');
        expect(inputs.post.description.transformer(' description  ')).toEqual('description');
      });

      it('escapes name and description', () => {
        expect(inputs.post.name.transformer(' name &  ')).toEqual('name &amp;');
        expect(inputs.post.description.transformer(' description >  ')).toEqual('description &gt;');
      });

      it('validates length of name', () => {
        expect(inputs.post.name.validator(faker.random.alphaNumeric(257))).toEqual(false);
        expect(inputs.post.name.validator(faker.random.alphaNumeric(256))).toEqual(true);
        expect(inputs.post.name.validator(faker.random.alphaNumeric(1))).toEqual(true);
        expect(inputs.post.name.validator('')).toEqual(false);
      });

      it('validates length of description', () => {
        expect(inputs.post.description.validator(faker.random.alphaNumeric(1025))).toEqual(false);
        expect(inputs.post.description.validator(faker.random.alphaNumeric(1024))).toEqual(true);
        expect(inputs.post.description.validator('')).toEqual(true);
      });

      it('validates amount is integer', () => {
        expect(inputs.post.amount.validator(123)).toEqual(true);
        expect(inputs.post.amount.validator(12.3)).toEqual(false);
      });

      it('validates all child ids are integer', () => {
        expect(inputs.post.childIds.validator([123, 345])).toEqual(true);
        expect(inputs.post.childIds.validator([])).toEqual(true);
        expect(inputs.post.childIds.validator([12.3])).toEqual(false);
        expect(inputs.post.childIds.validator([123, 12.3])).toEqual(false);
      });
    });

    describe('get', () => {
      it('rewardId', () => {
        expect(inputs.get.rewardId.required).toEqual(true);
        expect(inputs.get.rewardId.transformer('123')).toEqual(123);
        expect(inputs.get.rewardId.validator('123')).toEqual(false);
        expect(inputs.get.rewardId.validator(12.3)).toEqual(false);
        expect(inputs.get.rewardId.validator(123)).toEqual(true);
      })
    });

    describe('complete', () => {
      it('rewardId', () => {
        expect(inputs.complete.rewardId.required).toEqual(true);
        expect(inputs.complete.rewardId.transformer('123')).toEqual(123);
        expect(inputs.complete.rewardId.validator('123')).toEqual(false);
        expect(inputs.complete.rewardId.validator(12.3)).toEqual(false);
        expect(inputs.complete.rewardId.validator(123)).toEqual(true);
      });

      it('childId', () => {
        expect(inputs.complete.childId.required).toEqual(true);
        expect(inputs.complete.childId.transformer('123')).toEqual(123);
        expect(inputs.complete.childId.validator('123')).toEqual(false);
        expect(inputs.complete.childId.validator(12.3)).toEqual(false);
        expect(inputs.complete.childId.validator(123)).toEqual(true);
      });
    });
  });
});
