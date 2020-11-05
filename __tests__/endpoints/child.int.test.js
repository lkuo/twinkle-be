const supertest = require('supertest');
const testHelper = require('@testHelper');

describe('api/child', () => {
  const request = supertest(global.BASE_URL);
  const familyId = 234;
  let children = [];
  let notAccessibleChild = null;

  beforeAll(async () => {
    children = [
      await testHelper.createChild({ familyId }),
      await testHelper.createChild({ familyId }),
    ];
    // from another family, should not show
    notAccessibleChild = await testHelper.createChild();
  });

  it('GET /:childId 404', async () => {
    // Given
    const childId = notAccessibleChild.id;

    // When
    // Then
    await request
      .get(`/child/${childId}`)
      .set(global.getAuthHeader())
      .expect(404);
  });

  it('GET /:childId 200', async () => {
    // Given
    const child = children[0];

    // When
    const { body } = await request
      .get(`/child/${child.id}`)
      .set(global.getAuthHeader({ familyId }))
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
    });
  });

  it('GET /child 200', async () => {
    // Given
    // When
    const { body } = await request
      .get('/child')
      .set(global.getAuthHeader({ familyId }))
      .expect(200);

    // Then
    expect(body).toHaveLength(children.length);
    for (let i = 0; i < children.length; i++) {
      expect(body[i]).toMatchObject({
        id: children[i].id,
        firstName: children[i].firstName,
        lastName: children[i].lastName,
      });
    }
  });

  it('POST /child', async () => {
    // Given
    const child = {
      firstName: 'John',
      lastName: 'Doe',
    };

    // When
    const { body } = await request
      .post('/child')
      .set(global.getAuthHeader({ familyId }))
      .send(child)
      .expect(200);

    // Then
    expect(body).toMatchObject(child);
  });
});
