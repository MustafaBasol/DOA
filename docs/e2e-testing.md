# E2E Testing with Playwright

## Genel Bakış

DOA WhatsApp Management Panel için end-to-end (E2E) test suite. Playwright kullanarak frontend ve API'nin tam entegrasyonunu test eder.

## Teknolojiler

- **Playwright**: Modern web testing framework
- **TypeScript**: Type-safe test yazımı
- **Chromium**: Headless browser testing

## Kurulum

### 1. Dependencies

Playwright zaten kurulu. Eğer yoksa:

```bash
cd backend
npm install --save-dev @playwright/test
npx playwright install chromium
```

### 2. Configuration

`playwright.config.ts` dosyası test ayarlarını içerir:

```typescript
{
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000/api/health',
    reuseExistingServer: true
  }
}
```

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)

**UI Tests:**
- ✅ Login form görüntüleme
- ✅ Invalid credentials error
- ✅ Successful login
- ✅ Token localStorage'da saklanır
- ✅ Logout işlemi
- ✅ Redirect to login when unauthorized
- ✅ Session persistence after reload

**API Tests:**
- ✅ API authentication
- ✅ Wrong password rejection
- ✅ Protected endpoint access with token
- ✅ Reject without token
- ✅ Reject with invalid token
- ✅ Token refresh

**Toplam:** 13 test

### 2. Dashboard Tests (`dashboard.spec.ts`)

**Page Tests:**
- ✅ Dashboard page display
- ✅ Statistics cards
- ✅ Navigation (users, messages)
- ✅ User info in header
- ✅ API data loading

**Analytics Tests:**
- ✅ Charts display (Chart.js canvas)
- ✅ Analytics page navigation

**Navigation Tests:**
- ✅ Subscriptions page
- ✅ Payments page

**Responsive Tests:**
- ✅ Mobile viewport (375x667)
- ✅ Tablet viewport (768x1024)

**Real-time Tests:**
- ✅ WebSocket connection (Socket.IO)

**Error Handling:**
- ✅ Network error graceful handling
- ✅ Offline mode

**Toplam:** 13 test

### 3. API Tests (`api.spec.ts`)

**Health:**
- ✅ Health check endpoint

**Messages API:**
- ✅ Fetch messages
- ✅ Message stats

**Users API:**
- ✅ Users list
- ✅ User stats
- ✅ Current user profile

**Subscriptions API:**
- ✅ Subscriptions list
- ✅ Subscription stats

**Payments API:**
- ✅ Payments list
- ✅ Payment stats

**Analytics API:**
- ✅ Analytics overview
- ✅ Message trends

**Notifications API:**
- ✅ Notifications list
- ✅ Unread count

**Swagger:**
- ✅ Swagger UI serves
- ✅ OpenAPI JSON spec

**Toplam:** 17 test

## Çalıştırma

### Tüm Testleri Çalıştır

```bash
cd backend
npm run test:e2e
```

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

En iyi geliştirme deneyimi için önerilir. Test'leri görebilir, debug edebilir ve adım adım izleyebilirsiniz.

### Headed Mode (Browser Görünür)

```bash
npm run test:e2e:headed
```

Browser window'u açık tutar, test ederken ne olduğunu görebilirsiniz.

### Specific Test File

```bash
npx playwright test auth.spec.ts
```

### Specific Test

```bash
npx playwright test -g "should login successfully"
```

### Test Report

```bash
npm run test:e2e:report
```

HTML report'u browser'da açar.

## Test Yazma

### Temel Test Yapısı

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('http://localhost:3000/page.html');
    
    // Interact
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

### Helper Functions

Login helper örneği:

```typescript
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('input[name="email"]', 'admin@autoviseo.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard\.html/, { timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
  await login(page);
});
```

### API Testing

```typescript
test('should call API', async ({ request }) => {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: 'admin@autoviseo.com',
      password: 'Admin123!',
    },
  });

  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data.accessToken).toBeTruthy();
});
```

### Locators

```typescript
// By CSS
await page.locator('button.primary').click();

// By text
await page.locator('text=Login').click();

// By role
await page.getByRole('button', { name: 'Submit' }).click();

// By placeholder
await page.getByPlaceholder('Enter email').fill('test@example.com');

// By label
await page.getByLabel('Password').fill('secret');
```

### Assertions

