import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const PERIODS = [
  { key: '7', label: '7 days' },
  { key: '14', label: '14 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
];

const FUNNEL_COLORS = [
  '#2E5D3A',
  '#3a7a4d',
  '#4a9462',
  '#5cae78',
  '#74c090',
  '#90d0a8',
  '#b0e0c2',
];

export default function PageAnalytics() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/funnel?page=lab-clarity-visit&days=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const maxCount = data?.funnel?.[0]?.count || 1;

  return (
    <AdminLayout title="Page Analytics">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Page Analytics</h1>
        <p style={sharedStyles.pageSubtitle}>Landing page performance and conversion funnel</p>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
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

      {loading ? (
        <p style={{ color: '#666', padding: 40, textAlign: 'center' }}>Loading analytics...</p>
      ) : !data ? (
        <p style={{ color: '#666', padding: 40, textAlign: 'center' }}>Failed to load analytics.</p>
      ) : (
        <>
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

          {/* Daily breakdown + UTM sources side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            {/* Daily views */}
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
                      <tr>
                        <td colSpan={3} style={{ ...sharedStyles.td, textAlign: 'center', color: '#999' }}>
                          No data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UTM Sources */}
            <div style={sharedStyles.card}>
              <div style={sharedStyles.cardHeader}>
                <h3 style={sharedStyles.cardTitle}>Traffic Sources</h3>
              </div>
              <div style={sharedStyles.cardBody}>
                {Object.keys(data.utmSources || {}).length > 0 ? (
                  Object.entries(data.utmSources)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 15, color: '#333' }}>{source}</span>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{count}</span>
                      </div>
                    ))
                ) : (
                  <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 20 }}>
                    No UTM sources tracked yet. Traffic from ads with utm_source will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={sharedStyles.card}>
      <div style={{ padding: '20px 24px' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: 6 }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#000' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
