import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate - body validation', () => {
    const userSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      name: Joi.string().optional()
    });

    it('should pass validation with valid body data', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass validation with valid body and optional fields', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with missing required field', () => {
      mockRequest.body = {
        email: 'test@example.com'
        // password missing
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('required')
          })
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email format', () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('valid email')
          })
        ])
      });
    });

    it('should fail validation with password too short', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: '123'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('6')
          })
        ])
      });
    });

    it('should show multiple validation errors', () => {
      mockRequest.body = {
        email: 'invalid',
        password: '123'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' })
        ])
      });
    });

    it('should strip unknown fields with stripUnknown option', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        unknownField: 'should be removed'
      };

      const middleware = validate(userSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Note: Joi validation passes, unknown field is stripped
    });
  });

  describe('validate - query validation', () => {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().optional()
    });

    it('should pass validation with valid query params', () => {
      mockRequest.query = {
        page: '1',
        limit: '20',
        search: 'test'
      };

      const middleware = validate(querySchema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass validation with empty query params', () => {
      mockRequest.query = {};

      const middleware = validate(querySchema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with invalid page number', () => {
      mockRequest.query = {
        page: '0' // page must be >= 1
      };

      const middleware = validate(querySchema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'page'
          })
        ])
      });
    });

    it('should fail validation with limit exceeding max', () => {
      mockRequest.query = {
        limit: '150' // max is 100
      };

      const middleware = validate(querySchema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: expect.stringContaining('100')
          })
        ])
      });
    });
  });

  describe('validate - default to body', () => {
    const simpleSchema = Joi.object({
      name: Joi.string().required()
    });

    it('should default to body validation when source not specified', () => {
      mockRequest.body = { name: 'Test' };
      mockRequest.query = {};

      const middleware = validate(simpleSchema); // no source specified
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not validate query when defaulting to body', () => {
      mockRequest.body = { name: 'Test' };
      mockRequest.query = { name: 'Query Name' };

      const middleware = validate(simpleSchema); // defaults to body
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Body validation passes, query is ignored
    });
  });

  describe('validate - nested fields', () => {
    const nestedSchema = Joi.object({
      user: Joi.object({
        email: Joi.string().email().required(),
        profile: Joi.object({
          age: Joi.number().min(18).required()
        }).required()
      }).required()
    });

    it('should validate nested fields correctly', () => {
      mockRequest.body = {
        user: {
          email: 'test@example.com',
          profile: {
            age: 25
          }
        }
      };

      const middleware = validate(nestedSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should show nested field path in error', () => {
      mockRequest.body = {
        user: {
          email: 'test@example.com',
          profile: {
            age: 15 // under 18
          }
        }
      };

      const middleware = validate(nestedSchema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'user.profile.age'
          })
        ])
      });
    });
  });
});
