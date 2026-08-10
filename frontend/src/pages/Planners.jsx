import React, { useState, useEffect } from 'react';

const EXERCISE_LIBRARY = {
  'dumbbell press': {
    name: 'Dumbbell Chest Press',
    target: 'Chest, Triceps, Shoulders',
    sets: '3 sets of 10-12 reps',
    instructions: [
      'Lie flat on a bench with a dumbbell in each hand.',
      'Hold the weights at chest level with elbows bent at 90 degrees.',
      'Exhale and push the dumbbells upward until your arms are fully extended.',
      'Inhale and slowly lower the weights back to the starting position.'
    ],
    precautions: 'Do not arch your lower back off the bench.'
  },
  'overhead press': {
    name: 'Overhead Shoulder Press',
    target: 'Shoulders, Triceps, Core',
    sets: '3 sets of 10 reps',
    instructions: [
      'Stand with feet shoulder-width apart, holding dumbbells at shoulder level.',
      'Brace your core and press the dumbbells straight overhead until arms are locked.',
      'Slowly lower the dumbbells back to the starting position at your shoulders.'
    ],
    precautions: 'Avoid shrugging your shoulders excessively at the top.'
  },
  'tricep extensions': {
    name: 'Tricep Dumbbell Overhead Extension',
    target: 'Triceps',
    sets: '3 sets of 12 reps',
    instructions: [
      'Hold one dumbbell with both hands overhead, arms straight.',
      'Keeping your elbows tucked close to your ears, lower the weight behind your head.',
      'Extend your arms to push the dumbbell back up to the starting position.'
    ],
    precautions: 'Keep your elbows pointing forward, not flared out to the sides.'
  },
  'squats': {
    name: 'Bodyweight / Weighted Squats',
    target: 'Quadriceps, Glutes, Hamstrings',
    sets: '3 sets of 15 reps',
    instructions: [
      'Stand with feet slightly wider than hip-width apart, toes slightly out.',
      'Send your hips back and bend your knees to lower into a squat, keeping chest up.',
      'Lower until thighs are parallel to the floor, keeping weight in your heels.',
      'Push through your heels to stand back up, squeezing glutes at the top.'
    ],
    precautions: 'Ensure your knees track in line with your toes and do not cave inward.'
  },
  'lunges': {
    name: 'Walking Lunges',
    target: 'Quads, Hamstrings, Glutes',
    sets: '3 sets of 10 reps per leg',
    instructions: [
      'Stand tall, then step forward with one foot, lowering your hips.',
      'Bend both knees to 90 degrees, ensuring front knee doesn\'t go past toes.',
      'Push off your back foot and step forward to return to standing, then repeat on other leg.'
    ],
    precautions: 'Keep your torso upright and core engaged throughout.'
  },
  'romanian deadlifts': {
    name: 'Romanian Deadlifts (RDL)',
    target: 'Hamstrings, Glutes, Lower Back',
    sets: '3 sets of 10 reps',
    instructions: [
      'Stand with feet hip-width apart, holding dumbbells in front of your thighs.',
      'Hinge at your hips, sending them backward while keeping your back flat.',
      'Lower the weights along your shins until you feel a deep stretch in hamstrings.',
      'Drive your hips forward and stand up, squeezing glutes at the top.'
    ],
    precautions: 'Do not round your lower back. Maintain a slight bend in your knees.'
  },
  'plank': {
    name: 'Forearm Plank',
    target: 'Core, Shoulders, Transverse Abdominis',
    sets: '3 sets of 30-45 seconds',
    instructions: [
      'Place your forearms on the floor, elbows aligned under shoulders.',
      'Extend your legs straight behind you, toes tucked, raising hips off the ground.',
      'Create a straight line from head to heels, squeezing core and glutes.'
    ],
    precautions: 'Do not let your hips sag toward the floor or arch upward.'
  },
  'pushups': {
    name: 'Standard Push-Ups',
    target: 'Chest, Triceps, Anterior Deltoids',
    sets: '3 sets of 10-15 reps',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulders.',
      'Lower your body by bending elbows at a 45-degree angle until chest nearly touches floor.',
      'Push back up to the starting position, maintaining a straight line.'
    ],
    precautions: 'Keep your head in a neutral position; don\'t let your neck sag.'
  },
  'cycling': {
    name: 'Stationary Cycling',
    target: 'Cardio, Quads, Calves',
    sets: '20-30 minutes moderate pace',
    instructions: [
      'Adjust seat height so there is a slight bend in your knee at the bottom of the pedal stroke.',
      'Maintain an upright posture and pedaling cadence of 80-90 RPM.',
      'Keep resistance at a level where you can speak in full sentences.'
    ],
    precautions: 'Stop immediately if you feel joint pain or chest tightness.'
  },
  'swimming': {
    name: 'Aerobic Swimming Laps',
    target: 'Full Body Cardio, Upper Back',
    sets: '20-30 minutes active swimming',
    instructions: [
      'Swim at a consistent, rhythmic pace using freestyle, breaststroke, or backstroke.',
      'Focus on deep, controlled breathing cycle on every stroke stroke.',
      'Rest for 30-60 seconds between lap sets if needed.'
    ],
    precautions: 'Keep intensity at a moderate level for cardiovascular conditioning.'
  },
  'running': {
    name: 'Moderate Aerobic Jogging',
    target: 'Cardiovascular Conditioning, Calves, Quads',
    sets: '30-40 minutes light jog',
    instructions: [
      'Maintain an upright stance, looking forward with relaxed shoulders.',
      'Land mid-foot and roll forward to push off your toes.',
      'Keep a steady breathing rhythm (e.g. inhale for 3 steps, exhale for 3 steps).'
    ],
    precautions: 'Avoid hard concrete running if you have knee joint wear.'
  },
  'walking': {
    name: 'Clinical Cardiovascular Walk',
    target: 'Lower Body Mobility, Cardiac Conditioning',
    sets: '20-30 minutes brisk walk',
    instructions: [
      'Walk at a steady, brisk pace (approx 3-4 mph).',
      'Swing your arms naturally and roll through your foot from heel to toe.',
      'Focus on maintaining a straight posture and breathing deep.'
    ],
    precautions: 'Wear supportive shoes and stay hydrated.'
  },
  'stretching': {
    name: 'Full Body Static & Dynamic Stretching',
    target: 'Flexibility, Joint Range of Motion',
    sets: '15 minutes full body routine',
    instructions: [
      'Perform light arm circles and hip hinges for dynamic warm-up.',
      'Hold static hamstring, calf, and shoulder stretches for 20-30 seconds each.',
      'Breathe slowly and deeply through each hold without bouncing.'
    ],
    precautions: 'Stretch to the point of mild tension, never pain.'
  },
  'yoga': {
    name: 'Gentle Restorative Vinyasa Yoga',
    target: 'Flexibility, Core Stability, Balance',
    sets: '30 minutes gentle practice',
    instructions: [
      'Begin in Child\'s pose, focusing on slow deep breathing.',
      'Move through Cat-Cow stretches to release spinal tension.',
      'Perform gentle Downward-Facing Dog, Warrior I, and Cobra poses.',
      'End in Savasana (corpse pose) for 5 minutes of relaxation.'
    ],
    precautions: 'Modify poses with blocks or straps as needed; do not over-extend.'
  }
};

