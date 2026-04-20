// /pages/admin/clinic-sources.js
// Clinic Sources dashboard: Range Medical vs Range Sports Therapy breakdown.
// Shows patient counts, new-in-period, revenue from Stripe + cash/manual purchases.

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { Download, Users, TrendingUp } from 'lucide-react';
import { CLINIC_SOURCES, CLINIC_SOURCE_LABELS } from '../../lib/clinic-source';

const PRESETS = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: 'mtd', label: 'Month to date', mtd: true },
  { key: 'lastMonth', label: 'Last month', lastMonth: true },
  { key: 'ytd', label: 'Year to date', ytd: true },
  { key: 'all', label: 'All time', all: true },
  { key: 'custom', label: 'Custom range' },
];

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetDates(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (preset.all) return { start: '', end: '' };
  if (preset.mtd) {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toISODate(s), end: toISODate(today) };
  }
  if (preset.lastMonth) {
    const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const e = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
    return { start: toISODate(s), end: toISODate(e) };
  }
  if (preset.ytd) {
    const s = new Date(today.getFullYear(), 0, 1);
    return { start: toISODate(s), end: toISODate(today) };
  }
  if (preset.days) {
    const s = new Date(today);
    s.setDate(s.getDate() - preset.days);
    return { start: toISODate(s), end: toISODate(today) };
  }
  return { start: '', end: '' };
}

const SOURCE_COLORS = {
  [CLINIC_SOURCES.RANGE_MEDICAL]: { accent: '#0B7A3B', bg: '#EAF6EE' },
  [CLINIC_SOURCES.RANGE_SPORTS_THERAPY]: { accent: '#C4941F', bg: '#FBF4E2' },
  [CLINIC_SOURCES.UNKNOWN]: { accent: '#666', bg: '#f4f4f4' },
};

