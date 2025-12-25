// /pages/admin/index.js
// Dashboard - Overview
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentProtocols, setRecentProtocols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch dashboard stats
      const [statsRes, protocolsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/protocols?limit=5&status=active')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (protocolsRes.ok) {
        const data = await protocolsRes.json();
        setRecentProtocols(data.protocols || data || []);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDay = (startDate, totalDays) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(diff, totalDays);
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div style={s.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageSubtitle}>Overview of Range Medical</p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats?.active_protocols || 0}</div>
          <div style={s.statLabel}>Active Protocols</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats?.total_patients || 0}</div>
          <div style={s.statLabel}>Total Patients</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats?.unassigned_purchases || 0}</div>
          <div style={s.statLabel}>Unassigned Purchases</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats?.completed_this_week || 0}</div>
          <div style={s.statLabel}>Completed This Week</div>
        </div>
      </div>

      {/* Active Protocols */}
      <div style={{ ...s.card, marginTop: '24px' }}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Active Protocols</h2>
          <Link href="/admin/protocols" style={{ ...s.btnSecondary, ...s.btnSmall }}>
            View All →
          </Link>
        </div>
        
        {recentProtocols.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💉</div>
            <div style={s.emptyText}>No active protocols</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Patient</th>
                <th style={s.th}>Protocol</th>
                <th style={s.th}>Progress</th>
                <th style={s.th}>Status</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {recentProtocols.slice(0, 5).map(protocol => {
                const totalDays = protocol.total_sessions || protocol.duration_days || 10;
                const currentDay = calculateDay(protocol.start_date, totalDays);
                
                return (
                  <tr key={protocol.id} style={s.trHover}>
                    <td style={s.td}>
                      <div style={{ fontWeight: '500' }}>{protocol.patient_name}</div>
                    </td>
                    <td style={s.td}>
                      <div>{protocol.program_name || protocol.program_type}</div>
                      {protocol.primary_peptide && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{protocol.primary_peptide}</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.dayDisplay}>
                        <span style={s.dayNumber}>{currentDay || '—'}</span>
                        <span style={s.dayTotal}>/ {totalDays}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...s.badgeActive }}>Active</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <Link href={`/admin/protocols/${protocol.id}`} style={{ ...s.btnSecondary, ...s.btnSmall }}>
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

      {/* Quick Actions */}
      <div style={{ ...s.card, marginTop: '24px' }}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Quick Actions</h2>
        </div>
        <div style={styles.actionsGrid}>
          <Link href="/admin/purchases" style={styles.actionCard}>
            <span style={styles.actionIcon}>💳</span>
            <span style={styles.actionLabel}>Review Purchases</span>
            {stats?.unassigned_purchases > 0 && (
              <span style={styles.actionBadge}>{stats.unassigned_purchases}</span>
            )}
          </Link>
          <Link href="/admin/protocols" style={styles.actionCard}>
            <span style={styles.actionIcon}>💉</span>
            <span style={styles.actionLabel}>View Protocols</span>
          </Link>
          <Link href="/admin/patients" style={styles.actionCard}>
            <span style={styles.actionIcon}>👥</span>
            <span style={styles.actionLabel}>Find Patient</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '20px'
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#000',
    transition: 'background 0.15s'
  },
  actionIcon: {
    fontSize: '24px'
  },
  actionLabel: {
    fontSize: '14px',
    fontWeight: '500',
    flex: 1
  },
  actionBadge: {
    background: '#ef4444',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  }
};
