// Integration tests for Permission API endpoints
import request from 'supertest';
import express from 'express';
import permissionRouter from '../../src/routes/permission.routes';
import { authenticate } from '../../src/middleware/auth';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/permissions', authenticate, permissionRouter);

describe('Permission API Integration Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let clientToken: string;

  beforeAll(async () => {
    // Create test users and get tokens
    // Admin user
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'AdminPass123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'AdminPass123',
    });
    adminToken = adminLogin.body.data.token;

    // Manager user
    await request(app).post('/api/auth/register').send({
      email: 'manager@test.com',
      password: 'ManagerPass123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
    });

    const managerLogin = await request(app).post('/api/auth/login').send({
      email: 'manager@test.com',
      password: 'ManagerPass123',
    });
    managerToken = managerLogin.body.data.token;

    // Client user
    await request(app).post('/api/auth/register').send({
      email: 'client@test.com',
      password: 'ClientPass123',
      firstName: 'Client',
      lastName: 'User',
      role: 'CLIENT',
    });

    const clientLogin = await request(app).post('/api/auth/login').send({
      email: 'client@test.com',
      password: 'ClientPass123',
    });
    clientToken = clientLogin.body.data.token;
  });

  describe('GET /api/permissions', () => {
    it('should get all permissions for admin', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter permissions by role', async () => {
      const response = await request(app)
        .get('/api/permissions?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('role', 'ADMIN');
      }
    });

    it('should filter permissions by resource', async () => {
      const response = await request(app)
        .get('/api/permissions?resource=users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('resource', 'users');
      }
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/permissions/:id', () => {
    let permissionId: string;

    beforeAll(async () => {
      // Create a test permission
      const createResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'MANAGER',
          resource: 'reports',
          action: 'read',
          granted: true,
          description: 'View reports',
        });

      permissionId = createResponse.body.data.id;
    });

    it('should get permission by ID', async () => {
      const response = await request(app)
        .get(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', permissionId);
      expect(response.body.data).toHaveProperty('resource', 'reports');
    });

    it('should return 404 for non-existent permission', async () => {
      const response = await request(app)
        .get('/api/permissions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/permissions', () => {
    it('should create new permission as admin', async () => {
      const newPermission = {
        role: 'MANAGER',
        resource: 'analytics',
        action: 'read',
        granted: true,
        description: 'View analytics',
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPermission)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('role', 'MANAGER');
      expect(response.body.data).toHaveProperty('resource', 'analytics');
      expect(response.body.data).toHaveProperty('action', 'read');
    });

    it('should return 400 for invalid permission data', async () => {
      const invalidPermission = {
        role: 'INVALID_ROLE',
        resource: 'users',
        action: 'read',
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPermission)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin user', async () => {
      const newPermission = {
        role: 'CLIENT',
        resource: 'messages',
        action: 'read',
        granted: true,
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newPermission)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/permissions/:id', () => {
    let permissionId: string;

    beforeEach(async () => {
      // Create a test permission
      const createResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'MANAGER',
          resource: 'subscriptions',
          action: 'update',
          granted: false,
          description: 'Update subscriptions',
        });

      permissionId = createResponse.body.data.id;
    });

    it('should update permission as admin', async () => {
      const updateData = {
        granted: true,
        description: 'Update subscriptions - enabled',
      };

      const response = await request(app)
        .patch(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.granted).toBe(true);
      expect(response.body.data.description).toBe('Update subscriptions - enabled');
    });

    it('should return 404 for non-existent permission', async () => {
      const response = await request(app)
        .patch('/api/permissions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ granted: false })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .patch(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ granted: true })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/permissions/:id', () => {
    let permissionId: string;

    beforeEach(async () => {
      // Create a test permission
      const createResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'CLIENT',
          resource: 'test',
          action: 'delete',
          granted: false,
          description: 'Test permission to delete',
        });

      permissionId = createResponse.body.data.id;
    });

    it('should delete permission as admin', async () => {
      const response = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify permission is deleted
      const getResponse = await request(app)
        .get(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(getResponse.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent permission', async () => {
      const response = await request(app)
        .delete('/api/permissions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/permissions/check', () => {
    it('should check permission for authenticated user', async () => {
      const response = await request(app)
        .get('/api/permissions/check?resource=users&action=read')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('granted');
    });

    it('should return false for denied permission', async () => {
      const response = await request(app)
        .get('/api/permissions/check?resource=payments&action=delete')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.granted).toBe(false);
    });

    it('should return 400 without required parameters', async () => {
      const response = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
