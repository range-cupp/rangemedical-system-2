// /pages/admin/hrt-tracker.js
// HRT Tracker — tracks all active HRT patients: lab draws, medication
// dispatch, payments, and protocol status. Same visual design as WL Tracker.
// Range Medical

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const BookingTab = dynamic(() => import('../../components/BookingTab'), { ssr: false });

const LAB_STATUS_CONFIG = {
  overdue:     { icon: '🔴', label: 'Labs overdue',    bg: '#fee2e2', color: '#991b1b' },
  due_soon:    { icon: '🟡', label: 'Labs due soon',   bg: '#fef3c7', color: '#92400e' },
  on_track:    { icon: '✅', label: 'On track',        bg: '#dcfce7', color: '#166534' },
  complete:    { icon: '✓',  label: 'All complete',    bg: '#f5f5f5', color: '#666' },
  no_schedule: { icon: '➖', label: 'No lab schedule', bg: '#f5f5f5', color: '#999' },
};

// Reusable "lab draw is on the calendar" pill. Shows up on rows / panels /
// modal warnings to make it instantly clear we don't need to text the patient.
function LabScheduledBadge({ appt, compact }) {
  if (!appt?.date) return null;
  return (
    <span title={`Blood draw: ${appt.service_name || 'Lab'}${appt.provider ? ' · ' + appt.provider : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: compact ? '2px 6px' : '4px 10px',
        background: '#dbeafe', color: '#1e40af',
        fontSize: compact ? '10px' : '12px', fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
      📅 Draw scheduled {fmtDate(appt.date)}{compact ? '' : ` at ${appt.time}`}
    </span>
  );
}

const PAYMENT_CONFIG = {
  paid:    { icon: '💳', bg: '#dcfce7', color: '#166534' },
  comp:    { icon: '🆓', bg: '#e0e7ff', color: '#3730a3' },
  unknown: { icon: '❔', bg: '#f5f5f5', color: '#666' },
};

const DISPENSE_CONFIG = {
  active:   { icon: '✅', bg: '#dcfce7', color: '#166534' },
  due_soon: { icon: '🟡', bg: '#fef3c7', color: '#92400e' },
  due_now:  { icon: '🟠', bg: '#fed7aa', color: '#9a3412' },
  send_now: { icon: '📦', bg: '#fee2e2', color: '#991b1b' },
  never:    { icon: '➖', bg: '#f5f5f5', color: '#666' },
};

function todayPacificISO() {
  const pst = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pst.setHours(0, 0, 0, 0);
  return pst.toISOString().split('T')[0];
}

function addDaysISO(dateISO, days) {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...opts });
}

// Render a UTC ISO timestamp as a short relative phrase ("12m ago", "3h ago",
// "yesterday", "Mar 14"). Used so staff see at a glance how stale a previous
// outreach is without doing date math.
function relativeTimeShort(isoTimestamp) {
  if (!isoTimestamp) return null;
  const then = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(then)) return null;
  const now = Date.now();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const d = new Date(isoTimestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hoursSince(isoTimestamp) {
  if (!isoTimestamp) return Infinity;
  const then = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(then)) return Infinity;
  return (Date.now() - then) / 3600000;
}

// Inline pill that appears anywhere we want to remind staff "we already
// reached out about labs recently — don't double-text." Color shifts toward
// red as the gap shrinks (still warm = looks more like spam to the patient).
function LabOutreachBadge({ outreach, compact }) {
  if (!outreach?.sent_at) return null;
  const hours = hoursSince(outreach.sent_at);
  let bg = '#f1f5f9';
  let color = '#475569';
  if (hours < 24) { bg = '#fee2e2'; color = '#991b1b'; }
  else if (hours < 72) { bg = '#fef3c7'; color = '#92400e'; }
  const label = `Texted ${relativeTimeShort(outreach.sent_at)}`;
  const tip = [
    `Channel: ${outreach.channel || 'sms'}`,
    `Type: ${outreach.message_type}`,
    outreach.sent_by ? `Sent by ${outreach.sent_by}` : null,
    outreach.message_preview ? `\nMessage: ${outreach.message_preview}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <span title={tip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: compact ? '2px 6px' : '3px 8px',
        background: bg, color,
        fontSize: compact ? '10px' : '11px', fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
      💬 {label}
    </span>
  );
}

export default function HRTTrackerPage() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProtocolId, setSelectedProtocolId] = useState(null);
  const [bookingPatient, setBookingPatient] = useState(null);
  const [labReminderDraft, setLabReminderDraft] = useState(null); // { patient, message }
  const [actionInProgress, setActionInProgress] = useState(false);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const loadData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setLoading(true);
      setError(null);
      const r = await fetch('/api/admin/hrt-tracker', { headers: authHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, authHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const patients = data?.patients || [];

  const selectedPatient = useMemo(
    () => selectedProtocolId ? patients.find(p => p.protocol_id === selectedProtocolId) || null : null,
    [selectedProtocolId, patients]
  );

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      // Filters around lab status now respect the "scheduled" override —
      // a patient with a draw on the calendar shouldn't show up in
      // "labs overdue" filters since the action is already taken.
      if (filterStatus === 'labs_overdue' && (p.lab_status.state !== 'overdue' || p.labs_scheduled)) return false;
      if (filterStatus === 'labs_due' && (!['overdue', 'due_soon'].includes(p.lab_status.state) || p.labs_scheduled)) return false;
      if (filterStatus === 'labs_scheduled' && !p.labs_scheduled) return false;
      if (filterStatus === 'dispatch_due' && !['send_now', 'due_now', 'due_soon'].includes(p.dispense.state)) return false;
      if (filterStatus === 'no_purchases' && p.payment.state !== 'unknown') return false;
      return true;
    });
  }, [patients, search, filterStatus]);

  const dailyBuckets = useMemo(() => {
    const needsAttention = [];
    const labsScheduled = [];
    const labsOverdue = [];
    const labsDueSoon = [];
    const medsDispatch = [];
    const active = [];

    for (const p of patients) {
      switch (p.today_action) {
        case 'needs_attention':  needsAttention.push(p); break;
        case 'labs_scheduled':   labsScheduled.push(p); break;
        case 'labs_overdue':     labsOverdue.push(p); break;
        case 'labs_due_soon':    labsDueSoon.push(p); break;
        case 'meds_dispatch':
        case 'meds_due_soon':    medsDispatch.push(p); break;
        default:                 active.push(p); break;
      }
    }
    return { needsAttention, labsScheduled, labsOverdue, labsDueSoon, medsDispatch, active };
  }, [patients]);

  const handleAction = async (action, body) => {
    setActionInProgress(true);
    try {
      const r = await fetch('/api/admin/hrt-tracker', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, ...body }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      await loadData();
      return json;
    } catch (e) {
      alert('Error: ' + e.message);
      throw e;
    } finally {
      setActionInProgress(false);
    }
  };

  const openLabReminder = (patient) => {
    if (!patient.phone) {
      alert(`No phone number on file for ${patient.name}.`);
      return;
    }
    setLabReminderDraft({
      patient,
      message: defaultLabReminderMessage(patient),
    });
  };

  return (
    <AdminLayout title="HRT Tracker">
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={sharedStyles.pageHeader}>
          <h1 style={sharedStyles.pageTitle}>HRT Tracker</h1>
          <p style={sharedStyles.pageSubtitle}>
            {data
              ? <>Tracking <strong style={{ color: '#000' }}>{data.stats.total_patients}</strong> active HRT patient{data.stats.total_patients === 1 ? '' : 's'}</>
              : 'Loading…'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <InfoBanner />

        {data && <StatsBar stats={data.stats} needsAttentionCount={dailyBuckets.needsAttention.length + dailyBuckets.labsOverdue.length} />}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }} />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...sharedStyles.searchInput, width: '240px' }}
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={sharedStyles.select}
          >
            <option value="all">All statuses</option>
            <option value="labs_overdue">Labs overdue (no draw booked)</option>
            <option value="labs_due">Labs due / overdue (no draw booked)</option>
            <option value="labs_scheduled">Labs scheduled</option>
            <option value="dispatch_due">Needs medication dispatch</option>
            <option value="no_purchases">No purchases on file</option>
          </select>
        </div>

        {loading && !data && <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading...</div>}

        {data && (
          <DailyView
            buckets={dailyBuckets}
            onSelect={(p) => setSelectedProtocolId(p.protocol_id)}
            onAction={handleAction}
            onSchedule={setBookingPatient}
            onComposeLabReminder={openLabReminder}
            actionInProgress={actionInProgress}
          />
        )}

        {data && (
          <RosterTable
            patients={filteredPatients}
            onSelect={(p) => setSelectedProtocolId(p.protocol_id)}
            onAction={handleAction}
            actionInProgress={actionInProgress}
          />
        )}

        {selectedPatient && (
          <PatientPanel
            patient={selectedPatient}
            onClose={() => setSelectedProtocolId(null)}
            onAction={handleAction}
            actionInProgress={actionInProgress}
            onSchedule={() => setBookingPatient(selectedPatient)}
            onComposeLabReminder={openLabReminder}
          />
        )}

        {bookingPatient && (
          <BookingModal
            patient={bookingPatient}
            onClose={() => { setBookingPatient(null); loadData(); }}
          />
        )}

        {labReminderDraft && (
          <LabReminderModal
            patient={labReminderDraft.patient}
            initialMessage={labReminderDraft.message}
            actionInProgress={actionInProgress}
            onClose={() => setLabReminderDraft(null)}
            onSend={async (message) => {
              await handleAction('send_lab_reminder', {
                protocol_id: labReminderDraft.patient.protocol_id,
                message,
              });
              setLabReminderDraft(null);
            }}
            onResetDefault={() => setLabReminderDraft(d => d && ({ ...d, message: defaultLabReminderMessage(d.patient) }))}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ───────────────────── Lab Reminder SMS Modal ─────────────────────

function defaultLabReminderMessage(patient) {
  const firstName = patient.first_name || patient.name?.split(' ')[0] || 'there';
  return (
    `Hey ${firstName}! You're due for your next blood draw. ` +
    `When would be a good day for you to come in fasted? ` +
    `Just reply to this text or call us at (949) 997-3988.\n\n` +
    `- Range Medical`
  );
}

function LabReminderModal({ patient, initialMessage, actionInProgress, onClose, onSend, onResetDefault }) {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => { setMessage(initialMessage); }, [initialMessage]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const trimmed = message.trim();
  const canSend = !!trimmed && !actionInProgress;

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '24px',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: '560px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', borderBottom: '1px solid #e5e5e5',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Send lab reminder</h3>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
              to <strong>{patient.name}</strong> · {patient.phone || 'no phone'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: '#666', lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {patient.upcoming_lab_draw && (
            <div style={{
              marginBottom: '14px', padding: '10px 12px',
              background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e3a8a',
              fontSize: '12px', lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                📅 Blood draw already scheduled — {fmtDate(patient.upcoming_lab_draw.date)} at {patient.upcoming_lab_draw.time}
              </div>
              <div>
                {patient.upcoming_lab_draw.service_name}
                {patient.upcoming_lab_draw.provider ? ` · ${patient.upcoming_lab_draw.provider}` : ''}
                {patient.upcoming_lab_draw.status ? ` · status: ${patient.upcoming_lab_draw.status}` : ''}
              </div>
              <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                Most patients won't need another reminder — confirm before sending.
              </div>
            </div>
          )}

          {patient.last_lab_outreach && (() => {
            const o = patient.last_lab_outreach;
            const hours = hoursSince(o.sent_at);
            const recent = hours < 72; // anything in the last 3 days = warn loudly
            const bg = hours < 24 ? '#fee2e2' : recent ? '#fef3c7' : '#f1f5f9';
            const border = hours < 24 ? '#fca5a5' : recent ? '#fcd34d' : '#e2e8f0';
            const color = hours < 24 ? '#991b1b' : recent ? '#92400e' : '#475569';
            return (
              <div style={{
                marginBottom: '14px', padding: '10px 12px',
                background: bg, border: `1px solid ${border}`, color,
                fontSize: '12px', lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                  ⚠️ Already texted {patient.first_name || patient.name?.split(' ')[0]} {relativeTimeShort(o.sent_at)}
                </div>
                <div>
                  via {o.channel || 'sms'} · type <code>{o.message_type}</code>
                  {o.sent_by ? ` · by ${o.sent_by}` : ''}
                </div>
                {o.message_preview && (
                  <div style={{ marginTop: '6px', fontStyle: 'italic', color: '#444' }}>
                    “{o.message_preview}{(o.message_preview || '').length >= 140 ? '…' : ''}”
                  </div>
                )}
              </div>
            );
          })()}

          <label style={{ ...sharedStyles.label, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Message</span>
            <button type="button" onClick={onResetDefault}
              style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
              Reset to default
            </button>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={7}
            style={{
              ...sharedStyles.input, width: '100%', resize: 'vertical',
              fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5,
              minHeight: '140px',
            }}
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            {message.length} character{message.length === 1 ? '' : 's'}
            {message.length > 160 && ' · may send as multiple SMS segments'}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          padding: '14px 24px', borderTop: '1px solid #e5e5e5', background: '#fafafa',
        }}>
          <button onClick={onClose} disabled={actionInProgress}
            style={sharedStyles.btnSecondary}>
            Cancel
          </button>
          <button onClick={() => onSend(trimmed)} disabled={!canSend}
            style={{ ...sharedStyles.btnPrimary, opacity: canSend ? 1 : 0.5 }}>
            {actionInProgress ? 'Sending…' : '💬 Send SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Booking Modal ─────────────────────

function BookingModal({ patient, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '24px',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: '1200px',
          maxHeight: '92vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', borderBottom: '1px solid #e5e5e5',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Book appointment</h3>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
              for <strong>{patient.name}</strong> · {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: '#666', lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <BookingTab preselectedPatient={{
            id: patient.patient_id,
            name: patient.name,
            phone: patient.phone,
          }} />
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Stats Bar ─────────────────────

function StatsBar({ stats, needsAttentionCount }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
      <StatBlock
        label="Needs attention"
        value={needsAttentionCount}
        sub={needsAttentionCount === 0 ? 'all clear' : 'labs overdue or needs setup'}
        accent={needsAttentionCount > 0 ? '#991b1b' : '#166534'}
      />
      <StatBlock
        label="Labs need outreach"
        value={stats.labs_overdue + stats.labs_due_soon}
        sub={`${stats.labs_overdue} overdue · ${stats.labs_scheduled || 0} already scheduled`}
        accent={stats.labs_overdue > 0 ? '#9a3412' : null}
      />
      <StatBlock
        label="Medication outreach"
        value={stats.dispatch_due_now}
        sub={`+${stats.dispatch_due_soon} due in next 14 days`}
        accent={stats.dispatch_due_now > 0 ? '#9a3412' : null}
      />
    </div>
  );
}

function StatBlock({ label, value, sub, accent }) {
  return (
    <div style={{ ...sharedStyles.statCard, padding: '16px 18px' }}>
      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.1, marginTop: '6px', color: accent || '#000' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ───────────────────── Info Banner ─────────────────────

function InfoBanner() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      marginBottom: '20px', padding: '14px 18px',
      background: '#faf5ff', border: '1px solid #e9d5ff',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1 }}>💉</div>
      <div style={{ flex: 1, fontSize: '13px', color: '#581c87', lineHeight: 1.5 }}>
        <strong>HRT patients are tracked by protocol, labs, and medication supply.</strong>
        {!collapsed && (
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
            <li><strong>Labs overdue / due soon</strong> — patient needs outreach AND has no blood draw on the calendar</li>
            <li><strong>Labs scheduled</strong> — draw is on the calendar; we hide these from outreach so we don't double-text</li>
            <li><strong>Meds need dispatch</strong> — medication supply is running low or exhausted</li>
            <li><strong>Payment outreach</strong> — medication block needs billing</li>
          </ul>
        )}
      </div>
      <button onClick={() => setCollapsed(c => !c)}
        style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
        {collapsed ? 'Show details' : 'Hide'}
      </button>
    </div>
  );
}

// ───────────────────── Daily View ─────────────────────

function DailyView({ buckets, onSelect, onAction, onSchedule, onComposeLabReminder, actionInProgress }) {
  const sections = [
    {
      key: 'needsAttention',
      title: '⚠️ Needs manual attention',
      subtitle: 'No purchases on file — needs setup',
      list: buckets.needsAttention,
      accent: '#dc2626',
      tone: 'warn',
    },
    {
      key: 'labsOverdue',
      title: '🔴 Labs overdue',
      subtitle: 'Blood draw is past due AND not yet on the calendar',
      list: buckets.labsOverdue,
      accent: '#991b1b',
      tone: 'warn',
    },
    {
      key: 'labsDueSoon',
      title: '🟡 Labs due soon',
      subtitle: 'Next blood draw coming up within 14 days, no appointment yet',
      list: buckets.labsDueSoon,
      accent: '#92400e',
      tone: 'warn',
    },
    {
      key: 'labsScheduled',
      title: '📅 Labs scheduled',
      subtitle: 'Blood draw is on the calendar — no outreach needed',
      list: buckets.labsScheduled,
      accent: '#1e40af',
      tone: 'info',
      collapsedByDefault: true,
    },
    {
      key: 'medsDispatch',
      title: '📦 Medication dispatch needed',
      subtitle: 'Supply running low or exhausted — send next block',
      list: buckets.medsDispatch,
      accent: '#9a3412',
      tone: 'warn',
    },
    {
      key: 'active',
      title: '✅ Active & on track',
      subtitle: 'No action needed right now',
      list: buckets.active,
      accent: '#166534',
      tone: 'good',
      collapsedByDefault: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      {sections.map(s => (
        <DailySection key={s.key} section={s}
          onSelect={onSelect} onAction={onAction} onSchedule={onSchedule}
          onComposeLabReminder={onComposeLabReminder} actionInProgress={actionInProgress} />
      ))}
    </div>
  );
}

function DailySection({ section, onSelect, onAction, onSchedule, onComposeLabReminder, actionInProgress }) {
  const [expanded, setExpanded] = useState(!section.collapsedByDefault);
  const empty = section.list.length === 0;
  if (empty && section.key !== 'needsAttention' && section.key !== 'labsOverdue') return null;

  return (
    <div style={sharedStyles.card}>
      <div style={{
        ...sharedStyles.cardHeader, borderLeft: `4px solid ${section.accent}`,
        cursor: section.collapsedByDefault ? 'pointer' : 'default',
      }}
        onClick={() => section.collapsedByDefault && setExpanded(e => !e)}>
        <div>
          <h3 style={{ ...sharedStyles.cardTitle, fontSize: '16px' }}>
            {section.title} <span style={{ color: '#888', marginLeft: '6px', fontWeight: 500 }}>({section.list.length})</span>
          </h3>
          {section.subtitle && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{section.subtitle}</div>
          )}
        </div>
        {section.collapsedByDefault && (
          <span style={{ fontSize: '12px', color: '#888' }}>{expanded ? 'Hide' : 'Show'}</span>
        )}
      </div>

      {expanded && (
        empty ? (
          <div style={{ padding: '20px 24px', color: section.tone === 'warn' ? '#166534' : '#999', fontSize: '14px' }}>
            {(section.key === 'needsAttention' || section.key === 'labsOverdue') ? '✓ All clear — nothing needs a human right now.' : 'None'}
          </div>
        ) : (
          <>
            <ColumnHeader sectionKey={section.key} />
            <div>
              {section.list.map(p => (
                <DailyRow key={p.protocol_id} patient={p} sectionKey={section.key}
                  onSelect={onSelect} onAction={onAction} onSchedule={onSchedule}
                  onComposeLabReminder={onComposeLabReminder} actionInProgress={actionInProgress} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

function ColumnHeader({ sectionKey }) {
  const isAttention = sectionKey === 'needsAttention' || sectionKey === 'labsOverdue';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.9fr 160px',
      gap: '12px', padding: '8px 18px',
      background: '#fafafa', borderBottom: '1px solid #f0f0f0',
      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
      color: '#666', fontWeight: 600,
    }}>
      <div></div>
      <div>Patient</div>
      <div>{isAttention ? 'WHY' : 'LAB STATUS'}</div>
      <div>Last seen</div>
      <div>Status</div>
      <div style={{ textAlign: 'right' }}>Action</div>
    </div>
  );
}

function DailyRow({ patient, sectionKey, onSelect, onAction, onSchedule, onComposeLabReminder, actionInProgress }) {
  const isAttention = sectionKey === 'needsAttention' || sectionKey === 'labsOverdue';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.9fr 160px',
      gap: '12px', alignItems: 'center',
      padding: '12px 18px', borderBottom: '1px solid #f0f0f0',
      background: isAttention ? '#fef9f3' : '#fff',
    }}>
      <Avatar initials={patient.initials} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
          onClick={() => onSelect(patient)}>{patient.name}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} · {patient.frequency || '—'}
        </div>
        {(patient.upcoming_lab_draw || patient.last_lab_outreach) && (
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {patient.upcoming_lab_draw && <LabScheduledBadge appt={patient.upcoming_lab_draw} compact />}
            {patient.last_lab_outreach && <LabOutreachBadge outreach={patient.last_lab_outreach} compact />}
          </div>
        )}
      </div>
      <div style={{ fontSize: '13px', color: '#333' }}>
        <ActionDescription patient={patient} />
      </div>
      <div style={{ fontSize: '13px' }}>
        {patient.last_encounter ? (
          <>
            <div>{fmtDate(patient.last_encounter.date)}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>{patient.last_encounter.service}</div>
          </>
        ) : <span style={{ color: '#bbb' }}>—</span>}
      </div>
      <StatusStack payment={patient.payment} dispense={patient.dispense} />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {(sectionKey === 'labsOverdue' || sectionKey === 'labsDueSoon') && !patient.labs_scheduled && (
          <button disabled={actionInProgress || !patient.phone} onClick={() => onComposeLabReminder(patient)}
            title={patient.phone ? `Text ${patient.phone}` : 'No phone on file'}
            style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall }}>
            💬 Lab SMS
          </button>
        )}
        <button disabled={actionInProgress}
          onClick={() => onSelect(patient)}
          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
          {isAttention ? 'Fix' : 'Details'}
        </button>
      </div>
    </div>
  );
}

function ActionDescription({ patient }) {
  const ls = patient.lab_status;
  const ds = patient.dispense;

  // Scheduled draw trumps overdue/due-soon: even if labs are technically past
  // due, the action is already booked, so staff shouldn't be nagged.
  if (patient.labs_scheduled && patient.upcoming_lab_draw) {
    const a = patient.upcoming_lab_draw;
    return (
      <span style={{ color: '#1e40af' }}>
        📅 <strong>Draw scheduled</strong> — {fmtDate(a.date)} at {a.time}
      </span>
    );
  }

  if (ls.state === 'overdue') {
    return (
      <span style={{ color: '#991b1b' }}>
        🔴 <strong>{ls.next_lab?.label || 'Labs'}</strong> — overdue by {ls.days_overdue}d
      </span>
    );
  }
  if (ls.state === 'due_soon') {
    return (
      <span style={{ color: '#92400e' }}>
        🟡 <strong>{ls.next_lab?.label || 'Labs'}</strong> — due {fmtDate(ls.next_lab?.targetDate)}
      </span>
    );
  }
  if (ds.state === 'send_now') {
    return <span style={{ color: '#991b1b' }}>📦 <strong>Meds supply exhausted</strong> — send next block</span>;
  }
  if (ds.state === 'due_now') {
    return <span style={{ color: '#9a3412' }}>📦 Refill needed in {ds.days_until_due}d</span>;
  }
  if (ds.state === 'due_soon') {
    return <span style={{ color: '#92400e' }}>📦 Refill in {ds.days_until_due}d</span>;
  }
  if (patient.payment.state === 'unknown') {
    return <span style={{ color: '#9a3412' }}>⚠️ No purchases on file</span>;
  }
  if (ls.state === 'complete') {
    return <span style={{ color: '#666' }}>✓ All lab draws complete</span>;
  }
  if (ls.next_lab) {
    return <span style={{ color: '#666' }}>{ls.next_lab.label} — {fmtDate(ls.next_lab.targetDate)}</span>;
  }
  return <span style={{ color: '#bbb' }}>—</span>;
}

// ───────────────────── Roster Table ─────────────────────

function RosterTable({ patients, onSelect, onAction, actionInProgress }) {
  return (
    <div style={sharedStyles.card}>
      <div style={sharedStyles.cardHeader}>
        <h3 style={sharedStyles.cardTitle}>Patient Roster ({patients.length})</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={sharedStyles.table}>
          <thead>
            <tr>
              <th style={sharedStyles.th}>Patient</th>
              <th style={sharedStyles.th}>Med / Dose</th>
              <th style={sharedStyles.th}>Frequency</th>
              <th style={sharedStyles.th}>On Protocol</th>
              <th style={sharedStyles.th}>Lab Status</th>
              <th style={sharedStyles.th}>Next Lab</th>
              <th style={sharedStyles.th}>Meds / Payment</th>
              <th style={sharedStyles.th} />
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.protocol_id} style={{ cursor: 'pointer' }}
                onClick={(e) => { if (e.target.tagName !== 'BUTTON') onSelect(p); }}>
                <td style={sharedStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar initials={p.initials} small />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.program_type && p.program_type !== 'hrt' && (
                        <div style={{ fontSize: '11px', color: '#888' }}>{p.program_type.replace(/_/g, ' ')}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={sharedStyles.td}>
                  <div style={{ fontSize: '14px' }}>{p.medication || '—'}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.selected_dose || '—'}</div>
                </td>
                <td style={sharedStyles.td}>
                  <span style={{ fontSize: '13px' }}>{p.frequency || '—'}</span>
                </td>
                <td style={sharedStyles.td}>
                  {p.days_on_protocol != null ? (
                    <>
                      <div style={{ fontSize: '13px' }}>{p.days_on_protocol}d</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>since {fmtDate(p.start_date)}</div>
                    </>
                  ) : <span style={{ color: '#999' }}>—</span>}
                </td>
                <td style={sharedStyles.td}>
                  <LabStatusBadge labStatus={p.lab_status} />
                </td>
                <td style={sharedStyles.td}>
                  {p.lab_status.next_lab ? (
                    <>
                      <div style={{ fontSize: '13px' }}>{fmtDate(p.lab_status.next_lab.targetDate)}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.lab_status.next_lab.label}</div>
                    </>
                  ) : <span style={{ color: '#999' }}>—</span>}
                </td>
                <td style={sharedStyles.td}>
                  <StatusStack payment={p.payment} dispense={p.dispense} />
                </td>
                <td style={sharedStyles.td}>
                  <button onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                    style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No patients match the current filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── Patient Side Panel ─────────────────────

function PatientPanel({ patient, onClose, onAction, actionInProgress, onSchedule, onComposeLabReminder }) {
  const ls = patient.lab_status;
  const lsc = LAB_STATUS_CONFIG[ls.state] || LAB_STATUS_CONFIG.on_track;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
      background: '#fff', borderLeft: '1px solid #ddd',
      boxShadow: '-8px 0 24px rgba(0,0,0,0.08)', overflowY: 'auto', zIndex: 100,
    }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{patient.name}</h2>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} • {patient.frequency || '—'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#666' }}>×</button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Status badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Badge bg={lsc.bg} color={lsc.color} icon={lsc.icon} text={ls.label} />
          {patient.upcoming_lab_draw && <LabScheduledBadge appt={patient.upcoming_lab_draw} />}
          <DispensePill dispense={patient.dispense} />
          <PaymentPill payment={patient.payment} />
          {patient.last_lab_outreach && <LabOutreachBadge outreach={patient.last_lab_outreach} />}
        </div>

        {/* Lab Schedule */}
        <LabScheduleBlock patient={patient} onComposeLabReminder={onComposeLabReminder} actionInProgress={actionInProgress} />

        {/* Protocol Summary */}
        <ProtocolSummaryBlock patient={patient} />

        {/* Schedule appointment */}
        {onSchedule && (
          <Section title="Schedule">
            <button onClick={() => onSchedule(patient)}
              style={{ ...sharedStyles.btnPrimary, width: '100%' }}>
              Book a visit for {patient.first_name || patient.name.split(' ')[0]}
            </button>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
              Opens the booking flow inline
            </div>
          </Section>
        )}

        {/* Dispense medication — writes through to service_logs (source of truth) */}
        <DispenseMedicationBlock patient={patient} onAction={onAction} actionInProgress={actionInProgress} />

        {/* Mark lab drawn */}
        <MarkLabDrawnBlock patient={patient} onAction={onAction} actionInProgress={actionInProgress} />

      </div>
    </div>
  );
}

// Inline dispense form — writes a pickup row to service_logs through the
// hrt-tracker API, which is the canonical dispense path. Supports backdating
// so staff can log a pickup that was handed to the patient on a prior date.
function DispenseMedicationBlock({ patient, onAction, actionInProgress }) {
  const [quantity, setQuantity] = useState(1);
  const [doseOverride, setDoseOverride] = useState('');
  const [dispenseDate, setDispenseDate] = useState(todayPacificISO());
  const [fulfillment, setFulfillment] = useState('in_clinic');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ds = patient.dispense || {};

  const submit = async () => {
    if (submitting || actionInProgress) return;
    if (!quantity || quantity <= 0) {
      alert('Enter a valid quantity');
      return;
    }
    const doseText = doseOverride || patient.selected_dose || patient.medication || 'medication';
    if (!confirm(`Log dispense of ${quantity}× ${doseText} for ${patient.name} on ${dispenseDate}?`)) return;

    setSubmitting(true);
    try {
      await onAction('dispense_medication', {
        protocol_id: patient.protocol_id,
        quantity: Number(quantity),
        dosage_override: doseOverride || null,
        dispense_date: dispenseDate,
        fulfillment_method: fulfillment,
        notes: notes || null,
      });
      setQuantity(1);
      setDoseOverride('');
      setDispenseDate(todayPacificISO());
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="Dispense medication">
      {/* Current state summary */}
      <div style={{
        padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e5e5',
        marginBottom: '12px', fontSize: '12px', color: '#444', lineHeight: 1.5,
      }}>
        <div>
          <strong>Last dispense:</strong> {ds.last_dispensed_date
            ? <>{fmtDate(ds.last_dispensed_date)}{ds.last_pickup_qty ? ` · ${ds.last_pickup_qty}×` : ''}{ds.last_pickup_dose ? ` ${ds.last_pickup_dose}` : ''}</>
            : <span style={{ color: '#888' }}>none on file</span>}
        </div>
        <div>
          <strong>Next due:</strong> {ds.next_due_date
            ? <>{fmtDate(ds.next_due_date)} <span style={{ color: '#888' }}>({ds.label})</span></>
            : <span style={{ color: '#888' }}>{ds.label}</span>}
        </div>
        {ds.pickup_count != null && (
          <div style={{ color: '#888', marginTop: '2px' }}>
            {ds.pickup_count} pickup{ds.pickup_count === 1 ? '' : 's'} logged on this protocol
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={sharedStyles.label}>Quantity</label>
          <input type="number" min="1" step="1" value={quantity}
            onChange={e => setQuantity(e.target.value)}
            style={sharedStyles.input} />
        </div>
        <div>
          <label style={sharedStyles.label}>Dispense date</label>
          <input type="date" value={dispenseDate}
            onChange={e => setDispenseDate(e.target.value)}
            max={todayPacificISO()}
            style={sharedStyles.input} />
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={sharedStyles.label}>Dose <span style={{ color: '#888', textTransform: 'none', letterSpacing: 0 }}>(leave blank to use protocol default: {patient.selected_dose || '—'})</span></label>
        <input type="text" value={doseOverride}
          onChange={e => setDoseOverride(e.target.value)}
          placeholder={patient.selected_dose || 'e.g. 0.4ml/80mg'}
          style={sharedStyles.input} />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={sharedStyles.label}>Fulfillment</label>
        <select value={fulfillment} onChange={e => setFulfillment(e.target.value)} style={sharedStyles.select}>
          <option value="in_clinic">In-clinic pickup</option>
          <option value="overnight">Overnight ship</option>
          <option value="take_home">Take-home</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={sharedStyles.label}>Notes (optional)</label>
        <input type="text" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Lot #, tracking, special instructions, etc."
          style={sharedStyles.input} />
      </div>

      <button disabled={submitting || actionInProgress || !quantity}
        onClick={submit}
        style={{ ...sharedStyles.btnPrimary, width: '100%' }}>
        {submitting ? 'Logging…' : `📦 Log dispense (${dispenseDate === todayPacificISO() ? 'today' : `backdated to ${fmtDate(dispenseDate)}`})`}
      </button>

      <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
        Writes to service_logs · updates protocol next-refill date
      </div>
    </Section>
  );
}

// ───────────────────── Side-panel blocks ─────────────────────

function LabScheduleBlock({ patient, onComposeLabReminder, actionInProgress }) {
  const schedule = patient.lab_schedule || [];
  if (schedule.length === 0) {
    return (
      <Section title="Lab schedule">
        <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
          No lab schedule available — protocol may be missing a start date.
        </div>
      </Section>
    );
  }

  return (
    <Section title={`Lab schedule (${patient.lab_status.completed_count}/${patient.lab_status.total_count} complete)`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {schedule.map((draw, i) => {
          const isCompleted = draw.status === 'completed';
          const isOverdue = draw.status === 'overdue';
          const isSkipped = draw.status === 'skipped';
          const isDueSoon = draw.status === 'upcoming' && draw.targetDate && (() => {
            const diff = Math.floor((new Date(draw.targetDate) - new Date()) / 86400000);
            return diff <= 14;
          })();
          const canText = (isOverdue || isDueSoon) && patient.phone;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px',
              background: isCompleted ? '#f0fdf4' : isOverdue ? '#fef2f2' : isSkipped ? '#f9fafb' : '#fff',
              border: `1px solid ${isCompleted ? '#bbf7d0' : isOverdue ? '#fecaca' : '#f0f0f0'}`,
            }}>
              <span style={{ fontSize: '16px' }}>
                {isCompleted ? '✅' : isOverdue ? '🔴' : isSkipped ? '⏭️' : '⏳'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isSkipped ? '#999' : '#000' }}>
                  {draw.label}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {isCompleted
                    ? `Drawn ${fmtDate(draw.completedDate)}`
                    : isSkipped
                      ? 'Skipped'
                      : `Target: ${fmtDate(draw.targetDate)}`}
                </div>
              </div>
              {canText && (
                <button disabled={actionInProgress} onClick={() => onComposeLabReminder(patient)}
                  title={`Text ${patient.phone}`}
                  style={{
                    ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall,
                    fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap',
                  }}>
                  💬 Text
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function MarkLabDrawnBlock({ patient, onAction, actionInProgress }) {
  const [drawLabel, setDrawLabel] = useState('');
  const schedule = patient.lab_schedule || [];
  const pendingDraws = schedule.filter(d => d.status === 'overdue' || d.status === 'upcoming');

  return (
    <Section title="Log blood draw">
      <div style={{ marginBottom: '10px' }}>
        <label style={sharedStyles.label}>Which draw?</label>
        <select value={drawLabel} onChange={e => setDrawLabel(e.target.value)} style={sharedStyles.select}>
          <option value="">Select...</option>
          {pendingDraws.map((d, i) => (
            <option key={i} value={d.label}>{d.label} — target {fmtDate(d.targetDate)}</option>
          ))}
        </select>
      </div>
      <button disabled={actionInProgress || !drawLabel} onClick={async () => {
        if (!confirm(`Log blood draw "${drawLabel}" for ${patient.name} as completed today?`)) return;
        await onAction('mark_lab_drawn', { protocol_id: patient.protocol_id, draw_label: drawLabel });
        setDrawLabel('');
      }}
        style={{ ...sharedStyles.btnPrimary, width: '100%' }}>
        Log blood draw
      </button>
    </Section>
  );
}

function ProtocolSummaryBlock({ patient }) {
  const ps = patient.protocol_summary || {};
  const purchase = patient.purchase_summary;
  const lastEncounter = patient.last_encounter;

  return (
    <Section title="Protocol & history">
      <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#333' }}>
        <Row k="Protocol" v={`${ps.medication || '—'}${ps.dose ? ' · ' + ps.dose : ''}${ps.frequency ? ' · ' + ps.frequency : ''}`} />
        <Row k="Started" v={ps.start_date ? `${fmtDate(ps.start_date)} (${patient.days_on_protocol}d ago)` : '—'} />
        <Row k="Delivery" v={ps.delivery_method ? ps.delivery_method.replace(/_/g, ' ') : '—'} />
        <Row k="Last seen" v={
          lastEncounter
            ? <span>{fmtDate(lastEncounter.date)} <span style={{ color: '#888', fontSize: '12px' }}>({lastEncounter.service})</span></span>
            : <span style={{ color: '#888' }}>no encounters logged</span>
        } />
        {purchase && (
          <Row k="Lifetime spend" v={`$${Math.round(purchase.total_spent)} across ${purchase.count} purchase${purchase.count === 1 ? '' : 's'}`} />
        )}
        <Row k="Medication supply" v={patient.dispense.label} />
        {patient.next_appointment && (
          <Row k="Next appointment" v={`${fmtDate(patient.next_appointment.date)} at ${patient.next_appointment.time}`} />
        )}
      </div>
      <div style={{ marginTop: '12px' }}>
        <a href={`/admin/patient/${patient.patient_id}`}
          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, textDecoration: 'none' }}>
          Open full patient chart →
        </a>
      </div>
    </Section>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px',
      padding: '4px 0', borderBottom: '1px dotted #f0f0f0' }}>
      <span style={{ color: '#888', flexShrink: 0 }}>{k}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '10px', fontWeight: 600 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ───────────────────── Small components ─────────────────────

function Avatar({ initials, small }) {
  const size = small ? 32 : 36;
  const hash = (initials || 'XX').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  const bg = palette[hash % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: small ? '12px' : '13px', flexShrink: 0,
    }}>{initials}</div>
  );
}

function Badge({ bg, color, icon, text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', background: bg, color: color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {icon} {text}
    </span>
  );
}

function LabStatusBadge({ labStatus }) {
  const cfg = LAB_STATUS_CONFIG[labStatus.state] || LAB_STATUS_CONFIG.on_track;
  const progressText = labStatus.completed_count != null
    ? `${labStatus.completed_count}/${labStatus.total_count}`
    : '';
  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '4px 10px', background: cfg.bg, color: cfg.color,
        fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        {cfg.icon} {cfg.label}
      </span>
      {progressText && (
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{progressText} draws</div>
      )}
    </div>
  );
}

function PaymentPill({ payment }) {
  const pc = PAYMENT_CONFIG[payment.state] || PAYMENT_CONFIG.unknown;
  const title = payment.last_purchase_date
    ? `Last purchase: ${payment.last_purchase_date}`
    : 'No purchases on file';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', background: pc.bg, color: pc.color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }} title={title}>
      {pc.icon} {payment.label}
    </span>
  );
}

function DispensePill({ dispense }) {
  const dc = DISPENSE_CONFIG[dispense.state] || DISPENSE_CONFIG.never;
  const title = dispense.last_dispensed_date
    ? `Last supply: ${dispense.last_dispensed_date}`
    : 'No medication dispatched yet';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', background: dc.bg, color: dc.color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }} title={title}>
      {dc.icon} {dispense.label}
    </span>
  );
}

function StatusStack({ payment, dispense }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
      <DispensePill dispense={dispense} />
      <PaymentPill payment={payment} />
    </div>
  );
}
