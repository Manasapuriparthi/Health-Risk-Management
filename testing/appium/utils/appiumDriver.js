'use strict';

const { remote } = require('webdriverio');
const config = require('../config/appium.config');
const fs = require('fs-extra');
const path = require('path');

async function buildAppiumDriver() {
  const driver = await remote({
    hostname: config.appiumServer.host,
    port: config.appiumServer.port,
    path: process.env.APPIUM_PATH || '/',
    capabilities: config.capabilities,
    connectionRetryTimeout: 180000,
    connectionRetryCount: 3,
  });
  await driver.setImplicitTimeout(config.IMPLICIT_WAIT);
  return driver;
}

async function takeScreenshot(driver, name) {
  try {
    await fs.ensureDir(config.SCREENSHOT_DIR);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    await driver.saveScreenshot(filepath);
    return filepath;
  } catch (e) {
    console.error('Screenshot failed:', e.message);
    return null;
  }
}

async function findElement(driver, selector, timeout = config.EXPLICIT_WAIT) {
  const el = await driver.$(selector);
  await el.waitForExist({ timeout });
  return el;
}

async function tapElement(driver, selector, timeout = config.EXPLICIT_WAIT) {
  const el = await findElement(driver, selector, timeout);
  await el.click();
  return el;
}

async function typeText(driver, selector, text, clear = true) {
  const el = await findElement(driver, selector);
  if (clear) await el.clearValue();
  await el.setValue(text);
  return el;
}

module.exports = { buildAppiumDriver, takeScreenshot, findElement, tapElement, typeText };
