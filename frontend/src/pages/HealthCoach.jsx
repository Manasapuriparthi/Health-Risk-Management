import React, { useState } from 'react';

export default function HealthCoach({ token, API_BASE, latestVital }) {
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I am your AI Health Coach running a local clinical knowledge base. You can ask me about blood pressure classifications, blood sugar control, healthy Mediterranean/DASH diets, or exercises safe for hypertension. How can I help you today?",
      suggestions: ["What are normal fasting blood sugar ranges?", "Explain the DASH diet guidelines", "How does exercise lower blood sugar?"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          sender: 'coach', 
          text: data.response, 
          suggestions: data.suggestions 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'coach', 
          text: "I'm sorry, I encountered an error searching my local clinical files. Please check the backend connection.", 
          suggestions: [] 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'coach', 
        text: "Could not connect to backend server. Ensure the FastAPI application is running.", 
        suggestions: [] 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>AI Health Coach</h1>
        <p className="subtitle">Retrieval-Augmented clinical assistant utilizing local guidelines matching and vital parameters checks.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
        
        {/* Chat stream */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', marginBottom: '20px' }}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Message Bubble */}
              <div style={{
                background: m.sender === 'user' ? 'linear-gradient(135deg, var(--accent-indigo), hsl(250, 70%, 55%))' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${m.sender === 'user' ? 'transparent' : 'var(--border-color)'}`,
                padding: '14px 18px',
                borderRadius: m.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                boxShadow: m.sender === 'user' ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
              }}>
                {m.text}
              </div>

              {/* Suggestions chips for coach */}
              {m.sender === 'coach' && m.suggestions && m.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {m.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      style={{
                        background: 'rgba(172, 255, 240, 0.05)',
                        border: '1px solid rgba(172, 255, 240, 0.2)',
                        color: 'var(--accent-teal)',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = 'rgba(172, 255, 240, 0.12)';
                        e.target.style.borderColor = 'var(--accent-teal)';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'rgba(172, 255, 240, 0.05)';
                        e.target.style.borderColor = 'rgba(172, 255, 240, 0.2)';
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}>
              <span className="pulse-border" style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', borderRadius: '50%' }}></span>
              <span className="pulse-border" style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', borderRadius: '50%', animationDelay: '0.2s' }}></span>
              <span className="pulse-border" style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', borderRadius: '50%', animationDelay: '0.4s' }}></span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Type your medical query, e.g. How does high blood pressure affect my kidneys?"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key === 'Enter' && handleSendMessage()}
            style={{ flex: 1 }}
          />
          <button 
            className="btn-primary" 
            onClick={() => handleSendMessage()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            Send
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
