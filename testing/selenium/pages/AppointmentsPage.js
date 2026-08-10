'use strict';

const { By, until } = require('selenium-webdriver');
const { waitAndClick, takeScreenshot } = require('../utils/driver');
const config = require('../config/config');

class AppointmentsPage {
  constructor(driver) {
    this.driver = driver;
    this.selectors = {
      heading:            By.xpath('//h1[contains(text(),"Appointment")]'),
      specialistCards:    By.css('.glass-panel'),
      selectSpecialtyBtn: By.xpath('//button[contains(text(),"Select Specialty")]'),
      bookSlotBtn:        By.xpath('//button[contains(text(),"Select & Book")]'),
      confirmBtn:         By.xpath('//button[contains(text(),"Confirm Appointment")]'),
      bookAnotherBtn:     By.xpath('//button[contains(text(),"Book Another")]'),
      successCheck:       By.xpath('//*[contains(text(),"Appointment Confirmed")]'),
      dateButtons:        By.css('button[style*="border-radius: 8px"]'),
    };
  }

  async isLoaded() {
    try {
      await this.driver.wait(until.elementLocated(this.selectors.heading), 8000);
      return true;
    } catch { return false; }
  }

  async selectFirstSpecialty() {
    const btns = await this.driver.findElements(this.selectors.selectSpecialtyBtn);
    if (btns.length > 0) {
      await btns[0].click();
      await this.driver.sleep(600);
      return true;
    }
    return false;
  }

  async selectFirstDoctor() {
    const btns = await this.driver.findElements(this.selectors.bookSlotBtn);
    if (btns.length > 0) {
      await btns[0].click();
      await this.driver.sleep(600);
      return true;
    }
    return false;
  }

  async selectFirstAvailableDate() {
    const btns = await this.driver.findElements(this.selectors.dateButtons);
    for (const btn of btns) {
      try {
        const disabled = await btn.getAttribute('disabled');
        if (!disabled) { await btn.click(); await this.driver.sleep(300); return true; }
      } catch { /* skip */ }
    }
    return false;
  }

  async selectTimeSlot() {
    const slots = await this.driver.findElements(By.xpath('//button[contains(@class,"btn-secondary") and contains(text(),"AM") or contains(text(),"PM")]'));
    if (slots.length > 0) {
      await slots[0].click();
      await this.driver.sleep(300);
      return true;
    }
    return false;
  }

  async confirmBooking() {
    try {
      await waitAndClick(this.driver, this.selectors.confirmBtn);
      await this.driver.sleep(1500);
      return true;
    } catch { return false; }
  }

  async isBookingConfirmed() {
    try {
      await this.driver.wait(until.elementLocated(this.selectors.successCheck), 8000);
      return true;
    } catch { return false; }
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = AppointmentsPage;
