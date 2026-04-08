// /pages/admin/quotes/index.js
// List of custom pricing quotes
// Range Medical

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

const fmt = (cents) => `$${((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const STATUS_STYLES = {
  draft: { ...s.badge, ...s.badgePending },
  sent: { ...s.badge, background: '#dbeafe', color: '#1e40af' },
  viewed: { ...s.badge, background: '#ede9fe', color: '#5b21b6' },
  accepted: { ...s.badge, ...s.badgeActive },
  expired: { ...s.badge, ...s.badgeCompleted },
};

export default function QuotesIndex() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quotes')
      .then((r) => r.json())
      .then((d) => { setQuotes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Custom Pricing Quotes">
      <div style={s.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={s.pageTitle}>Custom Pricing Quotes</h1>
            <p style={s.pageSubtitle}>Build tailored pricing pages and send a unique link to a patient or lead.</p>
          </div>
          <Link href="/admin/quotes/new" style={s.btnPrimary}>+ New Quote</Link>
        </div>
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Recipient</th>
              <th style={s.th}>Title</th>
              <th style={s.th}>Total</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Views</th>
              <th style={s.th}>Created</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td style={s.td} colSpan={7}>Loading…</td></tr>}
            {!loading && quotes.length === 0 && (
              <tr><td style={s.td} colSpan={7}>No quotes yet. Create your first one.</td></tr>
            )}
            {quotes.map((q) => (
              <tr key={q.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600 }}>{q.recipient_name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{q.recipient_phone || q.recipient_email || ''}</div>
                </td>
                <td style={s.td}>{q.title || '—'}</td>
                <td style={s.td}>{fmt(q.total_cents)}</td>
                <td style={s.td}><span style={STATUS_STYLES[q.status] || s.badge}>{q.status}</span></td>
                <td style={s.td}>{q.view_count || 0}</td>
                <td style={s.td}>{fmtDate(q.created_at)}</td>
                <td style={s.td}>
                  <a href={`/quote/${q.token}`} target="_blank" rel="noreferrer" style={{ ...s.btnSecondary, ...s.btnSmall }}>View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
