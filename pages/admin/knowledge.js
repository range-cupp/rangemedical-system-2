// /pages/admin/knowledge.js
// Knowledge Base Manager — SOPs, pre/post instructions, clinical notes
// Staff and admins can add/edit/delete entries here.
// All active entries are injected into the staff bot's system prompt.

import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const CATEGORIES = [
  { value: 'pre_service',  label: 'Pre-Service Instructions' },
  { value: 'post_service', label: 'Post-Service Instructions' },
  { value: 'clinical',     label: 'Clinical Protocols' },
  { value: 'protocol',     label: 'Protocols' },
  { value: 'admin',        label: 'Admin / Operations' },
  { value: 'faq',          label: 'Staff FAQs' },
  { value: 'general',      label: 'General Knowledge' },
];

const CATEGORY_COLORS = {
  pre_service:  { bg: '#dbeafe', text: '#1d4ed8' },
  post_service: { bg: '#dcfce7', text: '#15803d' },
  clinical:     { bg: '#fef3c7', text: '#b45309' },
  protocol:     { bg: '#ede9fe', text: '#7c3aed' },
  admin:        { bg: '#f1f5f9', text: '#475569' },
  faq:          { bg: '#fee2e2', text: '#b91c1c' },
  general:      { bg: '#f0fdf4', text: '#166534' },
};

const EMPTY_FORM = { category: 'pre_service', title: '', content: '', tags: '', active: true };

export default function KnowledgePage() {
  const { session } = useAuth();
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null); // entry being edited
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load knowledge entries.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (session) load(); }, [session]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setForm({ category: entry.category, title: entry.title, content: entry.content, tags: entry.tags || '', active: entry.active });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url    = editing ? `/api/knowledge/${editing.id}` : '/api/knowledge';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(entry) {
    await fetch(`/api/knowledge/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ active: !entry.active }),
    });
    await load();
  }

  async function handleDelete(entry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    await fetch(`/api/knowledge/${entry.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    await load();
  }

  const filtered = entries.filter((e) => {
    const matchCat    = filterCat === 'all' || e.category === filterCat;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount   = entries.filter((e) => e.active).length;
  const inactiveCount = entries.filter((e) => !e.active).length;

  return (
    <AdminLayout title="Knowledge Base">
      <div style={{ maxWidth: '960px' }}>

        {/* Header */}
        <div style={{ ...sharedStyles.pageHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={sharedStyles.pageTitle}>Knowledge Base</h1>
            <p style={sharedStyles.pageSubtitle}>
              SOPs, pre/post instructions, clinical notes — all active entries are fed directly into the staff assistant.
              {entries.length > 0 && <span style={{ marginLeft: '8px', color: '#16a34a', fontWeight: '500' }}>
                {activeCount} active · {inactiveCount} inactive
              </span>}
            </p>
          </div>
          <button onClick={openNew} style={{ ...sharedStyles.buttonPrimary, whiteSpace: 'nowrap' }}>
            + New Entry
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            style={{ ...sharedStyles.input, flex: '1', minWidth: '200px', margin: 0 }}
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{ ...sharedStyles.input, width: 'auto', margin: 0 }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Entry list */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ ...sharedStyles.card, padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '15px', margin: '0 0 16px' }}>
              {entries.length === 0 ? 'No knowledge entries yet.' : 'No entries match your filters.'}
            </p>
            {entries.length === 0 && (
              <button onClick={openNew} style={sharedStyles.buttonPrimary}>Add your first entry</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((entry) => {
              const colors = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.general;
              const catLabel = CATEGORIES.find((c) => c.value === entry.category)?.label || entry.category;
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} style={{ ...sharedStyles.card, opacity: entry.active ? 1 : 0.55 }}>
                  <div
                    style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {/* Category badge */}
                    <span style={{ background: colors.bg, color: colors.text, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {catLabel}
                    </span>

                    {/* Title */}
                    <span style={{ fontWeight: '600', fontSize: '14px', flex: 1 }}>{entry.title}</span>

                    {/* Status + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      {!entry.active && (
                        <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>hidden from bot</span>
                      )}
                      <button
                        onClick={() => handleToggle(entry)}
                        title={entry.active ? 'Disable (hide from bot)' : 'Enable (show in bot)'}
                        style={{ background: entry.active ? '#dcfce7' : '#f1f5f9', color: entry.active ? '#15803d' : '#666', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {entry.active ? 'Active' : 'Off'}
                      </button>
                      <button onClick={() => openEdit(entry)} style={{ ...sharedStyles.buttonSecondary, padding: '4px 10px', fontSize: '12px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(entry)} style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>

                    {/* Expand chevron */}
                    <span style={{ color: '#999', fontSize: '12px', marginLeft: '4px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f0f0f0' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', color: '#333', margin: '12px 0 0', lineHeight: '1.6' }}>
                        {entry.content}
                      </pre>
                      {entry.tags && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>Tags: {entry.tags}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal — Add / Edit */}
      {showForm && (
        <div style={sharedStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '640px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h3 style={sharedStyles.modalTitle}>{editing ? 'Edit Entry' : 'New Knowledge Entry'}</h3>
              <button onClick={() => setShowForm(false)} style={sharedStyles.modalClose}>✕</button>
            </div>
            <div style={sharedStyles.modalBody}>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={sharedStyles.label}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={sharedStyles.input}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={sharedStyles.label}>Title <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. HBOT First-Timer Pre-Session Checklist"
                  style={sharedStyles.input}
                />
              </div>

              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={sharedStyles.label}>
                  Content <span style={{ color: '#dc2626' }}>*</span>
                  <span style={{ color: '#888', fontWeight: '400', marginLeft: '6px' }}>— paste your SOP here, bullets and line breaks are fine</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={`Example:\n- Remove all jewelry and electronics\n- No petroleum-based products (lotions, deodorant)\n- Wear 100% cotton clothing provided by clinic\n- No food or alcohol 2 hours before\n- Confirm no claustrophobia concerns`}
                  rows={10}
                  style={{ ...sharedStyles.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                />
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '16px' }}>
                <label style={sharedStyles.label}>Tags <span style={{ color: '#888', fontWeight: '400' }}>(optional, comma-separated)</span></label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. hbot, pre-service, checklist"
                  style={sharedStyles.input}
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="active-toggle" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Active — inject into staff assistant
                </label>
              </div>

              {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0 0' }}>{error}</p>}
            </div>
            <div style={sharedStyles.modalFooter}>
              <button onClick={() => setShowForm(false)} style={sharedStyles.buttonSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...sharedStyles.buttonPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
