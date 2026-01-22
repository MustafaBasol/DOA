import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Helper to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('input[name="email"]', 'admin@autoviseo.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
}

test.describe('API Health & Status', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeTruthy();
  });
});

test.describe('Messages API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch messages', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should fetch message stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/messages/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const stats = await response.json();
    expect(stats).toBeDefined();
  });
});

test.describe('Users API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch users list', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should fetch user stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/users/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const stats = await response.json();
    expect(stats).toBeDefined();
  });

  test('should fetch current user profile', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/users/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const user = await response.json();
    expect(user.email).toBe('admin@autoviseo.com');
    expect(user.role).toBe('SUPER_ADMIN');
  });
});

test.describe('Subscriptions API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch subscriptions', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toBeDefined();
  });

  test('should fetch subscription stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/subscriptions/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Payments API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch payments', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toBeDefined();
  });

  test('should fetch payment stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/payments/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Analytics API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch analytics overview', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should fetch message trends', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/analytics/message-trends?days=30`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Notifications API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const data = await response.json();
    token = data.accessToken;
  });

  test('should fetch notifications', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toBeDefined();
  });

  test('should fetch unread count', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/notifications/unread/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.count).toBeDefined();
  });
});

test.describe('Swagger API Documentation', () => {
  test('should serve Swagger UI', async ({ page }) => {
    await page.goto(`${API_URL}/api-docs`);
    
    // Wait for Swagger UI to load
    await page.waitForTimeout(2000);
    
    // Should have swagger-ui class
    const swaggerUI = page.locator('.swagger-ui');
    await expect(swaggerUI).toBeVisible({ timeout: 10000 });
  });

  test('should serve OpenAPI JSON spec', async ({ request }) => {
    const response = await request.get(`${API_URL}/api-docs.json`);
    
    expect(response.ok()).toBeTruthy();
    
    const spec = await response.json();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toContain('DOA');
  });
});
