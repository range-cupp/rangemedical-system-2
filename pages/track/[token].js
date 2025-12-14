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

  // Determine if a day is an "off" day based on frequency
  const isOffDay = (dayNumber, frequency) => {
    if (!frequency) return false;
    
    // 5 days on / 2 days off - days 6, 7, 13, 14, 20, 21, etc. are off
    if (frequency.includes('5 days on')) {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle === 6 || dayInCycle === 7;
    }
    
    // 1x weekly - only day 1, 8, 15, 22, etc. are injection days
    if (frequency === '1x weekly') {
      return ((dayNumber - 1) % 7) !== 0;
    }
    
    // 2x weekly - days 1, 4, 8, 11, 15, 18, etc. (every 3-4 days)
    if (frequency === '2x weekly') {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 4;
    }
    
    // 3x weekly - days 1, 3, 5, 8, 10, 12, etc. (Mon/Wed/Fri pattern)
    if (frequency === '3x weekly') {
      const dayInCycle = ((dayNumber - 1) % 7) + 1;
      return dayInCycle !== 1 && dayInCycle !== 3 && dayInCycle !== 5;
    }
    
    // Every other day
    if (frequency === 'Every other day') {
      return dayNumber % 2 === 0;
    }
    
    return false;
  };

  const toggleDay = async (day, isCompleted, isOff) => {
    // Don't allow toggling off days
    if (isOff) return;
    
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
            If you need help, text us at (949) 997-3988
          </p>
        </div>
      </div>
    );
  }

  const { protocol, days, dosingInstructions, completionRate } = data;
  
  // Calculate actual injection days (excluding off days)
  const frequency = protocol.doseFrequency;
  const injectionDays = days.filter(d => !isOffDay(d.day, frequency));
  const completedInjections = days.filter(d => d.completed && !isOffDay(d.day, frequency)).length;
  const totalInjections = injectionDays.length;
  const adjustedCompletionRate = totalInjections > 0 ? Math.round((completedInjections / totalInjections) * 100) : 0;

  return (
    <div style={styles.container}>
      <Head>
        <title>Injection Tracker | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>RANGE MEDICAL</div>
          <div style={styles.greeting}>Hi {protocol.patientName?.split(' ')[0]}!</div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Protocol Summary Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.protocolName}>{protocol.programName}</div>
            <div style={styles.peptides}>
              {protocol.primaryPeptide}
              {protocol.secondaryPeptide && ` + ${protocol.secondaryPeptide}`}
            </div>
            {frequency && (
              <div style={styles.frequency}>{frequency}</div>
            )}
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{protocol.currentDay > protocol.totalDays ? protocol.totalDays : protocol.currentDay}</div>
              <div style={styles.statLabel}>Day</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{completedInjections}/{totalInjections}</div>
              <div style={styles.statLabel}>Injections</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>{adjustedCompletionRate}%</div>
              <div style={styles.statLabel}>Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressContainer}>
            <div style={{...styles.progressBar, width: `${adjustedCompletionRate}%`}} />
          </div>
        </div>

        {/* Dosing Button */}
        <button 
          style={styles.instructionsButton}
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide Instructions' : 'View Dosing Instructions'}
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
        
        {frequency && (frequency.includes('days off') || frequency.includes('weekly') || frequency === 'Every other day') && (
          <div style={styles.offDayLegend}>
            <span style={styles.legendItem}><span style={styles.legendDotGrey}></span> Rest day (no injection)</span>
            <span style={styles.legendItem}><span style={styles.legendDotGreen}></span> Completed</span>
          </div>
        )}

        <div style={styles.daysGrid}>
          {days.map((day) => {
            const isOff = isOffDay(day.day, frequency);
            return (
              <button
                key={day.day}
                style={{
                  ...styles.dayButton,
                  ...(isOff ? styles.dayOff : {}),
                  ...(day.completed && !isOff ? styles.dayCompleted : {}),
                  ...(day.isCurrent && !day.completed && !isOff ? styles.dayCurrent : {}),
                  ...(day.isFuture && !isOff ? styles.dayFuture : {}),
                  opacity: saving === day.day ? 0.5 : 1,
                  cursor: isOff ? 'default' : 'pointer'
                }}
                onClick={() => toggleDay(day.day, day.completed, isOff)}
                disabled={saving !== null || isOff}
              >
                <div style={{...styles.dayNumber, ...(isOff ? styles.dayNumberOff : {})}}>Day {day.day}</div>
                <div style={{...styles.dayDate, ...(isOff ? styles.dayDateOff : {})}}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                {day.completed && !isOff && <div style={styles.checkmark}>✓</div>}
                {isOff && <div style={styles.offLabel}>OFF</div>}
                {day.isCurrent && !day.completed && !isOff && <div style={styles.todayBadge}>TODAY</div>}
              </button>
            );
          })}
        </div>

        {/* Status Message */}
        {protocol.status === 'completed' && (
          <div style={styles.completedMessage}>
            Protocol Complete! Great job staying consistent.
          </div>
        )}

        {protocol.status === 'active' && adjustedCompletionRate === 100 && (
          <div style={styles.completedMessage}>
            All injections logged! You're doing amazing.
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p>Questions? Text us anytime</p>
          <a href="sms:+19499973988" style={styles.phoneLink}>(949) 997-3988</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666666'
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
    color: '#000000',
    marginTop: '20px'
  },
  errorHelp: {
    fontSize: '14px',
    color: '#666666',
    marginTop: '10px'
  },
  header: {
    backgroundColor: '#000000',
    color: 'white',
    padding: '20px',
    paddingTop: '40px'
  },
  headerInner: {
    maxWidth: '900px',
    margin: '0 auto'
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
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    paddingBottom: '100px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  cardHeader: {
    marginBottom: '24px'
  },
  protocolName: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#000000'
  },
  peptides: {
    fontSize: '16px',
    color: '#666666',
    marginTop: '6px'
  },
  frequency: {
    fontSize: '14px',
    color: '#888888',
    marginTop: '4px'
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '24px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000000'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '4px'
  },
  progressContainer: {
    height: '12px',
    backgroundColor: '#e5e5e5',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '6px',
    transition: 'width 0.3s ease'
  },
  instructionsButton: {
    display: 'block',
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    marginBottom: '20px'
  },
  instructionsPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  instructionsText: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333333',
    whiteSpace: 'pre-wrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0
  },
  sectionTitle: {
    fontSize: '15px',
    color: '#666666',
    textAlign: 'center',
    marginBottom: '12px'
  },
  offDayLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#666666'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDotGrey: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    backgroundColor: '#e0e0e0'
  },
  legendDotGreen: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    backgroundColor: '#10b981'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '10px'
  },
  dayButton: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    padding: '8px'
  },
  dayCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: 'white'
  },
  dayCurrent: {
    borderColor: '#000000',
    borderWidth: '3px',
    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)'
  },
  dayFuture: {
    opacity: 0.6
  },
  dayOff: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
    cursor: 'default'
  },
  dayNumber: {
    fontSize: '13px',
    fontWeight: '700'
  },
  dayNumberOff: {
    color: '#aaaaaa'
  },
  dayDate: {
    fontSize: '10px',
    marginTop: '2px',
    opacity: 0.8
  },
  dayDateOff: {
    color: '#aaaaaa'
  },
  checkmark: {
    position: 'absolute',
    top: '4px',
    right: '6px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  offLabel: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '8px',
    fontWeight: '700',
    color: '#aaaaaa',
    letterSpacing: '0.5px'
  },
  todayBadge: {
    position: 'absolute',
    bottom: '4px',
    fontSize: '8px',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px'
  },
  completedMessage: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#10b981',
    fontWeight: '600',
    margin: '24px 0',
    padding: '16px',
    backgroundColor: '#ecfdf5',
    borderRadius: '8px'
  },
  footer: {
    textAlign: 'center',
    padding: '30px 0',
    color: '#666666',
    fontSize: '14px'
  },
  phoneLink: {
    color: '#000000',
    fontWeight: '600',
    fontSize: '18px',
    textDecoration: 'none'
  }
};
