import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, API_BASE, latestVital, onVitalLogged }) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [sleep, setSleep] = useState('');
  const [weight, setWeight] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const getHealthScoreDetails = (vital) => {
    if (!vital) return { total: 0, bp: 0, glucose: 0, hr: 0, sleep: 0, cholesterol: 0, active: 0 };
    
    let bpScore = 20;
    const sys = vital.systolic_bp;
    const dia = vital.diastolic_bp;
    if (sys && dia) {
      let sysPt = 10;
      if (sys >= 140) sysPt = 3;
      else if (sys >= 130) sysPt = 6;
      else if (sys >= 120) sysPt = 8;

      let diaPt = 10;
      if (dia >= 90) diaPt = 3;
      else if (dia >= 80) diaPt = 6;
      
      bpScore = sysPt + diaPt;
    }

    let glucoseScore = 20;
    const bs = vital.blood_sugar;
    if (bs) {
      if (bs >= 126 || bs < 70) glucoseScore = 6;
      else if (bs >= 100) glucoseScore = 12;
    }

    let hrScore = 15;
    const hr = vital.heart_rate;
    if (hr) {
      if (hr > 100 || hr < 55) hrScore = 5;
      else if (hr > 90 || hr < 60) hrScore = 10;
    }

    let sleepScore = 15;
    const sl = vital.sleep_hours;
    if (sl) {
      if (sl >= 7 && sl <= 9) sleepScore = 15;
      else if (sl >= 6 || sl <= 10) sleepScore = 11;
      else sleepScore = 6;
    }

    let cholScore = 15;
    const ch = vital.cholesterol;
    if (ch) {
      if (ch >= 240) cholScore = 5;
      else if (ch >= 200) cholScore = 10;
    }

    let activeScore = 15;
    const act = vital.active_minutes;
    if (act) {
      if (act >= 45) activeScore = 15;
      else if (act >= 30) activeScore = 12;
      else activeScore = 7;
    }

    const total = bpScore + glucoseScore + hrScore + sleepScore + cholScore + activeScore;
    return {
      total,
      bp: Math.round((bpScore / 20) * 100),
      glucose: Math.round((glucoseScore / 20) * 100),
      hr: Math.round((hrScore / 15) * 100),
      sleep: Math.round((sleepScore / 15) * 100),
      cholesterol: Math.round((cholScore / 15) * 100),
      active: Math.round((activeScore / 15) * 100)
    };
  };

  useEffect(() => {
    fetchHistory();
  }, [latestVital]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/vitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogVital = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      systolic_bp: systolic ? parseInt(systolic) : null,
      diastolic_bp: diastolic ? parseInt(diastolic) : null,
      blood_sugar: bloodSugar ? parseInt(bloodSugar) : null,
      heart_rate: heartRate ? parseInt(heartRate) : null,
      sleep_hours: sleep ? parseFloat(sleep) : null,
      weight: weight ? parseFloat(weight) : null,
      cholesterol: cholesterol ? parseInt(cholesterol) : null,
      active_minutes: activeMinutes ? parseInt(activeMinutes) : null
    };

    try {
      const res = await fetch(`${API_BASE}/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage('Vitals logged successfully!');
        // Clear fields
        setSystolic('');
        setDiastolic('');
        setBloodSugar('');
        setHeartRate('');
        setSleep('');
        setWeight('');
        setCholesterol('');
        setActiveMinutes('');
        onVitalLogged(); // trigger app refresh
      } else {
        const errData = await res.json();
        setMessage(`Error: ${errData.detail || 'Failed to save logs'}`);
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine clinical status badges
  const getBpBadge = (sys, dia) => {
    if (!sys || !dia) return <span className="badge badge-info">No Data</span>;
    if (sys >= 140 || dia >= 90) return <span className="badge badge-critical">Hypertension (Stg 2)</span>;
    if (sys >= 130 || dia >= 80) return <span className="badge badge-warning">Hypertension (Stg 1)</span>;
    if (sys >= 120) return <span className="badge badge-warning">Elevated</span>;
    return <span className="badge badge-normal">Normal</span>;
  };

  const getGlucoseBadge = (val) => {
    if (!val) return <span className="badge badge-info">No Data</span>;
    if (val >= 126) return <span className="badge badge-critical">Diabetic range</span>;
    if (val >= 100) return <span className="badge badge-warning">Prediabetic</span>;
    if (val < 70) return <span className="badge badge-critical">Hypoglycemia</span>;
    return <span className="badge badge-normal">Normal</span>;
  };

  const getCholesterolBadge = (val) => {
    if (!val) return <span className="badge badge-info">No Data</span>;
    if (val >= 240) return <span className="badge badge-critical">High Risk</span>;
    if (val >= 200) return <span className="badge badge-warning">Borderline</span>;
    return <span className="badge badge-normal">Desirable</span>;
  };

  const getHeartRateBadge = (val) => {
    if (!val) return <span className="badge badge-info">No Data</span>;
    if (val > 100) return <span className="badge badge-warning">Tachycardia</span>;
    if (val < 55) return <span className="badge badge-warning">Bradycardia</span>;
    return <span className="badge badge-normal">Normal</span>;
  };

  // Render a responsive SVG line chart
  const renderLineChart = (dataKey, strokeColor, title) => {
    const validPoints = history
      .filter(h => h[dataKey] !== null)
      .slice(0, 10) // show up to last 10 points
      .reverse(); // chronological order

    if (validPoints.length < 2) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px', color: 'var(--text-muted)' }}>
          Log at least 2 entries with {title} to display trend chart.
        </div>
      );
    }

    const values = validPoints.map(p => p[dataKey]);
    const maxVal = Math.max(...values) * 1.1;
    const minVal = Math.min(...values) * 0.9;
    const range = maxVal - minVal;

    const width = 500;
    const height = 150;
    const padding = 20;

    const points = validPoints.map((p, idx) => {
      const x = padding + (idx / (validPoints.length - 1)) * (width - padding * 2);
      const val = p[dataKey];
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y, val, date: new Date(p.timestamp).toLocaleDateString() };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title} History</h4>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {/* Grid lines */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="rgba(0,0,0,0.05)" strokeDasharray="4" />
          
          {/* Sparkline path */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Dots and Tooltips */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-primary)" stroke={strokeColor} strokeWidth="2.5" />
              <text x={p.x} y={p.y - 8} fontSize="10" fill="var(--text-primary)" textAnchor="middle" fontWeight="bold">
                {Math.round(p.val)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1>Health Dashboard</h1>
        <p className="subtitle">Track daily vitals, check clinical thresholds, and visualize history.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '32px' }}>
        {/* Left Column: Form */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Log Today's Vitals
          </h3>
          
          {message && (
            <div className={`badge ${message.startsWith('Error') ? 'badge-critical' : 'badge-normal'}`} style={{ width: '100%', padding: '10px', marginBottom: '16px', textTransform: 'none', borderRadius: '6px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogVital} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Systolic BP</label>
                <input type="number" className="form-control" placeholder="120" value={systolic} onChange={e=>setSystolic(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Diastolic BP</label>
                <input type="number" className="form-control" placeholder="80" value={diastolic} onChange={e=>setDiastolic(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Blood Sugar (mg/dL)</label>
              <input type="number" className="form-control" placeholder="e.g. 95" value={bloodSugar} onChange={e=>setBloodSugar(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Heart Rate (bpm)</label>
              <input type="number" className="form-control" placeholder="e.g. 72" value={heartRate} onChange={e=>setHeartRate(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Total Cholesterol (mg/dL)</label>
              <input type="number" className="form-control" placeholder="e.g. 180" value={cholesterol} onChange={e=>setCholesterol(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Sleep (hrs)</label>
                <input type="number" step="0.5" className="form-control" placeholder="7.5" value={sleep} onChange={e=>setSleep(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Weight (kg)</label>
                <input type="number" step="0.1" className="form-control" placeholder="70" value={weight} onChange={e=>setWeight(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Active Minutes</label>
              <input type="number" className="form-control" placeholder="e.g. 45" value={activeMinutes} onChange={e=>setActiveMinutes(e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px' }}>
              {loading ? 'Saving Logs...' : 'Record Entry'}
            </button>
          </form>
        </div>

        {/* Right Column: Grid and Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Health Score & Vitals Highlights Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
            {/* Circular Health Score Card */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', background: 'var(--bg-card)', padding: '20px' }} onClick={() => setShowScoreModal(true)}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Health Score</h3>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={getHealthScoreDetails(latestVital).total >= 80 ? 'var(--accent-emerald)' : (getHealthScoreDetails(latestVital).total >= 65 ? 'var(--accent-amber)' : 'var(--accent-rose)')}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * getHealthScoreDetails(latestVital).total) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  <text x="50" y="56" textAnchor="middle" fontSize="20" fontWeight="bold" fill="var(--text-primary)">
                    {getHealthScoreDetails(latestVital).total}
                  </text>
                </svg>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Click for breakdown</span>
            </div>

            {/* Vitals Highlights */}
            <div className="glass-panel" style={{ background: 'var(--bg-card)', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>Latest Vitals Status</h3>
              {latestVital ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  
                  <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Blood Pressure</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      {latestVital.systolic_bp && latestVital.diastolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp} mmHg` : 'N/A'}
                    </span>
                    {getBpBadge(latestVital.systolic_bp, latestVital.diastolic_bp)}
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Blood Sugar</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      {latestVital.blood_sugar ? `${latestVital.blood_sugar} mg/dL` : 'N/A'}
                    </span>
                    {getGlucoseBadge(latestVital.blood_sugar)}
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Cholesterol</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      {latestVital.cholesterol ? `${latestVital.cholesterol} mg/dL` : 'N/A'}
                    </span>
                    {getCholesterolBadge(latestVital.cholesterol)}
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Heart Rate</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      {latestVital.heart_rate ? `${latestVital.heart_rate} bpm` : 'N/A'}
                    </span>
                    {getHeartRateBadge(latestVital.heart_rate)}
                  </div>

                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '10px', fontSize: '0.85rem' }}>
                  Log your first daily vitals on the left to activate metrics cards.
                </div>
              )}
            </div>
          </div>

          {/* Vitals History Charts */}
          <div className="glass-panel">
            <h3>Health Vitals History (Last 10 Logs)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {renderLineChart('blood_sugar', 'var(--accent-indigo)', 'Blood Sugar')}
              {renderLineChart('systolic_bp', 'var(--accent-teal)', 'Systolic BP')}
            </div>
          </div>

        </div>
      </div>

      {/* HEALTH SCORE BREAKDOWN MODAL */}
      {showScoreModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }} onClick={() => setShowScoreModal(false)}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '550px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            padding: '32px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              border: 'none',
              background: 'transparent',
              fontSize: '1.5rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }} onClick={() => setShowScoreModal(false)}>
              &times;
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>Health Score Breakdown</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calculated from logged physiological indicators.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '32px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={getHealthScoreDetails(latestVital).total >= 80 ? 'var(--accent-emerald)' : (getHealthScoreDetails(latestVital).total >= 65 ? 'var(--accent-amber)' : 'var(--accent-rose)')}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * getHealthScoreDetails(latestVital).total) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="bold" fill="var(--text-primary)">
                  {getHealthScoreDetails(latestVital).total}
                </text>
              </svg>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Clinical Condition Rating</span>
                <strong style={{ fontSize: '1.15rem', color: getHealthScoreDetails(latestVital).total >= 80 ? 'var(--accent-emerald)' : (getHealthScoreDetails(latestVital).total >= 65 ? 'var(--accent-amber)' : 'var(--accent-rose)') }}>
                  {getHealthScoreDetails(latestVital).total >= 80 ? 'Excellent Status' : (getHealthScoreDetails(latestVital).total >= 65 ? 'Moderate Health' : 'Needs Medical Care')}
                </strong>
                <p style={{ fontSize: '0.8rem', marginTop: '4px', maxWidth: '280px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                  {getHealthScoreDetails(latestVital).total >= 80 ? 'Keep maintaining your daily active routine and balanced diet.' : (getHealthScoreDetails(latestVital).total >= 65 ? 'Vitals are close to clinical boundaries. Consider lowering sodium and increasing sleep.' : 'Multiple risk markers flagged. We recommend consulting a certified physician.')}
                </p>
              </div>
            </div>

            {/* Individual Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>🏃 Activity & Movement</strong>
                  <span>{getHealthScoreDetails(latestVital).active}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getHealthScoreDetails(latestVital).active}%`, height: '100%', background: 'var(--accent-teal)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>😴 Rest & Sleep Quality</strong>
                  <span>{getHealthScoreDetails(latestVital).sleep}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getHealthScoreDetails(latestVital).sleep}%`, height: '100%', background: 'var(--accent-indigo)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>🩺 Cardiovascular (BP & HR)</strong>
                  <span>{Math.round((getHealthScoreDetails(latestVital).bp + getHealthScoreDetails(latestVital).hr) / 2)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((getHealthScoreDetails(latestVital).bp + getHealthScoreDetails(latestVital).hr) / 2)}%`, height: '100%', background: 'var(--accent-emerald)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>🧪 Metabolic Markers (Glucose & Cholesterol)</strong>
                  <span>{Math.round((getHealthScoreDetails(latestVital).glucose + getHealthScoreDetails(latestVital).cholesterol) / 2)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((getHealthScoreDetails(latestVital).glucose + getHealthScoreDetails(latestVital).cholesterol) / 2)}%`, height: '100%', background: 'var(--accent-amber)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '30px' }} onClick={() => setShowScoreModal(false)}>
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
