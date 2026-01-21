import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('AppError', () => {
    it('should create AppError with statusCode, message, and details', () => {
      const error = new AppError(400, 'Bad Request', { field: 'email' });

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create AppError without details', () => {
      const error = new AppError(401, 'Unauthorized');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error.details).toBeUndefined();
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with status code and details', () => {
      const error = new AppError(400, 'Validation failed', { field: 'email', reason: 'invalid format' });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: { field: 'email', reason: 'invalid format' }
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });

    it('should handle AppError without details', () => {
      const error = new AppError(404, 'User not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found',
        details: undefined
      });
    });

    it('should handle Prisma P2002 error (unique constraint)', () => {
      const prismaError: any = new Error('Unique constraint failed');
      prismaError.name = 'PrismaClientKnownRequestError';
      prismaError.code = 'P2002';

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Resource already exists' });
    });

    it('should handle Prisma P2025 error (record not found)', () => {
      const prismaError: any = new Error('Record not found');
      prismaError.name = 'PrismaClientKnownRequestError';
      prismaError.code = 'P2025';

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Resource not found' });
    });

    it('should handle generic Error in production (no message)', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: undefined
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic Error in development (with message)', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Database connection failed'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle 401 Unauthorized AppError', () => {
      const error = new AppError(401, 'Invalid credentials');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
        details: undefined
      });
    });

    it('should handle 403 Forbidden AppError', () => {
      const error = new AppError(403, 'Access denied');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
        details: undefined
      });
    });

    it('should log error to console', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with error message', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Route not found' });
    });

    it('should not call next middleware', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
