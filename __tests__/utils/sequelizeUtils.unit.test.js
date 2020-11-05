const {
  filterScope,
  paginationScope,
  SCOPES,
} = require('@utils/sequelizeUtils');
const { Op } = require('sequelize');

describe('sequelizeUtils', () => {
  describe('filterScope', () => {
    const field = 'column1'
    const value = 'value1'

    it('returns where clause', () => {
      // Given
      const operator = Op.gt;

      // When
      const res = filterScope(field, value, operator);

      // Then
      expect(res).toMatchObject({
        where: {
          [field]: {
            [operator]: value,
          },
        },
      });
    });

    it('returns where clause without providing operator', () => {
      // Given
      // When
      const res = filterScope(field, value);

      // Then
      expect(res).toMatchObject({
        where: {
          [field]: value,
        },
      });
    });
  });

  describe('pagination scope', () => {
    const limit = 25
    const offset = 75;

    it('returns sorting clause', () => {
      // Given
      const order = [
        ['column1', 'ASC'],
        ['id', 'ASC'],
      ];

      // When
      const res = paginationScope(limit, offset, order);

      // Then
      expect(res).toMatchObject({
        limit,
        offset,
        order,
      });
    });

    it('returns sorting clause with default values', () => {
      // Given
      // When
      const res = paginationScope();

      // Then
      expect(res).toMatchObject({
        limit: 10,
        offset: 0,
        order: [],
      });
    });
  });

  describe('scope names', () => {
    it('matches original names', () => {
      expect(SCOPES).toMatchObject({
        FILTER: 'filter',
        PAGINATION: 'pagination',
      });
    });
  });
});