```typescript
// Visibility
await expect(page.locator('.success')).toBeVisible();
await expect(page.locator('.error')).toBeHidden();

// Text content
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page.locator('h1')).toContainText('Dash');

// Value
await expect(page.locator('input')).toHaveValue('test');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// URL
expect(page.url()).toContain('dashboard.html');
await expect(page).toHaveURL(/dashboard/);

// API response
expect(response.ok()).toBeTruthy();
expect(response.status()).toBe(200);
```

### Waits

```typescript
// Wait for URL
await page.waitForURL(/dashboard/);

// Wait for selector
await page.waitForSelector('.loaded');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for timeout
await page.waitForTimeout(2000);

// Wait for response
await page.waitForResponse(response => 
  response.url().includes('/api/') && response.status() === 200
);
```

## Best Practices

### 1. Use Data-Testid

HTML'de test-specific selector'lar kullan:

```html
<button data-testid="login-button">Login</button>
```

```typescript
await page.locator('[data-testid="login-button"]').click();
```

### 2. Avoid Hard-Coded Waits

```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await page.waitForSelector('.loaded');
await expect(page.locator('.success')).toBeVisible();
```

### 3. Use beforeEach/afterEach

```typescript
test.beforeEach(async ({ page }) => {
  await login(page);
});

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
});
```

### 4. Group Related Tests

```typescript
test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('valid credentials', async ({ page }) => {});
    test('invalid credentials', async ({ page }) => {});
  });
  
  test.describe('Logout', () => {
    test('should logout', async ({ page }) => {});
  });
});
```

### 5. Use Fixtures

```typescript
// fixtures.ts
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

// test file
test('dashboard stats', async ({ authenticatedPage }) => {
  // Already logged in
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
        working-directory: backend
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        working-directory: backend
      
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: backend
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: backend/playwright-report/
```

### Environment Variables

```env
# .env.test
BASE_URL=http://localhost:3000
API_URL=http://localhost:5000
DATABASE_URL=postgresql://...
CI=true
```

## Debugging

### Debug Mode

```bash
# Interactive debug
npx playwright test --debug

# Specific test
npx playwright test --debug -g "should login"
```

### Screenshots

Otomatik olarak hata durumunda screenshot alınır:

```typescript
use: {
  screenshot: 'only-on-failure',
}
```

Manuel screenshot:

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Traces

```typescript
use: {
  trace: 'on-first-retry',
}
```

Trace dosyasını görüntüle:

```bash
npx playwright show-trace trace.zip
```

### Console Logs

```typescript
page.on('console', msg => console.log('Browser log:', msg.text()));
```

### Network Logs

```typescript
page.on('request', request => 
  console.log('Request:', request.url())
);

page.on('response', response => 
  console.log('Response:', response.url(), response.status())
);
```

## Troubleshooting

### Test Timeout

```typescript
test('long test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Browser Not Found

```bash
npx playwright install chromium
```

### Port Already in Use

Test öncesi backend'in çalışmadığından emin ol:

```bash
# Kill backend process
pkill -f "ts-node-dev"

# Run tests
npm run test:e2e
```

### Database State

Her test öncesi database'i reset et:

```typescript
test.beforeEach(async () => {
  // Reset DB
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  // Seed test data
  await seedTestData();
});
```

## Test Coverage

Mevcut coverage:

- **Auth Flow**: 13 tests ✅
- **Dashboard**: 13 tests ✅
- **API**: 17 tests ✅
- **Total**: 43 E2E tests

## Roadmap

- [ ] User management E2E tests
- [ ] Subscription flow tests
- [ ] Payment flow tests
- [ ] Reports download tests
- [ ] Real-time WebSocket tests
- [ ] Multi-language tests
- [ ] Mobile app tests
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Accessibility tests

## İstatistikler

- **Test Files**: 3
- **Total Tests**: 43
- **Lines of Code**: 600+
- **Coverage**: Auth, Dashboard, API
- **Browser**: Chromium (headless)
- **Framework**: Playwright 1.48+

## Sonuç

✅ **E2E Testing başarıyla kuruldu!**

**Özellikler:**
- ✅ Authentication flow tests (UI + API)
- ✅ Dashboard navigation tests
- ✅ API endpoint tests
- ✅ Responsive design tests
- ✅ Real-time WebSocket tests
- ✅ Error handling tests

**Komutlar:**
```bash
npm run test:e2e           # Run all tests
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:headed    # Browser visible
npm run test:e2e:report    # View report
```

**Benefits:**
- 🚀 Fast execution (parallel)
- 🔍 Auto-retry on failure
- 📸 Screenshots on error
- 📹 Video recording
- 📊 HTML reports
- 🎯 CI/CD ready

Production-ready E2E testing! 🎉
