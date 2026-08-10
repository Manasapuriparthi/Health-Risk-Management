'use strict';

const { By, until } = require('selenium-webdriver');
const { waitAndClick, takeScreenshot } = require('../utils/driver');
const config = require('../config/config');

class DashboardPage {
  constructor(driver) {
    this.driver = driver;
    this.selectors = {
      dashboardNav:     By.xpath('//button[contains(text(),"Dashboard")]'),
      predictorNav:     By.xpath('//button[contains(text(),"ML Predictor") or contains(text(),"Predictor")]'),
      twinNav:          By.xpath('//button[contains(text(),"Health Twin")]'),
      reportNav:        By.xpath('//button[contains(text(),"Report")]'),
      coachNav:         By.xpath('//button[contains(text(),"Health Coach") or contains(text(),"Coach")]'),
      plannersNav:      By.xpath('//button[contains(text(),"Planners")]'),
      appointmentsNav:  By.xpath('//button[contains(text(),"Appointment")]'),
      profileNav:       By.xpath('//button[contains(text(),"Profile")]'),
      newsNav:          By.xpath('//button[contains(text(),"News")]'),
      remindersNav:     By.xpath('//button[contains(text(),"Reminders")]'),
      signOutBtn:       By.xpath('//button[contains(text(),"Sign Out")]'),
      headingH1:        By.css('h1'),
      logVitalsBtn:     By.xpath('//button[contains(text(),"Log Vitals") or contains(text(),"log")]'),
      healthScoreEl:    By.css('[class*="score"], [class*="health"]'),
    };
  }

  async navigateTo(section) {
    const map = {
      dashboard:    this.selectors.dashboardNav,
      predictor:    this.selectors.predictorNav,
      twin:         this.selectors.twinNav,
      report:       this.selectors.reportNav,
      coach:        this.selectors.coachNav,
      planners:     this.selectors.plannersNav,
      appointments: this.selectors.appointmentsNav,
      profile:      this.selectors.profileNav,
      news:         this.selectors.newsNav,
      reminders:    this.selectors.remindersNav,
    };
    if (map[section]) {
      await waitAndClick(this.driver, map[section]);
      await this.driver.sleep(800);
    }
  }

  async getHeading() {
    try {
      const h = await this.driver.wait(until.elementLocated(this.selectors.headingH1), 8000);
      return await h.getText();
    } catch { return ''; }
  }

  async isSidebarVisible() {
    try {
      await this.driver.wait(until.elementLocated(By.css('aside')), 5000);
      return true;
    } catch { return false; }
  }

  async getAllNavButtons() {
    const btns = await this.driver.findElements(By.css('.nav-btn'));
    return Promise.all(btns.map(b => b.getText()));
  }

  async logout() {
    await waitAndClick(this.driver, this.selectors.signOutBtn);
    await this.driver.sleep(1000);
  }

  async screenshot(name) {
    return takeScreenshot(this.driver, name);
  }
}

module.exports = DashboardPage;
