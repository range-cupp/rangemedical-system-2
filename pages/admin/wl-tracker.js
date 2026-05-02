// /pages/admin/wl-tracker.js
// Weight Loss Tracker — daily + weekly view of every take-home WL patient,
// their check-in status, payment timing, and inline actions for staff.
// Range Medical

import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  upcoming:       { icon: '⏳', label: 'Upcoming',         bg: '#f5f5f5', color: '#666' },
  due_today:      { icon: '📤', label: 'Send today',       bg: '#dbeafe', color: '#1e40af' },
  overdue_send:   { icon: '⚠️', label: 'Overdue to send',  bg: '#fef3c7', color: '#92400e' },
  sent:           { icon: '📤', label: 'Reminder sent',    bg: '#dbeafe', color: '#1e40af' },
  nudged:         { icon: '🔔', label: '1st nudge sent',   bg: '#fef3c7', color: '#92400e' },
  final_nudged:   { icon: '🚨', label: 'Final nudge sent', bg: '#fed7aa', color: '#9a3412' },
  completed:      { icon: '✅', label: 'Completed',        bg: '#dcfce7', color: '#166534' },
  late:           { icon: '⏰', label: 'Late',             bg: '#dcfce7', color: '#166534' },
  missed:         { icon: '❌', label: 'Missed',           bg: '#fee2e2', color: '#991b1b' },
  no_schedule:    { icon: '➖', label: 'No injection day', bg: '#f5f5f5', color: '#999' },
};

const PAYMENT_CONFIG = {
  paid:     { icon: '🟢', bg: '#dcfce7', color: '#166534' },
  due_soon: { icon: '🟡', bg: '#fef3c7', color: '#92400e' },
  due_now:  { icon: '🟠', bg: '#fed7aa', color: '#9a3412' },
  overdue:  { icon: '🔴', bg: '#fee2e2', color: '#991b1b' },
  comp:     { icon: '🆓', bg: '#e0e7ff', color: '#3730a3' },
  unknown:  { icon: '❔', bg: '#f5f5f5', color: '#666' },
};

function todayPacificISO() {
  const pst = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pst.setHours(0, 0, 0, 0);
  return pst.toISOString().split('T')[0];
}

