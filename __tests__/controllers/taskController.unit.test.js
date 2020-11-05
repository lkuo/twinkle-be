jest.mock('@models');
jest.mock('@utils/scopeUtils');
jest.mock('@controllers/childController');

const { Task, Statement } = require('@models');
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
} = require('@controllers/taskController');
const faker = require('faker');

describe('taskController', () => {
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

    it('finds and counts tasks of a family', async () => {
      // Given
      Task.scope = scope;
      const ids = [234, 345];
      const rows = [
        testHelper.mocks.task({ id: ids[0] }),
        testHelper.mocks.task({ id: ids[1] }),
      ];
      const count = rows.length;
      findAndCountAll.mockResolvedValueOnce({ rows, count });

      // When
      await getAll(ctx);

      // Then
      expect(Task.scope).toHaveBeenCalledWith(getScopes());
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
      Task.findOne.mockClear();
    });

    it('finds a task by id', async () => {
      // Given
      const id = 123;
      const task = testHelper.mocks.task({ id });
      Task.findOne.mockResolvedValueOnce(task);
      ctx.data = { taskId: id };

      // When
      await get(ctx);

      // Then
      expect(Task.findOne).toHaveBeenCalledWith({
        where: { id, familyId },
      });
      expect(ctx.body).toMatchObject(transform(task));
    });

    it('throws 404 if id not found', async () => {
      const id = 123;
      Task.findOne.mockResolvedValueOnce(null);
      ctx.data = { taskId: id };

      // When
      // Then
      await expect(get(ctx)).rejects.toThrowError(createError.NotFound(`Id ${id} not found`));
      expect(ctx.body).not.toBeDefined();
    });
  });

  describe('complete', () => {
    let ctx = null;
    const taskId = 456;
    const childId = 789;
    const task = testHelper.mocks.task({
      id: taskId,
      childIds: [childId, 111, 222],
    });

    beforeEach(() => {
      ctx = {
        state: { user: { familyId, memberId } },
      };
      Task.findOne = jest.fn();
    });

    afterEach(() => {
      Task.findOne.mockClear();
      validateChildIds.mockClear();
      Statement.create.mockClear();
    });

    it('create completing task statement', async () => {
      // Given
      ctx.data = { taskId, childId };
      Task.findOne.mockResolvedValueOnce(task);
      validateChildIds.mockResolvedValueOnce();
      Statement.create.mockResolvedValueOnce();

      // When
      await complete(ctx);

      // Then
      expect(Task.findOne).toHaveBeenCalledWith({
        where: { id: taskId, familyId },
      });
      expect(validateChildIds).toHaveBeenCalledWith(familyId, childId);
      expect(Statement.create).toHaveBeenCalledWith({
        childId,
        familyId,
        amount: task.amount,
        metadata: transform(task),
        actorId: memberId,
      });
    });

    it('throws 400 if task not found', async () => {
      // Given
      ctx.data = { taskId, childId };
      Task.findOne.mockResolvedValueOnce(null);

      // When
      // Then
      await expect(complete(ctx)).rejects.toThrowError(
        createError.BadRequest(`Id ${taskId} not found`)
      );
      expect(validateChildIds).not.toHaveBeenCalled();
      expect(Statement.create).not.toHaveBeenCalled();
    });

    it('throws 400 if child has no access to task', async () => {
      // Given
      const childIdNoAccess = -123;
      ctx.data = { taskId, childId: childIdNoAccess };
      Task.findOne.mockResolvedValueOnce(task);

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
      Task.create = jest.fn();
    });

    afterEach(() => {
      validateChildIds.mockClear();
      Task.create.mockClear();
    });

    it('creates and returns a task record', async () => {
      // Given
      const task = testHelper.mocks.task({ id: 123, childIds: [1, 2, 3] });
      const { name, description, amount, childIds } = task;
      ctx.data = { name, description, amount, childIds };
      validateChildIds.mockResolvedValue(null);
      Task.create.mockResolvedValueOnce(task);

      // When
      await post(ctx);

      // Then
      expect(ctx.body).toMatchObject({
        id: task.id,
        name,
        description,
        amount,
        childIds: task.childIds,
      });
      expect(validateChildIds).toHaveBeenCalledWith(familyId, childIds);
      expect(Task.create).toHaveBeenCalledWith({
        name,
        description,
        amount,
        childIds,
        familyId,
      });
    });

    it('throws error if child ids is not valid', async () => {
      // Given
      const task = testHelper.mocks.task({ id: 123, childIds: [1, 2, 3] });
      const { name, description, amount, childIds } = task;
      ctx.data = { name, description, amount, childIds };
      const error = createError.BadRequest('Invalid child id');
      validateChildIds.mockRejectedValueOnce(error);

      // When
      // Then
      await expect(post(ctx)).rejects.toThrow(error);
      expect(Task.create).not.toHaveBeenCalled();
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
      it('taskId', () => {
        expect(inputs.get.taskId.required).toEqual(true);
        expect(inputs.get.taskId.transformer('123')).toEqual(123);
        expect(inputs.get.taskId.validator('123')).toEqual(false);
        expect(inputs.get.taskId.validator(12.3)).toEqual(false);
        expect(inputs.get.taskId.validator(123)).toEqual(true);
      })
    });

    describe('complete', () => {
      it('taskId', () => {
        expect(inputs.complete.taskId.required).toEqual(true);
        expect(inputs.complete.taskId.transformer('123')).toEqual(123);
        expect(inputs.complete.taskId.validator('123')).toEqual(false);
        expect(inputs.complete.taskId.validator(12.3)).toEqual(false);
        expect(inputs.complete.taskId.validator(123)).toEqual(true);
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
