import React, { useState } from 'react';

const INITIAL_REMINDERS = [
  { id: 1, name: 'Paracetamol', dosage: '1 tablet', time: '12:30', frequency: 'Daily', instruction: 'After Lunch' },
  { id: 2, name: 'Atorvastatin', dosage: '1 tablet', time: '21:30', frequency: 'Daily', instruction: 'After Dinner' },
  { id: 3, name: 'Vitamin D3', dosage: '1 capsule', time: '09:00', frequency: 'Weekly (Sundays)', instruction: 'After Breakfast' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'Medication', message: 'Reminder: Paracetamol - Time to take your 12:30 PM dosage.', time: '10 min ago' },
  { id: 2, type: 'Appointment', message: 'Appointment Confirmed: Dr. John Smith, tomorrow at 10:00 AM.', time: '2 hours ago' },
  { id: 3, type: 'Report', message: 'Report Analysis Done: Your parsed blood document is ready in the history tab.', time: 'Yesterday' }
];

export default function Reminders() {
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [instruction, setInstruction] = useState('After Breakfast');

  const handleOpenAdd = () => {
    setName('');
    setDosage('');
    setTime('09:00');
    setFrequency('Daily');
    setInstruction('After Breakfast');
    setEditId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (rem) => {
    setName(rem.name);
    setDosage(rem.dosage);
    setTime(rem.time);
    setFrequency(rem.frequency);
    setInstruction(rem.instruction);
    setEditId(rem.id);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !time) return;

    if (editId) {
      // Editing
      setReminders(reminders.map(r => r.id === editId ? { ...r, name, dosage, time, frequency, instruction } : r));
    } else {
      // Adding
      const newRem = {
        id: Date.now(),
        name,
        dosage,
        time,
        frequency,
        instruction
      };
      setReminders([...reminders, newRem]);
      
      // Post notification alert
      const newNotif = {
        id: Date.now(),
        type: 'Medication',
        message: `System Alert: Added new reminder schedule for ${name} at ${time}.`,
        time: 'Just now'
      };
      setNotifications([newNotif, ...notifications]);
    }
    setIsEditing(false);
  };

  const getNotifIcon = (type) => {
    if (type === 'Medication') return '💊';
    if (type === 'Appointment') return '📅';
    return '📄';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
      
      {/* Left Column: Alarms list & Edit form */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1>Medication Reminders</h1>
            <p className="subtitle">Configure and monitor your daily medication alarm times, dosage units, and dietary instructions.</p>
          </div>
          {!isEditing && (
            <button className="btn-primary" onClick={handleOpenAdd} style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              + Add Reminder
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="glass-panel animate-fade-in">
            <h3>{editId ? 'Modify Medicine Reminder' : 'Add Medication Reminder'}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Medicine Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Paracetamol" value={name} onChange={e=>setName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Dosage</label>
                  <input type="text" className="form-control" placeholder="e.g. 1 Tablet" value={dosage} onChange={e=>setDosage(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Daily Time</label>
                  <input type="time" className="form-control" value={time} onChange={e=>setTime(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Frequency</label>
                  <select className="form-control" value={frequency} onChange={e=>setFrequency(e.target.value)}>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Alternate Days</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Dietary Instruction</label>
                <select className="form-control" value={instruction} onChange={e=>setInstruction(e.target.value)}>
                  <option>After Breakfast</option>
                  <option>Before Breakfast</option>
                  <option>After Lunch</option>
                  <option>Before Lunch</option>
                  <option>After Dinner</option>
                  <option>Before Dinner</option>
                  <option>On Empty Stomach</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editId ? 'Save Changes' : 'Create Alarm'}
                </button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reminders.map(rem => (
              <div key={rem.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--accent-teal)' }}>{rem.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {rem.dosage} • {rem.frequency} • <strong style={{ color: 'var(--accent-indigo)' }}>{rem.instruction}</strong>
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{rem.time}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleOpenEdit(rem)}>
                      Edit
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }} onClick={() => handleDelete(rem.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {reminders.length === 0 && (
              <div style={{ padding: '40px', border: '1.5px dashed var(--border-color)', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active medicine alarm times configured. Click "+ Add Reminder" above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Notifications Feed */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Notifications</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(notif => (
            <div key={notif.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
              <span style={{ fontSize: '1.25rem' }}>{getNotifIcon(notif.type)}</span>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{notif.message}</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{notif.time}</span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', padding: '20px 0' }}>No notifications logs.</span>
          )}
        </div>
      </div>

    </div>
  );
}