function startOfWeek(dateISO) {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
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

function fmtRange(start, end) {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const sameMonth = s.getMonth() === e.getMonth();
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const eStr = sameMonth
    ? e.toLocaleDateString('en-US', { day: 'numeric' })
    : e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${sStr} – ${eStr}, ${e.getFullYear()}`;
}

export default function WLTrackerPage() {
  const { session } = useAuth();
  const [view, setView] = useState('daily'); // 'daily' | 'weekly'
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayPacificISO()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
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
      const r = await fetch(`/api/admin/wl-tracker?week_start=${weekStart}`, { headers: authHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [weekStart, session, authHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const today = data?.today || todayPacificISO();
  const todayDayName = useMemo(() => {
    const d = new Date(today + 'T12:00:00');
    return DAYS[d.getDay()];
  }, [today]);

  const patients = data?.patients || [];

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus === 'reminders_off' && p.reminder_enabled) return false;
      if (filterStatus === 'opted_out' && !p.reminder_opt_out) return false;
      if (filterStatus === 'payment_due' && !['due_now', 'due_soon', 'overdue'].includes(p.payment.state)) return false;
      if (filterStatus === 'missed' && p.cell_status.status !== 'missed') return false;
      return true;
    });
  }, [patients, search, filterStatus]);

  // Daily view: bucket today's patients
  const dailyBuckets = useMemo(() => {
    const reminders = []; // patients whose injection day is today
    const nudges1 = [];   // status === 'sent' (i.e. cron sent original yesterday OR earlier in cycle)
    const nudgesFinal = []; // status === 'nudged' or final_nudged but not yet completed
    const completedToday = [];
    const overdueToday = [];

    for (const p of patients) {
      if (!p.reminder_enabled || p.reminder_opt_out) continue;
      const cs = p.cell_status;

      if (cs.status === 'due_today') reminders.push(p);
      else if (cs.status === 'overdue_send') overdueToday.push(p);
      else if (cs.status === 'sent') nudges1.push(p);
      else if (cs.status === 'nudged' || cs.status === 'final_nudged') nudgesFinal.push(p);
      else if ((cs.status === 'completed' || cs.status === 'late') && cs.checkin_date === today) {
        completedToday.push(p);
      }
    }

    return { reminders, nudges1, nudgesFinal, completedToday, overdueToday };
  }, [patients, today]);

  const handleAction = async (action, body) => {
    setActionInProgress(true);
    try {
      const r = await fetch('/api/admin/wl-tracker', {
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

  return (
    <AdminLayout title="Weight Loss Tracker">
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={sharedStyles.pageHeader}>
          <h1 style={sharedStyles.pageTitle}>Weight Loss Tracker</h1>
          <p style={sharedStyles.pageSubtitle}>
            Take-home patient check-ins, nudges, and payment timing
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Stats bar */}
        {data && <StatsBar stats={data.stats} trend={data.trend} weekStart={data.week_start} weekEnd={data.week_end} />}

        {/* View toggle + week navigation */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid #ddd', background: '#fff' }}>
            {['daily', 'weekly'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: '10px 20px', border: 'none', cursor: 'pointer',
                  background: view === v ? '#000' : '#fff',
                  color: view === v ? '#fff' : '#000',
                  fontSize: '14px', fontWeight: '600', textTransform: 'capitalize',
                }}>
                {v === 'daily' ? `Daily — ${todayDayName}` : 'Weekly Grid'}
              </button>
            ))}
          </div>
          {view === 'weekly' && (
            <WeekNav
              weekStart={weekStart}
              weekEnd={data?.week_end || addDaysISO(weekStart, 6)}
              setWeekStart={setWeekStart}
              today={today}
            />
          )}
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
            <option value="missed">Missed this week</option>
            <option value="payment_due">Payment due soon</option>
            <option value="reminders_off">Reminders off</option>
            <option value="opted_out">Opted out</option>
          </select>
        </div>

        {loading && !data && <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading...</div>}

        {/* Main view */}
        {data && view === 'daily' && (
          <DailyView
            buckets={dailyBuckets}
            todayDayName={todayDayName}
            today={today}
            onSelect={setSelectedPatient}
            onAction={handleAction}
            actionInProgress={actionInProgress}
          />
        )}

        {data && view === 'weekly' && (
          <WeeklyGrid
            patients={filteredPatients}
            weekStart={data.week_start}
            today={today}
            onSelect={setSelectedPatient}
          />
        )}

        {/* Roster table */}
        {data && (
          <RosterTable
            patients={filteredPatients}
            onSelect={setSelectedPatient}
            onAction={handleAction}
            actionInProgress={actionInProgress}
          />
        )}

        {/* Side panel for selected patient */}
        {selectedPatient && (
          <PatientPanel
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onAction={handleAction}
            actionInProgress={actionInProgress}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ───────────────────── Stats Bar ─────────────────────

function StatsBar({ stats, trend, weekStart, weekEnd }) {
  const trendCells = trend.map(t => {
    const h = Math.max(4, Math.round(t.completion_pct * 0.4)); // 0–40px
    return { ...t, height: h };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
      <StatBlock
        label={`Week of ${fmtRange(weekStart, weekEnd)}`}
        value={`${stats.completion_pct}%`}
        sub={`${stats.completed_this_week}/${stats.sent_this_week} check-ins`}
      />
      <div style={{ ...sharedStyles.statCard, padding: '16px 18px' }}>
        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4-Week Trend</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '46px', marginTop: '8px' }}>
          {trendCells.map((t, i) => (
            <div key={t.week_start} title={`Week of ${fmtDate(t.week_start)}: ${t.completion_pct}% (${t.completed}/${t.sent})`}
              style={{
                flex: 1, height: t.height + 'px',
                background: i === trendCells.length - 1 ? '#000' : '#999',
                minHeight: '4px',
              }} />
          ))}
        </div>
      </div>
      <StatBlock
        label="Payment outreach now"
        value={stats.payment_due_now}
        sub={`+${stats.payment_due_soon} due soon`}
        accent={stats.payment_due_now > 0 ? '#9a3412' : null}
      />
      <StatBlock
        label="Missed this week"
        value={stats.missed_this_week}
        accent={stats.missed_this_week > 0 ? '#991b1b' : null}
      />
      <StatBlock
        label="Reminders off"
        value={stats.reminders_disabled}
        sub={`${stats.opt_outs} opted out`}
        accent={stats.reminders_disabled > 5 ? '#92400e' : null}
      />
      <StatBlock
        label="Total active"
        value={stats.total_patients}
        sub="take-home patients"
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

// ───────────────────── Week Nav ─────────────────────

function WeekNav({ weekStart, weekEnd, setWeekStart, today }) {
  const todayWeekStart = startOfWeek(today);
  const isThisWeek = weekStart === todayWeekStart;
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
        style={{ ...sharedStyles.btnSecondary, padding: '8px 12px', fontSize: '14px' }}>
        ← Prev
      </button>
      <div style={{ padding: '8px 14px', background: '#f5f5f5', fontSize: '14px', fontWeight: 600, minWidth: '180px', textAlign: 'center' }}>
        {fmtRange(weekStart, weekEnd)}
      </div>
      <button onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
        style={{ ...sharedStyles.btnSecondary, padding: '8px 12px', fontSize: '14px' }}>
        Next →
      </button>
      {!isThisWeek && (
        <button onClick={() => setWeekStart(todayWeekStart)}
          style={{ ...sharedStyles.btnPrimary, padding: '8px 14px', fontSize: '14px' }}>
          Today
        </button>
      )}
    </div>
  );
}

// ───────────────────── Daily View ─────────────────────

function DailyView({ buckets, todayDayName, today, onSelect, onAction, actionInProgress }) {
  const sections = [
    { key: 'reminders', title: `📤 Reminders going out today (${todayDayName})`, list: buckets.reminders, accent: '#1e40af' },
    { key: 'overdueToday', title: `⚠️ Overdue to send today`, list: buckets.overdueToday, accent: '#92400e' },
    { key: 'nudges1', title: `🔔 1st nudges due today`, list: buckets.nudges1, accent: '#92400e' },
    { key: 'nudgesFinal', title: `🚨 Final nudges due today`, list: buckets.nudgesFinal, accent: '#9a3412' },
    { key: 'completedToday', title: `✅ Completed today`, list: buckets.completedToday, accent: '#166534' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      {sections.map(s => (
        <div key={s.key} style={sharedStyles.card}>
          <div style={{ ...sharedStyles.cardHeader, borderLeft: `4px solid ${s.accent}` }}>
            <h3 style={{ ...sharedStyles.cardTitle, fontSize: '16px' }}>
              {s.title} <span style={{ color: '#888', marginLeft: '8px' }}>({s.list.length})</span>
            </h3>
          </div>
          {s.list.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '14px' }}>None</div>
          ) : (
            <div>
              {s.list.map(p => (
                <DailyRow key={p.protocol_id} patient={p} today={today}
                  onSelect={onSelect} onAction={onAction} actionInProgress={actionInProgress} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DailyRow({ patient, today, onSelect, onAction, actionInProgress }) {
  const cs = patient.cell_status;
  const sc = STATUS_CONFIG[cs.status] || STATUS_CONFIG.upcoming;
  const pc = PAYMENT_CONFIG[patient.payment.state] || PAYMENT_CONFIG.unknown;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr 160px 140px 180px 220px',
      gap: '12px', alignItems: 'center',
      padding: '12px 18px', borderBottom: '1px solid #f0f0f0',
    }}>
      <Avatar initials={patient.initials} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
          onClick={() => onSelect(patient)}>{patient.name}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} • {patient.frequency}
        </div>
      </div>
      <div style={{ fontSize: '13px' }}>
        <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Last weight</div>
        <div>{patient.last_weight ? `${patient.last_weight} lb` : '—'}</div>
        <div style={{ fontSize: '11px', color: '#999' }}>{fmtDate(patient.last_checkin_date) || '—'}</div>
      </div>
      <Badge bg={sc.bg} color={sc.color} icon={sc.icon} text={sc.label} />
      <PaymentPill payment={patient.payment} />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button disabled={actionInProgress}
          onClick={() => onAction('send_now', { protocol_id: patient.protocol_id })}
          style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall }}>
          Send now
        </button>
        <button disabled={actionInProgress}
          onClick={() => onSelect(patient)}
          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
          Details
        </button>
      </div>
    </div>
  );
}

// ───────────────────── Weekly Grid ─────────────────────

function WeeklyGrid({ patients, weekStart, today, onSelect }) {
  // Bucket patients by their expected_date_this_week (one card per day they're scheduled)
  const byDay = useMemo(() => {
    const buckets = {};
    for (let i = 0; i < 7; i++) {
      const d = addDaysISO(weekStart, i);
      buckets[d] = [];
    }
    for (const p of patients) {
      if (!p.expected_date_this_week) continue;
      if (buckets[p.expected_date_this_week]) {
        buckets[p.expected_date_this_week].push(p);
      }
    }
    return buckets;
  }, [patients, weekStart]);

  const noDayPatients = patients.filter(p => !p.expected_date_this_week);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px',
        background: '#fff', border: '1px solid #e5e5e5',
      }}>
        {[...Array(7)].map((_, i) => {
          const d = addDaysISO(weekStart, i);
          const isToday = d === today;
          const list = byDay[d] || [];
          return (
            <div key={d} style={{
              padding: '12px', minHeight: '120px',
              borderRight: i < 6 ? '1px solid #f0f0f0' : 'none',
              background: isToday ? '#fffbeb' : '#fff',
            }}>
              <div style={{
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: isToday ? '#92400e' : '#666', fontWeight: 600,
                marginBottom: '8px',
              }}>
                {DAY_SHORT[i]} {fmtDate(d)} {isToday && '· TODAY'}
                <span style={{ float: 'right', color: '#999' }}>{list.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {list.map(p => <GridCard key={p.protocol_id} patient={p} onSelect={onSelect} />)}
                {list.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#bbb', padding: '8px 0' }}>—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {noDayPatients.length > 0 && (
        <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <strong style={{ fontSize: '13px' }}>⚠️ {noDayPatients.length} patient{noDayPatients.length === 1 ? '' : 's'} have no injection day set</strong>
          <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px' }}>
            (Reminders won't fire — set their day below.)
          </span>
        </div>
      )}
    </div>
  );
}

function GridCard({ patient, onSelect }) {
  const cs = patient.cell_status;
  const sc = STATUS_CONFIG[cs.status] || STATUS_CONFIG.upcoming;
  const pc = PAYMENT_CONFIG[patient.payment.state] || PAYMENT_CONFIG.unknown;

  return (
    <div onClick={() => onSelect(patient)}
      style={{
        padding: '8px 10px', background: sc.bg, border: `1px solid ${sc.color}30`,
        cursor: 'pointer', fontSize: '12px',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 600, color: sc.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sc.icon} {patient.name}
        </span>
        <span title={patient.payment.label} style={{ fontSize: '11px' }}>{pc.icon}</span>
      </div>
      <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
        {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''}
      </div>
      {(cs.status === 'completed' || cs.status === 'late') && cs.weight && (
        <div style={{ color: sc.color, fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
          {cs.weight} lb {cs.status === 'late' && `· ⏰ ${cs.late_by_days}d late`}
        </div>
      )}
    </div>
  );
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
              <th style={sharedStyles.th}>Inj Day</th>
              <th style={sharedStyles.th}>Med / Dose</th>
              <th style={sharedStyles.th}>Cadence</th>
              <th style={sharedStyles.th}>Last Check-in</th>
              <th style={sharedStyles.th}>4-wk Rate</th>
              <th style={sharedStyles.th}>Payment</th>
              <th style={sharedStyles.th}>Reminders</th>
              <th style={sharedStyles.th} />
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.protocol_id} style={{ cursor: 'pointer' }}
                onClick={(e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') onSelect(p); }}>
                <td style={sharedStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar initials={p.initials} small />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.reminder_opt_out && (
                        <div style={{ fontSize: '11px', color: '#991b1b' }}>OPTED OUT{p.reminder_opt_out_reason ? ` — ${p.reminder_opt_out_reason}` : ''}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={sharedStyles.td}>
                  {p.injection_day ? (
                    <span style={{ fontSize: '13px' }}>{p.injection_day}</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>NOT SET</span>
                  )}
                </td>
                <td style={sharedStyles.td}>
                  <div style={{ fontSize: '14px' }}>{p.medication}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.selected_dose || '—'}</div>
                </td>
                <td style={sharedStyles.td}>
                  <span style={{ fontSize: '13px' }}>{p.cadence_days}d</span>
                </td>
                <td style={sharedStyles.td}>
                  {p.last_checkin_date ? (
                    <>
                      <div style={{ fontSize: '13px' }}>{fmtDate(p.last_checkin_date)}</div>
                      {p.last_weight && <div style={{ fontSize: '12px', color: '#888' }}>{p.last_weight} lb</div>}
                    </>
                  ) : <span style={{ color: '#999' }}>—</span>}
                </td>
                <td style={sharedStyles.td}>
                  {p.four_week_rate != null ? (
                    <span style={{
                      fontWeight: 600,
                      color: p.four_week_rate >= 75 ? '#166534' : p.four_week_rate >= 40 ? '#92400e' : '#991b1b',
                    }}>{p.four_week_rate}%</span>
                  ) : <span style={{ color: '#999' }}>—</span>}
                  <div style={{ fontSize: '11px', color: '#888' }}>{p.four_week_completed}/{p.four_week_originals}</div>
                </td>
                <td style={sharedStyles.td}>
                  <PaymentPill payment={p.payment} />
                </td>
                <td style={sharedStyles.td}>
                  <ReminderToggle
                    enabled={p.reminder_enabled}
                    optOut={p.reminder_opt_out}
                    disabled={actionInProgress}
                    onChange={(enabled) => onAction('toggle_reminder', { protocol_id: p.protocol_id, enabled })}
                  />
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
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No patients match the current filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── Patient Side Panel ─────────────────────

function PatientPanel({ patient, onClose, onAction, actionInProgress }) {
  const [logWeight, setLogWeight] = useState(patient.last_weight ? String(patient.last_weight) : '');
  const [logNotes, setLogNotes] = useState('');
  const [optOutReason, setOptOutReason] = useState(patient.reminder_opt_out_reason || '');
  const [skipReason, setSkipReason] = useState('');
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [showOptOutForm, setShowOptOutForm] = useState(false);
  const [injectionDay, setInjectionDay] = useState(patient.injection_day || '');

  const cs = patient.cell_status;
  const sc = STATUS_CONFIG[cs.status] || STATUS_CONFIG.upcoming;
  const pc = PAYMENT_CONFIG[patient.payment.state] || PAYMENT_CONFIG.unknown;

  const log = async () => {
    if (!logWeight) { alert('Enter a weight'); return; }
    await onAction('mark_completed', {
      protocol_id: patient.protocol_id,
      weight: Number(logWeight),
      notes: logNotes || null,
    });
    setLogWeight(''); setLogNotes('');
  };

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
            {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} • {patient.frequency}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#666' }}>×</button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Status + payment */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Badge bg={sc.bg} color={sc.color} icon={sc.icon} text={sc.label} />
          <PaymentPill payment={patient.payment} />
        </div>

        <Section title="Send check-in SMS now">
          <button disabled={actionInProgress} onClick={() => onAction('send_now', { protocol_id: patient.protocol_id })}
            style={{ ...sharedStyles.btnPrimary, width: '100%' }}>
            📱 Send check-in to {patient.first_name || patient.name.split(' ')[0]} ({patient.phone || 'no phone'})
          </button>
        </Section>

        <Section title="Log check-in manually">
          <div style={{ marginBottom: '10px' }}>
            <label style={sharedStyles.label}>Weight (lb)</label>
            <input type="number" step="0.1" value={logWeight} onChange={e => setLogWeight(e.target.value)}
              style={sharedStyles.input} placeholder="e.g. 198.5" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={sharedStyles.label}>Notes (side effects, etc.)</label>
            <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)}
              rows={3} style={{ ...sharedStyles.input, minHeight: '60px' }}
              placeholder="Any side effects or notes from the patient" />
          </div>
          <button onClick={log} disabled={actionInProgress} style={{ ...sharedStyles.btnPrimary, width: '100%' }}>
            Log check-in
          </button>
        </Section>

        <Section title="Injection day">
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={injectionDay} onChange={e => setInjectionDay(e.target.value)}
              style={{ ...sharedStyles.select, flex: 1 }}>
              <option value="">— None —</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button disabled={actionInProgress || injectionDay === (patient.injection_day || '')}
              onClick={() => onAction('update_injection_day', { protocol_id: patient.protocol_id, injection_day: injectionDay || null })}
              style={{ ...sharedStyles.btnPrimary }}>
              Save
            </button>
          </div>
          {!patient.injection_day && (
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '6px' }}>
              ⚠️ No injection day set — reminders cannot anchor to a day-of-week.
            </div>
          )}
        </Section>

        <Section title="Reminder preferences">
          <ReminderToggle
            enabled={patient.reminder_enabled}
            optOut={patient.reminder_opt_out}
            disabled={actionInProgress}
            onChange={(enabled) => onAction('toggle_reminder', { protocol_id: patient.protocol_id, enabled })}
            wide
          />
          {!showOptOutForm ? (
            <button onClick={() => setShowOptOutForm(true)}
              style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, marginTop: '10px' }}>
              {patient.reminder_opt_out ? 'Change opt-out reason' : 'Mark as opted out'}
            </button>
          ) : (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', border: '1px solid #e5e5e5' }}>
              <label style={sharedStyles.label}>Opt-out reason (optional)</label>
              <input value={optOutReason} onChange={e => setOptOutReason(e.target.value)}
                style={sharedStyles.input}
                placeholder="e.g. patient calls weekly instead" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button disabled={actionInProgress}
                  onClick={async () => {
                    await onAction('set_opt_out', { protocol_id: patient.protocol_id, opt_out: true, reason: optOutReason || null });
                    setShowOptOutForm(false);
                  }}
                  style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, ...sharedStyles.btnDanger }}>
                  Confirm opt-out
                </button>
                {patient.reminder_opt_out && (
                  <button disabled={actionInProgress}
                    onClick={async () => {
                      await onAction('set_opt_out', { protocol_id: patient.protocol_id, opt_out: false });
                      setShowOptOutForm(false);
                    }}
                    style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
                    Clear opt-out
                  </button>
                )}
                <button onClick={() => setShowOptOutForm(false)}
                  style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Skip this cycle">
          {!showSkipForm ? (
            <button onClick={() => setShowSkipForm(true)}
              style={{ ...sharedStyles.btnSecondary, width: '100%' }}>
              Mark this week as skipped
            </button>
          ) : (
            <div>
              <label style={sharedStyles.label}>Reason</label>
              <input value={skipReason} onChange={e => setSkipReason(e.target.value)}
                style={sharedStyles.input}
                placeholder="e.g. traveling, sick, dose hold" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button disabled={actionInProgress}
                  onClick={async () => {
                    await onAction('skip_week', { protocol_id: patient.protocol_id, reason: skipReason });
                    setShowSkipForm(false); setSkipReason('');
                  }}
                  style={{ ...sharedStyles.btnPrimary }}>
                  Confirm skip
                </button>
                <button onClick={() => setShowSkipForm(false)}
                  style={{ ...sharedStyles.btnSecondary }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Recent activity">
          <div style={{ fontSize: '13px', color: '#666' }}>
            <div>Last check-in: <strong style={{ color: '#000' }}>{fmtDate(patient.last_checkin_date) || 'never'}</strong></div>
            {patient.last_weight && <div>Last weight: <strong style={{ color: '#000' }}>{patient.last_weight} lb</strong></div>}
            <div>4-week completion: <strong style={{ color: '#000' }}>
              {patient.four_week_rate != null ? `${patient.four_week_rate}% (${patient.four_week_completed}/${patient.four_week_originals})` : 'no data'}
            </strong></div>
            <div>Payment: <strong style={{ color: '#000' }}>{patient.payment.label}</strong> — {patient.payment.used}/{patient.payment.total} used</div>
            <div>Last purchase: <strong style={{ color: '#000' }}>{fmtDate(patient.last_purchase_date) || 'none'}</strong></div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <a href={`/admin/patient/${patient.patient_id}`}
              style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, textDecoration: 'none' }}>
              Open full patient chart →
            </a>
          </div>
        </Section>
      </div>
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
  // Color hash from initials
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

function PaymentPill({ payment }) {
  const pc = PAYMENT_CONFIG[payment.state] || PAYMENT_CONFIG.unknown;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', background: pc.bg, color: pc.color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }} title={`${payment.used}/${payment.total} used`}>
      {pc.icon} {payment.label}
    </span>
  );
}

function ReminderToggle({ enabled, optOut, disabled, onChange, wide }) {
  if (optOut) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', background: '#fee2e2', color: '#991b1b',
        fontSize: '12px', fontWeight: 600,
      }}>
        OPTED OUT
      </span>
    );
  }
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: disabled ? 'not-allowed' : 'pointer', width: wide ? '100%' : 'auto' }}>
      <input type="checkbox" checked={enabled} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'inherit' }} />
      <span style={{ fontSize: '13px', fontWeight: 500, color: enabled ? '#166534' : '#999' }}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </label>
  );
}
