import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../../src/modules/auth/auth.validation';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { error, value } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Email is required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Please provide a valid email address');
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Password is required');
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user+tag@example.co.uk',
        'first.last@sub.domain.com',
      ];

      validEmails.forEach((email) => {
        const { error } = loginSchema.validate({ email, password: 'pass' });
        expect(error).toBeUndefined();
      });
    });

    it('should strip unknown fields', () => {
      const dataWithExtra = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be removed',
      };

      const { value } = loginSchema.validate(dataWithExtra, { stripUnknown: true });

      expect(value).not.toHaveProperty('extraField');
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token', () => {
      const validData = {
        refreshToken: 'valid.jwt.token',
      };

      const { error, value } = refreshTokenSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing refresh token', () => {
      const invalidData = {};

      const { error } = refreshTokenSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Refresh token is required');
    });

    it('should reject empty string refresh token', () => {
      const invalidData = {
        refreshToken: '',
      };

      const { error } = refreshTokenSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not allowed to be empty');
    });

    it('should accept long JWT tokens', () => {
      const longToken = 'a'.repeat(500);
      const data = { refreshToken: longToken };

      const { error } = refreshTokenSchema.validate(data);

      expect(error).toBeUndefined();
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid password change data', () => {
      const validData = {
        oldPassword: 'oldPass123',
        newPassword: 'newPass456',
      };

      const { error, value } = changePasswordSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing old password', () => {
      const invalidData = {
        newPassword: 'newPass456',
      };

      const { error } = changePasswordSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Current password is required');
    });

    it('should reject missing new password', () => {
      const invalidData = {
        oldPassword: 'oldPass123',
      };

      const { error } = changePasswordSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('New password is required');
    });

    it('should reject new password shorter than 8 characters', () => {
      const invalidData = {
        oldPassword: 'oldPass123',
        newPassword: 'short',
      };

      const { error } = changePasswordSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('New password must be at least 8 characters long');
    });

    it('should accept new password exactly 8 characters', () => {
      const validData = {
        oldPassword: 'oldPass123',
        newPassword: '12345678',
      };

      const { error } = changePasswordSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept passwords with special characters', () => {
      const validData = {
        oldPassword: 'old@Pass#123',
        newPassword: 'new$Pass%456',
      };

      const { error } = changePasswordSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should handle empty string passwords', () => {
      const invalidData = {
        oldPassword: '',
        newPassword: '',
      };

      const { error } = changePasswordSchema.validate(invalidData);

      expect(error).toBeDefined();
      // Should have errors for both fields
      expect(error?.details.length).toBeGreaterThan(0);
    });
  });
});
