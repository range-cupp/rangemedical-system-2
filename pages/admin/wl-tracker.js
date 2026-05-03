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
  paid:     { icon: '💳', bg: '#dcfce7', color: '#166534' },
  comp:     { icon: '🆓', bg: '#e0e7ff', color: '#3730a3' },
  unknown:  { icon: '❔', bg: '#f5f5f5', color: '#666' },
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
  const [mode, setMode] = useState('take_home'); // 'take_home' | 'in_clinic'
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
      const r = await fetch(`/api/admin/wl-tracker?mode=${mode}&week_start=${weekStart}`, { headers: authHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [mode, weekStart, session, authHeaders]);

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
      if (filterStatus === 'dispatch_due' && !['send_now', 'due_now', 'due_soon'].includes(p.dispense.state)) return false;
      if (filterStatus === 'missed' && p.cell_status.status !== 'missed') return false;
      return true;
    });
  }, [patients, search, filterStatus]);

  // Bucket patients differently based on mode. Take-home is SMS-cycle driven;
  // in-clinic is appointment-driven. Both put "Needs manual attention" first
  // since that's the only section a human must act on.
  const dailyBuckets = useMemo(() => {
    if (mode === 'in_clinic') {
      const needsAttention = [];
      const visitedToday = [];
      const scheduledToday = [];
      const upcomingThisWeek = [];

      for (const p of patients) {
        const a = p.visit?.today_action;
        switch (a) {
          case 'visit_unlogged_recent':
          case 'no_show_recent':
          case 'missed_cadence':
          case 'needs_booking_soon':
            needsAttention.push(p); break;
          case 'visit_today_logged':    visitedToday.push(p); break;
          case 'visit_today_pending':   scheduledToday.push(p); break;
          case 'upcoming_this_week':    upcomingThisWeek.push(p); break;
          // 'idle' hidden from daily view (still in roster)
        }
      }
      return { needsAttention, visitedToday, scheduledToday, upcomingThisWeek };
    }

    // take_home (default)
    const needsAttention = [];
    const completedToday = [];
    const autoSentToday = [];
    const autoNudgedToday = [];
    const autoFinalToday = [];
    const willSendToday = [];
    const waiting = [];

    for (const p of patients) {
      const a = p.cycle?.today_action;
      switch (a) {
        case 'needs_setup':
        case 'cron_skipped_today':
        case 'missed':
          needsAttention.push(p); break;
        case 'completed_today':       completedToday.push(p); break;
        case 'auto_sent_today':       autoSentToday.push(p); break;
        case 'auto_nudged_today':     autoNudgedToday.push(p); break;
        case 'auto_final_today':      autoFinalToday.push(p); break;
        case 'will_send_today':       willSendToday.push(p); break;
        case 'waiting':               waiting.push(p); break;
      }
    }

    return {
      needsAttention, completedToday,
      autoSentToday, autoNudgedToday, autoFinalToday,
      willSendToday, waiting,
    };
  }, [patients, mode]);

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
            Take-home patient check-ins, nudges, dispatch timing, and payment status
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Mode toggle: Take-home vs In-clinic. Takes precedence as the primary nav. */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e5e5e5' }}>
          {[
            { value: 'take_home', label: '🏠 Take-home', sub: 'SMS check-ins' },
            { value: 'in_clinic', label: '🏥 In-clinic', sub: 'Appointment-based' },
          ].map(m => {
            const active = mode === m.value;
            return (
              <button key={m.value} onClick={() => setMode(m.value)}
                style={{
                  padding: '12px 24px', border: 'none', cursor: 'pointer',
                  background: 'transparent',
                  borderBottom: active ? '3px solid #000' : '3px solid transparent',
                  marginBottom: '-2px',
                  fontSize: '15px', fontWeight: 600,
                  color: active ? '#000' : '#888',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
                }}>
                <span>{m.label}</span>
                <span style={{ fontSize: '11px', color: active ? '#666' : '#aaa', fontWeight: 500 }}>{m.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Mode-specific banner */}
        {mode === 'take_home' ? <AutomationBanner /> : <InClinicBanner />}

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
            <option value="dispatch_due">Needs dispatch soon</option>
            <option value="reminders_off">Reminders off</option>
            <option value="opted_out">Opted out</option>
          </select>
        </div>

        {loading && !data && <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading...</div>}

        {/* Main view */}
        {data && view === 'daily' && (
          <DailyView
            mode={mode}
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
            mode={mode}
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
        label="Dispatch needed now"
        value={stats.dispatch_due_now}
        sub={`+${stats.dispatch_due_soon} due soon`}
        accent={stats.dispatch_due_now > 0 ? '#9a3412' : null}
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

// ───────────────────── In-clinic banner ─────────────────────

function InClinicBanner() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      marginBottom: '20px', padding: '14px 18px',
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1 }}>🏥</div>
      <div style={{ flex: 1, fontSize: '13px', color: '#14532d', lineHeight: 1.5 }}>
        <strong>In-clinic patients are tracked through their appointments.</strong> The system doesn&rsquo;t SMS them — Lily logs weight + side effects directly in the encounter note during the visit.
        {!collapsed && (
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
            <li>Sections below show what&rsquo;s on the calendar today and what&rsquo;s missing documentation</li>
            <li><strong>&ldquo;Needs manual attention&rdquo;</strong> = recent visits with no encounter note, or no-shows that need rescheduling</li>
            <li>The <strong>Open chart</strong> button takes you straight to the patient page where you can log the encounter</li>
            <li>Hybrid patients show in <em>both</em> tabs since they alternate between in-clinic and take-home weeks</li>
          </ul>
        )}
      </div>
      <button onClick={() => setCollapsed(c => !c)}
        style={{ background: 'transparent', border: 'none', color: '#15803d', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
        {collapsed ? 'Show details' : 'Hide'}
      </button>
    </div>
  );
}

// ───────────────────── Automation banner ─────────────────────

function AutomationBanner() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      marginBottom: '20px', padding: '14px 18px',
      background: '#eff6ff', border: '1px solid #bfdbfe',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1 }}>🤖</div>
      <div style={{ flex: 1, fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>
        <strong>This system runs automatically every morning at 9 AM PT.</strong> No one needs to click anything for the standard flow.
        {!collapsed && (
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
            <li><strong>Day 0</strong> — original check-in SMS goes out on each patient&rsquo;s injection day</li>
            <li><strong>Day +1</strong> — if no check-in, a 1st nudge auto-sends the next morning</li>
            <li><strong>Day +3</strong> — if still no check-in, a final nudge auto-sends</li>
            <li>Sections below show <em>what already happened today</em> — no action needed unless a row is in <strong>&ldquo;Needs manual attention.&rdquo;</strong></li>
            <li>The <strong>Send now</strong> button inside Details is for one-offs only (patient lost the link, etc.) — don&rsquo;t use it on a row that already shows &ldquo;Auto-sent today.&rdquo;</li>
          </ul>
        )}
      </div>
      <button onClick={() => setCollapsed(c => !c)}
        style={{ background: 'transparent', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
        {collapsed ? 'Show details' : 'Hide'}
      </button>
    </div>
  );
}

// ───────────────────── Daily View ─────────────────────

function DailyView({ mode, buckets, todayDayName, today, onSelect, onAction, actionInProgress }) {
  const sections = mode === 'in_clinic' ? [
    {
      key: 'needsAttention',
      title: '⚠️ Needs manual attention',
      subtitle: 'Recent visits with no encounter note · no-shows to reschedule',
      list: buckets.needsAttention,
      accent: '#dc2626',
      tone: 'warn',
    },
    {
      key: 'scheduledToday',
      title: `📅 Scheduled today (${todayDayName})`,
      subtitle: 'Open the patient chart to log the encounter when they arrive',
      list: buckets.scheduledToday,
      accent: '#1e40af',
      tone: 'info',
    },
    {
      key: 'visitedToday',
      title: '✅ Visited & encounter logged today',
      subtitle: 'No action needed',
      list: buckets.visitedToday,
      accent: '#166534',
      tone: 'good',
    },
    {
      key: 'upcomingThisWeek',
      title: '📅 Coming this week',
      subtitle: 'Upcoming WL visits within the next 7 days',
      list: buckets.upcomingThisWeek,
      accent: '#666',
      tone: 'idle',
      collapsedByDefault: true,
    },
  ] : [
    {
      key: 'needsAttention',
      title: '⚠️ Needs manual attention',
      subtitle: 'These rows the cron can’t handle on its own',
      list: buckets.needsAttention,
      accent: '#dc2626',
      tone: 'warn',
    },
    {
      key: 'completedToday',
      title: '✅ Completed by patient today',
      subtitle: 'No action needed',
      list: buckets.completedToday,
      accent: '#166534',
      tone: 'good',
    },
    {
      key: 'willSendToday',
      title: `⏰ Auto-reminders queued for today (${todayDayName})`,
      subtitle: 'Cron runs at 9 AM PT — no action needed',
      list: buckets.willSendToday,
      accent: '#1e40af',
      tone: 'info',
    },
    {
      key: 'autoSentToday',
      title: '📤 Auto-sent this morning',
      subtitle: 'Original reminder went out — waiting on patient',
      list: buckets.autoSentToday,
      accent: '#1e40af',
      tone: 'info',
    },
    {
      key: 'autoNudgedToday',
      title: '🔔 Auto-nudged this morning',
      subtitle: '1st nudge sent — patient missed yesterday’s reminder',
      list: buckets.autoNudgedToday,
      accent: '#92400e',
      tone: 'warn',
    },
    {
      key: 'autoFinalToday',
      title: '🚨 Final auto-nudge sent this morning',
      subtitle: 'Last attempt — if no response, will mark missed in 4 days',
      list: buckets.autoFinalToday,
      accent: '#9a3412',
      tone: 'warn',
    },
    {
      key: 'waiting',
      title: '⏳ In cycle, waiting for response',
      subtitle: 'Reminder went out earlier this week — nothing scheduled today',
      list: buckets.waiting,
      accent: '#666',
      tone: 'idle',
      collapsedByDefault: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      {sections.map(s => (
        <DailySection key={s.key} section={s} today={today} mode={mode}
          onSelect={onSelect} onAction={onAction} actionInProgress={actionInProgress} />
      ))}
    </div>
  );
}

function DailySection({ section, today, mode, onSelect, onAction, actionInProgress }) {
  const [expanded, setExpanded] = useState(!section.collapsedByDefault);
  const empty = section.list.length === 0;
  if (empty && section.key !== 'needsAttention') return null;

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
            {section.key === 'needsAttention' ? '✓ All clear — nothing needs a human right now.' : 'None'}
          </div>
        ) : (
          <>
            <ColumnHeader sectionKey={section.key} mode={mode} />
            <div>
              {section.list.map(p => (
                mode === 'in_clinic'
                  ? <InClinicRow key={p.protocol_id} patient={p} sectionKey={section.key}
                      onSelect={onSelect} actionInProgress={actionInProgress} />
                  : <DailyRow key={p.protocol_id} patient={p} today={today} sectionKey={section.key}
                      onSelect={onSelect} onAction={onAction} actionInProgress={actionInProgress} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

function ColumnHeader({ sectionKey, mode }) {
  const isAttention = sectionKey === 'needsAttention';
  const reasonLabel = mode === 'in_clinic'
    ? (isAttention ? 'WHY' : 'APPOINTMENT')
    : (isAttention ? 'WHY' : 'WHAT HAPPENED');
  const lastLabel = mode === 'in_clinic' ? 'Last visit' : 'Last check-in';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.9fr 130px',
      gap: '12px', padding: '8px 18px',
      background: '#fafafa', borderBottom: '1px solid #f0f0f0',
      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
      color: '#666', fontWeight: 600,
    }}>
      <div></div>
      <div>Patient</div>
      <div>{reasonLabel}</div>
      <div>{lastLabel}</div>
      <div>Status</div>
      <div style={{ textAlign: 'right' }}>Action</div>
    </div>
  );
}

function DailyRow({ patient, sectionKey, onSelect, onAction, actionInProgress }) {
  const isAttention = sectionKey === 'needsAttention';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.9fr 130px',
      gap: '12px', alignItems: 'center',
      padding: '12px 18px', borderBottom: '1px solid #f0f0f0',
      background: isAttention ? '#fef9f3' : '#fff',
    }}>
      <Avatar initials={patient.initials} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
          onClick={() => onSelect(patient)}>{patient.name}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} · {patient.injection_day || 'no day set'} · {patient.cadence_days}d
        </div>
      </div>
      <div style={{ fontSize: '13px', color: '#333' }}>
        {todayActionDescription(patient)}
      </div>
      <div style={{ fontSize: '13px' }}>
        {patient.last_weight ? <strong>{patient.last_weight} lb</strong> : <span style={{ color: '#bbb' }}>none</span>}
        <div style={{ fontSize: '11px', color: '#999' }}>{fmtDate(patient.last_checkin_date) || '—'}</div>
      </div>
      <StatusStack payment={patient.payment} dispense={patient.dispense} />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button disabled={actionInProgress}
          onClick={() => onSelect(patient)}
          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
          {isAttention ? 'Fix' : 'Details'}
        </button>
      </div>
    </div>
  );
}

function InClinicRow({ patient, sectionKey, onSelect, actionInProgress }) {
  const isAttention = sectionKey === 'needsAttention';
  const v = patient.visit || {};
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.9fr 130px',
      gap: '12px', alignItems: 'center',
      padding: '12px 18px', borderBottom: '1px solid #f0f0f0',
      background: isAttention ? '#fef9f3' : '#fff',
    }}>
      <Avatar initials={patient.initials} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => onSelect(patient)}>
          {patient.name}
          <StreakBadge streak={patient.streak} />
        </div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {patient.medication}{patient.selected_dose ? ` ${patient.selected_dose}` : ''} · {patient.cadence_days}d cadence
        </div>
      </div>
      <div style={{ fontSize: '13px', color: '#333' }}>
        {visitDescription(v)}
      </div>
      <div style={{ fontSize: '13px' }}>
        {patient.last_weight ? <strong>{patient.last_weight} lb</strong> : <span style={{ color: '#bbb' }}>none</span>}
        <div style={{ fontSize: '11px', color: '#999' }}>{fmtDate(patient.last_checkin_date) || fmtDate(v.last_visit?.date) || '—'}</div>
      </div>
      <StatusStack payment={patient.payment} dispense={patient.dispense} />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <a href={`/admin/patient/${patient.patient_id}`} target="_blank" rel="noreferrer"
          style={{ ...sharedStyles.btnPrimary, ...sharedStyles.btnSmall, textDecoration: 'none' }}>
          Open chart
        </a>
        <button disabled={actionInProgress}
          onClick={() => onSelect(patient)}
          style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
          Details
        </button>
      </div>
    </div>
  );
}

