// /pages/admin/protocols/[id].js
// Protocol Detail - Same UI as Purchases Create modal
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// PROTOCOL TYPE SYSTEM (Same as Purchases page)
// ============================================
const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    programTypes: ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'peptide'],
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
    hasCalendar: true
  },
  hrt: {
    name: 'HRT - Testosterone',
    programTypes: ['hrt_male_membership', 'hrt_female_membership', 'hrt_injection', 'hrt'],
    medications: ['Testosterone Cypionate'],
    dosages: ['0.3ml / 60mg', '0.4ml / 80mg', '0.5ml / 100mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    hasCalendar: false,
    ongoing: true
  },
  weight_loss: {
    name: 'Weight Loss',
    programTypes: ['weight_loss_program', 'weight_loss_injection', 'weight_loss'],
    medications: ['Semaglutide', 'Tirzepatide', 'Retatrutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    hasCalendar: false,
    ongoing: true
  },
  red_light: {
    name: 'Red Light Therapy',
    programTypes: ['red_light_sessions', 'red_light'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    hasCalendar: false
  },
  hbot: {
    name: 'Hyperbaric Oxygen Therapy',
    programTypes: ['hbot_sessions', 'hbot'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    hasCalendar: false
  },
  iv_therapy: {
    name: 'IV Therapy',
    programTypes: ['iv_therapy'],
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    hasCalendar: false
  },
  injection_pack: {
    name: 'Injection Pack',
    programTypes: ['injection_pack', 'injection'],
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
    hasCalendar: false
  }
};

// Detect type from program_type
function detectProtocolType(programType) {
  if (!programType) return 'peptide';
  const pt = programType.toLowerCase();
  for (const [key, config] of Object.entries(PROTOCOL_TYPES)) {
    if (config.programTypes?.some(t => pt.includes(t.toLowerCase()) || t.toLowerCase().includes(pt))) {
      return key;
    }
  }
  return 'peptide';
}

export default function ProtocolDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [protocol, setProtocol] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  
  // SMS sending
  const [sendingText, setSendingText] = useState(false);

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  const fetchProtocol = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/admin/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      
      const data = await res.json();
      const p = data.protocol || data;
      setProtocol(p);
      setSessions(data.sessions || []);
      
      // Detect protocol type
      const detectedType = detectProtocolType(p.program_type);
      
      // Initialize form
      setForm({
        protocolType: detectedType,
        patientName: p.patient_name || '',
        patientPhone: p.patient_phone || '',
        patientEmail: p.patient_email || '',
        medication: p.primary_peptide || '',
        dosage: p.dose_amount || '',
        frequency: p.dose_frequency || 'daily',
        deliveryMethod: p.injection_location || 'take_home',
        startDate: p.start_date || '',
        endDate: p.end_date || '',
        duration: p.duration_days || p.total_sessions || 10,
        totalSessions: p.total_sessions || p.duration_days || 10,
        status: p.status || 'active',
        notes: p.notes || '',
        specialInstructions: p.special_instructions || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isSessionBased = !!selectedType?.sessions;
  const isOngoing = selectedType?.ongoing;

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    setForm(prev => ({
      ...prev,
      protocolType: type,
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: typeConfig?.sessions ? 'in_clinic' : prev.deliveryMethod
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Map type to database program_type
      const programTypeMap = {
        'peptide': form.duration == 10 ? 'recovery_jumpstart_10day' : 
                   form.duration == 30 ? 'month_program_30day' : 'recovery_jumpstart_10day',
        'hrt': 'hrt_male_membership',
        'weight_loss': 'weight_loss_program',
        'red_light': 'red_light_sessions',
        'hbot': 'hbot_sessions',
        'iv_therapy': 'iv_therapy',
        'injection_pack': 'injection_pack'
      };

      const res = await fetch(`/api/admin/protocols?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: form.patientName,
          patient_phone: form.patientPhone,
          patient_email: form.patientEmail,
          program_type: programTypeMap[form.protocolType] || protocol.program_type,
          primary_peptide: form.medication,
          dose_amount: form.dosage,
          dose_frequency: form.frequency,
          injection_location: form.deliveryMethod,
          start_date: form.startDate,
          end_date: form.endDate,
          duration_days: isSessionBased ? null : parseInt(form.duration),
          total_sessions: isSessionBased ? parseInt(form.totalSessions) : parseInt(form.duration),
          status: form.status,
          notes: form.notes,
          special_instructions: form.specialInstructions
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Protocol updated successfully');
      setIsEditing(false);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSessionToggle = async (sessionNumber) => {
    try {
      const res = await fetch(`/api/admin/protocols/${id}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_number: sessionNumber })
      });

      if (res.ok) {
        fetchProtocol();
      }
    } catch (err) {
      console.error('Failed to toggle session:', err);
    }
  };

  const handleSendPortalLink = async () => {
    if (!protocol?.patient_phone) {
      setError('No phone number on file');
      return;
    }

    setSendingText(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/send-patient-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: protocol.patient_name,
          patient_phone: protocol.patient_phone,
          access_token: protocol.access_token,
          ghl_contact_id: protocol.ghl_contact_id,
          message_type: 'portal'
        })
      });

      if (res.ok) {
        setSuccess('Portal link sent!');
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingText(false);
    }
  };

  // Calculate progress
  const totalDays = protocol?.total_sessions || protocol?.duration_days || 10;
  const completedCount = sessions.filter(s => s.status === 'completed' || s.completed).length || protocol?.injections_completed || 0;
  const progressPercent = Math.round((completedCount / totalDays) * 100);

  // Days remaining
  const today = new Date();
  const endDate = protocol?.end_date ? new Date(protocol.end_date) : null;
  const daysLeft = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading protocol...</div>
      </div>
    );
  }

  if (error && !protocol) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error}</div>
        <Link href="/admin/protocols" style={styles.backLink}>← Back to Protocols</Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{protocol?.patient_name || 'Protocol'} | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <Link href="/admin/protocols" style={styles.backLink}>← Back to Protocols</Link>
            <h1 style={styles.title}>{protocol?.patient_name}</h1>
            <p style={styles.subtitle}>{protocol?.program_name || PROTOCOL_TYPES[form.protocolType]?.name || 'Protocol'}</p>
          </div>
          <div style={styles.headerActions}>
            {protocol?.ghl_contact_id && (
              <Link href={`/admin/patient/${protocol.ghl_contact_id}`} style={styles.linkBtn}>
                View Patient
              </Link>
            )}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                Edit Protocol
              </button>
            ) : (
              <>
                <button onClick={() => { setIsEditing(false); fetchProtocol(); }} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Alerts */}
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <div style={styles.content}>
          {/* Main Column */}
          <div style={styles.mainCol}>
            {/* Status Card */}
            <div style={styles.card}>
              <div style={styles.statusRow}>
                <div>
                  <div style={styles.bigNumber}>{daysLeft !== null ? daysLeft : '—'}</div>
                  <div style={styles.label}>Days Left</div>
                </div>
                <div>
                  <div style={styles.bigNumber}>{completedCount}/{totalDays}</div>
                  <div style={styles.label}>Completed</div>
                </div>
                <div>
                  <div style={styles.bigNumber}>{progressPercent}%</div>
                  <div style={styles.label}>Progress</div>
                </div>
                <div>
                  <span style={{
                    ...styles.statusBadge,
                    background: protocol?.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: protocol?.status === 'active' ? '#166534' : '#666'
                  }}>
                    {protocol?.status || 'active'}
                  </span>
                </div>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Protocol Details / Edit Form */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>{isEditing ? 'Edit Protocol' : 'Protocol Details'}</h2>
              
              {isEditing ? (
                /* EDIT MODE - Same UI as Purchases Create */
                <div>
                  {/* Patient Section */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Patient</h3>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Name *</label>
                        <input
                          type="text"
                          value={form.patientName}
                          onChange={e => setForm({ ...form, patientName: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Phone</label>
                        <input
                          type="tel"
                          value={form.patientPhone}
                          onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Protocol Type Section */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Protocol Type</h3>
                    <div style={styles.typeGrid}>
                      {Object.entries(PROTOCOL_TYPES).map(([key, type]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleTypeChange(key)}
                          style={{
                            ...styles.typeBtn,
                            background: form.protocolType === key ? '#000' : '#fff',
                            color: form.protocolType === key ? '#fff' : '#000',
                            borderColor: form.protocolType === key ? '#000' : '#ddd'
                          }}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medication Section (only for types with medications) */}
                  {selectedType?.medications && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Medication</h3>
                      <div style={styles.grid}>
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Medication</label>
                          <select
                            value={form.medication}
                            onChange={e => setForm({ ...form, medication: e.target.value })}
                            style={styles.select}
                          >
                            <option value="">Select...</option>
                            {selectedType.medications.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Dosage</label>
                          <select
                            value={form.dosage}
                            onChange={e => setForm({ ...form, dosage: e.target.value })}
                            style={styles.select}
                          >
                            <option value="">Select...</option>
                            {selectedType.dosages?.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule Section */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Schedule</h3>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Frequency</label>
                        <select
                          value={form.frequency}
                          onChange={e => setForm({ ...form, frequency: e.target.value })}
                          style={styles.select}
                        >
                          {selectedType?.frequencies?.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Delivery</label>
                        <select
                          value={form.deliveryMethod}
                          onChange={e => setForm({ ...form, deliveryMethod: e.target.value })}
                          style={styles.select}
                        >
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In Clinic</option>
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Start Date</label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={e => setForm({ ...form, startDate: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                      
                      {/* Duration for peptides */}
                      {selectedType?.durations && (
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Duration</label>
                          <select
                            value={form.duration}
                            onChange={e => setForm({ ...form, duration: e.target.value })}
                            style={styles.select}
                          >
                            {selectedType.durations.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Sessions for therapy */}
                      {selectedType?.sessions && (
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Total Sessions</label>
                          <select
                            value={form.totalSessions}
                            onChange={e => setForm({ ...form, totalSessions: e.target.value })}
                            style={styles.select}
                          >
                            {selectedType.sessions.map(s => (
                              <option key={s} value={s}>{s} sessions</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Status</h3>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.fieldLabel}>Protocol Status</label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          style={styles.select}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div style={styles.section}>
                    <div style={styles.field}>
                      <label style={styles.fieldLabel}>Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        style={{ ...styles.input, minHeight: '80px' }}
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Type</div>
                    <div style={styles.detailValue}>{PROTOCOL_TYPES[form.protocolType]?.name || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Medication</div>
                    <div style={styles.detailValue}>{protocol?.primary_peptide || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Dosage</div>
                    <div style={styles.detailValue}>{protocol?.dose_amount || '—'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Frequency</div>
                    <div style={styles.detailValue}>{formatFrequency(protocol?.dose_frequency)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Delivery</div>
                    <div style={styles.detailValue}>
                      {protocol?.injection_location === 'take_home' ? '🏠 Take Home' : '🏥 In Clinic'}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Start Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.start_date)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>End Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.end_date)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Phone</div>
                    <div style={styles.detailValue}>{protocol?.patient_phone || '—'}</div>
                  </div>
                  {protocol?.notes && (
                    <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                      <div style={styles.detailLabel}>Notes</div>
                      <div style={{ ...styles.detailValue, whiteSpace: 'pre-wrap' }}>{protocol.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Injection Calendar */}
            {selectedType?.hasCalendar !== false && !isEditing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Injection Calendar</h2>
                <p style={styles.cardSubtitle}>Click a day to mark as complete</p>
                
                <div style={styles.calendarGrid}>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const dayNum = i + 1;
                    const session = sessions.find(s => s.session_number === dayNum || s.day_number === dayNum);
                    const isComplete = session?.status === 'completed' || session?.completed;
                    
                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleSessionToggle(dayNum)}
                        style={{
                          ...styles.calendarDay,
                          background: isComplete ? '#000' : '#fff',
                          color: isComplete ? '#fff' : '#000',
                          borderColor: isComplete ? '#000' : '#ddd'
                        }}
                      >
                        <div style={styles.dayNumber}>{dayNum}</div>
                        {isComplete && <div style={styles.checkmark}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Side Column - Actions */}
          <div style={styles.sideCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Quick Actions</h2>
              
              <div style={styles.actionStack}>
                <button
                  onClick={handleSendPortalLink}
                  disabled={sendingText || !protocol?.patient_phone}
                  style={styles.actionBtn}
                >
                  {sendingText ? 'Sending...' : '📱 Send Portal Link'}
                </button>
                
                {protocol?.access_token && (
                  <a
                    href={`/portal/${protocol.access_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.actionBtnSecondary}
                  >
                    👁️ View Patient Portal
                  </a>
                )}
                
                {protocol?.patient_phone && (
                  <a href={`tel:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>
                    📞 Call Patient
                  </a>
                )}
                
                {protocol?.patient_phone && (
                  <a href={`sms:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>
                    💬 Text Patient
                  </a>
                )}
              </div>
            </div>

            {protocol?.access_token && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Portal Link</h2>
                <div style={styles.linkBox}>
                  <code style={styles.linkCode}>
                    /portal/{protocol.access_token.substring(0, 8)}...
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://app.range-medical.com/portal/${protocol.access_token}`);
                      setSuccess('Link copied!');
                    }}
                    style={styles.copyBtn}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Helpers
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFrequency(freq) {
  const map = {
    'daily': 'Once daily',
    '2x_daily': 'Twice daily',
    '2x_weekly': '2x per week',
    'weekly': 'Weekly',
    'per_session': 'Per session'
  };
  return map[freq] || freq || '—';
}

// Styles
const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  loading: { padding: '60px', textAlign: 'center', color: '#666' },
  errorBox: { padding: '20px', margin: '20px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' },
  header: { background: '#000', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  backLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '8px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '600' },
  subtitle: { margin: '4px 0 0', fontSize: '14px', opacity: 0.8 },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  linkBtn: { padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' },
  editBtn: { padding: '10px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  errorAlert: { margin: '16px 24px 0', padding: '12px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' },
  successAlert: { margin: '16px 24px 0', padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '14px' },
  content: { padding: '24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', maxWidth: '1400px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: '600' },
  cardSubtitle: { margin: '-12px 0 16px', fontSize: '13px', color: '#666' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  bigNumber: { fontSize: '32px', fontWeight: '700', lineHeight: 1 },
  label: { fontSize: '12px', color: '#666', marginTop: '4px' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' },
  progressBar: { height: '8px', background: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#000', borderRadius: '4px', transition: 'width 0.3s' },
  
  // Form styles (matching Purchases page)
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '12px', fontWeight: '600', color: '#666', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#666' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: '#fff' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  typeBtn: { padding: '12px 8px', border: '1px solid', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
  
  // View mode
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  detailItem: {},
  detailLabel: { fontSize: '12px', color: '#666', marginBottom: '4px' },
  detailValue: { fontSize: '14px', fontWeight: '500' },
  
  // Calendar
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' },
  calendarDay: { aspectRatio: '1', border: '2px solid', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
  dayNumber: { fontSize: '16px', fontWeight: '600' },
  checkmark: { fontSize: '12px', marginTop: '2px' },
  
  // Actions
  actionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  actionBtn: { padding: '12px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'center' },
  actionBtnSecondary: { padding: '12px 16px', background: '#f5f5f5', color: '#000', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'block' },
  linkBox: { display: 'flex', gap: '8px', alignItems: 'center' },
  linkCode: { flex: 1, padding: '10px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' },
  copyBtn: { padding: '10px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }
};
