import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class UsersService {
  async createUser(data: any, createdByUserId: string) {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(400, 'Weak password', passwordValidation.errors);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user (always as CLIENT role)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: Role.CLIENT,
        fullName: data.fullName,
        companyName: data.companyName,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        language: data.language || 'TR',
        createdByUserId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        companyName: true,
        phone: true,
        whatsappNumber: true,
        language: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          role: Role.CLIENT,
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { role: Role.CLIENT };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          phone: true,
          whatsappNumber: true,
          language: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        companyName: true,
        phone: true,
        whatsappNumber: true,
        language: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async updateUser(id: string, data: any) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        companyName: data.companyName,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        language: data.language,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        companyName: true,
        phone: true,
        whatsappNumber: true,
        language: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteUser(id: string) {
    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async updateProfile(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        companyName: data.companyName,
        phone: data.phone,
        language: data.language,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        companyName: true,
        phone: true,
        language: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(400, 'Weak password', passwordValidation.errors);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getStats() {
    const [total, clients, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      total,
      clients,
      admins,
    };
  }
}