function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null;
  const onFire = streak >= 4;
  return (
    <span title={`${streak} consecutive injections`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '2px',
        padding: '2px 6px',
        background: onFire ? '#fef3c7' : '#f5f5f5',
        color: onFire ? '#92400e' : '#666',
        fontSize: '11px', fontWeight: 600,
      }}>
      {onFire ? '🔥' : '✓'} {streak}
    </span>
  );
}

function visitDescription(visit) {
  const a = visit?.today_action;
  const today = visit?.today_appt;
  switch (a) {
    case 'visit_today_logged':
      return <span>✅ Visited at <strong>{today?.time || 'today'}</strong> — encounter logged</span>;
    case 'visit_today_pending':
      return <span>📅 On schedule for <strong>{today?.time || 'today'}</strong> — log encounter when done</span>;
    case 'visit_unlogged_recent': {
      const u = visit.recent_unlogged?.[0];
      return <span style={{ color: '#9a3412' }}>⚠️ Visit on <strong>{fmtDate(u?.date)}</strong> — no encounter note</span>;
    }
    case 'no_show_recent': {
      const ns = visit.no_shows?.[0];
      return <span style={{ color: '#9a3412' }}>❌ No-show on <strong>{fmtDate(ns?.date)}</strong> — needs reschedule</span>;
    }
    case 'missed_cadence':
      return (
        <span style={{ color: '#991b1b' }}>
          ❌ <strong>Missed cycle</strong> — was due {visit.days_overdue}d ago, no next visit booked
        </span>
      );
    case 'needs_booking_soon': {
      const due = visit.days_overdue;
      // due range here is -3..0 (positive overdue is missed_cadence)
      const label = due >= 0 ? 'due today' : `due in ${Math.abs(due)}d`;
      return (
        <span style={{ color: '#92400e' }}>
          📅 <strong>Book next visit</strong> — {label}, nothing on calendar
        </span>
      );
    }
    case 'upcoming_this_week': {
      const u = visit.upcoming?.[0];
      return <span style={{ color: '#666' }}>📅 Next visit <strong>{fmtDate(u?.date)} at {u?.time}</strong></span>;
    }
    default:
      return <span style={{ color: '#bbb' }}>—</span>;
  }
}

