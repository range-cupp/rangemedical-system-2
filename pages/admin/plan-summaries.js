import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';

const BookingTab = dynamic(() => import('../../components/BookingTab'), { ssr: false });

const TYPE_COLORS = {
  prescription: { color: '#2563eb', bg: '#eff6ff' },
  supplement:   { color: '#059669', bg: '#ecfdf5' },
  therapy:      { color: '#7c3aed', bg: '#f5f3ff' },
  lab:          { color: '#d97706', bg: '#fffbeb' },
  referral:     { color: '#dc2626', bg: '#fef2f2' },
};

function providerLabel(createdBy) {
  if (!createdBy) return 'Provider';
  const lower = createdBy.toLowerCase();
  if (lower.includes('burgess')) return 'Dr. Damien Burgess';
  if (lower.includes('brendyn') || lower.includes('reed')) return 'Brendyn Reed, PA-C';
  return createdBy;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

function matchSupplementPrice(itemName, catalog) {
  if (!itemName || !catalog.length) return null;
  const norm = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const product of catalog) {
    const prodNorm = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm === prodNorm) return product;
  }

  for (const product of catalog) {
    const prodNorm = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm.includes(prodNorm) || prodNorm.includes(norm)) return product;
  }

  const keywords = itemName.toLowerCase().split(/[\s,+&\/]+/).filter(w => w.length > 2);
  for (const product of catalog) {
    const prodLower = product.name.toLowerCase();
    const matchCount = keywords.filter(k => prodLower.includes(k)).length;
    if (matchCount >= 2 || (keywords.length === 1 && matchCount === 1 && keywords[0].length > 3)) {
      return product;
    }
  }

  return null;
}

const SENDER_OPTIONS = [
  { key: 'burgess', label: 'Damien Burgess, FNP' },
  { key: 'reed', label: 'Brendyn Reed, NP' },
];

function guessSender(createdBy) {
  if (!createdBy) return 'burgess';
  const lower = createdBy.toLowerCase();
  if (lower.includes('brendyn') || lower.includes('reed')) return 'reed';
  return 'burgess';
}

