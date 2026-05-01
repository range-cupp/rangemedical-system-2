// /admin/daily/unsubscribes — permanent suppression list

import { useEffect, useState, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

export default function UnsubscribesPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/daily/unsubscribes', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRows(data.unsubscribes || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session) load(); }, [session, load]);

  return (
    <AdminLayout title="Unsubscribes">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Unsubscribes</h1>
        <p style={sharedStyles.pageSubtitle}>
          {total.toLocaleString()} addresses permanently suppressed. They won't receive emails even if they re-submit the landing form.
        </p>
      </div>

      {error && <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>{error}</div>}

      <div style={sharedStyles.card}>
        {loading ? (
          <div style={{ padding: 24, color: '#666' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, color: '#888', fontStyle: 'italic' }}>No unsubscribes yet. Probably a good sign.</div>
        ) : (
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Email</th>
                <th style={sharedStyles.th}>Unsubscribed at</th>
                <th style={sharedStyles.th}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={sharedStyles.td}>{r.email}</td>
                  <td style={sharedStyles.td}><span style={{ fontSize: 13, color: '#666' }}>{fmtDate(r.unsubscribed_at)}</span></td>
                  <td style={sharedStyles.td}><span style={{ fontSize: 13, color: '#999' }}>{r.reason || '—'}</span></td>
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
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
