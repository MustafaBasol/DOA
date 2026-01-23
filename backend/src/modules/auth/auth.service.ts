import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is inactive');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        language: user.language,
      },
    };
  }

  async logout(userId: string, token: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AppError(401, 'Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new AppError(401, 'Refresh token expired');
    }

    if (!tokenRecord.user.isActive) {
      throw new AppError(403, 'Account is inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    return { accessToken };
  }
}