function generatePreviewHtml({ patientFirstName, providerName, noteDate, visitType, assessment, treatmentPlan, followUp, personalMessage }) {
  const dateStr = new Date(noteDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
  const greeting = patientFirstName ? `Hi ${patientFirstName},` : 'Hi there,';
  const messageBlock = personalMessage
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1f2937;">${personalMessage.replace(/\n/g, '<br>')}</p>`
    : `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1f2937;">Thank you for your recent visit. Below is a summary of your visit and the plan we discussed together. Please review and don't hesitate to reach out with any questions.</p>`;

  const typeColors = { prescription: '#2563eb', supplement: '#059669', therapy: '#7c3aed', lab: '#d97706', referral: '#dc2626' };
  const planRows = (treatmentPlan || []).map(p => {
    const color = typeColors[p.type] || '#6b7280';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${p.item}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;background:${color};text-transform:uppercase;">${p.type}</span></td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${p.details || '—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:#111827;padding:20px 24px;">
    <h1 style="margin:0;font-size:18px;color:#fff;">Your Visit Summary</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">${dateStr}</p>
  </div>
  <div style="padding:24px;">
    <div style="margin-bottom:20px;padding:16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;">
      <div style="font-size:15px;color:#111827;font-weight:600;">${providerName}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">${visitType || 'Consultation'}</div>
    </div>
    <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#1f2937;font-weight:600;">${greeting}</p>
    ${messageBlock}
    ${treatmentPlan && treatmentPlan.length > 0 ? `<div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your Treatment Plan</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Type</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Details</th>
        </tr></thead>
        <tbody>${planRows}</tbody>
      </table>
    </div>` : ''}
    <div style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Follow-Up</div>
      <p style="margin:0;font-size:14px;color:#1f2937;">${followUp || 'Your provider will reach out regarding next steps.'}</p>
    </div>
  </div>
  <div style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">Range Medical</p>
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">(949) 997-3988 &middot; range-medical.com</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Call or text us anytime.</p>
  </div>
</div></body></html>`;
}

export default function PlanSummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterProvider, setFilterProvider] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [supplementCatalog, setSupplementCatalog] = useState([]);
  const [bookingPatient, setBookingPatient] = useState(null);

  // Email Patient modal state
  const [emailModal, setEmailModal] = useState(null);
  const [emailForm, setEmailForm] = useState({ sender: 'burgess', personalMessage: '', assessment: '', treatmentPlan: [], followUp: '' });
  const [emailView, setEmailView] = useState('edit');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Forward to staff state
  const [forwardTo, setForwardTo] = useState('');
  const [forwardingEmail, setForwardingEmail] = useState(false);
  const [forwardSent, setForwardSent] = useState(null);

  useEffect(() => {
    fetch('/api/notes/plan-summaries')
      .then(r => r.json())
      .then(data => setSummaries(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching plan summaries:', err))
      .finally(() => setLoading(false));

    supabase
      .from('pos_services')
      .select('id, name, price_cents')
      .eq('category', 'supplements')
      .eq('active', true)
      .order('name')
      .then(({ data }) => setSupplementCatalog(data || []));
  }, []);

  const filtered = useMemo(() => {
    let list = summaries;
    if (filterProvider !== 'all') {
      list = list.filter(s => {
        const lower = (s.created_by || '').toLowerCase();
        if (filterProvider === 'burgess') return lower.includes('burgess');
        if (filterProvider === 'reed') return lower.includes('brendyn') || lower.includes('reed');
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.patient_name || '').toLowerCase().includes(q) ||
        (s.plan_summary?.visit_type || '').toLowerCase().includes(q) ||
        (s.plan_summary?.assessment || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [summaries, filterProvider, searchQuery]);

  const handleRegenerate = async (noteId) => {
    setRegeneratingId(noteId);
    try {
      const res = await fetch('/api/notes/plan-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummaries(prev => prev.map(s =>
          s.id === noteId ? { ...s, plan_summary: data.summary } : s
        ));
      }
    } catch (err) {
      console.error('Error regenerating summary:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const hasLabItems = (summary) =>
    (summary.treatment_plan || []).some(p => p.type === 'lab');

  const openEmailModal = (note) => {
    const summary = note.plan_summary || {};
    const firstName = (note.patient_name || '').split(' ')[0] || '';
    setEmailModal({
      noteId: note.id,
      patientName: note.patient_name || 'Unknown',
      patientFirstName: firstName,
      patientEmail: note.patient_email || null,
      noteDate: note.note_date,
      visitType: summary.visit_type || 'Consultation',
      createdBy: note.created_by,
    });
    setEmailForm({
      sender: guessSender(note.created_by),
      personalMessage: '',
      assessment: summary.assessment || '',
      treatmentPlan: (summary.treatment_plan || []).map(p => ({ ...p })),
      followUp: summary.follow_up || '',
    });
    setEmailView('edit');
    setEmailSent(false);
    setForwardTo('');
    setForwardSent(null);
  };

  const handleSendPatientEmail = async () => {
    if (!emailModal) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/notes/send-patient-plan-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: emailModal.noteId,
          sender: emailForm.sender,
          personal_message: emailForm.personalMessage || null,
          assessment: emailForm.assessment,
          treatment_plan: emailForm.treatmentPlan,
          follow_up: emailForm.followUp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        setSummaries(prev => prev.map(s =>
          s.id === emailModal.noteId
            ? { ...s, plan_summary: { ...s.plan_summary, patient_email_sent_at: new Date().toISOString(), patient_email_sent_by: SENDER_OPTIONS.find(o => o.key === emailForm.sender)?.label } }
            : s
        ));
      } else {
        alert(data.error || 'Failed to send email');
      }
    } catch (err) {
      alert('Error sending email: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const removeItem = (idx) => {
    setEmailForm(prev => ({
      ...prev,
      treatmentPlan: prev.treatmentPlan.filter((_, i) => i !== idx),
    }));
  };

  const handleForwardToStaff = async () => {
    if (!emailModal || !forwardTo) return;
    setForwardingEmail(true);
    try {
      const res = await fetch('/api/notes/forward-plan-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: emailModal.noteId, recipient_email: forwardTo }),
      });
      const data = await res.json();
      if (data.success) {
        setForwardSent(forwardTo);
        setForwardTo('');
      } else {
        alert(data.error || 'Failed to forward');
      }
    } catch (err) {
      alert('Error forwarding: ' + err.message);
    } finally {
      setForwardingEmail(false);
    }
  };

  const previewHtml = emailModal ? generatePreviewHtml({
    patientFirstName: emailModal.patientFirstName,
    providerName: SENDER_OPTIONS.find(o => o.key === emailForm.sender)?.label || '',
    noteDate: emailModal.noteDate,
    visitType: emailModal.visitType,
    assessment: emailForm.assessment,
    treatmentPlan: emailForm.treatmentPlan,
    followUp: emailForm.followUp,
    personalMessage: emailForm.personalMessage,
  }) : '';

  return (
    <AdminLayout title="Plan Summaries">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Plan Summaries</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              AI-generated summaries of provider consultation notes
            </p>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '6px 12px', borderRadius: 6 }}>
            {filtered.length} {filtered.length === 1 ? 'summary' : 'summaries'}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search patients, visit types..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px', fontSize: 14,
              border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
            }}
          />
          <select
            value={filterProvider}
            onChange={e => setFilterProvider(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db',
              borderRadius: 6, background: '#fff', cursor: 'pointer',
            }}
          >
            <option value="all">All Providers</option>
            <option value="burgess">Dr. Burgess</option>
            <option value="reed">Brendyn Reed</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading plan summaries...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            {summaries.length === 0 ? 'No plan summaries yet.' : 'No summaries match your filters.'}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {filtered.map((s, idx) => {
              const summary = s.plan_summary || {};
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  {/* Accordion header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: isExpanded ? '#f9fafb' : '#fff',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Link href={`/patients/${s.patient_id}`} onClick={e => e.stopPropagation()}
                          style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                          {s.patient_name || 'Unknown'}
                        </Link>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>—</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                          {summary.visit_type || 'Consultation'}
                        </span>
                        {s.status === 'signed' && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            color: '#059669', background: '#ecfdf5',
                          }}>Signed</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {providerLabel(s.created_by)} &middot; {fmtDate(s.note_date)}
                      </div>
                    </div>
                    <span style={{ fontSize: 18, color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      ▾
                    </span>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* Assessment */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Assessment</div>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#1f2937' }}>{summary.assessment || 'No assessment provided.'}</p>
                      </div>

                      {/* Treatment Plan */}
                      {summary.treatment_plan && summary.treatment_plan.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Treatment Plan</div>
                          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                            {summary.treatment_plan.map((p, i) => {
                              const tc = TYPE_COLORS[p.type] || { color: '#6b7280', bg: '#f3f4f6' };
                              const priceMatch = p.type === 'supplement' ? matchSupplementPrice(p.item, supplementCatalog) : null;
                              return (
                                <div key={i} style={{
                                  padding: '10px 12px', borderBottom: i < summary.treatment_plan.length - 1 ? '1px solid #f3f4f6' : 'none',
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                                }}>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                    color: tc.color, background: tc.bg, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                  }}>{p.type}</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.item}</span>
                                  {p.details && <span style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>— {p.details}</span>}
                                  {p.type === 'supplement' && (
                                    <span style={{
                                      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 'auto',
                                      padding: '2px 8px', borderRadius: 4,
                                      color: priceMatch ? '#059669' : '#9ca3af',
                                      background: priceMatch ? '#ecfdf5' : '#f3f4f6',
                                    }}>
                                      {priceMatch ? `$${(priceMatch.price_cents / 100).toFixed(0)}` : '?'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {summary.action_items && summary.action_items.length > 0 && (
                        <div style={{
                          marginBottom: 16, padding: '12px 16px',
                          background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 4,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Action Items</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {summary.action_items.map((a, i) => (
                              <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: '#1f2937', marginBottom: 4 }}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        {hasLabItems(summary) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingPatient({
                                id: s.patient_id,
                                name: s.patient_name || 'Unknown',
                              });
                            }}
                            style={{
                              fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fffbeb',
                              border: '1px solid #fde68a', padding: '6px 14px', borderRadius: 6,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <span>🔬</span> Schedule Labs
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openEmailModal(s); }}
                          style={{
                            fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff',
                            border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: 6,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>✉</span>
                          {summary.patient_email_sent_at ? 'Resend to Patient' : 'Email Patient'}
                        </button>
                        {summary.patient_email_sent_at && (
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                            Sent {fmtDate(summary.patient_email_sent_at)}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegenerate(s.id); }}
                          disabled={regeneratingId === s.id}
                          style={{
                            fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
                            padding: '4px 12px', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto',
                          }}
                        >
                          {regeneratingId === s.id ? 'Regenerating...' : 'Regenerate Summary'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking modal for scheduling labs */}
      {bookingPatient && (
        <div onClick={() => setBookingPatient(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '24px',
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', maxWidth: '1200px',
              maxHeight: '92vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid #e5e5e5',
              position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>🔬 Schedule Follow-Up Labs</h3>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                  for <strong>{bookingPatient.name}</strong>
                </div>
              </div>
              <button onClick={() => setBookingPatient(null)}
                style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer', color: '#666', lineHeight: 1 }}>
                ×
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <BookingTab preselectedPatient={{
                id: bookingPatient.id,
                name: bookingPatient.name,
              }} />
            </div>
          </div>
        </div>
      )}
      {/* Email Patient modal */}
      {emailModal && (
        <div onClick={() => setEmailModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 24,
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', maxWidth: 920,
              maxHeight: '92vh', overflow: 'auto', borderRadius: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid #e5e5e5',
              position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Email Visit Summary to Patient</h3>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                  <strong>{emailModal.patientName}</strong>
                  {emailModal.patientEmail
                    ? <span> &middot; {emailModal.patientEmail}</span>
                    : <span style={{ color: '#dc2626' }}> &middot; No email on file</span>
                  }
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setEmailView('edit')}
                    style={{
                      padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: emailView === 'edit' ? '#111' : '#fff',
                      color: emailView === 'edit' ? '#fff' : '#374151',
                    }}
                  >Edit</button>
                  <button
                    onClick={() => setEmailView('preview')}
                    style={{
                      padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                      borderLeft: '1px solid #d1d5db',
                      background: emailView === 'preview' ? '#111' : '#fff',
                      color: emailView === 'preview' ? '#fff' : '#374151',
                    }}
                  >Preview</button>
                </div>
                <button onClick={() => setEmailModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: '#666', lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px' }}>
              {emailSent ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#059669' }}>Email Sent</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                    Visit summary sent to <strong>{emailModal.patientEmail}</strong>
                  </p>
                  <button
                    onClick={() => setEmailModal(null)}
                    style={{
                      marginTop: 20, padding: '8px 24px', fontSize: 14, fontWeight: 600,
                      background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
                    }}
                  >Done</button>
                </div>
              ) : emailView === 'edit' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Sender */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Send From</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {SENDER_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setEmailForm(prev => ({ ...prev, sender: opt.key }))}
                          style={{
                            padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                            border: emailForm.sender === opt.key ? '2px solid #2563eb' : '1px solid #d1d5db',
                            background: emailForm.sender === opt.key ? '#eff6ff' : '#fff',
                            color: emailForm.sender === opt.key ? '#2563eb' : '#374151',
                          }}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Personal message */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Message <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                    <textarea
                      value={emailForm.personalMessage}
                      onChange={e => setEmailForm(prev => ({ ...prev, personalMessage: e.target.value }))}
                      placeholder="Add a personal note to the patient... Leave blank for default greeting."
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #d1d5db',
                        borderRadius: 6, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Treatment items */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Treatment Plan Items</label>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                      {emailForm.treatmentPlan.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No items</div>
                      ) : emailForm.treatmentPlan.map((p, i) => {
                        const tc = TYPE_COLORS[p.type] || { color: '#6b7280', bg: '#f3f4f6' };
                        return (
                          <div key={i} style={{
                            padding: '10px 12px', borderBottom: i < emailForm.treatmentPlan.length - 1 ? '1px solid #f3f4f6' : 'none',
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: i % 2 === 0 ? '#fff' : '#fafafa',
                          }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              color: tc.color, background: tc.bg, textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{p.type}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.item}</span>
                            {p.details && <span style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>— {p.details}</span>}
                            <button
                              onClick={() => removeItem(i)}
                              style={{
                                background: 'none', border: 'none', fontSize: 16, color: '#dc2626',
                                cursor: 'pointer', padding: '0 4px', lineHeight: 1, marginLeft: 'auto',
                              }}
                              title="Remove item"
                            >×</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Follow-up */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow-Up</label>
                    <textarea
                      value={emailForm.followUp}
                      onChange={e => setEmailForm(prev => ({ ...prev, followUp: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #d1d5db',
                        borderRadius: 6, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Preview */
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <iframe
                    srcDoc={previewHtml}
                    style={{ width: '100%', height: 600, border: 'none' }}
                    title="Email preview"
                  />
                </div>
              )}
            </div>

            {/* Forward to Staff */}
            {!emailSent && (
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#fafafa',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Forward to Staff</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={forwardTo}
                    onChange={e => { setForwardTo(e.target.value); setForwardSent(null); }}
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db',
                      borderRadius: 6, background: '#fff', cursor: 'pointer',
                    }}
                  >
                    <option value="">Select staff member...</option>
                    <option value="cupp@range-medical.com">Chris Cupp</option>
                    <option value="burgess@range-medical.com">Damien Burgess FNP</option>
                    <option value="brendyn@range-medical.com">Brendyn Reed NP</option>
                    <option value="lily@range-medical.com">Lily Diaz RN</option>
                    <option value="evan@range-medical.com">Evan Riederich</option>
                    <option value="damon@range-medical.com">Damon Durante</option>
                    <option value="tara@range-medical.com">Tara Ventimiglia</option>
                  </select>
                  <button
                    onClick={handleForwardToStaff}
                    disabled={!forwardTo || forwardingEmail}
                    style={{
                      padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      color: '#fff', background: !forwardTo ? '#9ca3af' : forwardingEmail ? '#6b7280' : '#374151',
                      border: 'none', borderRadius: 6,
                      cursor: !forwardTo ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >{forwardingEmail ? 'Sending...' : 'Forward'}</button>
                </div>
                {forwardSent && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    Sent to {forwardSent}
                  </div>
                )}
              </div>
            )}

            {/* Modal footer */}
            {!emailSent && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderTop: '1px solid #e5e5e5',
                position: 'sticky', bottom: 0, background: '#fff',
              }}>
                <button
                  onClick={() => setEmailModal(null)}
                  style={{
                    padding: '8px 20px', fontSize: 14, color: '#374151', background: '#fff',
                    border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer',
                  }}
                >Cancel</button>
                <button
                  onClick={handleSendPatientEmail}
                  disabled={sendingEmail || !emailModal.patientEmail}
                  style={{
                    padding: '8px 24px', fontSize: 14, fontWeight: 600,
                    color: '#fff', background: !emailModal.patientEmail ? '#9ca3af' : sendingEmail ? '#6b7280' : '#2563eb',
                    border: 'none', borderRadius: 6, cursor: !emailModal.patientEmail ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendingEmail ? 'Sending...' : !emailModal.patientEmail ? 'No Email on File' : `Send from ${SENDER_OPTIONS.find(o => o.key === emailForm.sender)?.label}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
