// /pages/admin/purchases.js
// Purchase History Dashboard - With New Protocol System
// Range Medical
//
// ============================================
// FEATURES:
// - Create Protocol modal with new type-based system
// - Add to Existing Protocol (extend days or add sessions)
// - Edit Amount for discount tracking
// - Link Contacts batch operation
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const CATEGORIES = [
  'All', 'Peptide', 'Weight Loss', 'IV Therapy', 'Injection',
  'Labs', 'HRT', 'Hyperbaric', 'Red Light', 'Consultation', 'Product', 'Other'
];

// ============================================
// NEW PROTOCOL TYPE SYSTEM
// ============================================
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
    durations: [
      { value: 10, label: '10 days' },
      { value: 30, label: '30 days' },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' }
    ],
    deliveryMethods: ['take_home', 'in_clinic']
  },
  hrt: {
    name: 'HRT - Testosterone',
    category: 'HRT',
    medications: ['Testosterone Cypionate'],
    dosages: [
      { value: '0.3ml/60mg', label: '0.3ml / 60mg' },
      { value: '0.4ml/80mg', label: '0.4ml / 80mg' },
      { value: '0.5ml/100mg', label: '0.5ml / 100mg' }
    ],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    supplyTypes: [
      { value: 'prefilled', label: 'Prefilled Syringes (8/month)' },
      { value: 'vial', label: 'Vial (10ml)' }
    ],
    deliveryMethods: ['take_home', 'in_clinic'],
    ongoing: true
  },
  weight_loss: {
    name: 'Weight Loss',
    category: 'Weight Loss',
    medications: ['Semaglutide', 'Tirzepatide', 'Retatrutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    deliveryMethods: ['take_home', 'in_clinic'],
    ongoing: true
  },
  red_light: {
    name: 'Red Light Therapy',
    category: 'Red Light',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    deliveryMethods: ['in_clinic']
  },
  hbot: {
    name: 'Hyperbaric Oxygen Therapy',
    category: 'Hyperbaric',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    deliveryMethods: ['in_clinic']
  },
  iv_therapy: {
    name: 'IV Therapy',
    category: 'IV Therapy',
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    deliveryMethods: ['in_clinic']
  },
  injection_pack: {
    name: 'Injection Pack',
    category: 'Injection',
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    deliveryMethods: ['in_clinic']
  }
};

// Map purchase category to protocol type
const CATEGORY_TO_TYPE = {
  'Peptide': 'peptide',
  'HRT': 'hrt',
  'Weight Loss': 'weight_loss',
  'Red Light': 'red_light',
  'Hyperbaric': 'hbot',
  'IV Therapy': 'iv_therapy',
  'Injection': 'injection_pack'
};

