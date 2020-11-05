jest.mock('@models');
jest.mock('validator');

const { authenticate, inputs } = require('@controllers/authController');
const { Member } = require('@models');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const validator = require('validator');
const testHelper = require('@testHelper');

describe('authController', () => {
  describe('authenticate', function () {
    const member = testHelper.mocks.member();
    const { email, password, memberId, familyId } = member;

    beforeAll(() => {
      Member.findOne = jest.fn();
    });

    afterEach(() => {
      Member.findOne.mockClear();
    });

    it('signs and returns token', async () => {
      // Given
      Member.findOne.mockResolvedValueOnce(member);
      const ctx = {
        data: { email, password },
      };

      // When
      await authenticate(ctx);

      // Then
      expect(Member.findOne).toHaveBeenCalledWith({
        where: { email, password },
      });
      expect(ctx.body).toMatchObject({
        token: jwt.sign({ memberId, familyId }, process.env.ENCRYPTION_KEY),
      });
    });

    it('throws error if member not found', async () => {
      // Given
      Member.findOne.mockResolvedValueOnce(null);
      const ctx = {
        data: { email, password },
      };

      // When
      // Then
      await expect(authenticate(ctx)).rejects.toThrowError(
        createError.Unauthorized()
      );
    });
  });

  describe('inputs', () => {
    describe('authenticate', () => {
      const { authenticate } = inputs;
      const email = 'johndoe123@gmail.com';
      const password = 'aVeryStrongPassword123@#$';

      it('email is required', () => {
        expect(authenticate.email.required).toBeTruthy();
      });

      it('email is normalized', () => {
        // When
        authenticate.email.transformer(email);

        // Then
        expect(validator.normalizeEmail).toHaveBeenCalledWith(email);
      });

      it('email is validated', () => {
        // When
        authenticate.email.validator(email);

        // Then
        expect(validator.isEmail).toHaveBeenCalledWith(email);
      });

      it('password is required', () => {
        expect(authenticate.password.required).toBeTruthy();
      });

      it('password is validated', () => {
        // When
        authenticate.password.validator(password);

        // Then
        expect(validator.isLength).toHaveBeenCalledWith(password, {
          min: 8,
          max: 50,
        });
      });
    });
  });
});
