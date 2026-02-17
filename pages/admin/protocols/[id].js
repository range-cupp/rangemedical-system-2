// /pages/admin/protocols/[id].js
// Protocol Detail - Clean day tracking
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getHRTLabSchedule, matchDrawsToLogs, isHRTProtocol } from '../../../lib/hrt-lab-schedule';

// Protocol Types
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
    ]
  },
  hrt_male: {
    name: 'HRT - Testosterone (Male)',
    programTypes: ['hrt_male_membership', 'hrt_male'],
    medications: ['Testosterone Cypionate 200mg/ml'],
    dosages: ['0.3ml / 60mg', '0.4ml / 80mg', '0.5ml / 100mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  hrt_female: {
    name: 'HRT - Testosterone (Female)',
    programTypes: ['hrt_female_membership', 'hrt_female'],
    medications: ['Testosterone Cypionate 100mg/ml'],
    dosages: ['0.1ml / 10mg', '0.2ml / 20mg', '0.3ml / 30mg', '0.4ml / 40mg', '0.5ml / 50mg'],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    ongoing: true
  },
  weight_loss_semaglutide: {
    name: 'Weight Loss - Semaglutide',
    programTypes: ['weight_loss_program', 'weight_loss_semaglutide'],
    medications: ['Semaglutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  weight_loss_tirzepatide: {
    name: 'Weight Loss - Tirzepatide',
    programTypes: ['weight_loss_tirzepatide'],
    medications: ['Tirzepatide'],
    dosages: ['2.5mg', '5.0mg', '7.5mg', '10.0mg', '12.5mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  weight_loss_retatrutide: {
    name: 'Weight Loss - Retatrutide',
    programTypes: ['weight_loss_retatrutide'],
    medications: ['Retatrutide'],
    dosages: ['2mg', '4mg', '6mg', '8mg', '10mg', '12mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    ongoing: true
  },
  single_injection: {
    name: 'Single Injection',
    programTypes: ['single_injection'],
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'],
    injections: [1],
    frequencies: [{ value: 'single', label: 'Single injection' }],
    hasDosageNotes: true
  },
  injection_pack: {
    name: 'Injection Pack',
    programTypes: ['injection_pack', 'injection'],
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
    programTypes: ['red_light_sessions', 'red_light'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  hbot: {
    name: 'Hyperbaric Oxygen Therapy',
    programTypes: ['hbot_sessions', 'hbot'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }]
  },
  iv_therapy: {
    name: 'IV Therapy',
    programTypes: ['iv_therapy'],
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

function detectProtocolType(programType, medication) {
  if (!programType) return 'peptide';
  const pt = programType.toLowerCase();
  const med = (medication || '').toLowerCase();
  
  // Check weight loss by medication first
  if (pt.includes('weight_loss') || med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) {
    if (med.includes('tirzepatide')) return 'weight_loss_tirzepatide';
    if (med.includes('retatrutide')) return 'weight_loss_retatrutide';
    return 'weight_loss_semaglutide';
  }
  
  // Check HRT by gender hint
  if (pt.includes('hrt')) {
    if (pt.includes('female') || med.includes('100mg/ml')) return 'hrt_female';
    return 'hrt_male';
  }
  
  for (const [key, config] of Object.entries(PROTOCOL_TYPES)) {
    if (config.programTypes?.some(t => pt.includes(t.toLowerCase()))) {
      return key;
    }
  }
  return 'peptide';
}

function calculateCurrentDay(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
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
  const [labSchedule, setLabSchedule] = useState([]);

  useEffect(() => {
    if (id) fetchProtocol();
  }, [id]);

  const fetchProtocol = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/protocols/${id}`);
      if (!res.ok) throw new Error('Protocol not found');
      const data = await res.json();
      const p = data.protocol || data;
      setProtocol(p);
      
      const detectedType = detectProtocolType(p.program_type, p.primary_peptide);
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
        duration: p.duration_days || p.total_sessions || 10,
        totalSessions: p.total_sessions || p.duration_days || 10,
        status: p.status || 'active',
        notes: p.notes || ''
      });

      // Fetch blood draw schedule for HRT protocols
      if (isHRTProtocol(p.program_type) && p.start_date) {
        fetchLabSchedule(p);
      } else {
        setLabSchedule([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabSchedule = async (p) => {
    try {
      const res = await fetch(`/api/protocols/${p.id}`);
      const data = await res.json();
      const logs = (data.activityLogs || []).filter(l => l.log_type === 'blood_draw');

      // Fetch labs for this patient
      let patientLabs = [];
      if (p.patient_id) {
        const labsRes = await fetch(`/api/patients/${p.patient_id}`);
        const labsData = await labsRes.json();
        patientLabs = labsData.labs || [];
      }

      const schedule = getHRTLabSchedule(p.start_date);
      const matched = matchDrawsToLogs(schedule, logs, patientLabs);
      setLabSchedule(matched);
    } catch (err) {
      console.error('Error fetching lab schedule:', err);
      // Still show schedule without completion data
      const schedule = getHRTLabSchedule(p.start_date);
      setLabSchedule(schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null })));
    }
  };

  const selectedType = PROTOCOL_TYPES[form.protocolType];
  const isFormSessionBased = !!selectedType?.sessions;
  const isInjectionBased = !!selectedType?.injections;

  const handleTypeChange = (type) => {
    const typeConfig = PROTOCOL_TYPES[type];
    setForm(prev => ({
      ...prev,
      protocolType: type,
      frequency: typeConfig?.frequencies?.[0]?.value || 'daily',
      deliveryMethod: (typeConfig?.sessions || typeConfig?.injections) ? 'in_clinic' : prev.deliveryMethod
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
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
          patient_email: form.patientEmail,
          program_type: programTypeMap[form.protocolType] || protocol.program_type,
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
      setSuccess('Protocol updated');
      setIsEditing(false);
      fetchProtocol();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const isInjectionProtocol = (protocol?.program_type || '').includes('injection') || 
                              (protocol?.program_name || '').toLowerCase().includes('injection');
  
  // Session-based protocols (HBOT, Red Light, IV Therapy, Injection Packs)
  const isSessionBased = ['hbot', 'hbot_sessions', 'red_light', 'red_light_sessions', 'rlt', 
                          'iv_therapy', 'iv', 'iv_sessions', 'injection_pack'].includes(protocol?.program_type);
  
  // For session-based: track sessions_completed vs total_sessions
  const totalSessions = protocol?.total_sessions || 0;
  const sessionsCompleted = protocol?.sessions_completed || 0;
  const sessionsRemaining = totalSessions - sessionsCompleted;
  
  // For injection protocols: total = total_sessions (injection count)
  // For day protocols: total = duration_days
  const totalUnits = protocol?.total_sessions || protocol?.duration_days || 10;
  const totalDays = protocol?.duration_days || protocol?.total_sessions || 10;
  const currentDay = calculateCurrentDay(protocol?.start_date);
  
  // Calculate current injection based on frequency
  const getFrequencyPerWeek = (freq) => {
    if (!freq) return 1;
    const match = freq.match(/(\d+)x/);
    if (match) return parseInt(match[1]);
    if (freq === 'daily') return 7;
    if (freq === '2x_daily') return 14;
    if (freq === 'weekly') return 1;
    if (freq === '2x_weekly') return 2;
    return 1;
  };
  
  const frequencyPerWeek = getFrequencyPerWeek(protocol?.dose_frequency);
  const currentInjection = isInjectionProtocol 
    ? Math.min(Math.ceil(currentDay * frequencyPerWeek / 7), totalUnits)
    : currentDay;
  
  const isActive = protocol?.status === 'active';
  const isComplete = isSessionBased 
    ? sessionsRemaining <= 0
    : (isInjectionProtocol 
        ? currentInjection >= totalUnits 
        : currentDay > totalDays);

  if (loading) {
    return <div style={styles.loadingContainer}><div style={styles.loading}>Loading...</div></div>;
  }

  return (
    <>
      <Head>
        <title>{protocol?.patient_name} | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <Link href="/admin/protocols" style={styles.backLink}>← Protocols</Link>
            <h1 style={styles.title}>{protocol?.patient_name}</h1>
            <p style={styles.subtitle}>{protocol?.program_name || PROTOCOL_TYPES[form.protocolType]?.name}</p>
          </div>
          <div style={styles.headerActions}>
            {protocol?.patient_id && (
              <Link href={`/patients/${protocol.patient_id}`} style={styles.headerBtn}>
                Patient Profile
              </Link>
            )}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={styles.editBtn}>Edit</button>
            ) : (
              <>
                <button onClick={() => { setIsEditing(false); fetchProtocol(); }} style={styles.headerBtn}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </header>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <div style={styles.content}>
          {/* Left: Main Content */}
          <div style={styles.mainCol}>
            {/* BIG DAY/SESSION DISPLAY */}
            {!isEditing && (
              <div style={styles.dayCard}>
                <div style={styles.dayLabel}>
                  {isSessionBased ? 'SESSIONS USED' : (isInjectionProtocol ? 'CURRENT INJECTION' : 'CURRENT DAY')}
                </div>
                <div style={styles.dayDisplay}>
                  <span style={styles.currentDay}>
                    {isComplete ? '✓' : (
                      isSessionBased ? sessionsCompleted : (
                        isInjectionProtocol ? (currentInjection > 0 ? currentInjection : '—') : (currentDay > 0 ? currentDay : '—')
                      )
                    )}
                  </span>
                  <span style={styles.dayDivider}>/</span>
                  <span style={styles.totalDays}>{isSessionBased ? totalSessions : totalUnits}</span>
                </div>
                <div style={styles.dayStatus}>
                  {isComplete ? (
                    <span style={styles.completeText}>
                      {isSessionBased ? 'All Sessions Used' : 'Protocol Complete'}
                    </span>
                  ) : isSessionBased ? (
                    <span style={styles.activeText}>
                      {sessionsRemaining} session{sessionsRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  ) : currentDay < 1 ? (
                    <span style={styles.notStartedText}>Not Started Yet</span>
                  ) : (
                    <span style={styles.activeText}>
                      {isInjectionProtocol 
                        ? `${totalUnits - currentInjection} injections remaining`
                        : `${totalDays - currentDay} days remaining`
                      }
                    </span>
                  )}
                </div>
                
                {/* Status Badge */}
                <div style={{ marginTop: '16px' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background: isActive ? '#dcfce7' : '#f3f4f6',
                    color: isActive ? '#166534' : '#666'
                  }}>
                    {protocol?.status}
                  </span>
                </div>
              </div>
            )}

            {/* Session Grid for HBOT/RLT/IV */}
            {!isEditing && isSessionBased && totalSessions > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Session Tracker</h2>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: totalSessions }, (_, i) => {
                    const num = i + 1;
                    const isUsed = num <= sessionsCompleted;
                    const isNext = num === sessionsCompleted + 1;
                    
                    return (
                      <div
                        key={num}
                        style={{
                          ...styles.calendarDay,
                          background: isUsed ? '#22c55e' : isNext ? '#000' : '#fff',
                          color: isUsed || isNext ? '#fff' : '#000',
                          borderColor: isUsed ? '#22c55e' : isNext ? '#000' : '#e5e5e5',
                          opacity: !isUsed && !isNext ? 0.5 : 1
                        }}
                      >
                        <div style={styles.dayNumber}>{num}</div>
                        {isUsed && <div style={styles.checkmark}>✓</div>}
                        {isNext && <div style={styles.todayLabel}>NEXT</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={styles.legend}>
                  <span><span style={styles.legendDot} /> Used</span>
                  <span><span style={{ ...styles.legendDot, background: '#000' }} /> Next</span>
                  <span><span style={{ ...styles.legendDot, background: '#e5e5e5' }} /> Available</span>
                </div>
              </div>
            )}

            {/* Calendar Grid for Injection/Day protocols */}
            {!isEditing && !isSessionBased && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  {isInjectionProtocol ? 'Injection Tracker' : 'Injection Calendar'}
                </h2>
                <div style={styles.calendarGrid}>
                  {Array.from({ length: isInjectionProtocol ? totalUnits : totalDays }, (_, i) => {
                    const num = i + 1;
                    const isPast = isInjectionProtocol 
                      ? currentInjection > num 
                      : currentDay > num;
                    const isCurrent = isInjectionProtocol 
                      ? currentInjection === num 
                      : currentDay === num;
                    const isFuture = isInjectionProtocol 
                      ? currentInjection < num 
                      : currentDay < num;
                    
                    return (
                      <div
                        key={num}
                        style={{
                          ...styles.calendarDay,
                          background: isCurrent ? '#000' : isPast ? '#22c55e' : '#fff',
                          color: isCurrent || isPast ? '#fff' : '#000',
                          borderColor: isCurrent ? '#000' : isPast ? '#22c55e' : '#e5e5e5',
                          opacity: isFuture ? 0.5 : 1
                        }}
                      >
                        <div style={styles.dayNumber}>{num}</div>
                        {isPast && <div style={styles.checkmark}>✓</div>}
                        {isCurrent && <div style={styles.todayLabel}>{isInjectionProtocol ? 'NEXT' : 'TODAY'}</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={styles.legend}>
                  <span><span style={styles.legendDot} /> {isInjectionProtocol ? 'Complete' : 'Past'}</span>
                  <span><span style={{ ...styles.legendDot, background: '#000' }} /> {isInjectionProtocol ? 'Next' : 'Today'}</span>
                  <span><span style={{ ...styles.legendDot, background: '#e5e5e5' }} /> {isInjectionProtocol ? 'Upcoming' : 'Future'}</span>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {isEditing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Edit Protocol</h2>
                
                {/* Patient */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Patient</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Name *</label>
                      <input
                        type="text"
                        value={form.patientName}
                        onChange={e => setForm({ ...form, patientName: e.target.value })}
                        style={styles.input}
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
                  </div>
                </div>

                {/* Protocol Type */}
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
                    <h3 style={styles.sectionTitle}>Medication</h3>
                    <div style={styles.grid}>
                      <div style={styles.field}>
                        <label style={styles.label}>Medication</label>
                        <select value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} style={styles.select}>
                          <option value="">Select...</option>
                          {selectedType.medications.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Dosage</label>
                        {selectedType.hasDosageNotes ? (
                          <input 
                            type="text" 
                            value={form.dosage} 
                            onChange={e => setForm({ ...form, dosage: e.target.value })} 
                            style={styles.input}
                            placeholder="e.g., 100mg, 1ml"
                          />
                        ) : (
                          <select value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} style={styles.select}>
                            <option value="">Select...</option>
                            {selectedType.dosages?.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Schedule</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Frequency</label>
                      <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={styles.select}>
                        {selectedType?.frequencies?.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Delivery</label>
                      <select value={form.deliveryMethod} onChange={e => setForm({ ...form, deliveryMethod: e.target.value })} style={styles.select}>
                        <option value="take_home">Take Home</option>
                        <option value="in_clinic">In Clinic</option>
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Start Date</label>
                      <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={styles.input} />
                    </div>
                    {selectedType?.durations ? (
                      <div style={styles.field}>
                        <label style={styles.label}>Duration</label>
                        <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={styles.select}>
                          {selectedType.durations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    ) : selectedType?.injections ? (
                      <div style={styles.field}>
                        <label style={styles.label}>Injections</label>
                        <select value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} style={styles.select}>
                          {selectedType.injections.map(s => <option key={s} value={s}>{s} injection{s > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    ) : selectedType?.sessions ? (
                      <div style={styles.field}>
                        <label style={styles.label}>Sessions</label>
                        <select value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} style={styles.select}>
                          {selectedType.sessions.map(s => <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Status */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Status</h3>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.select}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Notes</h3>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ ...styles.input, minHeight: '80px' }}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            )}

            {/* Protocol Details (View Mode) */}
            {!isEditing && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Protocol Details</h2>
                <div style={styles.detailsGrid}>
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
                    <div style={styles.detailValue}>{protocol?.injection_location === 'take_home' ? '🏠 Take Home' : '🏥 In Clinic'}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Start Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.start_date)}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>End Date</div>
                    <div style={styles.detailValue}>{formatDate(protocol?.end_date)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Blood Draw Schedule (HRT only) */}
            {!isEditing && labSchedule.length > 0 && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Blood Draw Schedule</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {labSchedule.map((draw, idx) => {
                    const isLast = idx === labSchedule.length - 1;
                    const statusColor = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : '#9ca3af';
                    const statusBg = draw.status === 'completed' ? '#dcfce7' : draw.status === 'overdue' ? '#fee2e2' : '#f3f4f6';
                    return (
                      <div key={draw.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {/* Timeline line + dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                          <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: statusColor, border: '2px solid #fff',
                            boxShadow: `0 0 0 2px ${statusColor}`, flexShrink: 0, marginTop: '4px'
                          }}>
                            {draw.status === 'completed' && (
                              <span style={{ color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>✓</span>
                            )}
                          </div>
                          {!isLast && (
                            <div style={{ width: '2px', flex: 1, background: '#e5e7eb', minHeight: '32px' }} />
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: isLast ? '0' : '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{draw.label}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                              borderRadius: '10px', background: statusBg, color: statusColor,
                              textTransform: 'uppercase'
                            }}>
                              {draw.status === 'completed' ? '✓ Done' : draw.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {draw.weekLabel}
                            {draw.completedDate && (
                              <span style={{ color: '#22c55e', marginLeft: '8px' }}>
                                — Completed {formatDate(draw.completedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div style={styles.sideCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Actions</h2>
              <div style={styles.actionStack}>
                {protocol?.patient_id && (
                  <a href={`/patients/${protocol.patient_id}`} target="_blank" style={styles.actionBtn}>
                    👁️ View Patient Profile
                  </a>
                )}
                {protocol?.patient_phone && (
                  <>
                    <a href={`tel:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>📞 Call</a>
                    <a href={`sms:${protocol.patient_phone}`} style={styles.actionBtnSecondary}>💬 Text</a>
                  </>
                )}
              </div>
            </div>

            {protocol?.patient_id && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Profile Link</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/patients/${protocol.patient_id}`);
                    setSuccess('Copied!');
                  }}
                  style={styles.copyBtn}
                >
                  📋 Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFrequency(f) {
  const map = { daily: 'Once daily', '2x_daily': 'Twice daily', '2x_weekly': '2x per week', weekly: 'Weekly', per_session: 'Per session' };
  return map[f] || f || '—';
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loading: { color: '#666' },
  header: { background: '#000', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' },
  title: { margin: '4px 0 0', fontSize: '20px', fontWeight: '600' },
  subtitle: { margin: '2px 0 0', fontSize: '13px', opacity: 0.7 },
  headerActions: { display: 'flex', gap: '8px' },
  headerBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', cursor: 'pointer' },
  editBtn: { padding: '8px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '8px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  errorAlert: { margin: '16px 24px 0', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' },
  successAlert: { margin: '16px 24px 0', padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '14px' },
  content: { padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', maxWidth: '1200px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Day Display
  dayCard: { background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  dayLabel: { fontSize: '12px', fontWeight: '600', color: '#666', letterSpacing: '1px', marginBottom: '8px' },
  dayDisplay: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' },
  currentDay: { fontSize: '72px', fontWeight: '700', lineHeight: 1 },
  dayDivider: { fontSize: '48px', fontWeight: '300', color: '#ccc' },
  totalDays: { fontSize: '48px', fontWeight: '300', color: '#999' },
  dayStatus: { marginTop: '12px' },
  activeText: { fontSize: '16px', color: '#666' },
  completeText: { fontSize: '16px', color: '#22c55e', fontWeight: '600' },
  notStartedText: { fontSize: '16px', color: '#f59e0b' },
  
  // Calendar
  card: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { margin: '0 0 16px', fontSize: '15px', fontWeight: '600' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '8px' },
  calendarDay: { aspectRatio: '1', border: '2px solid', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  dayNumber: { fontWeight: '600', fontSize: '16px' },
  checkmark: { fontSize: '10px', marginTop: '2px' },
  todayLabel: { fontSize: '8px', fontWeight: '600', marginTop: '2px' },
  legend: { display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '12px', color: '#666' },
  legendDot: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e', marginRight: '4px', verticalAlign: 'middle' },
  
  // Form
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '4px' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: '#fff' },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  typeBtn: { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  
  // Details
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  detailItem: {},
  detailLabel: { fontSize: '11px', color: '#666', marginBottom: '2px' },
  detailValue: { fontSize: '14px', fontWeight: '500' },
  
  // Actions
  actionStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actionBtn: { padding: '12px', background: '#000', color: '#fff', borderRadius: '8px', textDecoration: 'none', textAlign: 'center', fontSize: '14px', fontWeight: '500' },
  actionBtnSecondary: { padding: '12px', background: '#f5f5f5', borderRadius: '8px', textDecoration: 'none', textAlign: 'center', fontSize: '14px' },
  copyBtn: { width: '100%', padding: '12px', background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }
};
