'use strict';

const { takeScreenshot } = require('../utils/appiumDriver');

class AppiumPredictorPage {
  constructor(driver) {
    this.driver = driver;
    this.sel = {
      ageInput:      '//android.widget.EditText[contains(@hint,"Age") or contains(@text,"45")]',
      calculateBtn:  '//android.widget.TextView[@text="Assess Health Risk" or contains(@text,"Calculate")]',
      riskScoreGauge:'//android.widget.TextView[contains(@text,"Risk Score") or contains(@text,"%")]',
    };
  }

  async isLoaded() {
    try {
      const btn = await this.driver.$(this.sel.calculateBtn);
      return await btn.isDisplayed();
    } catch {
      return false;
    }
  }

  async calculateRisk(age, cholesterol, glucose) {
    try {
      const inputs = await this.driver.$$('//android.widget.EditText');
      if (inputs.length > 0) {
        await inputs[0].setValue(age.toString());
      }
      const calcBtn = await this.driver.$(this.sel.calculateBtn);
      if (await calcBtn.isExisting()) {
        await calcBtn.click();
        await this.driver.pause(2000);
      }
      return true;
    } catch (e) {
      console.error('Risk prediction calculation failed:', e.message);
      return false;
    }
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = AppiumPredictorPage;
