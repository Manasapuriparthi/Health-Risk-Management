import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Predictor from './pages/Predictor';
import HealthTwin from './pages/HealthTwin';
import ReportAnalyzer from './pages/ReportAnalyzer';
import HealthCoach from './pages/HealthCoach';
import Planners from './pages/Planners';
import SplashOnboarding from './pages/SplashOnboarding';
import Appointments from './pages/Appointments';
import HealthNews from './pages/HealthNews';
import Reminders from './pages/Reminders';
import ProfileSettings from './pages/ProfileSettings';
import DoctorDashboard from './pages/DoctorDashboard';
import { API_BASE_URL as API_BASE } from './config';

export default function App() {
  const [onboarded, setOnboarded] = useState(localStorage.getItem('onboarded') === 'true');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [latestVital, setLatestVital] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Keep Render backend warm - ping every 14 minutes to prevent cold starts
  useEffect(() => {
    const keepAlive = () => fetch(`${API_BASE}/health`).catch(() => {});
    keepAlive(); // ping immediately on load
    const interval = setInterval(keepAlive, 14 * 60 * 1000); // every 14 mins
    return () => clearInterval(interval);
  }, []);

  // Sync token to localstorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
      fetchLatestVital();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLatestVital(null);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
    }
  };

  const fetchLatestVital = async () => {
    try {
      const res = await fetch(`${API_BASE}/vitals/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLatestVital(data);
      }
    } catch (err) {
      console.error('Fetch vitals failed:', err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsUnlocked(false);
  };

  const handleSwitchRole = async (newRole) => {
    try {
      setUser(prev => prev ? { ...prev, role: newRole } : null);
      await fetch(`${API_BASE}/auth/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      await fetchUserProfile();
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const handleCompleteOnboarding = () => {
    setOnboarded(true);
    localStorage.setItem('onboarded', 'true');
  };

  // 1. If not onboarded, show fullscreen Splash & Tour
  if (!onboarded) {
    return <SplashOnboarding onComplete={handleCompleteOnboarding} />;
  }

  // 2. If not logged in, show Auth
  if (!token) {
    return <Auth onAuthSuccess={(t) => setToken(t)} API_BASE={API_BASE} />;
  }

  // 2.5 If App Lock is enabled, require PIN unlock
  const isLockEnabled = localStorage.getItem('appLockEnabled') === 'true' && localStorage.getItem('appLockPin');
  if (isLockEnabled && !isUnlocked) {
    return <AppLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  // 3. If doctor, show Doctor Hub Layout
  if (user && user.role === 'doctor') {
    const renderDoctorContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <DoctorDashboard token={token} API_BASE={API_BASE} user={user} />;
        case 'profile':
          return <ProfileSettings user={user} token={token} API_BASE={API_BASE} />;
        default:
          return <DoctorDashboard token={token} API_BASE={API_BASE} user={user} />;
      }
    };

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* LEFT SIDEBAR NAVIGATION - DOCTOR VIEW */}
        <aside style={{
          width: '260px',
          background: '#ffffff',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box',
          padding: '24px 16px',
          flexShrink: 0
        }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '32px' }} onClick={() => setActiveTab('dashboard')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Clinical Hub</span>
          </a>

          {/* Navigation list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Management
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('dashboard')}>
                  📊 Dashboard
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Settings & Modes
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('profile')}>
                  ⚙️ Profile & Settings
                </button>
                <button className="nav-btn" style={{ width: '100%', textAlign: 'left', color: 'var(--accent-teal)' }} onClick={() => handleSwitchRole('patient')}>
                  🧑‍⚕️ Switch to Patient Portal
                </button>
              </div>
            </div>
          </div>

          {/* Footer info & Logout */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Signed in as:</span>
                <strong style={{ fontSize: '0.85rem' }}>{user.username}</strong>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent-teal)' }}>{user.specialty || 'Practitioner'}</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', flexShrink: 0 }}>
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '40px 48px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' }}>
          {renderDoctorContent()}
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard token={token} API_BASE={API_BASE} latestVital={latestVital} onVitalLogged={fetchLatestVital} />;
      case 'predictor':
        return <Predictor token={token} API_BASE={API_BASE} latestVital={latestVital} user={user} />;
      case 'twin':
        return <HealthTwin token={token} API_BASE={API_BASE} user={user} latestVital={latestVital} />;
      case 'report':
        return <ReportAnalyzer token={token} API_BASE={API_BASE} onReportProcessed={fetchLatestVital} />;
      case 'coach':
        return <HealthCoach token={token} API_BASE={API_BASE} latestVital={latestVital} />;
      case 'planners':
        return <Planners token={token} API_BASE={API_BASE} latestVital={latestVital} />;
      case 'appointments':
        return <Appointments token={token} API_BASE={API_BASE} />;
      case 'news':
        return <HealthNews />;
      case 'reminders':
        return <Reminders />;
      case 'profile':
        return <ProfileSettings user={user} token={token} API_BASE={API_BASE} />;
      default:
        return <Dashboard token={token} API_BASE={API_BASE} latestVital={latestVital} onVitalLogged={fetchLatestVital} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #080d1a 0%, #0a0f1e 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        padding: '24px 16px',
        flexShrink: 0
      }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '36px' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16,185,129,0.35)', flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#f1f5f9', display: 'block' }}>VitalPredict</span>
            <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Health Platform</span>
          </div>
        </a>

        {/* Navigation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Health Tracking
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('dashboard')}>
                📊 Dashboard
              </button>
              <button className={`nav-btn ${activeTab === 'predictor' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('predictor')}>
                🧬 ML Predictor
              </button>
              <button className={`nav-btn ${activeTab === 'twin' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('twin')}>
                👤 AI Health Twin
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              AI Tools & Planners
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('report')}>
                📄 Report Analyzer
              </button>
              <button className={`nav-btn ${activeTab === 'coach' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('coach')}>
                💬 AI Health Coach
              </button>
              <button className={`nav-btn ${activeTab === 'planners' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('planners')}>
                📅 Clinical Planners
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Care & Services
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`nav-btn ${activeTab === 'appointments' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('appointments')}>
                🩺 Book Appointment
              </button>
              <button className={`nav-btn ${activeTab === 'news' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('news')}>
                📰 Health News
              </button>
              <button className={`nav-btn ${activeTab === 'reminders' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('reminders')}>
                ⏰ Reminders & Alerts
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              User Center
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setActiveTab('profile')}>
                ⚙️ Profile & Settings
              </button>
              <button className="nav-btn" style={{ width: '100%', textAlign: 'left', color: 'var(--accent-indigo)' }} onClick={() => handleSwitchRole('doctor')}>
                🩺 Switch to Doctor Portal
              </button>
            </div>
          </div>
        </div>

        {/* Footer info & Logout */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
          {user && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Signed in as:</span>
                <strong style={{ fontSize: '0.85rem' }}>{user.username}</strong>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', flexShrink: 0 }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px 48px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' }}>
        {renderContent()}
      </main>

    </div>
  );
}

