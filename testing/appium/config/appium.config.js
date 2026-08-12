const path = require('path');

const defaultApkPath = path.resolve(__dirname, '../../mobile/build/app/outputs/flutter-apk/app-debug.apk');

const capabilities = {
  platformName: 'Android',
  'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
  'appium:app': process.env.APK_PATH ? path.resolve(process.env.APK_PATH) : defaultApkPath,
  'appium:appPackage': 'com.vitalpredict.mobile',
  'appium:appActivity': 'com.vitalpredict.mobile.MainActivity',
  'appium:automationName': 'UiAutomator2',
  'appium:newCommandTimeout': 300,
  'appium:autoGrantPermissions': true,
  'appium:noReset': false,
  'appium:fullReset': false,
};

if (process.env.DEVICE_UDID) {
  capabilities['appium:udid'] = process.env.DEVICE_UDID;
}

if (process.env.ANDROID_VERSION) {
  capabilities['appium:platformVersion'] = process.env.ANDROID_VERSION;
}

module.exports = {
  appiumServer: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723'),
  },
  capabilities,
  IMPLICIT_WAIT: 10000,
  EXPLICIT_WAIT: 20000,
  API_BASE: process.env.API_BASE || 'http://10.0.2.2:8000/api',
  PATIENT_EMAIL: process.env.TEST_PATIENT_EMAIL || 'testpatient@vitalpredict.com',
  PATIENT_PASSWORD: process.env.TEST_PATIENT_PASS || 'Test@12345',
  DOCTOR_EMAIL: process.env.TEST_DOCTOR_EMAIL || 'sarah@vitalpredict.com',
  DOCTOR_PASSWORD: process.env.TEST_DOCTOR_PASS || 'password123',
  SCREENSHOT_DIR: 'screenshots',
  REPORT_DIR: 'reports',
  LOG_DIR: 'logs',
  BUILD_NUMBER: process.env.BUILD_NUMBER || 'local',
};
