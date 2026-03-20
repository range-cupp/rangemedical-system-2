// /pages/admin/knowledge.js
// Knowledge Base Manager — rebuilt with Send Forms UI framework

import { useState, useEffect } from 'react';
import AdminLayout, { overlayClickProps } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const CATEGORIES = [
  { value: 'all',          label: 'All',                  icon: '📚' },
  { value: 'pre_service',  label: 'Pre-Service',          icon: '📋' },
  { value: 'post_service', label: 'Post-Service',         icon: '✅' },
  { value: 'clinical',     label: 'Clinical',             icon: '🩺' },
  { value: 'protocol',     label: 'Protocols',            icon: '💊' },
  { value: 'admin',        label: 'Admin / Ops',          icon: '🏢' },
  { value: 'faq',          label: 'FAQs',                 icon: '❓' },
  { value: 'general',      label: 'General',              icon: '📝' },
];

const CAT_ICON  = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.icon]));
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const EMPTY_FORM = { category: 'pre_service', title: '', content: '', tags: '', active: true };

export default function KnowledgePage() {
  const { session } = useAuth();
  const [entries, setEntries]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected]           = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState('');
  const [search, setSearch]               = useState('');

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch('/api/knowledge', { headers: { Authorization: `Bearer ${session?.access_token}` } });
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (session) load(); }, [session]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: activeCategory !== 'all' ? activeCategory : 'pre_service' });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(e, entry) {
    e.stopPropagation();
    setEditing(entry);
    setForm({ category: entry.category, title: entry.title, content: entry.content, tags: entry.tags || '', active: entry.active });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) { setFormError('Title and content are required.'); return; }
    setSaving(true); setFormError('');
    try {
      const url    = editing ? `/api/knowledge/${editing.id}` : '/api/knowledge';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed'); }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(e, entry) {
    e.stopPropagation();
    await fetch(`/api/knowledge/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ active: !entry.active }),
    });
    await load();
  }

  async function handleDelete(e, entry) {
    e.stopPropagation();
    if (!confirm(`Delete "${entry.title}"?`)) return;
    await fetch(`/api/knowledge/${entry.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}` } });
    if (selected?.id === entry.id) setSelected(null);
    await load();
  }

  const filtered = entries.filter((e) => {
    const matchCat    = activeCategory === 'all' || e.category === activeCategory;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const countFor = (cat) => cat === 'all'
    ? entries.filter((e) => e.active).length
    : entries.filter((e) => e.category === cat && e.active).length;

  return (
    <AdminLayout title="Knowledge Base">
      <style>{`
        .kb-wrap { max-width: 900px; }
        .kb-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
        .kb-title  { margin:0; font-size:26px; font-weight:700; color:#0f172a; }
        .kb-sub    { margin:4px 0 0; font-size:13px; color:#64748b; }
        .kb-add-btn { padding:9px 18px; border:none; border-radius:10px; background:#2563eb; color:#fff; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background 0.15s; }
        .kb-add-btn:hover { background:#1d4ed8; }
        .kb-search { width:100%; padding:9px 14px; border:1px solid #e2e8f0; border-radius:10px; font-size:13px; font-family:inherit; color:#0f172a; margin-bottom:14px; outline:none; box-sizing:border-box; }
        .kb-search:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .kb-tabs { display:flex; gap:0; border-bottom:1px solid #e2e8f0; margin-bottom:16px; overflow-x:auto; }
        .kb-tab { padding:10px 16px; border:none; background:none; font-size:13px; font-weight:600; color:#94a3b8; cursor:pointer; border-bottom:2px solid transparent; font-family:inherit; transition:all 0.15s; white-space:nowrap; display:flex; align-items:center; gap:5px; }
        .kb-tab:hover { color:#475569; }
        .kb-tab.active { color:#1e40af; border-bottom-color:#2563eb; }
        .kb-tab-count { background:#e0e7ff; color:#3730a3; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; min-width:18px; text-align:center; }
        .kb-tab.active .kb-tab-count { background:#2563eb; color:#fff; }
        .kb-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        @media(max-width:600px){.kb-grid{grid-template-columns:1fr;}}
        .kb-card { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; transition:all 0.15s; text-align:left; width:100%; font-family:inherit; }
        .kb-card:hover { border-color:#94a3b8; background:#f8fafc; }
        .kb-card.selected { border-color:#2563eb; background:#eff6ff; }
        .kb-card.inactive { opacity:0.45; }
        .kb-card-icon { font-size:16px; flex-shrink:0; margin-top:2px; }
        .kb-card-body { flex:1; min-width:0; }
        .kb-card-title { font-size:13px; font-weight:600; color:#1e293b; margin:0 0 3px; line-height:1.3; }
        .kb-card-meta  { font-size:11px; color:#94a3b8; margin:0; }
        .kb-card-actions { display:flex; gap:4px; flex-shrink:0; opacity:0; transition:opacity 0.15s; }
        .kb-card:hover .kb-card-actions { opacity:1; }
        .kb-card-btn { padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid #e2e8f0; background:#fff; color:#475569; font-family:inherit; transition:all 0.15s; }
        .kb-card-btn:hover { background:#f1f5f9; }
        .kb-card-btn.danger { color:#dc2626; border-color:#fecaca; }
        .kb-card-btn.danger:hover { background:#fff0f0; }
        .kb-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:6px; }
        .kb-dot.on { background:#22c55e; } .kb-dot.off { background:#d1d5db; }
        .kb-detail { grid-column:1/-1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px 20px; }
        .kb-detail-title { font-size:14px; font-weight:700; color:#0f172a; margin:0 0 10px; }
        .kb-detail-content { white-space:pre-wrap; font-size:13px; color:#334155; line-height:1.65; font-family:inherit; margin:0; }
        .kb-detail-footer { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0; }
        .kb-detail-tags { font-size:11px; color:#94a3b8; }
        .kb-detail-actions { display:flex; gap:6px; }
        .kb-empty { grid-column:1/-1; text-align:center; padding:48px 20px; color:#94a3b8; font-size:14px; }
        .kb-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
        .kb-modal { background:#fff; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
        .kb-modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 16px; border-bottom:1px solid #f1f5f9; }
        .kb-modal-title { margin:0; font-size:16px; font-weight:700; color:#0f172a; }
        .kb-modal-close { background:none; border:none; font-size:18px; color:#94a3b8; cursor:pointer; padding:2px 6px; border-radius:6px; font-family:inherit; }
        .kb-modal-close:hover { background:#f1f5f9; color:#475569; }
        .kb-modal-body { padding:20px 24px; }
        .kb-modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9; }
        .kb-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:6px; }
        .kb-input { width:100%; padding:9px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; font-family:inherit; color:#0f172a; margin-bottom:14px; box-sizing:border-box; outline:none; }
        .kb-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .kb-textarea { resize:vertical; min-height:160px; line-height:1.55; }
        .kb-btn-primary { padding:9px 20px; border:none; border-radius:8px; background:#2563eb; color:#fff; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.15s; }
        .kb-btn-primary:hover:not(:disabled) { background:#1d4ed8; }
        .kb-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
        .kb-btn-secondary { padding:9px 20px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#475569; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.15s; }
        .kb-btn-secondary:hover { background:#f8fafc; border-color:#94a3b8; }
        .kb-error { color:#dc2626; font-size:12px; margin:4px 0 0; }
      `}</style>

      <div className="kb-wrap">
        <div className="kb-header">
          <div>
            <h1 className="kb-title">Knowledge Base</h1>
            <p className="kb-sub">SOPs, pre/post instructions, clinical protocols — all active entries feed into the staff assistant.</p>
          </div>
          <button className="kb-add-btn" onClick={openNew}>+ New Entry</button>
        </div>

        <input className="kb-search" placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="kb-tabs">
          {CATEGORIES.map((c) => {
            const count = countFor(c.value);
            return (
              <button key={c.value} className={`kb-tab${activeCategory === c.value ? ' active' : ''}`} onClick={() => { setActiveCategory(c.value); setSelected(null); }}>
                {c.icon} {c.label}
                {count > 0 && <span className="kb-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '32px 0', textAlign: 'center' }}>Loading...</p>
        ) : (
          <div className="kb-grid">
            {filtered.length === 0 ? (
              <div className="kb-empty">
                {entries.length === 0
                  ? <><p style={{ margin: '0 0 14px' }}>No entries yet.</p><button className="kb-add-btn" onClick={openNew}>Add your first SOP</button></>
                  : 'No entries match your filters.'
                }
              </div>
            ) : filtered.map((entry) => {
              const isSelected = selected?.id === entry.id;
              const wordCount  = entry.content.trim().split(/\s+/).length;
              return [
                <button key={entry.id} className={`kb-card${isSelected ? ' selected' : ''}${!entry.active ? ' inactive' : ''}`} onClick={() => setSelected(isSelected ? null : entry)}>
                  <span className="kb-card-icon">{CAT_ICON[entry.category] || '📝'}</span>
                  <div className="kb-card-body">
                    <p className="kb-card-title">{entry.title}</p>
                    <p className="kb-card-meta">{CAT_LABEL[entry.category] || entry.category} · {wordCount} words</p>
                  </div>
                  <div className="kb-card-actions">
                    <button className="kb-card-btn" onClick={(e) => openEdit(e, entry)}>Edit</button>
                    <button className="kb-card-btn" onClick={(e) => handleToggle(e, entry)}>{entry.active ? 'On' : 'Off'}</button>
                    <button className="kb-card-btn danger" onClick={(e) => handleDelete(e, entry)}>✕</button>
                  </div>
                  <span className={`kb-dot ${entry.active ? 'on' : 'off'}`} />
                </button>,

                isSelected && (
                  <div key={`${entry.id}-detail`} className="kb-detail">
                    <p className="kb-detail-title">{entry.title}</p>
                    <pre className="kb-detail-content">{entry.content}</pre>
                    <div className="kb-detail-footer">
                      <span className="kb-detail-tags">{entry.tags ? `Tags: ${entry.tags}` : ''}</span>
                      <div className="kb-detail-actions">
                        <button className="kb-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={(e) => openEdit(e, entry)}>Edit</button>
                        <button className="kb-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', color: entry.active ? '#dc2626' : '#16a34a', borderColor: entry.active ? '#fecaca' : '#bbf7d0' }} onClick={(e) => handleToggle(e, entry)}>
                          {entry.active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ];
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="kb-overlay" {...overlayClickProps(() => setShowForm(false))}>
          <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kb-modal-header">
              <h3 className="kb-modal-title">{editing ? 'Edit Entry' : 'New Knowledge Entry'}</h3>
              <button className="kb-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="kb-modal-body">
              <label className="kb-label">Category</label>
              <select className="kb-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>

              <label className="kb-label">Title <span style={{ color: '#dc2626' }}>*</span></label>
              <input className="kb-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. HBOT First-Timer Pre-Session Checklist" />

              <label className="kb-label">
                Content <span style={{ color: '#dc2626' }}>*</span>
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>— paste SOP here, bullets and line breaks are fine</span>
              </label>
              <textarea className="kb-input kb-textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={`- Step 1\n- Step 2\n- Step 3`} rows={10} />

              <label className="kb-label">Tags <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional, comma-separated)</span></label>
              <input className="kb-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hbot, pre-service, checklist" />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <input type="checkbox" id="kb-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="kb-active" style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }}>Active — inject into staff assistant</label>
              </div>

              {formError && <p className="kb-error">{formError}</p>}
            </div>
            <div className="kb-modal-footer">
              <button className="kb-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="kb-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Entry'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
