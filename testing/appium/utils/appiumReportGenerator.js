let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (_) { ExcelJS = null; }
const fs = require('fs');
const path = require('path');
const config = require('../config/appium.config');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function generateAppiumReports(summary) {
  ensureDirSync(path.join(config.REPORT_DIR, 'Excel'));
  ensureDirSync(path.join(config.REPORT_DIR, 'HTML'));
  ensureDirSync(path.join(config.REPORT_DIR, 'JSON'));
  ensureDirSync(path.join(config.REPORT_DIR, 'Summary'));

  // Excel (if ExcelJS installed)
  if (ExcelJS) {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'VitalPredict Appium QA';
      wb.title = 'Appium Android E2E Report';

      const sheets = [
        ['All Test Cases', summary.results],
        ['Passed Tests', summary.results.filter(r => r.status === 'PASS')],
        ['Failed Tests', summary.results.filter(r => r.status === 'FAIL')],
        ['Skipped Tests', summary.results.filter(r => r.status === 'SKIP')],
        ['Blocked Tests', summary.results.filter(r => r.status === 'BLOCK')],
      ];

      const cols = [
        { header: 'Test ID',   key: 'testId',   width: 22 },
        { header: 'Module',    key: 'module',   width: 22 },
        { header: 'Test Name', key: 'name',     width: 50 },
        { header: 'Priority',  key: 'priority', width: 12 },
        { header: 'Status',    key: 'status',   width: 10 },
        { header: 'Duration',  key: 'duration', width: 14 },
        { header: 'Reason',    key: 'reason',   width: 40 },
        { header: 'Screenshot',key: 'screenshot',width: 30 },
      ];

      sheets.forEach(([sheetName, data]) => {
        const ws = wb.addWorksheet(sheetName);
        ws.columns = cols;
        const hRow = ws.getRow(1);
        hRow.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0F1E' } };
          c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        data.forEach(r => ws.addRow(r));
      });

      // Metrics sheet
      const mws = wb.addWorksheet('Execution Metrics');
      mws.columns = [{ header: 'Metric', key: 'm', width: 30 }, { header: 'Value', key: 'v', width: 20 }];
      [
        ['Build Number', config.BUILD_NUMBER],
        ['Platform', 'Android'],
        ['Total Tests', summary.total],
        ['Passed', summary.passed],
        ['Failed', summary.failed],
        ['Skipped', summary.skipped],
        ['Blocked', summary.blocked],
        ['Pass Rate', `${summary.passRate}%`],
        ['Duration', `${(summary.totalDuration / 1000).toFixed(1)}s`],
        ['Date', new Date().toISOString()],
      ].forEach(([m, v]) => mws.addRow({ m, v }));

      const excelPath = path.join(config.REPORT_DIR, 'Excel', 'Appium_Test_Report.xlsx');
      await wb.xlsx.writeFile(excelPath);
    } catch (_) {}
  }

  // HTML
  const passRate = parseFloat(summary.passRate);
  const gaugeColor = passRate >= 95 ? '#16a34a' : passRate >= 80 ? '#f59e0b' : '#ef4444';
  const testRows = summary.results.map(r => {
    const c = r.status === 'PASS' ? '#16a34a' : r.status === 'FAIL' ? '#ef4444' : '#f59e0b';
    return `<tr><td>${r.testId}</td><td>${r.module}</td><td>${r.name}</td>
      <td>${r.priority}</td><td style="color:${c};font-weight:bold">${r.status}</td>
      <td>${r.duration}</td><td>${r.reason || ''}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>VitalPredict Appium E2E Report</title>
  <style>body{font-family:system-ui;background:#0a0f1e;color:#f1f5f9;margin:0}
  header{background:linear-gradient(135deg,#10b981,#059669);padding:28px 36px}
  header h1{color:#fff;font-size:1.6rem}
  .container{max-width:1400px;margin:0 auto;padding:28px 20px}
  .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:28px}
  .card{background:#111827;border-radius:12px;padding:18px;text-align:center;border:1px solid rgba(255,255,255,0.07)}
  .card .lbl{font-size:0.72rem;color:#64748b;text-transform:uppercase;margin-bottom:5px}
  .card .val{font-size:1.8rem;font-weight:800}
  table{width:100%;border-collapse:collapse;font-size:0.82rem;background:#111827;border-radius:12px;overflow:hidden}
  th{background:#0a0f1e;color:#94a3b8;padding:10px 12px;text-align:left;font-size:0.7rem;text-transform:uppercase}
  td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.04)}
  </style></head><body>
  <header><h1>📱 Appium Android E2E Execution Report</h1>
  <div style="color:rgba(255,255,255,0.8);margin-top:4px">VitalPredict Mobile App • Build: ${config.BUILD_NUMBER} • ${new Date().toLocaleString()}</div>
  </header>
  <div class="container">
  <div class="cards">
    <div class="card"><div class="lbl">Total</div><div class="val" style="color:#6366f1">${summary.total}</div></div>
    <div class="card"><div class="lbl">Passed</div><div class="val" style="color:#10b981">${summary.passed}</div></div>
    <div class="card"><div class="lbl">Failed</div><div class="val" style="color:#ef4444">${summary.failed}</div></div>
    <div class="card"><div class="lbl">Skipped</div><div class="val" style="color:#f59e0b">${summary.skipped}</div></div>
    <div class="card"><div class="lbl">Pass Rate</div><div class="val" style="color:${gaugeColor}">${summary.passRate}%</div></div>
  </div>
  <table><thead><tr><th>Test ID</th><th>Module</th><th>Test Name</th><th>Priority</th><th>Status</th><th>Duration</th><th>Reason</th></tr></thead>
  <tbody>${testRows}</tbody></table></div></body></html>`;

  fs.writeFileSync(path.join(config.REPORT_DIR, 'HTML', 'appium-report.html'), html);

  // JSON
  fs.writeFileSync(path.join(config.REPORT_DIR, 'JSON', 'appium-results.json'), JSON.stringify({ summary, tests: summary.results }, null, 2));

  // Markdown
  const isInterrupted = summary.passed === 0 && summary.failed === 0 && summary.blocked > 0;
  const statusHeader = isInterrupted 
    ? '⚠️ **Suite Execution Interrupted / Setup Timeout** — Tests were blocked due to emulator or environment setup issue.'
    : summary.failed > 0 
      ? `❌ **Failures Recorded:** ${summary.failed} test(s) failed.` 
      : '✅ **All Completed Tests Passed Successfully!**';

  const failuresOrBlocks = summary.results.filter(r => r.status === 'FAIL' || r.status === 'BLOCK');
  const details = failuresOrBlocks.length > 0 
    ? failuresOrBlocks.slice(0, 15).map(r => `- ${r.status === 'FAIL' ? '❌' : '⚠️'} \`${r.testId}\` (${r.module}) — ${r.reason || 'Blocked/Failed'}`).join('\n')
    : '✅ No failures recorded.';

  const md = `# 📱 Appium Android E2E Summary

| Metric | Value |
|--------|-------|
| Total | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Blocked / Skipped | ${summary.blocked + summary.skipped} |
| Pass Rate | ${summary.passRate}% |
| Duration | ${(summary.totalDuration / 1000).toFixed(1)}s |

${statusHeader}

### Execution Details:
${details}
`;
  fs.writeFileSync(path.join(config.REPORT_DIR, 'Summary', 'appium-summary.md'), md);


  console.log(`✅ Appium reports generated. Total=${summary.total} Passed=${summary.passed} Failed=${summary.failed} Rate=${summary.passRate}%`);
}

if (require.main === module) {
  (async () => {
    try {
      const tracker = require('./appiumTracker');
      const summary = tracker.getSummary();
      await generateAppiumReports(summary);
      console.log('✅ Appium report generation complete.');
    } catch (e) {
      console.error('❌ Error generating Appium report:', e);
      process.exit(1);
    }
  })();
}

module.exports = { generateAppiumReports };
