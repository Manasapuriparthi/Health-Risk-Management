'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  validPatient: {
    email: process.env.TEST_PATIENT_EMAIL || 'testpatient@vitalpredict.com',
    password: process.env.TEST_PATIENT_PASS || 'Test@12345',
    name: 'Test Patient',
  },
  validDoctor: {
    email: process.env.TEST_DOCTOR_EMAIL || 'sarah@vitalpredict.com',
    password: process.env.TEST_DOCTOR_PASS || 'password123',
    name: 'Dr. Sarah Sian',
  },
  newUser: () => ({
    name: `AutoUser_${Date.now()}`,
    email: `auto_${uuidv4().substring(0, 8)}@test.com`,
    password: 'Test@12345',
    age: '30',
    weight: '70',
    height: '170',
  }),
  invalidCredentials: [
    { email: 'wrong@test.com', password: 'wrongpass', desc: 'Wrong email/password' },
    { email: 'notanemail',     password: 'Test@12345', desc: 'Invalid email format' },
    { email: '',               password: 'Test@12345', desc: 'Empty email' },
    { email: 'test@test.com',  password: '',           desc: 'Empty password' },
    { email: 'a'.repeat(300) + '@test.com', password: 'Test@12345', desc: 'Oversized email' },
  ],
  vitals: {
    systolic: '116', diastolic: '83', heartRate: '90',
    spo2: '96', weight: '65.8', glucose: '95', cholesterol: '180',
  },
  injectionPayloads: [
    "' OR '1'='1", '<script>alert("xss")</script>',
    '${7*7}', '{{7*7}}', '../../../etc/passwd', 'DROP TABLE users;--',
  ],
  longString: 'A'.repeat(5000),
  specialChars: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
  sqlInjection: "' OR 1=1 --",
  xssPayload: '<img src=x onerror=alert(1)>',
};
