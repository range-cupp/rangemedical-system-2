// /pages/admin/purchases/index.js
// Purchases - Clean UI with Protocol Creation
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../../components/AdminNav';

// Protocol Types Configuration
const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    category: 'Peptide',
    medications: ['BPC-157 / Thymosin Beta-4'],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg'],
    frequencies: [
      { value: 'daily', label: 'Daily' },
      { value: '2x_daily', label: 'Twice Daily' }
    ],
    durations: [
      { value: 7, label: '7 days' },
      { value: 10, label: '10 days' },
      { value: 14, label: '14 days' },
      { value: 20, label: '20 days' },
      { value: 30, label: '30 days' }
    ]
  },
  hrt_male: {
    name: 'HRT Protocol',
    category: 'HRT',
    medications: ['Testosterone Cypionate 200mg/ml'],
    dosages: ['0.3ml / 60mg', '0.4ml / 80mg', '0.5ml / 100mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  hrt_female: {
    name: 'HRT Protocol',
    category: 'HRT',
    medications: ['Testosterone Cypionate 100mg/ml'],
    dosages: ['0.1ml / 10mg', '0.2ml / 20mg', '0.3ml / 30mg', '0.4ml / 40mg', '0.5ml / 50mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  weight_loss_semaglutide: {
    name: 'Semaglutide',
    category: 'Weight Loss',
    medications: ['Semaglutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' }
    ]
  },
  weight_loss_tirzepatide: {
    name: 'Tirzepatide',
    category: 'Weight Loss',
    medications: ['Tirzepatide'],
    dosages: ['2.5mg', '5.0mg', '7.5mg', '10.0mg', '12.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' }
    ]
  },
  weight_loss_retatrutide: {
    name: 'Retatrutide',
    category: 'Weight Loss',
    medications: ['Retatrutide'],
    dosages: ['2mg', '4mg', '6mg', '8mg', '10mg', '12mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' }
    ]
  },
  single_injection: {
    name: 'Single Injection',
    category: 'Injection',
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'],
    injections: [1],
    frequencies: [{ value: 'single', label: 'Single injection' }],
    hasDosageNotes: true
  },
  injection_pack: {
    name: 'Injection Pack',
    category: 'Injection',
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'],
    injections: [5, 10, 12, 20, 24],
    frequencies: [
      { value: '1x_weekly', label: '1x per week' },
      { value: '2x_weekly', label: '2x per week' },
      { value: '3x_weekly', label: '3x per week' },
      { value: '4x_weekly', label: '4x per week' },
      { value: '5x_weekly', label: '5x per week' },
      { value: '6x_weekly', label: '6x per week' },
      { value: '7x_weekly', label: '7x per week' }
    ],
    hasDosageNotes: true
  },
  red_light: {
    name: 'Red Light Therapy',
    category: 'Red Light',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  hbot: {
    name: 'HBOT',
    category: 'Hyperbaric',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  iv_therapy: {
    name: 'IV Therapy',
    category: 'IV Therapy',
    medications: [
      'Range IV',
      'NAD+ IV 250mg',
      'NAD+ IV 500mg',
      'NAD+ IV 750mg',
      'NAD+ IV 1000mg',
      'Glutathione IV 1g',
      'Glutathione IV 2g',
      'Glutathione IV 3g',
      'Vitamin C IV 25g',
      'Vitamin C IV 50g',
      'Vitamin C IV 75g',
      'Methylene Blue IV',
      'MB + Vit C + Mag Combo',
      'Exosome IV',
      'BYO IV',
      'Hydration IV'
    ],
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  }
};

const CATEGORY_TO_TYPE = {
  'Peptide': 'peptide',
  'HRT': 'hrt_male',
  'Weight Loss': 'weight_loss_semaglutide',
  'Red Light': 'red_light',
  'Hyperbaric': 'hbot',
  'IV Therapy': 'iv_therapy',
  'Injection': 'single_injection'
};

// Classify purchase into action type: 'protocol' | 'session' | 'product'
function getPurchaseActionType(purchase) {
  const cat = (purchase.category || '').toLowerCase();
  const item = (purchase.item_name || '').toLowerCase();

  // Always protocol: peptide, hrt, weight_loss
  if (['peptide', 'hrt', 'weight_loss'].includes(cat)) return 'protocol';

  // Always protocol: combo memberships, injection packs by category
  if (cat === 'combo_membership' || cat === 'injection_pack') return 'protocol';

  // Product categories: no tracking needed
  if (['other', 'custom', 'assessment', 'programs'].includes(cat)) return 'product';

  // Session-based categories: pack vs single
  const isPackOrMulti = (
    item.includes('pack') ||
    item.includes('membership') ||
    /\d+[\s-]?session/i.test(item) ||
    /\d+[\s-]?pack/i.test(item)
  );
  if (isPackOrMulti) return 'protocol';

  // Remaining service categories are single sessions
  if (['hbot', 'red_light', 'iv_therapy', 'specialty_iv',
       'injection_standard', 'injection_premium', 'nad_injection', 'injection'].includes(cat)) {
    return 'session';
  }

  // Fallback: protocol (safe default)
  return 'protocol';
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createModal, setCreateModal] = useState(null);
  const [addToExistingModal, setAddToExistingModal] = useState(null);
  const [logSessionModal, setLogSessionModal] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/admin/purchases');
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases
  const filtered = purchases.filter(p => {
    // Status filter
    if (filter === 'unassigned' && p.protocol_id) return false;
    if (filter === 'assigned' && !p.protocol_id) return false;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      return (
        (p.patient_name || '').toLowerCase().includes(s) ||
        (p.item_name || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Sort by date (newest first)
  const sorted = [...filtered].sort((a, b) => 
    new Date(b.payment_date || b.purchase_date || b.created_at || 0) - new Date(a.payment_date || a.purchase_date || a.created_at || 0)
  );

  const unassignedCount = purchases.filter(p => !p.protocol_id && !p.session_logged && getPurchaseActionType(p) !== 'product').length;
  const totalCount = purchases.length;
  const totalRevenue = purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <>
      <Head>
        <title>Purchases | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <AdminNav 
          title="Purchases" 
          subtitle={`${totalCount} purchases · $${totalRevenue.toLocaleString()}`} 
        />

        <main style={styles.main}>
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search by patient or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.filterGroup}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'all' ? '#000' : '#fff',
                  color: filter === 'all' ? '#fff' : '#000'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unassigned')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'unassigned' ? '#000' : '#fff',
                  color: filter === 'unassigned' ? '#fff' : '#000'
                }}
              >
                Unassigned
              </button>
              <button
                onClick={() => setFilter('assigned')}
                style={{
                  ...styles.filterBtn,
                  background: filter === 'assigned' ? '#000' : '#fff',
                  color: filter === 'assigned' ? '#fff' : '#000'
                }}
              >
                Assigned
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.loading}>Loading purchases...</div>
            ) : sorted.length === 0 ? (
              <div style={styles.empty}>No purchases found</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(purchase => (
                    <tr key={purchase.id} style={styles.tr}>
                      <td style={styles.td}>
                        {(purchase.payment_date || purchase.purchase_date) ? new Date(purchase.payment_date || purchase.purchase_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.patientName}>{purchase.patient_name || 'Unknown'}</div>
                      </td>
                      <td style={styles.td}>{purchase.item_name}</td>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>{purchase.category || '—'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.amount}>${purchase.amount}</span>
                      </td>
                      <td style={styles.td}>
                        {purchase.protocol_id ? (
                          <Link href={`/admin/protocols/${purchase.protocol_id}`} style={styles.protocolLink}>
                            View Protocol →
                          </Link>
                        ) : purchase.session_logged ? (
                          <span style={styles.sessionLoggedBadge}>✓ Logged</span>
                        ) : (() => {
                          const actionType = getPurchaseActionType(purchase);
                          const cat = (purchase.category || '').toLowerCase();
                          if (actionType === 'protocol') {
                            return (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => setCreateModal(purchase)} style={styles.createBtn}>
                                  + Create
                                </button>
                                {cat !== 'peptide' && (
                                  <button onClick={() => setAddToExistingModal(purchase)} style={styles.addToExistingBtn}>
                                    + Add to Existing
                                  </button>
                                )}
                              </div>
                            );
                          }
                          if (actionType === 'session') {
                            return (
                              <button onClick={() => setLogSessionModal(purchase)} style={styles.logSessionBtn}>
                                Log Session
                              </button>
                            );
                          }
                          // product
                          return <span style={styles.saleBadge}>Sale</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Create Protocol Modal */}
        {createModal && (
          <CreateProtocolModal
            purchase={createModal}
            onClose={() => setCreateModal(null)}
            onSuccess={() => {
              setCreateModal(null);
              fetchPurchases();
            }}
          />
        )}

        {/* Add to Existing Protocol Modal */}
        {addToExistingModal && (
          <AddToExistingModal
            purchase={addToExistingModal}
            onClose={() => setAddToExistingModal(null)}
            onSuccess={() => {
              setAddToExistingModal(null);
              fetchPurchases();
            }}
          />
        )}

        {/* Log Session Modal */}
        {logSessionModal && (
          <LogSessionModal
            purchase={logSessionModal}
            onClose={() => setLogSessionModal(null)}
            onSuccess={() => {
              setLogSessionModal(null);
              fetchPurchases();
            }}
          />
        )}
      </div>
    </>
  );
}

// Create Protocol Modal Component
function CreateProtocolModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);

  const initialType = CATEGORY_TO_TYPE[purchase?.category] || 'peptide';

  // Handle both object {value, label} and plain number formats for injections
  const getInitialInjections = () => {
    const firstInjection = PROTOCOL_TYPES[initialType]?.injections?.[0];
    return typeof firstInjection === 'object' ? firstInjection.value : (firstInjection || 4);
  };

  const [form, setForm] = useState({
    protocolType: initialType,
    medication: '',
    dosage: '',
    dosageNotes: '',
    frequency: PROTOCOL_TYPES[initialType]?.frequencies?.[0]?.value || 'daily',
    deliveryMethod: 'take_home',
    startDate: new Date().toISOString().split('T')[0],
    duration: PROTOCOL_TYPES[initialType]?.durations?.[0]?.value || 10,
    totalSessions: PROTOCOL_TYPES[initialType]?.sessions?.[0] || 1,
    totalInjections: getInitialInjections(),
    notes: ''
  });

  // Look up patient from patients table (single source of truth)
  useEffect(() => {
    async function lookupPatient() {
      setPatientLoading(true);
      try {
        // Try by ghl_contact_id first, then by name
        let found = null;
        if (purchase?.ghl_contact_id) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.ghl_contact_id)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            found = patients.find(p => p.ghl_contact_id === purchase.ghl_contact_id);
          }
        }
        if (!found && purchase?.patient_name) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.patient_name)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            // Match by name
            const purchaseName = (purchase.patient_name || '').toLowerCase().trim();
            found = patients.find(p => {
              const fullName = (p.first_name && p.last_name)
                ? `${p.first_name} ${p.last_name}`.toLowerCase()
                : (p.name || '').toLowerCase();
              return fullName === purchaseName;
            }) || patients[0];
          }
        }
        setPatient(found || null);
      } catch (err) {
        console.error('Patient lookup error:', err);
      } finally {
        setPatientLoading(false);
      }
    }
    lookupPatient();
  }, [purchase]);

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isSessionBased = !!selectedType?.sessions;
  const isInjectionBased = !!selectedType?.injections;
  const isOngoing = selectedType?.ongoing;
  const hasDosageNotes = selectedType?.hasDosageNotes;

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    // Handle both object {value, label} and plain number formats for injections
    const firstInjection = typeConfig?.injections?.[0];
    const injectionValue = typeof firstInjection === 'object' ? firstInjection.value : firstInjection;
    
    setForm(prev => ({
      ...prev,
      protocolType: type,
      medication: '',
      dosage: '',
      dosageNotes: '',
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      duration: typeConfig?.durations?.[0]?.value || 10,
      totalSessions: typeConfig?.sessions?.[0] || 1,
      totalInjections: injectionValue || 4
    }));
  };

  // Build patient name from the patients table (source of truth)
  const patientName = patient
    ? (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name)
    : purchase?.patient_name || 'Unknown';
  const patientPhone = patient?.phone || purchase?.patient_phone || '';
  const patientEmail = patient?.email || purchase?.patient_email || '';
  const patientId = patient?.id || null;
  const ghlContactId = patient?.ghl_contact_id || purchase?.ghl_contact_id || '';

  const handleSubmit = async () => {
    if (!patientName?.trim()) {
      setError('Could not determine patient name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const programTypeMap = {
        'peptide': form.duration == 10 ? 'recovery_jumpstart_10day' : 
                   form.duration == 30 ? 'month_program_30day' : 'recovery_jumpstart_10day',
        'hrt_male': 'hrt_male_membership',
        'hrt_female': 'hrt_female_membership',
        'weight_loss_semaglutide': 'weight_loss_program',
        'weight_loss_tirzepatide': 'weight_loss_program',
        'weight_loss_retatrutide': 'weight_loss_program',
        'single_injection': 'injection_pack',
        'injection_pack': 'injection_pack',
        'red_light': 'red_light_sessions',
        'hbot': 'hbot_sessions',
        'iv_therapy': 'iv_therapy'
      };

      const buildProtocolName = () => {
        const type = form.protocolType;
        if (type === 'peptide') return `${form.duration}-Day Recovery Protocol`;
        if (type === 'hrt_male') return 'HRT Protocol (Male)';
        if (type === 'hrt_female') return 'HRT Protocol (Female)';
        if (type.startsWith('weight_loss')) return `Weight Loss - ${form.medication} ${form.dosage} (${form.totalInjections} injections)`;
        if (type === 'single_injection') return `Single Injection - ${form.medication}`;
        if (type === 'injection_pack') return `Injection Pack (${form.totalInjections} injections) - ${form.medication}`;
        if (type === 'red_light') return `Red Light Therapy (${form.totalSessions} sessions)`;
        if (type === 'hbot') return `HBOT (${form.totalSessions} sessions)`;
        if (type === 'iv_therapy') return form.medication 
          ? `${form.medication} (${form.totalSessions} sessions)` 
          : `IV Therapy (${form.totalSessions} sessions)`;
        return 'Protocol';
      };

      const calculateEndDate = () => {
        if (isOngoing) return null;
        if (isSessionBased && !form.startDate) return null;
        if (isInjectionBased) {
          // Weekly injections: 4 injections = ~28 days
          const start = new Date(form.startDate);
          start.setDate(start.getDate() + (parseInt(form.totalInjections) * 7) - 1);
          return start.toISOString().split('T')[0];
        }
        if (!form.startDate || !form.duration) return null;
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + parseInt(form.duration) - 1);
        return start.toISOString().split('T')[0];
      };

      // Calculate duration_days based on protocol type
      const getDurationDays = () => {
        if (isInjectionBased) return parseInt(form.totalInjections) * 7; // Weekly injections
        if (isSessionBased) return parseInt(form.totalSessions);
        if (isOngoing) return 30;
        return parseInt(form.duration);
      };

      // Calculate total_sessions based on protocol type
      const getTotalSessions = () => {
        if (isInjectionBased) return parseInt(form.totalInjections);
        if (isSessionBased) return parseInt(form.totalSessions);
        if (isOngoing) return null;
        return parseInt(form.duration);
      };

      const protocolData = {
        patient_id: patientId,
        ghl_contact_id: ghlContactId || null,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        purchase_id: purchase.id,
        program_name: buildProtocolName(),
        program_type: programTypeMap[form.protocolType] || 'recovery_jumpstart_10day',
        primary_peptide: form.medication,
        dose_amount: form.dosage || form.dosageNotes || '',
        dose_frequency: form.frequency,
        injection_location: form.deliveryMethod,
        start_date: form.startDate,
        duration_days: getDurationDays(),
        total_sessions: getTotalSessions(),
        end_date: calculateEndDate(),
        notes: form.dosageNotes ? `Dosage: ${form.dosageNotes}${form.notes ? '\n' + form.notes : ''}` : form.notes,
        status: 'active',
        amount: purchase.amount
      };

      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Create Protocol</h2>
            <p style={modalStyles.subtitle}>{purchase.item_name} (${purchase.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Patient (read-only from patients table) */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Patient</h3>
            {patientLoading ? (
              <div style={{ padding: '12px', color: '#9ca3af', fontSize: '14px' }}>Looking up patient...</div>
            ) : (
              <div style={modalStyles.patientCard}>
                <div style={modalStyles.patientCardName}>{patientName}</div>
                <div style={modalStyles.patientCardDetails}>
                  {patientEmail && <span>{patientEmail}</span>}
                  {patientEmail && patientPhone && <span style={{ color: '#d1d5db' }}> · </span>}
                  {patientPhone && <span>{patientPhone}</span>}
                </div>
                {!patient && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                    Patient not found in database — using purchase data
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Protocol Type */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Protocol Type</h3>
            <div style={modalStyles.typeGrid}>
              {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => handleTypeChange(key)}
                  style={{
                    ...modalStyles.typeBtn,
                    background: form.protocolType === key ? '#000' : '#f5f5f5',
                    color: form.protocolType === key ? '#fff' : '#000'
                  }}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Medication */}
          {selectedType?.medications && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Medication</h3>
              <div style={modalStyles.grid}>
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Medication</label>
                  <select
                    value={form.medication}
                    onChange={e => setForm({ ...form, medication: e.target.value })}
                    style={modalStyles.select}
                  >
                    <option value="">Select...</option>
                    {selectedType.medications.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {selectedType.dosages && !hasDosageNotes && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Dosage</label>
                    <select
                      value={form.dosage}
                      onChange={e => setForm({ ...form, dosage: e.target.value })}
                      style={modalStyles.select}
                    >
                      <option value="">Select...</option>
                      {selectedType.dosages.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
                {hasDosageNotes && (
                  <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Dosage (write in)</label>
                    <input
                      type="text"
                      value={form.dosageNotes}
                      onChange={e => setForm({ ...form, dosageNotes: e.target.value })}
                      style={modalStyles.input}
                      placeholder="e.g., 1ml, 200mg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Schedule</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value })}
                  style={modalStyles.select}
                >
                  {selectedType?.frequencies?.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              {selectedType?.durations && (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Duration</label>
                  <select
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType.durations.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedType?.sessions && (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Sessions</label>
                  <select
                    value={form.totalSessions}
                    onChange={e => setForm({ ...form, totalSessions: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType.sessions.map(s => (
                      <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedType?.injections && (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Injections</label>
                  <select
                    value={form.totalInjections}
                    onChange={e => setForm({ ...form, totalInjections: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType.injections.map(i => {
                      // Handle both object format {value, label} and plain number format
                      const val = typeof i === 'object' ? i.value : i;
                      const label = typeof i === 'object' ? i.label : `${i} injection${i > 1 ? 's' : ''}`;
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={modalStyles.submitBtn}>
            {saving ? 'Creating...' : 'Create Protocol'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add to Existing Protocol Modal Component
function AddToExistingModal({ purchase, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState([]);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [sessionsToAdd, setSessionsToAdd] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientProtocols();
  }, []);

  const fetchPatientProtocols = async () => {
    try {
      // Fetch protocols for this patient by name or contact ID
      const searchParam = purchase.ghl_contact_id || purchase.patient_name;
      const res = await fetch(`/api/admin/protocols?search=${encodeURIComponent(searchParam)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter to only active protocols for this patient
        const patientProtocols = (data.protocols || data || []).filter(p => 
          (p.ghl_contact_id === purchase.ghl_contact_id || 
           (p.patient_name || '').toLowerCase() === (purchase.patient_name || '').toLowerCase()) &&
          p.status === 'active'
        );
        setProtocols(patientProtocols);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProtocol) {
      setError('Please select a protocol');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update the protocol to add sessions
      const newTotalSessions = (selectedProtocol.total_sessions || 0) + sessionsToAdd;
      
      const res = await fetch(`/api/admin/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_sessions: newTotalSessions
        })
      });

      if (!res.ok) throw new Error('Failed to update protocol');

      // Link purchase to protocol
      const purchaseRes = await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: selectedProtocol.id
        })
      });

      if (!purchaseRes.ok) throw new Error('Failed to link purchase');

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Add to Existing Protocol</h2>
            <p style={modalStyles.subtitle}>{purchase?.item_name} (${purchase?.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Patient</h3>
            <p style={{ margin: '4px 0', fontWeight: '500' }}>{purchase?.patient_name}</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Select Protocol</h3>
            {loading ? (
              <p style={{ color: '#666' }}>Loading protocols...</p>
            ) : protocols.length === 0 ? (
              <p style={{ color: '#666' }}>No active protocols found for this patient. Create a new protocol instead.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {protocols.map(protocol => (
                  <button
                    key={protocol.id}
                    onClick={() => setSelectedProtocol(protocol)}
                    style={{
                      padding: '12px 16px',
                      border: selectedProtocol?.id === protocol.id ? '2px solid #000' : '1px solid #e5e5e5',
                      borderRadius: '8px',
                      background: selectedProtocol?.id === protocol.id ? '#f5f5f5' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {protocol.program_name || protocol.program_type}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {protocol.total_sessions || 0} sessions • Started {new Date(protocol.start_date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProtocol && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Sessions to Add</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1, 5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setSessionsToAdd(n)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: sessionsToAdd === n ? '#000' : '#f5f5f5',
                      color: sessionsToAdd === n ? '#fff' : '#000',
                      fontWeight: '500'
                    }}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                New total: {(selectedProtocol.total_sessions || 0) + sessionsToAdd} sessions
              </p>
            </div>
          )}
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving || !selectedProtocol || protocols.length === 0} 
            style={{
              ...modalStyles.submitBtn,
              opacity: (!selectedProtocol || protocols.length === 0) ? 0.5 : 1
            }}
          >
            {saving ? 'Adding...' : `Add ${sessionsToAdd} Session${sessionsToAdd > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Log Session Modal — for single IVs, injections, and one-off sessions
function LogSessionModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    medication: purchase?.item_name || '',
    notes: ''
  });

  // Patient lookup (same pattern as CreateProtocolModal)
  useEffect(() => {
    async function lookupPatient() {
      setPatientLoading(true);
      try {
        let found = null;
        if (purchase?.ghl_contact_id) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.ghl_contact_id)}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            found = patients.find(p => p.ghl_contact_id === purchase.ghl_contact_id);
          }
        }
        if (!found && purchase?.patient_name) {
          const res = await fetch(`/api/admin/patients?search=${encodeURIComponent(purchase.patient_name)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const patients = data.patients || data || [];
            const purchaseName = (purchase.patient_name || '').toLowerCase().trim();
            found = patients.find(p => {
              const fullName = (p.first_name && p.last_name)
                ? `${p.first_name} ${p.last_name}`.toLowerCase()
                : (p.name || '').toLowerCase();
              return fullName === purchaseName;
            }) || patients[0];
          }
        }
        setPatient(found || null);
      } catch (err) {
        console.error('Patient lookup error:', err);
      } finally {
        setPatientLoading(false);
      }
    }
    lookupPatient();
  }, [purchase]);

  const patientName = patient
    ? (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : patient.name)
    : purchase?.patient_name || 'Unknown';

  // Map purchase category to service_log category
  const getServiceCategory = () => {
    const cat = (purchase?.category || '').toLowerCase();
    const map = {
      'hbot': 'hbot', 'red_light': 'red_light',
      'iv_therapy': 'iv_therapy', 'specialty_iv': 'iv_therapy',
      'injection_standard': 'vitamin', 'injection_premium': 'vitamin',
      'nad_injection': 'vitamin', 'injection': 'vitamin'
    };
    return map[cat] || cat;
  };

  const handleSubmit = async () => {
    if (!patient?.id) {
      setError('No patient found — cannot log session');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1. Create service log entry
      const logRes = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          category: getServiceCategory(),
          entry_type: 'session',
          entry_date: form.date,
          medication: form.medication,
          notes: form.notes || `Logged from purchase: ${purchase.item_name}`
        })
      });
      if (!logRes.ok) {
        const data = await logRes.json();
        throw new Error(data.error || 'Failed to create service log');
      }

      // 2. Mark purchase as logged
      await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_logged: true })
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.modal, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Log Session</h2>
            <p style={modalStyles.subtitle}>{purchase.item_name} (${purchase.amount})</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Patient */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Patient</label>
            {patientLoading ? (
              <div style={{ padding: '8px', color: '#9ca3af', fontSize: '14px' }}>Looking up patient...</div>
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                {patientName}
                {!patient?.id && <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>⚠ Not found in system</span>}
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Session Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Medication / Service */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Service</label>
            <input
              type="text"
              value={form.medication}
              onChange={e => setForm({ ...form, medication: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || patientLoading || !patient?.id}
            style={{
              ...modalStyles.submitBtn,
              background: '#22c55e',
              opacity: (!patient?.id || saving) ? 0.5 : 1
            }}
          >
            {saving ? 'Logging...' : '✓ Log Session'}
          </button>
        </div>
      </div>
    </div>
  );
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
  toolbar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px',
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff'
  },
  filterGroup: {
    display: 'flex',
    gap: '4px',
    background: '#fff',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5'
  },
  filterBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  tableCard: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
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
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px'
  },
  amount: {
    fontWeight: '600'
  },
  protocolLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '13px'
  },
  createBtn: {
    padding: '6px 12px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  addToExistingBtn: {
    padding: '6px 12px',
    background: '#fff',
    color: '#000',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  logSessionBtn: {
    padding: '6px 12px',
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  sessionLoggedBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#666'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  body: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  },
  error: {
    padding: '12px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  section: {
    marginBottom: '20px'
  },
  patientCard: {
    padding: '12px 16px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  patientCardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111'
  },
  patientCardDetails: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '10px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '4px'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  typeBtn: {
    padding: '10px 8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center'
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};
