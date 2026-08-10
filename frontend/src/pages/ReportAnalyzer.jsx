import React, { useState, useEffect, useRef } from 'react';

const MANUAL_FIELDS = [
  { key: 'systolic',     label: 'Systolic BP',        unit: 'mmHg', placeholder: '116' },
  { key: 'diastolic',    label: 'Diastolic BP',        unit: 'mmHg', placeholder: '83'  },
  { key: 'heart_rate',   label: 'Pulse / Heart Rate',  unit: 'bpm',  placeholder: '90'  },
  { key: 'spo2',         label: 'SpO2 / Oxygen Sat.',  unit: '%',    placeholder: '96'  },
  { key: 'weight',       label: 'Body Weight',          unit: 'kg',   placeholder: '65.8'},
  { key: 'glucose',      label: 'Blood Glucose (FBS)', unit: 'mg/dL',placeholder: '95'  },
  { key: 'cholesterol',  label: 'Total Cholesterol',   unit: 'mg/dL',placeholder: '180' },
  { key: 'hemoglobin',   label: 'Hemoglobin',           unit: 'g/dL', placeholder: '13.5'},
  { key: 'ldl',          label: 'LDL Cholesterol',     unit: 'mg/dL',placeholder: '90'  },
  { key: 'hdl',          label: 'HDL Cholesterol',     unit: 'mg/dL',placeholder: '55'  },
  { key: 'triglycerides',label: 'Triglycerides',       unit: 'mg/dL',placeholder: '140' },
  { key: 'wbc',          label: 'WBC Count',            unit: 'x10³/uL', placeholder: '7.0'},
  { key: 'rbc',          label: 'RBC Count',            unit: 'x10⁶/uL', placeholder: '4.5'},
];

