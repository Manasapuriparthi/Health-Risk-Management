'use strict';

const config = {
  // Base URL — set via env var for CI/CD (GitHub Pages), defaults to local dev
  BASE_URL: process.env.BASE_URL || 'http://localhost:5173',
  API_BASE: process.env.API_BASE || 'http://localhost:8000/api',

  // Browser config
  BROWSER: process.env.BROWSER || 'chrome',
  HEADLESS: process.env.HEADLESS !== 'false',
  WINDOW_WIDTH: 1280,
  WINDOW_HEIGHT: 800,

  // Timeouts (ms)
  IMPLICIT_WAIT: 10000,
  EXPLICIT_WAIT: 15000,
  PAGE_LOAD_TIMEOUT: 30000,

  // Retry
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,

  // Test credentials
  PATIENT_EMAIL: process.env.TEST_PATIENT_EMAIL || 'testpatient@vitalpredict.com',
  PATIENT_PASSWORD: process.env.TEST_PATIENT_PASS || 'Test@12345',
  DOCTOR_EMAIL: process.env.TEST_DOCTOR_EMAIL || 'sarah@vitalpredict.com',
  DOCTOR_PASSWORD: process.env.TEST_DOCTOR_PASS || 'password123',

  // Paths
  SCREENSHOT_DIR: 'screenshots',
  LOG_DIR: 'logs',
  REPORT_DIR: 'reports',

  // Report metadata
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  BUILD_NUMBER: process.env.BUILD_NUMBER || 'local',
  ENVIRONMENT: process.env.ENVIRONMENT || 'local',
};

module.exports = config;
