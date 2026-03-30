// /components/LabsPipelineTab.js
// Labs Pipeline — Summary cards + table layout matching HRT/WL aesthetic
// Due for Labs to-do section with inline SMS
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-03-30 — V2 pipeline with 6 stages, staff ownership, and time-in-stage

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from './AdminLayout';

const LAB_STAGES = [
  { id: 'awaiting_results', label: 'Awaiting Results', color: '#f59e0b', owner: 'Primex' },
  { id: 'uploaded', label: 'Uploaded', color: '#8b5cf6', owner: 'Chris / Evan' },
  { id: 'under_review', label: 'Under Review', color: '#3b82f6', owner: 'Damien / Evan' },
  { id: 'ready_to_schedule', label: 'Ready to Schedule', color: '#f97316', owner: 'Tara' },
  { id: 'consult_scheduled', label: 'Consult Booked', color: '#6366f1', owner: null },
  { id: 'in_treatment', label: 'In Treatment', color: '#10b981', owner: null }
];


export default function LabsPipelineTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchTimer, setSearchTimer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [smsState, setSmsState] = useState({});
  const [showDueForLabs, setShowDueForLabs] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/labs-pipeline');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error('Error fetching labs pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const handleMoveStage = async (protocolId, newStage) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: protocolId, newStage })
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Error moving stage:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchData();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePatientSearch = (query) => {
    setPatientSearch(query);
    if (searchTimer) clearTimeout(searchTimer);
    if (query.length < 2) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const { data: patients } = await supabase.from('patients').select('id, name, email, phone').ilike('name', `%${query}%`).limit(8);
        setPatientResults(patients || []);
      } catch (err) { console.error('Patient search error:', err); }
    }, 300);
    setSearchTimer(timer);
  };

  // SMS handlers
  const handleSendSMS = async (patientId, patientName, phone, message) => {
    const key = patientId;
    setSmsState(prev => ({ ...prev, [key]: { ...prev[key], sending: true, error: null } }));
    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, patient_name: patientName, to: phone, message, message_type: 'lab_follow_up' })
      });
      const result = await res.json();
      if (result.success || result.messageSid) {
        setSmsState(prev => ({ ...prev, [key]: { ...prev[key], sending: false, sent: true, open: false } }));
        setTimeout(() => setSmsState(prev => ({ ...prev, [key]: { ...prev[key], sent: false } })), 3000);
      } else {
        setSmsState(prev => ({ ...prev, [key]: { ...prev[key], sending: false, error: result.error || 'Failed to send' } }));
      }
    } catch (err) {
      setSmsState(prev => ({ ...prev, [key]: { ...prev[key], sending: false, error: err.message } }));
    }
  };

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading labs pipeline...</div>;
  if (!data) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>Error loading labs pipeline</div>;

  const dueForLabs = data.dueForLabs || [];
  const scheduledForLabs = data.scheduledForLabs || [];
  const overdueCount = dueForLabs.filter(d => d.daysUntilDue < 0).length;
  const scheduledCount = scheduledForLabs.length;
  const needsOutreach = dueForLabs.length;

  return (
    <div>
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>{data.total}</div>
          <div style={styles.statLabel}>In Pipeline</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: dueForLabs.length > 0 ? '#f59e0b' : '#22c55e' }}>{dueForLabs.length}</div>
          <div style={styles.statLabel}>Due for Labs</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: overdueCount > 0 ? '#ef4444' : '#22c55e' }}>{overdueCount}</div>
          <div style={styles.statLabel}>Overdue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: needsOutreach > 0 ? '#f59e0b' : '#22c55e' }}>{needsOutreach}</div>
          <div style={styles.statLabel}>Needs Outreach</div>
        </div>
      </div>

      {/* Due for Labs Section */}
      {dueForLabs.length > 0 && (
        <div style={{ ...sharedStyles.card, marginBottom: '24px' }}>
          <div style={styles.dueHeader} onClick={() => setShowDueForLabs(!showDueForLabs)}>
            <div style={styles.dueHeaderLeft}>
              <span style={styles.dueTitle}>Due for Labs</span>
              <span style={styles.dueBadge}>{dueForLabs.length}</span>
              {scheduledCount > 0 && (
                <span style={styles.scheduledBadge}>{scheduledCount} scheduled</span>
              )}
            </div>
            <span style={styles.dueToggle}>{showDueForLabs ? '▾' : '▸'}</span>
          </div>
          {showDueForLabs && (
            <div style={{ overflowX: 'auto' }}>
              <table style={sharedStyles.table}>
                <thead>
                  <tr>
                    <th style={sharedStyles.th}>Patient</th>
                    <th style={sharedStyles.th}>Phone</th>
                    <th style={sharedStyles.th}>Draw</th>
                    <th style={sharedStyles.th}>Due</th>
                    <th style={sharedStyles.th}>Status</th>
                    <th style={sharedStyles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dueForLabs.map((item, i) => {
                    const sms = smsState[item.patientId] || {};
                    const firstName = (item.patientName || '').split(' ')[0];
                    return (
                      <tr key={i}>
                        <td style={sharedStyles.td}>
                          <Link href={`/admin/patient/${item.patientId}`} style={{ color: '#000', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                            {item.patientName}
                          </Link>
                        </td>
                        <td style={sharedStyles.td}>
                          {item.phone ? (
                            <a href={`tel:${item.phone}`} style={{ color: '#374151', textDecoration: 'none', fontSize: '13px' }}>
                              {item.phone}
                            </a>
                          ) : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        <td style={sharedStyles.td}>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{item.drawLabel}</span>
                        </td>
                        <td style={sharedStyles.td}>
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: item.daysUntilDue < 0 ? '#ef4444' : item.daysUntilDue <= 7 ? '#f59e0b' : '#374151'
                          }}>
                            {item.daysUntilDue < 0 ? `${Math.abs(item.daysUntilDue)}d overdue` : item.daysUntilDue === 0 ? 'Today' : `In ${item.daysUntilDue}d`}
                          </span>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDate(item.dueDate)}</div>
                        </td>
                        <td style={sharedStyles.td}>
                          {item.hasAppointment ? (
                            <span style={{ ...sharedStyles.badge, background: '#dcfce7', color: '#166534' }}>
                              Scheduled {formatDateTime(item.scheduledDate)}
                            </span>
                          ) : (
                            <span style={{ ...sharedStyles.badge, background: item.daysUntilDue < 0 ? '#fee2e2' : '#fef3c7', color: item.daysUntilDue < 0 ? '#991b1b' : '#92400e' }}>
                              {item.daysUntilDue < 0 ? 'OVERDUE' : 'Needs Scheduling'}
                            </span>
                          )}
                        </td>
                        <td style={sharedStyles.td}>
                          {sms.sent ? (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>Sent</span>
                          ) : item.phone && !item.hasAppointment ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                style={styles.textBtn}
                                onClick={() => {
                                  const msg = `Hi ${firstName}! This is Range Medical. You're due for your ${item.drawLabel.toLowerCase()} blood work. Would you like to schedule your appointment? Give us a call or text back and we'll get you set up!`;
                                  setSmsState(prev => ({
                                    ...prev,
                                    [item.patientId]: { open: !prev[item.patientId]?.open, message: prev[item.patientId]?.message || msg }
                                  }));
                                }}
                              >
                                Text
                              </button>
                            </div>
                          ) : item.hasAppointment ? (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#d1d5db' }}>No phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Inline SMS Composers */}
              {dueForLabs.map((item) => {
                const sms = smsState[item.patientId] || {};
                if (!sms.open) return null;
                const firstName = (item.patientName || '').split(' ')[0];
                return (
                  <div key={`sms-${item.patientId}`} style={styles.smsComposer}>
                    <div style={styles.smsHeader}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Text {item.patientName}</span>
                      <button style={styles.smsClose} onClick={() => setSmsState(prev => ({ ...prev, [item.patientId]: { ...prev[item.patientId], open: false } }))}>×</button>
                    </div>
                    <textarea
                      style={styles.smsTextarea}
                      value={sms.message || ''}
                      onChange={(e) => setSmsState(prev => ({ ...prev, [item.patientId]: { ...prev[item.patientId], message: e.target.value } }))}
                      placeholder={`Type a message to ${firstName}...`}
                    />
                    <div style={styles.smsActions}>
                      <button
                        style={{ ...styles.smsSendBtn, background: sms.message?.trim() ? '#1e40af' : '#9ca3af' }}
                        disabled={!sms.message?.trim() || sms.sending}
                        onClick={() => handleSendSMS(item.patientId, item.patientName, item.phone, sms.message)}
                      >
                        {sms.sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    {sms.error && <div style={styles.smsError}>{sms.error}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pipeline — Horizontal Kanban */}
      <div style={styles.pipelineGrid}>
        {LAB_STAGES.map(stage => {
          const items = data.stages[stage.id] || [];
          return (
            <div key={stage.id} style={styles.pipelineColumn}>
              {/* Column Header */}
              <div style={{ ...styles.columnHeader, borderTop: `3px solid ${stage.color}` }}>
                <div style={styles.columnHeaderLeft}>
                  <span style={styles.columnLabel}>{stage.label}</span>
                  {stage.owner && (
                    <span style={{ ...styles.ownerBadge, background: `${stage.color}15`, color: stage.color, borderColor: `${stage.color}30` }}>{stage.owner}</span>
                  )}
                </div>
                <span style={styles.columnCount}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={styles.columnBody}>
                {items.map(protocol => {
                  const patient = protocol.patients;
                  const patientName = patient?.name || (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Unknown');
                  const panelType = protocol.medication || 'Essential';
                  const isElite = panelType === 'Elite';
                  const labType = protocol.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';

                  return (
                    <div key={protocol.id} style={styles.pipelineCard}>
                      {/* Name */}
                      <div style={styles.cardTop}>
                        {patient?.id ? (
                          <Link href={`/admin/patient/${patient.id}`} style={styles.cardName}>{patientName}</Link>
                        ) : (
                          <span style={styles.cardName}>{patientName}</span>
                        )}
                        {patient?.phone && (
                          <a href={`tel:${patient.phone}`} style={{ fontSize: '13px', textDecoration: 'none', opacity: 0.6 }}>📞</a>
                        )}
                      </div>

                      {/* Badges */}
                      <div style={styles.cardBadges}>
                        <span style={{
                          ...styles.panelBadge,
                          background: isElite ? '#fdf2f8' : '#f0f9ff',
                          color: isElite ? '#9d174d' : '#0369a1',
                          borderColor: isElite ? '#fce7f3' : '#e0f2fe'
                        }}>
                          {panelType}
                        </span>
                        <span style={styles.typeBadge}>{labType}</span>
                      </div>

                      {/* Date + Time in Stage */}
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Draw: {formatDate(protocol.start_date)}</span>
                          {protocol.updated_at && (() => {
                            const days = Math.floor((Date.now() - new Date(protocol.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: days > 3 ? '#ef4444' : days > 1 ? '#f59e0b' : '#9ca3af',
                              }}>
                                {days === 0 ? 'Today' : `${days}d in stage`}
                              </span>
                            );
                          })()}
                        </div>
                        {protocol.notes && (
                          <div style={styles.cardNotes}>{protocol.notes}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={styles.cardActions}>
                        {stage.id !== 'in_treatment' && (
                          <button
                            style={{ ...styles.advanceBtn, background: stage.color, boxShadow: `0 1px 3px ${stage.color}40` }}
                            onClick={() => {
                              const stageIds = LAB_STAGES.map(s => s.id);
                              const idx = stageIds.indexOf(stage.id);
                              if (idx < stageIds.length - 1) handleMoveStage(protocol.id, stageIds[idx + 1]);
                            }}
                            disabled={updating}
                          >
                            → {LAB_STAGES[LAB_STAGES.findIndex(s => s.id === stage.id) + 1]?.label || 'Next'}
                          </button>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={styles.moveBtn} onClick={() => setExpandedRow(expandedRow === protocol.id ? null : protocol.id)}>
                            Move ▾
                          </button>
                          <button style={styles.removeBtn} onClick={() => setShowDeleteConfirm({ id: protocol.id, name: patientName })}>×</button>
                        </div>
                        {expandedRow === protocol.id && (
                          <div style={styles.moveMenu}>
                            {LAB_STAGES.filter(s => s.id !== stage.id).map(s => (
                              <button key={s.id} style={styles.moveOption} onClick={() => { handleMoveStage(protocol.id, s.id); setExpandedRow(null); }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div style={styles.emptyColumn}>No patients</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div style={styles.actionBar}>
        <button style={sharedStyles.btnSecondary} onClick={fetchData} disabled={loading}>Refresh</button>
        <button style={sharedStyles.btnPrimary} onClick={() => setShowAddModal(true)}>+ Add Lab</button>
      </div>

      {/* Add Lab Modal */}
      {showAddModal && (
        <AddLabModal
          patientSearch={patientSearch}
          onPatientSearch={handlePatientSearch}
          patientResults={patientResults}
          onAdd={async (formData) => {
            try {
              const res = await fetch('/api/admin/labs-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              if (res.ok) {
                await fetchData();
                setShowAddModal(false);
                setPatientSearch('');
                setPatientResults([]);
              }
            } catch (err) { console.error('Error adding lab:', err); }
          }}
          onClose={() => { setShowAddModal(false); setPatientSearch(''); setPatientResults([]); }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '400px' }}>
            <h3 style={styles.modalTitle}>Remove from Pipeline?</h3>
            <p style={{ margin: '8px 0 0', color: '#374151', fontSize: '14px', lineHeight: 1.5 }}>
              Remove <strong>{showDeleteConfirm.name}</strong> from the labs pipeline?
            </p>
            <div style={styles.modalFooter}>
              <button style={sharedStyles.btnSecondary} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...sharedStyles.btnPrimary, background: '#dc2626' }} onClick={() => handleDelete(showDeleteConfirm.id)} disabled={updating}>
                {updating ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Lab Modal
function AddLabModal({ patientSearch, onPatientSearch, patientResults, onAdd, onClose }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manualName, setManualName] = useState('');
  const [panelType, setPanelType] = useState('essential');
  const [labType, setLabType] = useState('new_patient');
  const [bloodDrawDate, setBloodDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const patientId = selectedPatient?.id || null;
    const patientName = selectedPatient?.name || manualName;
    if (!patientName) { alert('Please select or enter a patient name'); return; }
    onAdd({ patientId, patientName, panelType, labType, bloodDrawDate, notes: notes || null });
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={styles.modalTitle}>Add Lab</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9ca3af', cursor: 'pointer' }} onClick={onClose}>×</button>
        </div>

        {/* Patient Search */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Patient</label>
          {selectedPatient ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0' }}>
              <span style={{ fontWeight: 500 }}>{selectedPatient.name}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }} onClick={() => { setSelectedPatient(null); onPatientSearch(''); }}>×</button>
            </div>
          ) : (
            <>
              <input type="text" style={styles.input} value={patientSearch} onChange={(e) => onPatientSearch(e.target.value)} placeholder="Search patient name..." />
              {patientResults.length > 0 && (
                <div style={styles.searchDropdown}>
                  {patientResults.map(p => (
                    <button key={p.id} style={styles.searchItem} onClick={() => { setSelectedPatient(p); onPatientSearch(''); }}>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.email && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{p.email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {patientSearch.length >= 2 && patientResults.length === 0 && (
                <input type="text" style={{ ...styles.input, marginTop: '8px' }} value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Or enter name manually..." />
              )}
            </>
          )}
        </div>

        {/* Panel Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Panel Type</label>
          <div style={styles.segmentedControl}>
            {[{ v: 'essential', l: 'Essential' }, { v: 'elite', l: 'Elite' }].map(o => (
              <button key={o.v} style={{ ...styles.segmentBtn, ...(panelType === o.v ? styles.segmentBtnActive : {}) }} onClick={() => setPanelType(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* Lab Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Lab Type</label>
          <div style={styles.segmentedControl}>
            {[{ v: 'new_patient', l: 'New Patient' }, { v: 'follow_up', l: 'Follow-up' }].map(o => (
              <button key={o.v} style={{ ...styles.segmentBtn, ...(labType === o.v ? styles.segmentBtnActive : {}) }} onClick={() => setLabType(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* Blood Draw Date */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Blood Draw Date</label>
          <input type="date" style={styles.input} value={bloodDrawDate} onChange={(e) => setBloodDrawDate(e.target.value)} />
        </div>

        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Notes</label>
          <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
        </div>

        <div style={styles.modalFooter}>
          <button style={sharedStyles.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={sharedStyles.btnPrimary} onClick={handleSubmit} disabled={!selectedPatient && !manualName}>Add to Pipeline</button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  // Summary cards — matches sales pipeline
  summaryGrid: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    minWidth: '110px',
    flex: '1 0 110px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginTop: '6px',
  },

  // Pipeline Kanban
  pipelineGrid: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '400px',
  },
  pipelineColumn: {
    minWidth: '250px',
    flex: '1 0 250px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: 'calc(100vh - 300px)',
  },
  columnHeader: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '8px 8px 0 0',
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  columnDot: {
    display: 'none',
  },
  columnLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
  },
  ownerBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '1px 6px',
    borderRadius: '3px',
    border: '1px solid transparent',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap',
  },
  columnCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    background: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '24px',
    textAlign: 'center',
  },
  columnBody: {
    padding: '8px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  emptyColumn: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '32px 12px',
    fontSize: '13px',
    fontStyle: 'italic',
  },

  // Pipeline Cards
  pipelineCard: {
    background: '#fff',
    borderRadius: '6px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 0.15s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '8px',
  },
  cardName: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#111',
    textDecoration: 'none',
    lineHeight: 1.3,
  },
  cardBadges: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  panelBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
    border: '1px solid transparent',
    letterSpacing: '0.2px',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '3px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
  },
  cardNotes: {
    marginTop: '6px',
    padding: '6px 8px',
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#92400e',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  cardActions: {
    paddingTop: '10px',
    borderTop: '1px solid #f3f4f6',
    position: 'relative',
  },
  moveBtn: {
    flex: 1,
    padding: '5px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
  },
  moveMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 100,
    marginTop: '4px',
    overflow: 'hidden',
    padding: '4px',
  },
  moveOption: {
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'left',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: '#374151',
  },

  // Due for Labs
  dueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb',
  },
  dueHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dueTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111',
  },
  dueBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#92400e',
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  scheduledBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#166534',
    background: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  dueToggle: {
    fontSize: '14px',
    color: '#9ca3af',
  },

  // Text button
  textBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e40af',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  // SMS Composer
  smsComposer: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '14px 20px',
    margin: '0 16px 16px',
  },
  smsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  smsClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  smsTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    minHeight: '60px',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
  },
  smsActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    justifyContent: 'flex-end',
  },
  smsSendBtn: {
    display: 'inline-flex',
    gap: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  smsError: {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '6px',
  },

  // Pipeline table actions
  advanceBtn: {
    width: '100%',
    padding: '7px 10px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '8px',
    letterSpacing: '0.2px',
  },
  removeBtn: {
    padding: '5px 8px',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
    fontWeight: '600',
    lineHeight: 1,
  },

  // Action bar
  actionBar: {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
    justifyContent: 'flex-end',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '10px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600',
    color: '#111',
  },
  modalFooter: {
    display: 'flex',
    gap: '8px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },

  // Form elements
  formGroup: { marginBottom: '16px' },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  segmentedControl: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '6px',
    padding: '3px',
    gap: '3px',
  },
  segmentBtn: {
    flex: 1,
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.12s ease',
  },
  segmentBtnActive: {
    background: '#111',
    color: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  searchDropdown: {
    marginTop: '4px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  searchItem: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '13px',
  },
};
