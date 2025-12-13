// /pages/track/[token].js
// Patient-facing injection tracker

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientTracker() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Protocol not found. Please check your link.');
      }
    } catch (err) {
      setError('Unable to load your protocol. Please try again.');
    }
    setLoading(false);
  };

  const toggleDay = async (day, isCompleted) => {
    setSaving(day);
    
    try {
      const res = await fetch(`/api/patient/tracker?token=${token}`, {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day })
      });

      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error toggling day:', err);
    }
    
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Loading... | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.loading}>Loading your protocol...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head>
          <title>Error | Range Medical</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div style={styles.errorContainer}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.errorMessage}>{error}</div>
          <p style={styles.errorHelp}>
            If you need help, text us at (949) 891-5683
          </p>
        </div>
      </div>
    );
  }

  const { protocol, days, dosingInstructions, completionRate } = data;

  return (
    <div style={styles.container}>
      <Head>
        <title>Injection Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1a365d" />
      </Head>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>RANGE MEDICAL</div>
        <div style={styles.greeting}>Hi {protocol.patientName?.split(' ')[0]}! 👋</div>
      </div>

      {/* Protocol Summary Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.protocolName}>{protocol.programName}</div>
          <div style={styles.peptides}>
            {protocol.primaryPeptide}
            {protocol.secondaryPeptide && ` + ${protocol.secondaryPeptide}`}
          </div>
        </div>
        
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{protocol.currentDay > protocol.totalDays ? protocol.totalDays : protocol.currentDay}</div>
            <div style={styles.statLabel}>Day</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{protocol.totalDays}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{completionRate}%</div>
            <div style={styles.statLabel}>Done</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${completionRate}%`}} />
        </div>
      </div>

      {/* Dosing Button */}
      <button 
        style={styles.instructionsButton}
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? '✕ Hide Instructions' : '📋 View Dosing Instructions'}
      </button>

      {/* Instructions Panel */}
      {showInstructions && (
        <div style={styles.instructionsPanel}>
          <pre style={styles.instructionsText}>{dosingInstructions}</pre>
        </div>
      )}

      {/* Injection Grid */}
      <div style={styles.sectionTitle}>
        Tap each day when you complete your injection
      </div>

      <div style={styles.daysGrid}>
        {days.map((day) => (
          <button
            key={day.day}
            style={{
              ...styles.dayButton,
              ...(day.completed ? styles.dayCompleted : {}),
              ...(day.isCurrent && !day.completed ? styles.dayCurrent : {}),
              ...(day.isFuture ? styles.dayFuture : {}),
              opacity: saving === day.day ? 0.5 : 1
            }}
            onClick={() => toggleDay(day.day, day.completed)}
            disabled={saving !== null}
          >
            <div style={styles.dayNumber}>Day {day.day}</div>
            <div style={styles.dayDate}>
              {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            {day.completed && <div style={styles.checkmark}>✓</div>}
            {day.isCurrent && !day.completed && <div style={styles.todayBadge}>TODAY</div>}
          </button>
        ))}
      </div>

      {/* Status Message */}
      {protocol.status === 'completed' && (
        <div style={styles.completedMessage}>
          🎉 Protocol Complete! Great job staying consistent.
        </div>
      )}

      {protocol.status === 'active' && completionRate === 100 && (
        <div style={styles.completedMessage}>
          🎉 All injections logged! You're doing amazing.
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p>Questions? Text us anytime</p>
        <a href="sms:+19498915683" style={styles.phoneLink}>(949) 891-5683</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '100px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#64748b'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: '18px',
    color: '#ef4444',
    marginTop: '20px'
  },
  errorHelp: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '10px'
  },
  header: {
    backgroundColor: '#1a365d',
    color: 'white',
    padding: '20px',
    paddingTop: '40px'
  },
  logo: {
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '2px',
    opacity: 0.9
  },
  greeting: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '10px'
  },
  card: {
    backgroundColor: 'white',
    margin: '20px',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  cardHeader: {
    marginBottom: '20px'
  },
  protocolName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a365d'
  },
  peptides: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '16px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a365d'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  progressContainer: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  instructionsButton: {
    display: 'block',
    width: 'calc(100% - 40px)',
    margin: '0 20px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a365d',
    backgroundColor: 'white',
    border: '2px solid #1a365d',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  instructionsPanel: {
    backgroundColor: 'white',
    margin: '20px',
    marginTop: '12px',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  instructionsText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#334155',
    whiteSpace: 'pre-wrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    margin: '24px 20px 16px'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    padding: '0 20px'
  },
  dayButton: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  dayCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: 'white'
  },
  dayCurrent: {
    borderColor: '#1a365d',
    borderWidth: '3px',
    boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.2)'
  },
  dayFuture: {
    opacity: 0.5
  },
  dayNumber: {
    fontSize: '12px',
    fontWeight: '700'
  },
  dayDate: {
    fontSize: '9px',
    marginTop: '2px',
    opacity: 0.8
  },
  checkmark: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  todayBadge: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '7px',
    fontWeight: '700',
    color: '#1a365d',
    letterSpacing: '0.5px'
  },
  completedMessage: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#10b981',
    fontWeight: '600',
    margin: '24px 20px',
    padding: '16px',
    backgroundColor: '#ecfdf5',
    borderRadius: '12px'
  },
  footer: {
    textAlign: 'center',
    padding: '30px 20px',
    color: '#64748b',
    fontSize: '14px'
  },
  phoneLink: {
    color: '#1a365d',
    fontWeight: '600',
    fontSize: '18px',
    textDecoration: 'none'
  }
};
