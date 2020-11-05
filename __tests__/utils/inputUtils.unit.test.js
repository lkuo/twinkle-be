const { nameValidator, fields } = require('@utils/inputUtils');

describe('inputUtils', () => {
  describe('nameValidator', () => {
    it(`validates name contains only a-zA-z,.'- and space`, () => {
      // Given
      const cases = [
        ['a', false], // min length 2
        ['abcdefghijklmnopqrstuvwxyz', false], // max length 25
        [null, false],
        [undefined, false],
        [NaN, false],
        [{}, false],
        ['123', false], // contains invalid character
        ['abc$', false],
        ["abc ,.'-", true],
      ];

      // When
      // Then
      for (const [input, expected] of cases) {
        try {
          expect(nameValidator(input)).toBe(expected);
        } catch (e) {
          expect(expected).toBeFalsy();
        }
      }
    });
  });

  describe('fields', () => {
    it('validates id', () => {
      // Given
      const id = fields.id;
      // When
      // Then
      expect(id.required).toBeTruthy();
      expect(id.transformer('123')).toEqual(123);
      expect(id.transformer('123.34')).toEqual(123);
      expect(id.validator(123)).toBeTruthy();
      expect(id.validator(123.45)).toBeFalsy();
      expect(id.validator('123')).toBeFalsy();
    });

    it('validates ids', () => {
      // Given
      const ids = fields.ids;

      // When
      // Then
      expect(ids.defaultValue).toMatchObject([]);
      expect(ids.validator([1, 2, 3])).toBeTruthy();
      expect(ids.validator([1, 2, '3'])).toBeFalsy();
    });
  });
});
