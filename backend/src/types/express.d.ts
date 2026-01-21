export interface JwtPayload {
  sub: string;  // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
