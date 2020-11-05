const { get } = require('@controllers/statusController');

describe('statusController', () => {
  it('returns 200', async () => {
    // Given
    const ctx = {};

    // When
    await get(ctx);

    // Then
    expect(ctx.status).toEqual(200);
  });
});
