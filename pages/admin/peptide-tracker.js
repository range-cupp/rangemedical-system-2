import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { sharedStyles } from '../../components/AdminLayout';

export default function PeptideTracker() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState([]);
  const [lapsed, setLapsed] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('ending-soon');
  const [search, setSearch] = useState('');
  const [lapsedFilter, setLapsedFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/peptide-tracker');
      const data = await res.json();
      setActive(data.active || []);
      setLapsed(data.lapsed || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to load peptide tracker:', err);
    }
    setLoading(false);
  }

  function getUrgencyStyle(daysRemaining) {
    if (daysRemaining <= 0) return { background: '#fef2f2', color: '#991b1b', fontWeight: '600' };
    if (daysRemaining <= 3) return { background: '#fff7ed', color: '#9a3412', fontWeight: '600' };
    if (daysRemaining <= 7) return { background: '#fefce8', color: '#854d0e' };
    return { background: '#f0fdf4', color: '#166534' };
  }

  function getLapsedUrgencyStyle(daysSince) {
    if (daysSince <= 7) return { background: '#fef2f2', color: '#991b1b', fontWeight: '600' };
    if (daysSince <= 14) return { background: '#fff7ed', color: '#9a3412', fontWeight: '600' };
    if (daysSince <= 30) return { background: '#fefce8', color: '#854d0e' };
    return { background: '#f5f5f5', color: '#666' };
  }

  function getDurationLabel(days) {
    if (days <= 12) return '10-day';
    if (days <= 22) return '20-day';
    if (days <= 35) return '30-day';
    return `${days}d`;
  }

  // Deduplicate active by patient — show the soonest-ending protocol per patient
  function deduplicateByPatient(protocols) {
    const byPatient = {};
    protocols.forEach(p => {
      const key = p.patient_id;
      if (!byPatient[key] || p.days_remaining < byPatient[key].days_remaining) {
        byPatient[key] = { ...p };
      }
      // Track how many active protocols this patient has
      byPatient[key].activeCount = (byPatient[key].activeCount || 0) + 1;
    });
    return Object.values(byPatient);
  }

  const filteredActive = deduplicateByPatient(active)
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (p.patient_name || '').toLowerCase().includes(s) ||
             (p.medication || '').toLowerCase().includes(s);
    });

  const filteredLapsed = lapsed
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (p.patient_name || '').toLowerCase().includes(s) ||
             (p.medication || '').toLowerCase().includes(s);
    })
    .filter(p => {
      if (lapsedFilter === 'all') return true;
      if (lapsedFilter === '7') return p.days_since_ended <= 7;
      if (lapsedFilter === '14') return p.days_since_ended <= 14;
      if (lapsedFilter === '30') return p.days_since_ended <= 30;
      if (lapsedFilter === 'repeat') return p.total_protocols > 1;
      return true;
    });

  return (
    <AdminLayout title="Peptide Tracker">
      <div style={sharedStyles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={sharedStyles.pageTitle}>Peptide Tracker</h1>
            <p style={sharedStyles.pageSubtitle}>Follow-up cadence for active and recently completed peptide patients</p>
          </div>
          <button onClick={loadData} style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={sharedStyles.loading}>Loading pipeline data...</div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#000' }}>{stats.totalActive || 0}</div>
              <div style={sharedStyles.statLabel}>Active Protocols</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#dc2626' }}>{stats.endingThisWeek || 0}</div>
              <div style={sharedStyles.statLabel}>Ending This Week</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#ea580c' }}>{stats.endingNextWeek || 0}</div>
              <div style={sharedStyles.statLabel}>Ending Next Week</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#854d0e' }}>{stats.totalLapsed || 0}</div>
              <div style={sharedStyles.statLabel}>Need Follow-Up</div>
            </div>
            <div style={sharedStyles.statCard}>
              <div style={{ ...sharedStyles.statValue, color: '#991b1b' }}>{stats.lapsedUnder14 || 0}</div>
              <div style={sharedStyles.statLabel}>Lapsed {'<'} 14 Days</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
            {[
              { key: 'ending-soon', label: `Ending Soon (${filteredActive.length})` },
              { key: 'follow-up', label: `Follow Up (${filteredLapsed.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: tab === t.key ? '600' : '400',
                  color: tab === t.key ? '#000' : '#666',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #000' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search + Filter Bar */}
          <div style={sharedStyles.filterBar}>
            <input
              type="text"
              placeholder="Search by name or medication..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={sharedStyles.searchInput}
            />
            {tab === 'follow-up' && (
              <select
                value={lapsedFilter}
                onChange={e => setLapsedFilter(e.target.value)}
                style={sharedStyles.select}
              >
                <option value="all">All Lapsed</option>
                <option value="7">Ended within 7 days</option>
                <option value="14">Ended within 14 days</option>
                <option value="30">Ended within 30 days</option>
                <option value="repeat">Repeat buyers only</option>
              </select>
            )}
          </div>

          {/* Active / Ending Soon Tab */}
          {tab === 'ending-soon' && (
            <div style={sharedStyles.card}>
              <div style={sharedStyles.cardHeader}>
                <h3 style={sharedStyles.cardTitle}>Active Peptide Protocols</h3>
              </div>
              {filteredActive.length === 0 ? (
                <div style={sharedStyles.emptyState}>
                  <div style={sharedStyles.emptyText}>No active peptide protocols found</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={sharedStyles.table}>
                    <thead>
                      <tr>
                        <th style={sharedStyles.th}>Patient</th>
                        <th style={sharedStyles.th}>Medication</th>
                        <th style={sharedStyles.th}>Duration</th>
                        <th style={sharedStyles.th}>End Date</th>
                        <th style={sharedStyles.th}>Days Left</th>
                        <th style={sharedStyles.th}>History</th>
                        <th style={sharedStyles.th}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActive.map(p => (
                        <tr
                          key={p.id}
                          style={sharedStyles.trHover}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td style={sharedStyles.td}>
                            <span
                              style={{ fontWeight: '600', cursor: 'pointer', color: '#000' }}
                              onClick={() => router.push(`/admin/patient/${p.patient_id}`)}
                            >
                              {p.patient_name || 'Unknown'}
                            </span>
                            {p.activeCount > 1 && (
                              <span style={{ fontSize: '12px', color: '#666', marginLeft: '6px' }}>
                                ({p.activeCount} active)
                              </span>
                            )}
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{ fontSize: '15px' }}>{p.medication || '—'}</span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              ...sharedStyles.badge,
                              background: '#f5f5f5',
                              color: '#333',
                              fontSize: '12px',
                            }}>
                              {getDurationLabel(p.duration_days)}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            {p.end_date ? new Date(p.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              ...sharedStyles.badge,
                              ...getUrgencyStyle(p.days_remaining),
                              fontSize: '13px',
                            }}>
                              {p.days_remaining <= 0 ? 'TODAY' : p.days_remaining === 1 ? '1 day' : `${p.days_remaining} days`}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{ fontSize: '14px', color: p.total_protocols > 1 ? '#166534' : '#666' }}>
                              {p.total_protocols === 1 ? '1st protocol' : `${p.total_protocols} protocols`}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {p.patient_phone && (
                                <a
                                  href={`sms:${p.patient_phone}`}
                                  style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                                  title={p.patient_phone}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Text
                                </a>
                              )}
                              {p.patient_phone && p.patient_email && <span style={{ color: '#ccc' }}>|</span>}
                              {p.patient_email && (
                                <a
                                  href={`mailto:${p.patient_email}`}
                                  style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                                  title={p.patient_email}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Email
                                </a>
                              )}
                              {!p.patient_phone && !p.patient_email && (
                                <span style={{ fontSize: '13px', color: '#999' }}>No contact</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Lapsed / Follow Up Tab */}
          {tab === 'follow-up' && (
            <div style={sharedStyles.card}>
              <div style={sharedStyles.cardHeader}>
                <h3 style={sharedStyles.cardTitle}>Recently Completed — No Active Protocol</h3>
              </div>
              {filteredLapsed.length === 0 ? (
                <div style={sharedStyles.emptyState}>
                  <div style={sharedStyles.emptyText}>No lapsed patients matching filter</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={sharedStyles.table}>
                    <thead>
                      <tr>
                        <th style={sharedStyles.th}>Patient</th>
                        <th style={sharedStyles.th}>Last Medication</th>
                        <th style={sharedStyles.th}>Last Duration</th>
                        <th style={sharedStyles.th}>Ended</th>
                        <th style={sharedStyles.th}>Days Since</th>
                        <th style={sharedStyles.th}>History</th>
                        <th style={sharedStyles.th}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLapsed.map(p => (
                        <tr
                          key={p.id}
                          style={sharedStyles.trHover}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td style={sharedStyles.td}>
                            <span
                              style={{ fontWeight: '600', cursor: 'pointer', color: '#000' }}
                              onClick={() => router.push(`/admin/patient/${p.patient_id}`)}
                            >
                              {p.patient_name || 'Unknown'}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{ fontSize: '15px' }}>{p.medication || '—'}</span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              ...sharedStyles.badge,
                              background: '#f5f5f5',
                              color: '#333',
                              fontSize: '12px',
                            }}>
                              {getDurationLabel(p.duration_days)}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            {p.end_date ? new Date(p.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{
                              ...sharedStyles.badge,
                              ...getLapsedUrgencyStyle(p.days_since_ended),
                              fontSize: '13px',
                            }}>
                              {p.days_since_ended} {p.days_since_ended === 1 ? 'day' : 'days'} ago
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <span style={{ fontSize: '14px', color: p.total_protocols > 1 ? '#166534' : '#666' }}>
                              {p.total_protocols === 1 ? '1st protocol' : `${p.total_protocols} protocols`}
                            </span>
                          </td>
                          <td style={sharedStyles.td}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {p.patient_phone && (
                                <a
                                  href={`sms:${p.patient_phone}`}
                                  style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                                  title={p.patient_phone}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Text
                                </a>
                              )}
                              {p.patient_phone && p.patient_email && <span style={{ color: '#ccc' }}>|</span>}
                              {p.patient_email && (
                                <a
                                  href={`mailto:${p.patient_email}`}
                                  style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}
                                  title={p.patient_email}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Email
                                </a>
                              )}
                              {!p.patient_phone && !p.patient_email && (
                                <span style={{ fontSize: '13px', color: '#999' }}>No contact</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
