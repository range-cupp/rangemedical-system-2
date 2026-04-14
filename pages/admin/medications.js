// /pages/admin/medications.js
// Medication Tracking — refill status, dispensing history, take-home protocol oversight
// Range Medical System V2

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout, { overlayClickProps } from '../../components/AdminLayout';
import { TESTOSTERONE_DOSES, WEIGHT_LOSS_DOSAGES, getDoseOptions, getPeptideVialSupply } from '../../lib/protocol-config';

// Friendly labels for supply types
const SUPPLY_LABELS = {
  prefilled: 'Pre-filled',
  vial_5ml: '5ml Vial',
  vial_10ml: '10ml Vial',
  vial: 'Vial',
  pellet: 'Pellets',
  oral_30day: '30-Day Oral',
  in_clinic: 'In-Clinic',
  // Legacy values
  prefilled_1week: '1-Week Prefilled',
  prefilled_1: '1-Week Prefilled',
  prefilled_2week: '2-Week Prefilled',
  prefilled_4week: '4-Week Prefilled',
};

function formatIntervalLabel(days) {
  if (!days) return '';
  if (days === 7) return '7d (weekly)';
  if (days === 14) return '14d (biweekly)';
  if (days === 28) return '28d (4 weeks)';
  if (days === 30) return '30d (monthly)';
  if (days === 120) return '120d (4 months)';
  const weeks = Math.round(days / 7);
  if (weeks >= 4 && days % 7 === 0) return `${days}d (~${weeks} weeks)`;
  return `${days}d`;
}

function formatSupplyInfo(med) {
  const parts = [];
  if (med.supply_type) parts.push(SUPPLY_LABELS[med.supply_type] || med.supply_type);
  if (med.injection_method) parts.push(med.injection_method === 'subq' ? 'Sub-Q (daily)' : 'IM (2x/week)');
  if (parts.length) return parts.join(' · ');
  return med.program_type?.replace(/_/g, ' ') || '';
}

// Get dosage options for dispense dropdown based on protocol type
function getDispenseDoseOptions(med) {
  const pt = (med.program_type || '').toLowerCase();
  const programName = (med.program_name || med.medication || '').toLowerCase();

  // HRT — male vs female (check program_name, medication, and program_type)
  if (pt.includes('hrt')) {
    const allFields = `${med.program_name || ''} ${med.medication || ''} ${med.program_type || ''}`.toLowerCase();
    const isFemale = allFields.includes('female') || allFields.includes('women');
    const doses = isFemale ? TESTOSTERONE_DOSES.female : TESTOSTERONE_DOSES.male;
    return doses.map(d => ({ value: d.value, label: d.label }));
  }

  // Weight Loss — look up by medication name
  if (pt.includes('weight_loss')) {
    const medName = med.medication || '';
    const doses = WEIGHT_LOSS_DOSAGES[medName];
    if (doses) return doses.map(d => ({ value: d, label: d }));
  }

  // Peptide — use getDoseOptions from protocol-config
  if (pt === 'peptide') {
    const doses = getDoseOptions('peptide', med.medication);
    if (doses) return doses.map(d => ({ value: d, label: d }));
  }

  return null;
}

// Get supply type options available for dispense based on protocol type
function getSupplyOptions(med) {
  const pt = (med.program_type || '').toLowerCase();
  const supply = (med.supply_type || '').toLowerCase();

  // HRT — prefilled (with quantity) or vial
  if (pt.includes('hrt')) {
    return [
      { value: 'prefilled', label: 'Pre-filled', days: null },
      { value: 'vial_5ml', label: '5ml Vial', days: null },
      { value: 'vial_10ml', label: '10ml Vial', days: null },
    ];
  }

  // Weight loss — pick number of injections (each = 1 week)
  if (pt.includes('weight_loss')) {
    return [
      { value: 'wl_1', label: '1 Injection (1 week)', days: 7 },
      { value: 'wl_2', label: '2 Injections (2 weeks)', days: 14 },
      { value: 'wl_3', label: '3 Injections (3 weeks)', days: 21 },
      { value: 'wl_4', label: '4 Injections (4 weeks)', days: 28 },
    ];
  }

  // Peptide — look up vial supply options by medication name
  if (pt === 'peptide') {
    const vialSupply = getPeptideVialSupply(med.medication || med.program_name || '');
    if (vialSupply) return vialSupply.options;
  }

  // No options to change for other types (pellets, oral)
  return null;
}

