import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../../middleware/auth';

const usersService = new UsersService();

export class UsersController {
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createdByUserId = req.user!.sub;
      const user = await usersService.createUser(req.body, createdByUserId);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await usersService.getUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.deleteUser(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const user = await usersService.getUserById(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const user = await usersService.updateProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const { oldPassword, newPassword } = req.body;
      const result = await usersService.changePassword(userId, oldPassword, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await usersService.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  }
}
