import React, { useState } from 'react';

export default function SplashOnboarding({ onComplete }) {
  const [step, setStep] = useState('splash'); // 'splash', 1, 2, 3

  const handleNext = () => {
    if (step === 'splash') setStep(1);
    else if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) onComplete();
  };

  const handleBack = () => {
    if (step === 1) setStep('splash');
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 10% 20%, hsla(142, 76%, 36%, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, hsla(250, 75%, 60%, 0.03) 0%, transparent 40%)',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '800px',
        width: '100%',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)'
      }}>

        {step === 'splash' && (
          <div className="flex-col-center" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '30px',
              background: 'rgba(16, 185, 129, 0.08)',
              marginBottom: '24px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
            }}>
              {/* Breathing pulse heart SVG icon */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pulse-border" style={{ animation: 'pulse-ring 2s infinite ease-in-out' }}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--text-primary), var(--accent-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px 0' }}>
              VitalPredict
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '32px', lineHeight: '1.6' }}>
              Your Personal AI Clinical Assistant. Upload reports, check drug safety interactions, and evaluate physiological health markers.
            </p>
            <button className="btn-primary" style={{ padding: '14px 40px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={handleNext}>
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {step !== 'splash' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '380px', justifyContent: 'space-between' }}>
            {/* Top Back/Skip Navigation Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '24px' }}>
              <button 
                onClick={handleBack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <button 
                onClick={onComplete}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Skip Tour
              </button>
            </div>

            {/* Step content */}
            {step === 1 && (
              <div className="flex-col-center animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.06)',
                  marginBottom: '24px',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Smart Medical Report Analysis
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '550px', lineHeight: '1.6' }}>
                  Upload clinical lab test PDFs or text transcripts. Our natural language pipeline automatically parses biomarkers, maps values to reference limits, and provides contextual analysis summaries.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-col-center animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.06)',
                  marginBottom: '24px',
                  border: '1px solid rgba(99, 102, 241, 0.1)'
                }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Physiological Machine Learning Models
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '550px', lineHeight: '1.6' }}>
                  Input standard physiological variables like BMI, blood glucose, active minutes, and family history. Our backend classifiers calculate cardiorespiratory and diabetic risk metrics.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="flex-col-center animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.06)',
                  marginBottom: '24px',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Personalized Planners & Interaction Checkers
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '550px', lineHeight: '1.6' }}>
                  Check medication databases for severe drug-drug contraindications. Access customized clinical dietary schedules and workout configurations mapped safely to your health condition levels.
                </p>
              </div>
            )}

            {/* Bottom Dots & Active Action Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', marginTop: '32px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 1 ? 'var(--accent-teal)' : '#E5E7EB', transition: 'var(--transition-smooth)' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 2 ? 'var(--accent-teal)' : '#E5E7EB', transition: 'var(--transition-smooth)' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 3 ? 'var(--accent-teal)' : '#E5E7EB', transition: 'var(--transition-smooth)' }}></div>
              </div>

              <button 
                className="btn-primary" 
                style={{ padding: '14px 48px', fontSize: '0.95rem' }} 
                onClick={handleNext}
              >
                {step === 3 ? 'Finish Tour' : 'Next Step'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
