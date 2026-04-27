// /pages/admin/protocols/new.js
// Create New Protocol - Type-specific fields
// Range Medical

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getMedicationsByCategory, resolveDoseList, buildSig, buildWeightLossSig } from '../../../lib/protocol-config';

const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    medications: ['BPC-157 / TB-500', 'BPC-157', 'TB-500', 'Other'],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg', 'Custom'],
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
    ],
    maxContinuous: 120,
    breakDays: 14,
    symptoms: ['pain', 'mobility', 'swelling', 'sleep'],
    staffCheckinDays: 7
  },
  hrt: {
    // HRT uses the dynamic MEDICATION_DEFAULTS-driven flow below — these fields
    // are kept only so the type-selector card and downstream code (labs,
    // supply tracking) still recognize HRT as a valid type.
    name: 'HRT Protocol',
    supplyTypes: [
      { value: 'prefilled', label: 'Prefilled Syringes (8/month)' },
      { value: 'vial', label: 'Vial (10ml)' }
    ],
    symptoms: ['energy', 'mood', 'libido', 'sleep'],
    requiresLabs: true,
    symptomCheckinDays: 30,
    isDynamic: true,
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
  const [duplicateInfo, setDuplicateInfo] = useState(null); // { message, existing_protocol_id }
  const [existingProtocols, setExistingProtocols] = useState([]);
  const [forceCreate, setForceCreate] = useState(false);
  
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
    startDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    duration: '',
    totalSessions: '',

    // HRT specific
    hrtGender: '',          // 'male' | 'female' — drives med + dose filtering
    medicationKey: '',      // key into MEDICATION_DEFAULTS, e.g. 'Testosterone Cypionate (Male)'
    route: '',              // 'Intramuscular' | 'Subcutaneous' | 'Oral' | 'Transdermal'
    sig: '',                // generated from dose + freq + route, editable
    sigManuallyEdited: false,
    supplyType: '',
    supplyDispensedDate: '',

    // Weight loss specific
    currentDose: '',
    goalWeight: '',

    // Labs
    baselineLabsDate: '',

    notes: ''
  });

  useEffect(() => {
    if (patient_name) setForm(f => ({ ...f, patientName: patient_name }));
    if (patient_phone) setForm(f => ({ ...f, patientPhone: patient_phone }));
  }, [patient_name, patient_phone]);

  // Load existing active protocols for this patient so we can warn before creating a duplicate
  useEffect(() => {
    if (!patient_id) return;
    fetch(`/api/admin/patients/${patient_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const protos = (data?.protocols || []).filter(p => p.status === 'active');
        setExistingProtocols(protos);
      })
      .catch(() => {});
  }, [patient_id]);

  const selectedType = PROTOCOL_TYPES[form.protocolType];

  // HRT — dynamic medication options driven by MEDICATION_DEFAULTS + selected gender
  const hrtMedicationOptions = useMemo(() => {
    if (form.protocolType !== 'hrt' || !form.hrtGender) return [];
    return getMedicationsByCategory('hrt', form.hrtGender);
  }, [form.protocolType, form.hrtGender]);

  const hrtSelectedMed = useMemo(() => {
    if (form.protocolType !== 'hrt' || !form.medicationKey) return null;
    return hrtMedicationOptions.find(m => m.key === form.medicationKey) || null;
  }, [form.protocolType, form.medicationKey, hrtMedicationOptions]);

  const hrtDoseOptions = useMemo(() => resolveDoseList(hrtSelectedMed), [hrtSelectedMed]);

  // Auto-compose sig whenever the inputs change — staff can override and we
  // remember that override via sigManuallyEdited.
  useEffect(() => {
    if (form.protocolType !== 'hrt') return;
    if (form.sigManuallyEdited) return;
    if (!hrtSelectedMed || !form.dosage || !form.frequency) return;
    const route = form.route || hrtSelectedMed.route;
    const generated = buildSig({
      dose: form.dosage,
      route,
      frequency: form.frequency,
      form: hrtSelectedMed.form,
    });
    if (generated && generated !== form.sig) {
      setForm(f => ({ ...f, sig: generated, route }));
    }
  }, [form.protocolType, hrtSelectedMed, form.dosage, form.frequency, form.route, form.sigManuallyEdited]);

  // Weight loss has a fixed sig format — auto-fill from the selected dose.
  useEffect(() => {
    if (form.protocolType !== 'weight_loss') return;
    if (form.sigManuallyEdited) return;
    if (!form.dosage) return;
    const generated = buildWeightLossSig(form.dosage);
    if (generated && generated !== form.sig) {
      setForm(f => ({ ...f, sig: generated }));
    }
  }, [form.protocolType, form.dosage, form.sigManuallyEdited]);

  const submitProtocol = async (force = false) => {
    setSaving(true);
    setError('');
    setDuplicateInfo(null);

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
            : form.dosage,
          force: force || forceCreate
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        // Duplicate protocol — show a specific actionable message, don't throw generic error
        setDuplicateInfo({ message: data.details || data.error, existing_protocol_id: data.existing_protocol_id });
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Failed to create protocol');

      router.push(`/patients/${patient_id || data.protocol.patient_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitProtocol(false);
  };

  const handleForceCreate = () => {
    setForceCreate(true);
    setDuplicateInfo(null);
    submitProtocol(true);
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

            {/* Duplicate protocol alert — returned by API when active protocol already exists */}
            {duplicateInfo && (
              <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 0, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Protocol Already Exists</div>
                <div style={{ fontSize: 14, color: '#78350f', marginBottom: 10 }}>{duplicateInfo.message}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {patient_id && (
                    <Link href={`/patients/${patient_id}`} style={{ padding: '8px 14px', background: '#92400e', color: '#fff', borderRadius: 0, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      View Patient Profile →
                    </Link>
                  )}
                  <button type="button" onClick={handleForceCreate} disabled={saving} style={{ padding: '8px 14px', background: '#fff', color: '#92400e', border: '1px solid #f59e0b', borderRadius: 0, fontSize: 13, cursor: 'pointer' }}>
                    {saving ? 'Creating...' : 'Create Anyway'}
                  </button>
                </div>
              </div>
            )}

            {/* Existing active protocols warning — shown when patient already has active protocols */}
            {existingProtocols.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 0, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 6, fontSize: 13 }}>
                  ⚠️ This patient already has {existingProtocols.length} active protocol{existingProtocols.length !== 1 ? 's' : ''}:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                  {existingProtocols.map(p => (
                    <div key={p.id} style={{ fontSize: 12, color: '#78350f' }}>
                      • <strong>{p.program_name}</strong>{p.medication && p.medication !== p.program_name ? ` — ${p.medication}` : ''}
                      <span style={{ color: '#a16207' }}> (started {new Date(p.start_date).toLocaleDateString()})</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#92400e' }}>
                  A recent purchase may have already created or extended these automatically. Only proceed if this is a genuinely new protocol.
                </div>
              </div>
            )}

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
                    onClick={() => setForm({
                      ...form,
                      protocolType: key,
                      medication: '',
                      dosage: '',
                      frequency: type.frequencies?.[0]?.value || '',
                      // Reset HRT-specific fields when switching types
                      hrtGender: '',
                      medicationKey: '',
                      route: '',
                      sig: '',
                      sigManuallyEdited: false,
                    })}
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
                {/* HRT — gender-driven medication picker with auto-sig */}
                {form.protocolType === 'hrt' && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>HRT Setup</h2>

                    {/* Gender selector — drives medication + dose filtering */}
                    <div style={styles.field}>
                      <label style={styles.label}>Patient Sex *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }].map(opt => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              hrtGender: opt.v,
                              medicationKey: '',
                              medication: '',
                              dosage: '',
                              frequency: '',
                              route: '',
                              sig: '',
                              sigManuallyEdited: false,
                            }))}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              border: '2px solid',
                              borderColor: form.hrtGender === opt.v ? '#000' : '#e5e5e5',
                              background: form.hrtGender === opt.v ? '#000' : '#fff',
                              color: form.hrtGender === opt.v ? '#fff' : '#000',
                              fontSize: '14px', fontWeight: 500, cursor: 'pointer', borderRadius: 0,
                            }}
                          >
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.hrtGender && (
                      <div style={{ ...styles.grid, marginTop: '16px' }}>
                        <div style={styles.field}>
                          <label style={styles.label}>Medication *</label>
                          <select
                            value={form.medicationKey}
                            onChange={e => {
                              const key = e.target.value;
                              const meta = hrtMedicationOptions.find(m => m.key === key);
                              setForm(f => ({
                                ...f,
                                medicationKey: key,
                                medication: meta?.canonicalName || '',
                                route: meta?.route || '',
                                frequency: meta?.defaultFrequency || '',
                                dosage: '',
                                sig: '',
                                sigManuallyEdited: false,
                              }));
                            }}
                            style={styles.select}
                            required
                          >
                            <option value="">Select medication...</option>
                            {hrtMedicationOptions.map(m => (
                              <option key={m.key} value={m.key}>{m.canonicalName}</option>
                            ))}
                          </select>
                          {hrtSelectedMed && (
                            <p style={styles.hint}>
                              {hrtSelectedMed.strength} · {hrtSelectedMed.form} · {hrtSelectedMed.route}
                            </p>
                          )}
                        </div>

                        <div style={styles.field}>
                          <label style={styles.label}>Dose *</label>
                          <select
                            value={form.dosage}
                            onChange={e => setForm(f => ({ ...f, dosage: e.target.value, sig: '', sigManuallyEdited: false }))}
                            style={styles.select}
                            required
                            disabled={!hrtSelectedMed}
                          >
                            <option value="">Select...</option>
                            {hrtDoseOptions.map(d => (
                              <option key={d.value || d} value={d.value || d}>{d.label || d.value || d}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.field}>
                          <label style={styles.label}>Frequency *</label>
                          <select
                            value={form.frequency}
                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value, sig: '', sigManuallyEdited: false }))}
                            style={styles.select}
                            required
                            disabled={!hrtSelectedMed}
                          >
                            <option value="">Select...</option>
                            {(hrtSelectedMed?.frequencies || []).map(fq => (
                              <option key={fq} value={fq}>{fq}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.field}>
                          <label style={styles.label}>Route</label>
                          <select
                            value={form.route}
                            onChange={e => setForm(f => ({ ...f, route: e.target.value, sig: '', sigManuallyEdited: false }))}
                            style={styles.select}
                          >
                            <option value="">Default ({hrtSelectedMed?.route || 'auto'})</option>
                            <option value="Intramuscular">Intramuscular (IM)</option>
                            <option value="Subcutaneous">Subcutaneous (SubQ)</option>
                            <option value="Oral">Oral</option>
                            <option value="Transdermal">Transdermal</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {form.dosage && form.frequency && (
                      <div style={{ ...styles.field, marginTop: '16px' }}>
                        <label style={styles.label}>
                          Sig (Directions)
                          {!form.sigManuallyEdited && <span style={{ color: '#16a34a', fontWeight: 400, marginLeft: 6 }}>· auto-generated</span>}
                        </label>
                        <input
                          type="text"
                          value={form.sig}
                          onChange={e => setForm(f => ({ ...f, sig: e.target.value, sigManuallyEdited: true }))}
                          placeholder="e.g., Administer 0.25ml (50mg) Intramuscularly every 3.5 days"
                          style={styles.input}
                        />
                        <p style={styles.hint}>
                          Edit to override. {form.sigManuallyEdited ? 'Manual override active — won\'t auto-update if dose/frequency change.' : 'Will regenerate when dose, frequency, or route change.'}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Non-HRT — original Medication & Dosage block */}
                {form.protocolType !== 'hrt' && selectedType.medications && (
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
                            {(selectedType.dosages || []).map(d => (
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
                    {/* HRT sets its own frequency inside the HRT Setup block above */}
                    {form.protocolType !== 'hrt' && Array.isArray(selectedType.frequencies) && selectedType.frequencies.length > 0 && (
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
                    )}

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
                        <label style={styles.label}>
                          Duration (doses) *
                          {form.frequency === '2x_daily' && form.duration && (
                            <span style={{ color: '#666', fontWeight: '400' }}>
                              {' '}→ {Math.ceil(parseInt(form.duration) / 2)} actual days
                            </span>
                          )}
                        </label>
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

                {/* Goal Weight for Weight Loss */}
                {form.protocolType === 'weight_loss' && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Goal Weight</h2>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Goal Weight (lbs)</label>
                        <input
                          type="number"
                          value={form.goalWeight}
                          onChange={e => setForm({ ...form, goalWeight: e.target.value })}
                          style={styles.input}
                          placeholder="e.g. 170"
                          step="0.1"
                        />
                        <p style={styles.hint}>Optional — can also be set later on the protocol detail page</p>
                      </div>
                    </div>
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
  backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: 0, cursor: 'pointer' },
  
  main: { maxWidth: '800px', margin: '0 auto', padding: '32px 24px' },
  form: { background: '#fff', borderRadius: 0, overflow: 'hidden' },
  
  section: { padding: '24px', borderBottom: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 16px', color: '#333' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#666' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '14px' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '14px', background: '#fff' },
  textarea: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' },
  hint: { fontSize: '11px', color: '#999', marginTop: '4px' },
  
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  typeCard: { padding: '16px', border: '2px solid', borderRadius: 0, fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  
  warning: { margin: '0 24px 24px', padding: '12px 16px', background: '#fef3c7', borderRadius: 0, fontSize: '13px', color: '#92400e' },
  labNote: { fontSize: '13px', color: '#666', marginTop: '12px' },
  
  error: { margin: '24px', padding: '12px 16px', background: '#fee2e2', borderRadius: 0, color: '#dc2626', fontSize: '14px' },
  
  actions: { padding: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '12px 24px', background: '#f5f5f5', border: 'none', borderRadius: 0, fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  submitBtn: { padding: '12px 32px', background: '#000', color: '#fff', border: 'none', borderRadius: 0, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }
};
