import { Request } from 'express';

export interface JwtPayload {
  sub: string;  // user id
  id: string;   // user id alias for backward compatibility
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
