import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.message,
      details: err.details,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({ error: 'Resource already exists' });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({ error: 'Route not found' });
}
