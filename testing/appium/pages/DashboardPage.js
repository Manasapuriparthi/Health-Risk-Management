'use strict';

const { takeScreenshot } = require('../utils/appiumDriver');

class AppiumDashboardPage {
  constructor(driver) {
    this.driver = driver;
  }

  async isLoaded() {
    try {
      await this.driver.pause(1000);
      const el = await this.driver.$('//android.widget.TextView[contains(@text,"Dashboard") or contains(@text,"Good")]');
      return await el.isDisplayed();
    } catch { return false; }
  }

  async getScreenText() {
    try {
      const els = await this.driver.$$('//android.widget.TextView');
      const texts = await Promise.all(els.map(e => e.getText().catch(() => '')));
      return texts.join(' ');
    } catch { return ''; }
  }

  async tapBottomNavItem(index) {
    try {
      const navItems = await this.driver.$$('//android.widget.FrameLayout[@clickable="true"]');
      if (navItems[index]) {
        await navItems[index].click();
        await this.driver.pause(800);
        return true;
      }
      return false;
    } catch { return false; }
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = AppiumDashboardPage;