export default function ReportAnalyzer({ token, API_BASE, onReportProcessed }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual'
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [manualValues, setManualValues] = useState({});
  const [sourceLabel, setSourceLabel] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/report/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setHistory(await res.json());
    } catch (_) {}
  };

  // ─── File Upload ──────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    const allowed = ['.pdf', '.txt', '.jpg', '.jpeg', '.png'];
    if (!allowed.includes(ext)) {
      setError('Unsupported format. Use .pdf, .txt, .jpg, or .png');
      setFile(null);
      return;
    }
    setFile(selected);
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;
    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.txt', '.jpg', '.jpeg', '.png'].includes(ext)) {
      setError('Unsupported format. Use .pdf, .txt, .jpg, or .png');
      return;
    }
    setFile(selected);
    setError('');
    setResult(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file first.'); return; }
    setLoading(true); setError(''); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/report/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchHistory();
        onReportProcessed?.();
        // If OCR failed or no metrics found, nudge user to manual entry
        if (data.ocr_error || Object.keys(data.extracted_values || {}).length === 0) {
          setError('');
          // pre-fill label
          setSourceLabel(file.name);
          setActiveTab('manual');
        }
      } else {
        setError(data.detail || 'Failed to parse report.');
      }
    } catch (_) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Manual Entry ─────────────────────────────────────────────────────────

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const filled = Object.entries(manualValues).filter(([, v]) => v !== '');
    if (filled.length === 0) { setError('Please fill in at least one value.'); return; }
    setLoading(true); setError(''); setResult(null);
    const payload = { source_label: sourceLabel || 'Manual Entry' };
    filled.forEach(([k, v]) => { payload[k] = parseFloat(v); });
    try {
      const res = await fetch(`${API_BASE}/report/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setManualValues({});
        fetchHistory();
        onReportProcessed?.();
      } else {
        setError(data.detail || 'Failed to save report.');
      }
    } catch (_) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const statusBadge = (status) => {
    const base = { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-block' };
    if (status?.includes('Critical')) return <span style={{ ...base, background: '#FEE2E2', color: '#991B1B' }}>{status}</span>;
    if (status === 'High' || status === 'Low') return <span style={{ ...base, background: '#FEF3C7', color: '#92400E' }}>{status}</span>;
    if (status === 'Normal') return <span style={{ ...base, background: '#D1FAE5', color: '#065F46' }}>{status}</span>;
    return <span style={{ ...base, background: '#EDE9FE', color: '#5B21B6' }}>{status}</span>;
  };

  const hasResults = result && Object.keys(result.analysis || {}).length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1>Medical Report Analyzer</h1>
        <p className="subtitle">
          Upload a PDF or image report for automatic extraction, or use Manual Entry to type values
          directly from a handwritten or image-based prescription.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

        {/* ── Left Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
            {['upload', 'manual'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setError(''); setResult(null); }}
                style={{
                  padding: '9px 24px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                  background: activeTab === tab ? 'var(--accent-teal)' : 'transparent',
                  color: activeTab === tab ? '#0f172a' : 'var(--text-secondary)'
                }}
              >
                {tab === 'upload' ? '📄 Upload File' : '✏️ Manual Entry'}
              </button>
            ))}
          </div>

          {/* ── UPLOAD TAB ── */}
          {activeTab === 'upload' && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '16px' }}>Upload Medical Report</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
                Supports <strong>PDF</strong> and <strong>text</strong> files with printed health data.<br />
                For handwritten or image reports, use <strong>Manual Entry</strong> instead.
              </p>

              <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    borderRadius: '14px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.01)',
                    transition: 'all 0.2s'
                  }}
                >
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }}
                    accept=".pdf,.txt,.jpg,.jpeg,.png" />
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                    stroke={dragOver ? 'var(--accent-teal)' : 'var(--text-muted)'}
                    strokeWidth="1.5" style={{ marginBottom: '10px', opacity: 0.8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {file ? (
                    <div>
                      <span style={{ fontWeight: '700', color: 'var(--accent-teal)', fontSize: '0.95rem' }}>📄 {file.name}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {(file.size / 1024).toFixed(1)} KB — Ready to upload
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Drag & drop or click to browse
                      </span>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        .pdf · .txt · .jpg · .png
                      </span>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" disabled={loading || !file}
                  style={{ padding: '13px 28px' }}>
                  {loading ? '⏳ Analyzing...' : '🔍 Upload & Analyze'}
                </button>
              </form>

              {/* OCR tip */}
              <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(99,102,241,0.07)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <strong>📸 Have a handwritten report like a clinic prescription?</strong><br />
                Switch to <strong>Manual Entry</strong> tab and type in the values shown on the report
                (BP, Pulse, SpO2, Weight, etc.). Your report from Sathish Gastro Clinic shows:<br />
                BP: 116/83 · SpO2: 96% · PR: 90 bpm · Wt: 65.8 kg — enter these directly.
              </div>
            </div>
          )}

          {/* ── MANUAL ENTRY TAB ── */}
          {activeTab === 'manual' && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '6px' }}>Manual Vitals Entry</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                Read values from your handwritten or printed report and enter them below.
                Leave fields blank if not present in the report.
              </p>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Source label */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Report Label / Source (optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={sourceLabel}
                    onChange={e => setSourceLabel(e.target.value)}
                    placeholder="e.g. Sathish Gastro Clinic — 03/07/2026"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                {/* Vitals grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {MANUAL_FIELDS.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                        {f.label}
                        <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '4px' }}>({f.unit})</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={manualValues[f.key] || ''}
                        onChange={e => setManualValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ fontSize: '0.9rem' }}
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}
                  style={{ padding: '13px 28px' }}>
                  {loading ? '⏳ Analyzing...' : '🧪 Analyze & Save Report'}
                </button>
              </form>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: '10px', color: '#991B1B', fontSize: '0.85rem', border: '1px solid #FECACA' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* ── RESULTS ── */}
          {result && (
            <div className="glass-panel animate-fade-in">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>
                    {hasResults ? '📊 Report Analysis Results' : '⚠️ No Metrics Extracted'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Source: <strong>{result.filename}</strong> · {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  {Object.keys(result.extracted_values || {}).length} marker{Object.keys(result.extracted_values || {}).length !== 1 ? 's' : ''} found
                </span>
              </div>

              {/* No metrics message */}
              {!hasResults && (
                <div style={{ padding: '20px', background: 'rgba(251,191,36,0.07)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.25)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    No standard health metrics were found in the uploaded file. This happens with handwritten prescriptions or image-based reports that don't contain machine-readable text.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: '14px', padding: '10px 20px', fontSize: '0.82rem' }}
                    onClick={() => { setActiveTab('manual'); setSourceLabel(result.filename); }}
                  >
                    ✏️ Switch to Manual Entry
                  </button>
                </div>
              )}

              {/* Results table */}
              {hasResults && (
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        {['Biomarker', 'Value', 'Status', 'Clinical Interpretation'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.analysis).map(([key, item]) => (
                        <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', fontSize: '0.88rem' }}>{item.marker_name}</td>
                          <td style={{ padding: '12px', fontWeight: '700', fontSize: '0.92rem' }}>
                            {item.value}{' '}
                            <span style={{ fontSize: '0.72rem', fontWeight: '400', color: 'var(--text-muted)' }}>{item.unit}</span>
                          </td>
                          <td style={{ padding: '12px' }}>{statusBadge(item.status)}</td>
                          <td style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>{item.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Clinical summary */}
              <div style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-teal)' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.92rem' }}>Clinical Summary & Recommendations</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {(result.summary || '')
                    .replace(/^### Medical Report Summary.*\n/, '')
                    .replace(/^Analyzed:.*\n/, '')
                    .trim()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar — History ── */}
        <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.4)', position: 'sticky', top: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>📁 Reports History</h3>
          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflowY: 'auto' }}>
              {history.map(doc => {
                const markerCount = Object.keys(doc.extracted_values || {}).length;
                const isActive = result?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setResult(doc)}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      background: isActive ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {doc.filename}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(doc.timestamp).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: markerCount > 0 ? 'var(--accent-teal)' : 'var(--text-muted)', fontWeight: '600' }}>
                        {markerCount > 0 ? `${markerCount} markers` : 'No metrics'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.83rem' }}>
              No reports saved yet.<br />
              <span style={{ fontSize: '0.75rem' }}>Upload or enter a report to get started.</span>
            </div>
          )}

          {/* Quick-use tip for the sample report */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--accent-teal)' }}>💡 Quick Tip</strong><br />
            For handwritten clinic reports, use <strong>Manual Entry</strong> and type values like:<br />
            BP · SpO2 · Pulse · Weight · Blood Sugar
          </div>
        </div>

      </div>
    </div>
  );
}
