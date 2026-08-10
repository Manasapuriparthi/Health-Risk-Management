import React, { useState } from 'react';

export default function Auth({ onAuthSuccess, API_BASE }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'otp', 'reset'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('30');
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [specialty, setSpecialty] = useState('General Physician');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          onAuthSuccess(data.access_token);
        } else {
          setError(data.detail || 'Authentication failed. Please check credentials.');
        }
      } else if (mode === 'register') {
        const payload = role === 'doctor' ? {
          username,
          email,
          password,
          role,
          specialty
        } : {
          username,
          email,
          password,
          age: age ? parseInt(age) : null,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          active_minutes: activeMinutes ? parseInt(activeMinutes) : 30,
          role
        };

        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          onAuthSuccess(data.access_token);
        } else {
          setError(data.detail || 'Registration failed. Try again.');
        }
      } else if (mode === 'forgot') {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(`Simulated OTP generated! Verification Code: ${data.otp}`);
          setTimeout(() => {
            setMode('otp');
            setError('');
            setSuccess('');
          }, 3000);
        } else {
          setError(data.detail || 'Failed to send OTP code.');
        }
      } else if (mode === 'otp') {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: otpVal })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess('OTP verified successfully!');
          setTimeout(() => {
            setMode('reset');
            setError('');
            setSuccess('');
          }, 1500);
        } else {
          setError(data.detail || 'Incorrect or expired OTP.');
        }
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: otpVal, password })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess('Password updated successfully! Redirecting to login...');
          setTimeout(() => {
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setOtpVal('');
            setError('');
            setSuccess('');
          }, 2000);
        } else {
          setError(data.detail || 'Failed to reset password.');
        }
      }
    } catch (err) {
      setError('Connection to backend failed. Make sure the FastAPI server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch (mode) {
      case 'login':
        return <span>Sign In to <strong>VitalPredict</strong></span>;
      case 'register':
        return <span>Create <strong>Health Account</strong></span>;
      case 'forgot':
        return <span>Forgot <strong>Password?</strong></span>;
      case 'otp':
        return <span>Verify <strong>Your Number</strong></span>;
      case 'reset':
        return <span>Reset <strong>Password</strong></span>;
      default:
        return <span>Welcome to <strong>VitalPredict</strong></span>;
    }
  };

  const getHeaderSub = () => {
    switch (mode) {
      case 'login':
        return 'Predict and manage your personal health markers';
      case 'register':
        return 'Get custom RAG advice and RF/XGBoost prediction analysis';
      case 'forgot':
        return 'Enter your email or phone number to retrieve credentials';
      case 'otp':
        return `Enter the 6-digit code sent to your registered email ${email}`;
      case 'reset':
        return 'Enter and confirm your new account password';
      default:
        return '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'radial-gradient(circle at 10% 20%, rgba(90, 80, 250, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(22, 189, 164, 0.15) 0%, transparent 40%)'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(172, 255, 240, 0.1)',
            marginBottom: '16px',
            boxShadow: '0 0 15px var(--accent-teal-glow)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '6px', fontSize: '2rem' }}>
            {getHeaderTitle()}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {getHeaderSub()}
          </p>
        </div>

        {/* Error Badge */}
        {error && (
          <div className="badge badge-critical" style={{
            display: 'flex',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textTransform: 'none',
            fontSize: '0.85rem',
            width: '100%',
            lineHeight: '1.4'
          }}>
            <span style={{ fontWeight: 'bold', marginRight: '6px' }}>Error:</span> {error}
          </div>
        )}

        {/* Success Badge */}
        {success && (
          <div className="badge badge-normal" style={{
            display: 'flex',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textTransform: 'none',
            fontSize: '0.85rem',
            width: '100%',
            lineHeight: '1.4'
          }}>
            <span style={{ fontWeight: 'bold', marginRight: '6px' }}>Success:</span> {success}
          </div>
        )}

        <form onSubmit={handleAuthSubmit}>
          {/* 1. Portal switch (only in Login & Register) */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '24px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => { setRole('patient'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: role === 'patient' ? 'var(--accent-teal)' : 'transparent',
                  color: role === 'patient' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Patient Portal
              </button>
              <button
                type="button"
                onClick={() => { setRole('doctor'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: role === 'doctor' ? 'var(--accent-teal)' : 'transparent',
                  color: role === 'doctor' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Doctor Portal
              </button>
            </div>
          )}

          {/* 2. Form Inputs based on Mode */}
          {mode === 'register' && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                required
                disabled={mode === 'otp' || mode === 'reset'}
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'otp' && (
            <div className="form-group">
              <label>6-Digit Verification Code</label>
              <input
                type="text"
                maxLength="6"
                className="form-control"
                value={otpVal}
                onChange={(e) => setOtpVal(e.target.value)}
                placeholder="000000"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                required
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          {mode === 'register' && role === 'patient' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 35"
                  />
                </div>
                <div className="form-group">
                  <label>Daily Active Minutes</label>
                  <input
                    type="number"
                    className="form-control"
                    value={activeMinutes}
                    onChange={(e) => setActiveMinutes(e.target.value)}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 70"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'register' && role === 'doctor' && (
            <div className="form-group">
              <label>Medical Specialization</label>
              <select
                className="form-control"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="General Physician">General Physician</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Orthopedic Specialist">Orthopedic Specialist</option>
                <option value="Neurologist">Neurologist</option>
              </select>
            </div>
          )}

          {/* Action Button */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px', padding: '14px' }}>
            {loading ? 'Processing...' : 
             mode === 'login' ? 'Sign In' : 
             mode === 'register' ? 'Register Profile' : 
             mode === 'forgot' ? 'Send OTP' : 
             mode === 'otp' ? 'Verify OTP' : 
             'Reset Password'}
          </button>
        </form>

        {/* Navigation / Switch Mode Block */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          {mode === 'login' && (
            <>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Don't have an account? </span>
              <button onClick={() => { setMode('register'); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                Create one now
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Already registered? </span>
              <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                Sign in here
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'otp' || mode === 'reset') && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
              ← Return to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
