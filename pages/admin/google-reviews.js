// /pages/admin/google-reviews.js
// Google Review request sender — two-step: ask for review, then send gift after verified
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CR-a12vKevOkEAI/review';

const REVIEW_MESSAGE = `Hey {first_name}, it's Chris from Range Medical. If you have a sec, would you mind leaving us an honest Google review? It really helps us out and I'd appreciate it. Leave us a review and I'll send you a free injection as a thank you.\n\n{review_link}`;

const GIFT_MESSAGE = `Hey {first_name}, thanks for leaving us a review! As promised, here's your free injection. Pick the one you want and book a time:\n\n{gift_link}`;

export default function GoogleReviewsPage() {
  const [patients, setPatients] = useState([]);
  const [sentMap, setSentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('not_sent');
  const [reviewTemplate, setReviewTemplate] = useState(REVIEW_MESSAGE);
  const [giftTemplate, setGiftTemplate] = useState(GIFT_MESSAGE);
  const [sendingId, setSendingId] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [previewMode, setPreviewMode] = useState('review');
  const [editedMessage, setEditedMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [templateTab, setTemplateTab] = useState('review');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/google-reviews');
      const data = await res.json();
      setPatients(data.patients || []);
      setSentMap(data.sentMap || {});
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildMessage = (patient, mode) => {
    const firstName = patient.first_name || 'there';
    const template = mode === 'gift' ? giftTemplate : reviewTemplate;
    let msg = template.replace(/{first_name}/g, firstName);
    msg = msg.replace(/{review_link}/g, GOOGLE_REVIEW_URL);
    return msg;
  };

  const openPreview = (patient, mode) => {
    setPreviewPatient(patient);
    setPreviewMode(mode);
    setEditedMessage(buildMessage(patient, mode));
    setErrorMsg('');
  };

  const sendMessage = async () => {
    if (!previewPatient) return;
    setSendingId(previewPatient.id);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: previewPatient.id,
          patient_name: `${previewPatient.first_name} ${previewPatient.last_name}`.trim(),
          phone: previewPatient.phone,
          message: editedMessage,
          message_type: previewMode,
          provider: 'blooio',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSentMap(prev => ({
          ...prev,
          [previewPatient.id]: {
            ...(prev[previewPatient.id] || {}),
            ...(previewMode === 'review'
              ? { reviewSent: new Date().toISOString() }
              : { giftSent: new Date().toISOString() }),
          },
        }));
        setSuccessMsg(previewMode === 'gift'
          ? `Gift sent to ${previewPatient.first_name}!`
          : `Review request sent to ${previewPatient.first_name}!`
        );
        setPreviewPatient(null);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to send');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const filtered = patients.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    const status = sentMap[p.id];
    if (filter === 'not_sent' && status) return false;
    if (filter === 'review_sent' && (!status || !status.reviewSent || status.giftSent)) return false;
    if (filter === 'gift_sent' && (!status || !status.giftSent)) return false;
    return true;
  });

  const notSentCount = patients.filter(p => !sentMap[p.id]).length;
  const reviewSentCount = patients.filter(p => sentMap[p.id]?.reviewSent && !sentMap[p.id]?.giftSent).length;
  const giftSentCount = patients.filter(p => sentMap[p.id]?.giftSent).length;

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <AdminLayout title="Google Reviews">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setFilter('not_sent')} style={{
            ...sharedStyles.card, padding: '18px 16px', textAlign: 'center', border: 'none', cursor: 'pointer',
            outline: filter === 'not_sent' ? '2px solid #111' : 'none',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{notSentCount}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Not Sent</div>
          </button>
          <button onClick={() => setFilter('review_sent')} style={{
            ...sharedStyles.card, padding: '18px 16px', textAlign: 'center', border: 'none', cursor: 'pointer',
            outline: filter === 'review_sent' ? '2px solid #111' : 'none',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{reviewSentCount}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Awaiting Review</div>
          </button>
          <button onClick={() => setFilter('gift_sent')} style={{
            ...sharedStyles.card, padding: '18px 16px', textAlign: 'center', border: 'none', cursor: 'pointer',
            outline: filter === 'gift_sent' ? '2px solid #111' : 'none',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{giftSentCount}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Gift Sent</div>
          </button>
        </div>

        {/* Templates — collapsible */}
        <details style={{ ...sharedStyles.card, marginBottom: 20 }}>
          <summary style={{ padding: '14px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#333', userSelect: 'none' }}>
            Edit Message Templates
          </summary>
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[
                { key: 'review', label: 'Review Request' },
                { key: 'gift', label: 'Gift Message' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTemplateTab(t.key)}
                  style={{
                    padding: '5px 12px', borderRadius: 4, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: templateTab === t.key ? '#111' : '#f3f4f6',
                    color: templateTab === t.key ? '#fff' : '#666',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {templateTab === 'review' ? (
              <>
                <textarea
                  value={reviewTemplate}
                  onChange={e => setReviewTemplate(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', padding: 12, borderRadius: 6, border: '1px solid #e5e5e5',
                    fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  Placeholders: {'{first_name}'}, {'{review_link}'}
                </div>
              </>
            ) : (
              <>
                <textarea
                  value={giftTemplate}
                  onChange={e => setGiftTemplate(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: 12, borderRadius: 6, border: '1px solid #e5e5e5',
                    fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  Placeholders: {'{first_name}'}, {'{gift_link}'} (auto-generated per patient)
                </div>
              </>
            )}
          </div>
        </details>

        {/* Success toast */}
        {successMsg && (
          <div style={{
            padding: '10px 16px', background: '#dcfce7', color: '#166534',
            borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500,
          }}>
            {successMsg}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 6,
              border: '1px solid #e5e5e5', fontSize: 14, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { key: 'not_sent', label: 'Not Sent', count: notSentCount },
            { key: 'review_sent', label: 'Awaiting Review', count: reviewSentCount },
            { key: 'gift_sent', label: 'Gift Sent', count: giftSentCount },
            { key: 'all', label: 'All', count: patients.length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 12px', borderRadius: 4, border: '1px solid',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                borderColor: filter === f.key ? '#111' : '#e5e5e5',
                background: filter === f.key ? '#111' : '#fff',
                color: filter === f.key ? '#fff' : '#666',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Patient list */}
        <div style={sharedStyles.card}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 14 }}>
              No patients match this filter.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(patient => {
                  const status = sentMap[patient.id];
                  const giftSent = status?.giftSent;
                  const reviewSent = status?.reviewSent;

                  let badge;
                  if (giftSent) {
                    badge = { label: 'Gift sent', bg: '#dcfce7', color: '#166534' };
                  } else if (reviewSent) {
                    badge = { label: 'Awaiting review', bg: '#dbeafe', color: '#1e40af' };
                  } else {
                    badge = { label: 'Not sent', bg: '#f5f5f4', color: '#78716c' };
                  }

                  return (
                    <tr key={patient.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                          {patient.first_name} {patient.last_name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>
                        {formatPhone(patient.phone)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                          fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color,
                          textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {!reviewSent && (
                          <button
                            onClick={() => openPreview(patient, 'review')}
                            disabled={sendingId === patient.id}
                            style={{
                              padding: '6px 14px', borderRadius: 4, border: '1px solid #111',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              background: '#111', color: '#fff',
                            }}
                          >
                            Ask for Review
                          </button>
                        )}
                        {reviewSent && !giftSent && (
                          <button
                            onClick={() => openPreview(patient, 'gift')}
                            disabled={sendingId === patient.id}
                            style={{
                              padding: '6px 14px', borderRadius: 4, border: '1px solid #22c55e',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              background: '#22c55e', color: '#fff',
                            }}
                          >
                            Send Gift
                          </button>
                        )}
                        {giftSent && (
                          <button
                            onClick={() => openPreview(patient, 'review')}
                            style={{
                              padding: '6px 14px', borderRadius: 4, border: '1px solid #e5e5e5',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              background: '#fff', color: '#888',
                            }}
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {previewPatient && (
          <div style={sharedStyles.modalOverlay} onClick={e => {
            if (e.target === e.currentTarget) setPreviewPatient(null);
          }}>
            <div style={{ ...sharedStyles.modal, maxWidth: 480 }}>
              <div style={sharedStyles.modalHeader}>
                <h3 style={sharedStyles.modalTitle}>
                  {previewMode === 'gift' ? 'Send Gift' : 'Ask for Review'}
                </h3>
                <button onClick={() => setPreviewPatient(null)} style={sharedStyles.modalClose}>×</button>
              </div>

              <div style={sharedStyles.modalBody}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
                    {previewPatient.first_name} {previewPatient.last_name}
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                    {formatPhone(previewPatient.phone)}
                  </div>
                </div>

                {previewMode === 'gift' && (
                  <div style={{
                    padding: '10px 14px', background: '#f0fdf4', borderRadius: 4,
                    marginBottom: 14, fontSize: 12, color: '#166534', lineHeight: 1.5,
                    border: '1px solid #bbf7d0',
                  }}>
                    Make sure you have verified their Google review before sending the gift.
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Message Preview
                </div>
                <textarea
                  value={editedMessage}
                  onChange={e => setEditedMessage(e.target.value)}
                  rows={previewMode === 'gift' ? 6 : 8}
                  style={{
                    width: '100%', padding: 12, borderRadius: 6, border: '1px solid #e5e5e5',
                    fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                    background: '#fafafa',
                  }}
                />

                {errorMsg && (
                  <div style={{
                    padding: '10px 14px', background: '#fef2f2', color: '#991b1b',
                    borderRadius: 4, marginTop: 12, fontSize: 12, border: '1px solid #fecaca',
                  }}>
                    {errorMsg}
                  </div>
                )}
              </div>

              <div style={sharedStyles.modalFooter}>
                <button
                  onClick={() => setPreviewPatient(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 4, border: '1px solid #e5e5e5',
                    background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#666',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sendingId}
                  style={{
                    padding: '8px 20px', borderRadius: 4, border: 'none',
                    background: previewMode === 'gift' ? '#22c55e' : '#111',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: sendingId ? 'not-allowed' : 'pointer',
                    opacity: sendingId ? 0.6 : 1,
                  }}
                >
                  {sendingId ? 'Sending...' : previewMode === 'gift' ? 'Send Gift' : 'Send Review Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
