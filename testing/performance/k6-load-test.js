/**
 * VitalPredict — k6 Load Testing Suite
 * Baseline: 100 VUs × 1 minute | Stress: 500 VUs | Spike: 50→500 | Endurance: 100 VUs × 30 min
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const loginErrors   = new Counter('login_errors');
const apiErrors     = new Counter('api_errors');
const errorRate     = new Rate('error_rate');
const loginDuration = new Trend('login_duration_ms', true);
const apiDuration   = new Trend('api_duration_ms', true);

const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:8000/api';
const TEST_USER = __ENV.TEST_USER || 'loadtest@vitalpredict.com';
const TEST_PASS = __ENV.TEST_PASS || 'Test@12345';

// ── Test Configuration ────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // BASELINE: 100 VUs × 1 minute
    baseline: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
      tags: { scenario: 'baseline' },
    },
    // STRESS: Ramp up to 500 VUs
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0  },
      ],
      tags: { scenario: 'stress' },
      startTime: '70s',
    },
    // SPIKE: Sudden surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m',  target: 500 },
        { duration: '30s', target: 50  },
      ],
      tags: { scenario: 'spike' },
      startTime: '600s',
    },
  },
  thresholds: {
    http_req_failed:   ['rate<0.05'],       // <5% error rate
    http_req_duration: ['p(95)<2000'],      // 95th percentile < 2s
    http_req_duration: ['p(99)<5000'],      // 99th percentile < 5s
    'http_req_duration{scenario:baseline}': ['p(95)<1500', 'avg<500'],
    login_errors:      ['count<50'],
    error_rate:        ['rate<0.05'],
  },
};

// ── Shared State ──────────────────────────────────────────────────────────────
let authToken = null;

function getAuthToken() {
  const res = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_USER, password: TEST_PASS }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(res.timings.duration);
  if (res.status === 200) {
    try { return res.json('access_token'); } catch (_) {}
  }
  loginErrors.add(1);
  return null;
}

// ── Main Test Function ────────────────────────────────────────────────────────
export default function () {
  // Step 1: Login
  let token;
  group('Authentication', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: TEST_USER, password: TEST_PASS }),
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
    );
    loginDuration.add(loginRes.timings.duration);
    const ok = check(loginRes, {
      'Login status 200':      r => r.status === 200,
      'Login returns token':   r => { try { return !!r.json('access_token'); } catch { return false; } },
      'Login time < 2000ms':   r => r.timings.duration < 2000,
    });
    if (!ok) { loginErrors.add(1); errorRate.add(1); }
    else {
      errorRate.add(0);
      try { token = loginRes.json('access_token'); } catch (_) {}
    }
    sleep(0.3);
  });

  if (!token) { sleep(1); return; }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Step 2: Get user profile
  group('Profile API', () => {
    const res = http.get(`${BASE_URL}/auth/me`, { headers, tags: { endpoint: 'me' } });
    apiDuration.add(res.timings.duration);
    check(res, {
      'Profile status 200': r => r.status === 200,
      'Profile has role':   r => { try { return !!r.json('role'); } catch { return false; } },
    });
    if (res.status !== 200) apiErrors.add(1);
    sleep(0.2);
  });

  // Step 3: Get latest vitals
  group('Vitals API', () => {
    const res = http.get(`${BASE_URL}/vitals/latest`, { headers, tags: { endpoint: 'vitals_latest' } });
    apiDuration.add(res.timings.duration);
    check(res, { 'Vitals status 200 or 204': r => r.status === 200 || r.status === 204 });
    if (res.status >= 400) apiErrors.add(1);
    sleep(0.2);
  });

  // Step 4: Get appointments
  group('Appointments API', () => {
    const res = http.get(`${BASE_URL}/appointments`, { headers, tags: { endpoint: 'appointments' } });
    apiDuration.add(res.timings.duration);
    check(res, { 'Appointments status 200': r => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(0.2);
  });

  // Step 5: Get doctors list
  group('Doctors API', () => {
    const res = http.get(`${BASE_URL}/auth/doctors`, { headers, tags: { endpoint: 'doctors' } });
    check(res, { 'Doctors status 200': r => r.status === 200 });
    sleep(0.2);
  });

  // Step 6: Get report history
  group('Reports API', () => {
    const res = http.get(`${BASE_URL}/report/history`, { headers, tags: { endpoint: 'reports' } });
    check(res, { 'Reports status 200': r => r.status === 200 });
    sleep(0.2);
  });

  // Step 7: Post vitals (write load)
  group('Log Vitals', () => {
    const res = http.post(
      `${BASE_URL}/vitals`,
      JSON.stringify({ systolic_bp: 118, diastolic_bp: 78, heart_rate: 72, blood_sugar: 95 }),
      { headers, tags: { endpoint: 'vitals_post' } }
    );
    check(res, { 'Log vitals 200': r => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(0.3);
  });

  sleep(1);
}

// ── Health Check (separate scenario) ─────────────────────────────────────────
export function healthCheck() {
  const res = http.get(`${BASE_URL.replace('/api', '')}/api/health`);
  check(res, { 'Health check 200': r => r.status === 200 });
}

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  console.log(`🚀 Starting k6 load test against: ${BASE_URL}`);
  // Seed test user if possible
  http.post(`${BASE_URL}/auth/register`,
    JSON.stringify({ username: 'Load Test User', email: TEST_USER, password: TEST_PASS, role: 'patient' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'reports/k6-load-report.html': htmlReport(data),
    'reports/k6-summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'reports/k6-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
