// pages/admin/giveaway.js
// Admin dashboard for the 6-Week Cellular Energy Reset giveaway
// - View all entries with tier + status
// - Pick a random winner
// - Blast the $1,000 scholarship offer to non-winners
// - Drill into each entry for the call script

import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const CAMPAIGN_KEY = 'cellular_reset_2026_04';

const TIER_STYLES = {
  green:  { bg: '#dcfce7', color: '#166534', label: 'GREEN' },
  yellow: { bg: '#fef3c7', color: '#92400e', label: 'YELLOW' },
  red:    { bg: '#fee2e2', color: '#991b1b', label: 'RED' },
};

const STATUS_STYLES = {
  new:                      { bg: '#e5e5e5', color: '#404040', label: 'NEW' },
  winner_notified:          { bg: '#fde68a', color: '#713f12', label: 'WINNER' },
  scholarship_offered:      { bg: '#e0f2fe', color: '#075985', label: 'OFFERED' },
  scholarship_interested:   { bg: '#dcfce7', color: '#166534', label: 'REPLIED YES' },
  scheduled:                { bg: '#dcfce7', color: '#166534', label: 'SCHEDULED' },
  lost:                     { bg: '#f3f4f6', color: '#6b7280', label: 'LOST' },
};

const STRUGGLE_LABELS = {
  energy: 'Low energy / crashes',
  brain_fog: 'Brain fog / focus',
  recovery: 'Slow recovery',
  weight_loss: 'Weight loss',
  other: 'Other',
};

const BUDGET_LABELS = {
  yes: 'Yes',
  yes_with_payments: 'Yes, w/ payments',
  no: 'Not right now',
};

const formatDateTime = (s) =>
  s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }) : '-';

