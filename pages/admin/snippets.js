// /pages/admin/snippets.js
// Snippets library — manage message templates for SMS and email
// Range Medical System

import { useState, useEffect } from 'react';
import AdminLayout, { sharedStyles, overlayClickProps } from '../../components/AdminLayout';
import { FileText, Plus, Edit2, Trash2, Search } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Labs',
  'Appointments',
  'Protocols',
  'Weight Loss',
  'IV & Therapies',
  'New Patients',
  'Reviews & Referrals',
  'Payments & Billing',
  'Re-Engagement',
  'Quick Replies',
];

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [editModal, setEditModal] = useState(null); // snippet object or 'new'
  const [formData, setFormData] = useState({ category: '', label: '', message: '', customCategory: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      const res = await fetch('/api/admin/snippets');
      const data = await res.json();
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error('Failed to load snippets:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Get unique categories from DB data
  const categories = ['All', ...new Set([...DEFAULT_CATEGORIES, ...snippets.map(s => s.category)])];

  // Filter snippets
  const filtered = snippets.filter(s => {
    if (activeCategory !== 'All' && s.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.label.toLowerCase().includes(q) || s.message.toLowerCase().includes(q);
    }
    return true;
  });

  // Open create modal
  const handleAdd = () => {
    setFormData({ category: activeCategory !== 'All' ? activeCategory : '', label: '', message: '', customCategory: '' });
    setEditModal('new');
  };

  // Open edit modal
  const handleEdit = (snippet) => {
    const isCustomCategory = !DEFAULT_CATEGORIES.includes(snippet.category);
    setFormData({
      category: isCustomCategory ? 'Other' : snippet.category,
      label: snippet.label,
      message: snippet.message,
      customCategory: isCustomCategory ? snippet.category : '',
    });
    setEditModal(snippet);
  };

  // Save (create or update)
  const handleSave = async () => {
    const category = formData.category === 'Other' ? formData.customCategory.trim() : formData.category;
    if (!category || !formData.label.trim()) return;

    setSaving(true);
    try {
      const isNew = editModal === 'new';
      const res = await fetch('/api/admin/snippets', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isNew ? {} : { id: editModal.id }),
          category,
          label: formData.label.trim(),
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (isNew) {
          setSnippets(prev => [...prev, data.snippet]);
        } else {
          setSnippets(prev => prev.map(s => s.id === editModal.id ? data.snippet : s));
        }
        setEditModal(null);
        showSuccess(isNew ? 'Snippet created' : 'Snippet updated');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (snippet) => {
    if (!window.confirm(`Delete "${snippet.label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/snippets?id=${snippet.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnippets(prev => prev.filter(s => s.id !== snippet.id));
        showSuccess('Snippet deleted');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <AdminLayout
      title="Snippets"
      actions={
        <button style={sharedStyles.btnPrimary} onClick={handleAdd}>
          <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Add Snippet
        </button>
      }
    >
      {/* Success toast */}
      {successMsg && (
        <div style={pageStyles.toast}>{successMsg}</div>
      )}

      {/* Category tabs */}
      <div style={pageStyles.tabBar}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              ...pageStyles.tab,
              ...(activeCategory === cat ? pageStyles.tabActive : {}),
            }}
          >
            {cat}
            {cat !== 'All' && (
              <span style={pageStyles.tabCount}>
                {snippets.filter(s => s.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div style={pageStyles.searchWrap}>
          <Search size={16} style={{ color: '#999', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search snippets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={pageStyles.searchInput}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={sharedStyles.loading}>Loading snippets...</div>
      ) : filtered.length === 0 ? (
        <div style={sharedStyles.emptyState}>
          <div style={sharedStyles.emptyIcon}>📝</div>
          <div style={sharedStyles.emptyText}>
            {search ? 'No snippets match your search' : 'No snippets yet'}
          </div>
        </div>
      ) : (
        <div style={sharedStyles.card}>
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Label</th>
                <th style={sharedStyles.th}>Category</th>
                <th style={{ ...sharedStyles.th, width: '45%' }}>Preview</th>
                <th style={{ ...sharedStyles.th, width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(snippet => (
                <tr key={snippet.id} style={sharedStyles.trHover}>
                  <td style={{ ...sharedStyles.td, fontWeight: 600 }}>{snippet.label}</td>
                  <td style={sharedStyles.td}>
                    <span style={pageStyles.categoryBadge}>{snippet.category}</span>
                  </td>
                  <td style={{ ...sharedStyles.td, color: '#666', fontSize: 13 }}>
                    {snippet.message
                      ? snippet.message.length > 100 ? snippet.message.substring(0, 100) + '...' : snippet.message
                      : <span style={{ color: '#ccc', fontStyle: 'italic' }}>Empty</span>
                    }
                  </td>
                  <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(snippet)}
                      style={pageStyles.iconBtn}
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(snippet)}
                      style={{ ...pageStyles.iconBtn, color: '#ef4444' }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Count */}
      <div style={pageStyles.countText}>
        {filtered.length} snippet{filtered.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
      </div>

      {/* Create/Edit Modal */}
      {editModal && (
        <div style={sharedStyles.modalOverlay} {...overlayClickProps(() => setEditModal(null))}>
          <div style={{ ...sharedStyles.modal, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>
                {editModal === 'new' ? 'New Snippet' : 'Edit Snippet'}
              </h2>
              <button style={sharedStyles.modalClose} onClick={() => setEditModal(null)}>×</button>
            </div>

            <div style={sharedStyles.modalBody}>
              {/* Category */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={sharedStyles.select}
                >
                  <option value="">Select category...</option>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (custom)</option>
                </select>
              </div>

              {formData.category === 'Other' && (
                <div style={sharedStyles.fieldGroup}>
                  <label style={sharedStyles.label}>Custom Category</label>
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="e.g., Blood Work Instructions"
                    style={sharedStyles.input}
                  />
                </div>
              )}

              {/* Label */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Pre-IV Instructions"
                  style={sharedStyles.input}
                />
              </div>

              {/* Message */}
              <div style={sharedStyles.fieldGroup}>
                <label style={sharedStyles.label}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Hi {{name}}, ..."
                  rows={6}
                  style={{ ...sharedStyles.input, minHeight: 140, fontFamily: 'inherit', resize: 'vertical' }}
                />
                <div style={pageStyles.variableHelp}>
                  Variables: <code style={pageStyles.code}>{'{{name}}'}</code> (first name),{' '}
                  <code style={pageStyles.code}>{'{{first_name}}'}</code>,{' '}
                  <code style={pageStyles.code}>{'{{last_name}}'}</code> — auto-replaced when sending
                </div>
              </div>
            </div>

            <div style={sharedStyles.modalFooter}>
              <button style={sharedStyles.btnSecondary} onClick={() => setEditModal(null)}>
                Cancel
              </button>
              <button
                style={sharedStyles.btnPrimary}
                onClick={handleSave}
                disabled={saving || !formData.label.trim() || (!formData.category || (formData.category === 'Other' && !formData.customCategory.trim()))}
              >
                {saving ? 'Saving...' : editModal === 'new' ? 'Create Snippet' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const pageStyles = {
  tabBar: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #e5e5e5',
  },
  tab: {
    padding: '6px 14px',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  tabCount: {
    fontSize: 11,
    opacity: 0.6,
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: 0,
    background: '#fff',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    width: '100%',
    background: 'transparent',
  },
  categoryBadge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 0,
    background: '#f3f4f6',
    color: '#555',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 6px',
    borderRadius: 0,
    transition: 'background 0.15s',
  },
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    background: '#111',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 0,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  countText: {
    marginTop: 12,
    fontSize: 13,
    color: '#999',
  },
  variableHelp: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    lineHeight: 1.5,
  },
  code: {
    background: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: 0,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
};
