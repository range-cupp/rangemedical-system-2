// /pages/admin/dashboard.js
// Staff Dashboard - At-Risk Patients
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load dashboard');
      }
      
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const atRisk = data?.at_risk || [];
  const stats = data?.stats || {};

  return (
    <>
      <Head><title>Staff Dashboard | Range Medical</title></Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Staff Dashboard</h1>
            <p style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={fetchDashboard} style={styles.refreshButton}>↻ Refresh</button>
            <Link href="/admin" style={styles.navLink}>Admin →</Link>
          </div>
        </header>

        <main style={styles.main}>
          {/* Error State */}
          {error && (
            <div style={styles.errorBox}>
              <strong>Error:</strong> {error}
              <button onClick={fetchDashboard} style={styles.retryButton}>Retry</button>
            </div>
          )}

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.active_patients || 0}</div>
              <div style={styles.statLabel}>Active Patients</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statValue, 
                color: (stats.avg_accountability || 0) >= 80 ? '#16a34a' : 
                       (stats.avg_accountability || 0) >= 60 ? '#f59e0b' : '#dc2626' 
              }}>
                {stats.avg_accountability || 0}%
              </div>
              <div style={styles.statLabel}>Avg Accountability</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.check_ins_this_week || 0}</div>
              <div style={styles.statLabel}>Check-ins This Week</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: atRisk.length > 0 ? '#dc2626' : '#16a34a' }}>
                {atRisk.length}
              </div>
              <div style={styles.statLabel}>Need Attention</div>
            </div>
          </div>

          {/* At Risk Section */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>⚠️ Needs Attention ({atRisk.length})</h2>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Loading...</div>
            ) : atRisk.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>✓</span>
                All patients are on track!
              </div>
            ) : (
              <div style={styles.alertList}>
                {atRisk.map((patient, i) => (
                  <div key={i} style={styles.alertCard}>
                    <div style={styles.alertHeader}>
                      <div>
                        <Link 
                          href={`/admin/patient/${patient.ghl_contact_id || patient.id}`} 
                          style={styles.alertName}
                        >
                          {patient.name}
                        </Link>
                        <div style={styles.alertReason}>{patient.risk_reason}</div>
                      </div>
                      <div style={styles.alertScore}>
                        <div style={styles.alertScoreValue}>{patient.accountability_score}%</div>
                        <div style={styles.alertScoreLabel}>
                          {patient.completed}/{patient.expected}
                        </div>
                      </div>
                    </div>
                    <div style={styles.alertActions}>
                      {patient.phone && (
                        <>
                          <a href={`sms:${patient.phone}`} style={styles.alertAction}>💬 Text</a>
                          <a href={`tel:${patient.phone}`} style={styles.alertAction}>📞 Call</a>
                        </>
                      )}
                      <Link 
                        href={`/admin/patient/${patient.ghl_contact_id || patient.id}`}
                        style={styles.alertActionBtn}
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

const styles = {
  container: { 
    minHeight: '100vh', 
    background: '#f5f5f5', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
  },
  
  loginContainer: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#f5f5f5' 
  },
  loginBox: { 
    background: '#fff', 
    padding: '40px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
    width: '100%', 
    maxWidth: '400px', 
    textAlign: 'center' 
  },
  loginTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 24px' },
  loginInput: { 
    width: '100%', 
    padding: '12px 16px', 
    fontSize: '16px', 
    border: '1px solid #e5e5e5', 
    borderRadius: '8px', 
    marginBottom: '16px', 
    boxSizing: 'border-box' 
  },
  loginButton: { 
    width: '100%', 
    padding: '14px', 
    background: '#000', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer' 
  },
  
  header: { 
    background: '#000', 
    color: '#fff', 
    padding: '20px 32px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: '22px', fontWeight: '700', margin: 0 },
  headerDate: { fontSize: '14px', opacity: 0.7, margin: '4px 0 0' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  refreshButton: { 
    padding: '8px 16px', 
    background: 'rgba(255,255,255,0.1)', 
    color: '#fff', 
    border: '1px solid rgba(255,255,255,0.2)', 
    borderRadius: '6px', 
    fontSize: '14px', 
    cursor: 'pointer' 
  },
  navLink: { color: '#fff', textDecoration: 'none', fontSize: '14px' },
  
  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  retryButton: {
    padding: '8px 16px',
    background: '#991b1b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  
  statsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '16px', 
    marginBottom: '24px' 
  },
  statCard: { 
    background: '#fff', 
    padding: '20px', 
    borderRadius: '12px', 
    textAlign: 'center', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
  },
  statValue: { fontSize: '32px', fontWeight: '700', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#666' },
  
  section: { 
    background: '#fff', 
    borderRadius: '12px', 
    marginBottom: '24px', 
    overflow: 'hidden', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
  },
  sectionHeader: { padding: '20px 24px', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', margin: 0 },
  
  emptyState: { padding: '40px', textAlign: 'center', color: '#666' },
  
  alertList: { padding: '16px' },
  alertCard: { 
    padding: '20px', 
    background: '#fafafa', 
    borderRadius: '10px', 
    marginBottom: '12px', 
    border: '1px solid #f0f0f0' 
  },
  alertHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: '12px' 
  },
  alertName: { 
    fontSize: '16px', 
    fontWeight: '600', 
    color: '#000', 
    textDecoration: 'none' 
  },
  alertReason: { fontSize: '13px', color: '#dc2626', fontWeight: '500', marginTop: '4px' },
  alertScore: { textAlign: 'right' },
  alertScoreValue: { fontSize: '24px', fontWeight: '700' },
  alertScoreLabel: { fontSize: '11px', color: '#666' },
  alertActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  alertAction: { 
    padding: '8px 16px', 
    background: '#fff', 
    border: '1px solid #e5e5e5', 
    borderRadius: '6px', 
    fontSize: '13px', 
    color: '#333', 
    textDecoration: 'none', 
    fontWeight: '500' 
  },
  alertActionBtn: { 
    padding: '8px 16px', 
    background: '#000', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '6px', 
    fontSize: '13px', 
    fontWeight: '500', 
    cursor: 'pointer',
    textDecoration: 'none'
  }
};
