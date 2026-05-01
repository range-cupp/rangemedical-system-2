// /admin/daily/sends — recent send log

import { useEffect, useState, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'tip', label: 'Daily tips' },
  { value: 'welcome', label: 'Welcome sequence' },
];

export default function SendsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/daily/sends?type=${type}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRows(data.sends || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, type]);

  useEffect(() => { if (session) load(); }, [session, load]);

  return (
    <AdminLayout title="Send log">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Send log</h1>
        <p style={sharedStyles.pageSubtitle}>
          Recent sends across daily tips and welcome sequence
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...sharedStyles.input, width: 'auto', minWidth: 200 }}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}

      <div style={sharedStyles.card}>
        {loading ? (
          <div style={{ padding: 24, color: '#666' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: '#888', fontStyle: 'italic' }}>No sends yet.</div>
        ) : (
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Sent at</th>
                <th style={sharedStyles.th}>To</th>
                <th style={sharedStyles.th}>What</th>
                <th style={sharedStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={sharedStyles.td}><span style={{ fontSize: 13, color: '#666', fontVariantNumeric: 'tabular-nums' }}>{fmtDateTime(r.sent_at)}</span></td>
                  <td style={sharedStyles.td}>{r.subscriber?.email || '—'}</td>
                  <td style={sharedStyles.td}>
                    {r.welcome_sequence_step ? (
                      <span style={{ fontSize: 13 }}>Welcome <strong>step {r.welcome_sequence_step}</strong></span>
                    ) : r.tip?.subject ? (
                      <span style={{ fontSize: 13 }}>"{r.tip.subject}"</span>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={sharedStyles.td}>
                    {r.bounced && <span style={{ ...badgeStyle, background: '#fef2f2', color: '#b91c1c' }}>Bounced</span>}
                    {r.complained && <span style={{ ...badgeStyle, background: '#fef2f2', color: '#b91c1c' }}>Complaint</span>}
                    {!r.bounced && !r.complained && <span style={{ ...badgeStyle, background: '#f3f4f6', color: '#6b7280' }}>Sent</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

const badgeStyle = {
  padding: '3px 8px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
