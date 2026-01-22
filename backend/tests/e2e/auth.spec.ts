import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login.html`);
  });

  test('should display login form', async ({ page }) => {
    await expect(page).toHaveTitle(/DOA/i);
    
    // Check login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('.error, .alert-error', { timeout: 5000 });
    
    // Verify error is displayed
    const errorElement = page.locator('.error, .alert-error');
    await expect(errorElement).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill valid admin credentials
    await page.fill('input[name="email"]', 'admin@autoviseo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
    
    // Verify we're on dashboard
    expect(page.url()).toContain('dashboard.html');
  });

  test('should store token in localStorage after login', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'admin@autoviseo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
    
    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(50); // JWT should be long
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@autoviseo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
    
    // Click logout button
    const logoutButton = page.locator('a[href*="logout"], button:has-text("Logout"), button:has-text("Çıkış")');
    await logoutButton.click();
    
    // Should redirect to login
    await page.waitForURL(/login\.html/, { timeout: 5000 });
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('should redirect to login when accessing protected page without token', async ({ page }) => {
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Try to access dashboard
    await page.goto(`${BASE_URL}/dashboard.html`);
    
    // Should redirect to login
    await page.waitForURL(/login\.html/, { timeout: 5000 });
    expect(page.url()).toContain('login.html');
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'admin@autoviseo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    expect(page.url()).toContain('dashboard.html');
    
    // Token should still exist
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});

test.describe('API Authentication', () => {
  test('should authenticate via API and receive token', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.accessToken).toBeTruthy();
    expect(data.refreshToken).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe('admin@autoviseo.com');
    expect(data.user.role).toBe('SUPER_ADMIN');
  });

  test('should fail authentication with wrong password', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'WrongPassword',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should access protected endpoint with valid token', async ({ request }) => {
    // Login first
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const { accessToken } = await loginResponse.json();

    // Access protected endpoint
    const meResponse = await request.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(meResponse.ok()).toBeTruthy();
    
    const user = await meResponse.json();
    expect(user.email).toBe('admin@autoviseo.com');
  });

  test('should reject access without token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('should reject access with invalid token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid-token-here',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should refresh token successfully', async ({ request }) => {
    // Login
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@autoviseo.com',
        password: 'Admin123!',
      },
    });

    const { refreshToken } = await loginResponse.json();

    // Refresh token
    const refreshResponse = await request.post(`${API_URL}/api/auth/refresh`, {
      data: {
        refreshToken,
      },
    });

    expect(refreshResponse.ok()).toBeTruthy();
    
    const data = await refreshResponse.json();
    expect(data.accessToken).toBeTruthy();
    expect(data.refreshToken).toBeTruthy();
  });
});
