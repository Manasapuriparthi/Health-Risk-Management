'use strict';
const fs = require('fs');
const path = require('path');
const config = require('../config/appium.config');

const results = [];
let startTime = Date.now();

function getRawFilePath() {
  return path.join(config.REPORT_DIR, 'appium-raw-results.json');
}

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function record(testId, module, name, priority, status, duration, reason = '', screenshot = '') {
  const entry = { testId, module, name, priority, status, duration: duration ? `${duration}ms` : '', reason, screenshot, timestamp: new Date().toISOString() };
  results.push(entry);

  try {
    const rawPath = getRawFilePath();
    ensureDirSync(config.REPORT_DIR);
    let existing = [];
    if (fs.existsSync(rawPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(rawPath, 'utf8')) || [];
      } catch (_) {
        existing = [];
      }
    }
    const idx = existing.findIndex(r => r.testId === testId);
    if (idx >= 0) existing[idx] = entry;
    else existing.push(entry);
    fs.writeFileSync(rawPath, JSON.stringify(existing, null, 2));
  } catch (e) {}
}

function getSummary() {
  let allResults = [...results];
  try {
    const rawPath = getRawFilePath();
    if (fs.existsSync(rawPath)) {
      try {
        const diskResults = JSON.parse(fs.readFileSync(rawPath, 'utf8')) || [];
        diskResults.forEach(dr => {
          if (!allResults.some(r => r.testId === dr.testId)) {
            allResults.push(dr);
          }
        });
      } catch (_) {}
    }
  } catch (e) {}

  const total = allResults.length;
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const skipped = allResults.filter(r => r.status === 'SKIP').length;
  const blocked = allResults.filter(r => r.status === 'BLOCK').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  return { total, passed, failed, skipped, blocked, passRate, totalDuration: Date.now() - startTime, results: allResults };
}

function reset() {
  results.length = 0;
  startTime = Date.now();
  try {
    const rawPath = getRawFilePath();
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  } catch (e) {}
}

module.exports = { record, getSummary, reset, results };