function AppLockScreen({ onUnlock }) {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = localStorage.getItem('appLockPin') || '1234';

  const handleKeyPress = (num) => {
    setError(false);
    if (inputPin.length < 4) {
      const nextPin = inputPin + num;
      setInputPin(nextPin);
      if (nextPin === correctPin) {
        onUnlock();
      } else if (nextPin.length === 4) {
        setTimeout(() => {
          setError(true);
          setInputPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setInputPin(inputPin.slice(0, -1));
  };

  const handleClear = () => {
    setInputPin('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(9, 13, 26) 90%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#ffffff',
      fontFamily: 'var(--font-primary)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
          marginBottom: '20px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ color: '#ffffff', fontSize: '1.75rem', marginBottom: '8px', fontWeight: '800' }}>Enter App PIN</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Secure health records are encrypted and locked.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
        {[0, 1, 2, 3].map((idx) => {
          const filled = inputPin.length > idx;
          return (
            <div
              key={idx}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: error ? 'var(--accent-rose)' : (filled ? 'var(--accent-teal)' : 'transparent'),
                border: error ? '2px solid var(--accent-rose)' : '2px solid rgba(255,255,255,0.2)',
                boxShadow: filled && !error ? '0 0 10px var(--accent-teal-glow)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)',
        gap: '20px 24px',
        maxWidth: '288px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'var(--transition-smooth)'
            }}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Clear
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'var(--transition-smooth)'
          }}
        >
          0
        </button>
        <button
          onClick={handleDelete}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
