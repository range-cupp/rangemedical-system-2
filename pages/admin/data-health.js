// /pages/admin/data-health.js
// Data Health Dashboard — surfaces every data inconsistency across the CRM in one place.
// Range Medical

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const TYPE_LABELS = {
  missing_service_log: 'Appointment without service log',
  missing_dose: 'Injection missing dose',
  protocol_overflow: 'Protocol needs extension',
  owes_money: 'Owes money',
  orphan_purchase: 'Purchase not linked to protocol',
  orphan_service_log: 'Service log not linked to protocol',
  unlinked_note: 'Clinical note without appointment',
};

const SEV_COLORS = {
  high:   { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
  medium: { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  low:    { bg: '#f1f5f9', border: '#e2e8f0', text: '#475569' },
};

export default function DataHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sevFilter, setSevFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data-audit');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAudit(); }, []);

  const filtered = useMemo(() => {
    if (!data?.issues) return [];
    return data.issues.filter(i => {
      if (sevFilter !== 'all' && i.severity !== sevFilter) return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (search && !i.patient_name.toLowerCase().includes(search.toLowerCase()) && !i.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, sevFilter, typeFilter, search]);

  // Group filtered issues by patient
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(i => {
      const key = i.patient_id || 'unknown';
      if (!map[key]) map[key] = { patient_id: i.patient_id, patient_name: i.patient_name, issues: [] };
      map[key].issues.push(i);
    });
    return Object.values(map).sort((a, b) => b.issues.length - a.issues.length);
  }, [filtered]);

  return (
    <AdminLayout title="Data Health">
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Data Health</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
              Inconsistencies across patients, protocols, appointments, notes, and purchases
            </p>
          </div>
          <button onClick={fetchAudit} disabled={loading} style={{ ...sharedStyles?.button, padding: '10px 18px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {loading ? 'Scanning…' : '↻ Re-run audit'}
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading && !data && (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Scanning database…</div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <SummaryCard label="Total issues" value={data.summary.total} color="#0f172a" />
              <SummaryCard label="High severity" value={data.summary.high} color="#b91c1c" onClick={() => setSevFilter('high')} />
              <SummaryCard label="Medium" value={data.summary.medium} color="#a16207" onClick={() => setSevFilter('medium')} />
              <SummaryCard label="Low" value={data.summary.low} color="#475569" onClick={() => setSevFilter('low')} />
            </div>

            {/* Type breakdown */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setTypeFilter('all')} style={chipStyle(typeFilter === 'all')}>
                All types ({data.summary.total})
              </button>
              {Object.entries(data.summary.by_type).map(([type, count]) => (
                <button key={type} onClick={() => setTypeFilter(type)} style={chipStyle(typeFilter === type)}>
                  {TYPE_LABELS[type] || type} ({count})
                </button>
              ))}
            </div>

            {/* Filters row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <input
                placeholder="Search patient or message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', fontSize: 14 }}
              />
              <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontSize: 13 }}>
                <option value="all">All severity</option>
                <option value="high">High only</option>
                <option value="medium">Medium only</option>
                <option value="low">Low only</option>
              </select>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Showing {filtered.length} of {data.summary.total}
              </div>
            </div>

            {/* Grouped issue list */}
            {grouped.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                ✓ No issues match these filters
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped.map(g => (
                  <div key={g.patient_id || 'unknown'} style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{g.patient_name}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{g.issues.length} issue{g.issues.length > 1 ? 's' : ''}</span>
                      </div>
                      {g.patient_id && (
                        <Link href={`/patients/${g.patient_id}`} style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
                          Open profile →
                        </Link>
                      )}
                    </div>
                    <div>
                      {g.issues.map((issue, idx) => {
                        const c = SEV_COLORS[issue.severity];
                        return (
                          <div key={idx} style={{ padding: '10px 16px', borderTop: idx > 0 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                              {issue.severity}
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 200 }}>{TYPE_LABELS[issue.type] || issue.type}</span>
                            <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{issue.message}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
              Generated {new Date(data.generated_at).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: 16, border: '1px solid #e2e8f0', background: '#fff', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function chipStyle(active) {
  return {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    background: active ? '#0f172a' : '#fff',
    color: active ? '#fff' : '#475569',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  };
}
