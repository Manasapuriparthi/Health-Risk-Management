import React, { useState, useEffect } from 'react';

export default function Predictor({ token, API_BASE, latestVital, user }) {
  const [age, setAge] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [bmi, setBmi] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [smoking, setSmoking] = useState(0);
  const [alcohol, setAlcohol] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Prefill values from user profile and latest vital
  useEffect(() => {
    if (user) {
      setAge(user.age || '');
      setActiveMinutes(user.active_minutes || '30');
    }
    if (latestVital) {
      setSystolic(latestVital.systolic_bp || '');
      setDiastolic(latestVital.diastolic_bp || '');
      setBloodSugar(latestVital.blood_sugar || '');
      setCholesterol(latestVital.cholesterol || '');
      
      // Calculate BMI
      const weight = latestVital.weight || (user && user.weight);
      const height = user && user.height;
      if (weight && height) {
        setBmi(Math.round((weight / ((height / 100.0) ** 2)) * 10) / 10);
      }
    }
  }, [latestVital, user]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const payload = {
      age: age ? parseInt(age) : null,
      systolic_bp: systolic ? parseInt(systolic) : null,
      diastolic_bp: diastolic ? parseInt(diastolic) : null,
      blood_sugar: bloodSugar ? parseInt(bloodSugar) : null,
      cholesterol: cholesterol ? parseInt(cholesterol) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      active_minutes: activeMinutes ? parseInt(activeMinutes) : null,
      smoking: parseInt(smoking),
      alcohol: parseInt(alcohol)
    };

    try {
      const res = await fetch(`${API_BASE}/prediction/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Prediction failed. Verify parameters.');
      }
    } catch (err) {
      setError('Connection to backend server failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderImportanceChart = (importances) => {
    // Sort features by weight
    const sorted = Object.entries(importances).sort((a, b) => b[1] - a[1]);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {sorted.map(([feature, weight]) => {
          const percent = Math.round(weight * 100);
          return (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '130px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {feature.replace('_', ' ')}
              </span>
              <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-indigo))', borderRadius: '4px' }}></div>
              </div>
              <span style={{ width: '35px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-teal)' }}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getRiskColor = (prob) => {
    if (prob >= 0.6) return 'var(--accent-rose)';
    if (prob >= 0.3) return 'var(--accent-amber)';
    return 'var(--accent-emerald)';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1>Health Risk Predictor</h1>
        <p className="subtitle">Utilize Random Forest and XGBoost machine learning models to assess health risks.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px' }}>
        
        {/* Parameters Form Panel */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            ML Prediction Parameters
          </h3>

          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Age</label>
                <input type="number" className="form-control" value={age} onChange={e=>setAge(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>BMI</label>
                <input type="number" step="0.1" className="form-control" placeholder="e.g. 24.5" value={bmi} onChange={e=>setBmi(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Systolic BP (mmHg)</label>
                <input type="number" className="form-control" value={systolic} onChange={e=>setSystolic(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Diastolic BP (mmHg)</label>
                <input type="number" className="form-control" value={diastolic} onChange={e=>setDiastolic(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Glucose (mg/dL)</label>
                <input type="number" className="form-control" value={bloodSugar} onChange={e=>setBloodSugar(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cholesterol (mg/dL)</label>
                <input type="number" className="form-control" value={cholesterol} onChange={e=>setCholesterol(e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Daily Active Minutes</label>
              <input type="number" className="form-control" value={activeMinutes} onChange={e=>setActiveMinutes(e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Smoking Status</label>
                <select className="form-control" value={smoking} onChange={e=>setSmoking(e.target.value)}>
                  <option value={0}>Non-Smoker</option>
                  <option value={1}>Active Smoker</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Alcohol Intake</label>
                <select className="form-control" value={alcohol} onChange={e=>setAlcohol(e.target.value)}>
                  <option value={0}>No / Occasional</option>
                  <option value={1}>Regular Drinker</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '14px', marginTop: '12px' }}>
              {loading ? 'Evaluating Algorithms...' : 'Calculate Health Risks'}
            </button>
          </form>
        </div>

        {/* Prediction Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {error && (
            <div className="glass-panel" style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Risks Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                
                {Object.entries(result.predictions).map(([disease, algs]) => {
                  const rfProb = algs.rf.probability;
                  const xgbProb = algs.xgb.probability;
                  const avgProb = (rfProb + xgbProb) / 2;

                  return (
                    <div key={disease} className="glass-panel" style={{ borderLeft: `4px solid ${getRiskColor(avgProb)}` }}>
                      <h3 style={{ textTransform: 'capitalize', color: 'var(--text-primary)', marginBottom: '16px' }}>
                        {disease === 'cvd' ? 'Cardiovascular Disease' : disease} Risk
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Random Forest Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Random Forest</span>
                            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: getRiskColor(rfProb) }}>
                              {Math.round(rfProb * 100)}%
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${rfProb * 100}%`, height: '100%', background: getRiskColor(rfProb), borderRadius: '4px' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>Speed: {algs.rf.time_ms.toFixed(2)}ms</span>
                            <span style={{ marginLeft: 'auto' }}>Acc: {(algs.rf.test_accuracy * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* XGBoost Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>XGBoost</span>
                            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: getRiskColor(xgbProb) }}>
                              {Math.round(xgbProb * 100)}%
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${xgbProb * 100}%`, height: '100%', background: getRiskColor(xgbProb), borderRadius: '4px' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>Speed: {algs.xgb.time_ms.toFixed(2)}ms</span>
                            <span style={{ marginLeft: 'auto' }}>Acc: {(algs.xgb.test_accuracy * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Comparative Feature Importances */}
              <div className="glass-panel">
                <h3>Feature Importance Profile (XGBoost Metrics)</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  Relative weights demonstrating how heavily the model relies on each biological parameter to make risk evaluations.
                </p>
                {renderImportanceChart(result.predictions.diabetes.xgb.importances)}
              </div>

            </div>
          ) : (
            <div style={{ padding: '60px 40px', border: '1.5px dashed var(--border-color)', borderRadius: '16px', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3>Calculate Risk Probabilities</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '8px auto 0 auto' }}>
                Fill in the physiological values on the left panel and click 'Calculate Health Risks' to invoke the Random Forest and XGBoost neural structures.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
