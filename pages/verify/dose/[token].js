// /pages/verify/dose/[token].js
// Public approval page for dose changes.
// Dr. Burgess receives an SMS with a link to this page.
// He sees the dose change details and can approve or deny with one tap.
// Mobile-first design — optimized for phone screens.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function DoseApprovalPage() {
  const router = useRouter();
  const { token } = router.query;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showDenyReason, setShowDenyReason] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchRequest();
  }, [token]);

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/dose-change-requests/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request not found');
        return;
      }
      setRequest(data);
    } catch (err) {
      setError('Unable to load request');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    if (action === 'deny' && !showDenyReason) {
      setShowDenyReason(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/dose-change-requests/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          denial_reason: action === 'deny' ? denyReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setResult({ action, data });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isExpired = request?.status === 'expired' ||
    (request?.expires_at && new Date(request.expires_at) < new Date());

  const alreadyProcessed = request && ['approved', 'denied', 'applied'].includes(request.status);

  return (
    <>
      <Head>
        <title>Dose Change Approval | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>RANGE MEDICAL</div>
            <div style={styles.subtitle}>Dose Change Approval</div>
          </div>

          {loading && (
            <div style={styles.center}>
              <div style={styles.spinner} />
              <p style={{ color: '#6b7280', marginTop: 12 }}>Loading...</p>
            </div>
          )}

          {error && !request && (
            <div style={styles.errorBox}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>&#10060;</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Request Not Found</p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>{error}</p>
            </div>
          )}

          {request && !result && (
            <>
              {/* Patient & Dose Info */}
              <div style={styles.infoSection}>
                <div style={styles.patientName}>{request.patient_name}</div>
                {request.medication && (
                  <div style={styles.medication}>
                    {request.medication}
                    {request.is_secondary_med && (
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>
                        (HRT secondary medication)
                      </span>
                    )}
                  </div>
                )}
                <div style={styles.requestedBy}>
                  Requested by {request.requested_by_name} &middot; {formatDate(request.requested_at)}
                </div>
              </div>

              {/* Dose Change Visual */}
              <div style={styles.doseBox}>
                <div style={styles.doseRow}>
                  <div style={styles.doseLabel}>Current Dose</div>
                  <div style={styles.doseValue}>{request.current_dose}</div>
                  {request.current_injections_per_week && (
                    <div style={styles.doseFreq}>{request.current_injections_per_week}x per week</div>
                  )}
                </div>

                <div style={styles.arrow}>
                  {request.change_type === 'increase' ? (
                    <span style={{ color: '#dc2626', fontSize: 32 }}>&#8593;</span>
                  ) : (
                    <span style={{ color: '#2563eb', fontSize: 32 }}>&#8595;</span>
                  )}
                </div>

                <div style={styles.doseRow}>
                  <div style={styles.doseLabel}>Proposed Dose</div>
                  <div style={{
                    ...styles.doseValue,
                    color: request.change_type === 'increase' ? '#dc2626' : '#2563eb',
                    fontWeight: 700,
                  }}>
                    {request.proposed_dose}
                  </div>
                  {request.proposed_injections_per_week &&
                    request.proposed_injections_per_week !== request.current_injections_per_week && (
                    <div style={styles.doseFreq}>{request.proposed_injections_per_week}x per week</div>
                  )}
                </div>
              </div>

              {request.reason && (
                <div style={styles.reasonBox}>
                  <span style={{ fontWeight: 600 }}>Reason: </span>{request.reason}
                </div>
              )}

              {/* Status Messages */}
              {isExpired && (
                <div style={styles.expiredBox}>
                  This request has expired. A new dose change request must be submitted.
                </div>
              )}

              {alreadyProcessed && (
                <div style={{
                  ...styles.expiredBox,
                  background: request.status === 'denied' ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${request.status === 'denied' ? '#fecaca' : '#bbf7d0'}`,
                  color: request.status === 'denied' ? '#991b1b' : '#166534',
                }}>
                  {request.status === 'denied'
                    ? `Denied on ${formatDate(request.denied_at)}${request.denial_reason ? ` — ${request.denial_reason}` : ''}`
                    : `Approved on ${formatDate(request.approved_at)}`
                  }
                </div>
              )}

              {/* Action Buttons */}
              {!isExpired && !alreadyProcessed && (
                <div style={styles.actions}>
                  {showDenyReason ? (
                    <div style={{ width: '100%' }}>
                      <textarea
                        value={denyReason}
                        onChange={e => setDenyReason(e.target.value)}
                        placeholder="Reason for denial (optional)..."
                        style={styles.textarea}
                        rows={3}
                      />
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button
                          onClick={() => { setShowDenyReason(false); setDenyReason(''); }}
                          style={styles.cancelBtn}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAction('deny')}
                          style={styles.denyBtn}
                          disabled={submitting}
                        >
                          {submitting ? 'Denying...' : 'Confirm Deny'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction('approve')}
                        style={styles.approveBtn}
                        disabled={submitting}
                      >
                        {submitting ? 'Approving...' : 'Approve Dose Change'}
                      </button>
                      <button
                        onClick={() => handleAction('deny')}
                        style={styles.denyBtnOutline}
                        disabled={submitting}
                      >
                        Deny
                      </button>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div style={{ ...styles.errorBox, marginTop: 12 }}>
                  <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>
                </div>
              )}
            </>
          )}

          {/* Result Screen */}
          {result && (
            <div style={styles.resultBox}>
              {result.action === 'approve' ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>&#9989;</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                    Dose Change Approved
                  </div>
                  <p style={{ color: '#374151', lineHeight: 1.5 }}>
                    <strong>{request.patient_name}</strong>&rsquo;s dose has been updated from{' '}
                    <strong>{request.current_dose}</strong> to{' '}
                    <strong>{request.proposed_dose}</strong>.
                  </p>
                  <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 14, fontWeight: 600 }}>
                    Please document this dose change in an encounter note.
                  </div>
                  <p style={{ color: '#6b7280', fontSize: 13, marginTop: 12 }}>
                    This approval has been recorded with your timestamp and device information for compliance tracking.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>&#10060;</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                    Dose Change Denied
                  </div>
                  <p style={{ color: '#374151' }}>
                    The dose change for <strong>{request.patient_name}</strong> has been denied.
                  </p>
                  {denyReason && (
                    <p style={{ color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
                      Reason: {denyReason}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            Range Medical &middot; (949) 997-3988
            <br />
            1901 Westcliff Drive, Suite 10, Newport Beach, CA
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    background: '#111827',
    padding: '20px 24px',
    textAlign: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  center: {
    padding: 40,
    textAlign: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTopColor: '#111827',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  infoSection: {
    padding: '20px 24px 0',
  },
  patientName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
  },
  medication: {
    fontSize: 15,
    fontWeight: 600,
    color: '#4b5563',
    marginTop: 4,
  },
  requestedBy: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  doseBox: {
    margin: '20px 24px',
    background: '#f9fafb',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  doseRow: {
    flex: 1,
    textAlign: 'center',
  },
  doseLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
  },
  doseValue: {
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
  },
  doseFreq: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  arrow: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  reasonBox: {
    margin: '0 24px 16px',
    padding: '10px 14px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 8,
    fontSize: 14,
    color: '#92400e',
  },
  expiredBox: {
    margin: '0 24px 16px',
    padding: '12px 14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
  actions: {
    padding: '0 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  approveBtn: {
    width: '100%',
    padding: '16px 20px',
    background: '#166534',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  denyBtnOutline: {
    width: '100%',
    padding: '12px 20px',
    background: '#fff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
  },
  denyBtn: {
    flex: 1,
    padding: '12px 20px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 20px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  resultBox: {
    padding: '32px 24px',
    textAlign: 'center',
  },
  errorBox: {
    padding: '24px',
    textAlign: 'center',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 1.6,
  },
};
