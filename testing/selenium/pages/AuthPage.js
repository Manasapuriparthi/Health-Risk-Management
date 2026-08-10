'use strict';

const { By, until } = require('selenium-webdriver');
const { waitAndClick, waitAndType, takeScreenshot } = require('../utils/driver');
const config = require('../config/config');

class AuthPage {
  constructor(driver) {
    this.driver = driver;
    this.selectors = {
      emailInput:      By.css('input[type="email"], input[placeholder*="email" i]'),
      passwordInput:   By.css('input[type="password"]'),
      loginBtn:        By.xpath('//button[contains(text(),"Sign In") or contains(text(),"Login")]'),
      registerBtn:     By.xpath('//button[contains(text(),"Register") or contains(text(),"Create")]'),
      patientTab:      By.xpath('//button[contains(text(),"Patient")]'),
      doctorTab:       By.xpath('//button[contains(text(),"Doctor")]'),
      createOneLink:   By.xpath('//button[contains(text(),"Create one") or contains(text(),"Register")]'),
      signInLink:      By.xpath('//button[contains(text(),"Sign in here") or contains(text(),"Sign In")]'),
      errorAlert:      By.css('.badge-critical, [class*="error"], [class*="Error"]'),
      usernameInput:   By.css('input[placeholder*="name" i], input[name="username"]'),
    };
  }

  async navigate() {
    await this.driver.get(config.BASE_URL);
    await this.driver.wait(until.titleContains('VitalPredict'), 15000);
  }

  async login(email, password) {
    await waitAndType(this.driver, this.selectors.emailInput, email);
    await waitAndType(this.driver, this.selectors.passwordInput, password);
    await waitAndClick(this.driver, this.selectors.loginBtn);
    await this.driver.sleep(1500);
  }

  async loginAsPatient() {
    return this.login(config.PATIENT_EMAIL, config.PATIENT_PASSWORD);
  }

  async loginAsDoctor() {
    return this.login(config.DOCTOR_EMAIL, config.DOCTOR_PASSWORD);
  }

  async clickPatientTab() {
    await waitAndClick(this.driver, this.selectors.patientTab);
  }

  async clickDoctorTab() {
    await waitAndClick(this.driver, this.selectors.doctorTab);
  }

  async isLoggedIn() {
    try {
      const url = await this.driver.getCurrentUrl();
      return !url.includes('/login') && !url.includes('/signup');
    } catch { return false; }
  }

  async getErrorText() {
    try {
      const el = await this.driver.wait(
        until.elementLocated(this.selectors.errorAlert), 5000);
      return await el.getText();
    } catch { return null; }
  }

  async logout() {
    try {
      const signOutBtn = await this.driver.wait(
        until.elementLocated(By.xpath('//button[contains(text(),"Sign Out") or contains(text(),"Log Out")]')), 5000);
      await signOutBtn.click();
      await this.driver.sleep(1000);
    } catch (e) { /* already logged out */ }
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = AuthPage;
