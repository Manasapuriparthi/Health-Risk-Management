import React, { useState } from 'react';

const ARTICLES = [
  {
    id: 1,
    category: 'Latest',
    title: '10 Simple Ways to Improve Heart Health',
    author: 'Dr. John Smith, Cardiologist',
    date: '18 May 2026',
    readTime: '6 min read',
    summary: 'Simple diet adjustments, routine workouts, and stress control habits can substantially lower cardiovascular disease risk.',
    content: `A healthy heart is essential for a happy, energetic life. In this guide, our chief cardiologist breaks down 10 simple habits you can implement starting today to improve your heart health:
    
    1. Eat a Mediterranean Diet: Focus on olive oil, nuts, vegetables, and lean proteins.
    2. Exercise for 30 Minutes Daily: Even a brisk walk improves circulation and lowers resting heart rate.
    3. Monitor Blood Pressure: Keeping systolic BP under 120 mmHg reduces stroke risks.
    4. Limit Sodium Intake: Stay below 1,500 mg of sodium daily.
    5. Prioritize Sleep: 7 to 8 hours of restorative sleep maintains cardiovascular rhythm.
    6. Manage Stress: Practice breathing exercises or yoga daily.
    7. Avoid Smoking: Quitting smoking instantly triggers heart recovery.
    8. Limit Alcohol Consumption: Drink in moderation or choose healthy alternatives.
    9. Stay Hydrated: Water keeps blood density at safe levels.
    10. Get Regular Checkups: Schedule an annual medical assessment.`,
    tags: ['Cardiology', 'Lifestyle', 'Prevention']
  },
  {
    id: 2,
    category: 'Nutrition',
    title: 'The Ultimate Guide to Low-Sodium Dieting',
    author: 'Sarah Sian, Nutritionist',
    date: '14 May 2026',
    readTime: '8 min read',
    summary: 'Discover how reducing salt content in meals prevents fluid retention and aids blood pressure control.',
    content: `High sodium intake is one of the primary drivers of elevated blood pressure (hypertension). By following these basic nutrition adjustments, you can successfully lower your salt intake without compromising on taste:
    
    - Eliminate Processed Foods: Up to 70% of dietary sodium comes from canned soups, cured meats, and pre-packaged meals.
    - Cook with Herbs and Spices: Swap table salt for garlic powder, oregano, lemon juice, or fresh black pepper.
    - Read Food Labels: Always check the milligrams of sodium per serving on ingredients lists.
    - Rinse Canned Beans: Rinsing canned vegetables under tap water removes excess preserving salts.`,
    tags: ['Nutrition', 'Hypertension', 'Diet']
  },
  {
    id: 3,
    category: 'Fitness',
    title: 'Warmup Routines: Why They Prevent Muscle Strains',
    author: 'Mark Taylor, Fitness Coach',
    date: '10 May 2026',
    readTime: '5 min read',
    summary: 'A proper 10-minute dynamic warmup prepares joints and increases oxygen supply to muscle tissues.',
    content: `Static stretching before cold muscles is a common mistake. Instead, follow this dynamic routine before starting active exercises:
    
    - Arm Swings: 15 reps forward, 15 reps backward to lubricate shoulder sockets.
    - Leg Swings: 10 reps per leg to activate hip flexors.
    - Bodyweight Squats: 12 slow reps to warm up quadriceps and hamstrings.
    - Gentle Jog: 3 minutes of light jogging to raise core body temperature.`,
    tags: ['Fitness', 'Warmups', 'Safety']
  }
];

export default function HealthNews() {
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = activeCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory);

  const activeArticle = ARTICLES.find(a => a.id === selectedArticleId);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Article Detail View */}
      {activeArticle ? (
        <div className="glass-panel">
          <button 
            className="btn-secondary" 
            style={{ padding: '8px 16px', marginBottom: '24px' }}
            onClick={() => setSelectedArticleId(null)}
          >
            ← Back to Feed
          </button>
          
          <span className="badge badge-info">{activeArticle.category}</span>
          <h1 style={{ fontSize: '2.25rem', marginTop: '12px', marginBottom: '8px', lineHeight: '1.2' }}>{activeArticle.title}</h1>
          
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            <span>By: <strong>{activeArticle.author}</strong></span>
            <span>•</span>
            <span>{activeArticle.date}</span>
            <span>•</span>
            <span>{activeArticle.readTime}</span>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            height: '240px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            border: '1px solid var(--border-color)'
          }}>
            📷 Article Image Asset
          </div>

          <div style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            whiteSpace: 'pre-line'
          }}>
            {activeArticle.content}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            {activeArticle.tags.map(t => (
              <span key={t} style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-indigo)', padding: '6px 12px', borderRadius: '16px', fontWeight: 'bold' }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Articles List Feed */
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h1>Health News & Research</h1>
            <p className="subtitle">Explore verified articles on nutrition benchmarks, cardiological care, and fitness guidelines.</p>
          </div>

          {/* Categories Pill Filters */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '28px' }}>
            {['All', 'Latest', 'Nutrition', 'Fitness'].map(cat => (
              <button
                key={cat}
                className={`nav-btn ${activeCategory === cat ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredArticles.map(art => (
              <div key={art.id} className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  height: '120px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '1.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  📰
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '8px' }}>{art.category}</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '4px 0 8px 0', cursor: 'pointer' }} onClick={() => setSelectedArticleId(art.id)}>
                      {art.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{art.summary}</p>
                  </div>
                  <div style={{ display: 'flex', justifyBetween: 'center', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    <span>By: {art.author.split(',')[0]} • {art.readTime}</span>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', marginLeft: 'auto' }}
                      onClick={() => setSelectedArticleId(art.id)}
                    >
                      Read Full Article →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
