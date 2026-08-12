'use strict';

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');

const COLORS = {
  PASS:    { argb: 'FF16A34A' },
  FAIL:    { argb: 'FFDC2626' },
  SKIP:    { argb: 'FFF59E0B' },
  BLOCK:   { argb: 'FF7C3AED' },
  HEADER:  { argb: 'FF0A0F1E' },
  HEADER_TEXT: { argb: 'FFFFFFFF' },
  ACCENT:  { argb: 'FF10B981' },
  LIGHT:   { argb: 'FFF1F5F9' },
};

function styleHeader(row) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.HEADER };
    cell.font = { bold: true, color: COLORS.HEADER_TEXT, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });
}

function styleDataRow(row, status) {
  const bgColor = status === 'PASS' ? { argb: 'FFECFDF5' }
    : status === 'FAIL' ? { argb: 'FFFEF2F2' }
    : status === 'SKIP' ? { argb: 'FFFEFCE8' }
    : { argb: 'FFF5F3FF' };

  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: bgColor };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'hair' }, right: { style: 'hair' }
    };
  });
}

async function generateExcelReport(summary) {
  await fs.ensureDir(path.join(config.REPORT_DIR, 'Excel'));
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VitalPredict QA Team';
  wb.created = new Date();
  wb.title = 'Selenium E2E Automation Report';

  // ── Sheet 1: All Test Cases ──────────────────────────────────────────────
  const allSheet = wb.addWorksheet('Executed Test Cases', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });
  allSheet.columns = [
    { header: 'Test ID',        key: 'testId',    width: 18 },
    { header: 'Module',         key: 'module',    width: 20 },
    { header: 'Test Name',      key: 'name',      width: 45 },
    { header: 'Priority',       key: 'priority',  width: 12 },
    { header: 'Status',         key: 'status',    width: 10 },
    { header: 'Duration',       key: 'duration',  width: 14 },
    { header: 'Failure Reason', key: 'reason',    width: 40 },
    { header: 'Screenshot',     key: 'screenshot',width: 30 },
    { header: 'Timestamp',      key: 'timestamp', width: 22 },
  ];
  styleHeader(allSheet.getRow(1));
  summary.results.forEach((r, i) => {
    const row = allSheet.addRow(r);
    styleDataRow(row, r.status);
    const statusCell = row.getCell('status');
    statusCell.font = { bold: true, color: r.status === 'PASS' ? COLORS.PASS : r.status === 'FAIL' ? COLORS.FAIL : COLORS.SKIP };
    if ((i + 2) % 2 === 0) {
      row.eachCell(cell => {
        if (!cell.fill || cell.fill.fgColor?.argb === 'FFFFFFFF') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLORS.LIGHT };
        }
      });
    }
  });
  allSheet.getRow(1).height = 24;

  // ── Sheet 2: Passed ───────────────────────────────────────────────────────
  const passSheet = wb.addWorksheet('Passed Tests');
  passSheet.columns = allSheet.columns;
  styleHeader(passSheet.getRow(1));
  summary.results.filter(r => r.status === 'PASS').forEach(r => {
    const row = passSheet.addRow(r);
    styleDataRow(row, 'PASS');
  });

  // ── Sheet 3: Failed ───────────────────────────────────────────────────────
  const failSheet = wb.addWorksheet('Failed Tests');
  failSheet.columns = allSheet.columns;
  styleHeader(failSheet.getRow(1));
  summary.results.filter(r => r.status === 'FAIL').forEach(r => {
    const row = failSheet.addRow(r);
    styleDataRow(row, 'FAIL');
  });

  // ── Sheet 4: Skipped ──────────────────────────────────────────────────────
  const skipSheet = wb.addWorksheet('Skipped Tests');
  skipSheet.columns = allSheet.columns;
  styleHeader(skipSheet.getRow(1));
  summary.results.filter(r => r.status === 'SKIP').forEach(r => {
    const row = skipSheet.addRow(r);
    styleDataRow(row, 'SKIP');
  });

  // ── Sheet 5: Execution Metrics ────────────────────────────────────────────
  const metricSheet = wb.addWorksheet('Execution Metrics');
  metricSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value',  key: 'value',  width: 20 },
  ];
  styleHeader(metricSheet.getRow(1));
  const metrics = [
    ['Build Number',       config.BUILD_NUMBER],
    ['Environment',        config.ENVIRONMENT],
    ['Base URL',           config.BASE_URL],
    ['Execution Date',     new Date().toISOString()],
    ['Total Test Cases',   summary.total],
    ['Passed',             summary.passed],
    ['Failed',             summary.failed],
    ['Skipped',            summary.skipped],
    ['Blocked',            summary.blocked],
    ['Pass Rate',          `${summary.passRate}%`],
    ['Total Duration',     `${(summary.totalDuration / 1000).toFixed(1)}s`],
    ['App Version',        config.APP_VERSION],
  ];
  metrics.forEach(([m, v]) => {
    const row = metricSheet.addRow({ metric: m, value: v });
    row.getCell('metric').font = { bold: true };
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' };
      cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    });
  });

  // ── Sheet 6: Defect Summary ───────────────────────────────────────────────
  const defectSheet = wb.addWorksheet('Defect Summary');
  defectSheet.columns = [
    { header: 'Test ID',  key: 'testId',  width: 18 },
    { header: 'Module',   key: 'module',  width: 20 },
    { header: 'Test Name',key: 'name',    width: 45 },
    { header: 'Priority', key: 'priority',width: 12 },
    { header: 'Reason',   key: 'reason',  width: 50 },
  ];
  styleHeader(defectSheet.getRow(1));
  summary.results.filter(r => r.status === 'FAIL').forEach(r => {
    const row = defectSheet.addRow(r);
    styleDataRow(row, 'FAIL');
  });

  // ── Sheet 7: Pass Rate by Module ──────────────────────────────────────────
  const moduleSheet = wb.addWorksheet('Pass Rate by Module');
  moduleSheet.columns = [
    { header: 'Module',    key: 'module',   width: 25 },
    { header: 'Total',     key: 'total',    width: 10 },
    { header: 'Passed',    key: 'passed',   width: 10 },
    { header: 'Failed',    key: 'failed',   width: 10 },
    { header: 'Pass Rate', key: 'passRate', width: 12 },
  ];
  styleHeader(moduleSheet.getRow(1));
  const moduleMap = {};
  summary.results.forEach(r => {
    if (!moduleMap[r.module]) moduleMap[r.module] = { total: 0, passed: 0, failed: 0 };
    moduleMap[r.module].total++;
    if (r.status === 'PASS') moduleMap[r.module].passed++;
    if (r.status === 'FAIL') moduleMap[r.module].failed++;
  });
  Object.entries(moduleMap).forEach(([mod, data]) => {
    const pr = ((data.passed / data.total) * 100).toFixed(1);
    const row = moduleSheet.addRow({ module: mod, ...data, passRate: `${pr}%` });
    styleDataRow(row, data.failed === 0 ? 'PASS' : 'FAIL');
  });

  const outputPath = path.join(config.REPORT_DIR, 'Excel', 'Automation_Test_Report.xlsx');
  await wb.xlsx.writeFile(outputPath);
  console.log(`✅ Excel report saved: ${outputPath}`);
  return outputPath;
}

if (require.main === module) {
  (async () => {
    try {
      const tracker = require('./testTracker');
      const summary = tracker.getSummary();
      await generateExcelReport(summary);
      console.log('✅ Excel report generation complete.');
    } catch (e) {
      console.error('❌ Error generating Excel report:', e);
      process.exit(1);
    }
  })();
}

module.exports = { generateExcelReport };

