import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'],  // Error rate < 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
const testUser = {
  email: 'admin@autoviseo.com',
  password: 'Admin123!',
};

export function setup() {
  // Login once to get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return { token: JSON.parse(loginRes.body).accessToken };
}

export default function(data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };

  // Test 1: Health check
  {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check has status': (r) => JSON.parse(r.body).status === 'ok',
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 2: Get current user
  {
    const res = http.get(`${BASE_URL}/api/auth/me`, params);
    check(res, {
      'get user status 200': (r) => r.status === 200,
      'user has email': (r) => JSON.parse(r.body).email !== undefined,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 3: Get messages
  {
    const res = http.get(`${BASE_URL}/api/messages?page=1&limit=20`, params);
    check(res, {
      'messages status 200': (r) => r.status === 200,
      'messages has data': (r) => JSON.parse(r.body).data !== undefined,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 4: Get message stats
  {
    const res = http.get(`${BASE_URL}/api/messages/stats`, params);
    check(res, {
      'stats status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 5: Get users
  {
    const res = http.get(`${BASE_URL}/api/users?page=1&limit=20`, params);
    check(res, {
      'users status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 6: Get analytics
  {
    const res = http.get(`${BASE_URL}/api/analytics/overview`, params);
    check(res, {
      'analytics status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(2);
}

export function teardown(data) {
  // Logout
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
    },
  };
  http.post(`${BASE_URL}/api/auth/logout`, null, params);
}
