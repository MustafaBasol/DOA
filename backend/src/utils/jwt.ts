import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import { JwtPayload } from '../types/express';

export function generateAccessToken(payload: {
  id: string;
  email: string;
  role: string;
}): string {
  const jwtPayload: JwtPayload = {
    sub: payload.id,
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  return jwt.sign(jwtPayload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessExpiry as any,
  });
}

export function generateRefreshToken(payload: {
  id: string;
  email: string;
  role: string;
}): string {
  const jwtPayload: JwtPayload = {
    sub: payload.id,
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  return jwt.sign(jwtPayload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiry as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
