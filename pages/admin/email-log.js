// /pages/admin/email-log.js
// Email Log — mirrors Resend dashboard inside the admin panel.
// Shows sent emails with status badges and full HTML preview.

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const EVENT_STYLES = {
  sent:             { bg: '#e8f5e9', color: '#2e7d32', label: 'Sent' },
  delivered:        { bg: '#e8f5e9', color: '#2e7d32', label: 'Delivered' },
  delivery_delayed: { bg: '#fff3e0', color: '#e65100', label: 'Delayed' },
  opened:           { bg: '#e3f2fd', color: '#1565c0', label: 'Opened' },
  clicked:          { bg: '#ede7f6', color: '#4527a0', label: 'Clicked' },
  bounced:          { bg: '#ffebee', color: '#c62828', label: 'Bounced' },
  complained:       { bg: '#ffebee', color: '#c62828', label: 'Complained' },
};

function StatusBadge({ event }) {
  const s = EVENT_STYLES[event] || { bg: '#f5f5f5', color: '#666', label: event || 'Unknown' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      textTransform: 'capitalize',
    }}>
      {s.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function EmailLogPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cursors, setCursors] = useState({ after: null, before: null, stack: [] });
  const [filter, setFilter] = useState('');
  const iframeRef = useRef(null);

  const PAGE_SIZE = 50;

  const fetchEmails = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: PAGE_SIZE, ...params });
      const res = await fetch(`/api/admin/email-log?${qs}`);
      const data = await res.json();
      if (data.data) {
        setEmails(data.data);
      } else if (Array.isArray(data)) {
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const fetchDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/email-log?id=${id}`);
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      console.error('Failed to fetch email detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadNext = () => {
    if (emails.length === 0) return;
    const lastId = emails[emails.length - 1].id;
    setCursors(prev => ({ ...prev, stack: [...prev.stack, emails[0]?.id], after: lastId }));
    fetchEmails({ after: lastId });
  };

  const loadPrev = () => {
    if (cursors.stack.length === 0) return;
    const newStack = [...cursors.stack];
    const prevCursor = newStack.pop();
    setCursors(prev => ({ ...prev, stack: newStack }));
    fetchEmails(newStack.length === 0 ? {} : { after: newStack[newStack.length - 1] });
  };

  useEffect(() => {
    if (detail?.html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(detail.html);
      doc.close();
    }
  }, [detail]);

  const filtered = filter
    ? emails.filter(e =>
        (e.subject || '').toLowerCase().includes(filter.toLowerCase()) ||
        (Array.isArray(e.to) ? e.to.join(', ') : (e.to || '')).toLowerCase().includes(filter.toLowerCase())
      )
    : emails;

  return (
    <AdminLayout title="Email Log">
      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        {/* Left panel — email list */}
        <div style={{
          width: detail ? '380px' : '100%',
          minWidth: detail ? '380px' : undefined,
          borderRight: detail ? '1px solid #e0e0e0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          transition: 'width 0.2s',
        }}>
          {/* Search / filter bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <input
              type="text"
              placeholder="Filter by subject or recipient…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                ...sharedStyles.input,
                width: '100%',
                margin: 0,
                fontSize: 13,
              }}
            />
          </div>

          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>Loading emails…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>No emails found</div>
            ) : filtered.map(email => {
              const to = Array.isArray(email.to) ? email.to.join(', ') : (email.to || '');
              const isSelected = selectedId === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => fetchDetail(email.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: isSelected ? '#f5f0ff' : '#fff',
                    borderLeft: isSelected ? '3px solid #7c3aed' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1, marginRight: 8 }}>
                      {truncate(to, 36)}
                    </div>
                    <StatusBadge event={email.last_event} />
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginBottom: 4, lineHeight: 1.3 }}>
                    {truncate(email.subject, detail ? 42 : 80)}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {formatDate(email.created_at)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#666',
          }}>
            <button
              onClick={loadPrev}
              disabled={cursors.stack.length === 0}
              style={{
                ...sharedStyles.secondaryButton,
                fontSize: 12,
                padding: '4px 12px',
                opacity: cursors.stack.length === 0 ? 0.4 : 1,
              }}
            >
              ← Newer
            </button>
            <span>{filtered.length} email{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={loadNext}
              disabled={emails.length < PAGE_SIZE}
              style={{
                ...sharedStyles.secondaryButton,
                fontSize: 12,
                padding: '4px 12px',
                opacity: emails.length < PAGE_SIZE ? 0.4 : 1,
              }}
            >
              Older →
            </button>
          </div>
        </div>

        {/* Right panel — email detail */}
        {detail || detailLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafafa' }}>
            {detailLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>Loading email…</div>
            ) : detail ? (
              <>
                {/* Detail header */}
                <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111' }}>
                      {detail.subject}
                    </h2>
                    <button
                      onClick={() => { setSelectedId(null); setDetail(null); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 18, color: '#999', padding: '0 4px', lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Metadata grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px 24px',
                    fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>From</div>
                      <div style={{ color: '#333' }}>{detail.from}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>To</div>
                      <div style={{ color: '#333' }}>{Array.isArray(detail.to) ? detail.to.join(', ') : detail.to}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Status</div>
                      <StatusBadge event={detail.last_event} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Sent</div>
                      <div style={{ color: '#333' }}>{formatDate(detail.created_at)}</div>
                    </div>
                    {detail.id && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>ID</div>
                        <div style={{ color: '#999', fontSize: 11, fontFamily: 'monospace' }}>{detail.id}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* HTML preview */}
                <div style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 8,
                  }}>
                    Preview
                  </div>
                  <div style={{
                    flex: 1,
                    background: '#e8e8e8',
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '16px 0',
                  }}>
                    {detail.html ? (
                      <iframe
                        ref={iframeRef}
                        title="Email preview"
                        sandbox=""
                        style={{
                          width: '100%',
                          maxWidth: 640,
                          height: '100%',
                          border: 'none',
                          background: '#fff',
                          borderRadius: 4,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}
                      />
                    ) : (
                      <div style={{ padding: 32, color: '#999', textAlign: 'center' }}>
                        No HTML content available for this email.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 15 }}>
            Select an email to preview
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