// ============================================
// CREATE PROTOCOL MODAL - NEW SYSTEM
// ============================================
function CreateProtocolModal({ purchase, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Determine initial type from purchase category
  const initialType = CATEGORY_TO_TYPE[purchase?.category] || 'peptide';
  
  const [form, setForm] = useState({
    protocolType: initialType,
    patientName: purchase?.patient_name || '',
    patientPhone: purchase?.patient_phone || '',
    patientEmail: purchase?.patient_email || '',
    ghlContactId: purchase?.ghl_contact_id || '',
    
    medication: '',
    dosage: '',
    frequency: PROTOCOL_TYPES[initialType]?.frequencies?.[0]?.value || 'daily',
    deliveryMethod: PROTOCOL_TYPES[initialType]?.deliveryMethods?.[0] || 'take_home',
    
    startDate: new Date().toISOString().split('T')[0],
    duration: PROTOCOL_TYPES[initialType]?.durations?.[0]?.value || 10,
    totalSessions: purchase?.quantity || 1,
    
    supplyType: '',
    notes: ''
  });

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isSessionBased = !!selectedType?.sessions;
  const isOngoing = selectedType?.ongoing;

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    setForm(prev => ({
      ...prev,
      protocolType: type,
      medication: '',
      dosage: '',
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: typeConfig?.deliveryMethods?.[0] || 'take_home',
      duration: typeConfig?.durations?.[0]?.value || 10,
      totalSessions: typeConfig?.sessions?.[0] || purchase?.quantity || 1,
      supplyType: ''
    }));
  };

  const handleSubmit = async () => {
    if (!form.patientName?.trim()) {
      setError('Patient name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Map new types to database-allowed program_type values
      const programTypeMap = {
        'peptide': form.duration == 10 ? 'recovery_jumpstart_10day' : 
                   form.duration == 30 ? 'month_program_30day' : 
                   form.duration == 28 ? 'maintenance_4week' : 'recovery_jumpstart_10day',
        'hrt': 'hrt_male_membership',
        'weight_loss': 'weight_loss_program',
        'red_light': 'red_light_sessions',
        'hbot': 'hbot_sessions',
        'iv_therapy': 'iv_therapy',
        'injection_pack': 'injection_pack'
      };

      // Build protocol data matching existing database schema
      const protocolData = {
        ghl_contact_id: form.ghlContactId || null,
        patient_name: form.patientName,
        patient_email: form.patientEmail,
        patient_phone: form.patientPhone,
        purchase_id: purchase.id,
        
        // Use mapped program_type for database constraint
        program_name: buildProtocolName(),
        program_type: programTypeMap[form.protocolType] || 'recovery_jumpstart_10day',
        
        // Medication details
        primary_peptide: form.medication,
        dose_amount: form.dosage,
        dose_frequency: form.frequency,
        injection_location: form.deliveryMethod,
        
        // Duration
        start_date: form.startDate,
        duration_days: isSessionBased ? null : (isOngoing ? null : parseInt(form.duration)),
        total_sessions: isSessionBased ? parseInt(form.totalSessions) : (isOngoing ? null : parseInt(form.duration)),
        end_date: calculateEndDate(),
        
        // Standard fields
        notes: form.notes,
        reminders_enabled: !isSessionBased,
        status: 'active',
        amount: purchase.amount
      };

      const res = await fetch('/api/admin/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to create protocol');
      }

      onSuccess();
    } catch (err) {
      console.error('Protocol creation error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const buildProtocolName = () => {
    if (form.protocolType === 'peptide') {
      return `${form.duration}-Day Recovery Protocol`;
    } else if (form.protocolType === 'hrt') {
      return 'HRT Protocol';
    } else if (form.protocolType === 'weight_loss') {
      return `Weight Loss - ${form.medication || 'Semaglutide'}`;
    } else if (form.protocolType === 'red_light') {
      return `Red Light Therapy (${form.totalSessions} sessions)`;
    } else if (form.protocolType === 'hbot') {
      return `HBOT (${form.totalSessions} sessions)`;
    } else if (form.protocolType === 'iv_therapy') {
      return `IV Therapy (${form.totalSessions} sessions)`;
    } else if (form.protocolType === 'injection_pack') {
      return `Injection Pack (${form.totalSessions} sessions)`;
    }
    return 'Protocol';
  };

  const calculateEndDate = () => {
    if (isOngoing || isSessionBased) return null;
    if (!form.startDate || !form.duration) return null;
    const start = new Date(form.startDate);
    start.setDate(start.getDate() + parseInt(form.duration) - 1);
    return start.toISOString().split('T')[0];
  };

  if (!purchase) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create Protocol</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
              {purchase.item_name} (${purchase.amount})
            </p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', maxHeight: '70vh', overflow: 'auto' }}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {/* Patient Info */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Patient</h3>
            <div style={modalStyles.grid}>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Name *</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })}
                  style={modalStyles.input}
                  required
                />
              </div>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Phone</label>
                <input
                  type="tel"
                  value={form.patientPhone}
                  onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>
          </div>

          {/* Protocol Type */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Protocol Type</h3>
            <div style={modalStyles.typeGrid}>
              {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  style={{
                    ...modalStyles.typeBtn,
                    background: form.protocolType === key ? '#000' : '#f5f5f5',
                    color: form.protocolType === key ? '#fff' : '#000',
                    borderColor: form.protocolType === key ? '#000' : '#ddd'
                  }}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Medication & Dosage */}
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
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Dosage</label>
                  <select
                    value={form.dosage}
                    onChange={e => setForm({ ...form, dosage: e.target.value })}
                    style={modalStyles.select}
                  >
                    <option value="">Select...</option>
                    {Array.isArray(selectedType.dosages) && selectedType.dosages.map(d => (
                      typeof d === 'string' 
                        ? <option key={d} value={d}>{d}</option>
                        : <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
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
                <label style={modalStyles.label}>Delivery</label>
                <select
                  value={form.deliveryMethod}
                  onChange={e => setForm({ ...form, deliveryMethod: e.target.value })}
                  style={modalStyles.select}
                >
                  <option value="take_home">Take Home</option>
                  <option value="in_clinic">In Clinic</option>
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
              
              {/* Duration for peptides */}
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

              {/* Sessions for therapy */}
              {selectedType?.sessions && (
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Total Sessions</label>
                  <select
                    value={form.totalSessions}
                    onChange={e => setForm({ ...form, totalSessions: e.target.value })}
                    style={modalStyles.select}
                  >
                    {selectedType.sessions.map(s => (
                      <option key={s} value={s}>{s} sessions</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* HRT Supply Type */}
          {form.protocolType === 'hrt' && (
            <div style={modalStyles.section}>
              <h3 style={modalStyles.sectionTitle}>Supply</h3>
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Supply Type</label>
                <select
                  value={form.supplyType}
                  onChange={e => setForm({ ...form, supplyType: e.target.value })}
                  style={modalStyles.select}
                >
                  <option value="">Select...</option>
                  {selectedType.supplyTypes?.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={modalStyles.section}>
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...modalStyles.input, minHeight: '60px', resize: 'vertical' }}
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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

// ============================================
// ADD TO EXISTING PROTOCOL MODAL
// ============================================
function AddToProtocolModal({ purchase, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState('');
  const [extensionDays, setExtensionDays] = useState(30);
  const [additionalSessions, setAdditionalSessions] = useState(purchase?.quantity || 1);
  const [notes, setNotes] = useState('');

  // Determine extension type based on purchase category
  const isDurationBased = ['Peptide', 'Weight Loss', 'HRT'].includes(purchase?.category);

  useEffect(() => {
    if (purchase?.ghl_contact_id) {
      fetchProtocols();
    } else {
      setLoading(false);
    }
  }, [purchase]);

  const fetchProtocols = async () => {
    try {
      // Fetch both active AND completed protocols so we can extend completed ones
      const res = await fetch(`/api/admin/protocols?ghl_contact_id=${purchase.ghl_contact_id}&status=active,completed`);
      if (res.ok) {
        const data = await res.json();
        const list = data.protocols || data;
        
        // Filter to matching category
        const categoryMap = {
          'Peptide': ['peptide', 'recovery', 'jumpstart', 'month', 'maintenance'],
          'Weight Loss': ['weight_loss', 'semaglutide', 'tirzepatide'],
          'HRT': ['hrt', 'testosterone'],
          'IV Therapy': ['iv_therapy'],
          'Red Light': ['red_light'],
          'Hyperbaric': ['hbot'],
          'Injection': ['injection']
        };
        
        const keywords = categoryMap[purchase?.category] || [];
        const filtered = list.filter(p => {
          const searchStr = `${p.program_name || ''} ${p.program_type || ''} ${p.primary_peptide || ''}`.toLowerCase();
          return keywords.some(k => searchStr.includes(k.toLowerCase()));
        });
        
        // Sort: active first, then completed, most recent first
        const sorted = (filtered.length > 0 ? filtered : list).sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;
          return new Date(b.end_date || b.start_date) - new Date(a.end_date || a.start_date);
        });
        
        setProtocols(sorted);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProtocolId) {
      setError('Please select a protocol');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);

      if (isDurationBased) {
        // Extend protocol by days
        await fetch(`/api/admin/protocols/${selectedProtocolId}/extend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            days: parseInt(extensionDays),
            notes: `Extended ${extensionDays} days from ${purchase.item_name}${notes ? ` - ${notes}` : ''}`
          })
        });
      } else {
        // Add sessions
        const currentSessions = selectedProtocol?.total_sessions || 0;
        const newTotal = currentSessions + parseInt(additionalSessions);
        
        await fetch(`/api/admin/protocols?id=${selectedProtocolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_sessions: newTotal,
            notes: `${selectedProtocol?.notes || ''}\n[${new Date().toLocaleDateString()}] Added ${additionalSessions} sessions - ${purchase.item_name}${notes ? ` - ${notes}` : ''}`
          })
        });
      }

      // Link purchase to protocol
      await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_id: selectedProtocolId })
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!purchase) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.container, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Add to Existing Protocol</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
              {purchase.item_name} (${purchase.amount})
            </p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={{ padding: '20px' }}>
          {error && <div style={modalStyles.error}>{error}</div>}

          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading protocols...</p>
          ) : protocols.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>No active protocols found for this patient.</p>
              <p style={{ fontSize: '13px' }}>Create a new protocol instead.</p>
            </div>
          ) : (
            <>
              {/* Protocol Selection */}
              <div style={modalStyles.field}>
                <label style={modalStyles.label}>Select Protocol</label>
                <select
                  value={selectedProtocolId}
                  onChange={e => setSelectedProtocolId(e.target.value)}
                  style={modalStyles.select}
                >
                  <option value="">Choose a protocol...</option>
                  {protocols.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.status === 'completed' ? '✓ ' : '● '}{p.program_name || p.primary_peptide || 'Protocol'} ({p.status}) - Ended {new Date(p.end_date || p.start_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {selectedProtocolId && protocols.find(p => p.id === selectedProtocolId)?.status === 'completed' && (
                  <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px' }}>
                    ✓ This will reactivate the completed protocol
                  </p>
                )}
              </div>

              {/* Extension Amount */}
              {isDurationBased ? (
                <div style={{ ...modalStyles.field, marginTop: '16px' }}>
                  <label style={modalStyles.label}>Extend by (days)</label>
                  <select
                    value={extensionDays}
                    onChange={e => setExtensionDays(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="10">10 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              ) : (
                <div style={{ ...modalStyles.field, marginTop: '16px' }}>
                  <label style={modalStyles.label}>Add Sessions</label>
                  <select
                    value={additionalSessions}
                    onChange={e => setAdditionalSessions(e.target.value)}
                    style={modalStyles.select}
                  >
                    <option value="1">1 session</option>
                    <option value="5">5 sessions</option>
                    <option value="10">10 sessions</option>
                    <option value="20">20 sessions</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div style={{ ...modalStyles.field, marginTop: '16px' }}>
                <label style={modalStyles.label}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ ...modalStyles.input, minHeight: '60px' }}
                  placeholder="Any notes about this addition..."
                />
              </div>
            </>
          )}
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={saving || !selectedProtocolId}
            style={{
              ...modalStyles.submitBtn,
              background: selectedProtocolId ? '#3b82f6' : '#ccc',
              cursor: selectedProtocolId ? 'pointer' : 'not-allowed'
            }}
          >
            {saving ? 'Adding...' : isDurationBased ? `Extend ${extensionDays} Days` : `Add ${additionalSessions} Sessions`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT AMOUNT MODAL
// ============================================
function EditAmountModal({ purchase, onClose, onSuccess }) {
  const [amount, setAmount] = useState(purchase?.amount || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/purchases/${purchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      onSuccess();
    } catch (err) {
      alert('Failed to update amount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{ ...modalStyles.container, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Edit Amount</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
            {purchase?.patient_name} - {purchase?.item_name}
          </p>
          {purchase?.list_price && (
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#999' }}>
              List price: ${purchase.list_price}
            </p>
          )}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Actual Amount Paid</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={modalStyles.input}
              step="0.01"
            />
          </div>
        </div>
        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={modalStyles.submitBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODAL STYLES
// ============================================
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  container: {
    background: 'white', borderRadius: '12px', width: '100%',
    maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', margin: '20px'
  },
  header: {
    padding: '20px', background: '#000', color: '#fff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#fff',
    fontSize: '24px', cursor: 'pointer', lineHeight: 1
  },
  footer: {
    padding: '16px 20px', borderTop: '1px solid #eee',
    display: 'flex', gap: '12px', justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '10px 20px', background: '#f5f5f5', border: 'none',
    borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 24px', background: '#000', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer'
  },
  error: {
    padding: '12px', background: '#fee2e2', color: '#dc2626',
    borderRadius: '6px', fontSize: '14px', marginBottom: '16px'
  },
  section: { marginBottom: '20px' },
  sectionTitle: {
    fontSize: '13px', fontWeight: '600', color: '#666',
    margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#666' },
  input: {
    padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px',
    fontSize: '14px', fontFamily: 'inherit'
  },
  select: {
    padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px',
    fontSize: '14px', background: '#fff'
  },
  typeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px'
  },
  typeBtn: {
    padding: '10px 8px', border: '1px solid', borderRadius: '6px',
    fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
  }
};

// ============================================
// MAIN PURCHASES PAGE
// ============================================
export default function AdminPurchases() {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, revenue: 0 });
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [showNeedsReview, setShowNeedsReview] = useState(false);
  
  const [createPurchase, setCreatePurchase] = useState(null);
  const [addToPurchase, setAddToPurchase] = useState(null);
  const [editAmountPurchase, setEditAmountPurchase] = useState(null);
  
  const [linking, setLinking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [categoryFilter, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPurchases(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange !== 'all') params.append('days', dateRange);
      params.append('limit', '500');
      
      const res = await fetch(`/api/admin/purchases?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setPurchases(data.purchases || []);
      setStats({ total: data.total || 0, revenue: data.revenue || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (purchase) => {
    if (!confirm(`Delete purchase "${purchase.item_name}" for ${purchase.patient_name}?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/purchases/${purchase.id}`, { method: 'DELETE' });
      fetchPurchases();
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleLinkContacts = async () => {
    if (!confirm('Match purchases to patients and fill in missing contact info?')) return;
    setLinking(true);
    try {
      const res = await fetch('/api/admin/purchases/link-contacts', { method: 'POST' });
      const data = await res.json();
      alert(`Linked ${data.updated || 0} purchases`);
      fetchPurchases();
    } catch (err) {
      alert('Failed to link contacts');
    } finally {
      setLinking(false);
    }
  };

  const handleSuccess = () => {
    setCreatePurchase(null);
    setAddToPurchase(null);
    setEditAmountPurchase(null);
    fetchPurchases();
  };

  const getCategoryColor = (cat) => {
    const colors = {
      'Peptide': { bg: '#dbeafe', text: '#1e40af' },
      'Weight Loss': { bg: '#dcfce7', text: '#166534' },
      'HRT': { bg: '#fce7f3', text: '#9d174d' },
      'IV Therapy': { bg: '#e0e7ff', text: '#3730a3' },
      'Hyperbaric': { bg: '#fef3c7', text: '#92400e' },
      'Red Light': { bg: '#fee2e2', text: '#991b1b' },
      'Labs': { bg: '#f3f4f6', text: '#374151' },
      'Injection': { bg: '#e0f2fe', text: '#0369a1' }
    };
    return colors[cat] || { bg: '#f5f5f5', text: '#666' };
  };

  const isSessionPurchase = (p) => {
    return ['IV Therapy', 'Red Light', 'Hyperbaric', 'Injection'].includes(p.category);
  };

  const needsReviewCount = purchases.filter(p => p.list_price && p.list_price === p.amount).length;

  return (
    <>
      <Head><title>Purchases | Range Medical</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Header */}
        <header style={{ background: '#000', color: '#fff', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Purchases</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/admin/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
              <Link href="/admin/protocols" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>Protocols</Link>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 24px', display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Purchases</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>${stats.revenue?.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '200px' }}
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={() => setShowNeedsReview(!showNeedsReview)}
            style={{
              padding: '8px 12px',
              background: showNeedsReview ? '#fef3c7' : '#f5f5f5',
              border: showNeedsReview ? '2px solid #f59e0b' : '1px solid #ddd',
              borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
            }}
          >
            ⚠️ Review ({needsReviewCount})
          </button>
          <button onClick={fetchPurchases} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
            Refresh
          </button>
          <button onClick={handleLinkContacts} disabled={linking} style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
            {linking ? 'Linking...' : '🔗 Link Contacts'}
          </button>
        </div>

        {/* Table */}
        <div style={{ padding: '24px', overflow: 'auto' }}>
          {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
          
          <table style={{ width: '100%', background: '#fff', borderRadius: '8px', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Item</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Qty</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>List</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Paid</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Protocol</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No purchases found</td></tr>
              ) : (
                purchases
                  .filter(p => !showNeedsReview || (p.list_price && p.list_price === p.amount))
                  .map(purchase => {
                    const catColor = getCategoryColor(purchase.category);
                    const needsReview = purchase.list_price && purchase.list_price === purchase.amount;
                    return (
                      <tr key={purchase.id} style={{ borderBottom: '1px solid #f0f0f0', background: needsReview ? '#fffbeb' : '#fff' }}>
                        <td style={{ padding: '12px 16px' }}>
                          {new Date(purchase.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {purchase.ghl_contact_id ? (
                            <Link href={`/admin/patient/${purchase.ghl_contact_id}`} style={{ fontWeight: '500', color: '#1565c0', textDecoration: 'none' }}>
                              {purchase.patient_name}
                            </Link>
                          ) : (
                            <span style={{ fontWeight: '500' }}>{purchase.patient_name}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: '250px' }}>{purchase.item_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{purchase.quantity || 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', background: catColor.bg, color: catColor.text }}>
                            {purchase.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#666' }}>
                          {purchase.list_price ? `$${purchase.list_price}` : '-'}
                        </td>
                        <td 
                          onClick={() => setEditAmountPurchase(purchase)}
                          style={{ 
                            padding: '12px 16px', textAlign: 'right', fontWeight: '500', cursor: 'pointer',
                            background: needsReview ? '#fef3c7' : 'transparent',
                            color: needsReview ? '#b45309' : (purchase.list_price && purchase.list_price !== purchase.amount ? '#16a34a' : '#000')
                          }}
                        >
                          ${purchase.amount}
                          {needsReview && <span style={{ marginLeft: '4px', fontSize: '10px' }}>⚠</span>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {purchase.protocol_id ? (
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>✓ Assigned</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => setCreatePurchase(purchase)}
                                style={{ padding: '6px 10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}
                              >
                                + New
                              </button>
                              {purchase.ghl_contact_id && (
                                <button
                                  onClick={() => setAddToPurchase(purchase)}
                                  style={{ padding: '6px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                  + Existing
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(purchase)}
                            disabled={deleting}
                            style={{ padding: '4px 8px', background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {createPurchase && (
        <CreateProtocolModal purchase={createPurchase} onClose={() => setCreatePurchase(null)} onSuccess={handleSuccess} />
      )}
      {addToPurchase && (
        <AddToProtocolModal purchase={addToPurchase} onClose={() => setAddToPurchase(null)} onSuccess={handleSuccess} />
      )}
      {editAmountPurchase && (
        <EditAmountModal purchase={editAmountPurchase} onClose={() => setEditAmountPurchase(null)} onSuccess={handleSuccess} />
      )}
    </>
  );
}
