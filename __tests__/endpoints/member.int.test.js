const supertest = require('supertest');
const testHelper = require('@testHelper');
const { Member, Family } = require('@models');
const validator = require('validator');

describe('api/member', () => {
  const request = supertest(global.BASE_URL);

  afterEach(async () => {
    await testHelper.dropAllModels();
  });

  it('GET /:memberId', async () => {
    // Given
    const member = await testHelper.createMember();
    const memberId = member.id;

    // When
    const { body } = await request
      .get(`/member/${memberId}`)
      .set(global.getAuthHeader(member))
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      avatar: member.avatar,
      familyId: member.familyId,
    });
  });

  it('POST /member', async () => {
    // Given
    const member = testHelper.mocks.member();

    // When
    const { body } = await request
      .post('/member')
      .send({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        password: member.password,
        avatar: member.avatar,
      })
      .expect(200);

    // Then
    expect(body).toMatchObject({
      id: expect.any(Number),
      firstName: member.firstName,
      lastName: member.lastName,
      email: validator.normalizeEmail(member.email.toLocaleLowerCase()),
      avatar: member.avatar,
      familyId: expect.any(Number),
    });
    await expect(Member.findByPk(body.id)).resolves.toBeDefined();
    await expect(Family.findByPk(body.familyId)).resolves.toBeDefined();
  });
});
