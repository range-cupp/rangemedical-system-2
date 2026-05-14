// /pages/admin/medication-queue.js
// Unified Medication Fulfillment & Payment Queue
// Single view across HRT, Weight Loss, and Peptide protocols.
// Range Medical

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const CATEGORY_STYLES = {
  hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
  weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
  peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
};

const DISPENSE_STYLES = {
  overdue: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Overdue' },
  due_now: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'Due Now' },
  due_soon: { bg: '#fefce8', text: '#a16207', border: '#fef08a', label: 'Due Soon' },
  active: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Active' },
  never: { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', label: 'No History' },
};

const PAYMENT_STYLES = {
  paid: { bg: '#f0fdf4', text: '#166534' },
  comp: { bg: '#eef2ff', text: '#4338ca' },
  unknown: { bg: '#fef2f2', text: '#dc2626' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// --- Stat Card ---
function StatCard({ value, label, color, sublabel }) {
  return (
    <div style={{
      ...sharedStyles.statCard,
      borderTop: `3px solid ${color}`,
      minWidth: 0,
      flex: '1 1 0',
    }}>
      <div style={{ ...sharedStyles.statValue, color, fontSize: '32px' }}>{value}</div>
      <div style={{ ...sharedStyles.statLabel, marginTop: '4px' }}>{label}</div>
      {sublabel && <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{sublabel}</div>}
    </div>
  );
}

// --- Category Filter Pill ---
function FilterPill({ label, active, color, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: '600',
        border: active ? `2px solid ${color}` : '1px solid #ddd',
        background: active ? color + '18' : '#fff',
        color: active ? color : '#666',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? color : '#e5e5e5',
          color: active ? '#fff' : '#666',
          fontSize: '11px',
          fontWeight: '700',
          padding: '1px 6px',
          borderRadius: '10px',
          minWidth: '18px',
          textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

// --- Badge ---
function Badge({ style: customStyle, children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      fontSize: '12px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
      ...customStyle,
    }}>
      {children}
    </span>
  );
}

// --- Row urgency background ---
function getRowBg(status, isSelected) {
  if (isSelected) return '#f0f4ff';
  if (status === 'overdue') return '#fef2f2';
  if (status === 'due_now') return '#fffbeb';
  return 'transparent';
}

// =====================================================================
// Patient Drawer — shows ALL medications for one patient + notes
// =====================================================================
const STATUS_LABEL = { completed: 'Completed', inactive: 'Inactive', cancelled: 'Cancelled', paused: 'Paused' };

function PatientDrawer({ patientId, allRows, onClose, onNoteAdded }) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const patientRows = allRows.filter(r => r.patient_id === patientId);
  if (patientRows.length === 0) return null;

  const patient = patientRows[0];
  const DISPENSE_ORDER = { overdue: 0, due_now: 1, due_soon: 2, never: 3, active: 4 };
  const sorted = [...patientRows].sort((a, b) =>
    (DISPENSE_ORDER[a.dispense.status] ?? 5) - (DISPENSE_ORDER[b.dispense.status] ?? 5)
  );

  const needsAction = sorted.filter(r => r.dispense.status === 'overdue' || r.dispense.status === 'due_now' || r.dispense.status === 'due_soon');
  const notes = patient.notes || [];
  const completedProtocols = patient.completed_protocols || [];

  async function saveNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const resp = await fetch('/api/admin/medication-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_note', patient_id: patientId, body: noteText }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed to save');
      setNoteText('');
      setSaveMsg('Saved');
      if (onNoteAdded) onNoteAdded(patientId, json.note);
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px',
      background: '#fff', borderLeft: '1px solid #e5e5e5',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
      zIndex: 900, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid #e5e5e5',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>{patient.name}</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
            {sorted.length} active medication{sorted.length !== 1 ? 's' : ''}
            {needsAction.length > 0 && (
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                {' • '}{needsAction.length} need{needsAction.length !== 1 ? '' : 's'} action
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} style={sharedStyles.modalClose}>{'×'}</button>
      </div>

      {/* Contact */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
        {patient.phone && (
          <>
            <a href={`tel:${cleanPhone(patient.phone)}`} style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, textDecoration: 'none', fontSize: '13px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>{'📞'}</span> {fmtPhone(patient.phone)}
            </a>
            <a href={`sms:${cleanPhone(patient.phone)}`} style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, textDecoration: 'none', fontSize: '13px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>{'💬'}</span> Text
            </a>
          </>
        )}
        {patient.email && (
          <a href={`mailto:${patient.email}`} style={{ ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall, textDecoration: 'none', fontSize: '13px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>{'✉️'}</span> Email
          </a>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Medications */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: '14px' }}>
            Active Medications
          </div>

          {sorted.map(row => {
            const cs = CATEGORY_STYLES[row.category];
            const ds = DISPENSE_STYLES[row.dispense.status];
            const ps = PAYMENT_STYLES[row.payment.status];
            return (
              <div key={row.protocol_id} style={{
                border: '1px solid #e5e5e5', marginBottom: '12px',
                background: row.dispense.status === 'overdue' ? '#fef2f2' : row.dispense.status === 'due_now' ? '#fffbeb' : '#fff',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Badge style={{ background: cs.bg, color: cs.text, fontSize: '11px', padding: '2px 8px' }}>{cs.label}</Badge>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>{row.medication}</span>
                  </div>
                  {(row.dose || row.frequency) && (
                    <div style={{ fontSize: '13px', color: '#888' }}>{[row.dose, row.frequency].filter(Boolean).join(' • ')}</div>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Supply</span>
                    <Badge style={{ background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}>{row.dispense.label}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Payment</span>
                    <Badge style={{ background: ps.bg, color: ps.text }}>
                      {row.payment.status === 'paid' ? `Paid ${row.payment.label}` : row.payment.status === 'comp' ? 'Comp' : 'No Purchases'}
                    </Badge>
                  </div>
                  {row.dispense.last_dispensed_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Last Dispensed</span>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{fmtDate(row.dispense.last_dispensed_date)}</span>
                    </div>
                  )}
                  {row.dispense.next_due_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Next Due</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: row.dispense.status === 'overdue' ? '#dc2626' : row.dispense.status === 'due_now' ? '#c2410c' : '#374151' }}>
                        {fmtDate(row.dispense.next_due_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed Protocols */}
        {completedProtocols.length > 0 && (
          <div style={{ padding: '0 24px 20px' }}>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.8px', color: '#999', marginBottom: showCompleted ? '12px' : 0,
                display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              }}
            >
              <span style={{ fontSize: '10px', transition: 'transform 0.15s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'▶'}</span>
              Completed Protocols ({completedProtocols.length})
            </button>

            {showCompleted && completedProtocols.map(cp => {
              const cs = CATEGORY_STYLES[cp.category] || CATEGORY_STYLES.peptide;
              return (
                <div key={cp.protocol_id} style={{
                  border: '1px solid #e5e5e5', marginBottom: '8px', background: '#fafafa', opacity: 0.85,
                }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Badge style={{ background: cs.bg, color: cs.text, fontSize: '11px', padding: '2px 8px' }}>{cs.label}</Badge>
                      <span style={{ fontWeight: '500', fontSize: '14px', color: '#555' }}>{cp.medication}</span>
                      <Badge style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '10px', padding: '2px 6px', marginLeft: 'auto' }}>
                        {STATUS_LABEL[cp.status] || cp.status}
                      </Badge>
                    </div>
                    {(cp.dose || cp.frequency) && (
                      <div style={{ fontSize: '12px', color: '#999' }}>{[cp.dose, cp.frequency].filter(Boolean).join(' • ')}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {cp.start_date && <span>{fmtDate(cp.start_date)}</span>}
                      {cp.start_date && cp.end_date && <span>{' — '}</span>}
                      {cp.end_date && <span>{fmtDate(cp.end_date)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', marginBottom: '12px' }}>
            Notes
          </div>

          {/* Add note */}
          <div style={{ marginBottom: '16px' }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note… e.g. &quot;Sent 5/12, awaiting payment&quot;"
              rows={2}
              style={{
                ...sharedStyles.input,
                resize: 'vertical',
                minHeight: '52px',
                fontSize: '14px',
                lineHeight: '1.4',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              {saveMsg ? (
                <span style={{ fontSize: '13px', color: saveMsg.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: '500' }}>{saveMsg}</span>
              ) : <span />}
              <button
                onClick={saveNote}
                disabled={saving || !noteText.trim()}
                style={{
                  ...sharedStyles.btnPrimary,
                  ...sharedStyles.btnSmall,
                  fontSize: '13px',
                  padding: '6px 14px',
                  opacity: (saving || !noteText.trim()) ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>

          {/* Existing notes */}
          {notes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notes.slice(0, 10).map(note => (
                <div key={note.id} style={{
                  padding: '10px 14px',
                  background: '#f9fafb',
                  border: '1px solid #f0f0f0',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  <div style={{ color: '#333' }}>{note.body}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                    {note.created_by && <span style={{ fontWeight: '500' }}>{note.created_by}</span>}
                    {note.created_by && ' • '}
                    {fmtDate(note.note_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {notes.length === 0 && (
            <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No notes yet</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px', borderTop: '1px solid #e5e5e5',
        display: 'flex', gap: '10px', flexShrink: 0,
      }}>
        <Link
          href={`/admin/patient/${patientId}`}
          style={{
            ...sharedStyles.btnPrimary, flex: 1,
            textDecoration: 'none', justifyContent: 'center',
            fontSize: '14px', padding: '10px 16px',
          }}
        >
          Open Full Chart
        </Link>
      </div>
    </div>
  );
}

// =====================================================================
// Main Page
// =====================================================================
export default function MedicationQueuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('fulfillment');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [drawerPatientId, setDrawerPatientId] = useState(null);

  const openDrawer = useCallback((patientId) => setDrawerPatientId(patientId), []);
  const closeDrawer = useCallback(() => setDrawerPatientId(null), []);

  async function loadData() {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/medication-queue');
      if (!resp.ok) throw new Error('Failed to load');
      const json = await resp.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerPatientId) return;
    const handler = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerPatientId, closeDrawer]);

  // Filter + search
  const filtered = useMemo(() => {
    if (!data?.patients) return [];
    let rows = data.patients;
    if (categoryFilter !== 'all') {
      rows = rows.filter(r => r.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.medication || '').toLowerCase().includes(q)
      );
    }
    if (tab === 'payment') {
      const PAYMENT_PRIORITY = { unknown: 0, comp: 1, paid: 2 };
      rows = [...rows].sort((a, b) => {
        const pa = PAYMENT_PRIORITY[a.payment.status] ?? 3;
        const pb = PAYMENT_PRIORITY[b.payment.status] ?? 3;
        if (pa !== pb) return pa - pb;
        const DISP = { overdue: 0, due_now: 1, due_soon: 2, never: 3, active: 4 };
        return (DISP[a.dispense.status] ?? 5) - (DISP[b.dispense.status] ?? 5);
      });
    }
    if (sortField) {
      rows = [...rows].sort((a, b) => {
        let va, vb;
        if (sortField === 'name') { va = a.name; vb = b.name; }
        else if (sortField === 'medication') { va = a.medication; vb = b.medication; }
        else if (sortField === 'days') { va = a.dispense.days_until_due ?? 9999; vb = b.dispense.days_until_due ?? 9999; }
        else if (sortField === 'last_dispensed') { va = a.dispense.last_dispensed_date || ''; vb = b.dispense.last_dispensed_date || ''; }
        else if (sortField === 'last_payment') { va = a.payment.last_payment_date || ''; vb = b.payment.last_payment_date || ''; }
        else if (sortField === 'total_spent') { va = a.payment.total_spent; vb = b.payment.total_spent; }
        else return 0;
        if (typeof va === 'string') {
          const cmp = va.localeCompare(vb);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return rows;
  }, [data, categoryFilter, search, tab, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField(null); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortHeader({ field, children, style: extraStyle }) {
    const active = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          ...sharedStyles.th,
          cursor: 'pointer',
          userSelect: 'none',
          ...extraStyle,
        }}
      >
        {children}
        {active && <span style={{ marginLeft: '4px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </th>
    );
  }

  const stats = data?.stats || { total: 0, overdue: 0, due_this_week: 0, due_next_week: 0, needs_payment: 0, by_category: {} };

  if (loading && !data) {
    return (
      <AdminLayout title="Medication Queue">
        <div style={sharedStyles.loading}>Loading medication queue…</div>
      </AdminLayout>
    );
  }

  if (error && !data) {
    return (
      <AdminLayout title="Medication Queue">
        <div style={{ ...sharedStyles.emptyState, color: '#dc2626' }}>Error: {error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Medication Queue">
      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <StatCard value={stats.overdue} label="Overdue" color="#dc2626" sublabel="Supply exhausted" />
        <StatCard value={stats.due_this_week} label="Due This Week" color="#c2410c" sublabel="Within 7 days" />
        <StatCard value={stats.due_next_week} label="Due in 2 Weeks" color="#a16207" sublabel="8–14 days" />
        <StatCard value={stats.needs_payment} label="Needs Payment" color="#6b7280" sublabel="No purchases on file" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
        {[
          { key: 'fulfillment', label: 'Fulfillment Queue', icon: '📦' },
          { key: 'payment', label: 'Payment Queue', icon: '💳' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSortField(null); }}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: tab === t.key ? '600' : '400',
              color: tab === t.key ? '#000' : '#666',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #000' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-1px',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            ...sharedStyles.btnSecondary,
            ...sharedStyles.btnSmall,
            alignSelf: 'center',
            marginBottom: '4px',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Category Filters + Search */}
      <div style={{ ...sharedStyles.filterBar, marginBottom: '20px' }}>
        <FilterPill label="All" active={categoryFilter === 'all'} color="#000" onClick={() => setCategoryFilter('all')} />
        <FilterPill label="HRT" active={categoryFilter === 'hrt'} color="#7c3aed" count={stats.by_category.hrt || 0} onClick={() => setCategoryFilter('hrt')} />
        <FilterPill label="Weight Loss" active={categoryFilter === 'weight_loss'} color="#1e40af" count={stats.by_category.weight_loss || 0} onClick={() => setCategoryFilter('weight_loss')} />
        <FilterPill label="Peptide" active={categoryFilter === 'peptide'} color="#166534" count={stats.by_category.peptide || 0} onClick={() => setCategoryFilter('peptide')} />
        <div style={{ flex: 1 }} />
        <input
          type="text"
          placeholder="Search patient or medication…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...sharedStyles.searchInput, width: '280px' }}
        />
      </div>

      {/* Table */}
      <div style={sharedStyles.card}>
        <div style={{ overflowX: 'auto' }}>
          {tab === 'fulfillment' ? (
            <FulfillmentTable rows={filtered} SortHeader={SortHeader} onPatientClick={openDrawer} selectedPatientId={drawerPatientId} />
          ) : (
            <PaymentTable rows={filtered} SortHeader={SortHeader} onPatientClick={openDrawer} selectedPatientId={drawerPatientId} />
          )}
        </div>
        {filtered.length === 0 && (
          <div style={sharedStyles.emptyState}>
            <div style={sharedStyles.emptyIcon}>{tab === 'fulfillment' ? '📦' : '💳'}</div>
            <div style={sharedStyles.emptyText}>
              {search ? 'No patients match your search' : 'No patients in queue'}
            </div>
          </div>
        )}
      </div>

      {/* Drawer overlay (click to close) */}
      {drawerPatientId && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.15)', zIndex: 899,
          }}
        />
      )}

      {/* Patient Drawer */}
      {drawerPatientId && data?.patients && (
        <PatientDrawer
          patientId={drawerPatientId}
          allRows={data.patients}
          onClose={closeDrawer}
          onNoteAdded={(patientId, note) => {
            setData(prev => ({
              ...prev,
              patients: prev.patients.map(p =>
                p.patient_id === patientId
                  ? { ...p, notes: [note, ...(p.notes || [])] }
                  : p
              ),
            }));
          }}
        />
      )}
    </AdminLayout>
  );
}

// =====================================================================
// Fulfillment Table
// =====================================================================
function FulfillmentTable({ rows, SortHeader, onPatientClick, selectedPatientId }) {
  return (
    <table style={sharedStyles.table}>
      <thead>
        <tr>
          <SortHeader field="name" style={{ width: '200px' }}>Patient</SortHeader>
          <th style={sharedStyles.th}>Category</th>
          <SortHeader field="medication">Medication</SortHeader>
          <th style={sharedStyles.th}>Status</th>
          <SortHeader field="days" style={{ textAlign: 'right' }}>Days</SortHeader>
          <SortHeader field="last_dispensed">Last Dispensed</SortHeader>
          <th style={sharedStyles.th}>Payment</th>
          <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <FulfillmentRow key={row.protocol_id} row={row} onPatientClick={onPatientClick} isSelected={row.patient_id === selectedPatientId} />
        ))}
      </tbody>
    </table>
  );
}

function FulfillmentRow({ row, onPatientClick, isSelected }) {
  const ds = DISPENSE_STYLES[row.dispense.status] || DISPENSE_STYLES.active;
  const ps = PAYMENT_STYLES[row.payment.status] || PAYMENT_STYLES.unknown;
  const cs = CATEGORY_STYLES[row.category] || CATEGORY_STYLES.peptide;

  return (
    <tr style={{ background: getRowBg(row.dispense.status, isSelected), transition: 'background 0.15s' }}>
      {/* Patient — clickable */}
      <td style={sharedStyles.td}>
        <div
          onClick={() => onPatientClick(row.patient_id)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: cs.bg, color: cs.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', flexShrink: 0,
          }}>
            {row.initials}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a56db', textDecoration: 'underline', textDecorationColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {row.name}
              {row.notes && row.notes.length > 0 && (
                <span title={`${row.notes.length} note${row.notes.length !== 1 ? 's' : ''}`} style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0 }}>{'💬'}</span>
              )}
            </div>
            {row.frequency && (
              <div style={{ fontSize: '12px', color: '#888' }}>{row.frequency}</div>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td style={sharedStyles.td}>
        <Badge style={{ background: cs.bg, color: cs.text }}>{cs.label}</Badge>
      </td>

      {/* Medication */}
      <td style={sharedStyles.td}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>{row.medication}</div>
        {row.dose && <div style={{ fontSize: '12px', color: '#888' }}>{row.dose}</div>}
      </td>

      {/* Dispense Status */}
      <td style={sharedStyles.td}>
        <Badge style={{ background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}>
          {row.dispense.label}
        </Badge>
      </td>

      {/* Days */}
      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
        {row.dispense.status === 'overdue' ? (
          <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '15px' }}>
            {row.dispense.days_until_due === 0 ? 'NOW' : `${row.dispense.days_until_due}d`}
          </span>
        ) : row.dispense.days_until_due != null ? (
          <span style={{
            fontWeight: '600', fontSize: '15px',
            color: row.dispense.status === 'due_now' ? '#c2410c' : row.dispense.status === 'due_soon' ? '#a16207' : '#374151',
          }}>
            {row.dispense.days_until_due}d
          </span>
        ) : (
          <span style={{ color: '#999' }}>{'—'}</span>
        )}
      </td>

      {/* Last Dispensed */}
      <td style={sharedStyles.td}>
        <span style={{ fontSize: '14px', color: '#555' }}>{fmtDate(row.dispense.last_dispensed_date)}</span>
      </td>

      {/* Payment */}
      <td style={sharedStyles.td}>
        <Badge style={{ background: ps.bg, color: ps.text }}>
          {row.payment.status === 'paid' ? `Paid ${row.payment.label}` : row.payment.status === 'comp' ? 'Comp' : 'No Purchases'}
        </Badge>
      </td>

      {/* Actions */}
      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Link
            href={`/admin/patient/${row.patient_id}`}
            style={{
              ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall,
              padding: '5px 10px', fontSize: '12px', textDecoration: 'none',
            }}
          >
            Chart
          </Link>
          <Link
            href={`/admin/${row.category === 'hrt' ? 'hrt-tracker' : row.category === 'weight_loss' ? 'wl-tracker' : 'peptide-tracker'}`}
            style={{
              ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall,
              padding: '5px 10px', fontSize: '12px', textDecoration: 'none',
            }}
          >
            Tracker
          </Link>
        </div>
      </td>
    </tr>
  );
}

// =====================================================================
// Payment Table
// =====================================================================
function PaymentTable({ rows, SortHeader, onPatientClick, selectedPatientId }) {
  return (
    <table style={sharedStyles.table}>
      <thead>
        <tr>
          <SortHeader field="name" style={{ width: '200px' }}>Patient</SortHeader>
          <th style={sharedStyles.th}>Category</th>
          <SortHeader field="medication">Medication</SortHeader>
          <th style={sharedStyles.th}>Payment Status</th>
          <SortHeader field="last_payment">Last Payment</SortHeader>
          <SortHeader field="total_spent" style={{ textAlign: 'right' }}>Total Spent</SortHeader>
          <th style={sharedStyles.th}>Supply Status</th>
          <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <PaymentRow key={row.protocol_id} row={row} onPatientClick={onPatientClick} isSelected={row.patient_id === selectedPatientId} />
        ))}
      </tbody>
    </table>
  );
}

function PaymentRow({ row, onPatientClick, isSelected }) {
  const ds = DISPENSE_STYLES[row.dispense.status] || DISPENSE_STYLES.active;
  const cs = CATEGORY_STYLES[row.category] || CATEGORY_STYLES.peptide;
  const paymentBg = isSelected ? '#f0f4ff' : row.payment.status === 'unknown' ? '#fef2f2' : 'transparent';

  return (
    <tr style={{ background: paymentBg, transition: 'background 0.15s' }}>
      {/* Patient — clickable */}
      <td style={sharedStyles.td}>
        <div
          onClick={() => onPatientClick(row.patient_id)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: cs.bg, color: cs.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', flexShrink: 0,
          }}>
            {row.initials}
          </div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a56db', textDecoration: 'underline', textDecorationColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {row.name}
            {row.notes && row.notes.length > 0 && (
              <span title={`${row.notes.length} note${row.notes.length !== 1 ? 's' : ''}`} style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0 }}>{'💬'}</span>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td style={sharedStyles.td}>
        <Badge style={{ background: cs.bg, color: cs.text }}>{cs.label}</Badge>
      </td>

      {/* Medication */}
      <td style={sharedStyles.td}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>{row.medication}</div>
        {row.dose && <div style={{ fontSize: '12px', color: '#888' }}>{row.dose}</div>}
      </td>

      {/* Payment Status */}
      <td style={sharedStyles.td}>
        {row.payment.status === 'unknown' ? (
          <Badge style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>No Purchases</Badge>
        ) : row.payment.status === 'comp' ? (
          <Badge style={{ background: '#eef2ff', color: '#4338ca' }}>Comp</Badge>
        ) : (
          <Badge style={{ background: '#f0fdf4', color: '#166534' }}>Paid {row.payment.label}</Badge>
        )}
      </td>

      {/* Last Payment */}
      <td style={sharedStyles.td}>
        <span style={{ fontSize: '14px', color: '#555' }}>{fmtDate(row.payment.last_payment_date)}</span>
      </td>

      {/* Total Spent */}
      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
        {row.payment.total_spent > 0 ? (
          <span style={{ fontWeight: '600', fontSize: '14px' }}>${row.payment.total_spent.toLocaleString()}</span>
        ) : (
          <span style={{ color: '#999' }}>{'—'}</span>
        )}
      </td>

      {/* Supply Status */}
      <td style={sharedStyles.td}>
        <Badge style={{ background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}>
          {row.dispense.label}
        </Badge>
      </td>

      {/* Actions */}
      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
        <Link
          href={`/admin/patient/${row.patient_id}`}
          style={{
            ...sharedStyles.btnSecondary, ...sharedStyles.btnSmall,
            padding: '5px 10px', fontSize: '12px', textDecoration: 'none',
          }}
        >
          Chart
        </Link>
      </td>
    </tr>
  );
}