export default function Planners({ token, API_BASE, latestVital }) {
  const [activeSubTab, setActiveSubTab] = useState('drug');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const getExercisesInRoutine = (routine) => {
    if (!routine) return [];
    const exerciseKeys = Object.keys(EXERCISE_LIBRARY);
    const found = [];
    Object.values(routine).forEach(text => {
      const lowerText = text.toLowerCase();
      exerciseKeys.forEach(key => {
        if (lowerText.includes(key) && !found.includes(key)) {
          found.push(key);
        }
      });
    });
    return found;
  };
  
  // -----------------
  // DRUG CHECKER STATE
  // -----------------
  const [drugInput, setDrugInput] = useState('');
  const [drugResults, setDrugResults] = useState(null);
  const [drugError, setDrugError] = useState('');
  const [checkingDrugs, setCheckingDrugs] = useState(false);

  // -----------------
  // DIET PLANNER STATE
  // -----------------
  const [calories, setCalories] = useState(2000);
  const [dietPref, setDietPref] = useState('Vegetarian');
  const [diabetesRisk, setDiabetesRisk] = useState(false);
  const [bpRisk, setBpRisk] = useState(false);
  const [cvdRisk, setCvdRisk] = useState(false);
  const [dietResults, setDietResults] = useState(null);
  const [generatingDiet, setGeneratingDiet] = useState(false);

  // -----------------
  // WORKOUT PLANNER STATE
  // -----------------
  const [workoutGoal, setWorkoutGoal] = useState('Weight Loss');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [workoutResults, setWorkoutResults] = useState(null);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);

  // Auto-detect high/moderate risk for workout on page load if vitals are logged
  useEffect(() => {
    if (latestVital) {
      const sys = latestVital.systolic_bp || 120;
      const dia = latestVital.diastolic_bp || 80;
      const sugar = latestVital.blood_sugar || 90;
      
      if (sys >= 140 || dia >= 90) {
        setRiskLevel('High');
        setBpRisk(true);
      } else if (sys >= 130 || dia >= 80) {
        setRiskLevel('Moderate');
        setBpRisk(true);
      }
      
      if (sugar >= 126) {
        setDiabetesRisk(true);
      }
    }
  }, [latestVital]);

  // Handle drug checker submit
  const handleDrugCheck = async (e) => {
    e.preventDefault();
    if (!drugInput.trim()) return;

    setCheckingDrugs(true);
    setDrugError('');
    setDrugResults(null);

    const drugList = drugInput.split(',').map(d => d.trim()).filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/planner/drug-checker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ drugs: drugList })
      });

      if (res.ok) {
        const data = await res.json();
        setDrugResults(data);
      } else {
        setDrugError('Failed to run drug interaction verification.');
      }
    } catch (err) {
      setDrugError('Connection error to backend.');
    } finally {
      setCheckingDrugs(false);
    }
  };

  // Handle diet generator submit
  const handleDietGenerate = async (e) => {
    e.preventDefault();
    setGeneratingDiet(true);
    
    const conditions = [];
    if (diabetesRisk) conditions.push('Diabetes');
    if (bpRisk) conditions.push('Hypertension');
    if (cvdRisk) conditions.push('CVD');

    try {
      const res = await fetch(`${API_BASE}/planner/diet-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          calories: parseInt(calories),
          preference: dietPref,
          conditions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDietResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDiet(false);
    }
  };

  // Handle workout generator submit
  const handleWorkoutGenerate = async (e) => {
    e.preventDefault();
    setGeneratingWorkout(true);

    try {
      const res = await fetch(`${API_BASE}/planner/workout-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          goal: workoutGoal,
          risk_level: riskLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWorkoutResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingWorkout(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1>Clinical Planners</h1>
        <p className="subtitle">Check drug-drug interactions, compile nutrition plans, and generate safe fitness workouts.</p>
      </div>

      {/* Subtab Navigation Pills */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '28px' }}>
        <button className={`nav-btn ${activeSubTab === 'drug' ? 'active' : ''}`} onClick={() => setActiveSubTab('drug')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Drug Checker
        </button>
        <button className={`nav-btn ${activeSubTab === 'diet' ? 'active' : ''}`} onClick={() => setActiveSubTab('diet')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Diet Planner
        </button>
        <button className={`nav-btn ${activeSubTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveSubTab('workout')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Workout Planner
        </button>
      </div>

      {/* 1. DRUG CHECKER VIEW */}
      {activeSubTab === 'drug' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px' }}>
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '12px' }}>Verify Medications</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Check for interactions between medications. Ex: **Aspirin, Warfarin** or **Lisinopril, Spironolactone**.
            </p>
            
            <form onSubmit={handleDrugCheck}>
              <div className="form-group">
                <label>Enter medications (comma-separated)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Aspirin, Warfarin"
                  value={drugInput}
                  onChange={e=>setDrugInput(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={checkingDrugs} style={{ width: '100%', marginTop: '10px' }}>
                {checkingDrugs ? 'Checking database...' : 'Verify Interactions'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {drugError && <div className="glass-panel" style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}>{drugError}</div>}
            
            {drugResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Interactions Block */}
                {drugResults.interactions.length > 0 ? (
                  <div className="glass-panel" style={{ borderColor: 'var(--accent-rose)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h3 style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⚠️ Critical Interactions Found
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                      {drugResults.interactions.map((inter, idx) => (
                        <div key={idx} style={{ paddingBottom: '12px', borderBottom: idx < drugResults.interactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <strong style={{ display: 'block', fontSize: '0.95rem' }}>{inter.drugs.join(' + ')}</strong>
                          <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '4px' }}>{inter.warning}</p>
                          <span className="badge badge-critical" style={{ marginTop: '8px' }}>{inter.severity} Danger</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ borderColor: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <h3 style={{ color: 'var(--accent-emerald)' }}>✅ No Adverse Interactions Detected</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      No negative drug-drug cross-indicators were identified in our local guidelines database. However, always verify double-doses with your physician.
                    </p>
                  </div>
                )}

                {/* Individual Details */}
                <div className="glass-panel">
                  <h3>Analyzed Drug Library Cards</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {drugResults.drugs_analyzed.map((d, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--accent-teal)' }}>{d.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{d.class}</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{d.uses}</p>
                        {d.side_effects.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Key Side Effects:</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{d.side_effects.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Medication review results will compile here. Try searching 'Aspirin, Warfarin' or 'Metformin, Lisinopril'.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DIET PLANNER VIEW */}
      {activeSubTab === 'diet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px' }}>
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Diet Target Matrix</h3>
            
            <form onSubmit={handleDietGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Daily Calorie Target</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={calories}
                  onChange={e=>setCalories(e.target.value)}
                  min="1000"
                  max="4500"
                  required
                />
              </div>

              <div className="form-group">
                <label>Food Preference</label>
                <select className="form-control" value={dietPref} onChange={e=>setDietPref(e.target.value)}>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Non-vegetarian">Non-Vegetarian</option>
                  <option value="Keto">Keto / Low Carb</option>
                </select>
              </div>

              <div className="form-group">
                <label>Correlated Health Risks</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={diabetesRisk} onChange={e=>setDiabetesRisk(e.target.checked)} />
                    Diabetes Control
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={bpRisk} onChange={e=>setBpRisk(e.target.checked)} />
                    Hypertension (Low Sodium)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={cvdRisk} onChange={e=>setCvdRisk(e.target.checked)} />
                    Cardiovascular Health
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={generatingDiet}>
                {generatingDiet ? 'Compiling diet plan...' : 'Generate Diet Plan'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {dietResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
                {/* Meals Card */}
                <div className="glass-panel">
                  <h3>Daily Caloric Meal Routine ({dietResults.calorie_target} kcal)</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'var(--accent-teal)', display: 'block', marginBottom: '6px' }}>Breakfast</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dietResults.meals.breakfast}</p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'var(--accent-teal)', display: 'block', marginBottom: '6px' }}>Lunch</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dietResults.meals.lunch}</p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'var(--accent-teal)', display: 'block', marginBottom: '6px' }}>Dinner</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dietResults.meals.dinner}</p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'var(--accent-teal)', display: 'block', marginBottom: '6px' }}>Snack</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dietResults.meals.snack}</p>
                    </div>
                  </div>
                </div>

                {/* Shopping List & Tips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="glass-panel">
                    <h3>Grocery Shopping List</h3>
                    <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {dietResults.shopping_list.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-indigo)', background: 'rgba(99,102,241,0.03)' }}>
                    <h3>Clinical Dietary Guidelines</h3>
                    <div style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dietResults.clinical_tips.map((tip, idx) => (
                        <p key={idx}>- {tip}</p>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Customize calorie targets and click 'Generate Diet Plan' to output a targeted clinical meal schedule.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WORKOUT PLANNER VIEW */}
      {activeSubTab === 'workout' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px' }}>
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Fitness Matrix</h3>
            
            <form onSubmit={handleWorkoutGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Primary Goal</label>
                <select className="form-control" value={workoutGoal} onChange={e=>setWorkoutGoal(e.target.value)}>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Cardiovascular Fitness">Cardiovascular Fitness</option>
                  <option value="Strength">Muscle Strength</option>
                  <option value="Flexibility">Flexibility & Yoga</option>
                </select>
              </div>

              <div className="form-group">
                <label>Clinical Risk Restriction</label>
                <select className="form-control" value={riskLevel} onChange={e=>setRiskLevel(e.target.value)}>
                  <option value="Low">Low Risk (Standard full workout)</option>
                  <option value="Moderate">Moderate Risk (Warmups, moderate pace)</option>
                  <option value="High">High Risk (Gentle walking, restricted heart rate)</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-detected from latest blood pressure logs.
                </span>
              </div>

              <button type="submit" className="btn-primary" disabled={generatingWorkout}>
                {generatingWorkout ? 'Creating routine...' : 'Generate Workout Routine'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {workoutResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
                
                {/* Precautions alert */}
                {workoutResults.safety_precautions.length > 0 && (
                  <div className="glass-panel" style={{ borderColor: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ color: 'var(--accent-amber)' }}>⚠️ Safety Precautions Checklist</h4>
                    {workoutResults.safety_precautions.map((pre, idx) => (
                      <p key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pre}</p>
                    ))}
                  </div>
                )}

                {/* Calendar grid */}
                <div className="glass-panel">
                  <h3>7-Day Structured Routine (Risk: {workoutResults.risk_level})</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {Object.entries(workoutResults.weekly_routine).map(([day, action]) => (
                      <div key={day} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{day}</span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {getExercisesInRoutine(workoutResults.weekly_routine).length > 0 && (
                  <div className="glass-panel" style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Routine Exercises (Click to view guide)</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {getExercisesInRoutine(workoutResults.weekly_routine).map(key => (
                        <button
                          key={key}
                          className="btn-secondary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            borderRadius: '20px',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onClick={() => setSelectedExercise(EXERCISE_LIBRARY[key])}
                        >
                          💪 {EXERCISE_LIBRARY[key].name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.3)' }}>
                  <strong>Hydration Target:</strong> {workoutResults.hydration_target}
                </div>

              </div>
            ) : (
              <div style={{ padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Customize fitness targets and click 'Generate Workout Routine' to output a safe weekly exercise schedule.
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXERCISE DETAILS MODAL */}
      {selectedExercise && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }} onClick={() => setSelectedExercise(null)}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '500px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            padding: '32px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              border: 'none',
              background: 'transparent',
              fontSize: '1.5rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }} onClick={() => setSelectedExercise(null)}>
              &times;
            </button>

            <span className="badge badge-info" style={{ marginBottom: '12px' }}>Exercise Card</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>{selectedExercise.name}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Target Muscle / Benefit</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedExercise.target}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Recommended Schedule</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--accent-teal)' }}>{selectedExercise.sets}</strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Step-by-Step Instructions</span>
                <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedExercise.instructions.map((step, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)' }}>{step}</li>
                  ))}
                </ol>
              </div>

              {selectedExercise.precautions && (
                <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>⚠️ Safety Warning</span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{selectedExercise.precautions}</p>
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setSelectedExercise(null)}>
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
