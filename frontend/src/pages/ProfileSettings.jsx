import React, { useState, useEffect } from 'react';

const INITIAL_ALLERGIES = ['Peanuts', 'Gluten', 'Dust', 'Penicillin'];

export default function ProfileSettings({ user, token, API_BASE }) {
  const [subTab, setSubTab] = useState('personal'); // 'personal', 'history', 'allergies', 'contacts', 'settings'

  // Personal Info Form States
  const [fullName, setFullName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [dob, setDob] = useState('1999-08-15');
  const [gender, setGender] = useState('Male');

  useEffect(() => {
    if (user) {
      if (user.username) setFullName(user.username);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Medical History State
  const [history, setHistory] = useState({
    diabetes: user?.age > 40 || false,
    hypertension: false,
    heartDisease: false,
    thyroid: false,
    asthma: true,
    others: ''
  });

  // Allergies State
  const [allergies, setAllergies] = useState(INITIAL_ALLERGIES);
  const [allergyInput, setAllergyInput] = useState('');

  // Emergency Contacts
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Michael Doe', relation: 'Brother', phone: '+91 98765 43211' },
    { id: 2, name: 'Sarah Sian', relation: 'Sister', phone: '+91 98765 43212' }
  ]);
  const [cName, setCName] = useState('');
  const [cRelation, setCRelation] = useState('');
  const [cPhone, setCPhone] = useState('');

  // Settings state
  const [language, setLanguage] = useState('English');
  const [units, setUnits] = useState('Metric');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(localStorage.getItem('appLockEnabled') === 'true');
  const [pinCode, setPinCode] = useState(localStorage.getItem('appLockPin') || '');
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  const handleToggleAppLock = (enabled) => {
    setAppLockEnabled(enabled);
    localStorage.setItem('appLockEnabled', enabled ? 'true' : 'false');
    if (!enabled) {
      localStorage.removeItem('appLockPin');
      setPinCode('');
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (pinInput.length !== 4 || isNaN(pinInput)) {
      setPinMessage('PIN must be exactly 4 digits.');
      return;
    }
    setPinCode(pinInput);
    localStorage.setItem('appLockPin', pinInput);
    localStorage.setItem('appLockEnabled', 'true');
    setAppLockEnabled(true);
    setPinInput('');
    setPinMessage('PIN code saved successfully!');
    setTimeout(() => setPinMessage(''), 2000);
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (!allergyInput.trim()) return;
    if (!allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
    }
    setAllergyInput('');
  };

  const handleRemoveAllergy = (val) => {
    setAllergies(allergies.filter(a => a !== val));
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return;
    setContacts([...contacts, { id: Date.now(), name: cName, relation: cRelation, phone: cPhone }]);
    setCName('');
    setCRelation('');
    setCPhone('');
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
      
      {/* Profile Sidebar */}
      <div className="glass-panel" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
        <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--accent-teal-glow)',
            color: 'var(--accent-teal)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: '0 auto 12px auto'
          }}>
            {fullName[0]}
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{fullName}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{email}</span>
        </div>

        <button 
          className={`nav-btn ${subTab === 'personal' ? 'active' : ''}`}
          style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}
          onClick={() => setSubTab('personal')}
        >
          👤 Personal Info
        </button>
        <button 
          className={`nav-btn ${subTab === 'history' ? 'active' : ''}`}
          style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}
          onClick={() => setSubTab('history')}
        >
          🏥 Medical History
        </button>
        <button 
          className={`nav-btn ${subTab === 'allergies' ? 'active' : ''}`}
          style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}
          onClick={() => setSubTab('allergies')}
        >
          🥜 Allergies Database
        </button>
        <button 
          className={`nav-btn ${subTab === 'contacts' ? 'active' : ''}`}
          style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}
          onClick={() => setSubTab('contacts')}
        >
          📞 Emergency Contacts
        </button>
        <button 
          className={`nav-btn ${subTab === 'settings' ? 'active' : ''}`}
          style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}
          onClick={() => setSubTab('settings')}
        >
          ⚙️ App Settings & About
        </button>
      </div>

      {/* Profile Active content panel */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        
        {/* 1. PERSONAL INFO SECTION */}
        {subTab === 'personal' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Personal Physiological Info</h3>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={e => e.preventDefault()}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input type="text" className="form-control" value={fullName} onChange={e=>setFullName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Phone Number</label>
                  <input type="text" className="form-control" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date of Birth</label>
                  <input type="date" className="form-control" value={dob} onChange={e=>setDob(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Biological Gender</label>
                <select className="form-control" value={gender} onChange={e=>setGender(e.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* 2. MEDICAL HISTORY SECTION */}
        {subTab === 'history' && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>Medical History Checklist</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Select any chronic conditions to optimize clinical planners calculations.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(history).filter(([k]) => k !== 'others').map(([key, val]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', textTransform: 'capitalize' }}>
                  <input 
                    type="checkbox" 
                    checked={val} 
                    onChange={e => setHistory({ ...history, [key]: e.target.checked })} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
              
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Other Medical Conditions / Notes</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="e.g. Mild dust allergies, seasonal asthma..."
                  value={history.others}
                  onChange={e => setHistory({ ...history, others: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. ALLERGIES SECTION */}
        {subTab === 'allergies' && (
          <div>
            <h3 style={{ marginBottom: '6px' }}>Allergy Records</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Keep track of active drug or nutrient allergens.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
              {allergies.map(a => (
                <span 
                  key={a} 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    color: 'var(--accent-rose)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  {a}
                  <button 
                    onClick={() => handleRemoveAllergy(a)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--accent-rose)',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddAllergy} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Add allergen name (e.g. Penicillin)..."
                value={allergyInput}
                onChange={e=>setAllergyInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 24px', flexShrink: 0 }}>
                Add Allergy
              </button>
            </form>
          </div>
        )}

        {/* 4. EMERGENCY CONTACTS SECTION */}
        {subTab === 'contacts' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Emergency Contacts</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {contacts.map(c => (
                <div key={c.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--accent-teal)' }}>{c.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Relation: {c.relation}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '8px' }}>{c.phone}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.9rem' }}>Add Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <input type="text" className="form-control" placeholder="Contact Name" value={cName} onChange={e=>setCName(e.target.value)} />
                <input type="text" className="form-control" placeholder="Relation (e.g. Brother)" value={cRelation} onChange={e=>setCRelation(e.target.value)} />
                <input type="text" className="form-control" placeholder="Phone Number" value={cPhone} onChange={e=>setCPhone(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                Save Emergency Contact
              </button>
            </form>
          </div>
        )}

        {/* 5. SETTINGS & ABOUT SECTION */}
        {subTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h3 style={{ marginBottom: '16px' }}>App Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>Preferred Language</span>
                  <select className="form-control" style={{ width: '180px' }} value={language} onChange={e=>setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>Measurement Units</span>
                  <select className="form-control" style={{ width: '180px' }} value={units} onChange={e=>setUnits(e.target.value)}>
                    <option>Metric (cm/kg)</option>
                    <option>Imperial (ft/lbs)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', display: 'block', fontWeight: 'bold' }}>Security App Lock</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require a 4-digit PIN code when opening the clinical portal.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer', marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={appLockEnabled}
                        onChange={(e) => handleToggleAppLock(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: appLockEnabled ? 'var(--accent-teal)' : '#ccc',
                        borderRadius: '24px',
                        transition: '0.4s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px', width: '18px',
                          left: appLockEnabled ? '26px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.4s'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                {appLockEnabled && (
                  <form onSubmit={handleSavePin} style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                        {pinCode ? 'Update 4-Digit Security PIN' : 'Set 4-Digit Security PIN'}
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          maxLength="4"
                          className="form-control"
                          placeholder="e.g. 1234"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          style={{ maxWidth: '120px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.1rem' }}
                          required
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0 16px' }}>
                          Save PIN
                        </button>
                      </div>
                      {pinMessage && (
                        <span style={{ fontSize: '0.8rem', color: pinMessage.includes('saved') ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 'bold' }}>
                          {pinMessage}
                        </span>
                      )}
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', display: 'block', fontWeight: 'bold' }}>Clear Application Cache</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Removes all temporary logs and report sessions.</span>
                  </div>
                  <button className="btn-secondary" onClick={handleClearCache} style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}>
                    {cacheCleared ? 'Cleared ✓' : 'Clear Cache'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>About VitalPredict</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>Build version: <strong>1.0.0 (Production Release)</strong></span>
                <span>Frameworks: <strong>FastAPI, React, Vite</strong></span>
                <span>Algorithms: <strong>Random Forest Regressor, XGBoost Classifier</strong></span>
                <span style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Licensed under Clinical Open Source guidelines. Made with ❤️.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
