const { Statement } = require('@models');
const supertest = require('supertest');
const testHelper = require('@testHelper');

describe('api/reward', () => {
  const request = supertest(global.BASE_URL);
  let rewards = [];
  let childIds = [];
  let notAccessibleReward = null;

  beforeAll(async () => {
    const children = await Promise.all([
      testHelper.createChild({ familyId: global.familyId }),
      testHelper.createChild({ familyId: global.familyId }),
      testHelper.createChild({ familyId: global.familyId }),
    ]);
    childIds = children.map((child) => child.id);
    rewards = [
      await testHelper.createReward({ familyId: global.familyId, childIds }),
      await testHelper.createReward({
        familyId: global.familyId,
        childIds: [],
      }),
    ];
    notAccessibleReward = await testHelper.createReward();
  });

  it('GET /reward/:rewardId 200', async () => {
    // Given
    const reward = rewards[0];

    // When
    const { body } = await request
      .get(`/reward/${reward.id}`)
      .set(global.getAuthHeader())
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      amount: reward.amount,
    });
  });

  it('GET /reward/:rewardId 404', async () => {
    // Given
    const rewardId = notAccessibleReward.id;

    // When
    // Then
    await request
      .get(`/reward/${rewardId}`)
      .set(global.getAuthHeader())
      .expect(404);
  });

  it('GET /reward 200', async () => {
    // Given
    // When
    const { body } = await request
      .get('/reward')
      .set(global.getAuthHeader())
      .expect(200);

    // Then
    expect(body).toHaveLength(rewards.length);
    for (let i = 0; i < rewards.length; i++) {
      expect(body[i]).toMatchObject({
        id: expect.any(Number),
        name: rewards[i].name,
        description: rewards[i].description,
        amount: rewards[i].amount,
      });
    }
  });

  it('POST /reward 200', async () => {
    // Given
    const reward = {
      name: 'reward',
      description: 'reward description',
      amount: 2,
      childIds,
    };

    // When
    const { body } = await request
      .post('/reward')
      .set(global.getAuthHeader())
      .send(reward)
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: expect.any(Number),
      name: reward.name,
      description: reward.description,
      amount: reward.amount,
      childIds,
    });
  });

  it('POST /reward/:rewardId/complete 200', async () => {
    // Given
    const reward = rewards[0];

    // When
    await request
      .post(`/reward/${reward.id}/complete`)
      .set(global.getAuthHeader())
      .send({ childId: childIds[0] })
      .expect(200);

    // Then
    const statements = await Statement.findAll({
      where: { familyId: global.familyId },
    });
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatchObject({
      id: expect.any(Number),
      childId: childIds[0],
      familyId: global.familyId,
      amount: -1 * reward.amount,
      actorId: global.memberId,
      metadata: expect.objectContaining({
        id: reward.id,
      }),
    });
  });
});
