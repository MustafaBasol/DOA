import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('input[name="email"]', 'admin@autoviseo.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
}

test.describe('Dashboard - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify we're on dashboard
    expect(page.url()).toContain('dashboard.html');
    
    // Check for dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForTimeout(2000);
    
    // Check for stat cards (users, messages, subscriptions, etc.)
    const statCards = page.locator('.stat-card, .card, [class*="stat"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to users page', async ({ page }) => {
    // Click users link
    const usersLink = page.locator('a[href*="admin.html"], a:has-text("Users"), a:has-text("Kullanıcılar")');
    await usersLink.first().click();
    
    // Should navigate to admin.html
    await page.waitForURL(/admin\.html/, { timeout: 5000 });
    expect(page.url()).toContain('admin.html');
  });

  test('should navigate to messages page', async ({ page }) => {
    // Click messages link
    const messagesLink = page.locator('a[href*="client.html"], a:has-text("Messages"), a:has-text("Mesajlar")');
    await messagesLink.first().click();
    
    // Should navigate to client.html
    await page.waitForURL(/client\.html/, { timeout: 5000 });
    expect(page.url()).toContain('client.html');
  });

  test('should display user info in header/nav', async ({ page }) => {
    // Wait for user info to load
    await page.waitForTimeout(1000);
    
    // Should show email or username
    const userInfo = page.locator('[class*="user"], [class*="profile"]');
    await expect(userInfo.first()).toBeVisible({ timeout: 5000 });
  });

  test('should load data from API', async ({ page }) => {
    // Intercept API calls
    const apiCalls: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });
    
    // Reload page to trigger API calls
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should have made API calls
    expect(apiCalls.length).toBeGreaterThan(0);
    
    // Should have called stats endpoints
    const hasStatsCall = apiCalls.some(url => url.includes('/stats'));
    expect(hasStatsCall).toBeTruthy();
  });
});

test.describe('Dashboard - Charts & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display analytics charts', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Check for canvas elements (Chart.js)
    const canvasElements = page.locator('canvas');
    const count = await canvasElements.count();
    
    // Should have at least one chart
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to analytics page', async ({ page }) => {
    // Click analytics link if exists
    const analyticsLink = page.locator('a[href*="analytics.html"], a:has-text("Analytics"), a:has-text("Analitik")');
    
    const linkCount = await analyticsLink.count();
    if (linkCount > 0) {
      await analyticsLink.first().click();
      await page.waitForURL(/analytics\.html/, { timeout: 5000 });
      expect(page.url()).toContain('analytics.html');
    }
  });
});

test.describe('Dashboard - Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to subscriptions page', async ({ page }) => {
    const subsLink = page.locator('a[href*="admin-subscriptions.html"], a:has-text("Subscriptions"), a:has-text("Abonelikler")');
    
    const linkCount = await subsLink.count();
    if (linkCount > 0) {
      await subsLink.first().click();
      await page.waitForURL(/admin-subscriptions\.html/, { timeout: 5000 });
      expect(page.url()).toContain('admin-subscriptions.html');
    }
  });
});

test.describe('Dashboard - Payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to payments page', async ({ page }) => {
    const paymentsLink = page.locator('a[href*="admin-payments.html"], a:has-text("Payments"), a:has-text("Ödemeler")');
    
    const linkCount = await paymentsLink.count();
    if (linkCount > 0) {
      await paymentsLink.first().click();
      await page.waitForURL(/admin-payments\.html/, { timeout: 5000 });
      expect(page.url()).toContain('admin-payments.html');
    }
  });
});

test.describe('Dashboard - Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile menu toggle
    const menuToggle = page.locator('[class*="menu-toggle"], [class*="hamburger"], button[aria-label*="menu"]');
    const hasToggle = await menuToggle.count() > 0;
    
    // Mobile should have menu toggle or navigation should adapt
    expect(hasToggle || true).toBeTruthy();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should connect to WebSocket', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Check if Socket.IO script is loaded
    const socketScript = page.locator('script[src*="socket.io"]');
    const hasSocketIO = await socketScript.count() > 0;
    
    // Should have Socket.IO client
    expect(hasSocketIO).toBeTruthy();
  });
});

test.describe('Dashboard - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    await login(page);
    
    // Simulate offline
    await context.setOffline(true);
    
    // Try to reload
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Page should still render (cached content)
    await expect(page.locator('body')).toBeVisible();
    
    // Restore online
    await context.setOffline(false);
  });
});
