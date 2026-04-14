// /pages/admin/recovery.js
// Recovery Program Management — Enrollments, Session Tracking, Offer Ladder
// Range Medical — 2026-04-14

import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  RECOVERY_OFFERS,
  OFFER_TYPES,
  MODALITY_OPTIONS,
  ENROLLMENT_STATUS_COLORS,
  formatPrice,
  getSessionLabel,
} from '../../lib/recovery-offers';
import { Activity, Plus, Users, Zap, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';

const TABS = [
  { id: 'active', label: 'Active Enrollments' },
  { id: 'enroll', label: 'New Enrollment' },
  { id: 'history', label: 'History' },
];

export default function RecoveryAdmin() {
  const [tab, setTab] = useState('active');
  const [enrollments, setEnrollments] = useState([]);
  const [historyEnrollments, setHistoryEnrollments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sessionLogs, setSessionLogs] = useState({});

  // Enroll form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [offerType, setOfferType] = useState('SPRINT');
  const [modality, setModality] = useState('COMBINED');
  const [includeSprintBonus, setIncludeSprintBonus] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState(null);

  // Log session modal
  const [logModal, setLogModal] = useState(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logAdministeredBy, setLogAdministeredBy] = useState('');
  const [logging, setLogging] = useState(false);

  // Stats
  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const totalSessionsUsed = enrollments.reduce((sum, e) => sum + (e.sessions_used || 0), 0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Fetch active enrollments with offer + patient info
    const { data: active } = await supabase
      .from('recovery_enrollments')
      .select('*, recovery_offers(name, offer_type, base_price_cents), patients(name, email, phone)')
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });

    setEnrollments(active || []);

    // Fetch patients for enroll form
    const { data: pts } = await supabase
      .from('patients')
      .select('id, name, email, phone')
      .order('name');
    setPatients(pts || []);

    setLoading(false);
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('recovery_enrollments')
      .select('*, recovery_offers(name, offer_type, base_price_cents), patients(name, email, phone)')
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(100);
    setHistoryEnrollments(data || []);
  }

  async function loadSessionLogs(enrollmentId, protocolId) {
    if (!protocolId) return;
    const { data } = await supabase
      .from('service_logs')
      .select('id, entry_date, category, duration, administered_by, notes')
      .eq('protocol_id', protocolId)
      .in('category', ['hbot', 'red_light'])
      .order('entry_date', { ascending: false })
      .limit(30);
    setSessionLogs(prev => ({ ...prev, [enrollmentId]: data || [] }));
  }

  function toggleRow(enrollment) {
    if (expandedRow === enrollment.id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(enrollment.id);
      if (!sessionLogs[enrollment.id]) {
        loadSessionLogs(enrollment.id, enrollment.protocol_id);
      }
    }
  }

  // ── Enroll Patient ─────────────────────────────────────────────────────────

  async function handleEnroll() {
    if (!selectedPatient) {
      setEnrollMessage({ type: 'error', text: 'Select a patient' });
      return;
    }

    setEnrolling(true);
    setEnrollMessage(null);

    try {
      const res = await fetch('/api/recovery/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient,
          offer_type: offerType,
          modality_preference: modality,
          include_sprint_bonus: offerType === 'MEMBERSHIP' && includeSprintBonus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEnrollMessage({ type: 'success', text: `Enrolled in ${RECOVERY_OFFERS[offerType].name}` });
        setSelectedPatient('');
        setPatientSearch('');
        loadData();
        setTimeout(() => setTab('active'), 1500);
      } else {
        setEnrollMessage({ type: 'error', text: data.error || 'Enrollment failed' });
      }
    } catch (err) {
      setEnrollMessage({ type: 'error', text: err.message });
    }
    setEnrolling(false);
  }

  // ── Log Session ────────────────────────────────────────────────────────────

  async function handleLogSession() {
    if (!logModal) return;
    setLogging(true);

    try {
      const res = await fetch('/api/recovery/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: logModal.id,
          date: logDate,
          administered_by: logAdministeredBy || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLogModal(null);
        loadData();
        // Refresh logs for this enrollment
        if (logModal.protocol_id) {
          loadSessionLogs(logModal.id, logModal.protocol_id);
        }
      } else {
        alert(data.error || 'Failed to log session');
      }
    } catch (err) {
      alert(err.message);
    }
    setLogging(false);
  }

  // ── Pause / Cancel ─────────────────────────────────────────────────────────

  async function updateStatus(enrollmentId, newStatus) {
    const { error } = await supabase
      .from('recovery_enrollments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', enrollmentId);

    if (!error) loadData();
  }

  // ── Add Power Pack ─────────────────────────────────────────────────────────

  async function handleAddPowerPack(patientId) {
    if (!confirm('Add Power Pack (+8 sessions for $399)?')) return;

    const res = await fetch('/api/recovery/add-power-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId }),
    });

    const data = await res.json();
    if (data.success) {
      loadData();
    } else {
      alert(data.error || 'Failed to add Power Pack');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const filteredPatients = patientSearch.length >= 2
    ? patients.filter(p => p.name?.toLowerCase().includes(patientSearch.toLowerCase()))
    : [];

  const offer = RECOVERY_OFFERS[offerType];

  return (
    <AdminLayout title="Recovery Programs">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={sharedStyles.statCard}>
          <div style={sharedStyles.statValue}>{activeCount}</div>
          <div style={sharedStyles.statLabel}>Active Enrollments</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={sharedStyles.statValue}>{totalSessionsUsed}</div>
          <div style={sharedStyles.statLabel}>Sessions This Period</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={sharedStyles.statValue}>
            {enrollments.filter(e => e.recovery_offers?.offer_type === 'MEMBERSHIP').length}
          </div>
          <div style={sharedStyles.statLabel}>Active Members</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #e5e5e5' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'history' && historyEnrollments.length === 0) loadHistory();
            }}
            style={{
              padding: '14px 24px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #000' : '2px solid transparent',
              fontSize: '16px',
              fontWeight: tab === t.id ? '600' : '400',
              color: tab === t.id ? '#000' : '#666',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={sharedStyles.loading}>Loading...</div>
      ) : tab === 'active' ? (
        renderActiveEnrollments()
      ) : tab === 'enroll' ? (
        renderEnrollForm()
      ) : (
        renderHistory()
      )}

      {/* Log Session Modal */}
      {logModal && (
        <div style={sharedStyles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setLogModal(null); }}>
          <div style={sharedStyles.modal}>
            <div style={sharedStyles.modalHeader}>
              <h3 style={sharedStyles.modalTitle}>Log Recovery Session</h3>
              <button onClick={() => setLogModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '16px', marginBottom: '20px', color: '#333' }}>
                <strong>{logModal.patients?.name}</strong> — {logModal.recovery_offers?.name}
                <br />
                <span style={{ color: '#666' }}>
                  Modality: {getSessionLabel(logModal.modality_preference)}
                  {' | '}Sessions: {logModal.sessions_used}/{logModal.sessions_allowed}
                </span>
              </p>

              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  style={sharedStyles.input}
                />
              </div>

              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Administered By</label>
                <input
                  type="text"
                  value={logAdministeredBy}
                  onChange={e => setLogAdministeredBy(e.target.value)}
                  placeholder="Staff name"
                  style={sharedStyles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setLogModal(null)} style={sharedStyles.btnSecondary}>Cancel</button>
                <button
                  onClick={handleLogSession}
                  disabled={logging}
                  style={sharedStyles.btnPrimary}
                >
                  {logging ? 'Logging...' : 'Log Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );

  // ── Tab: Active Enrollments ──────────────────────────────────────────────

  function renderActiveEnrollments() {
    if (enrollments.length === 0) {
      return (
        <div style={sharedStyles.emptyState}>
          <div style={sharedStyles.emptyIcon}><Activity size={52} strokeWidth={1} /></div>
          <div style={sharedStyles.emptyText}>No active enrollments</div>
          <p style={{ color: '#999' }}>Enroll a patient to get started</p>
          <button onClick={() => setTab('enroll')} style={{ ...sharedStyles.btnPrimary, marginTop: '16px' }}>
            <Plus size={16} /> New Enrollment
          </button>
        </div>
      );
    }

    return (
      <div style={sharedStyles.card}>
        <table style={sharedStyles.table}>
          <thead>
            <tr>
              <th style={sharedStyles.th}>Patient</th>
              <th style={sharedStyles.th}>Program</th>
              <th style={sharedStyles.th}>Modality</th>
              <th style={sharedStyles.th}>Sessions</th>
              <th style={sharedStyles.th}>Dates</th>
              <th style={sharedStyles.th}>Status</th>
              <th style={sharedStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(e => {
              const isExpanded = expandedRow === e.id;
              const statusColor = ENROLLMENT_STATUS_COLORS[e.status] || ENROLLMENT_STATUS_COLORS.active;
              const sessionsRemaining = e.sessions_allowed - e.sessions_used;
              const progressPct = e.sessions_allowed > 0 ? Math.round((e.sessions_used / e.sessions_allowed) * 100) : 0;

              return [
                <tr
                  key={e.id}
                  onClick={() => toggleRow(e)}
                  style={{ ...sharedStyles.trHover, background: isExpanded ? '#fafafa' : '#fff' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = '#f8f8f8'}
                  onMouseLeave={ev => ev.currentTarget.style.background = isExpanded ? '#fafafa' : '#fff'}
                >
                  <td style={{ ...sharedStyles.td, fontWeight: '500' }}>{e.patients?.name || '—'}</td>
                  <td style={sharedStyles.td}>{e.recovery_offers?.name || '—'}</td>
                  <td style={sharedStyles.td}>
                    <span style={{
                      ...sharedStyles.badge,
                      background: '#f0f0f0',
                      color: '#333',
                      fontSize: '12px',
                    }}>
                      {MODALITY_OPTIONS[e.modality_preference]?.shortLabel || e.modality_preference}
                    </span>
                  </td>
                  <td style={sharedStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', fontSize: '18px' }}>{e.sessions_used}</span>
                      <span style={{ color: '#999' }}>/ {e.sessions_allowed}</span>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: '#eee',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: progressPct >= 100 ? '#ef4444' : '#22c55e',
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...sharedStyles.td, fontSize: '14px', color: '#666' }}>
                    {e.start_date}
                    {e.end_date && ` — ${e.end_date}`}
                    {e.cycle_end && ` (cycle ends ${e.cycle_end})`}
                  </td>
                  <td style={sharedStyles.td}>
                    <span style={{
                      ...sharedStyles.badge,
                      background: statusColor.bg,
                      color: statusColor.text,
                    }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={sharedStyles.td}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </td>
                </tr>,

                isExpanded && (
                  <tr key={`${e.id}-detail`}>
                    <td colSpan={7} style={{ padding: '0', background: '#fafafa' }}>
                      <div style={{ padding: '20px 24px' }}>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); setLogModal(e); setLogDate(new Date().toISOString().split('T')[0]); }}
                            style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall }}
                            disabled={sessionsRemaining <= 0}
                          >
                            <Zap size={14} /> Log Session
                          </button>

                          {e.recovery_offers?.offer_type === 'MEMBERSHIP' && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleAddPowerPack(e.patient_id); }}
                              style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
                            >
                              <Plus size={14} /> Power Pack (+8)
                            </button>
                          )}

                          {e.status === 'active' && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); updateStatus(e.id, 'paused'); }}
                              style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
                            >
                              Pause
                            </button>
                          )}

                          {e.status === 'paused' && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); updateStatus(e.id, 'active'); }}
                              style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}
                            >
                              Resume
                            </button>
                          )}

                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              if (confirm('Cancel this enrollment?')) updateStatus(e.id, 'cancelled');
                            }}
                            style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, ...sharedStyles.btnDanger }}
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Symptom scores */}
                        {e.symptom_score_baseline && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Symptom Scores
                            </div>
                            <div style={{ display: 'flex', gap: '24px' }}>
                              {['pain', 'recovery', 'energy'].map(key => (
                                <div key={key}>
                                  <span style={{ fontSize: '13px', color: '#999', textTransform: 'capitalize' }}>{key}: </span>
                                  <span style={{ fontWeight: '600' }}>{e.symptom_score_baseline[key]}/10</span>
                                  {e.symptom_score_day14 && (
                                    <span style={{ color: '#22c55e', marginLeft: '6px' }}>
                                      → {e.symptom_score_day14[key]}/10
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Session log */}
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Session Log
                        </div>
                        {sessionLogs[e.id] && sessionLogs[e.id].length > 0 ? (
                          <table style={{ ...sharedStyles.table, fontSize: '14px' }}>
                            <thead>
                              <tr>
                                <th style={{ ...sharedStyles.th, fontSize: '12px', padding: '8px 12px' }}>Date</th>
                                <th style={{ ...sharedStyles.th, fontSize: '12px', padding: '8px 12px' }}>Type</th>
                                <th style={{ ...sharedStyles.th, fontSize: '12px', padding: '8px 12px' }}>Duration</th>
                                <th style={{ ...sharedStyles.th, fontSize: '12px', padding: '8px 12px' }}>By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessionLogs[e.id].map(log => (
                                <tr key={log.id}>
                                  <td style={{ ...sharedStyles.td, padding: '8px 12px', fontSize: '14px' }}>{log.entry_date}</td>
                                  <td style={{ ...sharedStyles.td, padding: '8px 12px', fontSize: '14px' }}>
                                    {log.category === 'hbot' ? 'HBOT' : 'Red Light'}
                                  </td>
                                  <td style={{ ...sharedStyles.td, padding: '8px 12px', fontSize: '14px' }}>
                                    {log.duration ? `${log.duration} min` : '—'}
                                  </td>
                                  <td style={{ ...sharedStyles.td, padding: '8px 12px', fontSize: '14px' }}>
                                    {log.administered_by || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ color: '#999', fontSize: '14px' }}>No sessions logged yet</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Tab: Enroll Form ───────────────────────────────────────────────────────

  function renderEnrollForm() {
    return (
      <div style={{ maxWidth: '720px' }}>
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Enroll Patient in Recovery Program</h3>
          </div>
          <div style={sharedStyles.cardBody}>
            {/* Patient search */}
            <div style={sharedStyles.fieldGroup}>
              <label style={sharedStyles.label}>Patient</label>
              <input
                type="text"
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(''); }}
                placeholder="Search by name..."
                style={sharedStyles.input}
              />
              {filteredPatients.length > 0 && !selectedPatient && (
                <div style={{
                  border: '1px solid #ddd',
                  maxHeight: '200px',
                  overflow: 'auto',
                  marginTop: '-1px',
                }}>
                  {filteredPatients.slice(0, 10).map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedPatient(p.id); setPatientSearch(p.name); }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        fontSize: '16px',
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.background = '#f8f8f8'}
                      onMouseLeave={ev => ev.currentTarget.style.background = '#fff'}
                    >
                      {p.name}
                      {p.email && <span style={{ color: '#999', marginLeft: '12px', fontSize: '14px' }}>{p.email}</span>}
                    </div>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#22c55e', fontWeight: '500' }}>
                  Selected: {patientSearch}
                </div>
              )}
            </div>

            {/* Offer type */}
            <div style={sharedStyles.fieldGroup}>
              <label style={sharedStyles.label}>Program</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(RECOVERY_OFFERS).filter(([key]) => key !== 'ADD_ON').map(([key, o]) => (
                  <div
                    key={key}
                    onClick={() => setOfferType(key)}
                    style={{
                      padding: '16px',
                      border: offerType === key ? '2px solid #000' : '1px solid #ddd',
                      cursor: 'pointer',
                      background: offerType === key ? '#fafafa' : '#fff',
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{o.name}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{o.description}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      {o.priceCents > 0 && (
                        <span style={{ fontWeight: '700', fontSize: '20px' }}>{formatPrice(o.priceCents)}</span>
                      )}
                      {o.rackRateCents && (
                        <span style={{ color: '#999', fontSize: '14px' }}>
                          Value: {formatPrice(o.rackRateCents)}
                        </span>
                      )}
                      {key === 'SINGLE_SESSION' && (
                        <span style={{ fontSize: '14px', color: '#666' }}>HBOT $185 / RLT $85</span>
                      )}
                    </div>
                    {o.isMembership && (
                      <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '6px', fontWeight: '500' }}>
                        Per 28-day cycle
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Sprint bonus toggle */}
            {offerType === 'MEMBERSHIP' && (
              <div style={{ ...sharedStyles.fieldGroup, background: '#f0fdf4', padding: '16px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px' }}>
                  <input
                    type="checkbox"
                    checked={includeSprintBonus}
                    onChange={e => setIncludeSprintBonus(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>
                    <strong>Include 14-Day Sprint as new-member bonus</strong>
                    <br />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Sprint ($997 value) included at no extra charge — the continuity bonus
                    </span>
                  </span>
                </label>
              </div>
            )}

            {/* Modality preference */}
            <div style={sharedStyles.fieldGroup}>
              <label style={sharedStyles.label}>Modality Preference</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {Object.entries(MODALITY_OPTIONS).map(([key, opt]) => (
                  <div
                    key={key}
                    onClick={() => setModality(key)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: modality === key ? '2px solid #000' : '1px solid #ddd',
                      cursor: 'pointer',
                      background: modality === key ? '#fafafa' : '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{opt.label}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{opt.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            {enrollMessage && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                background: enrollMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: enrollMessage.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '15px',
                fontWeight: '500',
              }}>
                {enrollMessage.text}
              </div>
            )}

            <button
              onClick={handleEnroll}
              disabled={enrolling || !selectedPatient}
              style={{
                ...sharedStyles.btnPrimary,
                width: '100%',
                justifyContent: 'center',
                opacity: enrolling || !selectedPatient ? 0.5 : 1,
              }}
            >
              {enrolling ? 'Enrolling...' : `Enroll in ${offer?.name || 'Program'}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab: History ───────────────────────────────────────────────────────────

  function renderHistory() {
    if (historyEnrollments.length === 0) {
      return (
        <div style={sharedStyles.emptyState}>
          <div style={sharedStyles.emptyIcon}><Clock size={52} strokeWidth={1} /></div>
          <div style={sharedStyles.emptyText}>No completed enrollments yet</div>
        </div>
      );
    }

    return (
      <div style={sharedStyles.card}>
        <table style={sharedStyles.table}>
          <thead>
            <tr>
              <th style={sharedStyles.th}>Patient</th>
              <th style={sharedStyles.th}>Program</th>
              <th style={sharedStyles.th}>Modality</th>
              <th style={sharedStyles.th}>Sessions Used</th>
              <th style={sharedStyles.th}>Dates</th>
              <th style={sharedStyles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {historyEnrollments.map(e => {
              const statusColor = ENROLLMENT_STATUS_COLORS[e.status] || ENROLLMENT_STATUS_COLORS.completed;
              return (
                <tr key={e.id}>
                  <td style={{ ...sharedStyles.td, fontWeight: '500' }}>{e.patients?.name || '—'}</td>
                  <td style={sharedStyles.td}>{e.recovery_offers?.name || '—'}</td>
                  <td style={sharedStyles.td}>
                    {MODALITY_OPTIONS[e.modality_preference]?.shortLabel || e.modality_preference}
                  </td>
                  <td style={sharedStyles.td}>{e.sessions_used} / {e.sessions_allowed}</td>
                  <td style={{ ...sharedStyles.td, fontSize: '14px', color: '#666' }}>
                    {e.start_date}{e.end_date && ` — ${e.end_date}`}
                  </td>
                  <td style={sharedStyles.td}>
                    <span style={{ ...sharedStyles.badge, background: statusColor.bg, color: statusColor.text }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
