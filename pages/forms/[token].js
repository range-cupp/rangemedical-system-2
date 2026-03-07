// pages/forms/[token].js
// Form bundle landing page — auto-progresses through forms
// Shows progress, redirects to next uncompleted form, carries patient info forward
// Range Medical

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function FormBundlePage() {
  const router = useRouter();
  const { token } = router.query;
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  const fetchBundle = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/form-bundles/${token}`);
      if (res.status === 404) { setError('not_found'); return; }
      if (res.status === 410) { setError('expired'); return; }
      if (!res.ok) { setError('error'); return; }
      const data = await res.json();
      setBundle(data.bundle);
    } catch (err) {
      console.error('Bundle fetch error:', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBundle(); }, [fetchBundle]);

  // Re-fetch when tab becomes visible (user returns from completing a form)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && token) {
        fetchBundle();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchBundle, token]);

  // Auto-redirect to the next uncompleted form
  useEffect(() => {
    if (!bundle || bundle.allComplete || redirecting) return;

    const nextForm = bundle.forms.find(f => !f.completed);
    if (!nextForm) return;

    setRedirecting(true);

    // Short delay so patient can see progress before redirect
    const timer = setTimeout(() => {
      // Build URL with query params for patient info carry-forward
      const params = new URLSearchParams();
      params.set('bundle', token);
      if (bundle.ghlContactId) params.set('cid', bundle.ghlContactId);

      // Carry patient info from previously completed forms
      if (bundle.patientInfo) {
        if (bundle.patientInfo.firstName) params.set('fn', bundle.patientInfo.firstName);
        if (bundle.patientInfo.lastName) params.set('ln', bundle.patientInfo.lastName);
        if (bundle.patientInfo.email) params.set('em', bundle.patientInfo.email);
        if (bundle.patientInfo.phone) params.set('ph', bundle.patientInfo.phone);
        if (bundle.patientInfo.dateOfBirth) params.set('dob', bundle.patientInfo.dateOfBirth);
      }

      window.location.href = `${nextForm.path}?${params.toString()}`;
    }, bundle.completedCount === 0 ? 100 : 1500);

    return () => clearTimeout(timer);
  }, [bundle, token, redirecting]);

  if (loading) {
    return (
      <>
        <Head><title>Loading Forms | Range Medical</title></Head>
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.logo}>RANGE MEDICAL</h1>
            </div>
            <div style={styles.body}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Loading your forms...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head><title>Forms | Range Medical</title></Head>
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.logo}>RANGE MEDICAL</h1>
            </div>
            <div style={styles.body}>
              <div style={styles.errorIcon}>!</div>
              <h2 style={styles.errorTitle}>
                {error === 'not_found' ? 'Link Not Found' :
                 error === 'expired' ? 'Link Expired' : 'Something Went Wrong'}
              </h2>
              <p style={styles.errorText}>
                {error === 'not_found' ? 'This form link is not valid. Please contact Range Medical for a new link.' :
                 error === 'expired' ? 'This form link has expired. Please contact Range Medical for a new link.' :
                 'Please try again or contact Range Medical for assistance.'}
              </p>
              <p style={styles.contactText}>(949) 997-3988</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!bundle) return null;

  // All forms complete — celebration screen
  if (bundle.allComplete) {
    return (
      <>
        <Head><title>All Forms Complete | Range Medical</title></Head>
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.logo}>RANGE MEDICAL</h1>
            </div>
            <div style={styles.body}>
              <div style={styles.successIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 style={styles.successTitle}>All Forms Complete!</h2>
              <p style={styles.successText}>
                Thank you{bundle.firstName ? `, ${bundle.firstName}` : ''}! All {bundle.totalCount} forms have been submitted successfully.
              </p>
              <p style={styles.successSubtext}>
                You&apos;re all set for your visit to Range Medical. We look forward to seeing you!
              </p>

              <div style={styles.formsList}>
                {bundle.forms.map(form => (
                  <div key={form.id} style={styles.formItemComplete}>
                    <div style={styles.checkCircle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={styles.formNameComplete}>{form.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // In-progress — showing progress before redirect
  const nextForm = bundle.forms.find(f => !f.completed);
  const progressPct = Math.round((bundle.completedCount / bundle.totalCount) * 100);

  return (
    <>
      <Head><title>Forms | Range Medical</title></Head>
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            {bundle.completedCount > 0 && (
              <>
                <h2 style={styles.progressTitle}>
                  {bundle.completedCount} of {bundle.totalCount} forms completed
                </h2>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
                </div>
              </>
            )}

            <div style={styles.formsList}>
              {bundle.forms.map((form, idx) => (
                <div
                  key={form.id}
                  style={form.completed ? styles.formItemComplete :
                         form.id === nextForm?.id ? styles.formItemNext : styles.formItem}
                >
                  {form.completed ? (
                    <div style={styles.checkCircle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : form.id === nextForm?.id ? (
                    <div style={styles.activeCircle}>{idx + 1}</div>
                  ) : (
                    <div style={styles.pendingCircle}>{idx + 1}</div>
                  )}
                  <div style={styles.formInfo}>
                    <span style={form.completed ? styles.formNameComplete : styles.formName}>
                      {form.name}
                    </span>
                    <span style={styles.formTime}>{form.time}</span>
                  </div>
                  {form.id === nextForm?.id && (
                    <div style={styles.nextBadge}>Next</div>
                  )}
                </div>
              ))}
            </div>

            {redirecting && nextForm && (
              <p style={styles.redirectText}>
                Opening {nextForm.name}...
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    background: '#000',
    padding: '20px 24px',
    textAlign: 'center',
  },
  logo: {
    margin: 0,
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '3px',
  },
  body: {
    padding: '32px 24px',
    textAlign: 'center',
  },
  // Loading
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e5e5',
    borderTopColor: '#000',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#666',
    fontSize: '15px',
    margin: 0,
  },
  // Error
  errorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#fef2f2',
    color: '#ef4444',
    fontSize: '28px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 8px',
    color: '#111',
  },
  errorText: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 16px',
    lineHeight: '1.5',
  },
  contactText: {
    fontSize: '15px',
    color: '#111',
    fontWeight: 600,
    margin: 0,
  },
  // Success
  successIcon: {
    margin: '0 auto 16px',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 12px',
    color: '#111',
  },
  successText: {
    fontSize: '16px',
    color: '#333',
    margin: '0 0 8px',
    lineHeight: '1.5',
  },
  successSubtext: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 24px',
    lineHeight: '1.5',
  },
  // Progress
  progressTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 12px',
    color: '#111',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e5e5e5',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  // Forms list
  formsList: {
    textAlign: 'left',
  },
  formItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '10px',
    marginBottom: '8px',
    background: '#f9f9f9',
    gap: '12px',
  },
  formItemComplete: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '10px',
    marginBottom: '8px',
    background: '#f0fdf4',
    gap: '12px',
  },
  formItemNext: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '10px',
    marginBottom: '8px',
    background: '#fff',
    border: '2px solid #000',
    gap: '12px',
  },
  checkCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  pendingCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#e5e5e5',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  formInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  formName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  formNameComplete: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#666',
    textDecoration: 'line-through',
  },
  formTime: {
    fontSize: '13px',
    color: '#999',
    marginTop: '2px',
  },
  nextBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    background: '#000',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  redirectText: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
  },
};
