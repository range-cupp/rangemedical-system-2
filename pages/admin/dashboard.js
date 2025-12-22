// /pages/admin/dashboard.js
// Staff Dashboard - Protocol Management
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard-v2');
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resolveAlert = async (alertId) => {
    await fetch('/api/admin/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alertId, status: 'resolved' })
    });
    fetchData();
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  const { stats, alerts, protocols_ending, refills_due, labs_due, weekly_checkins } = data || {};

  return (
    <>
      <Head><title>Dashboard | Range Medical</title></Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Staff Dashboard</h1>
            <p style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={fetchData} style={styles.refreshBtn}>↻ Refresh</button>
            <Link href="/admin/protocols/new" style={styles.newBtn}>+ New Protocol</Link>
          </div>
        </header>

        <main style={styles.main}>
          {/* Stats */}
          <div style={styles.statsRow}>
            <StatCard label="Active Protocols" value={stats?.active_protocols || 0} />
            <StatCard label="Ending This Week" value={stats?.ending_this_week || 0} color={stats?.ending_this_week > 0 ? '#f59e0b' : null} />
            <StatCard label="Refills Due" value={stats?.refills_due || 0} color={stats?.refills_due > 0 ? '#ef4444' : null} />
            <StatCard label="Labs Due" value={stats?.labs_due || 0} color={stats?.labs_due > 0 ? '#3b82f6' : null} />
          </div>

          {/* Alerts */}
          {alerts?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>⚠️ Needs Attention ({alerts.length})</h2>
              <div style={styles.alertList}>
                {alerts.map(a => (
                  <AlertCard key={a.id} alert={a} onResolve={() => resolveAlert(a.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Protocols Ending Soon */}
          {protocols_ending?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📅 Protocols Ending Soon</h2>
              <div style={styles.cardList}>
                {protocols_ending.map(p => (
                  <ProtocolCard key={p.id} protocol={p} highlight="end_date" />
                ))}
              </div>
            </section>
          )}

          {/* Refills Due */}
          {refills_due?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>💊 Refills Due</h2>
              <div style={styles.cardList}>
                {refills_due.map(p => (
                  <ProtocolCard key={p.id} protocol={p} highlight="supply" />
                ))}
              </div>
            </section>
          )}

          {/* Labs Due */}
          {labs_due?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🔬 Labs Due</h2>
              <div style={styles.cardList}>
                {labs_due.map(p => (
                  <ProtocolCard key={p.id} protocol={p} highlight="labs" />
                ))}
              </div>
            </section>
          )}

          {/* Weekly Check-ins Due */}
          {weekly_checkins?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📞 Weekly Check-ins Due</h2>
              <div style={styles.cardList}>
                {weekly_checkins.map(p => (
                  <ProtocolCard key={p.id} protocol={p} highlight="checkin" />
                ))}
              </div>
            </section>
          )}

          {/* All Good */}
          {!alerts?.length && !protocols_ending?.length && !refills_due?.length && !labs_due?.length && (
            <div style={styles.allGood}>
              <span style={{ fontSize: '48px' }}>✓</span>
              <h2>All caught up!</h2>
              <p>No urgent items need attention</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: color || '#000' }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function AlertCard({ alert, onResolve }) {
  const priorityColors = {
    high: '#fee2e2',
    medium: '#fef3c7',
    low: '#f0f9ff'
  };

  return (
    <div style={{ ...styles.alertCard, background: priorityColors[alert.priority] || '#fff' }}>
      <div style={styles.alertContent}>
        <div style={styles.alertTitle}>{alert.title}</div>
        <div style={styles.alertMessage}>{alert.message}</div>
        {alert.patient_phone && (
          <div style={styles.alertActions}>
            <a href={`sms:${alert.patient_phone}`} style={styles.alertAction}>💬 Text</a>
            <a href={`tel:${alert.patient_phone}`} style={styles.alertAction}>📞 Call</a>
          </div>
        )}
      </div>
      <button onClick={onResolve} style={styles.resolveBtn}>✓</button>
    </div>
  );
}

function ProtocolCard({ protocol, highlight }) {
  return (
    <div style={styles.protocolCard}>
      <div style={styles.protocolInfo}>
        <Link href={`/admin/patient/${protocol.ghl_contact_id || protocol.patient_id}`} style={styles.protocolName}>
          {protocol.patient_name}
        </Link>
        <div style={styles.protocolType}>{protocol.protocol_name}</div>
        {highlight === 'end_date' && (
          <div style={styles.protocolHighlight}>Ends {formatDate(protocol.end_date)}</div>
        )}
        {highlight === 'supply' && (
          <div style={styles.protocolHighlight}>
            {protocol.supply_remaining} {protocol.supply_type === 'vial' ? 'ml' : 'injections'} remaining
          </div>
        )}
        {highlight === 'labs' && (
          <div style={styles.protocolHighlight}>
            {protocol.baseline_labs_completed ? 'Follow-up' : 'Baseline'} labs due
          </div>
        )}
        {highlight === 'checkin' && (
          <div style={styles.protocolHighlight}>Weekly check-in due</div>
        )}
      </div>
      <div style={styles.protocolActions}>
        {protocol.patient_phone && (
          <>
            <a href={`sms:${protocol.patient_phone}`} style={styles.smallAction}>💬</a>
            <a href={`tel:${protocol.patient_phone}`} style={styles.smallAction}>📞</a>
          </>
        )}
        <Link href={`/admin/protocols/${protocol.id}`} style={styles.viewLink}>View</Link>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  error: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' },

  header: { background: '#000', color: '#fff', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: '700', margin: 0 },
  date: { fontSize: '14px', opacity: 0.7, margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer' },
  newBtn: { padding: '8px 16px', background: '#fff', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '14px' },

  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  statValue: { fontSize: '32px', fontWeight: '700' },
  statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },

  section: { background: '#fff', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', margin: 0, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' },

  alertList: { padding: '12px' },
  alertCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '8px', marginBottom: '8px' },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: '15px', fontWeight: '600' },
  alertMessage: { fontSize: '13px', color: '#666', marginTop: '4px' },
  alertActions: { display: 'flex', gap: '12px', marginTop: '8px' },
  alertAction: { fontSize: '13px', color: '#333', textDecoration: 'none' },
  resolveBtn: { width: '36px', height: '36px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' },

  cardList: { padding: '12px' },
  protocolCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px' },
  protocolInfo: { flex: 1 },
  protocolName: { fontSize: '15px', fontWeight: '600', color: '#000', textDecoration: 'none' },
  protocolType: { fontSize: '13px', color: '#666', marginTop: '2px' },
  protocolHighlight: { fontSize: '12px', color: '#dc2626', fontWeight: '500', marginTop: '4px' },
  protocolActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  smallAction: { fontSize: '16px', textDecoration: 'none' },
  viewLink: { padding: '6px 12px', background: '#000', color: '#fff', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' },

  allGood: { textAlign: 'center', padding: '60px 24px', color: '#666' }
};
