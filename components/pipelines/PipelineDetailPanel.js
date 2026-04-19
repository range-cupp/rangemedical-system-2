// PipelineDetailPanel — right-side slide-in panel opened when a card is clicked.
// Edits stage, status, assigned_to, and notes. Shows event history.
// V2 editorial: flat, 1px borders, uppercase small-caps headers.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { STAFF, getStaff, initials } from '../../lib/staff';
import { CARD_STATUS } from '../../lib/pipelines-config';

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
}) {
  const [stage, setStage]       = useState(card.stage);
  const [status, setStatus]     = useState(card.status);
  const [assigned, setAssigned] = useState(card.assigned_to || []);
  const [notes, setNotes]       = useState(card.notes || '');
  const [saving, setSaving]     = useState(false);
  const [events, setEvents]     = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    setStage(card.stage);
    setStatus(card.status);
    setAssigned(card.assigned_to || []);
    setNotes(card.notes || '');
    loadEvents();
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
            {card.phone && <span style={styles.contact}>{card.phone}</span>}
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
    width: '480px',
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
    justifyContent: 'flex-end',
    background: '#fafafa',
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
};
