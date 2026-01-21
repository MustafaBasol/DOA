import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const refreshToken = req.body.refreshToken;
      const result = await authService.logout(userId, refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}
