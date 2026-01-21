// Integration tests for Auth API endpoints
import request from 'supertest';
import express from 'express';
import { authRouter } from '../../src/modules/auth/auth.routes';
import { prisma } from '../../src/config/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
        role: 'CLIENT',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', newUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordUser = {
        email: 'test@test.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        role: 'CLIENT',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = {
        email: 'existing@test.com',
        password: 'Password123',
        firstName: 'Existing',
        lastName: 'User',
        role: 'CLIENT',
      };

      // First registration
      await request(app).post('/api/auth/register').send(existingUser);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app).post('/api/auth/register').send({
        email: 'login@test.com',
        password: 'Password123',
        firstName: 'Login',
        lastName: 'Test',
        role: 'CLIENT',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'Password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'login@test.com');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login
      await request(app).post('/api/auth/register').send({
        email: 'profile@test.com',
        password: 'Password123',
        firstName: 'Profile',
        lastName: 'Test',
        role: 'CLIENT',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@test.com',
          password: 'Password123',
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', 'profile@test.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'update@test.com',
        password: 'Password123',
        firstName: 'Update',
        lastName: 'Test',
        role: 'CLIENT',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'update@test.com',
          password: 'Password123',
        });

      authToken = loginResponse.body.data.token;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        language: 'EN',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.language).toBe('EN');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'changepass@test.com',
        password: 'OldPassword123',
        firstName: 'Change',
        lastName: 'Password',
        role: 'CLIENT',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepass@test.com',
          password: 'OldPassword123',
        });

      authToken = loginResponse.body.data.token;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepass@test.com',
          password: 'NewPassword123',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });

    it('should return 401 with incorrect old password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'WrongOldPassword',
          newPassword: 'NewPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'OldPassword123',
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'refresh@test.com',
        password: 'Password123',
        firstName: 'Refresh',
        lastName: 'Test',
        role: 'CLIENT',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'Password123',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
