// /pages/admin/quotes/index.js
// List of custom pricing quotes
// Range Medical

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

const fmt = (cents) => `$${((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const STATUS_STYLES = {
  draft: { ...s.badge, ...s.badgePending },
  sent: { ...s.badge, background: '#dbeafe', color: '#1e40af' },
  viewed: { ...s.badge, background: '#ede9fe', color: '#5b21b6' },
  accepted: { ...s.badge, ...s.badgeActive },
  paid: { ...s.badge, background: '#dcfce7', color: '#166534' },
  expired: { ...s.badge, ...s.badgeCompleted },
};

function ActionMenu({ quote, onDelete, onSend, onDuplicate, onPaymentLink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quote/${quote.token}`);
    setOpen(false);
  };

  const menuStyle = {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minWidth: 180,
    zIndex: 100,
    overflow: 'hidden',
  };

  const itemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid #f0f0f0',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
  };

  const dangerStyle = {
    ...itemStyle,
    color: '#dc2626',
    borderBottom: 'none',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...s.btnSecondary,
          ...s.btnSmall,
          padding: '6px 10px',
          fontSize: 18,
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        &#8943;
      </button>
      {open && (
        <div style={menuStyle}>
          <button
            style={itemStyle}
            onClick={() => { router.push(`/admin/quotes/edit/${quote.id}`); setOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Edit
          </button>
          <button
            style={itemStyle}
            onClick={() => { window.open(`/quote/${quote.token}?preview=true`, '_blank'); setOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Preview Quote
          </button>
          <button
            style={itemStyle}
            onClick={copyLink}
            onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Copy Link
          </button>
          {quote.recipient_phone && (
            <button
              style={itemStyle}
              onClick={() => { onSend(quote); setOpen(false); }}
              onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              {quote.status === 'draft' ? 'Send via SMS' : 'Resend SMS'}
            </button>
          )}
          <button
            style={{ ...itemStyle, color: '#0a0a0a', fontWeight: 600 }}
            onClick={() => { onPaymentLink(quote); setOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = '#f0fdf4'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {quote.stripe_session_url ? 'View Payment Link' : 'Create Payment Link'}
          </button>
          <button
            style={itemStyle}
            onClick={() => { onDuplicate(quote); setOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = '#f8f8f8'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Duplicate
          </button>
          <button
            style={dangerStyle}
            onClick={() => { onDelete(quote); setOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuotesIndex() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [paymentLinkModal, setPaymentLinkModal] = useState(null); // { quote, step: 'pick'|'show'|'loading', url?, optionIndex?, error? }
  const router = useRouter();

  const loadQuotes = () => {
    fetch('/api/quotes')
      .then((r) => r.json())
      .then((d) => { setQuotes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadQuotes(); }, []);

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleDelete = (quote) => {
    setConfirmDelete(quote);
  };

  const confirmDeleteQuote = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/quotes/manage/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setQuotes((prev) => prev.filter((q) => q.id !== confirmDelete.id));
      showMsg(`Deleted quote for ${confirmDelete.recipient_name}`);
    } catch {
      showMsg('Failed to delete quote');
    }
    setConfirmDelete(null);
  };

  const handleSend = async (quote) => {
    try {
      const res = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quote.id }),
      });
      if (!res.ok) throw new Error('Send failed');
      showMsg(`SMS sent to ${quote.recipient_name}`);
      loadQuotes();
    } catch {
      showMsg('Failed to send SMS');
    }
  };

  const handlePaymentLink = (quote) => {
    const hasOptions = Array.isArray(quote.options) && quote.options.length > 0;
    // If a link already exists, show it straight away.
    if (quote.stripe_session_url) {
      setPaymentLinkModal({ quote, step: 'show', url: quote.stripe_session_url, optionIndex: quote.accepted_option_index ?? null, existing: true });
      return;
    }
    if (hasOptions) {
      setPaymentLinkModal({ quote, step: 'pick' });
    } else {
      createPaymentLink(quote, null);
    }
  };

  const createPaymentLink = async (quote, optionIndex) => {
    setPaymentLinkModal({ quote, step: 'loading', optionIndex });
    try {
      const res = await fetch(`/api/quotes/manage/${quote.id}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment link');
      setPaymentLinkModal({ quote, step: 'show', url: data.url, optionIndex, amount_cents: data.amount_cents });
      loadQuotes();
    } catch (err) {
      setPaymentLinkModal({ quote, step: 'pick', error: err.message, optionIndex });
    }
  };

  const sendPaymentLinkSMS = async (quote, url) => {
    try {
      const res = await fetch('/api/quotes/send-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quote.id }),
      });
      if (!res.ok) throw new Error('Send failed');
      showMsg(`Payment link sent to ${quote.recipient_name}`);
    } catch {
      showMsg('Failed to send payment link SMS');
    }
  };

  const handleDuplicate = async (quote) => {
    try {
      const srcRes = await fetch(`/api/quotes/manage/${quote.id}`);
      const src = await srcRes.json();
      if (!srcRes.ok) throw new Error('Failed to load quote');

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: src.patient_id,
          recipient_name: src.recipient_name,
          recipient_phone: src.recipient_phone,
          recipient_email: src.recipient_email,
          title: src.title ? `${src.title} (copy)` : null,
          intro_note: src.intro_note,
          items: src.items,
          discount_cents: src.discount_cents,
          options: src.options,
          expires_at: null,
        }),
      });
      if (!res.ok) throw new Error('Duplicate failed');
      showMsg(`Duplicated quote for ${quote.recipient_name}`);
      loadQuotes();
    } catch {
      showMsg('Failed to duplicate quote');
    }
  };

  return (
    <AdminLayout title="Custom Pricing Quotes">
      <div style={s.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={s.pageTitle}>Custom Pricing Quotes</h1>
            <p style={s.pageSubtitle}>Build tailored pricing pages and send a unique link to a patient or lead.</p>
          </div>
          <Link href="/admin/quotes/new" style={s.btnPrimary}>+ New Quote</Link>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: 16, borderRadius: 6, fontSize: 14 }}>
          {actionMsg}
        </div>
      )}

      {/* Payment link modal */}
      {paymentLinkModal && (
        <PaymentLinkModal
          state={paymentLinkModal}
          onClose={() => setPaymentLinkModal(null)}
          onCreate={(idx) => createPaymentLink(paymentLinkModal.quote, idx)}
          onCopy={() => {
            navigator.clipboard.writeText(paymentLinkModal.url || '');
            showMsg('Payment link copied');
          }}
          onSendSMS={() => sendPaymentLinkSMS(paymentLinkModal.quote, paymentLinkModal.url)}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={s.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...s.modal, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Delete Quote</h3>
            </div>
            <div style={s.modalBody}>
              <p style={{ fontSize: 15, marginBottom: 8 }}>
                Are you sure you want to delete the quote for <strong>{confirmDelete.recipient_name}</strong>?
              </p>
              <p style={{ fontSize: 14, color: '#888' }}>
                {confirmDelete.title || 'Untitled'} — {fmt(confirmDelete.total_cents)}
              </p>
              <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12 }}>
                This action cannot be undone. The recipient will no longer be able to view the quote link.
              </p>
            </div>
            <div style={{ ...s.modalFooter, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={s.btnSecondary}>Cancel</button>
              <button
                onClick={confirmDeleteQuote}
                style={{ ...s.btnPrimary, background: '#dc2626', borderColor: '#dc2626' }}
              >
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Recipient</th>
              <th style={s.th}>Title</th>
              <th style={s.th}>Total</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Views</th>
              <th style={s.th}>Created</th>
              <th style={{ ...s.th, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td style={s.td} colSpan={7}>Loading…</td></tr>}
            {!loading && quotes.length === 0 && (
              <tr><td style={s.td} colSpan={7}>No quotes yet. Create your first one.</td></tr>
            )}
            {quotes.map((q) => (
              <tr key={q.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600 }}>{q.recipient_name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{q.recipient_phone || q.recipient_email || ''}</div>
                </td>
                <td style={s.td}>{q.title || '—'}</td>
                <td style={s.td}>{fmt(q.total_cents)}</td>
                <td style={s.td}><span style={STATUS_STYLES[q.status] || s.badge}>{q.status}</span></td>
                <td style={s.td}>{q.view_count || 0}</td>
                <td style={s.td}>{fmtDate(q.created_at)}</td>
                <td style={s.td}>
                  <ActionMenu
                    quote={q}
                    onDelete={handleDelete}
                    onSend={handleSend}
                    onDuplicate={handleDuplicate}
                    onPaymentLink={handlePaymentLink}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function PaymentLinkModal({ state, onClose, onCreate, onCopy, onSendSMS }) {
  const { quote, step, url, optionIndex, error, amount_cents, existing } = state;
  const hasOptions = Array.isArray(quote.options) && quote.options.length > 0;
  const options = hasOptions ? quote.options : [];

  const modalStyle = { ...s.modal, maxWidth: 520 };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>
            {step === 'show' ? (existing ? 'Payment Link' : 'Payment Link Created') : 'Create Payment Link'}
          </h3>
        </div>

        <div style={s.modalBody}>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 14 }}>
            For <strong>{quote.recipient_name}</strong>
            {quote.title ? ` — ${quote.title}` : ''}
          </p>

          {step === 'pick' && (
            <>
              <p style={{ fontSize: 14, marginBottom: 10 }}>
                This is a comparison quote. Pick the option the patient accepted:
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {options.map((opt, idx) => {
                  const amt = fmt(opt.total_cents);
                  const discount = Number(opt.discount_cents) || 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => onCreate(idx)}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        border: '1.5px solid #e5e5e5',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0a0a0a')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.name || `Option ${idx + 1}`}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          {(opt.items || []).map((it) => it.name).join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 17 }}>{amt}</div>
                        {discount > 0 && (
                          <div style={{ fontSize: 11, color: '#c0392b', fontWeight: 600 }}>−{fmt(discount)} off</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {error && (
                <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'loading' && (
            <p style={{ fontSize: 14, color: '#888' }}>Creating payment link…</p>
          )}

          {step === 'show' && (
            <>
              {optionIndex !== null && optionIndex !== undefined && options[optionIndex] && (
                <div style={{ padding: 12, background: '#fafafa', border: '1px solid #e5e5e5', marginBottom: 14, fontSize: 14 }}>
                  <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Accepted option</div>
                  <div style={{ fontWeight: 700 }}>{options[optionIndex].name} — {fmt(options[optionIndex].total_cents)}</div>
                </div>
              )}
              {!hasOptions && (
                <div style={{ padding: 12, background: '#fafafa', border: '1px solid #e5e5e5', marginBottom: 14, fontSize: 14 }}>
                  <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Amount</div>
                  <div style={{ fontWeight: 700 }}>{fmt(amount_cents ?? quote.total_cents)}</div>
                </div>
              )}

              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Checkout URL</label>
              <input
                type="text"
                readOnly
                value={url || ''}
                onFocus={(e) => e.target.select()}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginTop: 6,
                  marginBottom: 14,
                  border: '1px solid #e5e5e5',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  background: '#fafafa',
                }}
              />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={onCopy} style={s.btnSecondary}>Copy Link</button>
                {quote.recipient_phone && (
                  <button onClick={onSendSMS} style={s.btnPrimary}>Send via SMS</button>
                )}
                <a href={url} target="_blank" rel="noreferrer" style={{ ...s.btnSecondary, textDecoration: 'none', display: 'inline-block' }}>Open</a>
              </div>

              <p style={{ fontSize: 12, color: '#888', marginTop: 14, lineHeight: 1.6 }}>
                This is a single-use Stripe Checkout link. It stays valid for 24 hours; regenerate from this menu if it expires.
              </p>
            </>
          )}
        </div>

        <div style={{ ...s.modalFooter, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={s.btnSecondary}>Close</button>
        </div>
      </div>
    </div>
  );
}
