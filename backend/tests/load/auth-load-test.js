import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const loginErrorRate = new Rate('login_errors');
const logoutErrorRate = new Rate('logout_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Spike to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Login can be slower
    http_req_failed: ['rate<0.05'],  // Error rate < 5%
    login_errors: ['rate<0.05'],
    logout_errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test users
const users = [
  { email: 'admin@autoviseo.com', password: 'Admin123!' },
  { email: 'operator@autoviseo.com', password: 'Operator123!' },
  { email: 'viewer@autoviseo.com', password: 'Viewer123!' },
];

export default function() {
  // Pick random user
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Test 1: Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => JSON.parse(r.body).accessToken !== undefined,
    'login has refreshToken': (r) => JSON.parse(r.body).refreshToken !== undefined,
    'login duration < 1s': (r) => r.timings.duration < 1000,
  });

  if (!loginSuccess) {
    loginErrorRate.add(1);
    return;
  }

  const { accessToken, refreshToken } = JSON.parse(loginRes.body);
  
  sleep(2);

  // Test 2: Get current user
  {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    check(res, {
      'me status 200': (r) => r.status === 200,
      'me has correct email': (r) => JSON.parse(r.body).email === user.email,
    });
  }

  sleep(3);

  // Test 3: Refresh token
  {
    const res = http.post(
      `${BASE_URL}/api/auth/refresh`,
      JSON.stringify({ refreshToken }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(res, {
      'refresh status 200': (r) => r.status === 200,
      'refresh has new accessToken': (r) => JSON.parse(r.body).accessToken !== undefined,
    });
  }

  sleep(2);

  // Test 4: Logout
  const logoutRes = http.post(
    `${BASE_URL}/api/auth/logout`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  const logoutSuccess = check(logoutRes, {
    'logout status 200': (r) => r.status === 200,
    'logout duration < 500ms': (r) => r.timings.duration < 500,
  });

  if (!logoutSuccess) {
    logoutErrorRate.add(1);
  }

  sleep(1);
}
