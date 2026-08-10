'use strict';

const { tapElement, typeText, takeScreenshot, findElement } = require('../utils/appiumDriver');
const config = require('../config/appium.config');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.sel = {
      emailField:    '~email_field',
      passwordField: '~password_field',
      loginBtn:      '//android.widget.TextView[@text="Sign In"]',
      signupLink:    '//android.widget.TextView[contains(@text,"Create")]',
      errorMsg:      '//android.widget.TextView[contains(@text,"error") or contains(@text,"Error")]',
      patientTab:    '//android.widget.TextView[@text="Patient"]',
      doctorTab:     '//android.widget.TextView[@text="Doctor"]',
      emailInput:    '//android.widget.EditText[@hint="john@example.com" or contains(@text,"@")]',
      passInput:     '//android.widget.EditText[@password="true"]',
      anyInput:      '//android.widget.EditText',
    };
  }

  async isVisible() {
    try {
      const inputs = await this.driver.$$('//android.widget.EditText');
      return inputs.length >= 2;
    } catch { return false; }
  }

  async login(email, password) {
    try {
      const inputs = await this.driver.$$('//android.widget.EditText');
      if (inputs.length >= 2) {
        await inputs[0].setValue(email);
        await inputs[1].setValue(password);
        // Find Sign In button
        const signInBtn = await this.driver.$('//android.widget.TextView[@text="Sign In"]');
        await signInBtn.click();
        await this.driver.pause(2000);
      }
    } catch (e) {
      console.error('Login failed:', e.message);
    }
  }

  async loginAsPatient() {
    return this.login(config.PATIENT_EMAIL, config.PATIENT_PASSWORD);
  }

  async loginAsDoctor() {
    return this.login(config.DOCTOR_EMAIL, config.DOCTOR_PASSWORD);
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = LoginPage;
