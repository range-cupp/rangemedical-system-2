// /pages/portal/[token].js
// Patient Portal - Clean Day Tracking
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

function calculateCurrentDay(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export default function PatientPortal() {
  const router = useRouter();
  const { token } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchProtocol();
  }, [token]);

  const fetchProtocol = async () => {
    try {
      const res = await fetch(`/api/patient-portal/${token}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      
      // API returns { patient, protocols } - get the first/active protocol
      if (data.protocols && data.protocols.length > 0) {
        // Find active protocol or use first one
        const activeProtocol = data.protocols.find(p => p.status === 'active') || data.protocols[0];
        
        // Map fields to what the portal expects
        setProtocol({
          ...activeProtocol,
          patient_name: data.patient ? `${data.patient.first_name} ${data.patient.last_name || ''}`.trim() : activeProtocol.patient_name,
          program_name: activeProtocol.protocol_name || activeProtocol.program_name,
          primary_peptide: activeProtocol.medication || activeProtocol.primary_peptide,
          dose_amount: activeProtocol.dosage || activeProtocol.dose_amount,
          dose_frequency: activeProtocol.frequency || activeProtocol.dose_frequency,
          total_sessions: activeProtocol.total_sessions,
          duration_days: activeProtocol.total_sessions,
          start_date: activeProtocol.start_date,
          end_date: activeProtocol.end_date,
          special_instructions: activeProtocol.special_instructions
        });
      } else if (data.protocol) {
        // Direct protocol response
        setProtocol(data.protocol);
      } else {
        throw new Error('No protocol found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingScreen}>
          <div style={styles.spinner}></div>
          <p>Loading your protocol...</p>
        </div>
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div style={styles.container}>
        <div style={styles.errorScreen}>
          <h1>Protocol Not Found</h1>
          <p>This link may have expired or is invalid.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            Please contact Range Medical for assistance.
          </p>
        </div>
      </div>
    );
  }

  const totalDays = protocol.total_sessions || protocol.duration_days || 10;
  const currentDay = calculateCurrentDay(protocol.start_date);
  const isComplete = currentDay > totalDays;
  const isNotStarted = currentDay < 1;
  const daysRemaining = totalDays - currentDay;

  // Get first name
  const firstName = protocol.patient_name?.split(' ')[0] || 'there';

  return (
    <>
      <Head>
        <title>Your Protocol | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logo}>RANGE MEDICAL</div>
        </header>

        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingText}>Hey {firstName} 👋</h1>
          <p style={styles.programName}>{protocol.program_name || 'Your Protocol'}</p>
        </div>

        {/* Big Day Display */}
        <div style={styles.dayCard}>
          {isComplete ? (
            <>
              <div style={styles.completeIcon}>🎉</div>
              <div style={styles.completeText}>Protocol Complete!</div>
              <p style={styles.completeSubtext}>
                Great job finishing your {totalDays}-day protocol
              </p>
            </>
          ) : isNotStarted ? (
            <>
              <div style={styles.dayLabel}>STARTS</div>
              <div style={styles.startDate}>{formatDate(protocol.start_date)}</div>
              <p style={styles.daySubtext}>{totalDays}-day protocol</p>
            </>
          ) : (
            <>
              <div style={styles.dayLabel}>TODAY IS</div>
              <div style={styles.dayDisplay}>
                <span style={styles.dayText}>Day</span>
                <span style={styles.currentDay}>{currentDay}</span>
                <span style={styles.ofText}>of {totalDays}</span>
              </div>
              <p style={styles.daySubtext}>
                {daysRemaining === 0 ? 'Last day!' : `${daysRemaining} days remaining`}
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {!isNotStarted && (
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div 
                style={{ 
                  ...styles.progressFill, 
                  width: `${Math.min(100, (currentDay / totalDays) * 100)}%` 
                }} 
              />
            </div>
            <div style={styles.progressLabels}>
              <span>Day 1</span>
              <span>Day {totalDays}</span>
            </div>
          </div>
        )}

        {/* Calendar */}
        {!isComplete && !isNotStarted && (
          <div style={styles.calendarSection}>
            <h2 style={styles.sectionTitle}>Your Calendar</h2>
            <div style={styles.calendarGrid}>
              {Array.from({ length: totalDays }, (_, i) => {
                const dayNum = i + 1;
                const isPast = currentDay > dayNum;
                const isToday = currentDay === dayNum;
                const isFuture = currentDay < dayNum;
                
                return (
                  <div
                    key={dayNum}
                    style={{
                      ...styles.calendarDay,
                      background: isToday ? '#000' : isPast ? '#22c55e' : '#f5f5f5',
                      color: isToday || isPast ? '#fff' : '#999',
                      transform: isToday ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isToday ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    <span style={styles.calendarDayNum}>{dayNum}</span>
                    {isPast && <span style={styles.calendarCheck}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Protocol Info */}
        <div style={styles.infoSection}>
          <h2 style={styles.sectionTitle}>Your Protocol</h2>
          
          {protocol.primary_peptide && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Medication</span>
              <span style={styles.infoValue}>{protocol.primary_peptide}</span>
            </div>
          )}
          
          {protocol.dose_amount && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Dosage</span>
              <span style={styles.infoValue}>{protocol.dose_amount}</span>
            </div>
          )}
          
          {protocol.dose_frequency && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Frequency</span>
              <span style={styles.infoValue}>{formatFrequency(protocol.dose_frequency)}</span>
            </div>
          )}
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Duration</span>
            <span style={styles.infoValue}>{totalDays} days</span>
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Started</span>
            <span style={styles.infoValue}>{formatDate(protocol.start_date)}</span>
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Ends</span>
            <span style={styles.infoValue}>{formatDate(protocol.end_date)}</span>
          </div>
        </div>

        {/* Special Instructions */}
        {protocol.special_instructions && (
          <div style={styles.instructionsSection}>
            <h2 style={styles.sectionTitle}>Instructions</h2>
            <p style={styles.instructions}>{protocol.special_instructions}</p>
          </div>
        )}

        {/* Contact */}
        <div style={styles.contactSection}>
          <p style={styles.contactText}>Questions? Contact Range Medical</p>
          <a href="tel:+19497576060" style={styles.phoneLink}>📞 (949) 757-6060</a>
        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>© Range Medical Costa Mesa</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFrequency(f) {
  const map = { daily: 'Once daily', '2x_daily': 'Twice daily', '2x_weekly': '2x per week', weekly: 'Weekly' };
  return map[f] || f || '—';
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '40px'
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  errorScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center'
  },
  
  // Header
  header: {
    background: '#000',
    padding: '16px 20px',
    textAlign: 'center'
  },
  logo: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '2px'
  },
  
  // Greeting
  greeting: {
    padding: '24px 20px 16px',
    textAlign: 'center'
  },
  greetingText: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  programName: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666'
  },
  
  // Day Display
  dayCard: {
    margin: '0 20px',
    padding: '32px 24px',
    background: '#fff',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  dayLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    letterSpacing: '2px',
    marginBottom: '8px'
  },
  dayDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px'
  },
  dayText: {
    fontSize: '24px',
    fontWeight: '300',
    color: '#666'
  },
  currentDay: {
    fontSize: '80px',
    fontWeight: '700',
    lineHeight: 1
  },
  ofText: {
    fontSize: '20px',
    fontWeight: '300',
    color: '#999'
  },
  daySubtext: {
    margin: '12px 0 0',
    fontSize: '16px',
    color: '#666'
  },
  startDate: {
    fontSize: '32px',
    fontWeight: '600',
    margin: '8px 0'
  },
  completeIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  completeText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#22c55e'
  },
  completeSubtext: {
    margin: '8px 0 0',
    color: '#666'
  },
  
  // Progress
  progressSection: {
    margin: '24px 20px 0',
    padding: '0 4px'
  },
  progressBar: {
    height: '8px',
    background: '#e5e5e5',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #000 0%, #333 100%)',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    fontSize: '12px',
    color: '#999'
  },
  
  // Calendar
  calendarSection: {
    margin: '32px 20px 0'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px'
  },
  calendarDay: {
    aspectRatio: '1',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  calendarDayNum: {
    fontSize: '14px',
    fontWeight: '600'
  },
  calendarCheck: {
    fontSize: '10px',
    marginTop: '2px'
  },
  
  // Info
  infoSection: {
    margin: '32px 20px 0',
    padding: '20px',
    background: '#fff',
    borderRadius: '12px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600'
  },
  
  // Instructions
  instructionsSection: {
    margin: '24px 20px 0',
    padding: '20px',
    background: '#fffbeb',
    borderRadius: '12px',
    border: '1px solid #fef3c7'
  },
  instructions: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#92400e'
  },
  
  // Contact
  contactSection: {
    margin: '32px 20px 0',
    textAlign: 'center'
  },
  contactText: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px'
  },
  phoneLink: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#000',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500'
  },
  
  // Footer
  footer: {
    marginTop: '40px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#999'
  }
};