export default function GiveawayAdmin() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/giveaway/list?campaignKey=${CAMPAIGN_KEY}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const pickWinner = async () => {
    if (!confirm('Pick a random winner now? This will send a winner SMS + email immediately.')) return;
    setActionLoading('pick');
    try {
      const res = await fetch('/api/admin/giveaway/pick-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignKey: CAMPAIGN_KEY }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`Winner picked: ${data.winner.name}. Notification sent.`, 'success');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const sendScholarships = async () => {
    const count = entries.filter(
      (e) => !e.is_winner && e.consent_marketing && !e.scholarship_offered_at
    ).length;
    if (count === 0) {
      showToast('No eligible entries waiting for the scholarship blast.', 'info');
      return;
    }
    if (!confirm(`Send the $1,000 scholarship SMS to ${count} non-winner${count === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setActionLoading('scholarships');
    try {
      const res = await fetch('/api/admin/giveaway/send-scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignKey: CAMPAIGN_KEY }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`Scholarships sent: ${data.sent} sent, ${data.failed} failed, ${data.skipped} skipped.`, 'success');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const tierBadge = (tier) => {
    const s = TIER_STYLES[tier] || TIER_STYLES.yellow;
    return <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const statusBadge = (status) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.new;
    return <span style={{ ...sharedStyles.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const winner = stats?.winner;

  return (
    <AdminLayout title="Giveaway">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Giveaway</h1>
        <p style={sharedStyles.pageSubtitle}>
          6-Week Cellular Energy Reset — $2,999 value · $1,000 scholarship for non-winners
        </p>
      </div>

      {toast && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
          color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#075985',
          fontSize: '14px',
          fontWeight: 500,
          borderLeft: `3px solid ${toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#075985'}`,
        }}>
          {toast.message}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={sharedStyles.statCard}>
          <div style={sharedStyles.statValue}>{stats?.total ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Total Entries</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={{ ...sharedStyles.statValue, color: '#166534' }}>{stats?.green ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Green Tier</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={{ ...sharedStyles.statValue, color: '#92400e' }}>{stats?.yellow ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Yellow Tier</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={{ ...sharedStyles.statValue, color: '#991b1b' }}>{stats?.red ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Red Tier</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={sharedStyles.statValue}>{stats?.scholarshipsOffered ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Scholarships Sent</div>
        </div>
        <div style={sharedStyles.statCard}>
          <div style={{ ...sharedStyles.statValue, color: '#166534' }}>{stats?.scholarshipsInterested ?? '—'}</div>
          <div style={sharedStyles.statLabel}>Replied YES</div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ ...sharedStyles.card, marginBottom: '24px' }}>
        <div style={{ ...sharedStyles.cardBody, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            style={{
              ...sharedStyles.btnPrimary,
              opacity: actionLoading === 'pick' || winner ? 0.5 : 1,
              cursor: actionLoading === 'pick' || winner ? 'not-allowed' : 'pointer',
            }}
            disabled={actionLoading === 'pick' || !!winner}
            onClick={pickWinner}
          >
            {winner ? `Winner: ${winner.name}` : actionLoading === 'pick' ? 'Picking…' : 'Pick Winner'}
          </button>
          <button
            style={{
              ...sharedStyles.btnSecondary,
              opacity: actionLoading === 'scholarships' ? 0.5 : 1,
              cursor: actionLoading === 'scholarships' ? 'not-allowed' : 'pointer',
            }}
            disabled={actionLoading === 'scholarships'}
            onClick={sendScholarships}
          >
            {actionLoading === 'scholarships' ? 'Sending…' : 'Send Scholarship SMS Blast'}
          </button>
          <button
            style={sharedStyles.btnSecondary}
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <span style={{ fontSize: '13px', color: '#666', marginLeft: 'auto' }}>
            Campaign: <code style={{ background: '#f5f5f5', padding: '2px 8px' }}>{CAMPAIGN_KEY}</code>
          </span>
        </div>
      </div>

      {/* Entries table */}
      <div style={sharedStyles.card}>
        <div style={sharedStyles.cardHeader}>
          <h2 style={sharedStyles.cardTitle}>Entries ({entries.length})</h2>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No entries yet. Share <code>/giveaway</code> to start collecting.
          </div>
        ) : (
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Name</th>
                <th style={sharedStyles.th}>Contact</th>
                <th style={sharedStyles.th}>Struggle</th>
                <th style={sharedStyles.th}>Urgency</th>
                <th style={sharedStyles.th}>Budget</th>
                <th style={sharedStyles.th}>Tier</th>
                <th style={sharedStyles.th}>Status</th>
                <th style={sharedStyles.th}>Entered</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  style={sharedStyles.trHover}
                  onClick={() => setSelected(e)}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}
                >
                  <td style={sharedStyles.td}>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    {e.instagram_handle && (
                      <div style={{ fontSize: '13px', color: '#888' }}>{e.instagram_handle}</div>
                    )}
                  </td>
                  <td style={sharedStyles.td}>
                    <div style={{ fontSize: '14px' }}>{e.phone}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{e.email}</div>
                  </td>
                  <td style={sharedStyles.td}>
                    {STRUGGLE_LABELS[e.struggle_main] || e.struggle_main}
                  </td>
                  <td style={sharedStyles.td}>
                    <strong>{e.importance_90d}</strong>
                    <span style={{ color: '#888' }}> /10</span>
                  </td>
                  <td style={sharedStyles.td}>{BUDGET_LABELS[e.budget_answer] || e.budget_answer}</td>
                  <td style={sharedStyles.td}>{tierBadge(e.lead_tier)}</td>
                  <td style={sharedStyles.td}>{statusBadge(e.status)}</td>
                  <td style={{ ...sharedStyles.td, fontSize: '13px', color: '#666' }}>
                    {formatDateTime(e.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal with call script */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #e5e5e5',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{selected.name}</h2>
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {tierBadge(selected.lead_tier)}
                  {statusBadge(selected.status)}
                  <span style={{ fontSize: '13px', color: '#666' }}>Score {selected.lead_score}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Email" value={selected.email} />
              {selected.instagram_handle && <DetailRow label="Instagram" value={selected.instagram_handle} />}
              <DetailRow label="Struggle" value={`${STRUGGLE_LABELS[selected.struggle_main] || selected.struggle_main}${selected.struggle_other ? ` — ${selected.struggle_other}` : ''}`} />
              <DetailRow label="Importance (90d)" value={`${selected.importance_90d}/10`} />
              <DetailRow label="Budget" value={BUDGET_LABELS[selected.budget_answer] || selected.budget_answer} />
              <DetailRow label="Consent" value={selected.consent_marketing ? 'Yes' : 'No'} />
              <DetailRow label="Bad day" value={selected.bad_day_description} multiline />
              <DetailRow label="What would change" value={selected.desired_change} multiline />
              {selected.scholarship_offered_at && (
                <>
                  <DetailRow label="Scholarship offered" value={formatDateTime(selected.scholarship_offered_at)} />
                  <DetailRow label="Scholarship expires" value={formatDateTime(selected.scholarship_expires_at)} />
                </>
              )}

              <h3 style={{ marginTop: '28px', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666' }}>
                Call script
              </h3>
              <div style={{
                marginTop: '8px',
                padding: '18px 20px',
                background: '#fafafa',
                borderLeft: '3px solid #171717',
                fontSize: '14px',
                lineHeight: 1.7,
                color: '#171717',
              }}>
                <p style={{ margin: '0 0 10px' }}>
                  Hi {(selected.name || '').split(/\s+/)[0]}, this is [name] from Range Medical.
                  You entered our 6-Week Cellular Energy Reset giveaway — really appreciate that.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  You wrote that a bad day looks like: <em>&ldquo;{selected.bad_day_description}&rdquo;</em>
                  {' '}— and that fixing this would mean <em>&ldquo;{selected.desired_change}&rdquo;</em>. Does that still feel accurate?
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  We picked one grand-prize winner and unfortunately it wasn&apos;t you this time.
                  But because you entered, we held a <strong>$1,000 scholarship</strong> for you on the same
                  program — 18 HBOT + 18 Red Light sessions over 6 weeks. Instead of $2,999, your
                  investment would be <strong>$1,999</strong>.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  This is only for giveaway entrants and it expires 7 days from when we texted.
                  Do weekdays or Saturdays work better for you to start?
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function DetailRow({ label, value, multiline }) {
  return (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f0f0f0', alignItems: multiline ? 'flex-start' : 'center' }}>
      <div style={{ width: '160px', fontSize: '13px', color: '#737373', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#171717', lineHeight: 1.5, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  );
}
