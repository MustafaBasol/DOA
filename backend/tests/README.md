# Testing Guide

## Overview
This project uses **Jest** as the testing framework with **ts-jest** for TypeScript support and **Supertest** for API integration testing.

## Test Structure

```
tests/
├── setup.ts              # Global test setup and mocks
├── unit/                 # Unit tests for individual modules
│   ├── auth.service.test.ts
│   ├── permission.service.test.ts
│   └── ...
└── integration/          # API endpoint integration tests
    ├── auth.api.test.ts
    ├── permission.api.test.ts
    └── ...
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auth.service.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should login"
```

## Test Environment Setup

### 1. Create Test Database
```bash
# Create PostgreSQL test database
createdb doa_test

# Or using Docker
docker run --name postgres-test -e POSTGRES_PASSWORD=test_password -e POSTGRES_USER=test_user -e POSTGRES_DB=doa_test -p 5433:5432 -d postgres:15
```

### 2. Run Migrations for Test DB
```bash
# Set test database URL
export DATABASE_URL="postgresql://test_user:test_password@localhost:5433/doa_test?schema=public"

# Run migrations
npx prisma migrate deploy

# Or reset test database
npx prisma migrate reset --force
```

### 3. Environment Variables
Test environment uses `.env.test` file. Key configurations:
- `NODE_ENV=test`
- `DATABASE_URL` - Test database connection
- `JWT_SECRET` - Test JWT secret
- `SKIP_EMAIL_SENDING=true` - Skip actual email sending in tests

## Writing Tests

### Unit Test Example
```typescript
import { AuthService } from '../../src/modules/auth/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'CLIENT',
    };

    const result = await authService.register(userData);

    expect(result).toHaveProperty('email', userData.email);
    expect(result).not.toHaveProperty('password');
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('token');
  });
});
```

## Test Coverage Goals

| Module | Target Coverage |
|--------|----------------|
| Services | 90% |
| Controllers | 85% |
| Middleware | 80% |
| Utils | 95% |
| Overall | 85% |

## Current Test Coverage

Run `npm run test:coverage` to see detailed coverage report.

Coverage reports are generated in:
- `coverage/` directory
- HTML report: `coverage/lcov-report/index.html`

## Continuous Integration

Tests are automatically run on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch merge

## Best Practices

### 1. Test Naming
Use descriptive test names following the pattern:
```typescript
it('should [expected behavior] when [condition]', () => {
  // test implementation
});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should create user', async () => {
  // Arrange - Setup test data
  const userData = { ... };

  // Act - Execute the code
  const result = await service.createUser(userData);

  // Assert - Verify results
  expect(result).toHaveProperty('id');
});
```

### 3. Mock External Dependencies
```typescript
jest.mock('@prisma/client');
jest.mock('nodemailer');
```

### 4. Clean Up After Tests
```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 5. Test Edge Cases
- Happy path ✅
- Error conditions ❌
- Boundary values 🔢
- Invalid inputs ⚠️
- Authentication/Authorization 🔐

## Debugging Tests

### Run tests in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Debug Configuration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### Issue: Database Connection Error
**Solution:** Ensure test database is running and `.env.test` has correct credentials

### Issue: Tests Timeout
**Solution:** Increase timeout in jest.config.js:
```javascript
testTimeout: 30000
```

### Issue: Port Already in Use
**Solution:** Use different port for test server or kill existing process:
```bash
lsof -ti:3001 | xargs kill
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
