const { validate, required } = require('@utils/validationUtils');
const R = require('ramda');

describe('validationUtils', () => {
  describe('validate', () => {
    it('throws error if schema not provided', async () => {
      // Given
      const cases = [null, undefined];
      const input = {};

      // When
      // Then
      for (const schema of cases) {
        await expect(validate(schema, input)).rejects.toThrow(
          'schema is required'
        );
      }
    });

    it('throws error if input not provided', async () => {
      // Given
      const cases = [null, undefined];
      const schema = { a: {} };

      // When
      // Then
      for (const input of cases) {
        await expect(validate(schema, input)).rejects.toThrow(
          'input is required'
        );
      }
    });

    it('picks defined fields', async () => {
      // Given
      const schema = {
        a: {},
      };
      const input = { a: 1, b: 2, c: 3 };

      // When
      const output = await validate(schema, input);

      // Then
      expect(output.hasOwnProperty('a')).toBeTruthy();
      expect(output.hasOwnProperty('b')).toBeFalsy();
      expect(output.hasOwnProperty('c')).toBeFalsy();
    });

    it('throws error if missing required field', async () => {
      // Given
      const schema = {
        id: {
          required: true,
        },
      };
      const input = {
        b: 5,
      };

      // When
      // Then
      await expect(validate(schema, input)).rejects.toThrow('id is required');
    });

    it('set default value if field undefined', async () => {
      // Given
      const defaultValue = 'N/A';
      const schema = {
        id: {
          required: true,
        },
        name: {
          defaultValue,
        },
      };
      const input = {
        id: 1,
      };

      // When
      const res = await validate(schema, input);

      // Then
      expect(res).toMatchObject({
        ...input,
        name: defaultValue,
      });
    });

    it('not set default value if field is null', async () => {
      // Given
      const schema = {
        id: {
          required: true,
        },
        name: {
          defaultValue: 'N/A',
        },
      };
      const input = {
        id: 1,
        name: null,
      };

      // When
      const res = await validate(schema, input);

      // Then
      expect(res).toMatchObject({
        ...input,
        name: null,
      });
    });

    it('transforms fields', async () => {
      // Given
      const arrTransformer = R.reject(R.isNil);
      const stringTransformer = R.toUpper;
      const schema = {
        arr: {
          required: true,
          transformer: arrTransformer,
        },
        str: {
          required: true,
          transformer: stringTransformer,
        },
      };
      const input = {
        arr: [null, 1, 2, undefined],
        str: 'abcDEF',
      };

      // When
      const res = await validate(schema, input);

      // Then
      expect(res).toMatchObject({
        arr: arrTransformer(input.arr),
        str: stringTransformer(input.str),
      });
    });

    it('validates required fields', async () => {
      // Given
      const validator = (number) => number >= 0;
      const schema = {
        num: {
          required: true,
          validator,
        },
      };
      const input = {
        num: -1,
      };

      // When
      // Then
      await expect(validate(schema, input)).rejects.toThrow(`num is invalid`);
    });

    it('does not validate optional fields', async () => {
      // Given
      const validator = (number) => number >= 0;
      const schema = {
        id: {
          required: true,
          validator,
        },
        num: {
          validator,
        },
      };
      const input = {
        id: 1,
      };

      // When
      const res = await validate(schema, input);

      // Then
      expect(res).toMatchObject(input);
    });

    it('validates nested object', async () => {
      // Given
      const schema = {
        obj: {
          schema: {
            id: {
              required: true,
              transformer: (id) => Number.parseInt(id, 10),
              validator: (id) => Number.isInteger(id) && id > 0,
            },
            name: {
              defaultValue: 'N/A',
              transformer: R.trim,
              validator: (name) => typeof name === 'string' && name.length > 2,
            },
          },
        },
      };
      const input = {
        obj: {
          id: 2,
        },
      };

      // When
      const res = await validate(schema, input);

      // Then
      expect(res).toMatchObject({
        obj: {
          id: 2,
          name: 'N/A',
        },
      });
    });

    it('throws error if depth exceeds cap', async () => {
      // Given
      const schema = {
        obj: {
          schema: {
            obj: {
              schema: {
                obj: {
                  schema: {
                    obj: {
                      schema: {
                        obj: {
                          schema: {
                            obj: {
                              schema: {
                                id: {
                                  required: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const input = {
        obj: { obj: { obj: { obj: { obj: { obj: { id: 1 } } } } } },
      };

      // When
      // Then
      await expect(validate(schema, input)).rejects.toThrow(
        'input depth exceeds 5'
      );
    });
  });

  describe('required', () => {
    it('throws error if value is nil', () => {
      // Given
      const cases = [null, undefined];
      const name = 'field';

      // When
      // Then
      for (const value of cases) {
        expect(() => required(value, name)).toThrow(`${name} is required`);
      }
    });

    it('throws error with default name if value is nil', () => {
      // Given
      const cases = [null, undefined];

      // When
      // Then
      for (const value of cases) {
        expect(() => required(value)).toThrow(`parameter is required`);
      }
    });

    it('returns false if set not to throw errors', () => {
      // Given
      const cases = [null, undefined];
      const name = 'field';

      // When
      // Then
      for (const value of cases) {
        expect(required(value, name, false)).toBeFalsy();
      }
    });

    it('does not throw error if value is defined', () => {
      // Given
      const cases = [1, 'str', {}, () => {}, new Map(), new Set(), []];
      // When
      // Then
      for (const value of cases) {
        expect(required(value, 'name', false)).toBeTruthy();
      }
    });
  });
});
