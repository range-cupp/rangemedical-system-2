// /pages/admin/protocols/[id].js
// Protocol Detail - Clean UI
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

// Protocol type configurations
const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    medications: ['BPC-157 / TB-500', 'BPC-157', 'TB-500'],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg'],
    frequencies: [
      { value: 'daily', label: 'Once daily' },
      { value: '2x_daily', label: 'Twice daily' }
    ],
    durations: [10, 30, 60, 90]
  },
  hrt_male: {
    name: 'HRT - Testosterone (Male)',
    medications: ['Testosterone Cypionate 200mg/ml'],
    dosages: ['0.3ml / 60mg', '0.4ml / 80mg', '0.5ml / 100mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  hrt_female: {
    name: 'HRT - Testosterone (Female)',
    medications: ['Testosterone Cypionate 100mg/ml'],
    dosages: ['0.1ml / 10mg', '0.2ml / 20mg', '0.3ml / 30mg', '0.4ml / 40mg', '0.5ml / 50mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  weight_loss: {
    name: 'Weight Loss',
    medications: ['Semaglutide', 'Tirzepatide', 'Retatrutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '2.5mg', '5mg', '7.5mg', '10mg', '12.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  injection: {
    name: 'Injection',
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione 200mg', 'NAD+ 50mg', 'NAD+ 75mg', 'NAD+ 100mg', 'NAD+ 125mg', 'NAD+ 150mg'],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    sessions: [1, 5, 10, 20]
  },
  red_light: {
    name: 'Red Light Therapy',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  hbot: {
    name: 'Hyperbaric Oxygen',
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  iv_therapy: {
    name: 'IV Therapy',
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  }
};

function detectType(programType, medication) {
  const pt = (programType || '').toLowerCase();
  const med = (medication || '').toLowerCase();
  
  if (pt.includes('weight_loss') || med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) return 'weight_loss';
  if (pt.includes('hrt_female') || (pt.includes('hrt') && med.includes('100mg/ml'))) return 'hrt_female';
  if (pt.includes('hrt')) return 'hrt_male';
  if (pt.includes('red_light')) return 'red_light';
  if (pt.includes('hbot')) return 'hbot';
  if (pt.includes('iv_therapy')) return 'iv_therapy';
  if (pt.includes('injection')) return 'injection';
  return 'peptide';
}

function calculateDay(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
}

function formatFrequency(f) {
  const map = {
    daily: 'Once daily',
    '2x_daily': 'Twice daily',
    '2x_weekly': '2x per week',
    weekly: 'Weekly',
    per_session: 'Per session'
  };
  return map[f] || f || '—';
}

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  const fetchProtocol = async () => {
    try {
      const res = await fetch(`/api/admin/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      const p = data.protocol || data;
      setProtocol(p);
      
      const type = detectType(p.program_type, p.primary_peptide);
      setForm({
        protocolType: type,
        patientName: p.patient_name || '',
        patientPhone: p.patient_phone || '',
        medication: p.primary_peptide || '',
        dosage: p.dose_amount || '',
        frequency: p.dose_frequency || 'daily',
        deliveryMethod: p.injection_location || 'take_home',
        startDate: p.start_date || '',
        duration: p.duration_days || p.total_sessions || 10,
        status: p.status || 'active',
        notes: p.notes || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Calculate end date
      let endDate = null;
      if (form.startDate && form.duration) {
        const start = new Date(form.startDate);
        start.setDate(start.getDate() + parseInt(form.duration) - 1);
        endDate = start.toISOString().split('T')[0];
      }

      const res = await fetch(`/api/admin/protocols?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: form.patientName,
          patient_phone: form.patientPhone,
          primary_peptide: form.medication,
          dose_amount: form.dosage,
          dose_frequency: form.frequency,
          injection_location: form.deliveryMethod,
          start_date: form.startDate,
          end_date: endDate,
          duration_days: parseInt(form.duration),
          total_sessions: parseInt(form.duration),
          status: form.status,
          notes: form.notes
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      setSuccess('Saved!');
      setIsEditing(false);
      fetchProtocol();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Protocol">
        <div style={s.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!protocol) {
    return (
      <AdminLayout title="Protocol">
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>❌</div>
          <div style={s.emptyText}>Protocol not found</div>
          <Link href="/admin/protocols" style={{ ...s.btnPrimary, marginTop: '16px' }}>
            ← Back to Protocols
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const totalDays = protocol.total_sessions || protocol.duration_days || 10;
  const currentDay = calculateDay(protocol.start_date);
  const isComplete = currentDay > totalDays;
  const daysRemaining = Math.max(0, totalDays - currentDay);
  const selectedType = PROTOCOL_TYPES[form.protocolType] || PROTOCOL_TYPES.peptide;

  return (
    <AdminLayout title={protocol.patient_name}>
      {/* Back Link */}
      <Link href="/admin/protocols" style={styles.backLink}>
        ← Back to Protocols
      </Link>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={s.pageTitle}>{protocol.patient_name}</h1>
          <p style={s.pageSubtitle}>{protocol.program_name || selectedType.name}</p>
        </div>
        <div style={styles.headerActions}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={s.btnPrimary}>
              Edit Protocol
            </button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); fetchProtocol(); }} style={s.btnSecondary}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={s.btnPrimary}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.grid}>
        {/* Main Content */}
        <div style={styles.mainCol}>
          {/* Day Display Card */}
          {!isEditing && (
            <div style={styles.dayCard}>
              <div style={styles.dayLabel}>CURRENT DAY</div>
              {isComplete ? (
                <>
                  <div style={styles.dayComplete}>✓</div>
                  <div style={styles.dayCompleteText}>Protocol Complete</div>
                </>
              ) : currentDay < 1 ? (
                <>
                  <div style={styles.dayNotStarted}>—</div>
                  <div style={styles.dayCompleteText}>Starts {new Date(protocol.start_date).toLocaleDateString()}</div>
                </>
              ) : (
                <>
                  <div style={styles.dayDisplay}>
                    <span style={styles.currentDay}>{currentDay}</span>
                    <span style={styles.dayDivider}>/</span>
                    <span style={styles.totalDays}>{totalDays}</span>
                  </div>
                  <div style={styles.daysRemaining}>{daysRemaining} days remaining</div>
                </>
              )}
              <div style={styles.statusBadge}>
                <span style={{
                  ...s.badge,
                  ...(protocol.status === 'active' ? s.badgeActive : s.badgeCompleted)
                }}>
                  {protocol.status}
                </span>
              </div>
            </div>
          )}

          {/* Calendar (if not editing and not session-based) */}
          {!isEditing && !selectedType.sessions && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Calendar</h3>
              </div>
              <div style={styles.calendar}>
                {Array.from({ length: totalDays }, (_, i) => {
                  const dayNum = i + 1;
                  const isPast = currentDay > dayNum;
                  const isToday = currentDay === dayNum;
                  
                  return (
                    <div
                      key={dayNum}
                      style={{
                        ...styles.calendarDay,
                        background: isToday ? '#000' : isPast ? '#22c55e' : '#f5f5f5',
                        color: isToday || isPast ? '#fff' : '#666'
                      }}
                    >
                      {dayNum}
                      {isPast && <span style={styles.checkmark}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Edit Protocol</h3>
              </div>
              <div style={s.cardBody}>
                {/* Patient */}
                <div style={styles.formSection}>
                  <h4 style={styles.formSectionTitle}>Patient</h4>
                  <div style={styles.formGrid}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Name</label>
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

                {/* Medication */}
                {selectedType.medications && (
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionTitle}>Medication</h4>
                    <div style={styles.formGrid}>
                      <div style={s.fieldGroup}>
                        <label style={s.label}>Medication</label>
                        <select value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} style={s.select}>
                          <option value="">Select...</option>
                          {selectedType.medications.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      {selectedType.dosages && (
                        <div style={s.fieldGroup}>
                          <label style={s.label}>Dosage</label>
                          <select value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} style={s.select}>
                            <option value="">Select...</option>
                            {selectedType.dosages.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule */}
                <div style={styles.formSection}>
                  <h4 style={styles.formSectionTitle}>Schedule</h4>
                  <div style={styles.formGrid}>
                    <div style={s.fieldGroup}>
                      <label style={s.label}>Frequency</label>
                      <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={s.select}>
                        {selectedType.frequencies?.map(f => (
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
                    <div style={s.fieldGroup}>
                      <label style={s.label}>{selectedType.sessions ? 'Sessions' : 'Duration (days)'}</label>
                      <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={s.input} />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={styles.formSection}>
                  <h4 style={styles.formSectionTitle}>Status</h4>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={s.select}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div style={styles.formSection}>
                  <h4 style={styles.formSectionTitle}>Notes</h4>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ ...s.input, minHeight: '100px', resize: 'vertical' }}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Details (view mode) */}
          {!isEditing && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Details</h3>
              </div>
              <div style={s.cardBody}>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Medication</div>
                    <div style={styles.detailValue}>{protocol.primary_peptide || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Dosage</div>
                    <div style={styles.detailValue}>{protocol.dose_amount || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Frequency</div>
                    <div style={styles.detailValue}>{formatFrequency(protocol.dose_frequency)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Delivery</div>
                    <div style={styles.detailValue}>{protocol.injection_location === 'in_clinic' ? 'In Clinic' : 'Take Home'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Start Date</div>
                    <div style={styles.detailValue}>{protocol.start_date ? new Date(protocol.start_date).toLocaleDateString() : '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>End Date</div>
                    <div style={styles.detailValue}>{protocol.end_date ? new Date(protocol.end_date).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={styles.sideCol}>
          {/* Actions */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Actions</h3>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {protocol.ghl_contact_id && (
                <Link href={`/admin/patients/${protocol.ghl_contact_id}`} style={s.btnPrimary}>
                  👤 View Patient
                </Link>
              )}
              {protocol.patient_phone && (
                <>
                  <a href={`tel:${protocol.patient_phone}`} style={s.btnSecondary}>📞 Call</a>
                  <a href={`sms:${protocol.patient_phone}`} style={s.btnSecondary}>💬 Text</a>
                </>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Quick Info</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoLabel}>Phone</span>
                <span style={styles.quickInfoValue}>{protocol.patient_phone || '—'}</span>
              </div>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoLabel}>Email</span>
                <span style={styles.quickInfoValue}>{protocol.patient_email || '—'}</span>
              </div>
              <div style={styles.quickInfoItem}>
                <span style={styles.quickInfoLabel}>Created</span>
                <span style={styles.quickInfoValue}>
                  {protocol.created_at ? new Date(protocol.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  backLink: {
    display: 'inline-block',
    marginBottom: '16px',
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  error: {
    padding: '12px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  success: {
    padding: '12px 16px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '24px'
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  sideCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  // Day Display
  dayCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    padding: '32px',
    textAlign: 'center'
  },
  dayLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#999',
    letterSpacing: '1px',
    marginBottom: '12px'
  },
  dayDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px'
  },
  currentDay: {
    fontSize: '64px',
    fontWeight: '700',
    lineHeight: 1
  },
  dayDivider: {
    fontSize: '40px',
    color: '#ccc'
  },
  totalDays: {
    fontSize: '40px',
    color: '#999'
  },
  daysRemaining: {
    marginTop: '8px',
    color: '#666'
  },
  dayComplete: {
    fontSize: '64px',
    color: '#22c55e'
  },
  dayNotStarted: {
    fontSize: '64px',
    color: '#999'
  },
  dayCompleteText: {
    fontSize: '16px',
    color: '#22c55e',
    fontWeight: '600',
    marginTop: '8px'
  },
  statusBadge: {
    marginTop: '16px'
  },

  // Calendar
  calendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
    gap: '8px',
    padding: '20px'
  },
  calendarDay: {
    aspectRatio: '1',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  checkmark: {
    fontSize: '10px',
    marginTop: '2px'
  },

  // Form
  formSection: {
    marginBottom: '24px'
  },
  formSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },

  // Details
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  detailItem: {},
  detailLabel: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500'
  },

  // Quick Info
  quickInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  quickInfoLabel: {
    fontSize: '12px',
    color: '#666'
  },
  quickInfoValue: {
    fontSize: '12px',
    fontWeight: '500'
  }
};
