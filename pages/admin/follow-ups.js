// /pages/admin/follow-ups.js
// Follow-Up Hub — One page to see every patient who needs attention and why
// Tabs: Queue (auto-generated + manual), Leads (sales pipeline), Inactive (60+ days)
// Range Medical System

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';

// ── Type config ──
const TYPE_CONFIG = {
  peptide_renewal:      { label: 'Peptide Renewal',      color: '#7c3aed', bg: '#f5f3ff' },
  protocol_ending:      { label: 'Protocol Ending',      color: '#ea580c', bg: '#fff7ed' },
  wl_payment_due:       { label: 'WL Payment Due',       color: '#2563eb', bg: '#eff6ff' },
  labs_ready:           { label: 'Labs Ready',           color: '#059669', bg: '#ecfdf5' },
  session_verification: { label: 'Session Verify',       color: '#dc2626', bg: '#fef2f2' },
  lead_stale:           { label: 'Stale Lead',           color: '#6b7280', bg: '#f3f4f6' },
  inactive_patient:     { label: 'Inactive',             color: '#9ca3af', bg: '#f9fafb' },
  custom:               { label: 'Custom',               color: '#111',    bg: '#f3f4f6' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
  high:   { label: 'High',   color: '#ea580c', bg: '#fff7ed' },
  medium: { label: 'Medium', color: '#d97706', bg: '#fffbeb' },
  low:    { label: 'Low',    color: '#6b7280', bg: '#f3f4f6' },
};

const LOG_ACTIONS = [
  { value: 'called', label: 'Called' },
  { value: 'texted', label: 'Texted' },
  { value: 'left_vm', label: 'Left VM' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'spoke_with_patient', label: 'Spoke with Patient' },
  { value: 'emailed', label: 'Emailed' },
  { value: 'scheduled', label: 'Scheduled (resolves)' },
  { value: 'renewed', label: 'Renewed (resolves)' },
];

const LEAD_STAGE_CONFIG = {
  new_lead:   { label: 'New Lead',   color: '#3b82f6', bg: '#eff6ff' },
  contacted:  { label: 'Contacted',  color: '#8b5cf6', bg: '#f5f3ff' },
  follow_up:  { label: 'Follow-Up',  color: '#f59e0b', bg: '#fffbeb' },
  booked:     { label: 'Booked',     color: '#10b981', bg: '#ecfdf5' },
  showed:     { label: 'Showed',     color: '#06b6d4', bg: '#ecfeff' },
};

export default function FollowUpsPage() {
  const [tab, setTab] = useState('queue');
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const { session } = useAuth();
  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Log attempt state
  const [expandedId, setExpandedId] = useState(null);
  const [attemptLogs, setAttemptLogs] = useState({});
  const [logAction, setLogAction] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [loggingId, setLoggingId] = useState(null);

  // Snooze state
  const [snoozeId, setSnoozeId] = useState(null);
  const [snoozeDate, setSnoozeDate] = useState('');

  // Create manual follow-up
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    patient_search: '', patient_id: '', patient_name: '',
    trigger_reason: '', priority: 'medium', assigned_to: '', due_date: '',
  });
  const [patientResults, setPatientResults] = useState([]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'queue') {
        const res = await fetch('/api/admin/follow-ups?tab=queue', { headers: authHeaders() });
        const data = await res.json();
        setFollowUps(Array.isArray(data) ? data : []);
      } else if (tab === 'leads') {
        const res = await fetch('/api/admin/follow-ups?tab=leads', { headers: authHeaders() });
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
      } else if (tab === 'inactive') {
        const res = await fetch('/api/admin/follow-ups?tab=inactive', { headers: authHeaders() });
        const data = await res.json();
        setInactive(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading(false);
  }, [tab, authHeaders]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees?basic=true', { headers: authHeaders() });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data.filter(e => e.is_active) : []);
    } catch (e) {
      console.error('Employee fetch error:', e);
    }
  }, [authHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Fetch attempt logs ──
  const fetchLogs = async (followUpId) => {
    try {
      const res = await fetch(`/api/admin/follow-ups?tab=logs&follow_up_id=${followUpId}`, { headers: authHeaders() });
      const data = await res.json();
      setAttemptLogs(prev => ({ ...prev, [followUpId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error('Fetch logs error:', e);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!attemptLogs[id]) fetchLogs(id);
    }
  };

  // ── Actions ──
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const logAttempt = async (followUpId) => {
    if (!logAction) return;
    setLoggingId(followUpId);
    try {
      await fetch('/api/admin/follow-ups', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'log', follow_up_id: followUpId, log_action: logAction, notes: logNotes }),
      });
      setLogAction('');
      setLogNotes('');
      showToast('Attempt logged');
      fetchLogs(followUpId);
      fetchData();
    } catch (e) {
      console.error('Log error:', e);
    }
    setLoggingId(null);
  };

  const assignFollowUp = async (id, employeeId) => {
    await fetch('/api/admin/follow-ups', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, assigned_to: employeeId || null }),
    });
    showToast('Assigned');
    fetchData();
  };

  const snoozeFollowUp = async (id) => {
    if (!snoozeDate) return;
    await fetch('/api/admin/follow-ups', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, snoozed_until: snoozeDate }),
    });
    setSnoozeId(null);
    setSnoozeDate('');
    showToast('Snoozed');
    fetchData();
  };

  const completeFollowUp = async (id, outcome = 'completed') => {
    await fetch('/api/admin/follow-ups', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, outcome }),
    });
    showToast('Completed');
    fetchData();
  };

  const dismissFollowUp = async (id) => {
    await fetch('/api/admin/follow-ups', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, status: 'dismissed' }),
    });
    showToast('Dismissed');
    fetchData();
  };

  // ── Patient search for manual create ──
  const searchPatients = async (query) => {
    if (query.length < 2) { setPatientResults([]); return; }
    const { data } = await supabase
      .from('patients')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(8);
    setPatientResults(data || []);
  };

  const createFollowUp = async () => {
    if (!createForm.patient_id || !createForm.trigger_reason) return;
    await fetch('/api/admin/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: createForm.patient_id,
        patient_name: createForm.patient_name,
        trigger_reason: createForm.trigger_reason,
        priority: createForm.priority,
        assigned_to: createForm.assigned_to || null,
        due_date: createForm.due_date || undefined,
      }),
    });
    setShowCreate(false);
    setCreateForm({ patient_search: '', patient_id: '', patient_name: '', trigger_reason: '', priority: 'medium', assigned_to: '', due_date: '' });
    setPatientResults([]);
    showToast('Follow-up created');
    fetchData();
  };

  // ── Compute stats ──
  const todayStr = new Date().toISOString().split('T')[0];
  const stats = {
    total: followUps.length,
    urgent: followUps.filter(f => f.priority === 'urgent').length,
    dueToday: followUps.filter(f => f.due_date === todayStr).length,
    overdue: followUps.filter(f => f.due_date && f.due_date < todayStr).length,
  };

  // ── Filter follow-ups ──
  const filtered = followUps.filter(f => {
    if (typeFilter && f.type !== typeFilter) return false;
    if (assignedFilter && f.assigned_to !== assignedFilter) return false;
    if (priorityFilter && f.priority !== priorityFilter) return false;
    return true;
  });

  // ── Helpers ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const daysSinceLabel = (dateStr) => {
    if (!dateStr) return 'Never';
    const days = Math.floor((new Date() - new Date(dateStr + 'T00:00:00')) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <AdminLayout title="Follow-Ups">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#111', color: '#fff', padding: '12px 20px',
          fontSize: 14, fontWeight: 500,
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ ...sharedStyles.pageHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={sharedStyles.pageTitle}>Follow-Ups</h1>
          <p style={sharedStyles.pageSubtitle}>Every patient who needs attention and why</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={sharedStyles.btnPrimary}>
          + New Follow-Up
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: stats.total, color: '#111' },
          { label: 'Urgent', value: stats.urgent, color: '#dc2626' },
          { label: 'Due Today', value: stats.dueToday, color: '#2563eb' },
          { label: 'Overdue', value: stats.overdue, color: '#ea580c' },
        ].map(s => (
          <div key={s.label} style={sharedStyles.statCard}>
            <div style={{ ...sharedStyles.statValue, color: s.color }}>{s.value}</div>
            <div style={sharedStyles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #e5e5e5' }}>
        {[
          { key: 'queue', label: `Queue (${stats.total})` },
          { key: 'leads', label: `Leads (${leads.length})` },
          { key: 'inactive', label: `Inactive (${inactive.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 24px', fontSize: 15, fontWeight: tab === t.key ? 600 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #111' : '2px solid transparent',
              color: tab === t.key ? '#111' : '#666',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── QUEUE TAB ── */}
      {tab === 'queue' && (
        <>
          {/* Filters */}
          <div style={sharedStyles.filterBar}>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ ...sharedStyles.select, width: 180 }}
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={assignedFilter}
              onChange={e => setAssignedFilter(e.target.value)}
              style={{ ...sharedStyles.select, width: 180 }}
            >
              <option value="">All Staff</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ ...sharedStyles.select, width: 160 }}
            >
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={sharedStyles.emptyState}><div style={sharedStyles.emptyText}>Loading...</div></div>
          ) : filtered.length === 0 ? (
            <div style={sharedStyles.emptyState}>
              <div style={sharedStyles.emptyIcon}>&#10003;</div>
              <div style={sharedStyles.emptyText}>All caught up — no follow-ups pending</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filtered.map(f => {
                const typeConf = TYPE_CONFIG[f.type] || TYPE_CONFIG.custom;
                const priConf = PRIORITY_CONFIG[f.priority] || PRIORITY_CONFIG.medium;
                const isOverdue = f.due_date && f.due_date < todayStr;
                const isExpanded = expandedId === f.id;
                const logs = attemptLogs[f.id] || [];

                return (
                  <div key={f.id} style={{
                    border: '1px solid #e5e5e5', borderBottom: 'none',
                    padding: '16px 20px', background: isOverdue ? '#fef2f2' : '#fff',
                  }}>
                    {/* Main row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        {/* Patient name + type badge + priority */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Link href={`/patients/${f.patient_id}`} style={{
                            fontSize: 16, fontWeight: 600, color: '#111', textDecoration: 'none',
                          }}>{f.patient_name || 'Unknown'}</Link>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', fontSize: 12,
                            fontWeight: 600, textTransform: 'uppercase',
                            color: typeConf.color, background: typeConf.bg,
                          }}>{typeConf.label}</span>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', fontSize: 11,
                            fontWeight: 600, textTransform: 'uppercase',
                            color: priConf.color, background: priConf.bg,
                          }}>{priConf.label}</span>
                        </div>
                        {/* Trigger reason */}
                        <div style={{ fontSize: 14, color: '#555', marginBottom: 6 }}>
                          {f.trigger_reason}
                        </div>
                        {/* Meta line */}
                        <div style={{ fontSize: 13, color: '#888', display: 'flex', gap: 16 }}>
                          <span>Due: {isOverdue ? <strong style={{ color: '#dc2626' }}>{formatDate(f.due_date)} (overdue)</strong> : formatDate(f.due_date)}</span>
                          {f.assigned_to_name && <span>Assigned: {f.assigned_to_name}</span>}
                          {f.status === 'in_progress' && <span style={{ color: '#2563eb', fontWeight: 500 }}>In Progress</span>}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <button
                          onClick={() => toggleExpand(f.id)}
                          style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSecondary }}
                        >{isExpanded ? 'Close' : 'Log'}</button>
                        <select
                          value={f.assigned_to || ''}
                          onChange={e => assignFollowUp(f.id, e.target.value)}
                          style={{ ...sharedStyles.select, width: 130, padding: '6px 8px', fontSize: 13 }}
                        >
                          <option value="">Assign...</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        {snoozeId === f.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="date"
                              value={snoozeDate}
                              onChange={e => setSnoozeDate(e.target.value)}
                              style={{ ...sharedStyles.input, width: 140, padding: '6px 8px', fontSize: 13 }}
                            />
                            <button onClick={() => snoozeFollowUp(f.id)}
                              style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnPrimary }}>Go</button>
                            <button onClick={() => { setSnoozeId(null); setSnoozeDate(''); }}
                              style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSecondary }}>X</button>
                          </div>
                        ) : (
                          <button onClick={() => setSnoozeId(f.id)}
                            style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSecondary }}>Snooze</button>
                        )}
                        <button onClick={() => completeFollowUp(f.id)}
                          style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSuccess }}>Done</button>
                        <button onClick={() => dismissFollowUp(f.id)}
                          style={{ ...sharedStyles.btnSmall, color: '#999', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}>Dismiss</button>
                      </div>
                    </div>

                    {/* Expanded: attempt log + new attempt form */}
                    {isExpanded && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #eee' }}>
                        {/* Log new attempt */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 4 }}>Action</div>
                            <select
                              value={logAction}
                              onChange={e => setLogAction(e.target.value)}
                              style={{ ...sharedStyles.select, width: 200, padding: '8px 10px' }}
                            >
                              <option value="">Select action...</option>
                              {LOG_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 4 }}>Notes</div>
                            <input
                              value={logNotes}
                              onChange={e => setLogNotes(e.target.value)}
                              placeholder="What happened?"
                              style={{ ...sharedStyles.input, padding: '8px 10px' }}
                            />
                          </div>
                          <button
                            onClick={() => logAttempt(f.id)}
                            disabled={!logAction || loggingId === f.id}
                            style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnPrimary, opacity: logAction ? 1 : 0.5 }}
                          >Log</button>
                        </div>

                        {/* Previous attempts */}
                        {logs.length > 0 ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>
                              Attempt History
                            </div>
                            {logs.map(log => (
                              <div key={log.id} style={{
                                display: 'flex', gap: 12, padding: '6px 0',
                                borderBottom: '1px solid #f5f5f5', fontSize: 13, color: '#444',
                              }}>
                                <span style={{ color: '#888', minWidth: 120 }}>{formatTimestamp(log.created_at)}</span>
                                <span style={{ fontWeight: 500 }}>{log.logged_by_name || 'Staff'}</span>
                                <span style={{ textTransform: 'capitalize' }}>{(log.action || '').replace(/_/g, ' ')}</span>
                                {log.notes && <span style={{ color: '#666' }}>— {log.notes}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#999' }}>No attempts logged yet</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Close bottom border */}
              <div style={{ borderTop: '1px solid #e5e5e5' }} />
            </div>
          )}
        </>
      )}

      {/* ── LEADS TAB ── */}
      {tab === 'leads' && (
        loading ? (
          <div style={sharedStyles.emptyState}><div style={sharedStyles.emptyText}>Loading...</div></div>
        ) : leads.length === 0 ? (
          <div style={sharedStyles.emptyState}>
            <div style={sharedStyles.emptyText}>No active leads</div>
          </div>
        ) : (
          <div style={sharedStyles.card}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Name</th>
                  <th style={sharedStyles.th}>Stage</th>
                  <th style={sharedStyles.th}>Source</th>
                  <th style={sharedStyles.th}>Assigned</th>
                  <th style={sharedStyles.th}>Age</th>
                  <th style={sharedStyles.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const stageConf = LEAD_STAGE_CONFIG[lead.stage] || { label: lead.stage, color: '#666', bg: '#f3f4f6' };
                  const daysSince = Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={lead.id} style={sharedStyles.trHover}>
                      <td style={{ ...sharedStyles.td, fontWeight: 600 }}>
                        {lead.patient_id ? (
                          <Link href={`/patients/${lead.patient_id}`} style={{ color: '#111', textDecoration: 'none' }}>
                            {lead.first_name} {lead.last_name}
                          </Link>
                        ) : (
                          `${lead.first_name || ''} ${lead.last_name || ''}`
                        )}
                      </td>
                      <td style={sharedStyles.td}>
                        <span style={{
                          padding: '3px 10px', fontSize: 12, fontWeight: 600,
                          color: stageConf.color, background: stageConf.bg,
                        }}>{stageConf.label}</span>
                      </td>
                      <td style={{ ...sharedStyles.td, fontSize: 14, color: '#666' }}>{lead.source || '—'}</td>
                      <td style={{ ...sharedStyles.td, fontSize: 14, color: '#666' }}>{lead.assigned_to || '—'}</td>
                      <td style={{ ...sharedStyles.td, fontSize: 14, color: daysSince > 3 ? '#dc2626' : '#666' }}>
                        {daysSince}d
                      </td>
                      <td style={{ ...sharedStyles.td, fontSize: 13, color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── INACTIVE TAB ── */}
      {tab === 'inactive' && (
        loading ? (
          <div style={sharedStyles.emptyState}><div style={sharedStyles.emptyText}>Loading...</div></div>
        ) : inactive.length === 0 ? (
          <div style={sharedStyles.emptyState}>
            <div style={sharedStyles.emptyText}>No inactive patients found</div>
          </div>
        ) : (
          <div style={sharedStyles.card}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Patient</th>
                  <th style={sharedStyles.th}>Last Visit</th>
                  <th style={sharedStyles.th}>Last Protocol</th>
                  <th style={sharedStyles.th}>Protocol Ended</th>
                  <th style={sharedStyles.th}></th>
                </tr>
              </thead>
              <tbody>
                {inactive.map(p => (
                  <tr key={p.patient_id} style={sharedStyles.trHover}>
                    <td style={{ ...sharedStyles.td, fontWeight: 600 }}>
                      <Link href={`/patients/${p.patient_id}`} style={{ color: '#111', textDecoration: 'none' }}>
                        {p.patient_name}
                      </Link>
                    </td>
                    <td style={sharedStyles.td}>
                      <span style={{ color: '#dc2626' }}>{daysSinceLabel(p.last_visit)}</span>
                    </td>
                    <td style={{ ...sharedStyles.td, color: '#555' }}>{p.last_protocol || '—'}</td>
                    <td style={{ ...sharedStyles.td, color: '#888' }}>{formatDate(p.last_protocol_end)}</td>
                    <td style={sharedStyles.td}>
                      <button
                        onClick={() => {
                          setShowCreate(true);
                          setCreateForm(prev => ({
                            ...prev,
                            patient_id: p.patient_id,
                            patient_name: p.patient_name,
                            patient_search: p.patient_name,
                            trigger_reason: `Re-engagement: ${p.last_protocol || 'prior patient'}`,
                          }));
                        }}
                        style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSecondary }}
                      >Create Follow-Up</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── CREATE FOLLOW-UP MODAL ── */}
      {showCreate && (
        <div style={sharedStyles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...sharedStyles.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h3 style={sharedStyles.modalTitle}>New Follow-Up</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={sharedStyles.modalBody}>
              {/* Patient search */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Patient</label>
                {createForm.patient_id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{createForm.patient_name}</span>
                    <button onClick={() => setCreateForm(prev => ({ ...prev, patient_id: '', patient_name: '', patient_search: '' }))}
                      style={{ ...sharedStyles.btnSmall, ...sharedStyles.btnSecondary, padding: '2px 8px' }}>Change</button>
                  </div>
                ) : (
                  <div>
                    <input
                      value={createForm.patient_search}
                      onChange={e => {
                        setCreateForm(prev => ({ ...prev, patient_search: e.target.value }));
                        searchPatients(e.target.value);
                      }}
                      placeholder="Search patient name..."
                      style={sharedStyles.input}
                    />
                    {patientResults.length > 0 && (
                      <div style={{ border: '1px solid #ddd', marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {patientResults.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setCreateForm(prev => ({ ...prev, patient_id: p.id, patient_name: p.name, patient_search: p.name }));
                              setPatientResults([]);
                            }}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f5f5f5' }}
                          >{p.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Reason</label>
                <input
                  value={createForm.trigger_reason}
                  onChange={e => setCreateForm(prev => ({ ...prev, trigger_reason: e.target.value }))}
                  placeholder="Why are you following up?"
                  style={sharedStyles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={sharedStyles.fieldGroup}>
                  <label style={sharedStyles.label}>Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={e => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                    style={sharedStyles.select}
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div style={sharedStyles.fieldGroup}>
                  <label style={sharedStyles.label}>Due Date</label>
                  <input
                    type="date"
                    value={createForm.due_date}
                    onChange={e => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                    style={sharedStyles.input}
                  />
                </div>
              </div>

              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Assign To</label>
                <select
                  value={createForm.assigned_to}
                  onChange={e => setCreateForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  style={sharedStyles.select}
                >
                  <option value="">Unassigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div style={sharedStyles.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={sharedStyles.btnSecondary}>Cancel</button>
              <button onClick={createFollowUp} disabled={!createForm.patient_id || !createForm.trigger_reason}
                style={{ ...sharedStyles.btnPrimary, opacity: createForm.patient_id && createForm.trigger_reason ? 1 : 0.5 }}>
                Create Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
