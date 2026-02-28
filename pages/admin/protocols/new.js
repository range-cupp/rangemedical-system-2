// /pages/admin/protocols/new.js
// Create New Protocol - Type-specific fields
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    medications: ['BPC-157 / TB-500', 'BPC-157', 'TB-500', 'Other'],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg', 'Custom'],
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
    maxContinuous: 120,
    breakDays: 14,
    symptoms: ['pain', 'mobility', 'swelling', 'sleep'],
    staffCheckinDays: 7
  },
  hrt: {
    name: 'HRT Protocol',
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
    symptoms: ['energy', 'mood', 'libido', 'sleep'],
    requiresLabs: true,
    symptomCheckinDays: 30
  },
  weight_loss: {
    name: 'Weight Loss',
    medications: ['Semaglutide', 'Tirzepatide', 'Retatrutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    symptoms: ['weight', 'appetite', 'nausea', 'energy', 'cravings'],
    requiresLabs: true,
    trackTitration: true,
    symptomCheckinDays: 7
  },
  red_light: {
    name: 'Red Light Therapy',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  hbot: {
    name: 'Hyperbaric Oxygen Therapy',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  }
};

export default function NewProtocol() {
  const router = useRouter();
  const { patient_id, ghl_contact_id, patient_name, patient_phone } = router.query;
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    protocolType: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    
    // Protocol details
    medication: '',
    customMedication: '',
    dosage: '',
    customDosage: '',
    frequency: '',
    deliveryMethod: 'take_home',
    
    // Duration
    startDate: new Date().toISOString().split('T')[0],
    duration: '',
    totalSessions: '',
    
    // HRT specific
    supplyType: '',
    supplyDispensedDate: '',
    
    // Weight loss specific
    currentDose: '',
    
    // Labs
    baselineLabsDate: '',
    
    notes: ''
  });

  useEffect(() => {
    if (patient_name) setForm(f => ({ ...f, patientName: patient_name }));
    if (patient_phone) setForm(f => ({ ...f, patientPhone: patient_phone }));
  }, [patient_name, patient_phone]);

  const selectedType = PROTOCOL_TYPES[form.protocolType];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/protocols/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id,
          ghl_contact_id,
          ...form,
          medication: form.medication === 'Other' || form.medication === 'Custom' 
            ? form.customMedication 
            : form.medication,
          dosage: form.dosage === 'Custom' 
            ? form.customDosage 
            : form.dosage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create protocol');

      router.push(`/admin/protocols/${data.protocol.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>New Protocol | Range Medical</title></Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Create Protocol</h1>
          <button onClick={() => router.back()} style={styles.backBtn}>← Back</button>
        </header>

        <main style={styles.main}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}

            {/* Patient Info */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Patient Information</h2>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Patient Name *</label>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={e => setForm({ ...form, patientName: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    value={form.patientPhone}
                    onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={form.patientEmail}
                    onChange={e => setForm({ ...form, patientEmail: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* Protocol Type */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Protocol Type *</h2>
              <div style={styles.typeGrid}>
                {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, protocolType: key, medication: '', dosage: '', frequency: type.frequencies?.[0]?.value || '' })}
                    style={{
                      ...styles.typeCard,
                      borderColor: form.protocolType === key ? '#000' : '#e5e5e5',
                      background: form.protocolType === key ? '#000' : '#fff',
                      color: form.protocolType === key ? '#fff' : '#000'
                    }}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Type-Specific Fields */}
            {selectedType && (
              <>
                {/* Medication & Dosage */}
                {selectedType.medications && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Medication & Dosage</h2>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Medication *</label>
                        <select
                          value={form.medication}
                          onChange={e => setForm({ ...form, medication: e.target.value })}
                          style={styles.select}
                          required
                        >
                          <option value="">Select...</option>
                          {selectedType.medications.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        {(form.medication === 'Other' || form.medication === 'Custom') && (
                          <input
                            type="text"
                            value={form.customMedication}
                            onChange={e => setForm({ ...form, customMedication: e.target.value })}
                            placeholder="Enter medication name"
                            style={{ ...styles.input, marginTop: '8px' }}
                            required
                          />
                        )}
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Dosage *</label>
                        {Array.isArray(selectedType.dosages) && typeof selectedType.dosages[0] === 'string' ? (
                          <select
                            value={form.dosage}
                            onChange={e => setForm({ ...form, dosage: e.target.value })}
                            style={styles.select}
                            required
                          >
                            <option value="">Select...</option>
                            {selectedType.dosages.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={form.dosage}
                            onChange={e => setForm({ ...form, dosage: e.target.value })}
                            style={styles.select}
                            required
                          >
                            <option value="">Select...</option>
                            {selectedType.dosages.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        )}
                        {form.dosage === 'Custom' && (
                          <input
                            type="text"
                            value={form.customDosage}
                            onChange={e => setForm({ ...form, customDosage: e.target.value })}
                            placeholder="Enter dosage"
                            style={{ ...styles.input, marginTop: '8px' }}
                            required
                          />
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Frequency & Delivery */}
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Schedule</h2>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Frequency *</label>
                      <select
                        value={form.frequency}
                        onChange={e => setForm({ ...form, frequency: e.target.value })}
                        style={styles.select}
                        required
                      >
                        {selectedType.frequencies.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {form.protocolType !== 'red_light' && form.protocolType !== 'hbot' && (
                      <div style={styles.field}>
                        <label style={styles.label}>Delivery Method *</label>
                        <select
                          value={form.deliveryMethod}
                          onChange={e => setForm({ ...form, deliveryMethod: e.target.value })}
                          style={styles.select}
                          required
                        >
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In Clinic</option>
                        </select>
                      </div>
                    )}

                    <div style={styles.field}>
                      <label style={styles.label}>Start Date *</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>

                    {/* Duration for peptides */}
                    {selectedType.durations && (
                      <div style={styles.field}>
                        <label style={styles.label}>Duration *</label>
                        <select
                          value={form.duration}
                          onChange={e => setForm({ ...form, duration: e.target.value, totalSessions: e.target.value })}
                          style={styles.select}
                          required
                        >
                          <option value="">Select...</option>
                          {selectedType.durations.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sessions for therapy */}
                    {selectedType.sessions && (
                      <div style={styles.field}>
                        <label style={styles.label}>Total Sessions *</label>
                        <select
                          value={form.totalSessions}
                          onChange={e => setForm({ ...form, totalSessions: e.target.value })}
                          style={styles.select}
                          required
                        >
                          <option value="">Select...</option>
                          {selectedType.sessions.map(s => (
                            <option key={s} value={s}>{s} sessions</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </section>

                {/* HRT Supply */}
                {form.protocolType === 'hrt' && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Supply Tracking</h2>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Supply Type *</label>
                        <select
                          value={form.supplyType}
                          onChange={e => setForm({ ...form, supplyType: e.target.value })}
                          style={styles.select}
                          required
                        >
                          <option value="">Select...</option>
                          {selectedType.supplyTypes.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Dispensed Date</label>
                        <input
                          type="date"
                          value={form.supplyDispensedDate}
                          onChange={e => setForm({ ...form, supplyDispensedDate: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Labs */}
                {selectedType.requiresLabs && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Lab Work</h2>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Baseline Labs Date</label>
                        <input
                          type="date"
                          value={form.baselineLabsDate}
                          onChange={e => setForm({ ...form, baselineLabsDate: e.target.value })}
                          style={styles.input}
                        />
                        <p style={styles.hint}>Leave blank if not yet completed</p>
                      </div>
                    </div>
                    <p style={styles.labNote}>
                      Follow-up labs will be scheduled 6-8 weeks from start date.
                    </p>
                  </section>
                )}

                {/* Max Duration Warning for Peptides */}
                {selectedType.maxContinuous && (
                  <div style={styles.warning}>
                    <strong>Note:</strong> Maximum continuous use is {selectedType.maxContinuous} days, 
                    then a {selectedType.breakDays}-day break is required.
                  </div>
                )}

                {/* Notes */}
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Notes</h2>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={styles.textarea}
                    rows={3}
                    placeholder="Any additional notes about this protocol..."
                  />
                </section>
              </>
            )}

            {/* Submit */}
            <div style={styles.actions}>
              <button type="button" onClick={() => router.back()} style={styles.cancelBtn}>
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!form.protocolType || saving}
                style={{
                  ...styles.submitBtn,
                  opacity: !form.protocolType || saving ? 0.5 : 1
                }}
              >
                {saving ? 'Creating...' : 'Create Protocol'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { background: '#000', color: '#fff', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '20px', fontWeight: '600', margin: 0 },
  backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  
  main: { maxWidth: '800px', margin: '0 auto', padding: '32px 24px' },
  form: { background: '#fff', borderRadius: '12px', overflow: 'hidden' },
  
  section: { padding: '24px', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 16px', color: '#333' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#666' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: '#fff' },
  textarea: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' },
  hint: { fontSize: '11px', color: '#999', marginTop: '4px' },
  
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  typeCard: { padding: '16px', border: '2px solid', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  
  warning: { margin: '0 24px 24px', padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e' },
  labNote: { fontSize: '13px', color: '#666', marginTop: '12px' },
  
  error: { margin: '24px', padding: '12px 16px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '14px' },
  
  actions: { padding: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '12px 24px', background: '#f5f5f5', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  submitBtn: { padding: '12px 32px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }
};
