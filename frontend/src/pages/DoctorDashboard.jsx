import React, { useState, useEffect } from 'react';

export default function DoctorDashboard({ token, API_BASE, user }) {
  const [activeSubTab, setActiveSubTab] = useState('appointments'); // 'appointments' | 'triage' | 'copilot'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected patient details cache & expansion state
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [patientVitals, setPatientVitals] = useState({});
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Search filter for patients
  const [patientSearch, setPatientSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // AI Diagnostic Copilot query state
  const [clinicalQuery, setClinicalQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Patient triage roster data
  const [patientRoster] = useState([
    { id: 'P101', name: 'Marcus Vance', age: 52, bp: '158/98', heartRate: 92, bloodSugar: 185, riskLevel: 'HIGH', status: 'Requires Immediate Follow-up' },
    { id: 'P102', name: 'Sarah Jenkins', age: 29, bp: '115/72', heartRate: 68, bloodSugar: 92, riskLevel: 'LOW', status: 'Stable - Annual Checkup' },
    { id: 'P103', name: 'David Miller', age: 44, bp: '138/88', heartRate: 84, bloodSugar: 142, riskLevel: 'MODERATE', status: 'Hypertension Monitoring' },
    { id: 'P104', name: 'Elena Rostova', age: 61, bp: '162/102', heartRate: 98, bloodSugar: 210, riskLevel: 'HIGH', status: 'Severe Hyperglycemia' },
    { id: 'P105', name: 'Robert Chen', age: 38, bp: '122/80', heartRate: 74, bloodSugar: 105, riskLevel: 'LOW', status: 'Routine Observation' },
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
    if (patientDetails[patient_id]) {
      return;
    }

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

  const totalApps = appointments.length;
  const pendingApps = appointments.filter(a => a.status === 'pending').length;
  const acceptedApps = appointments.filter(a => a.status === 'accepted').length;

  const filteredRoster = patientRoster.filter(p => {
    const matchesName = p.name.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || p.riskLevel === riskFilter;
    return matchesName && matchesRisk;
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🩺</span>
            <h1 style={{ margin: 0 }}>Doctor Clinical Portal</h1>
          </div>
          <p className="subtitle" style={{ marginTop: '6px' }}>
            Welcome, <strong>Dr. {user?.username}</strong> {user?.specialty ? `(${user.specialty})` : ''}. Clinical triage, patient schedule, and diagnostic support.
          </p>
        </div>

        {/* SUB TAB SELECTOR BUTTONS */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn-secondary ${activeSubTab === 'appointments' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', background: activeSubTab === 'appointments' ? 'var(--accent-teal)' : 'transparent', color: activeSubTab === 'appointments' ? '#fff' : 'var(--text-muted)', border: 'none' }}
            onClick={() => setActiveSubTab('appointments')}
          >
            🗓️ Consultations ({totalApps})
          </button>
          <button 
            className={`btn-secondary ${activeSubTab === 'triage' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', background: activeSubTab === 'triage' ? 'var(--accent-indigo)' : 'transparent', color: activeSubTab === 'triage' ? '#fff' : 'var(--text-muted)', border: 'none' }}
            onClick={() => setActiveSubTab('triage')}
          >
            👥 Patient Triage Roster
          </button>
          <button 
            className={`btn-secondary ${activeSubTab === 'copilot' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', background: activeSubTab === 'copilot' ? 'var(--accent-amber)' : 'transparent', color: activeSubTab === 'copilot' ? '#fff' : 'var(--text-muted)', border: 'none' }}
            onClick={() => setActiveSubTab('copilot')}
          >
            🤖 Clinical AI Copilot
          </button>
        </div>
      </div>

      {error && (
        <div className="badge badge-critical" style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', textTransform: 'none', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* STATS TILES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scheduled Consultations</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px' }}>{totalApps}</span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-amber)' }}>{pendingApps}</span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed Consultations</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-emerald)' }}>{acceptedApps}</span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Risk Flagged Patients</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-rose)' }}>2</span>
        </div>
      </div>

      {/* TAB 1: APPOINTMENTS & CONSULTATIONS */}
      {activeSubTab === 'appointments' && (
        <div className="glass-panel" style={{ minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Scheduled Patient Consultations</h3>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={fetchAppointments}>
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
              Retrieving schedule details...
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗓️</span>
              <p>No patient consultation requests recorded in the system.</p>
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

      {/* TAB 2: PATIENT TRIAGE ROSTER */}
      {activeSubTab === 'triage' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Clinical Patient Triage Directory</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time risk scoring, vitals monitoring, and patient triage flags.</p>
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
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate Risk</option>
                <option value="LOW">Low / Optimal</option>
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
                  <th style={{ padding: '12px' }}>Triage Risk Flag</th>
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

      {/* TAB 3: CLINICAL AI COPILOT */}
      {activeSubTab === 'copilot' && (
        <div className="glass-panel">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Clinical Diagnostic AI Copilot</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ask clinical questions, verify diagnostic guidelines, and query evidence-based treatment algorithms.
            </p>
          </div>

          <form onSubmit={handleRunAiCopilot} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Clinical Query / Case Scenario
              </label>
              <textarea 
                rows="3"
                placeholder="e.g. Evaluate treatment protocol for 58yo male with BP 152/94, HbA1c 8.2%, and elevated LDL..."
                value={clinicalQuery}
                onChange={(e) => setClinicalQuery(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" type="submit" disabled={aiLoading} style={{ padding: '10px 24px' }}>
                {aiLoading ? 'Analyzing Clinical Guidelines...' : '🤖 Query Clinical Copilot'}
              </button>
            </div>
          </form>

          {aiResponse && (
            <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid var(--accent-indigo)' }}>
              <h4 style={{ margin: '0 0 10px', color: 'var(--accent-indigo)', fontSize: '0.95rem' }}>🤖 Clinical Diagnostic Response</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
