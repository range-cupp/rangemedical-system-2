// /admin/daily/queue
// Main work surface — see upcoming approved tips by date, drafts in a separate section.
// Click a row to edit. New-tip button at top.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

export default function QueuePage() {
  const { session } = useAuth();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/daily/tips?status=all', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setTips(data.tips || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const today = todayPacific();
  const drafts = tips.filter(t => t.status === 'draft');
  const upcoming = tips.filter(t => (t.status === 'approved' || t.status === 'scheduled') && t.scheduled_for >= today);
  const sent = tips.filter(t => t.status === 'sent').slice(0, 10);

  return (
    <AdminLayout
      title="Queue"
      actions={
        <Link href="/admin/daily/tips/new" style={{ ...sharedStyles.btnPrimary }}>+ New tip</Link>
      }
    >
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Queue</h1>
        <p style={sharedStyles.pageSubtitle}>
          Today is <strong>{today}</strong>. Approved tips fire at 6am Pacific on their scheduled date.
        </p>
      </div>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <div style={{ color: '#666' }}>Loading…</div>
      ) : (
        <>
          <Section title={`Approved & upcoming (${upcoming.length})`} empty="No approved tips scheduled. Schedule one or it'll be a quiet inbox tomorrow.">
            {upcoming.map(t => <TipRow key={t.id} tip={t} highlight={t.scheduled_for === today} />)}
          </Section>

          <Section title={`Drafts (${drafts.length})`} empty="No drafts.">
            {drafts.map(t => <TipRow key={t.id} tip={t} />)}
          </Section>

          <Section title={`Recently sent (last 10)`} empty="No sends yet.">
            {sent.map(t => <TipRow key={t.id} tip={t} muted />)}
          </Section>
        </>
      )}
    </AdminLayout>
  );
}

function Section({ title, empty, children }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div style={{ ...sharedStyles.card, marginBottom: 20 }}>
      <div style={sharedStyles.cardHeader}>
        <h2 style={sharedStyles.cardTitle}>{title}</h2>
      </div>
      <div>
        {isEmpty ? (
          <div style={{ padding: 24, color: '#888', fontStyle: 'italic' }}>{empty}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function TipRow({ tip, highlight, muted }) {
  return (
    <Link href={`/admin/daily/tips/${tip.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'grid',
          gridTemplateColumns: '120px 1fr auto',
          gap: 16,
          alignItems: 'center',
          background: highlight ? '#fafff0' : '#fff',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!highlight) e.currentTarget.style.background = '#fafafa'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = highlight ? '#fafff0' : '#fff'; }}
      >
        <div style={{ fontSize: 13, color: muted ? '#999' : '#666', fontVariantNumeric: 'tabular-nums' }}>
          {tip.scheduled_for || (tip.status === 'sent' && tip.sent_at ? tip.sent_at.slice(0, 10) : '—')}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: muted ? '#888' : '#000', marginBottom: 2 }}>
            {tip.subject}
          </div>
          {tip.topic_tags?.length > 0 && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {tip.topic_tags.join(' · ')}
            </div>
          )}
        </div>
        <StatusBadge status={tip.status} />
      </div>
    </Link>
  );
}

function StatusBadge({ status }) {
  const colors = {
    draft: { bg: '#f3f4f6', fg: '#6b7280' },
    approved: { bg: '#dcfce7', fg: '#166534' },
    scheduled: { bg: '#dbeafe', fg: '#1e40af' },
    sent: { bg: '#f3f4f6', fg: '#9ca3af' },
    archived: { bg: '#f3f4f6', fg: '#9ca3af' },
  }[status] || { bg: '#f3f4f6', fg: '#6b7280' };
  return (
    <span style={{
      padding: '4px 10px',
      background: colors.bg,
      color: colors.fg,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderRadius: 0,
    }}>{status}</span>
  );
}

function ErrorBox({ message }) {
  return <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>{message}</div>;
}

function todayPacific() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
}
