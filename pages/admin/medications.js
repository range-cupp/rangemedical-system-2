// /pages/admin/medications.js
// Medication Tracking — refill status, dispensing history, take-home protocol oversight
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { TESTOSTERONE_DOSES, WEIGHT_LOSS_DOSAGES, getDoseOptions } from '../../lib/protocol-config';

// Friendly labels for supply types
const SUPPLY_LABELS = {
  prefilled_1week: '1-Week Prefilled',
  prefilled_1: '1-Week Prefilled',
  prefilled_2week: '2-Week Prefilled',
  prefilled_4week: '4-Week Prefilled',
  vial_5ml: '5ml Vial',
  vial_10ml: '10ml Vial',
  vial: 'Vial',
  pellet: 'Pellets',
  oral_30day: '30-Day Oral',
  in_clinic: 'In-Clinic',
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

  // HRT prefilled — allow choosing 1-week, 2-week, or 4-week
  if (pt.includes('hrt') && (supply.startsWith('prefilled') || supply === 'in_clinic')) {
    return [
      { value: 'prefilled_1week', label: '1-Week Prefilled', days: 7 },
      { value: 'prefilled_2week', label: '2-Week Prefilled', days: 14 },
      { value: 'prefilled_4week', label: '4-Week Prefilled', days: 28 },
    ];
  }

  // HRT vials — allow choosing different vial sizes
  if (pt.includes('hrt') && supply.includes('vial')) {
    return [
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

  // No options to change for other types (pellets, oral, peptide)
  return null;
}

// Get the refill interval for a selected supply type
function getIntervalForSupply(supplyValue, med) {
  const pt = (med.program_type || '').toLowerCase();

  // Prefilled — straightforward
  const prefillDays = {
    prefilled_1week: 7, prefilled_1: 7,
    prefilled_2week: 14,
    prefilled_4week: 28,
  };
  if (prefillDays[supplyValue]) return prefillDays[supplyValue];

  // Weight loss — injection count × 7 days
  if (supplyValue === 'wl_1' || supplyValue === 'weekly') return 7;
  if (supplyValue === 'wl_2' || supplyValue === 'every_2_weeks') return 14;
  if (supplyValue === 'wl_3') return 21;
  if (supplyValue === 'wl_4' || supplyValue === 'monthly') return 28;

  // Vials — use the protocol's existing calculated interval
  // (already computed server-side based on dose + injection frequency)
  if (supplyValue === 'vial_5ml' || supplyValue === 'vial_10ml') {
    return med.refill_interval_days || 28;
  }

  return med.refill_interval_days || 28;
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
  const [selectedSupplyType, setSelectedSupplyType] = useState('');
  const [dispenseDosage, setDispenseDosage] = useState('');
  const [customDoseMode, setCustomDoseMode] = useState(false);
  const [customDoseValue, setCustomDoseValue] = useState('');
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
    // Default supply type based on protocol type
    const pt = (med.program_type || '').toLowerCase();
    if (pt.includes('weight_loss')) {
      // Default to 1 injection for weight loss — staff picks how many they're dispensing
      setSelectedSupplyType('wl_1');
    } else {
      setSelectedSupplyType(med.supply_type || '');
    }
    setDispenseDosage(med.dosage || '');
    setCustomDoseMode(false);
    setCustomDoseValue('');
    setLogResult(null);
  };

  const handleDispense = async () => {
    if (!dispensingProtocol || !dispenseDate) return;
    setLogging(true);
    setLogResult(null);
    try {
      const currentInterval = getIntervalForSupply(selectedSupplyType, dispensingProtocol);
      const res = await fetch('/api/admin/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: dispensingProtocol.id,
          patient_id: dispensingProtocol.patient_id,
          patient_name: dispensingProtocol.patient_name,
          dispense_date: dispenseDate,
          refill_interval_days: currentInterval,
          dosage_override: dispenseDosage !== dispensingProtocol.dosage ? dispenseDosage : null,
          quantity: selectedSupplyType.startsWith('wl_') ? parseInt(selectedSupplyType.split('_')[1]) : 1,
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

  // Compute the preview next refill date based on selected supply type
  const getActiveInterval = () => {
    if (!dispensingProtocol) return null;
    return getIntervalForSupply(selectedSupplyType, dispensingProtocol);
  };

  const previewNextRefill = () => {
    if (!dispensingProtocol || !dispenseDate) return null;
    const interval = getActiveInterval();
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
                      {formatSupplyInfo(med)}
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

              {/* Dosage — dropdown if options exist, otherwise static */}
              {dispensingProtocol.dosage && (() => {
                const doseOptions = getDispenseDoseOptions(dispensingProtocol);
                if (doseOptions && doseOptions.length > 0) {
                  return (
                    <div style={{ ...s.fieldRow, flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={s.fieldLabel}>Dosage</div>
                      {customDoseMode ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <input
                            type="text"
                            placeholder="e.g. 0.275ml / 55mg"
                            value={customDoseValue}
                            onChange={e => setCustomDoseValue(e.target.value)}
                            autoFocus
                            style={{
                              flex: 1, padding: '10px 12px', fontSize: '14px', fontWeight: 600,
                              border: '2px solid #2563eb', borderRadius: '8px', fontFamily: 'inherit',
                              color: '#111', background: '#eff6ff', outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => {
                              if (customDoseValue.trim()) {
                                setDispenseDosage(customDoseValue.trim());
                                setCustomDoseMode(false);
                              }
                            }}
                            style={{
                              padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                              background: '#111', color: '#fff', border: 'none', borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >Set</button>
                          <button
                            onClick={() => { setCustomDoseMode(false); setCustomDoseValue(''); }}
                            style={{
                              padding: '10px 12px', fontSize: '13px', fontWeight: 600,
                              background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
                              borderRadius: '8px', cursor: 'pointer',
                            }}
                          >Cancel</button>
                        </div>
                      ) : (
                        <select
                          value={dispenseDosage}
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                              setCustomDoseMode(true);
                              setCustomDoseValue('');
                            } else {
                              setDispenseDosage(e.target.value);
                            }
                          }}
                          style={{
                            width: '100%', padding: '10px 12px', fontSize: '14px', fontWeight: 600,
                            border: dispenseDosage !== dispensingProtocol.dosage ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                            borderRadius: '8px', fontFamily: 'inherit', color: '#111',
                            background: dispenseDosage !== dispensingProtocol.dosage ? '#fffbeb' : '#fff',
                            cursor: 'pointer', outline: 'none', marginTop: '6px',
                            appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M6 8L1 3h10z\' fill=\'%236b7280\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                            paddingRight: '32px',
                          }}
                        >
                          {/* Include current dose if not in options list */}
                          {!doseOptions.some(d => d.value === dispenseDosage) && dispenseDosage && (
                            <option value={dispenseDosage}>{dispenseDosage} (current)</option>
                          )}
                          {doseOptions.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                          <option value="__custom__">Custom dose...</option>
                        </select>
                      )}
                      {dispenseDosage !== dispensingProtocol.dosage && !customDoseMode && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>
                          Changed from {dispensingProtocol.dosage}
                        </div>
                      )}
                    </div>
                  );
                }
                // No dropdown options — show static
                return (
                  <div style={s.fieldRow}>
                    <div style={s.fieldLabel}>Dosage</div>
                    <div style={s.fieldValue}>{dispenseDosage}</div>
                  </div>
                );
              })()}

              {/* Supply Type Selector */}
              {(() => {
                const options = getSupplyOptions(dispensingProtocol);
                if (options) {
                  return (
                    <div style={{ ...s.fieldRow, flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={s.fieldLabel}>Supply Type</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {options.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedSupplyType(opt.value)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              fontFamily: 'inherit',
                              cursor: 'pointer',
                              border: selectedSupplyType === opt.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                              background: selectedSupplyType === opt.value ? '#eff6ff' : '#fff',
                              color: selectedSupplyType === opt.value ? '#2563eb' : '#374151',
                              transition: 'all 0.15s',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                // No selectable options — show static supply info
                return dispensingProtocol.supply_type ? (
                  <div style={s.fieldRow}>
                    <div style={s.fieldLabel}>Supply</div>
                    <div style={s.fieldValue}>{formatSupplyInfo(dispensingProtocol)}</div>
                  </div>
                ) : null;
              })()}

              {/* Refill Cycle */}
              <div style={s.fieldRow}>
                <div style={s.fieldLabel}>Refill Cycle</div>
                <div style={{ ...s.fieldValue, color: '#2563eb', fontWeight: 600 }}>
                  {formatIntervalLabel(getActiveInterval())}
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
                    {getActiveInterval()} days from {formatDate(dispenseDate)}
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
