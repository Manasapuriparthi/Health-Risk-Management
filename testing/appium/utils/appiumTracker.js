'use strict';
const results = [];
let startTime = Date.now();
function record(testId, module, name, priority, status, duration, reason = '', screenshot = '') {
  results.push({ testId, module, name, priority, status, duration: duration ? `${duration}ms` : '', reason, screenshot, timestamp: new Date().toISOString() });
}
function getSummary() {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const blocked = results.filter(r => r.status === 'BLOCK').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  return { total, passed, failed, skipped, blocked, passRate, totalDuration: Date.now() - startTime, results };
}
function reset() { results.length = 0; startTime = Date.now(); }
module.exports = { record, getSummary, reset, results };
