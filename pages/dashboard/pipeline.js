// /pages/dashboard/pipeline.js
// Protocol Pipeline Dashboard - Shows ONLY protocols (not labs)
// Range Medical - Updated 2026-02-04

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PipelineDashboard() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
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
        setPending(data.pending || []);
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
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  }

  function getCategoryColor(category) {
    const colors = {
      peptide: { bg: '#dcfce7', text: '#166534', dot: '🟢' },
      weight_loss: { bg: '#dbeafe', text: '#1e40af', dot: '🔵' },
      hrt: { bg: '#f3e8ff', text: '#7c3aed', dot: '🟣' },
      therapy: { bg: '#ffedd5', text: '#c2410c', dot: '🟠' },
      iv: { bg: '#e0f2fe', text: '#0369a1', dot: '💧' },
      hbot: { bg: '#fce7f3', text: '#be185d', dot: '🫁' },
      rlt: { bg: '#fee2e2', text: '#dc2626', dot: '🔴' },
      injection: { bg: '#fef3c7', text: '#92400e', dot: '💉' }
    };
    return colors[category] || { bg: '#f3f4f6', text: '#374151', dot: '⚪' };
  }

  function getDeliveryBadge(method) {
    if (method === 'take_home' || method === 'at_home') {
      return { label: 'Take Home', bg: '#dbeafe', text: '#1e40af' };
    }
    return { label: 'In Clinic', bg: '#dcfce7', text: '#166534' };
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
            <div style={{...styles.statNumber, color: '#3b82f6'}}>{stats.pending || 0}</div>
            <div style={styles.statLabel}>New / Pending</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#ef4444'}}>{stats.endingSoon || 0}</div>
            <div style={styles.statLabel}>Ending Soon</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#22c55e'}}>{stats.activeProtocols || 0}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>

        <div style={styles.pipeline}>
          {/* Column 1: New / Pending */}
          <div style={styles.column}>
            <div style={{...styles.columnHeader, background: '#eff6ff'}}>
              <h2 style={styles.columnTitle}>New / Pending</h2>
              <span style={styles.columnSubtitle}>Started in last 7 days</span>
              <span style={{...styles.columnCount, background: '#3b82f6'}}>{pending.length}</span>
            </div>
            <div style={styles.columnContent}>
              {pending.length === 0 ? (
                <div style={styles.emptyColumn}>No new protocols</div>
              ) : (
                pending.map(protocol => {
                  const colors = getCategoryColor(protocol.category);
                  const delivery = getDeliveryBadge(protocol.delivery_method);
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
                      <div style={styles.cardMeta}>
                        Started {formatDate(protocol.start_date)}
                      </div>
                      <div style={styles.cardBadges}>
                        <span style={{
                          ...styles.badge,
                          background: delivery.bg,
                          color: delivery.text
                        }}>
                          {delivery.label}
                        </span>
                      </div>
                    </Link>
                  );
                })
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
                  const daysLeft = protocol.days_remaining;
                  const sessionsLeft = protocol.sessions_remaining;
                  return (
                    <Link
                      href={`/patients/${protocol.patient_id}`}
                      key={protocol.id}
                      style={{...styles.card, borderLeft: `4px solid ${colors.text}`}}
                    >
                      <div style={styles.cardHeader}>
                        <span style={styles.cardName}>{protocol.patient_name}</span>
                        {daysLeft !== null && daysLeft !== undefined ? (
                          <span style={{
                            ...styles.daysLeft,
                            background: daysLeft <= 0 ? '#fee2e2' : daysLeft <= 1 ? '#fef3c7' : '#fef9c3',
                            color: daysLeft <= 0 ? '#dc2626' : '#92400e'
                          }}>
                            {daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                          </span>
                        ) : sessionsLeft !== null && sessionsLeft !== undefined ? (
                          <span style={{
                            ...styles.daysLeft,
                            background: sessionsLeft <= 0 ? '#fee2e2' : '#fef3c7',
                            color: sessionsLeft <= 0 ? '#dc2626' : '#92400e'
                          }}>
                            {sessionsLeft <= 0 ? 'Complete' : `${sessionsLeft} left`}
                          </span>
                        ) : null}
                      </div>
                      <div style={styles.cardProtocol}>
                        {colors.dot} {protocol.protocol_name}
                      </div>
                      {protocol.end_date && (
                        <div style={styles.cardMeta}>
                          Ends {formatDate(protocol.end_date)}
                        </div>
                      )}
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
                  const daysLeft = protocol.days_remaining;
                  const delivery = getDeliveryBadge(protocol.delivery_method);
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
                      {daysLeft !== null && daysLeft !== undefined && (
                        <div style={styles.cardMeta}>
                          {daysLeft} days remaining
                        </div>
                      )}
                      {protocol.total_sessions > 0 && (
                        <div style={styles.cardMeta}>
                          {protocol.sessions_used || 0}/{protocol.total_sessions} sessions
                        </div>
                      )}
                      <div style={styles.cardBadges}>
                        <span style={{
                          ...styles.badge,
                          background: delivery.bg,
                          color: delivery.text
                        }}>
                          {delivery.label}
                        </span>
                      </div>
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
  cardBadges: {
    marginTop: '8px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500'
  },
  daysLeft: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  }
};
