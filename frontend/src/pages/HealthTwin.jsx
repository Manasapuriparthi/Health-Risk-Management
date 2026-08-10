import React, { useState, useEffect } from 'react';

export default function HealthTwin({ token, API_BASE, user, latestVital }) {
  const [weightChange, setWeightChange] = useState(0);
  const [activityChange, setActivityChange] = useState(0);
  const [sleepChange, setSleepChange] = useState(0);
  const [sodiumReduction, setSodiumReduction] = useState(false);
  const [smokingChange, setSmokingChange] = useState(0);

  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);

  // Trigger simulation whenever parameters change
  useEffect(() => {
    runSimulation();
  }, [weightChange, activityChange, sleepChange, sodiumReduction, smokingChange, latestVital]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/twin/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          weight_change: parseFloat(weightChange),
          activity_change: parseInt(activityChange),
          sodium_reduction: sodiumReduction,
          sleep_change: parseFloat(sleepChange),
          smoking_change: parseInt(smokingChange)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimData(data);
      }
    } catch (err) {
      console.error('Simulation call failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarGlowColor = () => {
    if (!simData) return 'var(--accent-teal)';
    // Compute average simulated risk
    const diabetes = simData.simulated_risks.diabetes.xgb.probability;
    const cvd = simData.simulated_risks.cvd.xgb.probability;
    const ht = simData.simulated_risks.hypertension.xgb.probability;
    const maxRisk = Math.max(diabetes, cvd, ht);

    if (maxRisk >= 0.6) return 'var(--accent-rose)'; // red
    if (maxRisk >= 0.3) return 'var(--accent-amber)'; // orange
    return 'var(--accent-teal)'; // normal green-teal
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1>AI Health Twin Simulator</h1>
        <p className="subtitle">Project lifestyle modifications to immediately observe predicted impacts on your health markers and ML-modeled risk states.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 320px 1fr', gap: '24px' }}>
        
        {/* Sliders Panel */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px' }}>Lifestyle Adjustments</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Weight Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Weight Change</span>
                <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: weightChange < 0 ? 'var(--accent-emerald)' : weightChange > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                  {weightChange > 0 ? `+${weightChange}` : weightChange} kg
                </span>
              </div>
              <input 
                type="range" 
                min="-15" 
                max="10" 
                step="0.5"
                style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
                value={weightChange} 
                onChange={e=>setWeightChange(e.target.value)} 
              />
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Drag left to simulate weight loss or right to simulate weight gain
              </span>
            </div>

            {/* Activity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Daily Activity Shift</span>
                <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: activityChange > 0 ? 'var(--accent-emerald)' : activityChange < 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                  {activityChange > 0 ? `+${activityChange}` : activityChange} min
                </span>
              </div>
              <input 
                type="range" 
                min="-45" 
                max="90" 
                step="5"
                style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                value={activityChange} 
                onChange={e=>setActivityChange(e.target.value)} 
              />
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Simulate increasing or decreasing daily exercise minutes
              </span>
            </div>

            {/* Sodium Adherence */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '10px 0' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>Sodium Restriction</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adhering to DASH diet rules</span>
              </div>
              <input 
                type="checkbox" 
                checked={sodiumReduction} 
                onChange={e=>setSodiumReduction(e.target.checked)} 
                style={{ width: '22px', height: '22px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
              />
            </div>

            {/* Smoking Change */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Smoking Status Change</label>
              <select className="form-control" value={smokingChange} onChange={e=>setSmokingChange(e.target.value)}>
                <option value={0}>No Change</option>
                <option value={-1}>Quit Smoking (Simulate quitting)</option>
                <option value={1}>Start Smoking (Simulate starting)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Visual Twin Avatar Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <h3 style={{ alignSelf: 'start', marginBottom: '16px' }}>Digital Avatar</h3>
          
          <div style={{ position: 'relative', width: '100%', height: '240px', display: 'flex', justifyContent: 'center' }}>
            {/* Styled interactive glowing human template SVG */}
            <svg width="180" height="240" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Human Outline */}
              <path 
                d="M50,15 C54,15 57,18 57,22 C57,26 54,29 50,29 C46,29 43,26 43,22 C43,18 46,15 50,15 Z M50,31 C57,31 66,35 66,45 L66,75 L61,75 L61,135 L52,135 L52,90 L48,90 L48,135 L39,135 L39,75 L34,75 L34,45 C34,35 43,31 50,31 Z" 
                fill="none" 
                stroke={getAvatarGlowColor()} 
                strokeWidth="2.5" 
                filter="url(#glow)"
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {/* Glowing Organs/Indicators */}
              <circle cx="50" cy="45" r="3" fill={getAvatarGlowColor()} filter="url(#glow)" style={{ transition: 'fill 0.4s ease' }} />
              <line x1="50" y1="45" x2="50" y2="70" stroke={getAvatarGlowColor()} strokeWidth="1" strokeDasharray="2" />
            </svg>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: getAvatarGlowColor(), border: `1px solid ${getAvatarGlowColor()}`, textTransform: 'none' }}>
              Twin State: {getAvatarGlowColor() === 'var(--accent-rose)' ? 'Critical Risk Warning' : getAvatarGlowColor() === 'var(--accent-amber)' ? 'Borderline Risk Warning' : 'Optimal/Normal Vitals'}
            </span>
          </div>
        </div>

        {/* Outputs Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {simData ? (
            <>
              {/* Vitals Shifts Card */}
              <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
                <h3 style={{ marginBottom: '16px' }}>Vital Shifts</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Blood Pressure</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{simData.baseline_vitals.systolic_bp}/{simData.baseline_vitals.diastolic_bp}</span>
                      <span>➔</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-teal)' }}>
                        {simData.simulated_vitals.systolic_bp}/{simData.simulated_vitals.diastolic_bp}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Blood Glucose</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{simData.baseline_vitals.blood_sugar}</span>
                      <span>➔</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-teal)' }}>
                        {simData.simulated_vitals.blood_sugar} mg/dL
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Body BMI</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{simData.baseline_vitals.bmi}</span>
                      <span>➔</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-teal)' }}>
                        {simData.simulated_vitals.bmi}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Risk Shifts Card */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '16px' }}>Simulated ML Risk Curves (XGBoost Classifier)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {["diabetes", "cvd", "hypertension"].map(disease => {
                    const base = simData.baseline_risks[disease].xgb.probability * 100;
                    const sim = simData.simulated_risks[disease].xgb.probability * 100;
                    const diff = base - sim;
                    
                    return (
                      <div key={disease} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: '16px' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '500', fontSize: '0.9rem' }}>
                          {disease === 'cvd' ? 'CVD Risk' : disease}
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {/* Baseline vs Simulated combined progress bars */}
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${base}%`, height: '100%', background: 'rgba(255,255,255,0.15)', position: 'absolute', left: 0 }} />
                            <div style={{ width: `${sim}%`, height: '100%', background: getAvatarGlowColor(), position: 'absolute', left: 0 }} />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Base: {Math.round(base)}% | Sim: {Math.round(sim)}%
                          </div>
                        </div>

                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right', color: diff > 0 ? 'var(--accent-emerald)' : diff < 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                          {diff > 0 ? `-${Math.round(diff)}%` : diff < 0 ? `+${Math.round(Math.abs(diff))}%` : '0%'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Narrative */}
              <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-indigo)', background: 'rgba(99, 102, 241, 0.05)' }}>
                <h4>Simulation Impact Narrative</h4>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {simData.narrative}
                </p>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading twin simulation dataset...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
