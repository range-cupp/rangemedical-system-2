// /pages/admin/medications.js
// Medication Tracking — refill status, dispensing history, take-home protocol oversight
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { sharedStyles } from '../../components/AdminLayout';

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentDispensing, setRecentDispensing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'overdue' | 'due_soon'
  const [search, setSearch] = useState('');
  const [dispensingProtocol, setDispensingProtocol] = useState(null);
  const [logging, setLogging] = useState(false);
  const [logResult, setLogResult] = useState(null);

  useEffect(() => {
    fetchMedications();
  }, [filter]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/medications?filter=${filter}`);
      const data = await res.json();
      setMedications(data.medications || []);
      setStats(data.stats || null);
      setRecentDispensing(data.recentDispensing || []);
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (med) => {
    setLogging(true);
    setLogResult(null);
    const typeMap = { hrt: 'testosterone', hrt_male: 'testosterone', weight_loss: 'weight_loss', peptide: 'peptide' };
    const category = typeMap[med.program_type] || med.program_type;
    try {
      const res = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: med.patient_id,
          patient_name: med.patient_name,
          category,
          entry_type: 'pickup',
          medication: med.medication || null,
          protocol_id: med.id,
        }),
      });
      if (res.status === 409) {
        setLogResult({ success: false, message: 'Already dispensed today' });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log');
      setLogResult({ success: true, message: 'Pickup logged successfully' });
      // Refresh data
      setTimeout(() => { fetchMedications(); setDispensingProtocol(null); setLogResult(null); }, 1500);
    } catch (err) {
      setLogResult({ success: false, message: err.message });
    } finally {
      setLogging(false);
    }
  };

  // Filter by search
  const displayed = search
    ? medications.filter(m =>
        m.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        (m.medication || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.program_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : medications;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
    });
  };

  return (
    <AdminLayout title="Medications">
      {/* Stats Cards */}
      {stats && (
        <div style={s.statsRow}>
          <div style={{ ...s.statCard, borderLeft: '4px solid #ef4444' }}>
            <div style={s.statNumber}>{stats.overdue}</div>
            <div style={s.statLabel}>Overdue</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #f59e0b' }}>
            <div style={s.statNumber}>{stats.dueSoon}</div>
            <div style={s.statLabel}>Due Soon</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e' }}>
            <div style={s.statNumber}>{stats.onTrack}</div>
            <div style={s.statLabel}>On Track</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #6b7280' }}>
            <div style={s.statNumber}>{stats.total}</div>
            <div style={s.statLabel}>Total Active</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={s.toolbar}>
        <div style={s.filterPills}>
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'due_soon', label: 'Due Soon' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                ...s.pill,
                ...(filter === f.key ? s.pillActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search patient or medication..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
      </div>

      {/* Medications Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Loading medications...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          {filter !== 'all' ? 'No medications match this filter' : 'No active take-home medications'}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Status</th>
                <th style={s.th}>Patient</th>
                <th style={s.th}>Medication</th>
                <th style={s.th}>Dosage</th>
                <th style={s.th}>Next Refill</th>
                <th style={s.th}>Last Pickup</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(med => (
                <tr key={med.id} style={s.tr}>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: med.is_overdue ? '#fef2f2' : med.is_due_soon ? '#fffbeb' : '#f0fdf4',
                      color: med.is_overdue ? '#dc2626' : med.is_due_soon ? '#d97706' : '#16a34a',
                      border: med.is_overdue ? '1px solid #fecaca' : med.is_due_soon ? '1px solid #fde68a' : '1px solid #bbf7d0',
                    }}>
                      {med.is_overdue
                        ? `${Math.abs(med.days_until_refill)}d overdue`
                        : med.is_due_soon
                          ? `${med.days_until_refill}d`
                          : med.days_until_refill !== null
                            ? `${med.days_until_refill}d`
                            : 'No date'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <Link href={`/patients/${med.patient_id}`} style={s.patientLink}>
                      {med.patient_name}
                    </Link>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500, color: '#111' }}>{med.medication || med.program_name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{med.program_type?.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ ...s.td, color: '#6b7280', fontSize: '13px' }}>{med.dosage || '—'}</td>
                  <td style={{ ...s.td, fontSize: '13px' }}>
                    {med.next_expected_date ? formatDate(med.next_expected_date) : '—'}
                  </td>
                  <td style={{ ...s.td, fontSize: '13px', color: '#6b7280' }}>
                    {med.last_pickup ? formatDate(med.last_pickup) : 'Never'}
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={() => { setDispensingProtocol(med); setLogResult(null); }}
                      style={s.dispenseBtn}
                    >
                      Dispense
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Dispensing History */}
      {recentDispensing.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>
            Recent Dispensing (Last 30 Days)
          </h3>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Category</th>
                  <th style={s.th}>Medication</th>
                </tr>
              </thead>
              <tbody>
                {recentDispensing.slice(0, 20).map(d => (
                  <tr key={d.id} style={s.tr}>
                    <td style={{ ...s.td, fontSize: '13px' }}>{formatDate(d.entry_date)}</td>
                    <td style={{ ...s.td, fontSize: '13px' }}>{(d.category || '').replace(/_/g, ' ')}</td>
                    <td style={{ ...s.td, fontSize: '13px', color: '#6b7280' }}>{d.medication || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispense Confirmation Modal */}
      {dispensingProtocol && (
        <div style={s.overlay} onClick={() => { setDispensingProtocol(null); setLogResult(null); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Confirm Dispensing</h3>
              <button onClick={() => { setDispensingProtocol(null); setLogResult(null); }} style={s.modalClose}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Patient</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{dispensingProtocol.patient_name}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Medication</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{dispensingProtocol.medication || dispensingProtocol.program_name}</div>
              </div>
              {dispensingProtocol.dosage && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dosage</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{dispensingProtocol.dosage}</div>
                </div>
              )}
              {logResult && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
                  background: logResult.success ? '#f0fdf4' : '#fef2f2',
                  color: logResult.success ? '#16a34a' : '#dc2626',
                }}>
                  {logResult.message}
                </div>
              )}
              <button
                onClick={() => handleDispense(dispensingProtocol)}
                disabled={logging || logResult?.success}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
                  background: logResult?.success ? '#e5e7eb' : '#000', color: logResult?.success ? '#9ca3af' : '#fff',
                  fontSize: '15px', fontWeight: 600, cursor: logging || logResult?.success ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {logging ? 'Logging...' : logResult?.success ? 'Logged' : 'Log Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
  },
  pill: {
    padding: '6px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    background: '#fff',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: 'inherit',
  },
  pillActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000',
  },
  searchInput: {
    padding: '8px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    width: '260px',
    maxWidth: '100%',
    fontFamily: 'inherit',
  },
  tableWrap: {
    background: '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    background: '#fafafa',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  patientLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '14px',
  },
  dispenseBtn: {
    padding: '6px 14px',
    background: '#fff7ed',
    color: '#c2410c',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 4px',
  },
};
