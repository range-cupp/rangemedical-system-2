// /admin/daily/subscribers — list, search, filter by status

import { useEffect, useState, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'complained', label: 'Complained' },
];

export default function SubscribersPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/daily/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRows(data.subscribers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, status, search]);

  useEffect(() => { if (session) load(); }, [session, load]);

  return (
    <AdminLayout title="Subscribers">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Subscribers</h1>
        <p style={sharedStyles.pageSubtitle}>
          {total.toLocaleString()} {status === 'all' ? 'total' : status} · showing up to 500
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...sharedStyles.input, width: 'auto', minWidth: 160 }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email…"
          style={{ ...sharedStyles.input, flex: '1 1 240px' }}
        />
      </div>

      {error && <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}

      <div style={sharedStyles.card}>
        {loading ? (
          <div style={{ padding: 24, color: '#666' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: '#888', fontStyle: 'italic' }}>No subscribers match.</div>
        ) : (
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Email</th>
                <th style={sharedStyles.th}>Source</th>
                <th style={sharedStyles.th}>Status</th>
                <th style={sharedStyles.th}>Welcome</th>
                <th style={sharedStyles.th}>Subscribed</th>
                <th style={sharedStyles.th}>Last sent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={sharedStyles.td}>{r.email}</td>
                  <td style={sharedStyles.td}><span style={{ fontSize: 12, color: '#666' }}>{r.source}</span></td>
                  <td style={sharedStyles.td}>
                    <span style={{
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: r.status === 'active' ? '#dcfce7' : '#f3f4f6',
                      color: r.status === 'active' ? '#166534' : '#6b7280',
                    }}>{r.status}</span>
                  </td>
                  <td style={sharedStyles.td}>
                    <span style={{ fontSize: 13, color: r.welcome_sequence_completed ? '#16a34a' : '#888' }}>
                      {r.welcome_sequence_completed ? '✓ Done' : 'In progress'}
                    </span>
                  </td>
                  <td style={sharedStyles.td}><span style={{ fontSize: 13, color: '#666' }}>{fmtDate(r.subscribed_at)}</span></td>
                  <td style={sharedStyles.td}><span style={{ fontSize: 13, color: '#666' }}>{r.last_sent_at ? fmtDate(r.last_sent_at) : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'short', day: 'numeric' });
}
