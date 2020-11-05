const {
  getFilterScopes,
  getPaginationScope,
  getScopes,
} = require('@utils/scopeUtils');
const { Op } = require('sequelize');

describe('scopeUtils', () => {
  describe('getFilterScopes', () => {
    const field1 = 'column1';
    const value1 = 'value1';
    const field2 = 'column2';
    const value2 = 'value2';

    it.each([
      ['eq', Op.eq],
      ['not', Op.not],
      ['lt', Op.lt],
      ['lte', Op.lte],
      ['gt', Op.gt],
      ['gte', Op.gte],
      ['in', Op.in],
    ])(
      'returns filter scopes input with `%s` operator',
      (operator, sequelizeOperator) => {
        // Given
        const filter = {
          [field1]: value1,
          [field2]: {
            [operator]: value2,
          },
        };

        // When
        const scope = getFilterScopes(filter);

        // Then
        expect(scope).toMatchObject([
          { method: ['filter', field1, value1] },
          { method: ['filter', field2, value2, sequelizeOperator] },
        ]);
      }
    );

    it.each([
      ['string', 'abc'],
      ['array', []],
      ['number', 1],
      ['float', 1.234],
      ['null', null],
    ])('handles implied operator with %s type', (valueType, value) => {
      // Given
      const filter = { [field1]: value };

      // When
      const scopes = getFilterScopes(filter);

      // Then
      expect(scopes).toMatchObject([{ method: ['filter', field1, value] }]);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty object', {}],
    ])('returns empty array if filter is %s', (inputType, filter) => {
      expect(getFilterScopes(filter)).toHaveLength(0);
    });

    it('throws error if provided operator is not supported', () => {
      // Given
      const operator = 'notSupportedOperator';
      const filter = {
        [field1]: {
          [operator]: value1,
        },
      };

      // When
      // Then
      expect(() => getFilterScopes(filter)).toThrowError(
        `${operator} is not supported`
      );
    });
  });

  describe('getPaginationScope', () => {
    const page = 2;
    const size = 25;

    it('returns pagination scope input', () => {
      // Given
      const sort = {
        column1: 'ASC',
        id: 'DESC',
      };

      // When
      const scope = getPaginationScope(page, size, sort);

      // Then
      expect(scope).toMatchObject({
        method: ['pagination', size, (page - 1) * size, Object.entries(sort)],
      });
    });

    it('returns pagination scope input with default values', () => {
      // Given
      // When
      const scope = getPaginationScope();

      // Then
      expect(scope).toMatchObject({
        method: ['pagination', 10, 0, [['id', 'ASC']]],
      });
    });

    it('adds `id: ASC` to sort if not present', () => {
      // Given
      const sort = {
        rank: 'ASC',
      };

      // When
      const scope = getPaginationScope(page, size, sort);

      // Then
      expect(scope).toMatchObject({
        method: [
          'pagination',
          size,
          (page - 1) * size,
          [...Object.entries(sort), ['id', 'ASC']],
        ],
      });
    });
  });

  describe('getScopes', () => {
    it('returns default values', () => {
      // Given
      // When
      const scopes = getScopes();

      // Then
      expect(scopes).toMatchObject([
        { method: ['pagination', 10, 0, [['id', 'ASC']]] },
      ]);
    });

    it('return flattened scopes', () => {
      // Given
      const filter = {
        field1: { eq: 'value1' },
        field2: { eq: 'value2' },
      };
      const page = 2;
      const size = 10;
      const sort = { id: 'desc' };

      // When
      const scopes = getScopes(filter, sort, page, size);

      // Then
      expect(scopes).toMatchObject([
        { method: ['filter', 'field1', 'value1', Op.eq] },
        { method: ['filter', 'field2', 'value2', Op.eq] },
        { method: ['pagination', 10, 10, [['id', 'desc']]] },
      ]);
    });
  });
});
