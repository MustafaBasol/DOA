import { AuthService } from '../../src/modules/auth/auth.service';
import { prismaMock } from '../setup';
import * as passwordUtils from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';
import { AppError } from '../../src/middleware/errorHandler';

// Mock the utility modules
jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  role: 'CLIENT',
  isActive: true,
  fullName: 'Test User',
  companyName: 'Test Company',
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      prismaMock.refreshToken = { create: jest.fn().mockResolvedValue({}) } as any;

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should throw error for invalid email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password123')).rejects.toThrow(
        AppError
      );
      await expect(authService.login('invalid@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prismaMock.user.findUnique.mockResolvedValue(inactiveUser as any);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        AppError
      );
      await expect(authService.login('test@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 403,
        message: 'Account is inactive',
      });
    });

    it('should throw error for invalid password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        AppError
      );
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      prismaMock.refreshToken = {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      } as any;

      await authService.logout('user-123', 'refresh-token');

      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          token: 'refresh-token',
        },
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockRefreshToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        createdAt: new Date(),
      };

      prismaMock.refreshToken = {
        findFirst: jest.fn().mockResolvedValue(mockRefreshToken),
      } as any;
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
      });
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');

      const result = await authService.refreshAccessToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
      });
      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw error for invalid refresh token', async () => {
      prismaMock.refreshToken = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error for expired refresh token', async () => {
      const expiredToken = {
        id: 'token-123',
        userId: 'user-123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        createdAt: new Date(),
      };

      prismaMock.refreshToken = {
        findFirst: jest.fn().mockResolvedValue(expiredToken),
      } as any;
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
      });

      await expect(authService.refreshAccessToken('expired-token')).rejects.toThrow(
        AppError
      );
      await expect(authService.refreshAccessToken('expired-token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Refresh token expired',
      });
    });
  });
});
