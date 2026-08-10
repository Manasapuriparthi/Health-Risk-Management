import React, { useState, useEffect } from 'react';

export default function DoctorDashboard({ token, API_BASE, user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected patient details cache & expansion state
  const [expandedPatientId, setExpandedPatientId] = useState(null); // appointment ID
  const [patientDetails, setPatientDetails] = useState({}); // patient details cache by user_id
  const [patientVitals, setPatientVitals] = useState({}); // patient vitals history by user_id
  const [loadingPatient, setLoadingPatient] = useState(false);

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
        setError('Failed to fetch appointments history.');
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
      // Fetch user details
      const userRes = await fetch(`${API_BASE}/auth/users/${patient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const pData = await userRes.json();
        setPatientDetails(prev => ({ ...prev, [patient_id]: pData }));
      }

      // Fetch patient vitals
      const vitalsRes = await fetch(`${API_BASE}/vitals/user/${patient_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (vitalsRes.ok) {
        const vData = await vitalsRes.json();
        setPatientVitals(prev => ({ ...prev, [patient_id]: vData }));
      }
    } catch (err) {
      console.error('Error fetching patient clinical metrics:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const totalApps = appointments.length;
  const pendingApps = appointments.filter(a => a.status === 'pending').length;
  const acceptedApps = appointments.filter(a => a.status === 'accepted').length;
  const rejectedApps = appointments.filter(a => a.status === 'rejected').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1>Doctor Clinical Dashboard</h1>
        <p className="subtitle">Welcome back, <strong>{user?.username}</strong>. Manage your appointments, evaluate incoming patient queries, and review metrics.</p>
      </div>

      {error && (
        <div className="badge badge-critical" style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', textTransform: 'none', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* STATS TILES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ position: 'relative', borderLeft: '4px solid var(--accent-indigo)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Schedule</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px' }}>{totalApps}</span>
        </div>
        <div className="glass-panel" style={{ position: 'relative', borderLeft: '4px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-amber)' }}>{pendingApps}</span>
        </div>
        <div className="glass-panel" style={{ position: 'relative', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accepted Consultations</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-emerald)' }}>{acceptedApps}</span>
        </div>
        <div className="glass-panel" style={{ position: 'relative', borderLeft: '4px solid var(--accent-rose)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cancelled Sessions</span>
          <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px', color: 'var(--accent-rose)' }}>{rejectedApps}</span>
        </div>
      </div>

      {/* APPOINTMENTS LIST CONTAINER */}
      <div className="glass-panel" style={{ minHeight: '350px' }}>
        <h3 style={{ marginBottom: '20px' }}>Scheduled Patient Consultations</h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
            Retrieving schedule details...
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗓️</span>
            <p>No client bookings recorded in the system.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map(app => {
              const isExpanded = expandedPatientId === app.id;
              const pInfo = patientDetails[app.patient_id];
              const pVits = patientVitals[app.patient_id] || [];
              const latestVit = pVits[0];

              return (
                <div 
                  key={app.id} 
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.01)',
                    overflow: 'hidden',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {/* Primary Row Header */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 24px',
                    gap: '16px',
                    background: 'rgba(255,255,255,0.01)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.08)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        color: 'var(--accent-indigo)'
                      }}>
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
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Practitioner Target</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--accent-teal)' }}>{app.doctor_name}</strong>
                      </div>
                    </div>

                    {/* Actions and Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                      {app.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '8px 14px', fontSize: '0.8rem', background: 'var(--accent-emerald)' }}
                            onClick={() => handleUpdateStatus(app.id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`badge ${app.status === 'accepted' ? 'badge-normal' : 'badge-critical'}`}>
                          {app.status}
                        </span>
                      )}

                      <button 
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                        onClick={() => handleTogglePatientDetails(app)}
                      >
                        {isExpanded ? 'Hide Details ▲' : 'View Clinical Metrics ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content Panel */}
                  {isExpanded && (
                    <div style={{
                      padding: '24px',
                      borderTop: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)'
                    }}>
                      {loadingPatient ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          Fetching patient clinical chart...
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', flexWrap: 'wrap' }}>
                          {/* Left: General Profile & Physical Indicators */}
                          <div>
                            <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>Physical Health Info</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age</span>
                                <strong style={{ fontSize: '1.1rem' }}>{pInfo?.age ? `${pInfo.age} yrs` : 'Not Specified'}</strong>
                              </div>
                              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Active Minutes</span>
                                <strong style={{ fontSize: '1.1rem' }}>{pInfo?.active_minutes ? `${pInfo.active_minutes} min` : 'Not Specified'}</strong>
                              </div>
                              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Height</span>
                                <strong style={{ fontSize: '1.1rem' }}>{pInfo?.height ? `${pInfo.height} cm` : 'Not Specified'}</strong>
                              </div>
                              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight</span>
                                <strong style={{ fontSize: '1.1rem' }}>{pInfo?.weight ? `${pInfo.weight} kg` : 'Not Specified'}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Right: Latest Logged Vitals */}
                          <div>
                            <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>Latest Registered Vitals</h5>
                            {latestVit ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Pressure</span>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-teal)' }}>
                                    {latestVit.systolic_bp && latestVit.diastolic_bp ? `${latestVit.systolic_bp}/${latestVit.diastolic_bp} mmHg` : 'N/A'}
                                  </strong>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Glucose</span>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-indigo)' }}>
                                    {latestVit.blood_sugar ? `${latestVit.blood_sugar} mg/dL` : 'N/A'}
                                  </strong>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Heart Rate</span>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                                    {latestVit.heart_rate ? `${latestVit.heart_rate} bpm` : 'N/A'}
                                  </strong>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Cholesterol</span>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                                    {latestVit.cholesterol ? `${latestVit.cholesterol} mg/dL` : 'N/A'}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                padding: '24px',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem'
                              }}>
                                This patient has not logged any vital parameters yet.
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
    </div>
  );
}
