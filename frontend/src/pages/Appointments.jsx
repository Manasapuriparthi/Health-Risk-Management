import React, { useState, useEffect } from 'react';

const SPECIALISTS = [
  { id: 'general', name: 'General Physician', desc: 'Primary care, family medicine, common health concerns.', icon: '🩺', count: 12 },
  { id: 'cardio', name: 'Cardiologist', desc: 'Heart conditions, hypertension, chest pains, cardiovascular risks.', icon: '❤️', count: 8 },
  { id: 'derma', name: 'Dermatologist', desc: 'Skin care, rashes, moles, allergies, acne treatments.', icon: '🔬', count: 6 },
  { id: 'ortho', name: 'Orthopedic Specialist', desc: 'Bone structures, joints, fractures, muscle aches.', icon: '🦴', count: 5 },
  { id: 'neuro', name: 'Neurologist', desc: 'Brain, nervous system, chronic headaches, sleep disorders.', icon: '🧠', count: 4 }
];

const DOCTORS = {
  general: [
    { name: 'Dr. Sarah Sian', rating: '4.8', reviews: 142, experience: '12 yrs', timing: '9:00 AM - 1:00 PM', price: '$80' },
    { name: 'Dr. Emily Davis', rating: '4.7', reviews: 98, experience: '9 yrs', timing: '2:00 PM - 6:00 PM', price: '$75' }
  ],
  cardio: [
    { name: 'Dr. John Smith', rating: '4.9', reviews: 215, experience: '15 yrs', timing: '10:00 AM - 3:00 PM', price: '$120' },
    { name: 'Dr. Robert Chen', rating: '4.8', reviews: 180, experience: '18 yrs', timing: '11:00 AM - 4:00 PM', price: '$130' }
  ],
  derma: [
    { name: 'Dr. Michael Brown', rating: '4.6', reviews: 110, experience: '10 yrs', timing: '9:00 AM - 12:00 PM', price: '$90' }
  ],
  ortho: [
    { name: 'Dr. William Taylor', rating: '4.7', reviews: 85, experience: '11 yrs', timing: '1:00 PM - 5:00 PM', price: '$100' }
  ],
  neuro: [
    { name: 'Dr. Olivia Martinez', rating: '4.9', reviews: 95, experience: '14 yrs', timing: '10:00 AM - 2:00 PM', price: '$140' }
  ]
};

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function Appointments({ token, API_BASE }) {
  const [flowStep, setFlowStep] = useState('specialists'); // 'specialists', 'doctors', 'slot', 'confirmed'
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refId, setRefId] = useState('');
  const [doctorsDb, setDoctorsDb] = useState({});
  const [fetchingDoctors, setFetchingDoctors] = useState(true);

  const mapSpecialtyToId = (spec) => {
    if (!spec) return 'general';
    const s = spec.toLowerCase();
    if (s.includes('general')) return 'general';
    if (s.includes('cardio')) return 'cardio';
    if (s.includes('derm')) return 'derma';
    if (s.includes('ortho')) return 'ortho';
    if (s.includes('neur')) return 'neuro';
    return 'general';
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const grouped = {};
          data.forEach(doc => {
            const specId = mapSpecialtyToId(doc.specialty);
            if (!grouped[specId]) {
              grouped[specId] = [];
            }
            grouped[specId].push({
              name: doc.username,
              rating: doc.rating || '4.8',
              reviews: doc.reviews || Math.floor(Math.random() * 150) + 50,
              experience: doc.experience || '8 yrs',
              timing: doc.timing || '9:00 AM - 5:00 PM',
              price: doc.price || '$75',
              email: doc.email
            });
          });
          setDoctorsDb(grouped);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setFetchingDoctors(false);
      }
    };
    fetchDoctors();
  }, [token, API_BASE]);

  const getDoctorCount = (specId) => {
    if (doctorsDb[specId] && doctorsDb[specId].length > 0) {
      return doctorsDb[specId].length;
    }
    return DOCTORS[specId] ? DOCTORS[specId].length : 0;
  };

  const getActiveDoctors = () => {
    if (doctorsDb[selectedSpecialty] && doctorsDb[selectedSpecialty].length > 0) {
      return doctorsDb[selectedSpecialty];
    }
    return DOCTORS[selectedSpecialty] || [];
  };

  const handleSelectSpecialty = (sp) => {
    setSelectedSpecialty(sp);
    setFlowStep('doctors');
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setFlowStep('slot');
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    setError('');
    try {
      const activeSpecialtyName = SPECIALISTS.find(s => s.id === selectedSpecialty)?.name || 'General';
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_name: selectedDoctor?.name || 'Unknown Doctor',
          specialty: activeSpecialtyName,
          date: selectedDate,
          time: selectedTime
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRefId(data.id || 'VP-8291-C');
        setFlowStep('confirmed');
      } else {
        setError(data.detail || 'Failed to book appointment. Please try again.');
      }
    } catch (err) {
      setError('Connection to backend failed. Booking not saved.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFlowStep('specialists');
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setError('');
  };

  const activeSpecialtyInfo = SPECIALISTS.find(s => s.id === selectedSpecialty);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyBetween: 'center', alignItems: 'center' }}>
        <div>
          <h1>Book Clinical Appointment</h1>
          <p className="subtitle">Schedule virtual consultations with certified cardiologists, general physicians, and specialists.</p>
        </div>
        {flowStep !== 'specialists' && flowStep !== 'confirmed' && (
          <button 
            className="btn-secondary" 
            style={{ padding: '8px 16px', marginLeft: 'auto' }}
            onClick={() => {
              if (flowStep === 'doctors') setFlowStep('specialists');
              if (flowStep === 'slot') setFlowStep('doctors');
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* 1. SPECIALISTS CATEGORIES LIST */}
      {flowStep === 'specialists' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {SPECIALISTS.map(sp => (
            <div 
              key={sp.id} 
              className="glass-panel" 
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer' }}
              onClick={() => handleSelectSpecialty(sp.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>{sp.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{sp.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getDoctorCount(sp.id)} doctors available</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sp.desc}</p>
              <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%', fontSize: '0.8rem', padding: '8px' }}>
                Select Specialty
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. DOCTORS DIRECTORY LIST */}
      {flowStep === 'doctors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ marginBottom: '4px' }}>Available Doctors in {activeSpecialtyInfo?.name}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {getActiveDoctors()?.map((doc, idx) => (
              <div key={idx} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.08)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: 'var(--accent-teal)'
                  }}>
                    {doc.name.split(' ')[1] ? doc.name.split(' ')[1][0] : doc.name[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{doc.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⭐ {doc.rating} ({doc.reviews} reviews) • {doc.experience} exp</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '10px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Hours: <strong>{doc.timing}</strong></span>
                  <span>Fee: <strong>{doc.price}</strong></span>
                </div>

                <button className="btn-primary" onClick={() => handleSelectDoctor(doc)}>
                  Select & Book Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SLOT CALENDAR SELECTION */}
      {flowStep === 'slot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          <div className="glass-panel">
            <h3>Select Date & Time</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Select from available booking times for **{selectedDoctor?.name}**.</p>
            
            {/* Dynamic Calendar */}
            <div style={{ marginBottom: '24px' }}>
              {(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const monthName = today.toLocaleString('default', { month: 'long' });
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayOfWeek = new Date(year, month, 1).getDay();
                const todayDate = today.getDate();

                const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <span key={`b-${i}`} />
                ));
                const days = Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;
                  const isPast = day < todayDate;
                  return (
                    <button
                      key={day}
                      disabled={isPast}
                      style={{
                        padding: '10px 0',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--accent-teal)' : isPast ? 'transparent' : 'rgba(255,255,255,0.04)',
                        color: isSelected ? '#fff' : isPast ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        opacity: isPast ? 0.4 : 1,
                        transition: 'all 0.15s'
                      }}
                      onClick={() => !isPast && setSelectedDate(dateStr)}
                    >
                      {day}
                    </button>
                  );
                });

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
                      <span>{monthName} {year}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '16px', textAlign: 'center' }}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                        <strong key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d}</strong>
                      ))}
                      {blanks}
                      {days}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Time Slots selector */}
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Available Time Slots</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {TIME_SLOTS.map(t => {
                  const isSelected = selectedTime === t;
                  return (
                    <button
                      key={t}
                      className="btn-secondary"
                      style={{
                        padding: '10px 0',
                        fontSize: '0.75rem',
                        background: isSelected ? 'var(--accent-teal-glow)' : 'rgba(255,255,255,0.04)',
                        borderColor: isSelected ? 'var(--accent-teal)' : 'var(--border-color)',
                        color: isSelected ? 'var(--accent-teal)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Summary sidebar */}
          <div className="glass-panel flex-col-center justify-between" style={{ height: 'fit-content' }}>
            <div style={{ width: '100%' }}>
              <h3>Booking Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor</span>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>{selectedDoctor?.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specialty</span>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>{activeSpecialtyInfo?.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</span>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: selectedDate ? 'var(--text-primary)' : 'var(--accent-rose)' }}>
                    {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date selected'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Slot</span>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: selectedTime ? 'var(--text-primary)' : 'var(--accent-rose)' }}>
                    {selectedTime || 'No time selected'}
                  </strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Consultation Fee</span>
                  <span>{selectedDoctor?.price}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="badge badge-critical" style={{ marginTop: '16px', width: '100%', textTransform: 'none', fontSize: '0.8rem', padding: '8px' }}>
                {error}
              </div>
            )}

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '24px' }} 
              disabled={!selectedDate || !selectedTime || loading}
              onClick={handleConfirmBooking}
            >
              {loading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* 4. CONFIRMATION SCREEN */}
      {flowStep === 'confirmed' && (
        <div className="glass-panel flex-col-center" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto 0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.08)',
            marginBottom: '24px',
            color: 'var(--accent-teal)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>Appointment Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: '1.6', marginBottom: '30px' }}>
            Your consultation is secured. A calendar invite and Google Meet link have been dispatched to your email address.
          </p>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', width: '100%', marginBottom: '32px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Practitioner:</span> <strong>{selectedDoctor?.name} ({activeSpecialtyInfo?.name})</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> <strong>{new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Time Slot:</span> <strong>{selectedTime}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Ref ID:</span> <strong style={{ color: 'var(--accent-teal)' }}>{refId}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleReset}>
              Book Another
            </button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
