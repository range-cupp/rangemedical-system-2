// PipelineDetailPanel — right-side slide-in panel opened when a card is clicked.
// Edits stage, status, assigned_to, and notes. Shows event history.
// V2 editorial: flat, 1px borders, uppercase small-caps headers.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { STAFF, getStaff, initials } from '../../lib/staff';
import { CARD_STATUS } from '../../lib/pipelines-config';
import { formatPhone } from '../../lib/format-utils';

const APPT_STATUS = {
  scheduled:  { label: 'Scheduled',  bg: '#dbeafe', text: '#1e40af' },
  confirmed:  { label: 'Confirmed',  bg: '#dcfce7', text: '#166534' },
  checked_in: { label: 'Checked In', bg: '#fef3c7', text: '#92400e' },
  in_progress:{ label: 'In Progress',bg: '#e0e7ff', text: '#3730a3' },
  completed:  { label: 'Completed',  bg: '#dcfce7', text: '#166534' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', text: '#dc2626' },
  no_show:    { label: 'No Show',    bg: '#fee2e2', text: '#dc2626' },
  rescheduled:{ label: 'Rescheduled',bg: '#f3f4f6', text: '#374151' },
};

function stripNoteHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim();
}

function fmtShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
  });
}

function fmtDateTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}`;
}

const SMSComposeModal = dynamic(() => import('../SMSComposeModal'), { ssr: false });

const STATUS_OPTIONS = [
  { value: CARD_STATUS.ACTIVE,    label: 'Active' },
  { value: CARD_STATUS.COMPLETED, label: 'Completed' },
  { value: CARD_STATUS.LOST,      label: 'Lost' },
  { value: CARD_STATUS.PAUSED,    label: 'Paused' },
];

function fullName(card) {
  if (card.patient_name) return card.patient_name;
  const fn = (card.first_name || '').trim();
  const ln = (card.last_name  || '').trim();
  return `${fn} ${ln}`.trim() || '(Unnamed)';
}

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function PipelineDetailPanel({
  card,
  pipeline,
  currentUser = 'chris',
  onClose,
  onSaved,
  onDeleted,
}) {
  const [stage, setStage]       = useState(card.stage);
  const [status, setStatus]     = useState(card.status);
  const [assigned, setAssigned] = useState(card.assigned_to || []);
  const [notes, setNotes]       = useState(card.notes || '');
  const [saving, setSaving]     = useState(false);
  const [events, setEvents]     = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [smsOpen, setSmsOpen]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    setStage(card.stage);
    setStatus(card.status);
    setAssigned(card.assigned_to || []);
    setNotes(card.notes || '');
    loadEvents();
    loadPatient();
    function onEsc(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [card.id]);

  async function loadEvents() {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/pipelines/cards/${card.id}/events`);
      if (res.ok) setEvents(await res.json());
    } catch { /* silent */ }
    setLoadingEvents(false);
  }

  async function loadPatient() {
    if (!card.patient_id) { setPatientData(null); return; }
    setLoadingPatient(true);
    try {
      const res = await fetch(`/api/patients/${card.patient_id}`);
      if (res.ok) setPatientData(await res.json());
    } catch { /* silent */ }
    setLoadingPatient(false);
  }

  const stageChanged    = stage !== card.stage;
  const statusChanged   = status !== card.status;
  const assignedChanged = JSON.stringify(assigned.sort()) !== JSON.stringify((card.assigned_to || []).sort());
  const notesChanged    = notes !== (card.notes || '');
  const dirty = stageChanged || statusChanged || assignedChanged || notesChanged;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pipelines/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage, status, assigned_to: assigned, notes,
          triggered_by: currentUser,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved?.(updated);
        loadEvents();
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleAssignee(id) {
    setAssigned(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]);
  }

  async function deleteCard() {
    if (deleting) return;
    const ok = typeof window !== 'undefined' && window.confirm(
      `Delete this ${pipeline.label} card for ${fullName(card)}?\n\n` +
      `This removes the pipeline card only. The patient record, protocol, ` +
      `and any purchases are untouched. Use this for duplicates or cards ` +
      `created by mistake.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pipelines/cards/${card.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        onDeleted?.(card);
        onClose?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Delete failed: ${err.error || res.statusText}`);
      }
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  }

  async function markReviewComplete() {
    // Energy Workup: under_review → ready_to_schedule, reassign to Tara
    setStage('ready_to_schedule');
    setAssigned(['tara']);
    // Auto-save
    setSaving(true);
    try {
      const res = await fetch(`/api/pipelines/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'ready_to_schedule',
          assigned_to: ['tara'],
          triggered_by: currentUser,
          automation_reason: 'review_marked_complete',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved?.(updated);
        loadEvents();
      }
    } finally {
      setSaving(false);
    }
  }

  const showReviewButton =
    pipeline.key === 'energy_workup' &&
    card.stage === 'under_review' &&
    !stageChanged;

  const pipelineStages = pipeline.stages;
  const metaEntries = Object.entries(card.meta || {});

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <aside style={styles.panel} role="dialog" aria-label="Pipeline card detail">
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.pipelineTag}>{pipeline.label}</div>
            <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <h2 style={styles.name}>{fullName(card)}</h2>
          <div style={styles.contactRow}>
            {card.phone && <span style={styles.contact}>{formatPhone(card.phone)}</span>}
            {card.email && <span style={styles.contact}>{card.email}</span>}
            {card.patient_id && (
              <Link
                href={`/patients/${card.patient_id}`}
                style={styles.patientLink}
              >
                Patient Profile →
              </Link>
            )}
          </div>

          {card.phone && (
            <div style={styles.quickActions}>
              <button
                type="button"
                onClick={() => setSmsOpen(true)}
                style={styles.smsBtn}
                title="Text this patient via Blooio"
              >
                <MessageSquare size={14} /> Text Patient
              </button>
              <a href={`tel:${card.phone}`} style={styles.callBtn}>
                📞 Call
              </a>
            </div>
          )}
        </div>

        <div style={styles.body}>
          {showReviewButton && (
            <button type="button" onClick={markReviewComplete} style={styles.reviewBtn}>
              Mark Review Complete → Tara
            </button>
          )}

          <Section label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={styles.select}
            >
              {pipelineStages.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Section>

          <Section label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.select}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Section>

          <Section label="Assigned To">
            <div style={styles.staffGrid}>
              {STAFF.map(s => {
                const active = assigned.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleAssignee(s.id)}
                    style={{
                      ...styles.staffBtn,
                      ...(active ? styles.staffBtnActive : null),
                    }}
                  >
                    <span
                      style={{
                        ...styles.staffDot,
                        background: active ? '#fff' : s.color,
                      }}
                    >
                      {initials(s.name)}
                    </span>
                    <span style={styles.staffName}>{s.name}</span>
                    <span style={styles.staffRole}>{s.role}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {metaEntries.length > 0 && (
            <Section label="Details">
              <div style={styles.metaGrid}>
                {metaEntries.map(([k, v]) => (
                  <div key={k} style={styles.metaRow}>
                    <span style={styles.metaKey}>{k.replace(/_/g, ' ')}</span>
                    <span style={styles.metaVal}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              rows={4}
              placeholder="Add notes..."
            />
          </Section>

          {card.patient_id && (
            <PatientInfoSections
              patientData={patientData}
              loading={loadingPatient}
            />
          )}

          <Section label="History">
            {loadingEvents ? (
              <div style={styles.loading}>Loading...</div>
            ) : events.length === 0 ? (
              <div style={styles.loading}>No history yet.</div>
            ) : (
              <div style={styles.history}>
                {events.map(ev => (
                  <div key={ev.id} style={styles.historyItem}>
                    <div style={styles.historyDot} />
                    <div style={styles.historyBody}>
                      <div style={styles.historyLine}>
                        {eventSummary(ev, pipeline)}
                      </div>
                      <div style={styles.historyMeta}>
                        {fmtDateTime(ev.created_at)} · {ev.triggered_by}
                        {ev.automation_reason ? ` · ${ev.automation_reason}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            onClick={deleteCard}
            disabled={deleting}
            style={{
              ...styles.deleteBtn,
              opacity: deleting ? 0.4 : 1,
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
            title="Delete this pipeline card (e.g. duplicate). Patient + protocol untouched."
          >
            <Trash2 size={12} /> {deleting ? 'Deleting…' : 'Delete Card'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onClose}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            style={{
              ...styles.saveBtn,
              opacity: (!dirty || saving) ? 0.4 : 1,
              cursor: (!dirty || saving) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </aside>

      <SMSComposeModal
        isOpen={smsOpen}
        onClose={() => setSmsOpen(false)}
        recipientPhone={card.phone}
        recipientName={card.first_name || fullName(card)}
        patientId={card.patient_id}
        patientName={fullName(card)}
      />
    </>
  );
}

function Section({ label, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

function PatientInfoSections({ patientData, loading }) {
  if (loading && !patientData) {
    return (
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Patient Info</div>
        <div style={styles.loading}>Loading patient data…</div>
      </div>
    );
  }
  if (!patientData) return null;

  const pt = patientData.patient || {};
  const activeProtos  = patientData.activeProtocols || [];
  const upcomingAppts = (patientData.appointments || []).filter(a => new Date(a.start_time) >= new Date());
  const pastAppts     = (patientData.appointments || []).filter(a => new Date(a.start_time) < new Date());
  const commsLog      = patientData.commsLog || [];
  const serviceLogs   = patientData.serviceLogs || [];
  const purchases     = patientData.allPurchases || [];
  const patientNotes  = patientData.notes || [];

  return (
    <>
      {/* Demographics chips */}
      {(pt.date_of_birth || pt.gender || pt.created_at) && (
        <Section label="Demographics">
          <div style={styles.chipRow}>
            {pt.date_of_birth && (
              <span style={styles.chip}>
                DOB {new Date(pt.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'America/Los_Angeles' })}
              </span>
            )}
            {pt.gender && <span style={styles.chip}>{pt.gender}</span>}
            {pt.created_at && (
              <span style={styles.chip}>
                Since {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'America/Los_Angeles' })}
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Active Protocols */}
      <Section label={`Active Protocols (${activeProtos.length})`}>
        {activeProtos.length === 0 ? (
          <div style={styles.loading}>No active protocols</div>
        ) : (
          <div style={styles.infoList}>
            {activeProtos.map((p, i) => {
              const total = p.total_sessions || p.sessions_total || p.duration_days || 0;
              const used  = p.sessions_used || 0;
              const pct   = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              return (
                <div key={p.id || i} style={styles.infoRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.infoTitle}>{p.program_name || p.medication || 'Protocol'}</div>
                    {p.medication && p.medication !== p.program_name && (
                      <div style={styles.infoSub}>{p.medication}{p.dosage ? ` · ${p.dosage}` : ''}</div>
                    )}
                    {total > 0 && (
                      <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: `${pct}%`, background: pct >= 100 ? '#16a34a' : '#1a1a1a' }} />
                      </div>
                    )}
                  </div>
                  <span style={styles.infoMeta}>{used}/{total || '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Upcoming Appointments */}
      <Section label={`Upcoming Appointments (${upcomingAppts.length})`}>
        {upcomingAppts.length === 0 ? (
          <div style={styles.loading}>No upcoming appointments</div>
        ) : (
          <div style={styles.infoList}>
            {upcomingAppts.slice(0, 4).map((apt, i) => (
              <div key={apt.id || i} style={styles.infoRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.infoTitle}>
                    {apt.service_name || apt.appointment_title || apt.calendar_name || apt.title || 'Appointment'}
                  </div>
                  <div style={styles.infoSub}>
                    {fmtDateTimeShort(apt.start_time)}
                    {apt.provider ? ` · ${apt.provider}` : ''}
                  </div>
                </div>
                {APPT_STATUS[apt.status] && (
                  <span style={{
                    ...styles.statusPill,
                    background: APPT_STATUS[apt.status].bg,
                    color: APPT_STATUS[apt.status].text,
                  }}>
                    {APPT_STATUS[apt.status].label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Communications */}
      <Section label={`Communications (${commsLog.length})`}>
        {commsLog.length === 0 ? (
          <div style={styles.loading}>No recent messages</div>
        ) : (
          <div style={styles.infoList}>
            {commsLog.slice(0, 8).map((msg, i) => {
              const outbound = msg.direction === 'outbound' || msg.direction === 'out';
              const channel  = msg.channel || (msg.subject ? 'email' : 'sms');
              const preview  = msg.message || msg.subject || '';
              return (
                <div key={msg.id || i} style={styles.infoRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{
                        ...styles.commDot,
                        background: outbound ? '#1a1a1a' : '#16a34a',
                      }} />
                      <span style={styles.commChannel}>
                        {channel.toUpperCase()} · {outbound ? 'Sent' : 'Received'}
                      </span>
                      <span style={styles.commTime}>{fmtShortDate(msg.created_at)}</span>
                    </div>
                    {msg.subject && channel === 'email' && (
                      <div style={{ ...styles.infoTitle, fontSize: '12px' }}>{msg.subject}</div>
                    )}
                    <div style={styles.commBody}>
                      {stripNoteHtml(preview).slice(0, 140)}{stripNoteHtml(preview).length > 140 ? '…' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Recent Visits */}
      <Section label={`Recent Visits (${serviceLogs.length})`}>
        {serviceLogs.length === 0 ? (
          <div style={styles.loading}>No visits recorded</div>
        ) : (
          <div style={styles.infoList}>
            {serviceLogs.slice(0, 6).map((log, i) => (
              <div key={log.id || i} style={styles.infoRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.infoTitle}>
                    {(log.category || 'Visit').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  {log.medication && (
                    <div style={styles.infoSub}>{log.medication}{log.dosage ? ` ${log.dosage}` : ''}</div>
                  )}
                </div>
                <span style={styles.infoMeta}>{fmtShortDate(log.entry_date || log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent Transactions */}
      {purchases.length > 0 && (
        <Section label={`Recent Transactions (${purchases.length})`}>
          <div style={styles.infoList}>
            {purchases.slice(0, 5).map((p, i) => {
              const paid = parseFloat(p.amount_paid);
              const amt  = !isNaN(paid) ? paid : (parseFloat(p.amount) || 0);
              return (
                <div key={p.id || i} style={styles.infoRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.infoTitle}>{p.item_name || p.service_name || p.description || 'Payment'}</div>
                    <div style={styles.infoSub}>
                      {p.payment_method ? p.payment_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}
                      {' · '}
                      {p.purchase_date ? fmtShortDate(p.purchase_date) : ''}
                    </div>
                  </div>
                  <span style={styles.infoAmount}>
                    {amt === 0 ? 'Comp' : `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Patient Notes */}
      {patientNotes.length > 0 && (
        <Section label={`Patient Notes (${patientNotes.length})`}>
          <div style={styles.infoList}>
            {patientNotes.slice(0, 3).map((note, i) => (
              <div key={note.id || i} style={styles.noteItem}>
                <div style={styles.noteMeta}>
                  {fmtShortDate(note.note_date || note.created_at)}
                  {note.source ? ` · ${note.source}` : ''}
                </div>
                <div style={styles.noteBody}>{stripNoteHtml(note.body).slice(0, 200)}{stripNoteHtml(note.body).length > 200 ? '…' : ''}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Past Appointments */}
      {pastAppts.length > 0 && (
        <Section label={`Past Appointments (${pastAppts.length})`}>
          <div style={styles.infoList}>
            {pastAppts.slice(0, 4).map((apt, i) => (
              <div key={apt.id || i} style={styles.infoRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.infoTitle}>
                    {apt.service_name || apt.appointment_title || apt.calendar_name || apt.title || 'Appointment'}
                  </div>
                  {apt.provider && <div style={styles.infoSub}>{apt.provider}</div>}
                </div>
                <span style={styles.infoMeta}>{fmtShortDate(apt.start_time)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function eventSummary(ev, pipeline) {
  const stageLabel = (k) => pipeline.stages.find(s => s.key === k)?.label || k;
  if (ev.event_type === 'stage_change')      return `${stageLabel(ev.from_stage) || '—'} → ${stageLabel(ev.to_stage)}`;
  if (ev.event_type === 'status_change')     return `Status: ${ev.from_status || '—'} → ${ev.to_status}`;
  if (ev.event_type === 'assignment_change') return 'Assignment updated';
  if (ev.event_type === 'note')              return ev.notes || 'Note added';
  if (ev.event_type === 'automation')        return ev.automation_reason || 'Automation';
  if (ev.event_type === 'created')           return 'Card created';
  return ev.event_type;
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 500,
    animation: 'fadeIn 0.2s ease',
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: '540px',
    maxWidth: '100vw',
    background: '#ffffff',
    borderLeft: '1px solid #e0e0e0',
    zIndex: 501,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, -apple-system, sans-serif',
    animation: 'slideInRight 0.25s ease',
    boxShadow: '-1px 0 0 rgba(0,0,0,0.02)',
  },
  header: {
    padding: '20px 24px 18px',
    borderBottom: '1px solid #e0e0e0',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  pipelineTag: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#737373',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.1,
    textTransform: 'uppercase',
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px',
    alignItems: 'center',
  },
  contact: {
    fontSize: '12px',
    color: '#737373',
  },
  patientLink: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#1a1a1a',
    borderBottom: '1.5px solid #1a1a1a',
    paddingBottom: '1px',
  },
  quickActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '14px',
  },
  smsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    borderRadius: 0,
  },
  callBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    textDecoration: 'none',
    borderRadius: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  reviewBtn: {
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#737373',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#1a1a1a',
    borderRadius: 0,
    cursor: 'pointer',
  },
  staffGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  },
  staffBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    borderRadius: 0,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  staffBtnActive: {
    background: '#1a1a1a',
    color: '#fff',
    borderColor: '#1a1a1a',
  },
  staffDot: {
    width: '22px',
    height: '22px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  staffName: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  staffRole: {
    fontSize: '10px',
    opacity: 0.6,
    marginLeft: 'auto',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid #e0e0e0',
    padding: '10px 12px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  metaKey: {
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '10px',
    fontWeight: 700,
  },
  metaVal: {
    color: '#1a1a1a',
    fontWeight: 600,
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#1a1a1a',
    borderRadius: 0,
    resize: 'vertical',
    lineHeight: 1.5,
  },
  loading: {
    fontSize: '12px',
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  history: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  historyItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  historyDot: {
    width: '8px',
    height: '8px',
    background: '#1a1a1a',
    marginTop: '6px',
    flexShrink: 0,
  },
  historyBody: {
    flex: 1,
  },
  historyLine: {
    fontSize: '13px',
    color: '#1a1a1a',
    fontWeight: 600,
  },
  historyMeta: {
    fontSize: '10px',
    color: '#a0a0a0',
    letterSpacing: '0.04em',
    marginTop: '2px',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: '#fafafa',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: '#fff',
    color: '#c0332e',
    border: '1px solid #e5c4c1',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 0,
  },
  cancelBtn: {
    padding: '10px 18px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 0,
  },
  saveBtn: {
    padding: '10px 18px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #1a1a1a',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 0,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    fontSize: '11px',
    color: '#1a1a1a',
    background: '#f4f4f4',
    border: '1px solid #e0e0e0',
    padding: '4px 10px',
    letterSpacing: '0.02em',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e0e0e0',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  infoSub: {
    fontSize: '11px',
    color: '#737373',
    marginTop: '2px',
  },
  infoMeta: {
    fontSize: '11px',
    color: '#737373',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  infoAmount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  progressTrack: {
    marginTop: '6px',
    height: '4px',
    background: '#ececec',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    background: '#1a1a1a',
    transition: 'width 0.3s',
  },
  statusPill: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    flexShrink: 0,
  },
  commDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  commChannel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#737373',
  },
  commTime: {
    fontSize: '10px',
    color: '#a0a0a0',
    marginLeft: 'auto',
  },
  commBody: {
    fontSize: '12px',
    color: '#333',
    lineHeight: 1.4,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  },
  noteItem: {
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
  },
  noteMeta: {
    fontSize: '10px',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  noteBody: {
    fontSize: '12px',
    color: '#333',
    lineHeight: 1.5,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  },
};
