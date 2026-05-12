import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const TYPE_COLORS = {
  prescription: { color: '#2563eb', bg: '#eff6ff' },
  supplement:   { color: '#059669', bg: '#ecfdf5' },
  therapy:      { color: '#7c3aed', bg: '#f5f3ff' },
  lab:          { color: '#d97706', bg: '#fffbeb' },
  referral:     { color: '#dc2626', bg: '#fef2f2' },
};

function providerLabel(createdBy) {
  if (!createdBy) return 'Provider';
  const lower = createdBy.toLowerCase();
  if (lower.includes('burgess')) return 'Dr. Damian Burgess';
  if (lower.includes('brendyn') || lower.includes('reed')) return 'Brendyn Reed, PA-C';
  return createdBy;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

export default function PlanSummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProvider, setFilterProvider] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [regeneratingId, setRegeneratingId] = useState(null);

  useEffect(() => {
    fetch('/api/notes/plan-summaries')
      .then(r => r.json())
      .then(data => setSummaries(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching plan summaries:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = summaries;
    if (filterProvider !== 'all') {
      list = list.filter(s => {
        const lower = (s.created_by || '').toLowerCase();
        if (filterProvider === 'burgess') return lower.includes('burgess');
        if (filterProvider === 'reed') return lower.includes('brendyn') || lower.includes('reed');
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.patient_name || '').toLowerCase().includes(q) ||
        (s.plan_summary?.visit_type || '').toLowerCase().includes(q) ||
        (s.plan_summary?.assessment || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [summaries, filterProvider, searchQuery]);

  const handleRegenerate = async (noteId) => {
    setRegeneratingId(noteId);
    try {
      const res = await fetch('/api/notes/plan-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummaries(prev => prev.map(s =>
          s.id === noteId ? { ...s, plan_summary: data.summary } : s
        ));
      }
    } catch (err) {
      console.error('Error regenerating summary:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <AdminLayout title="Plan Summaries">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Plan Summaries</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              AI-generated summaries of provider consultation notes
            </p>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '6px 12px', borderRadius: 6 }}>
            {filtered.length} {filtered.length === 1 ? 'summary' : 'summaries'}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search patients, visit types..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px', fontSize: 14,
              border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
            }}
          />
          <select
            value={filterProvider}
            onChange={e => setFilterProvider(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db',
              borderRadius: 6, background: '#fff', cursor: 'pointer',
            }}
          >
            <option value="all">All Providers</option>
            <option value="burgess">Dr. Burgess</option>
            <option value="reed">Brendyn Reed</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading plan summaries...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            {summaries.length === 0 ? 'No plan summaries yet.' : 'No summaries match your filters.'}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {filtered.map((s, idx) => {
              const summary = s.plan_summary || {};
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  {/* Accordion header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: isExpanded ? '#f9fafb' : '#fff',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Link href={`/patients/${s.patient_id}`} onClick={e => e.stopPropagation()}
                          style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                          {s.patient_name || 'Unknown'}
                        </Link>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>—</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                          {summary.visit_type || 'Consultation'}
                        </span>
                        {s.status === 'signed' && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            color: '#059669', background: '#ecfdf5',
                          }}>Signed</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {providerLabel(s.created_by)} &middot; {fmtDate(s.note_date)}
                      </div>
                    </div>
                    <span style={{ fontSize: 18, color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      ▾
                    </span>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* Assessment */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Assessment</div>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#1f2937' }}>{summary.assessment || 'No assessment provided.'}</p>
                      </div>

                      {/* Treatment Plan */}
                      {summary.treatment_plan && summary.treatment_plan.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Treatment Plan</div>
                          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                            {summary.treatment_plan.map((p, i) => {
                              const tc = TYPE_COLORS[p.type] || { color: '#6b7280', bg: '#f3f4f6' };
                              return (
                                <div key={i} style={{
                                  padding: '10px 12px', borderBottom: i < summary.treatment_plan.length - 1 ? '1px solid #f3f4f6' : 'none',
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                                }}>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                    color: tc.color, background: tc.bg, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                  }}>{p.type}</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.item}</span>
                                  {p.details && <span style={{ fontSize: 12, color: '#6b7280' }}>— {p.details}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {summary.action_items && summary.action_items.length > 0 && (
                        <div style={{
                          marginBottom: 16, padding: '12px 16px',
                          background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 4,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Action Items</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {summary.action_items.map((a, i) => (
                              <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: '#1f2937', marginBottom: 4 }}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-Up */}
                      <div style={{
                        padding: '10px 14px', background: '#f9fafb', borderRadius: 6,
                        marginBottom: 12,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Follow-Up</div>
                        <p style={{ margin: 0, fontSize: 13, color: '#1f2937' }}>{summary.follow_up || 'Not specified'}</p>
                      </div>

                      {/* Regenerate */}
                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerate(s.id); }}
                          disabled={regeneratingId === s.id}
                          style={{
                            fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
                            padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
                          }}
                        >
                          {regeneratingId === s.id ? 'Regenerating...' : 'Regenerate Summary'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
