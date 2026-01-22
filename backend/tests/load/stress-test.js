import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Stress test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Spike to 300 users
    { duration: '3m', target: 300 },   // Stay at 300 users
    { duration: '2m', target: 400 },   // Push to 400 users (find breaking point)
    { duration: '2m', target: 400 },   // Stay at 400 users
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // More relaxed for stress test
    http_req_failed: ['rate<0.2'],  // Allow 20% error rate at peak
    errors: ['rate<0.2'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const testUser = {
  email: 'admin@autoviseo.com',
  password: 'Admin123!',
};

export function setup() {
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

  // Simulate real user behavior with mixed requests
  const actions = [
    () => {
      const res = http.get(`${BASE_URL}/api/health`);
      check(res, { 'health check ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/messages?page=1&limit=20`, params);
      check(res, { 'messages ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/messages/stats`, params);
      check(res, { 'stats ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/users?page=1&limit=20`, params);
      check(res, { 'users ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/analytics/overview`, params);
      check(res, { 'analytics ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/subscriptions?page=1&limit=20`, params);
      check(res, { 'subscriptions ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
    () => {
      const res = http.get(`${BASE_URL}/api/payments?page=1&limit=20`, params);
      check(res, { 'payments ok': (r) => r.status === 200 }) || errorRate.add(1);
    },
  ];

  // Execute 2-4 random actions
  const numActions = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < numActions; i++) {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();
    sleep(Math.random() * 2 + 0.5); // 0.5-2.5s sleep
  }
}

export function teardown(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
    },
  };
  http.post(`${BASE_URL}/api/auth/logout`, null, params);
}
