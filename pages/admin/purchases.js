// /pages/admin/purchases.js
// Purchases - Clean UI with Protocol Creation
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../components/AdminLayout';

// Protocol type configurations
const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    category: 'Peptide',
    medications: ['BPC-157 / TB-500', 'BPC-157', 'TB-500'],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg'],
    frequencies: [
      { value: 'daily', label: 'Once daily' },
      { value: '2x_daily', label: 'Twice daily' }
    ],
    durations: [10, 30, 60, 90]
  },
  hrt_male: {
    name: 'HRT - Male',
    category: 'HRT',
    medications: ['Testosterone Cypionate 200mg/ml'],
    dosages: ['0.3ml / 60mg', '0.4ml / 80mg', '0.5ml / 100mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  hrt_female: {
    name: 'HRT - Female',
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
    ongoing: true
  },
  weight_loss_tirzepatide: {
    name: 'Tirzepatide',
    category: 'Weight Loss',
    medications: ['Tirzepatide'],
    dosages: ['2.5mg', '5.0mg', '7.5mg', '10.0mg', '12.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  weight_loss_retatrutide: {
    name: 'Retatrutide',
    category: 'Weight Loss',
    medications: ['Retatrutide'],
    dosages: ['2mg', '4mg', '6mg', '8mg', '10mg', '12mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  single_injection: {
    name: 'Single Injection',
    category: 'Injection',
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione 200mg', 'NAD+ 50mg', 'NAD+ 75mg', 'NAD+ 100mg', 'NAD+ 125mg', 'NAD+ 150mg'],
    sessions: [1],
    frequencies: [{ value: 'single', label: 'Single' }],
    hasDosageNotes: true
  },
  injection_pack: {
    name: 'Injection Pack',
    category: 'Injection',
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione 200mg', 'NAD+ 50mg', 'NAD+ 75mg', 'NAD+ 100mg', 'NAD+ 125mg', 'NAD+ 150mg'],
    sessions: [5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    hasDosageNotes: true
  },
  red_light: {
    name: 'Red Light',
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

const CATEGORIES = ['All', 'Peptide', 'Weight Loss', 'HRT', 'Injection', 'IV Therapy', 'Red Light', 'Hyperbaric', 'Labs', 'Other'];

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('unassigned');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/purchases');
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || data || []);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    // Status filter
    if (statusFilter === 'unassigned' && p.protocol_id) return false;
    if (statusFilter === 'assigned' && !p.protocol_id) return false;
    
    // Category filter
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        p.patient_name?.toLowerCase().includes(searchLower) ||
        p.item_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const openCreateModal = (purchase) => {
    setSelectedPurchase(purchase);
    setShowModal(true);
  };

  return (
    <AdminLayout title="Purchases">
      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Purchases</h1>
        <p style={s.pageSubtitle}>
          {filteredPurchases.length} purchases
          {statusFilter === 'unassigned' && ' need protocols'}
        </p>
      </div>

      {/* Filters */}
      <div style={s.filterBar}>
        <input
          type="text"
          placeholder="Search by patient or item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={s.select}>
          <option value="unassigned">Needs Protocol</option>
          <option value="assigned">Has Protocol</option>
          <option value="all">All</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={s.select}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Purchases Table */}
      <div style={s.card}>
        {loading ? (
          <div style={s.loading}>Loading...</div>
        ) : filteredPurchases.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💳</div>
            <div style={s.emptyText}>No purchases found</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Patient</th>
                <th style={s.th}>Item</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.slice(0, 100).map(purchase => (
                <tr key={purchase.id} style={s.trHover}>
                  <td style={s.td}>
                    {purchase.payment_date ? new Date(purchase.payment_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }) : '—'}
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: '500' }}>{purchase.patient_name || 'Unknown'}</div>
                  </td>
                  <td style={s.td}>
                    <div>{purchase.item_name}</div>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: '#f0f0f0',
                      color: '#666'
                    }}>
                      {purchase.category || 'Other'}
                    </span>
                  </td>
                  <td style={s.td}>
                    ${purchase.amount}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    {purchase.protocol_id ? (
                      <Link href={`/admin/protocols/${purchase.protocol_id}`} style={{ ...s.btnSecondary, ...s.btnSmall }}>
                        View Protocol
                      </Link>
                    ) : (
                      <button
                        onClick={() => openCreateModal(purchase)}
                        style={{ ...s.btnPrimary, ...s.btnSmall }}
                      >
                        + Create Protocol
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Protocol Modal */}
      {showModal && selectedPurchase && (
        <CreateProtocolModal
          purchase={selectedPurchase}
          onClose={() => { setShowModal(false); setSelectedPurchase(null); }}
          onSuccess={() => { setShowModal(false); setSelectedPurchase(null); fetchPurchases(); }}
        />
      )}
    </AdminLayout>
  );
}

// Create Protocol Modal Component
function CreateProtocolModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const initialType = CATEGORY_TO_TYPE[purchase?.category] || 'peptide';
  const [form, setForm] = useState({
    protocolType: initialType,
    patientName: purchase?.patient_name || '',
    patientPhone: purchase?.patient_phone || '',
    ghlContactId: purchase?.ghl_contact_id || '',
    medication: '',
    dosage: '',
    dosageNotes: '',
    frequency: PROTOCOL_TYPES[initialType]?.frequencies?.[0]?.value || 'daily',
    deliveryMethod: 'take_home',
    startDate: new Date().toISOString().split('T')[0],
    duration: PROTOCOL_TYPES[initialType]?.durations?.[0] || 30,
    totalSessions: PROTOCOL_TYPES[initialType]?.sessions?.[0] || 1,
    notes: ''
  });

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isSessionBased = !!selectedType?.sessions;
  const isOngoing = selectedType?.ongoing;
  const hasDosageNotes = selectedType?.hasDosageNotes;

  const handleTypeChange = (type) => {
    const config = PROTOCOL_TYPES[type];
    setForm(prev => ({
      ...prev,
      protocolType: type,
      medication: '',
      dosage: '',
      dosageNotes: '',
      frequency: config?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: config?.sessions ? 'in_clinic' : prev.deliveryMethod,
      duration: config?.durations?.[0] || 30,
      totalSessions: config?.sessions?.[0] || 1
    }));
  };

  const handleSubmit = async () => {
    if (!form.patientName?.trim()) {
      setError('Patient name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Calculate end date
      let endDate = null;
      const durationDays = isSessionBased ? form.totalSessions : (isOngoing ? 30 : form.duration);
      if (form.startDate && durationDays) {
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + parseInt(durationDays) - 1);
        endDate = start.toISOString().split('T')[0];
      }

      // Build program name
      let programName = selectedType?.name || 'Protocol';
      if (form.medication) programName = `${programName} - ${form.medication}`;
      if (form.duration && !isOngoing && !isSessionBased) programName = `${form.duration}-Day ${selectedType?.name}`;

      const protocolData = {
        ghl_contact_id: form.ghlContactId || null,
        patient_name: form.patientName,
        patient_phone: form.patientPhone,
        purchase_id: purchase.id,
        program_name: programName,
        program_type: form.protocolType,
        primary_peptide: form.medication,
        dose_amount: form.dosage || form.dosageNotes || '',
        dose_frequency: form.frequency,
        injection_location: form.deliveryMethod,
        start_date: form.startDate,
        end_date: endDate,
        duration_days: parseInt(durationDays),
        total_sessions: isSessionBased ? parseInt(form.totalSessions) : parseInt(durationDays),
        notes: form.notes,
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
        throw new Error(data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.modalHeader}>
          <div>
            <h2 style={s.modalTitle}>Create Protocol</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              {purchase.item_name} (${purchase.amount})
            </p>
          </div>
          <button onClick={onClose} style={s.modalClose}>×</button>
        </div>

        {/* Body */}
        <div style={s.modalBody}>
          {error && <div style={styles.error}>{error}</div>}

          {/* Patient */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Patient</h4>
            <div style={styles.formGrid}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Name *</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Phone</label>
                <input
                  type="tel"
                  value={form.patientPhone}
                  onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                  style={s.input}
                />
              </div>
            </div>
          </div>

          {/* Protocol Type */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Protocol Type</h4>
            <div style={styles.typeGrid}>
              {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  style={{
                    ...styles.typeBtn,
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
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Medication</h4>
              <div style={styles.formGrid}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Medication</label>
                  <select value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} style={s.select}>
                    <option value="">Select...</option>
                    {selectedType.medications.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {selectedType.dosages && !hasDosageNotes && (
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Dosage</label>
                    <select value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} style={s.select}>
                      <option value="">Select...</option>
                      {selectedType.dosages.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                {hasDosageNotes && (
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Dosage (write in)</label>
                    <input
                      type="text"
                      value={form.dosageNotes}
                      onChange={e => setForm({ ...form, dosageNotes: e.target.value })}
                      style={s.input}
                      placeholder="e.g., 1ml"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Schedule</h4>
            <div style={styles.formGrid}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={s.select}>
                  {selectedType?.frequencies?.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Delivery</label>
                <select value={form.deliveryMethod} onChange={e => setForm({ ...form, deliveryMethod: e.target.value })} style={s.select}>
                  <option value="take_home">Take Home</option>
                  <option value="in_clinic">In Clinic</option>
                </select>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={s.input} />
              </div>
              {isSessionBased ? (
                <div style={s.fieldGroup}>
                  <label style={s.label}>Sessions</label>
                  <select value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} style={s.select}>
                    {selectedType.sessions.map(n => <option key={n} value={n}>{n} sessions</option>)}
                  </select>
                </div>
              ) : !isOngoing && selectedType?.durations && (
                <div style={s.fieldGroup}>
                  <label style={s.label}>Duration</label>
                  <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={s.select}>
                    {selectedType.durations.map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Notes (optional)</h4>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...s.input, minHeight: '80px' }}
              placeholder="Any special instructions..."
            />
          </div>
        </div>

        {/* Footer */}
        <div style={s.modalFooter}>
          <button onClick={onClose} style={s.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={s.btnPrimary}>
            {saving ? 'Creating...' : 'Create Protocol'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  typeBtn: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s'
  }
};
