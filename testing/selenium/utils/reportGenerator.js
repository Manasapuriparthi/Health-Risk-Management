'use strict';

const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

async function generateHTMLReport(summary) {
  await fs.ensureDir(path.join(config.REPORT_DIR, 'HTML'));

  const moduleMap = {};
  summary.results.forEach(r => {
    if (!moduleMap[r.module]) moduleMap[r.module] = { total: 0, passed: 0, failed: 0 };
    moduleMap[r.module].total++;
    if (r.status === 'PASS') moduleMap[r.module].passed++;
    if (r.status === 'FAIL') moduleMap[r.module].failed++;
  });

  const moduleRows = Object.entries(moduleMap).map(([mod, d]) => {
    const pr = ((d.passed / d.total) * 100).toFixed(1);
    const color = d.failed === 0 ? '#16a34a' : '#dc2626';
    return `<tr><td>${mod}</td><td>${d.total}</td>
      <td style="color:#16a34a;font-weight:bold">${d.passed}</td>
      <td style="color:#dc2626;font-weight:bold">${d.failed}</td>
      <td style="color:${color};font-weight:bold">${pr}%</td></tr>`;
  }).join('');

  const testRows = summary.results.map(r => {
    const sc = r.screenshot ? `<a href="../${r.screenshot}" target="_blank">📷</a>` : '';
    const statusColor = r.status === 'PASS' ? '#16a34a' : r.status === 'FAIL' ? '#dc2626' : '#f59e0b';
    const reasonCell = r.reason ? `<span style="color:#dc2626;font-size:0.8rem">${r.reason}</span>` : '';
    return `<tr>
      <td style="font-family:monospace;font-size:0.8rem">${r.testId}</td>
      <td>${r.module}</td>
      <td>${r.name}</td>
      <td><span class="badge badge-${r.priority?.toLowerCase()}">${r.priority}</span></td>
      <td><span style="color:${statusColor};font-weight:bold">${r.status}</span></td>
      <td>${r.duration}</td>
      <td>${reasonCell}</td>
      <td>${sc}</td>
    </tr>`;
  }).join('');

  const passRate = parseFloat(summary.passRate);
  const gaugeColor = passRate >= 95 ? '#16a34a' : passRate >= 80 ? '#f59e0b' : '#dc2626';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VitalPredict — Selenium E2E Execution Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#0a0f1e;color:#f1f5f9;line-height:1.5}
  header{background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;display:flex;justify-content:space-between;align-items:center}
  header h1{font-size:1.8rem;font-weight:800;color:#fff}
  header .meta{font-size:0.85rem;color:rgba(255,255,255,0.85);text-align:right}
  .container{max-width:1400px;margin:0 auto;padding:32px 24px}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px}
  .card{background:#111827;border-radius:12px;padding:20px;text-align:center;border:1px solid rgba(255,255,255,0.07)}
  .card .label{font-size:0.78rem;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px}
  .card .value{font-size:2rem;font-weight:800}
  .card.pass .value{color:#10b981}
  .card.fail .value{color:#ef4444}
  .card.skip .value{color:#f59e0b}
  .card.total .value{color:#6366f1}
  .card.rate .value{color:${gaugeColor}}
  .section{background:#111827;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07)}
  .section h2{font-size:1.1rem;font-weight:700;margin-bottom:16px;color:#f1f5f9;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:0.83rem}
  th{background:#0a0f1e;color:#94a3b8;padding:10px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em}
  td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.04)}
  tr:hover td{background:rgba(255,255,255,0.02)}
  .badge{padding:2px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;text-transform:uppercase}
  .badge-high{background:rgba(239,68,68,0.15);color:#ef4444}
  .badge-medium{background:rgba(245,158,11,0.15);color:#f59e0b}
  .badge-low{background:rgba(16,185,129,0.15);color:#10b981}
  .badge-critical{background:rgba(124,58,237,0.15);color:#7c3aed}
  .progress-bar{height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-top:8px}
  .progress-fill{height:100%;background:linear-gradient(90deg,#10b981,#059669);border-radius:4px}
  footer{text-align:center;padding:24px;color:#64748b;font-size:0.8rem;border-top:1px solid rgba(255,255,255,0.07)}
</style>
</head>
<body>
<header>
  <div>
    <h1>🧪 Selenium E2E Test Report</h1>
    <div style="color:rgba(255,255,255,0.8);margin-top:4px;font-size:0.9rem">VitalPredict Web Application</div>
  </div>
  <div class="meta">
    <div><strong>Build:</strong> ${config.BUILD_NUMBER}</div>
    <div><strong>Environment:</strong> ${config.ENVIRONMENT}</div>
    <div><strong>URL:</strong> ${config.BASE_URL}</div>
    <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Duration:</strong> ${(summary.totalDuration / 1000).toFixed(1)}s</div>
  </div>
</header>

<div class="container">
  <!-- Summary Cards -->
  <div class="cards">
    <div class="card total"><div class="label">Total</div><div class="value">${summary.total}</div></div>
    <div class="card pass"><div class="label">Passed</div><div class="value">${summary.passed}</div></div>
    <div class="card fail"><div class="label">Failed</div><div class="value">${summary.failed}</div></div>
    <div class="card skip"><div class="label">Skipped</div><div class="value">${summary.skipped}</div></div>
    <div class="card rate"><div class="label">Pass Rate</div><div class="value">${summary.passRate}%</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${summary.passRate}%"></div></div>
    </div>
  </div>

  <!-- Module Summary -->
  <div class="section">
    <h2>📊 Module Summary</h2>
    <table>
      <thead><tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr></thead>
      <tbody>${moduleRows}</tbody>
    </table>
  </div>

  <!-- All Test Cases -->
  <div class="section">
    <h2>🧾 Test Execution Details</h2>
    <table>
      <thead><tr><th>Test ID</th><th>Module</th><th>Test Name</th><th>Priority</th><th>Status</th><th>Duration</th><th>Failure Reason</th><th>Screenshot</th></tr></thead>
      <tbody>${testRows}</tbody>
    </table>
  </div>
</div>

<footer>Generated by VitalPredict QA Automation Framework • ${new Date().toISOString()}</footer>
</body></html>`;

  const outPath = path.join(config.REPORT_DIR, 'HTML', 'execution-report.html');
  await fs.writeFile(outPath, html);
  console.log(`✅ HTML report saved: ${outPath}`);
  return outPath;
}

async function generateJSONReport(summary) {
  await fs.ensureDir(path.join(config.REPORT_DIR, 'JSON'));
  const outPath = path.join(config.REPORT_DIR, 'JSON', 'execution-results.json');
  await fs.writeJSON(outPath, {
    meta: {
      buildNumber: config.BUILD_NUMBER,
      environment: config.ENVIRONMENT,
      baseUrl: config.BASE_URL,
      appVersion: config.APP_VERSION,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      blocked: summary.blocked,
      passRate: summary.passRate,
      durationMs: summary.totalDuration,
    },
    tests: summary.results,
  }, { spaces: 2 });
  console.log(`✅ JSON report saved: ${outPath}`);
}

async function generateMarkdownSummary(summary) {
  await fs.ensureDir(path.join(config.REPORT_DIR, 'Summary'));
  const failedTests = summary.results.filter(r => r.status === 'FAIL');
  const passedTests = summary.results.filter(r => r.status === 'PASS');

  const md = `# 🧪 VitalPredict Selenium E2E Execution Summary

## Build Information
| Field | Value |
|-------|-------|
| Build Number | ${config.BUILD_NUMBER} |
| Environment | ${config.ENVIRONMENT} |
| Base URL | ${config.BASE_URL} |
| App Version | ${config.APP_VERSION} |
| Execution Date | ${new Date().toISOString()} |
| Duration | ${(summary.totalDuration / 1000).toFixed(1)}s |

## Execution Metrics
| Metric | Count |
|--------|-------|
| Total Test Cases | **${summary.total}** |
| ✅ Passed | **${summary.passed}** |
| ❌ Failed | **${summary.failed}** |
| ⚠️ Skipped | **${summary.skipped}** |
| 🚫 Blocked | **${summary.blocked}** |
| Pass Rate | **${summary.passRate}%** |

## Failed Tests
${failedTests.length === 0 ? '✅ No failures!' : failedTests.map(t =>
  `- ❌ \`${t.testId}\` — **${t.name}**\n  - Reason: ${t.reason || 'Unknown'}`
).join('\n')}

## Passed Tests (sample)
${passedTests.slice(0, 20).map(t => `- ✅ \`${t.testId}\` — ${t.name}`).join('\n')}
${passedTests.length > 20 ? `\n_...and ${passedTests.length - 20} more passing tests_` : ''}
`;

  const outPath = path.join(config.REPORT_DIR, 'Summary', 'summary.md');
  await fs.writeFile(outPath, md);
  console.log(`✅ Markdown summary saved: ${outPath}`);
  return md;
}

if (require.main === module) {
  (async () => {
    try {
      const tracker = require('./testTracker');
      const summary = tracker.getSummary();
      await generateHTMLReport(summary);
      await generateJSONReport(summary);
      await generateMarkdownSummary(summary);
      console.log('✅ Selenium report generation complete.');
    } catch (e) {
      console.error('❌ Error generating Selenium report:', e);
      process.exit(1);
    }
  })();
}

module.exports = { generateHTMLReport, generateJSONReport, generateMarkdownSummary };