// Plain-English description of what happened (or didn't) for this patient today.
function todayActionDescription(patient) {
  const c = patient.cycle || {};
  const a = c.today_action;
  switch (a) {
    case 'auto_sent_today':
      return <span>📤 Auto-sent at <strong>{c.original?.sent_time || 'today'}</strong></span>;
    case 'auto_nudged_today':
      return <span>🔔 1st nudge sent at <strong>{c.nudge1?.sent_time || 'today'}</strong></span>;
    case 'auto_final_today':
      return <span>🚨 Final nudge sent at <strong>{c.nudge2?.sent_time || 'today'}</strong></span>;
    case 'completed_today':
      return <span>✅ Patient logged today</span>;
    case 'will_send_today':
      return <span>⏰ Cron will send today (~9 AM PT)</span>;
    case 'waiting':
      return <span style={{ color: '#666' }}>Reminder sent {c.original?.sent_time ? `at ${c.original.sent_time} on ${fmtDate(c.original.sent_date)}` : ''}</span>;
    case 'cron_skipped_today':
      return <span style={{ color: '#9a3412' }}>⚠️ Cron should have sent today, didn&rsquo;t — investigate</span>;
    case 'needs_setup':
      return <span style={{ color: '#9a3412' }}>⚠️ No injection day set — reminders can&rsquo;t fire</span>;
    case 'missed':
      return <span style={{ color: '#9a3412' }}>❌ Cycle missed — no response after final nudge</span>;
    case 'reminders_off':
      return <span style={{ color: '#888' }}>Reminders OFF</span>;
    case 'opted_out':
      return <span style={{ color: '#888' }}>Patient opted out</span>;
    default:
      return <span style={{ color: '#bbb' }}>—</span>;
  }
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
  const dc = DISPENSE_CONFIG[patient.dispense.state] || DISPENSE_CONFIG.never;

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
        <span style={{ fontSize: '11px', display: 'inline-flex', gap: '2px' }}>
          <span title={`Dispense: ${patient.dispense.label}`}>{dc.icon}</span>
          <span title={`Payment: ${patient.payment.label}`}>{pc.icon}</span>
        </span>
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

function RosterTable({ mode, patients, onSelect, onAction, actionInProgress }) {
  const inClinic = mode === 'in_clinic';
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
              <th style={sharedStyles.th}>{inClinic ? 'Next Visit' : 'Inj Day'}</th>
              <th style={sharedStyles.th}>Med / Dose</th>
              <th style={sharedStyles.th}>Cadence</th>
              <th style={sharedStyles.th}>{inClinic ? 'Last Visit' : 'Last Check-in'}</th>
              <th style={sharedStyles.th}>{inClinic ? 'Streak' : '4-wk Rate'}</th>
              <th style={sharedStyles.th}>Status</th>
              {!inClinic && <th style={sharedStyles.th}>Reminders</th>}
              <th style={sharedStyles.th} />
            </tr>
          </thead>
          <tbody>
            {patients.map(p => {
              const nextAppt = p.visit?.upcoming?.[0];
              // Prefer the last WL appointment+note; fall back to any encounter
              // so a new patient with only consults still shows a real last-seen date.
              const lastVisitDate = p.visit?.last_visit?.date || p.last_seen_in_clinic?.date || null;
              const lastVisitLabel = p.visit?.last_visit?.service_name || p.last_seen_in_clinic?.label || null;
              return (
              <tr key={p.protocol_id} style={{ cursor: 'pointer' }}
                onClick={(e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') onSelect(p); }}>
                <td style={sharedStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar initials={p.initials} small />
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.name}
                        <StreakBadge streak={p.streak} />
                      </div>
                      {p.reminder_opt_out && !inClinic && (
                        <div style={{ fontSize: '11px', color: '#991b1b' }}>OPTED OUT{p.reminder_opt_out_reason ? ` — ${p.reminder_opt_out_reason}` : ''}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={sharedStyles.td}>
                  {inClinic ? (
                    nextAppt ? (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{fmtDate(nextAppt.date)}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{nextAppt.time}</div>
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>NONE BOOKED</span>
                    )
                  ) : (
                    p.injection_day ? (
                      <span style={{ fontSize: '13px' }}>{p.injection_day}</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>NOT SET</span>
                    )
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
                  {inClinic ? (
                    lastVisitDate ? (
                      <>
                        <div style={{ fontSize: '13px' }}>{fmtDate(lastVisitDate)}</div>
                        {lastVisitLabel && <div style={{ fontSize: '11px', color: '#888' }}>{lastVisitLabel}</div>}
                      </>
                    ) : <span style={{ color: '#999' }}>—</span>
                  ) : (
                    p.last_checkin_date ? (
                      <>
                        <div style={{ fontSize: '13px' }}>{fmtDate(p.last_checkin_date)}</div>
                        {p.last_weight && <div style={{ fontSize: '12px', color: '#888' }}>{p.last_weight} lb</div>}
                      </>
                    ) : <span style={{ color: '#999' }}>—</span>
                  )}
                </td>
                <td style={sharedStyles.td}>
                  {inClinic ? (
                    p.streak && p.streak > 0 ? (
                      <StreakBadge streak={p.streak} />
                    ) : <span style={{ color: '#999' }}>—</span>
                  ) : (
                    <>
                      {p.four_week_rate != null ? (
                        <span style={{
                          fontWeight: 600,
                          color: p.four_week_rate >= 75 ? '#166534' : p.four_week_rate >= 40 ? '#92400e' : '#991b1b',
                        }}>{p.four_week_rate}%</span>
                      ) : <span style={{ color: '#999' }}>—</span>}
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.four_week_completed}/{p.four_week_originals}</div>
                    </>
                  )}
                </td>
                <td style={sharedStyles.td}>
                  <StatusStack payment={p.payment} dispense={p.dispense} />
                </td>
                {!inClinic && (
                  <td style={sharedStyles.td}>
                    <ReminderToggle
                      enabled={p.reminder_enabled}
                      optOut={p.reminder_opt_out}
                      disabled={actionInProgress}
                      onChange={(enabled) => onAction('toggle_reminder', { protocol_id: p.protocol_id, enabled })}
                    />
                  </td>
                )}
                <td style={sharedStyles.td}>
                  <button onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                    style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall }}>
                    Manage
                  </button>
                </td>
              </tr>
            );
            })}
            {patients.length === 0 && (
              <tr><td colSpan={inClinic ? 8 : 9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No patients match the current filter</td></tr>
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
        {/* Status + payment + dispense */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Badge bg={sc.bg} color={sc.color} icon={sc.icon} text={sc.label} />
          <DispensePill dispense={patient.dispense} />
          <PaymentPill payment={patient.payment} />
        </div>

        <WeightProgressBlock patient={patient} />

        <ProtocolSummaryBlock patient={patient} />

        <Section title="Manual SMS (one-off)">
          <div style={{
            padding: '10px 12px', background: '#fef9f3', border: '1px solid #fde68a',
            fontSize: '12px', color: '#92400e', marginBottom: '10px', lineHeight: 1.5,
          }}>
            ⚠️ <strong>Only use this for one-off cases</strong> (patient lost the link, asked for a fresh one, etc.).
            The system already auto-sends originals + nudges on schedule —
            clicking this when something already went out today will <strong>double-text the patient.</strong>
          </div>
          <button disabled={actionInProgress} onClick={() => {
            if (!confirm(`Send a manual check-in SMS to ${patient.name}? This will text the patient now even if the system already sent one today.`)) return;
            onAction('send_now', { protocol_id: patient.protocol_id });
          }}
            style={{ ...sharedStyles.btnSecondary, width: '100%' }}>
            📱 Send manual check-in to {patient.first_name || patient.name.split(' ')[0]} ({patient.phone || 'no phone'})
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

      </div>
    </div>
  );
}

// ───────────────────── Side-panel info blocks ─────────────────────

function WeightProgressBlock({ patient }) {
  const ws = patient.weight_stats || {};
  const history = patient.weight_history || [];
  const { starting_weight, current_weight, goal_weight, total_loss_lb, to_goal_lb } = ws;
  const progressPct = (() => {
    if (starting_weight == null || current_weight == null || goal_weight == null) return null;
    const totalToLose = starting_weight - goal_weight;
    if (totalToLose <= 0) return null;
    const lostSoFar = starting_weight - current_weight;
    return Math.max(0, Math.min(100, Math.round((lostSoFar / totalToLose) * 100)));
  })();

  return (
    <Section title="Weight progress">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <Tile label="Starting" value={starting_weight} unit="lb" />
        <Tile label="Current" value={current_weight} unit="lb" emphasis />
        <Tile label="Goal" value={goal_weight} unit="lb" />
      </div>

      {(total_loss_lb != null || to_goal_lb != null) && (
        <div style={{ fontSize: '13px', color: '#444', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {total_loss_lb != null && (
              <>Down <strong style={{ color: total_loss_lb >= 0 ? '#166534' : '#991b1b' }}>{total_loss_lb} lb</strong> from start</>
            )}
          </span>
          <span>
            {to_goal_lb != null && to_goal_lb > 0 && <><strong>{to_goal_lb} lb</strong> to goal</>}
            {to_goal_lb != null && to_goal_lb <= 0 && <strong style={{ color: '#166534' }}>Goal reached 🎉</strong>}
          </span>
        </div>
      )}

      {progressPct != null && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ height: '8px', background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progressPct}%`,
              background: progressPct >= 75 ? '#166534' : progressPct >= 25 ? '#92400e' : '#1e40af',
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{progressPct}% to goal</div>
        </div>
      )}

      {history.length >= 2 ? (
        <WeightSparkline history={history} startingWeight={starting_weight} goalWeight={goal_weight} />
      ) : (
        <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
          {history.length === 0 ? 'No weight data logged yet' : 'Need 2+ check-ins to chart trend'}
        </div>
      )}
    </Section>
  );
}

function Tile({ label, value, unit, emphasis }) {
  return (
    <div style={{
      padding: '10px 12px', background: emphasis ? '#000' : '#f5f5f5',
      color: emphasis ? '#fff' : '#000',
    }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
        color: emphasis ? '#bbb' : '#666', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
        {value != null ? value : <span style={{ color: emphasis ? '#666' : '#bbb' }}>—</span>}
        {value != null && <span style={{ fontSize: '11px', fontWeight: 500, marginLeft: '3px',
          color: emphasis ? '#bbb' : '#666' }}>{unit}</span>}
      </div>
    </div>
  );
}

function WeightSparkline({ history, startingWeight, goalWeight }) {
  const W = 432, H = 80, pad = 6;
  const weights = history.map(h => h.weight);
  const ref = [...weights];
  if (startingWeight != null) ref.push(startingWeight);
  if (goalWeight != null) ref.push(goalWeight);
  const min = Math.min(...ref);
  const max = Math.max(...ref);
  const range = Math.max(1, max - min);
  const yFor = w => pad + (1 - (w - min) / range) * (H - pad * 2);
  const points = history.map((h, i) => {
    const x = pad + (i / Math.max(1, history.length - 1)) * (W - pad * 2);
    return [x, yFor(h.weight)];
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <div style={{ background: '#fafafa', padding: '8px', border: '1px solid #f0f0f0' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {goalWeight != null && (
          <line x1={0} x2={W} y1={yFor(goalWeight)} y2={yFor(goalWeight)}
            stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {startingWeight != null && (
          <line x1={0} x2={W} y1={yFor(startingWeight)} y2={yFor(startingWeight)}
            stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <path d={path} fill="none" stroke="#000" strokeWidth="1.5" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#000" />
        ))}
        {last && (
          <text x={last[0] - 4} y={last[1] - 8} fontSize="10" fontWeight="700" textAnchor="end" fill="#000">
            {history[history.length - 1].weight} lb
          </text>
        )}
      </svg>
      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span>{fmtDate(history[0].date)}</span>
        <span>{history.length} entries · {fmtDate(history[history.length - 1].date)}</span>
      </div>
    </div>
  );
}

function ProtocolSummaryBlock({ patient }) {
  const ps = patient.protocol_summary || {};
  const purchase = patient.purchase_summary;
  const lastSeen = patient.last_seen_in_clinic;
  const daysOnProtocol = ps.start_date
    ? Math.floor((Date.now() - new Date(ps.start_date + 'T12:00:00').getTime()) / 86400000)
    : null;

  return (
    <Section title="Protocol & history">
      <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#333' }}>
        <Row k="Protocol" v={`${ps.medication || '—'}${ps.dose ? ' · ' + ps.dose : ''}${ps.frequency ? ' · ' + ps.frequency : ''}`} />
        <Row k="Started" v={ps.start_date ? `${fmtDate(ps.start_date)} (${daysOnProtocol}d ago)` : '—'} />
        <Row k="Delivery" v={ps.delivery_method ? ps.delivery_method.replace(/_/g, ' ') : '—'} />
        <Row k="Last seen in clinic" v={
          lastSeen
            ? <span>{fmtDate(lastSeen.date)} <span style={{ color: '#888', fontSize: '12px' }}>({lastSeen.label})</span></span>
            : <span style={{ color: '#888' }}>no encounters logged</span>
        } />
        <Row k="4-wk SMS rate" v={
          patient.four_week_rate != null
            ? `${patient.four_week_rate}% (${patient.four_week_completed}/${patient.four_week_originals})`
            : 'no data'
        } />
        {purchase && (
          <Row k="Lifetime spend" v={`$${Math.round(purchase.total_spent)} across ${purchase.count} purchase${purchase.count === 1 ? '' : 's'}`} />
        )}
        <Row k="Dispense" v={`${patient.dispense.label}${patient.dispense.total > 0 ? ` (${patient.dispense.used}/${patient.dispense.total} of last block)` : ''}`} />
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
    ? `Last block: ${dispense.last_dispensed_date} · ${dispense.used}/${dispense.total} used`
    : 'No injections dispatched yet';
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

// Stack the two badges vertically. Dispense (action-oriented) on top,
// Payment (informational) on the bottom — staff scan the top one to decide
// "ship today?" and the bottom for "did they pay?"
function StatusStack({ payment, dispense }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
      <DispensePill dispense={dispense} />
      <PaymentPill payment={payment} />
    </div>
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
