import http from 'k6/http';
import { check } from 'k6';

// Soak test configuration (long duration, moderate load)
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up to 50 users
    { duration: '30m', target: 50 },   // Stay at 50 for 30 minutes
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
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

  // Simulate typical user session over long period
  
  // Check messages
  http.get(`${BASE_URL}/api/messages?page=1&limit=20`, params);
  
  // Check stats
  http.get(`${BASE_URL}/api/messages/stats`, params);
  
  // Check users
  http.get(`${BASE_URL}/api/users?page=1&limit=20`, params);
  
  // Check analytics
  http.get(`${BASE_URL}/api/analytics/overview`, params);
  
  // Longer sleep to simulate real user behavior
  sleep(5 + Math.random() * 5); // 5-10 seconds between actions
}
