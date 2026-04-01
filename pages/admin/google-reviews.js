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
  const [sentMap, setSentMap] = useState({}); // patient_id -> { reviewSent, giftSent }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('not_sent'); // 'all' | 'not_sent' | 'review_sent' | 'gift_sent'
  const [reviewTemplate, setReviewTemplate] = useState(REVIEW_MESSAGE);
  const [giftTemplate, setGiftTemplate] = useState(GIFT_MESSAGE);
  const [sendingId, setSendingId] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [previewMode, setPreviewMode] = useState('review'); // 'review' | 'gift'
  const [editedMessage, setEditedMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [templateTab, setTemplateTab] = useState('review'); // which template to show
  const searchRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

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
    // {gift_link} stays as-is — replaced server-side
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
          message_type: previewMode, // 'review' or 'gift'
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

  // Filter + search
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

  return (
    <AdminLayout title="Google Reviews">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{notSentCount}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Not Sent</div>
          </div>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{reviewSentCount}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Awaiting Review</div>
          </div>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{giftSentCount}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Gift Sent</div>
          </div>
        </div>

        {/* Message templates card */}
        <div style={{ ...sharedStyles.card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[
              { key: 'review', label: 'Step 1: Review Request' },
              { key: 'gift', label: 'Step 2: Gift Message' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTemplateTab(t.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: templateTab === t.key ? '#111' : '#f3f4f6',
                  color: templateTab === t.key ? '#fff' : '#555',
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
                  width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                Use <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{first_name}'}</code> and <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{review_link}'}</code> as placeholders.
              </div>
            </>
          ) : (
            <>
              <textarea
                value={giftTemplate}
                onChange={e => setGiftTemplate(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                Use <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{first_name}'}</code> and <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{gift_link}'}</code> as placeholders. Gift link is generated automatically.
              </div>
            </>
          )}
        </div>

        {/* Success toast */}
        {successMsg && (
          <div style={{
            padding: '10px 16px', background: '#dcfce7', color: '#166534',
            borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500,
          }}>
            {successMsg}
          </div>
        )}

        {/* Search + filter */}
        <div style={{ ...sharedStyles.card, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              style={{
                flex: 1, minWidth: 200, padding: 10, borderRadius: 8,
                border: '1px solid #ddd', fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'not_sent', label: 'Not Sent' },
                { key: 'review_sent', label: 'Awaiting Review' },
                { key: 'gift_sent', label: 'Gift Sent' },
                { key: 'all', label: 'All' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '8px 14px', borderRadius: 6, border: 'none',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: filter === f.key ? '#111' : '#f3f4f6',
                    color: filter === f.key ? '#fff' : '#555',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patient list */}
        <div style={sharedStyles.card}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              No patients match this filter.
            </div>
          ) : (
            <table style={{ ...sharedStyles.table, marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={sharedStyles.th}>Patient</th>
                  <th style={sharedStyles.th}>Phone</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...sharedStyles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(patient => {
                  const status = sentMap[patient.id];
                  const giftSent = status?.giftSent;
                  const reviewSent = status?.reviewSent;

                  let badge;
                  if (giftSent) {
                    badge = { label: `Gift sent ${new Date(giftSent).toLocaleDateString()}`, bg: '#dcfce7', color: '#166534' };
                  } else if (reviewSent) {
                    badge = { label: `Review sent ${new Date(reviewSent).toLocaleDateString()}`, bg: '#dbeafe', color: '#1e40af' };
                  } else {
                    badge = { label: 'Not sent', bg: '#fef3c7', color: '#92400e' };
                  }

                  return (
                    <tr key={patient.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={sharedStyles.td}>
                        <div style={{ fontWeight: 500 }}>
                          {patient.first_name} {patient.last_name}
                        </div>
                      </td>
                      <td style={{ ...sharedStyles.td, color: '#666', fontSize: 13 }}>
                        {patient.phone}
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 500, background: badge.bg, color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {!reviewSent && (
                            <button
                              onClick={() => openPreview(patient, 'review')}
                              disabled={sendingId === patient.id}
                              style={{
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
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
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
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
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                background: '#f3f4f6', color: '#555',
                              }}
                            >
                              Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview / confirm modal */}
        {previewPatient && (
          <div style={sharedStyles.modalOverlay} onClick={e => {
            if (e.target === e.currentTarget) setPreviewPatient(null);
          }}>
            <div style={{ ...sharedStyles.modal, maxWidth: 520 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  {previewMode === 'gift' ? 'Send Gift to' : 'Review Request for'} {previewPatient.first_name} {previewPatient.last_name}
                </h3>
                <button
                  onClick={() => setPreviewPatient(null)}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}
                >
                  ×
                </button>
              </div>

              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                To: {previewPatient.phone}
              </div>

              {previewMode === 'gift' && (
                <div style={{
                  padding: '8px 12px', background: '#f0fdf4', borderRadius: 6,
                  marginBottom: 12, fontSize: 13, color: '#166534',
                }}>
                  This will create a gift link and send it to the patient. Make sure you have verified their Google review first.
                </div>
              )}

              <textarea
                value={editedMessage}
                onChange={e => setEditedMessage(e.target.value)}
                rows={previewMode === 'gift' ? 5 : 7}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />

              {errorMsg && (
                <div style={{
                  padding: '8px 12px', background: '#fef2f2', color: '#991b1b',
                  borderRadius: 6, marginTop: 12, fontSize: 13,
                }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  onClick={() => setPreviewPatient(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd',
                    background: '#fff', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sendingId}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    background: previewMode === 'gift' ? '#22c55e' : '#111',
                    color: '#fff', fontSize: 13, fontWeight: 500,
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
