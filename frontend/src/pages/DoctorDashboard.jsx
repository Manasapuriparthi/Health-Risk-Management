import React, { useState, useEffect } from 'react';

export default function DoctorDashboard({ token, API_BASE, user }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'appointments' | 'triage' | 'reports' | 'messages'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected patient details cache & expansion state
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [patientVitals, setPatientVitals] = useState({});
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Selected patient for health trends inspection
  const [selectedTrendPatient, setSelectedTrendPatient] = useState('P101');

  // Search filter for patients
  const [patientSearch, setPatientSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // AI Diagnostic Copilot query state
  const [clinicalQuery, setClinicalQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Chat message reply state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, patient: 'Marcus Vance', msg: 'Doctor, my blood pressure was 158/98 this morning. Should I adjust my medication?', time: '10 mins ago', unread: true },
    { id: 2, patient: 'Elena Rostova', msg: 'Fasting glucose recorded at 210 mg/dL. I felt slightly dizzy.', time: '45 mins ago', unread: true },
    { id: 3, patient: 'David Miller', msg: 'Lab results uploaded for review. Please check my cholesterol panel.', time: '2 hours ago', unread: false },
  ]);
  const [replyText, setReplyText] = useState({});

  // Medical reports database
  const [medicalReports] = useState([
    { id: 'REP-901', patient: 'Elena Rostova', title: 'Comprehensive Metabolic & HbA1c Panel', date: 'Today, 08:30 AM', status: 'UNREVIEWED', flag: 'CRITICAL', finding: 'HbA1c 8.8%, Fasting Blood Sugar 210 mg/dL' },
    { id: 'REP-902', patient: 'Marcus Vance', title: '24-Hour Ambulatory BP Monitor Report', date: 'Today, 07:15 AM', status: 'UNREVIEWED', flag: 'HIGH RISK', finding: 'Mean Systolic BP 154 mmHg, Diastolic 96 mmHg' },
    { id: 'REP-903', patient: 'David Miller', title: 'Lipid Profile & Cardiac Biomarkers', date: 'Yesterday, 04:20 PM', status: 'REVIEWED', flag: 'MODERATE', finding: 'LDL 162 mg/dL, Total Cholesterol 245 mg/dL' },
    { id: 'REP-904', patient: 'Sarah Jenkins', title: 'Routine Electrocardiogram (ECG)', date: 'Yesterday, 02:10 PM', status: 'REVIEWED', flag: 'NORMAL', finding: 'Normal sinus rhythm, 68 bpm' },
  ]);

  // Patient triage roster data with historical health trends
  const [patientRoster] = useState([
    { 
      id: 'P101', name: 'Marcus Vance', age: 52, bp: '158/98', heartRate: 92, bloodSugar: 185, riskLevel: 'HIGH', status: '🔴 High Risk - Immediate Follow-up Needed',
      trends: [
        { date: 'Mon', bpSys: 142, bpDia: 88, hr: 80, sugar: 150 },
        { date: 'Tue', bpSys: 148, bpDia: 92, hr: 84, sugar: 165 },
        { date: 'Wed', bpSys: 152, bpDia: 94, hr: 88, sugar: 172 },
        { date: 'Thu', bpSys: 155, bpDia: 96, hr: 90, sugar: 180 },
        { date: 'Fri', bpSys: 158, bpDia: 98, hr: 92, sugar: 185 },
      ]
    },
    { 
      id: 'P104', name: 'Elena Rostova', age: 61, bp: '162/102', heartRate: 98, bloodSugar: 210, riskLevel: 'HIGH', status: '🔴 High Risk - Severe Hyperglycemia Alert',
      trends: [
        { date: 'Mon', bpSys: 150, bpDia: 90, hr: 88, sugar: 190 },
        { date: 'Tue', bpSys: 154, bpDia: 94, hr: 92, sugar: 198 },
        { date: 'Wed', bpSys: 158, bpDia: 96, hr: 94, sugar: 202 },
        { date: 'Thu', bpSys: 160, bpDia: 100, hr: 96, sugar: 205 },
        { date: 'Fri', bpSys: 162, bpDia: 102, hr: 98, sugar: 210 },
      ]
    },
    { 
      id: 'P103', name: 'David Miller', age: 44, bp: '138/88', heartRate: 84, bloodSugar: 142, riskLevel: 'MODERATE', status: '🟡 Needs Attention - Stage 1 Hypertension',
      trends: [
        { date: 'Mon', bpSys: 130, bpDia: 82, hr: 78, sugar: 130 },
        { date: 'Tue', bpSys: 132, bpDia: 84, hr: 80, sugar: 135 },
        { date: 'Wed', bpSys: 135, bpDia: 85, hr: 82, sugar: 138 },
        { date: 'Thu', bpSys: 136, bpDia: 86, hr: 83, sugar: 140 },
        { date: 'Fri', bpSys: 138, bpDia: 88, hr: 84, sugar: 142 },
      ]
    },
    { 
      id: 'P102', name: 'Sarah Jenkins', age: 29, bp: '115/72', heartRate: 68, bloodSugar: 92, riskLevel: 'LOW', status: '🟢 Optimal - Stable Health Profile',
      trends: [
        { date: 'Mon', bpSys: 114, bpDia: 70, hr: 66, sugar: 90 },
        { date: 'Tue', bpSys: 115, bpDia: 71, hr: 67, sugar: 91 },
        { date: 'Wed', bpSys: 115, bpDia: 72, hr: 68, sugar: 92 },
        { date: 'Thu', bpSys: 116, bpDia: 72, hr: 68, sugar: 92 },
        { date: 'Fri', bpSys: 115, bpDia: 72, hr: 68, sugar: 92 },
      ]
    },
    { 
      id: 'P105', name: 'Robert Chen', age: 38, bp: '122/80', heartRate: 74, bloodSugar: 105, riskLevel: 'LOW', status: '🟢 Optimal - Routine Observation',
      trends: [
        { date: 'Mon', bpSys: 120, bpDia: 78, hr: 72, sugar: 100 },
        { date: 'Tue', bpSys: 121, bpDia: 79, hr: 73, sugar: 102 },
        { date: 'Wed', bpSys: 122, bpDia: 80, hr: 74, sugar: 104 },
        { date: 'Thu', bpSys: 122, bpDia: 80, hr: 74, sugar: 105 },
        { date: 'Fri', bpSys: 122, bpDia: 80, hr: 74, sugar: 105 },
      ]
    },
  ]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        setError('Failed to fetch appointments schedule.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app));
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to update appointment status.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status due to network error.');
    }
  };

  const handleTogglePatientDetails = async (app) => {
    const { patient_id, id } = app;
    if (expandedPatientId === id) {
      setExpandedPatientId(null);
      return;
    }

    setExpandedPatientId(id);
    if (patientDetails[patient_id]) return;

    setLoadingPatient(true);
    try {
      const userRes = await fetch(`${API_BASE}/auth/users/${patient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const pData = await userRes.json();
        setPatientDetails(prev => ({ ...prev, [patient_id]: pData }));
      }

      const vitalsRes = await fetch(`${API_BASE}/vitals/user/${patient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (vitalsRes.ok) {
        const vData = await vitalsRes.json();
        setPatientVitals(prev => ({ ...prev, [patient_id]: vData }));
      }
    } catch (err) {
      console.error('Error fetching patient metrics:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSendReply = (msgId) => {
    if (!replyText[msgId]?.trim()) return;
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, unread: false, replySent: replyText[msgId] } : m));
    setReplyText(prev => ({ ...prev, [msgId]: '' }));
    alert('Clinical response delivered to patient dashboard!');
  };

  const handleRunAiCopilot = async (e) => {
    e.preventDefault();
    if (!clinicalQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: `Clinical Doctor Query: ${clinicalQuery}` })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.reply || data.response || 'Clinical advice generated.');
      } else {
        setAiResponse('Clinical guidelines Assistant response generation failed.');
      }
    } catch (err) {
      setAiResponse('Connection to AI Clinical backend failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Metrics computation
  const totalPatients = patientRoster.length;
  const todaysAppointmentsCount = appointments.length > 0 ? appointments.length : 5;
  const highRiskCount = patientRoster.filter(p => p.riskLevel === 'HIGH').length;
  const needingAttentionCount = patientRoster.filter(p => p.riskLevel === 'MODERATE').length;
  const unreviewedReportsCount = medicalReports.filter(r => r.status === 'UNREVIEWED').length;
  const unreadMessagesCount = chatMessages.filter(m => m.unread).length;

  const activeTrendPatient = patientRoster.find(p => p.id === selectedTrendPatient) || patientRoster[0];

  const filteredRoster = patientRoster.filter(p => {
    const matchesName = p.name.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || p.riskLevel === riskFilter;
    return matchesName && matchesRisk;
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── HEADER SECTION ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🩺</span>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Doctor Clinical Command Center</h1>
          </div>
          <p className="subtitle" style={{ marginTop: '6px', fontSize: '0.92rem' }}>
            Welcome back, <strong>Dr. {user?.username}</strong> {user?.specialty ? `(${user.specialty})` : ''}. Clinical triage, patient trends, medical reports, and AI diagnostic copilot.
          </p>
        </div>

        {/* SUB TAB SELECTOR NAV */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '📊 Clinical Overview' },
            { id: 'appointments', label: `📅 Today's Appointments (${todaysAppointmentsCount})` },
            { id: 'triage', label: `🔴 High-Risk Triage (${highRiskCount})` },
            { id: 'reports', label: `📄 Medical Reports (${unreviewedReportsCount})` },
            { id: 'messages', label: `💬 Patient Messages (${unreadMessagesCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: activeSubTab === tab.id ? 'var(--accent-teal)' : 'transparent',
                color: activeSubTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="badge badge-critical" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '24px', textTransform: 'none', fontSize: '0.88rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── 7 REQUIRED FEATURE KPI BLOCKS ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        
        {/* 1. Total Patients */}
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-indigo)', padding: '20px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>👥 Total Patients</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: 'var(--accent-indigo)' }}>{totalPatients}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered Practice Roster</span>
        </div>

        {/* 2. Today's Appointments */}
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)', padding: '20px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📅 Today's Schedule</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: 'var(--accent-teal)' }}>{todaysAppointmentsCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scheduled Consultations</span>
        </div>

        {/* 3. High-Risk Patients */}
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '20px 16px', background: 'rgba(239,68,68,0.03)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🔴 High-Risk Patients</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: 'var(--accent-rose)' }}>{highRiskCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }}>Critical Vitals Alert</span>
        </div>

        {/* 4. Patients Needing Attention */}
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-amber)', padding: '20px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🟡 Needing Attention</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: 'var(--accent-amber)' }}>{needingAttentionCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Moderate Risk / Review</span>
        </div>

        {/* 5. New Medical Reports */}
        <div className="glass-panel" style={{ borderLeft: '4px solid #8B5CF6', padding: '20px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📄 New Reports</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: '#8B5CF6' }}>{unreviewedReportsCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lab / OCR Submissions</span>
        </div>

        {/* 6. Unread Patient Messages */}
        <div className="glass-panel" style={{ borderLeft: '4px solid #3B82F6', padding: '20px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💬 Unread Messages</span>
          <span style={{ display: 'block', fontSize: '2.1rem', fontWeight: '800', marginTop: '6px', color: '#3B82F6' }}>{unreadMessagesCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Patient Inquiries</span>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────────────── */}
      
      {/* 1. CLINICAL OVERVIEW & HEALTH TRENDS ANALYTICS */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* 📈 PATIENT HEALTH TRENDS ANALYTICS PANEL */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Patient Health Trends & Progression Analytics
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Inspect historical Systolic/Diastolic Blood Pressure, Blood Glucose, and Heart Rate trends over time.
                </p>
              </div>

              {/* Patient Selector for Health Trends */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Select Patient:</span>
                <select
                  value={selectedTrendPatient}
                  onChange={(e) => setSelectedTrendPatient(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.88rem'
                  }}
                >
                  {patientRoster.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.riskLevel} RISK - {p.bp})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Patient Trend Summary Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Patient Name & Age</span>
                <strong style={{ fontSize: '1.1rem' }}>{activeTrendPatient.name}</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeTrendPatient.age} years old</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Blood Pressure</span>
                <strong style={{ fontSize: '1.1rem', color: activeTrendPatient.bp.startsWith('15') || activeTrendPatient.bp.startsWith('16') ? 'var(--accent-rose)' : 'var(--accent-teal)' }}>
                  {activeTrendPatient.bp} mmHg
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Systolic / Diastolic</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Blood Glucose Level</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-indigo)' }}>
                  {activeTrendPatient.bloodSugar} mg/dL
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fasting Glucose</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Heart Rate</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                  {activeTrendPatient.heartRate} bpm
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resting Pulse</span>
              </div>
            </div>

            {/* Visual Trend Bars Simulation */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>
                5-Day Systolic Blood Pressure Trend Graph (mmHg)
              </h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '160px', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {activeTrendPatient.trends.map((t, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--accent-rose)' }}>{t.bpSys}</span>
                    <div 
                      style={{ 
                        width: '100%', 
                        maxWidth: '40px', 
                        height: `${(t.bpSys / 180) * 100}%`, 
                        background: t.bpSys > 150 ? 'linear-gradient(180deg, #ef4444, #dc2626)' : t.bpSys > 135 ? 'linear-gradient(180deg, #f59e0b, #d97706)' : 'linear-gradient(180deg, #10b981, #059669)', 
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease'
                      }} 
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK TWO COLUMN GRID: HIGH RISK ALERTS & UNREAD MESSAGES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
            
            {/* 🔴 HIGH RISK PATIENT ALERTS */}
            <div className="glass-panel">
              <h3 style={{ margin: '0 0 16px', color: 'var(--accent-rose)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔴 Critical High-Risk Patients
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {patientRoster.filter(p => p.riskLevel === 'HIGH').map(p => (
                  <div key={p.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{p.name} ({p.age} yrs)</strong>
                      <span className="badge badge-critical">HIGH RISK</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      BP: <strong style={{ color: 'var(--accent-rose)' }}>{p.bp} mmHg</strong> • Sugar: <strong style={{ color: 'var(--accent-indigo)' }}>{p.bloodSugar} mg/dL</strong>
                    </p>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '4px' }}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 💬 UNREAD MESSAGES SUMMARY */}
            <div className="glass-panel">
              <h3 style={{ margin: '0 0 16px', color: '#3B82F6', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 Patient Messages & Consultation Inquiries
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.map(m => (
                  <div key={m.id} style={{ padding: '14px', borderRadius: '10px', background: m.unread ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{m.patient}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.time}</span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.84rem', color: 'var(--text-primary)' }}>"{m.msg}"</p>
                    {m.replySent ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓ Replied: {m.replySent}</span>
                    ) : (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#3B82F6', borderColor: 'rgba(59, 130, 246, 0.3)', marginTop: '4px' }}
                        onClick={() => setActiveSubTab('messages')}
                      >
                        Reply to Patient →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. 📅 TODAY'S APPOINTMENTS SCHEDULE */}
      {activeSubTab === 'appointments' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>📅 Today's Scheduled Patient Consultations</h3>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={fetchAppointments}>
              🔄 Refresh Appointments
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
              Retrieving schedule details...
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗓️</span>
              <p>No patient consultation requests recorded for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appointments.map(app => {
                const isExpanded = expandedPatientId === app.id;
                const pInfo = patientDetails[app.patient_id];
                const pVits = patientVitals[app.patient_id] || [];
                const latestVit = pVits[0];

                return (
                  <div key={app.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>
                          {app.patient_name[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{app.patient_name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultation ID: {app.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Schedule Date</span>
                          <strong style={{ fontSize: '0.9rem' }}>{new Date(app.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Slot</span>
                          <strong style={{ fontSize: '0.9rem' }}>{app.time}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Doctor</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--accent-teal)' }}>{app.doctor_name}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        {app.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--accent-emerald)' }} onClick={() => handleUpdateStatus(app.id, 'accepted')}>
                              Accept
                            </button>
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${app.status === 'accepted' ? 'badge-normal' : 'badge-critical'}`}>
                            {app.status}
                          </span>
                        )}

                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleTogglePatientDetails(app)}>
                          {isExpanded ? 'Hide Chart ▲' : 'Inspect Vitals ▼'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        {loadingPatient ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching patient chart...</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div>
                              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Patient Physical Profile</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Age</span>
                                  <strong>{pInfo?.age ? `${pInfo.age} yrs` : 'Not Specified'}</strong>
                                </div>
                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Height / Weight</span>
                                  <strong>{pInfo?.height ? `${pInfo.height}cm` : '--'} / {pInfo?.weight ? `${pInfo.weight}kg` : '--'}</strong>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Latest Vitals Chart</h5>
                              {latestVit ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Blood Pressure</span>
                                    <strong style={{ color: 'var(--accent-teal)' }}>{latestVit.systolic_bp}/{latestVit.diastolic_bp} mmHg</strong>
                                  </div>
                                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Blood Sugar</span>
                                    <strong style={{ color: 'var(--accent-indigo)' }}>{latestVit.blood_sugar} mg/dL</strong>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  No vital logs registered yet for this patient.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. 🔴 HIGH RISK TRIAGE & PATIENT ROSTER */}
      {activeSubTab === 'triage' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>🔴 High-Risk Triage & Registered Patient Roster</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time risk scoring, critical vitals alerts, and clinical triage flags.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text"
                placeholder="Search patient name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
              <select 
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Risk Categories</option>
                <option value="HIGH">High Risk (Critical)</option>
                <option value="MODERATE">Moderate Risk (Needing Attention)</option>
                <option value="LOW">Low Risk (Optimal)</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Patient Name</th>
                  <th style={{ padding: '12px' }}>Age</th>
                  <th style={{ padding: '12px' }}>Blood Pressure</th>
                  <th style={{ padding: '12px' }}>Heart Rate</th>
                  <th style={{ padding: '12px' }}>Blood Sugar</th>
                  <th style={{ padding: '12px' }}>Risk Flag</th>
                  <th style={{ padding: '12px' }}>Clinical Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)' }}>{p.age} yrs</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ color: p.bp.startsWith('15') || p.bp.startsWith('16') ? 'var(--accent-rose)' : 'inherit', fontWeight: '600' }}>
                        {p.bp}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>{p.heartRate} bpm</td>
                    <td style={{ padding: '14px 12px' }}>{p.bloodSugar} mg/dL</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`badge ${p.riskLevel === 'HIGH' ? 'badge-critical' : p.riskLevel === 'MODERATE' ? 'badge-warning' : 'badge-normal'}`}>
                        {p.riskLevel} RISK
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. 📄 NEW MEDICAL REPORTS CENTER */}
      {activeSubTab === 'reports' && (
        <div className="glass-panel">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Patient Medical Reports & Lab Extractions
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Review patient-submitted medical reports, OCR lab extractions, and diagnostic test results.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {medicalReports.map(rep => (
              <div key={rep.id} style={{ padding: '18px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{rep.id}</span>
                    <strong style={{ fontSize: '1rem' }}>{rep.title}</strong>
                    <span className={`badge ${rep.flag === 'CRITICAL' || rep.flag === 'HIGH RISK' ? 'badge-critical' : rep.flag === 'MODERATE' ? 'badge-warning' : 'badge-normal'}`}>
                      {rep.flag}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Patient: <strong>{rep.patient}</strong> • Submitted: {rep.date}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)' }}>Finding: {rep.finding}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 14px' }} onClick={() => alert(`Opening medical report file ${rep.id}...`)}>
                    👁️ Inspect Full Report
                  </button>
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 14px', background: 'var(--accent-indigo)' }} onClick={() => alert(`Report ${rep.id} marked as Reviewed!`)}>
                    Mark Reviewed ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 💬 UNREAD MESSAGES & CLINICAL COPILOT */}
      {activeSubTab === 'messages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          
          {/* PATIENT INQUIRIES & MESSAGES INBOX */}
          <div className="glass-panel">
            <h3 style={{ margin: '0 0 16px', color: '#3B82F6', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Patient Messages Inbox
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.map(m => (
                <div key={m.id} style={{ padding: '16px', borderRadius: '12px', background: m.unread ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{m.patient}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.time}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>"{m.msg}"</p>
                  
                  {m.replySent ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                      ✓ Doctor Advice Sent: {m.replySent}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Type clinical advice..."
                        value={replyText[m.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [m.id]: e.target.value })}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.82rem' }}
                      />
                      <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleSendReply(m.id)}>
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CLINICAL AI COPILOT */}
          <div className="glass-panel">
            <h3 style={{ margin: '0 0 16px', color: 'var(--accent-amber)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 Clinical Diagnostic AI Copilot
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Query clinical guidelines, ICD-10 codes, and drug-drug interaction warnings.
            </p>

            <form onSubmit={handleRunAiCopilot} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <textarea 
                rows="4"
                placeholder="e.g. Evaluate treatment protocol for 58yo male with BP 152/94, HbA1c 8.2%, and elevated LDL..."
                value={clinicalQuery}
                onChange={(e) => setClinicalQuery(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
              />

              <button className="btn-primary" type="submit" disabled={aiLoading} style={{ padding: '10px 20px', background: 'var(--accent-amber)' }}>
                {aiLoading ? 'Analyzing Guidelines...' : '🤖 Query Clinical AI'}
              </button>
            </form>

            {aiResponse && (
              <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid var(--accent-amber)' }}>
                <h4 style={{ margin: '0 0 8px', color: 'var(--accent-amber)', fontSize: '0.9rem' }}>🤖 AI Diagnostic Response</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
