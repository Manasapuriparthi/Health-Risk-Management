'use strict';

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/config');
const fs = require('fs-extra');
const path = require('path');

async function buildDriver() {
  const options = new chrome.Options();
  if (config.HEADLESS) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-infobars',
    '--remote-debugging-port=9222',
    `--window-size=${config.WINDOW_WIDTH},${config.WINDOW_HEIGHT}`
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: config.IMPLICIT_WAIT,
    pageLoad: config.PAGE_LOAD_TIMEOUT,
  });

  return driver;
}

async function takeScreenshot(driver, name) {
  try {
    await fs.ensureDir(config.SCREENSHOT_DIR);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    const image = await driver.takeScreenshot();
    await fs.writeFile(filepath, image, 'base64');
    return filepath;
  } catch (e) {
    console.error('Screenshot failed:', e.message);
    return null;
  }
}

async function waitAndClick(driver, locator, timeout = config.EXPLICIT_WAIT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  await driver.wait(until.elementIsEnabled(el), timeout);
  await el.click();
  return el;
}

async function waitAndType(driver, locator, text, clear = true, timeout = config.EXPLICIT_WAIT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  if (clear) await el.clear();
  await el.sendKeys(text);
  return el;
}

async function waitForText(driver, locator, text, timeout = config.EXPLICIT_WAIT) {
  return driver.wait(until.elementTextContains(
    driver.wait(until.elementLocated(locator), timeout), text
  ), timeout);
}

module.exports = { buildDriver, takeScreenshot, waitAndClick, waitAndType, waitForText, By, until };
