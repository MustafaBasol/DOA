import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const spikeErrorRate = new Rate('spike_errors');

// Spike test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Normal load
    { duration: '1m', target: 10 },     // Stay at normal
    { duration: '10s', target: 500 },   // SPIKE to 500 users
    { duration: '3m', target: 500 },    // Stay at spike
    { duration: '10s', target: 10 },    // Drop back to normal
    { duration: '3m', target: 10 },     // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Allow 3s during spike
    http_req_failed: ['rate<0.3'],      // Allow 30% error during spike
    spike_errors: ['rate<0.3'],
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

  // Critical endpoints that must survive spike
  const res1 = http.get(`${BASE_URL}/api/health`);
  check(res1, {
    'health survives spike': (r) => r.status === 200,
  }) || spikeErrorRate.add(1);

  sleep(0.5);

  const res2 = http.get(`${BASE_URL}/api/messages?page=1&limit=10`, params);
  check(res2, {
    'messages survive spike': (r) => r.status === 200,
  }) || spikeErrorRate.add(1);

  sleep(0.5);

  const res3 = http.get(`${BASE_URL}/api/auth/me`, params);
  check(res3, {
    'auth survives spike': (r) => r.status === 200,
  }) || spikeErrorRate.add(1);

  sleep(1);
}