export default function ClinicSourcesPage() {
  const [presetKey, setPresetKey] = useState('30d');
  const preset = PRESETS.find((p) => p.key === presetKey) || PRESETS[1];
  const initial = presetDates(preset);

  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'active' | 'new' | 'repeat'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (presetKey === 'custom') return;
    const dates = presetDates(preset);
    setStart(dates.start);
    setEnd(dates.end);
  }, [presetKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    fetch(`/api/admin/clinic-sources?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [start, end]);

  const filteredRows = useMemo(() => {
    if (!data?.patients) return [];
    const q = search.trim().toLowerCase();
    return data.patients
      .filter((r) => sourceFilter === 'all' || r.source === sourceFilter)
      .filter((r) => {
        if (activityFilter === 'all') return true;
        if (activityFilter === 'active') return (r.period_spend || 0) > 0;
        if (activityFilter === 'new') return r.is_new_in_period;
        if (activityFilter === 'repeat') return (r.period_spend || 0) > 0 && !r.is_new_in_period;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return (
          (r.name || '').toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          (r.referral_source_raw || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.period_spend || 0) - (a.period_spend || 0));
  }, [data, sourceFilter, activityFilter, search]);

  // Per-bucket new vs repeat splits (for summary cards)
  const breakdownBySource = useMemo(() => {
    const base = { active: 0, new_count: 0, new_revenue: 0, repeat_count: 0, repeat_revenue: 0 };
    const out = {
      [CLINIC_SOURCES.RANGE_MEDICAL]: { ...base },
      [CLINIC_SOURCES.RANGE_SPORTS_THERAPY]: { ...base },
      [CLINIC_SOURCES.UNKNOWN]: { ...base },
    };
    if (!data?.patients) return out;
    for (const p of data.patients) {
      const spend = p.period_spend || 0;
      const bucket = out[p.source];
      if (!bucket) continue;
      if (spend > 0) bucket.active += 1;
      if (p.is_new_in_period) {
        bucket.new_count += 1;
        if (spend > 0) bucket.new_revenue += spend;
      } else if (spend > 0) {
        bucket.repeat_count += 1;
        bucket.repeat_revenue += spend;
      }
    }
    return out;
  }, [data]);

  const summary = data?.summary || {};
  const rm = summary[CLINIC_SOURCES.RANGE_MEDICAL] || {};
  const rst = summary[CLINIC_SOURCES.RANGE_SPORTS_THERAPY] || {};
  const unk = summary[CLINIC_SOURCES.UNKNOWN] || {};

  const totalPeriodRevenue = (rm.period_revenue || 0) + (rst.period_revenue || 0) + (unk.period_revenue || 0);

  function pct(val) {
    if (!totalPeriodRevenue) return '0%';
    return `${Math.round((val / totalPeriodRevenue) * 100)}%`;
  }

  function exportCSV() {
    const rows = filteredRows;
    const header = ['Patient', 'Email', 'Phone', 'Source', 'Referral Value', 'First Visit', 'New In Period', 'Last Purchase', 'Lifetime Spend', 'Period Spend'];
    const csvLines = [header.join(',')];
    for (const r of rows) {
      const line = [
        r.name || '',
        r.email || '',
        r.phone || '',
        CLINIC_SOURCE_LABELS[r.source] || r.source,
        r.referral_source_raw || '',
        r.created_at ? fmtDate(r.created_at) : '',
        r.is_new_in_period ? 'Yes' : 'No',
        r.last_purchase_date ? fmtDate(r.last_purchase_date) : '',
        (r.lifetime_spend || 0).toFixed(2),
        (r.period_spend || 0).toFixed(2),
      ].map((cell) => {
        const s = String(cell).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      });
      csvLines.push(line.join(','));
    }
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = sourceFilter === 'all' ? 'all-sources' : sourceFilter.replace(/_/g, '-');
    const range = start && end ? `${start}_to_${end}` : 'all-time';
    a.download = `clinic-sources_${label}_${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout title="Clinic Sources">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Clinic Sources</h1>
        <p style={sharedStyles.pageSubtitle}>
          Where patients came from — Range Medical vs Range Sports Therapy — and the revenue tied to each.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ ...sharedStyles.card, marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPresetKey(p.key)}
                style={{
                  padding: '8px 14px',
                  fontSize: '14px',
                  fontWeight: presetKey === p.key ? '600' : '400',
                  background: presetKey === p.key ? '#000' : '#fff',
                  color: presetKey === p.key ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {presetKey === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
              <span style={{ color: '#999' }}>to</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
            {start && end
              ? `${fmtDate(start)} – ${fmtDate(end)}`
              : 'All time'}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fee', border: '1px solid #fcc', marginBottom: '20px', color: '#900' }}>
          Error: {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { key: CLINIC_SOURCES.RANGE_MEDICAL, data: rm },
          { key: CLINIC_SOURCES.RANGE_SPORTS_THERAPY, data: rst },
          { key: CLINIC_SOURCES.UNKNOWN, data: unk },
        ].map(({ key, data: s }) => {
          const colors = SOURCE_COLORS[key];
          const b = breakdownBySource[key] || { active: 0, new_count: 0, new_revenue: 0, repeat_count: 0, repeat_revenue: 0 };
          return (
            <div key={key} style={{ ...sharedStyles.card, borderTop: `4px solid ${colors.accent}` }}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', color: colors.accent }}>
                    {CLINIC_SOURCE_LABELS[key]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{pct(s.period_revenue || 0)} of revenue</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#000', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  {fmtCurrency(s.period_revenue || 0)}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '18px' }}>
                  revenue in period · {b.active} patient{b.active === 1 ? '' : 's'} active
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: colors.bg, padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#555', marginBottom: '2px' }}>New — {b.new_count}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{fmtCurrency(b.new_revenue)}</div>
                  </div>
                  <div style={{ background: colors.bg, padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#555', marginBottom: '2px' }}>Repeat — {b.repeat_count}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{fmtCurrency(b.repeat_revenue)}</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#888' }}>
                  Roster total: {s.patient_count || 0} patient{s.patient_count === 1 ? '' : 's'} ever tagged to this bucket
                </div>
                {key === CLINIC_SOURCES.UNKNOWN && (s.patient_count || 0) > 0 && (
                  <div style={{ marginTop: '14px', fontSize: '12px', color: '#666' }}>
                    These patients have no referral source recorded.
                    Tag them on their profile to pull them into the right bucket.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient table */}
      <div style={sharedStyles.card}>
        <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All' },
              { key: CLINIC_SOURCES.RANGE_MEDICAL, label: 'Range Medical' },
              { key: CLINIC_SOURCES.RANGE_SPORTS_THERAPY, label: 'Range Sports Therapy' },
              { key: CLINIC_SOURCES.UNKNOWN, label: 'Unknown' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSourceFilter(opt.key)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: sourceFilter === opt.key ? '600' : '400',
                  background: sourceFilter === opt.key ? '#111' : '#fff',
                  color: sourceFilter === opt.key ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderLeft: '1px solid #e5e5e5', paddingLeft: '12px', marginLeft: '4px' }}>
            {[
              { key: 'all', label: 'All patients' },
              { key: 'active', label: 'Active in period' },
              { key: 'new', label: 'New' },
              { key: 'repeat', label: 'Repeat' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setActivityFilter(opt.key)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: activityFilter === opt.key ? '600' : '400',
                  background: activityFilter === opt.key ? '#111' : '#fff',
                  color: activityFilter === opt.key ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, email, referral…"
            style={{ flex: '1 1 240px', padding: '8px 12px', border: '1px solid #ddd', fontSize: '14px' }}
          />
          <button onClick={exportCSV} style={{ ...sharedStyles.btnSecondary, padding: '8px 14px', fontSize: '14px' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading…</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No patients match this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={sharedStyles.table}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Patient</th>
                  <th style={sharedStyles.th}>Source</th>
                  <th style={sharedStyles.th}>Referral Value</th>
                  <th style={sharedStyles.th}>First Visit</th>
                  <th style={sharedStyles.th}>Last Purchase</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Period Spend</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Lifetime Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const colors = SOURCE_COLORS[r.source];
                  return (
                    <tr key={r.patient_id}>
                      <td style={sharedStyles.td}>
                        <Link href={`/patients/${r.patient_id}`} style={{ color: '#000', textDecoration: 'none', fontWeight: '500' }}>
                          {r.name}
                        </Link>
                        {r.is_new_in_period ? (
                          <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '600', padding: '2px 6px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                            NEW
                          </span>
                        ) : (r.period_spend || 0) > 0 ? (
                          <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '600', padding: '2px 6px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                            REPEAT
                          </span>
                        ) : null}
                        {r.email && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{r.email}</div>}
                      </td>
                      <td style={sharedStyles.td}>
                        <span style={{ padding: '3px 10px', fontSize: '12px', fontWeight: '600', background: colors.bg, color: colors.accent }}>
                          {CLINIC_SOURCE_LABELS[r.source]}
                        </span>
                      </td>
                      <td style={{ ...sharedStyles.td, color: '#666', fontSize: '13px' }}>{r.referral_source_raw || '—'}</td>
                      <td style={{ ...sharedStyles.td, fontSize: '13px' }}>{fmtDate(r.created_at)}</td>
                      <td style={{ ...sharedStyles.td, fontSize: '13px' }}>{fmtDate(r.last_purchase_date)}</td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right', fontWeight: r.period_spend > 0 ? '600' : '400' }}>
                        {fmtCurrency(r.period_spend)}
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right', color: '#666' }}>{fmtCurrency(r.lifetime_spend)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '12px 20px', fontSize: '12px', color: '#888', borderTop: '1px solid #eee' }}>
          Showing {filteredRows.length.toLocaleString()} patient{filteredRows.length === 1 ? '' : 's'}. Revenue uses `purchases.amount_paid` with cross-source de-duplication (Stripe↔GHL webhook), excludes refunded charges.
          {' '}<strong style={{ color: '#b45309' }}>Numbers may differ ~3–5% from Stripe dashboard</strong>{' '}
          while we reconcile overlap between Stripe and GHL webhook logging. For authoritative Stripe totals, check Stripe directly.
        </div>
      </div>
    </AdminLayout>
  );
}
