import * as bcrypt from 'bcryptjs';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password';

// Mock bcrypt for consistent testing
jest.mock('bcryptjs');

describe('Password Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt with 12 salt rounds', async () => {
      const password = 'TestPassword123';
      const mockHash = '$2a$12$mockHashedPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(mockHash);
    });

    it('should return different hashes for same password', async () => {
      const password = 'SamePassword123';

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('$2a$12$hash1')
        .mockResolvedValueOnce('$2a$12$hash2');

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(bcrypt.hash).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@ssw0rd!#$%';
      const mockHash = '$2a$12$specialCharsHash';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(mockHash);
    });

    it('should handle very long passwords', async () => {
      const password = 'A'.repeat(100) + '1!';
      const mockHash = '$2a$12$longPasswordHash';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(result).toBe(mockHash);
    });

    it('should handle empty string', async () => {
      const password = '';
      const mockHash = '$2a$12$emptyHash';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith('', 12);
      expect(result).toBe(mockHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'CorrectPassword123';
      const hash = '$2a$12$mockHashedPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'WrongPassword123';
      const hash = '$2a$12$mockHashedPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle special characters in password comparison', async () => {
      const password = 'P@ssw0rd!#$%';
      const hash = '$2a$12$specialHash';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for empty password against valid hash', async () => {
      const password = '';
      const hash = '$2a$12$validHash';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it('should handle case-sensitive password comparison', async () => {
      const password1 = 'Password123';
      const password2 = 'password123';
      const hash = '$2a$12$mockHash';

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result1 = await comparePassword(password1, hash);
      const result2 = await comparePassword(password2, hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const password = 'StrongPass123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const password = 'Short1';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const password = 'lowercase123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const password = 'UPPERCASE123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const password = 'NoNumberPass';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should validate password with special characters', () => {
      const password = 'ValidP@ss123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate exactly 8 character password', () => {
      const password = 'Valid123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
    });

    it('should reject empty password with all errors', () => {
      const password = '';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });

    it('should validate very long strong password', () => {
      const password = 'VeryLongStrongPassword123WithManyCharacters';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle password with only spaces', () => {
      const password = '        ';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate password with numbers at different positions', () => {
      const password1 = '1ValidPass';
      const password2 = 'ValidPass1';
      const password3 = 'Valid1Pass';

      expect(validatePasswordStrength(password1).valid).toBe(true);
      expect(validatePasswordStrength(password2).valid).toBe(true);
      expect(validatePasswordStrength(password3).valid).toBe(true);
    });

    it('should validate password with multiple uppercase and lowercase', () => {
      const password = 'MixedCasePassword123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
    });

    it('should validate password with multiple numbers', () => {
      const password = 'Password123456';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
    });
  });

  describe('password strength edge cases', () => {
    it('should handle unicode characters', () => {
      const password = 'Pässwörd123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
    });

    it('should handle password with emojis', () => {
      const password = 'ValidPass123😀';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
    });

    it('should reject password with only special characters', () => {
      const password = '!@#$%^&*';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});
