// /pages/admin/medications.js
// Medication Tracking — refill status, dispensing history, take-home protocol oversight
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

// Friendly labels for supply types
const SUPPLY_LABELS = {
  prefilled_1week: '1-Week Prefilled',
  prefilled_2week: '2-Week Prefilled',
  prefilled_4week: '4-Week Prefilled',
  vial_5ml: '5ml Vial',
  vial_10ml: '10ml Vial',
};

function formatIntervalLabel(days) {
  if (!days) return '';
  if (days === 7) return '7 days (weekly)';
  if (days === 14) return '14 days (biweekly)';
  if (days === 28) return '28 days (monthly)';
  if (days === 30) return '30 days (monthly)';
  if (days === 70) return '70 days (~10 weeks)';
  if (days === 140) return '140 days (~20 weeks)';
  return `${days} days`;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentDispensing, setRecentDispensing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Dispense modal state
  const [dispensingProtocol, setDispensingProtocol] = useState(null);
  const [dispenseDate, setDispenseDate] = useState('');
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

  const openDispenseModal = (med) => {
    setDispensingProtocol(med);
    setDispenseDate(new Date().toISOString().split('T')[0]);
    setLogResult(null);
  };

  const handleDispense = async () => {
    if (!dispensingProtocol || !dispenseDate) return;
    setLogging(true);
    setLogResult(null);
    try {
      const res = await fetch('/api/admin/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: dispensingProtocol.id,
          patient_id: dispensingProtocol.patient_id,
          patient_name: dispensingProtocol.patient_name,
          dispense_date: dispenseDate,
        }),
      });
      if (res.status === 409) {
        setLogResult({ success: false, message: 'Already dispensed for this date' });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispense');
      setLogResult({
        success: true,
        message: `Dispensed — next refill ${formatDate(data.next_expected_date)} (+${data.interval_days}d)`,
      });
      setTimeout(() => {
        fetchMedications();
        setDispensingProtocol(null);
        setLogResult(null);
      }, 2000);
    } catch (err) {
      setLogResult({ success: false, message: err.message });
    } finally {
      setLogging(false);
    }
  };

  // Compute the preview next refill date
  const previewNextRefill = () => {
    if (!dispensingProtocol || !dispenseDate) return null;
    const interval = dispensingProtocol.refill_interval_days;
    if (!interval) return null;
    const next = new Date(dispenseDate + 'T12:00:00');
    next.setDate(next.getDate() + interval);
    return next.toISOString().split('T')[0];
  };

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

  const previewDate = previewNextRefill();

  return (
    <AdminLayout title="Medications">
      {/* Stats Cards */}
      {stats && (
        <div style={s.statsRow}>
          <div style={{ ...s.statCard, borderLeft: '4px solid #ef4444', cursor: 'pointer' }} onClick={() => setFilter('overdue')}>
            <div style={s.statNumber}>{stats.overdue}</div>
            <div style={s.statLabel}>Overdue</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #f59e0b', cursor: 'pointer' }} onClick={() => setFilter('due_soon')}>
            <div style={s.statNumber}>{stats.dueSoon}</div>
            <div style={s.statLabel}>Due Soon</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #22c55e', cursor: 'pointer' }} onClick={() => setFilter('all')}>
            <div style={s.statNumber}>{stats.onTrack}</div>
            <div style={s.statLabel}>On Track</div>
          </div>
          <div style={{ ...s.statCard, borderLeft: '4px solid #6b7280', cursor: 'pointer' }} onClick={() => setFilter('all')}>
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
                <th style={s.th}>Refill Cycle</th>
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
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {SUPPLY_LABELS[med.supply_type] || med.program_type?.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td style={{ ...s.td, color: '#6b7280', fontSize: '13px' }}>{med.dosage || '—'}</td>
                  <td style={{ ...s.td, fontSize: '13px', color: '#6b7280' }}>
                    {med.refill_interval_days ? `Every ${med.refill_interval_days}d` : '—'}
                  </td>
                  <td style={{ ...s.td, fontSize: '13px' }}>
                    {med.next_expected_date ? formatDate(med.next_expected_date) : '—'}
                  </td>
                  <td style={{ ...s.td, fontSize: '13px', color: '#6b7280' }}>
                    {med.last_pickup ? formatDate(med.last_pickup) : 'Never'}
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={() => openDispenseModal(med)}
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

      {/* Dispense Modal */}
      {dispensingProtocol && (
        <div style={s.overlay} onClick={() => { setDispensingProtocol(null); setLogResult(null); }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Dispense Medication</h3>
              <button onClick={() => { setDispensingProtocol(null); setLogResult(null); }} style={s.modalClose}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Patient */}
              <div style={s.fieldRow}>
                <div style={s.fieldLabel}>Patient</div>
                <div style={s.fieldValue}>{dispensingProtocol.patient_name}</div>
              </div>

              {/* Medication */}
              <div style={s.fieldRow}>
                <div style={s.fieldLabel}>Medication</div>
                <div style={s.fieldValue}>{dispensingProtocol.medication || dispensingProtocol.program_name}</div>
              </div>

              {/* Dosage */}
              {dispensingProtocol.dosage && (
                <div style={s.fieldRow}>
                  <div style={s.fieldLabel}>Dosage</div>
                  <div style={s.fieldValue}>{dispensingProtocol.dosage}</div>
                </div>
              )}

              {/* Supply Type */}
              {dispensingProtocol.supply_type && (
                <div style={s.fieldRow}>
                  <div style={s.fieldLabel}>Supply Type</div>
                  <div style={s.fieldValue}>{SUPPLY_LABELS[dispensingProtocol.supply_type] || dispensingProtocol.supply_type}</div>
                </div>
              )}

              {/* Refill Cycle */}
              <div style={s.fieldRow}>
                <div style={s.fieldLabel}>Refill Cycle</div>
                <div style={{ ...s.fieldValue, color: '#2563eb', fontWeight: 600 }}>
                  {formatIntervalLabel(dispensingProtocol.refill_interval_days)}
                </div>
              </div>

              {/* Date Picker */}
              <div style={{ ...s.fieldRow, flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={s.fieldLabel}>Dispense Date</div>
                <input
                  type="date"
                  value={dispenseDate}
                  onChange={e => setDispenseDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={s.dateInput}
                />
              </div>

              {/* Preview: Next Refill */}
              {previewDate && (
                <div style={s.previewBox}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Next refill will be set to:</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>
                    {formatDate(previewDate)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>
                    {dispensingProtocol.refill_interval_days} days from {formatDate(dispenseDate)}
                  </div>
                </div>
              )}

              {/* Result */}
              {logResult && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
                  background: logResult.success ? '#f0fdf4' : '#fef2f2',
                  color: logResult.success ? '#16a34a' : '#dc2626',
                  border: logResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}>
                  {logResult.message}
                </div>
              )}

              {/* Dispense Button */}
              <button
                onClick={handleDispense}
                disabled={logging || logResult?.success || !dispenseDate}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
                  background: logResult?.success ? '#e5e7eb' : '#000',
                  color: logResult?.success ? '#9ca3af' : '#fff',
                  fontSize: '15px', fontWeight: 600,
                  cursor: logging || logResult?.success ? 'default' : 'pointer',
                  fontFamily: 'inherit', marginTop: '4px',
                }}
              >
                {logging ? 'Dispensing...' : logResult?.success ? '✓ Dispensed' : 'Dispense & Log Pickup'}
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
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '800px',
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
    whiteSpace: 'nowrap',
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
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '440px',
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
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  fieldValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111',
    textAlign: 'right',
  },
  dateInput: {
    marginTop: '6px',
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  previewBox: {
    background: '#f0f9ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '14px 16px',
    marginTop: '14px',
    marginBottom: '14px',
    textAlign: 'center',
  },
};
