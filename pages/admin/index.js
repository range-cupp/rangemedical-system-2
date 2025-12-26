// /pages/admin/index.js
// Dashboard - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../components/AdminNav';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentProtocols, setRecentProtocols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Fetch protocols for stats
      const protocolsRes = await fetch('/api/admin/protocols');
      const protocolsData = await protocolsRes.json();
      const protocols = protocolsData.protocols || protocolsData || [];

      // Fetch purchases
      const purchasesRes = await fetch('/api/admin/purchases');
      const purchasesData = await purchasesRes.json();
      const purchases = purchasesData.purchases || purchasesData || [];

      // Calculate stats
      const activeProtocols = protocols.filter(p => p.status === 'active');
      const completedProtocols = protocols.filter(p => p.status === 'completed');
      const unassignedPurchases = purchases.filter(p => !p.protocol_id);

      setStats({
        totalProtocols: protocols.length,
        activeProtocols: activeProtocols.length,
        completedProtocols: completedProtocols.length,
        totalPurchases: purchases.length,
        unassignedPurchases: unassignedPurchases.length,
        uniquePatients: new Set(protocols.map(p => p.patient_name)).size
      });

      // Recent active protocols
      setRecentProtocols(activeProtocols.slice(0, 10));

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <AdminNav title="Dashboard" />

        <main style={styles.main}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats?.activeProtocols || 0}</div>
                  <div style={styles.statLabel}>Active Protocols</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats?.completedProtocols || 0}</div>
                  <div style={styles.statLabel}>Completed</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: stats?.unassignedPurchases > 0 ? '#dc2626' : '#000' }}>
                    {stats?.unassignedPurchases || 0}
                  </div>
                  <div style={styles.statLabel}>Unassigned Purchases</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats?.uniquePatients || 0}</div>
                  <div style={styles.statLabel}>Unique Patients</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.actionsGrid}>
                  <Link href="/admin/purchases" style={styles.actionCard}>
                    <span style={styles.actionIcon}>📦</span>
                    <span style={styles.actionText}>Manage Purchases</span>
                    {stats?.unassignedPurchases > 0 && (
                      <span style={styles.actionBadge}>{stats.unassignedPurchases} unassigned</span>
                    )}
                  </Link>
                  <Link href="/admin/protocols" style={styles.actionCard}>
                    <span style={styles.actionIcon}>📋</span>
                    <span style={styles.actionText}>View Protocols</span>
                  </Link>
                  <Link href="/admin/patients" style={styles.actionCard}>
                    <span style={styles.actionIcon}>👥</span>
                    <span style={styles.actionText}>Patient List</span>
                  </Link>
                </div>
              </div>

              {/* Recent Active Protocols */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Active Protocols</h2>
                  <Link href="/admin/protocols" style={styles.viewAllLink}>View all →</Link>
                </div>
                <div style={styles.tableCard}>
                  {recentProtocols.length === 0 ? (
                    <div style={styles.empty}>No active protocols</div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Patient</th>
                          <th style={styles.th}>Program</th>
                          <th style={styles.th}>Progress</th>
                          <th style={styles.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProtocols.map(p => {
                          const total = p.total_sessions || p.duration_days || 10;
                          const current = calculateCurrentDay(p.start_date);
                          const progress = Math.min(100, Math.round((current / total) * 100));
                          
                          return (
                            <tr key={p.id} style={styles.tr}>
                              <td style={styles.td}>
                                <div style={styles.patientName}>{p.patient_name}</div>
                              </td>
                              <td style={styles.td}>{p.program_name || p.program_type}</td>
                              <td style={styles.td}>
                                <div style={styles.progressContainer}>
                                  <div style={styles.progressBar}>
                                    <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                                  </div>
                                  <span style={styles.progressText}>Day {current}/{total}</span>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <Link href={`/admin/protocols/${p.id}`} style={styles.viewBtn}>
                                  View
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

function calculateCurrentDay(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },
  
  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666'
  },
  
  // Sections
  section: {
    marginBottom: '32px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  viewAllLink: {
    fontSize: '13px',
    color: '#666',
    textDecoration: 'none'
  },
  
  // Actions
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    background: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#000',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  actionText: {
    fontSize: '14px',
    fontWeight: '500'
  },
  actionBadge: {
    marginTop: '8px',
    padding: '4px 10px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500'
  },
  
  // Table
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px'
  },
  patientName: {
    fontWeight: '500'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  progressBar: {
    width: '100px',
    height: '6px',
    background: '#e5e5e5',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: '3px'
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap'
  },
  viewBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textDecoration: 'none'
  }
};
