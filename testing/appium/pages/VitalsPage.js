'use strict';

const { takeScreenshot, tapElement, typeText } = require('../utils/appiumDriver');

class AppiumVitalsPage {
  constructor(driver) {
    this.driver = driver;
    this.sel = {
      systolicInput:  '//android.widget.EditText[contains(@hint,"120") or contains(@text,"120")]',
      diastolicInput: '//android.widget.EditText[contains(@hint,"80") or contains(@text,"80")]',
      heartRateInput: '//android.widget.EditText[contains(@hint,"72") or contains(@text,"72")]',
      glucoseInput:   '//android.widget.EditText[contains(@hint,"95") or contains(@text,"95")]',
      saveVitalsBtn:  '//android.widget.TextView[@text="Save Vitals" or @text="Submit"]',
      vitalsCard:     '//android.widget.TextView[contains(@text,"Blood Pressure")]',
    };
  }

  async isLoaded() {
    try {
      const card = await this.driver.$(this.sel.vitalsCard);
      return await card.isDisplayed();
    } catch {
      return false;
    }
  }

  async logVitals(systolic, diastolic, heartRate, glucose) {
    try {
      const inputs = await this.driver.$$('//android.widget.EditText');
      if (inputs.length >= 3) {
        await inputs[0].setValue(systolic.toString());
        await inputs[1].setValue(diastolic.toString());
        await inputs[2].setValue(heartRate.toString());
        if (inputs[3] && glucose) {
          await inputs[3].setValue(glucose.toString());
        }
        const saveBtn = await this.driver.$(this.sel.saveVitalsBtn);
        if (await saveBtn.isExisting()) {
          await saveBtn.click();
          await this.driver.pause(1500);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Vitals form submission failed:', e.message);
      return false;
    }
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = AppiumVitalsPage;
