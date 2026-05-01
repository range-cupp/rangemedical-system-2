// /admin/daily — Daily Action Tip dashboard
// Stats + nav to the four working surfaces (queue, subscribers, sends, unsubs)

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../../components/AdminLayout';
import { useAuth } from '../../../components/AuthProvider';

export default function DailyDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/admin/daily/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session) loadStats(); }, [session, loadStats]);

  const today = stats?.today || '';
  const next = stats?.queue?.next;
  const nextIsToday = next && next.scheduled_for === today;

  return (
    <AdminLayout title="Daily Action Tip">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Daily Action Tip</h1>
        <p style={sharedStyles.pageSubtitle}>
          Email list · sent at 6am Pacific every day
        </p>
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#666' }}>Loading…</div>
      ) : stats && (
        <>
          {/* Today snapshot */}
          <div style={{ ...sharedStyles.card, marginBottom: 24 }}>
            <div style={sharedStyles.cardBody}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>
                Today · {today}
              </div>
              {nextIsToday ? (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#000', marginBottom: 6 }}>
                    "{next.subject}"
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Scheduled to send today · status approved
                  </div>
                </div>
              ) : next ? (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#000', marginBottom: 6 }}>
                    Nothing scheduled for today.
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Next approved: <strong>{next.scheduled_for}</strong> — "{next.subject}"
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>
                    Queue is empty.
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    No approved tips for today or any future date. Get to work.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Active subscribers" value={stats.subscribers.active_completed} />
            <StatCard label="In welcome sequence" value={stats.subscribers.in_welcome} />
            <StatCard label="Approved upcoming" value={stats.queue.approved_upcoming} />
            <StatCard label="Drafts" value={stats.queue.drafts} />
            <StatCard label="Sends (last 7d)" value={stats.sends_last_7d} />
            <StatCard label="Unsubscribed" value={stats.subscribers.unsubscribed} muted />
          </div>

          {/* Nav cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <NavCard href="/admin/daily/queue" title="Queue" desc="Schedule + edit upcoming tips" />
            <NavCard href="/admin/daily/tips/new" title="New tip" desc="Write a fresh draft" />
            <NavCard href="/admin/daily/subscribers" title="Subscribers" desc="Search, filter, status" />
            <NavCard href="/admin/daily/sends" title="Send log" desc="Recent emails sent" />
            <NavCard href="/admin/daily/unsubscribes" title="Unsubscribes" desc="Suppression list" />
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, muted }) {
  return (
    <div style={{ ...sharedStyles.card, padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: muted ? '#888' : '#000' }}>
        {value?.toLocaleString() ?? '—'}
      </div>
    </div>
  );
}

function NavCard({ href, title, desc }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ ...sharedStyles.card, padding: 18, transition: 'border-color 0.15s', cursor: 'pointer' }}
           onMouseEnter={(e) => e.currentTarget.style.borderColor = '#000'}
           onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e5e5'}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 4 }}>{title} →</div>
        <div style={{ fontSize: 13, color: '#666' }}>{desc}</div>
      </div>
    </Link>
  );
}