// Parse per-injection dose from dosage string (mirrors server-side parseDoseMl)
function parseDoseMl(selectedDose) {
  if (!selectedDose) return null;
  const weeksMatch = selectedDose.match(/\((\d+)\s*weeks?\)/i);
  if (weeksMatch) return { weeks: parseInt(weeksMatch[1]) };
  if (/vial\s*\(\d+ml/i.test(selectedDose)) return null;
  const atMlMatch = selectedDose.match(/@\s*(\d+\.?\d*)\s*ml/i);
  if (atMlMatch) return { ml: parseFloat(atMlMatch[1]) };
  const mlMatch = selectedDose.match(/(\d+\.?\d*)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (ml < 2) return { ml };
  }
  return null;
}

// Get the refill interval for a selected supply type
function getIntervalForSupply(supplyValue, med) {
  const pt = (med.program_type || '').toLowerCase();

  // Prefilled — now uses quantity + frequency, so no fixed day mapping
  // For legacy values, still handle them
  const prefillDays = {
    prefilled_1week: 7, prefilled_1: 7,
    prefilled_2week: 14,
    prefilled_4week: 28,
  };
  if (prefillDays[supplyValue]) return prefillDays[supplyValue];
  // New 'prefilled' value — caller should calculate from quantity + frequency
  if (supplyValue === 'prefilled') return null;

  // Weight loss — injection count × 7 days
  if (supplyValue === 'wl_1' || supplyValue === 'weekly') return 7;
  if (supplyValue === 'wl_2' || supplyValue === 'every_2_weeks') return 14;
  if (supplyValue === 'wl_3') return 21;
  if (supplyValue === 'wl_4' || supplyValue === 'monthly') return 28;

  // Peptide vial durations — extract days from value (e.g. peptide_30d → 30)
  if (supplyValue.startsWith('peptide_')) {
    const days = parseInt(supplyValue.replace('peptide_', '').replace('d', ''));
    if (!isNaN(days)) return days;
  }

  // Vials — calculate from dose + injection frequency (same logic as server-side)
  if (supplyValue === 'vial_5ml' || supplyValue === 'vial_10ml') {
    const vialMl = supplyValue === 'vial_5ml' ? 5 : 10;
    const parsed = parseDoseMl(med.dosage);
    if (parsed?.weeks) return parsed.weeks * 7;
    if (parsed?.ml) {
      const isSubQ = (med.injection_method || '').toLowerCase() === 'subq';
      const injectionsPerWeek = isSubQ ? 7 : 2;
      const mlPerWeek = parsed.ml * injectionsPerWeek;
      const weeks = vialMl / mlPerWeek;
      return Math.round(weeks * 7);
    }
    // Fallback: estimate conservatively
    return supplyValue === 'vial_5ml' ? 42 : 84;
  }

  return med.refill_interval_days || 28;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentDispensing, setRecentDispensing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const router = useRouter();
  const [dismissing, setDismissing] = useState(null); // protocol id being dismissed

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

  const handleDismiss = async (med) => {
    if (!confirm(`Dismiss ${med.patient_name} — ${med.medication || med.program_name}?\n\nThis will mark the protocol as completed and remove it from this list.`)) return;
    setDismissing(med.id);
    try {
      const res = await fetch(`/api/protocols/${med.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        setMedications(prev => prev.filter(m => m.id !== med.id));
      } else {
        alert('Failed to dismiss — try again');
      }
    } catch (err) {
      console.error('Dismiss error:', err);
      alert('Failed to dismiss — try again');
    } finally {
      setDismissing(null);
    }
  };

  // Navigate to checkout page with patient pre-selected
  const openDispenseModal = (med) => {
    router.push(`/admin/checkout?patient_id=${med.patient_id}&patient_name=${encodeURIComponent(med.patient_name)}`);
  };

  // Category matching helper
  const matchesCategory = (m) => {
    if (categoryFilter === 'all') return true;
    const pt = (m.program_type || '').toLowerCase();
    const med = (m.medication || m.program_name || '').toLowerCase();
    if (categoryFilter === 'hrt') return pt.includes('hrt');
    if (categoryFilter === 'weight_loss') return pt.includes('weight_loss');
    if (categoryFilter === 'peptide') return pt === 'peptide';
    if (categoryFilter === 'nad') return med.includes('nad');
    if (categoryFilter === 'vitamins') return med.includes('b12') || med.includes('vitamin') || med.includes('glutathione');
    return true;
  };

  const displayed = medications
    .filter(m => matchesCategory(m))
    .filter(m => !search ||
      m.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.medication || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.program_name || '').toLowerCase().includes(search.toLowerCase())
    );

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

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Types', color: '#6b7280' },
          { key: 'hrt', label: 'HRT', color: '#2563eb' },
          { key: 'weight_loss', label: 'Weight Loss', color: '#16a34a' },
          { key: 'peptide', label: 'Peptide', color: '#9333ea' },
          { key: 'nad', label: 'NAD+', color: '#ea580c' },
          { key: 'vitamins', label: 'Vitamins', color: '#0891b2' },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setCategoryFilter(c.key)}
            style={{
              padding: '6px 14px', borderRadius: 0, fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              border: categoryFilter === c.key ? `2px solid ${c.color}` : '1px solid #e5e7eb',
              background: categoryFilter === c.key ? c.color : '#fff',
              color: categoryFilter === c.key ? '#fff' : '#666',
            }}
          >
            {c.label}
            {categoryFilter !== c.key ? '' : ` (${displayed.length})`}
          </button>
        ))}
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
                      {formatSupplyInfo(med)}
                    </div>
                    {/* Secondary medications (HRT) */}
                    {(() => {
                      const secDetails = med.secondary_medication_details || [];
                      if (secDetails.length === 0) return null;
                      return secDetails.map(sec => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        let statusColor = '#6b7280';
                        let statusText = '';
                        if (sec.next_expected_date) {
                          const next = new Date(sec.next_expected_date + 'T00:00:00');
                          const days = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
                          if (days < 0) { statusColor = '#dc2626'; statusText = `${Math.abs(days)}d overdue`; }
                          else if (days <= 7) { statusColor = '#f59e0b'; statusText = `in ${days}d`; }
                          else { statusText = formatDate(sec.next_expected_date); }
                        }
                        return (
                          <div key={sec.medication} style={{ marginTop: '4px', padding: '3px 8px', background: '#faf5ff', borderRadius: 0, border: '1px solid #e9d5ff', fontSize: '11px' }}>
                            <span style={{ fontWeight: 600, color: '#7c3aed' }}>+ {sec.medication}</span>
                            {sec.num_vials && <span style={{ color: '#6b7280', marginLeft: '6px' }}>{sec.num_vials} vial{sec.num_vials > 1 ? 's' : ''}</span>}
                            {statusText && <span style={{ color: statusColor, marginLeft: '6px', fontWeight: 600 }}>· {statusText}</span>}
                          </div>
                        );
                      });
                    })()}
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
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openDispenseModal(med)}
                      style={s.dispenseBtn}
                    >
                      Dispense
                    </button>
                    <button
                      onClick={() => handleDismiss(med)}
                      disabled={dismissing === med.id}
                      title="Dismiss — patient no longer needs this medication"
                      style={{
                        marginLeft: '6px', padding: '6px 10px', fontSize: '13px',
                        background: 'transparent', color: '#9ca3af', border: '1px solid #e5e7eb',
                        borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {dismissing === med.id ? '...' : '✕'}
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
                  <th style={s.th}>Patient</th>
                  <th style={s.th}>Category</th>
                  <th style={s.th}>Medication</th>
                </tr>
              </thead>
              <tbody>
                {recentDispensing.slice(0, 20).map(d => (
                  <tr key={d.id} style={s.tr}>
                    <td style={{ ...s.td, fontSize: '13px' }}>{formatDate(d.entry_date)}</td>
                    <td style={{ ...s.td, fontSize: '13px', fontWeight: 500 }}>{d.patient_name || '—'}</td>
                    <td style={{ ...s.td, fontSize: '13px' }}>{(d.category || '').replace(/_/g, ' ')}</td>
                    <td style={{ ...s.td, fontSize: '13px', color: '#6b7280' }}>{d.medication || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    fontSize: '13px',
    outline: 'none',
    width: '260px',
    maxWidth: '100%',
    fontFamily: 'inherit',
  },
  tableWrap: {
    background: '#fff',
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  previewBox: {
    background: '#f0f9ff',
    border: '1px solid #bfdbfe',
    borderRadius: 0,
    padding: '14px 16px',
    marginTop: '14px',
    marginBottom: '14px',
    textAlign: 'center',
  },
};
