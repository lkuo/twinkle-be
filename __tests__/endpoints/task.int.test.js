const { Statement } = require('@models');
const supertest = require('supertest');
const testHelper = require('@testHelper');

describe('api/task', () => {
  const request = supertest(global.BASE_URL);
  let tasks = [];
  let childIds = [];
  let notAccessibleTask = null;

  beforeAll(async () => {
    const children = await Promise.all([
      testHelper.createChild({ familyId: global.familyId }),
      testHelper.createChild({ familyId: global.familyId }),
      testHelper.createChild({ familyId: global.familyId })
    ]);
    childIds = children.map((child) => child.id);
    tasks = [
      await testHelper.createTask({ familyId: global.familyId, childIds }),
      await testHelper.createTask({ familyId: global.familyId, childIds: [] })
    ];
    notAccessibleTask = await testHelper.createTask();
  });

  afterAll(async () => {
    await testHelper.dropAllModels();
  });

  it('GET /task/:taskId 200', async () => {
    // Given
    const task = tasks[0];

    // When
    const { body } = await request
      .get(`/task/${task.id}`)
      .set(global.getAuthHeader())
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: task.id,
      name: task.name,
      description: task.description,
      amount: task.amount
    });
  });

  it('GET /task/:taskId 404', async () => {
    // Given
    const taskId = notAccessibleTask.id;

    // When
    // Then
    await request
      .get(`/task/${taskId}`)
      .set(global.getAuthHeader())
      .expect(404);
  });

  it('GET /task 200', async () => {
    // Given
    // When
    const { body } = await request
      .get('/task')
      .set(global.getAuthHeader())
      .expect(200);

    // Then
    expect(body).toHaveLength(tasks.length);
    for (let i = 0; i < tasks.length; i++) {
      expect(body[i]).toMatchObject({
        id: expect.any(Number),
        name: tasks[i].name,
        description: tasks[i].description,
        amount: tasks[i].amount
      });
    }
  });

  it('POST /tasks 200', async () => {
    // Given
    const task = {
      name: 'task',
      description: 'task description',
      amount: 2,
      childIds
    };

    // When
    const { body } = await request
      .post('/task')
      .set(global.getAuthHeader())
      .send({ ...task, childIds })
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: expect.any(Number),
      name: task.name,
      description: task.description,
      amount: task.amount,
      childIds
    });
  });

  it('POST /task/:taskId/complete 200', async () => {
    // Given
    const task = tasks[0];

    // When
    await request
      .post(`/task/${task.id}/complete`)
      .set(global.getAuthHeader())
      .send({ childId: childIds[0] })
      .expect(200);

    // Then
    const statements = await Statement.findAll({
      where: { familyId: global.familyId }
    });
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({
      id: expect.any(Number),
      childId: childIds[0],
      familyId: global.familyId,
      amount: task.amount,
      actorId: global.memberId,
      metadata: expect.objectContaining({
        id: task.id,
      })
    });
  });
});
