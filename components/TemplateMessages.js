// components/TemplateMessages.js
// Message snippets/templates for quick SMS and email sending
// Fetches from database via /api/admin/snippets
// Range Medical System V2

import { useState, useEffect } from 'react';

export default function TemplateMessages({ onSelect, onClose }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/snippets')
      .then(r => r.json())
      .then(data => {
        // Group flat array by category
        const grouped = {};
        (data.snippets || []).forEach(s => {
          if (!grouped[s.category]) grouped[s.category] = [];
          grouped[s.category].push(s);
        });
        setGroups(
          Object.entries(grouped).map(([category, templates]) => ({
            category,
            templates,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Message Snippets</span>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>
      <div style={styles.body}>
        {loading ? (
          <div style={styles.loadingText}>Loading snippets...</div>
        ) : groups.length === 0 ? (
          <div style={styles.loadingText}>No snippets available</div>
        ) : (
          groups.map((group) => (
            <div key={group.category} style={styles.group}>
              <div style={styles.groupLabel}>{group.category}</div>
              {group.templates.map((tmpl) => (
                <button
                  key={tmpl.id || tmpl.label}
                  onClick={() => onSelect(tmpl.message)}
                  style={styles.templateBtn}
                >
                  <div style={styles.templateLabel}>{tmpl.label}</div>
                  {tmpl.message && (
                    <div style={styles.templatePreview}>
                      {tmpl.message.length > 80 ? tmpl.message.substring(0, 80) + '...' : tmpl.message}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    borderTop: '1px solid #e5e5e5',
    background: '#fff',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '0.3px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
  },
  body: {
    padding: '8px 12px',
  },
  group: {
    marginBottom: '12px',
  },
  groupLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
    padding: '4px 4px',
    letterSpacing: '0.4px',
  },
  templateBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: '1px solid #f0f0f0',
    borderRadius: '0',
    background: '#fafafa',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background 0.15s',
  },
  templateLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
  },
  templatePreview: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  loadingText: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    padding: '20px 0',
  },
};
