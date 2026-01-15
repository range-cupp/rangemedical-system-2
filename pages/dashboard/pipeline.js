// /pages/dashboard/pipeline.js
// Protocol Pipeline Dashboard - Visual overview of patient journey

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PipelineDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [labsComplete, setLabsComplete] = useState([]);
  const [endingSoon, setEndingSoon] = useState([]);
  const [active, setActive] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchPipelineData();
  }, []);

  async function fetchPipelineData() {
    try {
      const res = await fetch('/api/dashboard/pipeline');
      const data = await res.json();
      
      if (res.ok) {
        setLabsComplete(data.labsComplete || []);
        setEndingSoon(data.endingSoon || []);
        setActive(data.active || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function getDaysRemaining(endDate) {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  }

  function getCategoryColor(category) {
    const colors = {
      peptide: { bg: '#dcfce7', text: '#166534', dot: '🟢' },
      weight_loss: { bg: '#dbeafe', text: '#1e40af', dot: '🔵' },
      hrt: { bg: '#f3e8ff', text: '#7c3aed', dot: '🟣' },
      therapy: { bg: '#ffedd5', text: '#c2410c', dot: '🟠' }
    };
    return colors[category] || { bg: '#f3f4f6', text: '#374151', dot: '⚪' };
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading pipeline...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Protocol Pipeline | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Protocol Pipeline</h1>
          <div style={styles.legend}>
            <span style={styles.legendItem}>🟢 Peptide</span>
            <span style={styles.legendItem}>🔵 Weight Loss</span>
            <span style={styles.legendItem}>🟣 HRT</span>
            <span style={styles.legendItem}>🟠 Therapy</span>
          </div>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.labsNoProtocol || 0}</div>
            <div style={styles.statLabel}>Labs Done, No Protocol</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#ef4444'}}>{stats.endingSoon || 0}</div>
            <div style={styles.statLabel}>Ending in 3 Days</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#22c55e'}}>{stats.activeProtocols || 0}</div>
            <div style={styles.statLabel}>Active Protocols</div>
          </div>
        </div>

        <div style={styles.pipeline}>
          {/* Column 1: Labs Complete, No Protocol */}
          <div style={styles.column}>
            <div style={styles.columnHeader}>
              <h2 style={styles.columnTitle}>Labs Complete</h2>
              <span style={styles.columnSubtitle}>No Protocol Yet</span>
              <span style={styles.columnCount}>{labsComplete.length}</span>
            </div>
            <div style={styles.columnContent}>
              {labsComplete.length === 0 ? (
                <div style={styles.emptyColumn}>No patients</div>
              ) : (
                labsComplete.map(patient => (
                  <Link 
                    href={`/patients/${patient.id}`} 
                    key={patient.id}
                    style={styles.card}
                  >
                    <div style={styles.cardName}>{patient.name}</div>
                    <div style={styles.cardMeta}>
                      {patient.lab_panel || 'Labs'} • {formatDate(patient.lab_date)}
                    </div>
                    {patient.has_symptoms && (
                      <div style={styles.cardBadge}>✓ Symptoms</div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Ending Soon (3 days) */}
          <div style={styles.column}>
            <div style={{...styles.columnHeader, background: '#fef2f2'}}>
              <h2 style={styles.columnTitle}>Ending Soon</h2>
              <span style={styles.columnSubtitle}>Within 3 Days</span>
              <span style={{...styles.columnCount, background: '#ef4444'}}>{endingSoon.length}</span>
            </div>
            <div style={styles.columnContent}>
              {endingSoon.length === 0 ? (
                <div style={styles.emptyColumn}>No protocols ending soon</div>
              ) : (
                endingSoon.map(protocol => {
                  const colors = getCategoryColor(protocol.category);
                  const daysLeft = getDaysRemaining(protocol.end_date);
                  return (
                    <Link 
                      href={`/patients/${protocol.patient_id}`} 
                      key={protocol.id}
                      style={{...styles.card, borderLeft: `4px solid ${colors.text}`}}
                    >
                      <div style={styles.cardHeader}>
                        <span style={styles.cardName}>{protocol.patient_name}</span>
                        <span style={{
                          ...styles.daysLeft,
                          background: daysLeft <= 1 ? '#fee2e2' : '#fef3c7',
                          color: daysLeft <= 1 ? '#dc2626' : '#92400e'
                        }}>
                          {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                        </span>
                      </div>
                      <div style={styles.cardProtocol}>
                        {colors.dot} {protocol.protocol_name}
                      </div>
                      <div style={styles.cardMeta}>
                        Ends {formatDate(protocol.end_date)}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Active */}
          <div style={styles.column}>
            <div style={{...styles.columnHeader, background: '#f0fdf4'}}>
              <h2 style={styles.columnTitle}>Active</h2>
              <span style={styles.columnSubtitle}>In Progress</span>
              <span style={{...styles.columnCount, background: '#22c55e'}}>{active.length}</span>
            </div>
            <div style={styles.columnContent}>
              {active.length === 0 ? (
                <div style={styles.emptyColumn}>No active protocols</div>
              ) : (
                active.map(protocol => {
                  const colors = getCategoryColor(protocol.category);
                  const daysLeft = getDaysRemaining(protocol.end_date);
                  const progress = protocol.duration_days 
                    ? Math.round(((protocol.duration_days - (daysLeft || 0)) / protocol.duration_days) * 100)
                    : null;
                  return (
                    <Link 
                      href={`/patients/${protocol.patient_id}`} 
                      key={protocol.id}
                      style={{...styles.card, borderLeft: `4px solid ${colors.text}`}}
                    >
                      <div style={styles.cardName}>{protocol.patient_name}</div>
                      <div style={styles.cardProtocol}>
                        {colors.dot} {protocol.protocol_name}
                      </div>
                      {progress !== null && (
                        <div style={styles.progressContainer}>
                          <div style={styles.progressBar}>
                            <div style={{...styles.progressFill, width: `${progress}%`}} />
                          </div>
                          <span style={styles.progressText}>
                            Day {protocol.duration_days - daysLeft} of {protocol.duration_days}
                          </span>
                        </div>
                      )}
                      {protocol.compliance_percent !== null && (
                        <div style={styles.cardMeta}>
                          Compliance: {protocol.compliance_percent}%
                        </div>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f9fafb',
    minHeight: '100vh'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  legend: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px'
  },
  legendItem: {
    color: '#666'
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#fff',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  pipeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    alignItems: 'flex-start'
  },
  column: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  columnHeader: {
    padding: '16px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative'
  },
  columnTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  columnSubtitle: {
    fontSize: '13px',
    color: '#666'
  },
  columnCount: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#000',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600'
  },
  columnContent: {
    padding: '12px',
    maxHeight: '600px',
    overflowY: 'auto'
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '24px',
    color: '#999',
    fontSize: '14px'
  },
  card: {
    display: 'block',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.15s',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px'
  },
  cardName: {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px'
  },
  cardProtocol: {
    fontSize: '13px',
    marginBottom: '4px'
  },
  cardMeta: {
    fontSize: '12px',
    color: '#666'
  },
  cardBadge: {
    display: 'inline-block',
    marginTop: '6px',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '4px',
    fontSize: '11px'
  },
  daysLeft: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  progressContainer: {
    marginTop: '8px'
  },
  progressBar: {
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    marginBottom: '4px'
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    borderRadius: '2px'
  },
  progressText: {
    fontSize: '11px',
    color: '#666'
  }
};
