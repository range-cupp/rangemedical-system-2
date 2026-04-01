// /pages/admin/google-reviews.js
// Google Review request sender — send personalized review link one-by-one
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CR-a12vKevOkEAI/review';

const DEFAULT_MESSAGE = `Hey {first_name}, it's Chris from Range Medical. If you have a sec, would you mind leaving us a quick Google review? It really helps us out and I'd appreciate it.\n\n{review_link}`;

export default function GoogleReviewsPage() {
  const [patients, setPatients] = useState([]);
  const [sentMap, setSentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('not_sent'); // 'all' | 'not_sent' | 'sent'
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  const [sendingId, setSendingId] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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

  const buildMessage = (patient) => {
    const firstName = patient.first_name || 'there';
    let msg = messageTemplate.replace(/{first_name}/g, firstName);
    msg = msg.replace(/{review_link}/g, GOOGLE_REVIEW_URL);
    return msg;
  };

  const openPreview = (patient) => {
    setPreviewPatient(patient);
    setEditedMessage(buildMessage(patient));
    setErrorMsg('');
  };

  const sendReview = async () => {
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
          provider: 'blooio',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSentMap(prev => ({ ...prev, [previewPatient.id]: new Date().toISOString() }));
        setSuccessMsg(`Sent to ${previewPatient.first_name}!`);
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
    if (filter === 'not_sent' && sentMap[p.id]) return false;
    if (filter === 'sent' && !sentMap[p.id]) return false;
    return true;
  });

  const sentCount = patients.filter(p => sentMap[p.id]).length;
  const notSentCount = patients.length - sentCount;

  return (
    <AdminLayout title="Google Reviews">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{patients.length}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Total Patients</div>
          </div>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{sentCount}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Sent</div>
          </div>
          <div style={{ ...sharedStyles.card, flex: 1, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{notSentCount}</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Remaining</div>
          </div>
        </div>

        {/* Message template card */}
        <div style={{ ...sharedStyles.card, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Message Template</div>
          <textarea
            value={messageTemplate}
            onChange={e => setMessageTemplate(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
            Use <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{first_name}'}</code> and <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>{'{review_link}'}</code> as placeholders.
          </div>

        </div>

        {/* Success toast */}
        {successMsg && (
          <div style={{
            padding: '10px 16px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 500,
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
                flex: 1,
                minWidth: 200,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'not_sent', label: 'Not Sent' },
                { key: 'all', label: 'All' },
                { key: 'sent', label: 'Sent' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
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
              {filter === 'sent' ? 'No review requests sent yet.' : 'All patients have been sent a review request!'}
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
                  const wasSent = sentMap[patient.id];
                  const sentDate = wasSent ? new Date(wasSent).toLocaleDateString() : null;

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
                        {wasSent ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            background: '#dcfce7',
                            color: '#166534',
                          }}>
                            Sent {sentDate}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            background: '#fef3c7',
                            color: '#92400e',
                          }}>
                            Not sent
                          </span>
                        )}
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'right' }}>
                        <button
                          onClick={() => openPreview(patient)}
                          disabled={sendingId === patient.id}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            background: wasSent ? '#f3f4f6' : '#111',
                            color: wasSent ? '#555' : '#fff',
                          }}
                        >
                          {wasSent ? 'Resend' : 'Send'}
                        </button>
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
                  Send to {previewPatient.first_name} {previewPatient.last_name}
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

              <textarea
                value={editedMessage}
                onChange={e => setEditedMessage(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {errorMsg && (
                <div style={{
                  padding: '8px 12px',
                  background: '#fef2f2',
                  color: '#991b1b',
                  borderRadius: 6,
                  marginTop: 12,
                  fontSize: 13,
                }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  onClick={() => setPreviewPatient(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    background: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendReview}
                  disabled={sendingId}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#111',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: sendingId ? 'not-allowed' : 'pointer',
                    opacity: sendingId ? 0.6 : 1,
                  }}
                >
                  {sendingId ? 'Sending...' : 'Send via iMessage'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
