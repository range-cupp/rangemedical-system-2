// /pages/my-profile/[id].js
// Patient-facing profile page to view their protocols

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientPortal() {
  const router = useRouter();
  const { id } = router.query || {};
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      
      if (data.patient) {
        setPatient(data.patient);
        setActiveProtocols(data.activeProtocols || []);
        setCompletedProtocols(data.completedProtocols || []);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const calculateProgress = (protocol) => {
    if (protocol.total_sessions) {
      // Session-based (packs)
      const used = protocol.sessions_used || 0;
      return {
        type: 'sessions',
        current: used,
        total: protocol.total_sessions,
        percent: (used / protocol.total_sessions) * 100,
        label: `${used} of ${protocol.total_sessions} sessions`
      };
    } else if (protocol.start_date && protocol.end_date) {
      // Day-based
      const start = new Date(protocol.start_date);
      const end = new Date(protocol.end_date);
      const today = new Date();
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
      const currentDay = Math.min(Math.max(daysPassed, 1), totalDays);
      return {
        type: 'days',
        current: currentDay,
        total: totalDays,
        percent: Math.min((currentDay / totalDays) * 100, 100),
        label: `Day ${currentDay} of ${totalDays}`
      };
    }
    return null;
  };

  // Wait for router to be ready
  if (!router.isReady) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.errorContainer}>
        <h2>Profile Not Found</h2>
        <p>We couldn't find your profile. Please contact Range Medical.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <img 
            src="https://storage.googleapis.com/msgsndr/J2FyHLWLWLqEqh4VVg5Q/media/67601684eef8ab0001d28ae4.png" 
            alt="Range Medical" 
            style={styles.logo}
          />
          <h1 style={styles.title}>Welcome, {patient.name?.split(' ')[0]}</h1>
        </div>

        {/* Active Protocols */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.activeIcon}>●</span>
            Active Protocols
          </h2>
          
          {activeProtocols.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No active protocols</p>
            </div>
          ) : (
            <div style={styles.protocolList}>
              {activeProtocols.map(protocol => {
                const progress = calculateProgress(protocol);
                return (
                  <div key={protocol.id} style={styles.protocolCard}>
                    <div style={styles.protocolHeader}>
                      <h3 style={styles.protocolName}>
                        {protocol.medication || protocol.program_name}
                      </h3>
                      {protocol.selected_dose && (
                        <span style={styles.doseBadge}>{protocol.selected_dose}</span>
                      )}
                    </div>
                    
                    <div style={styles.protocolMeta}>
                      {protocol.frequency && (
                        <span style={styles.frequency}>{protocol.frequency}</span>
                      )}
                      <span style={styles.startDate}>
                        Started {formatDate(protocol.start_date)}
                      </span>
                    </div>

                    {progress && (
                      <div style={styles.progressSection}>
                        <div style={styles.progressBar}>
                          <div 
                            style={{
                              ...styles.progressFill,
                              width: `${progress.percent}%`
                            }}
                          ></div>
                        </div>
                        <span style={styles.progressLabel}>{progress.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Protocols */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.completedIcon}>✓</span>
            Completed Protocols
          </h2>
          
          {completedProtocols.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No completed protocols yet</p>
            </div>
          ) : (
            <div style={styles.protocolList}>
              {completedProtocols.map(protocol => (
                <div key={protocol.id} style={styles.completedCard}>
                  <div style={styles.protocolHeader}>
                    <h3 style={styles.completedName}>
                      {protocol.medication || protocol.program_name}
                    </h3>
                    {protocol.selected_dose && (
                      <span style={styles.doseBadgeGray}>{protocol.selected_dose}</span>
                    )}
                  </div>
                  <div style={styles.completedMeta}>
                    {formatDate(protocol.start_date)} — {formatDate(protocol.end_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div style={styles.contactSection}>
          <p style={styles.contactText}>Questions about your treatment?</p>
          <a href="tel:+19493107078" style={styles.contactButton}>
            Call Range Medical
          </a>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Range Medical • Costa Mesa, CA</p>
          <p style={styles.footerLink}>
            <a href="https://range-medical.com" target="_blank" rel="noopener noreferrer">
              range-medical.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
    background: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#fff'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#666'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  logo: {
    height: '40px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#111'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#333'
  },
  activeIcon: {
    color: '#10b981',
    fontSize: '12px'
  },
  completedIcon: {
    color: '#6b7280',
    fontSize: '14px'
  },
  emptyState: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    color: '#666'
  },
  protocolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  protocolCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '12px'
  },
  protocolName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
    flex: 1
  },
  doseBadge: {
    background: '#000',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  doseBadgeGray: {
    background: '#e5e7eb',
    color: '#666',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  protocolMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#666'
  },
  frequency: {
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  startDate: {},
  progressSection: {
    marginTop: '12px'
  },
  progressBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressLabel: {
    fontSize: '12px',
    color: '#666'
  },
  completedCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '16px'
  },
  completedName: {
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
    color: '#666',
    flex: 1
  },
  completedMeta: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  contactSection: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginTop: '32px'
  },
  contactText: {
    margin: '0 0 12px 0',
    color: '#666'
  },
  contactButton: {
    display: 'inline-block',
    background: '#000',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px'
  },
  footer: {
    textAlign: 'center',
    padding: '24px 0',
    color: '#9ca3af',
    fontSize: '13px'
  },
  footerLink: {
    marginTop: '4px'
  }
};
