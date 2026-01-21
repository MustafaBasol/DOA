import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../src/utils/jwt';
import { jwtConfig } from '../../src/config';

describe('JWT Utils', () => {
  const mockPayload = {
    id: 'user123',
    email: 'test@example.com',
    role: 'CLIENT'
  };

  describe('generateAccessToken', () => {
    it('should generate valid access token with correct payload', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token structure
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      expect(decoded.sub).toBe('user123');
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('CLIENT');
    });

    it('should include expiration in access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        id: 'user456',
        email: 'other@example.com',
        role: 'ADMIN'
      });

      expect(token1).not.toBe(token2);
    });

    it('should handle ADMIN role', () => {
      const adminPayload = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      const token = generateAccessToken(adminPayload);
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token with correct payload', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      expect(decoded.sub).toBe('user123');
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('CLIENT');
    });

    it('should include expiration in refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different refresh tokens for different users', () => {
      const token1 = generateRefreshToken(mockPayload);
      const token2 = generateRefreshToken({
        id: 'user789',
        email: 'another@example.com',
        role: 'CLIENT'
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.sub).toBe('user123');
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('CLIENT');
    });

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.sub).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyToken('not-a-jwt-token');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', () => {
      expect(() => {
        verifyToken('');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong signature', () => {
      const token = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '1h' });

      expect(() => {
        verifyToken(token);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { ...mockPayload, sub: mockPayload.id },
        jwtConfig.secret,
        { expiresIn: '0s' } // Expired immediately
      );

      // Wait a moment to ensure token is expired
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => {
            verifyToken(expiredToken);
          }).toThrow('Invalid or expired token');
          resolve(undefined);
        }, 100);
      });
    });

    it('should verify token with all required fields', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('token payload consistency', () => {
    it('should maintain payload consistency between access and refresh tokens', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      const accessDecoded = verifyToken(accessToken);
      const refreshDecoded = verifyToken(refreshToken);

      expect(accessDecoded.sub).toBe(refreshDecoded.sub);
      expect(accessDecoded.email).toBe(refreshDecoded.email);
      expect(accessDecoded.role).toBe(refreshDecoded.role);
    });

    it('should handle special characters in email', () => {
      const specialPayload = {
        id: 'user123',
        email: 'test+special@example.co.uk',
        role: 'CLIENT'
      };

      const token = generateAccessToken(specialPayload);
      const decoded = verifyToken(token);

      expect(decoded.email).toBe('test+special@example.co.uk');
    });

    it('should preserve role case sensitivity', () => {
      const payload1 = { ...mockPayload, role: 'ADMIN' };
      const payload2 = { ...mockPayload, role: 'admin' };

      const token1 = generateAccessToken(payload1);
      const token2 = generateAccessToken(payload2);

      const decoded1 = verifyToken(token1);
      const decoded2 = verifyToken(token2);

      expect(decoded1.role).toBe('ADMIN');
      expect(decoded2.role).toBe('admin');
      expect(decoded1.role).not.toBe(decoded2.role);
    });
  });
});
