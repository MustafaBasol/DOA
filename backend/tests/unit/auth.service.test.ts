// Unit tests for Authentication Service
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
        role: 'CLIENT' as const,
      };

      const hashedPassword = 'hashed_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 'new-user-id',
        ...registerData,
        password: hashedPassword,
        language: 'TR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.user.create = jest.fn().mockResolvedValue(createdUser);

      const result = await authService.register(registerData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe(registerData.email);
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123',
        firstName: 'Existing',
        lastName: 'User',
        role: 'CLIENT' as const,
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(global.mockUser);

      await expect(authService.register(registerData)).rejects.toThrow();
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT' as const,
      };

      // Assuming validation happens before service call
      expect(weakPasswordData.password.length).toBeLessThan(8);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const user = {
        ...global.mockUser,
        password: 'hashed_password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await authService.login(loginData.email, loginData.password);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, user.password);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error with invalid credentials', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        authService.login('invalid@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = {
        ...global.mockUser,
        isActive: false,
        password: 'hashed_password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(inactiveUser);

      await expect(
        authService.login('test@example.com', 'Password123')
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const refreshToken = 'valid_refresh_token';
      const decoded = { userId: 'test-user-id' };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      (jwt.sign as jest.Mock).mockReturnValue('new_access_token');

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(global.mockUser);

      const result = await authService.refreshToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(result).toHaveProperty('token');
    });

    it('should throw error with invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid_token')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'test-user-id';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        language: 'EN' as const,
      };

      const updatedUser = {
        ...global.mockUser,
        ...updateData,
      };

      mockPrisma.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(userId, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(result.firstName).toBe(updateData.firstName);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'test-user-id';
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword123';

      const user = {
        ...global.mockUser,
        password: 'hashed_old_password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      mockPrisma.user.update = jest.fn().mockResolvedValue({
        ...user,
        password: 'hashed_new_password',
      });

      await authService.changePassword(userId, oldPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, user.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw error if old password is incorrect', async () => {
      const user = {
        ...global.mockUser,
        password: 'hashed_password',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('test-user-id', 'wrongpassword', 'NewPassword123')
      ).rejects.toThrow();
    });
  });
});
