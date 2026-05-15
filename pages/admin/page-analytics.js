import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const PERIODS = [
  { key: '7', label: '7 days' },
  { key: '14', label: '14 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'funnel', label: 'Booking Funnel' },
];

const FUNNEL_COLORS = [
  '#2E5D3A', '#3a7a4d', '#4a9462', '#5cae78', '#74c090', '#90d0a8', '#b0e0c2',
];

export default function PageAnalytics() {
  const [period, setPeriod] = useState('30');
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [funnelPage, setFunnelPage] = useState('lab-clarity-visit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'overview') {
      fetch(`/api/analytics/overview?days=${period}`)
        .then(r => r.json())
        .then(d => { setOverview(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/analytics/funnel?page=${funnelPage}&days=${period}`)
        .then(r => r.json())
        .then(d => { setFunnel(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [period, tab, funnelPage]);

  return (
    <AdminLayout title="Page Analytics">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Page Analytics</h1>
        <p style={sharedStyles.pageSubtitle}>Traffic, conversions, and visitor behavior across all public pages</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e5e5',
                borderRight: t.key === 'overview' ? 'none' : '1px solid #e5e5e5',
                background: tab === t.key ? '#000' : '#fff',
                color: tab === t.key ? '#fff' : '#333',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 0 }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e5e5',
                background: period === p.key ? '#000' : '#fff',
                color: period === p.key ? '#fff' : '#333',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#666', padding: 40, textAlign: 'center' }}>Loading analytics...</p>
      ) : tab === 'overview' ? (
        <OverviewTab data={overview} />
      ) : (
        <FunnelTab data={funnel} funnelPage={funnelPage} setFunnelPage={setFunnelPage} />
      )}
    </AdminLayout>
  );
}

// ─── OVERVIEW TAB ──────────────────────────────────────────

function OverviewTab({ data }) {
  if (!data) return <p style={{ color: '#666', padding: 40, textAlign: 'center' }}>Failed to load analytics.</p>;

  return (
    <>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="Page Views" value={data.totalViews || 0} />
        <SummaryCard label="Unique Visitors" value={data.uniqueVisitors || 0} />
        <SummaryCard label="Top Page" value={formatPageName(data.pages?.[0]?.page)} small />
        <SummaryCard label="Mobile Traffic" value={`${data.mobilePercent || 0}%`} />
      </div>

      {/* Pages table + Daily views */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Pages table */}
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Pages by Traffic</h3>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Page</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Views</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Visitors</th>
                </tr>
              </thead>
              <tbody>
                {(data.pages || []).map(p => (
                  <tr key={p.page}>
                    <td style={sharedStyles.td}>
                      <span style={{ fontSize: 14 }}>{formatPageName(p.page)}</span>
                    </td>
                    <td style={{ ...sharedStyles.td, textAlign: 'right', fontWeight: 600 }}>{p.views}</td>
                    <td style={{ ...sharedStyles.td, textAlign: 'right', color: '#666' }}>{p.visitors}</td>
                  </tr>
                ))}
                {(!data.pages || data.pages.length === 0) && (
                  <tr><td colSpan={3} style={{ ...sharedStyles.td, textAlign: 'center', color: '#999' }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily views */}
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Daily Page Views</h3>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Date</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.dailyCounts || {})
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([day, count]) => (
                    <tr key={day}>
                      <td style={sharedStyles.td}>{formatDate(day)}</td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right', fontWeight: 600 }}>{count}</td>
                    </tr>
                  ))}
                {Object.keys(data.dailyCounts || {}).length === 0 && (
                  <tr><td colSpan={2} style={{ ...sharedStyles.td, textAlign: 'center', color: '#999' }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Traffic Sources + Devices + Referrers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* UTM Sources */}
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>UTM Sources</h3>
          </div>
          <div style={sharedStyles.cardBody}>
            {Object.keys(data.utmSources || {}).length > 0 ? (
              Object.entries(data.utmSources)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <SourceRow key={source} label={source} count={count} />
                ))
            ) : (
              <EmptyState text="No UTM sources yet" />
            )}
          </div>
        </div>

        {/* Referrers */}
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Referrers</h3>
          </div>
          <div style={sharedStyles.cardBody}>
            {Object.keys(data.referrers || {}).length > 0 ? (
              Object.entries(data.referrers)
                .sort(([, a], [, b]) => b - a)
                .map(([ref, count]) => (
                  <SourceRow key={ref} label={ref} count={count} />
                ))
            ) : (
              <EmptyState text="No referrer data yet" />
            )}
          </div>
        </div>

        {/* Devices */}
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Devices</h3>
          </div>
          <div style={sharedStyles.cardBody}>
            <DeviceBar devices={data.devices} total={data.totalViews} />
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div style={sharedStyles.card}>
        <div style={sharedStyles.cardHeader}>
          <h3 style={sharedStyles.cardTitle}>Recent Visitor Journeys</h3>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Time</th>
                <th style={sharedStyles.th}>Device</th>
                <th style={sharedStyles.th}>Pages Visited</th>
                <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Events</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentSessions || []).map(s => (
                <tr key={s.id}>
                  <td style={{ ...sharedStyles.td, whiteSpace: 'nowrap', fontSize: 13 }}>
                    {formatTime(s.started)}
                  </td>
                  <td style={sharedStyles.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 500,
                      background: s.device === 'mobile' ? '#EEF2FF' : '#F0FDF4',
                      color: s.device === 'mobile' ? '#4338CA' : '#166534',
                    }}>
                      {s.device || 'unknown'}
                    </span>
                  </td>
                  <td style={sharedStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {s.pages.map((p, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {i > 0 && <span style={{ color: '#ccc', fontSize: 12 }}>→</span>}
                          <span style={{ fontSize: 13 }}>{formatPageName(p)}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...sharedStyles.td, textAlign: 'right', color: '#666' }}>
                    {s.events.length}
                  </td>
                </tr>
              ))}
              {(!data.recentSessions || data.recentSessions.length === 0) && (
                <tr><td colSpan={4} style={{ ...sharedStyles.td, textAlign: 'center', color: '#999' }}>No sessions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── FUNNEL TAB ────────────────────────────────────────────

function FunnelTab({ data, funnelPage, setFunnelPage }) {
  if (!data) return <p style={{ color: '#666', padding: 40, textAlign: 'center' }}>Failed to load analytics.</p>;

  const maxCount = data.funnel?.[0]?.count || 1;

  return (
    <>
      {/* Page selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 12 }}>
          Page
        </label>
        <select
          value={funnelPage}
          onChange={e => setFunnelPage(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5e5e5', fontSize: 14, background: '#fff' }}
        >
          <option value="lab-clarity-visit">Lab Clarity Visit</option>
          <option value="book-assessment">Book Assessment</option>
          <option value="book-iv">Book IV</option>
          <option value="book-recovery">Book Recovery</option>
        </select>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="Page Views" value={data.funnel?.[0]?.count || 0} />
        <SummaryCard label="Unique Visitors" value={data.uniqueSessions || 0} />
        <SummaryCard label="Bookings" value={data.funnel?.[6]?.count || 0} />
        <SummaryCard
          label="Conversion Rate"
          value={
            data.funnel?.[0]?.count > 0
              ? ((data.funnel?.[6]?.count || 0) / data.funnel[0].count * 100).toFixed(1) + '%'
              : '0%'
          }
        />
      </div>

      {/* Funnel */}
      <div style={sharedStyles.card}>
        <div style={sharedStyles.cardHeader}>
          <h3 style={sharedStyles.cardTitle}>Booking Funnel</h3>
        </div>
        <div style={sharedStyles.cardBody}>
          {data.funnel?.map((step, i) => {
            const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
            const dropoff = i > 0 && data.funnel[i - 1].count > 0
              ? ((1 - step.count / data.funnel[i - 1].count) * 100).toFixed(0)
              : null;
            return (
              <div key={step.event} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{step.step}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    {dropoff !== null && dropoff !== '0' && (
                      <span style={{ fontSize: 12, color: '#b91c1c' }}>-{dropoff}%</span>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{step.count}</span>
                  </div>
                </div>
                <div style={{ height: 28, background: '#f5f5f5', borderRadius: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(pct, step.count > 0 ? 2 : 0)}%`,
                      background: FUNNEL_COLORS[i] || FUNNEL_COLORS[6],
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily breakdown + UTM sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Daily Page Views</h3>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Date</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Views</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.dailyCounts || {})
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([day, counts]) => (
                    <tr key={day}>
                      <td style={sharedStyles.td}>{formatDate(day)}</td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>{counts.page_view || 0}</td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>{counts.booking_complete || 0}</td>
                    </tr>
                  ))}
                {Object.keys(data.dailyCounts || {}).length === 0 && (
                  <tr><td colSpan={3} style={{ ...sharedStyles.td, textAlign: 'center', color: '#999' }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sharedStyles.card}>
          <div style={sharedStyles.cardHeader}>
            <h3 style={sharedStyles.cardTitle}>Traffic Sources</h3>
          </div>
          <div style={sharedStyles.cardBody}>
            {Object.keys(data.utmSources || {}).length > 0 ? (
              Object.entries(data.utmSources)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <SourceRow key={source} label={source} count={count} />
                ))
            ) : (
              <EmptyState text="No UTM sources tracked yet" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SHARED COMPONENTS ─────────────────────────────────────

function SummaryCard({ label, value, small }) {
  return (
    <div style={sharedStyles.card}>
      <div style={{ padding: '20px 24px' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: 6 }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: small ? 18 : 28, fontWeight: 700, color: '#000' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SourceRow({ label, count }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 14, color: '#333' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{count}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 20 }}>{text}</p>
  );
}

function DeviceBar({ devices, total }) {
  if (!devices || total === 0) return <EmptyState text="No device data yet" />;

  const items = [
    { label: 'Mobile', count: devices.mobile || 0, color: '#4338CA' },
    { label: 'Desktop', count: devices.desktop || 0, color: '#166534' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', height: 32, overflow: 'hidden', marginBottom: 16 }}>
        {items.map(item => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={item.label}
              style={{
                width: `${pct}%`,
                background: item.color,
                minWidth: item.count > 0 ? 20 : 0,
              }}
            />
          );
        })}
      </div>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: item.color }} />
            <span style={{ fontSize: 14, color: '#333' }}>{item.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.count}</span>
            <span style={{ fontSize: 12, color: '#999' }}>
              {total > 0 ? Math.round((item.count / total) * 100) : 0}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPageName(page) {
  if (!page) return '—';
  if (page === 'home') return 'Home';
  return '/' + page;
}
