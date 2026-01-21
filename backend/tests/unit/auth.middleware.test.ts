import { Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../../src/middleware/auth';
import * as jwtUtils from '../../src/utils/jwt';

jest.mock('../../src/utils/jwt');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and call next', () => {
      const mockDecoded = {
        sub: 'user123',
        id: 'user123',
        email: 'test@test.com',
        role: 'CLIENT'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-here'
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-token-here');
      expect(mockRequest.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Basic some-token'
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      mockRequest.user = {
        sub: 'user123',
        id: 'user123',
        email: 'admin@test.com',
        role: 'ADMIN'
      };

      const middleware = authorize('ADMIN', 'SUPER_ADMIN');
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authorize user with one of allowed roles', () => {
      mockRequest.user = {
        sub: 'user123',
        id: 'user123',
        email: 'client@test.com',
        role: 'CLIENT'
      };

      const middleware = authorize('ADMIN', 'CLIENT');
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = authorize('ADMIN');
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role not in allowed roles', () => {
      mockRequest.user = {
        sub: 'user123',
        id: 'user123',
        email: 'client@test.com',
        role: 'CLIENT'
      };

      const middleware = authorize('ADMIN', 'SUPER_ADMIN');
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple allowed roles', () => {
      mockRequest.user = {
        sub: 'user123',
        id: 'user123',
        email: 'manager@test.com',
        role: 'MANAGER'
      };

      const middleware = authorize('ADMIN', 'MANAGER', 'SUPER_ADMIN');
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for role matching', () => {
      mockRequest.user = {
        sub: 'user123',
        id: 'user123',
        email: 'admin@test.com',
        role: 'ADMIN'
      };

      const middleware = authorize('admin'); // lowercase
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
