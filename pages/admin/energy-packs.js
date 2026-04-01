// Energy & Recovery Pack — admin report page
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const formatPrice = (cents) => {
  if (!cents && cents !== 0) return '$0';
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function EnergyPacksReport() {
  const [report, setReport] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);

  useEffect(() => {
    fetchReport();
    fetchConfig();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/energy-packs/report');
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/energy-packs/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const toggleEnabled = async () => {
    if (!config) return;
    try {
      const res = await fetch('/api/energy-packs/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !config.enabled }),
      });
      const data = await res.json();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  };

  const getPatientName = (pack) => {
    const p = pack.patients;
    if (p?.first_name && p?.last_name) return `${p.first_name} ${p.last_name}`;
    if (p?.first_name) return p.first_name;
    return 'Unknown';
  };

  const getEffectiveBonus = (pack) => {
    if (new Date(pack.bonus_expires_at) < new Date()) return 0;
    return pack.remaining_bonus_cents;
  };

  const packRedemptions = selectedPack
    ? (report?.redemptions || []).filter(r => r.pack_id === selectedPack.id)
    : [];

  if (loading) {
    return (
      <AdminLayout title="Energy & Recovery Packs">
        <div style={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Energy & Recovery Packs">
      {/* Campaign controls */}
      {config && (
        <div style={styles.controlBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Campaign Status</span>
            <button onClick={toggleEnabled} style={{
              ...styles.toggleBtn,
              background: config.enabled ? '#dcfce7' : '#fee2e2',
              color: config.enabled ? '#166534' : '#991b1b',
            }}>
              {config.enabled ? 'Active' : 'Paused'}
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {config.packs_sold} of {config.max_packs} sold ({config.packs_remaining} remaining)
          </div>
        </div>
      )}

      {/* Summary stats */}
      {report?.totals && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Packs Sold</div>
            <div style={styles.statValue}>{report.totals.count}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Cash Collected</div>
            <div style={styles.statValue}>{formatPrice(report.totals.cash_collected)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Redeemed</div>
            <div style={styles.statValue}>{formatPrice(report.totals.total_redeemed)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Remaining Liability</div>
            <div style={styles.statValue}>{formatPrice(report.totals.remaining_liability)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Base Remaining</div>
            <div style={styles.statValue}>{formatPrice(report.totals.remaining_base)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Bonus Remaining</div>
            <div style={styles.statValue}>{formatPrice(report.totals.remaining_bonus)}</div>
          </div>
        </div>
      )}

      {/* Packs table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>All Packs</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Purchased</th>
              <th style={styles.th}>Paid</th>
              <th style={styles.th}>Remaining</th>
              <th style={styles.th}>Bonus Expires</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(report?.packs || []).map(pack => {
              const effectiveBonus = getEffectiveBonus(pack);
              const effectiveTotal = pack.remaining_base_cents + effectiveBonus;
              const bonusExpired = new Date(pack.bonus_expires_at) < new Date();
              return (
                <tr
                  key={pack.id}
                  style={{ ...styles.tr, cursor: 'pointer', background: selectedPack?.id === pack.id ? '#f0f9ff' : 'transparent' }}
                  onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{getPatientName(pack)}</div>
                    {pack.family_member_name && (
                      <div style={{ fontSize: '12px', color: '#666' }}>+ {pack.family_member_name}</div>
                    )}
                  </td>
                  <td style={styles.td}>{formatDate(pack.purchased_at)}</td>
                  <td style={styles.td}>{formatPrice(pack.amount_paid_cents)}</td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 600 }}>{formatPrice(effectiveTotal)}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}> / {formatPrice(pack.total_value_cents)}</span>
                  </td>
                  <td style={styles.td}>
                    {bonusExpired ? (
                      <span style={{ color: '#999', fontSize: '12px' }}>Expired</span>
                    ) : effectiveBonus > 0 ? (
                      <span>{formatDate(pack.bonus_expires_at)}</span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Used</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: pack.status === 'active' ? '#dcfce7' : pack.status === 'exhausted' ? '#f0f0f0' : '#fee2e2',
                      color: pack.status === 'active' ? '#166534' : pack.status === 'exhausted' ? '#666' : '#991b1b',
                    }}>
                      {pack.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!report?.packs || report.packs.length === 0) && (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>No packs sold yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Redemption detail for selected pack */}
      {selectedPack && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            Redemptions — {getPatientName(selectedPack)}
          </div>
          {packRedemptions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
              No redemptions yet
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Service</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Bonus Used</th>
                  <th style={styles.th}>Base Used</th>
                  <th style={styles.th}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {packRedemptions.map(r => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{formatDateTime(r.created_at)}</td>
                    <td style={styles.td}>{r.service_name || r.service_type}</td>
                    <td style={styles.td}>{formatPrice(r.amount_cents)}</td>
                    <td style={styles.td}>{r.bonus_used_cents > 0 ? formatPrice(r.bonus_used_cents) : '-'}</td>
                    <td style={styles.td}>{r.base_used_cents > 0 ? formatPrice(r.base_used_cents) : '-'}</td>
                    <td style={styles.td}>{formatPrice(r.remaining_after_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
  },
  controlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '16px 20px',
    marginBottom: '16px',
  },
  toggleBtn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 0,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    background: '#fff',
    padding: '16px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#000',
  },
  section: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    marginBottom: '16px',
  },
  sectionHeader: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 16px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '10px 16px', fontSize: '14px' },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};
