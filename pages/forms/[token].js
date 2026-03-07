// pages/forms/[token].js
// Form bundle landing page — shows checklist of forms with completion tracking
// Patient clicks each form, completes it, returns to see updated progress
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

  // Build the URL for a form with patient info carry-forward
  function getFormUrl(form) {
    const params = new URLSearchParams();
    params.set('bundle', token);
    if (bundle.ghlContactId) params.set('cid', bundle.ghlContactId);
    if (bundle.patientInfo) {
      if (bundle.patientInfo.firstName) params.set('fn', bundle.patientInfo.firstName);
      if (bundle.patientInfo.lastName) params.set('ln', bundle.patientInfo.lastName);
      if (bundle.patientInfo.email) params.set('em', bundle.patientInfo.email);
      if (bundle.patientInfo.phone) params.set('ph', bundle.patientInfo.phone);
      if (bundle.patientInfo.dateOfBirth) params.set('dob', bundle.patientInfo.dateOfBirth);
    }
    return `${form.path}?${params.toString()}`;
  }

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
                    <div style={styles.formInfo}>
                      <span style={styles.formNameComplete}>{form.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // In-progress — show checklist with clickable forms
  const progressPct = Math.round((bundle.completedCount / bundle.totalCount) * 100);

  return (
    <>
      <Head><title>Forms | Range Medical</title></Head>
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
            <p style={styles.headerSub}>Forms to Complete</p>
          </div>
          <div style={styles.body}>
            {bundle.firstName && (
              <p style={styles.greeting}>Hi {bundle.firstName},</p>
            )}
            <p style={styles.instructions}>
              Please complete the following form{bundle.totalCount - bundle.completedCount > 1 ? 's' : ''} before your visit.
            </p>

            {bundle.completedCount > 0 && (
              <div style={styles.progressSection}>
                <p style={styles.progressLabel}>
                  {bundle.completedCount} of {bundle.totalCount} completed
                </p>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            <div style={styles.formsList}>
              {bundle.forms.map((form) => (
                <div key={form.id} style={form.completed ? styles.formItemComplete : styles.formItem}>
                  {form.completed ? (
                    <div style={styles.checkCircle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <div style={styles.pendingCircle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </div>
                  )}
                  <div style={styles.formInfo}>
                    <span style={form.completed ? styles.formNameComplete : styles.formName}>
                      {form.name}
                    </span>
                    <span style={styles.formTime}>{form.time}</span>
                  </div>
                  {!form.completed && (
                    <a href={getFormUrl(form)} style={styles.startButton}>
                      Start
                    </a>
                  )}
                </div>
              ))}
            </div>

            <p style={styles.infoNote}>
              Your information carries forward between forms so you only need to enter it once.
            </p>
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
  headerSub: {
    margin: '6px 0 0',
    color: '#a3a3a3',
    fontSize: '13px',
  },
  body: {
    padding: '28px 24px',
  },
  greeting: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  instructions: {
    margin: '0 0 20px',
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.5',
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
    textAlign: 'center',
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
    textAlign: 'center',
  },
  errorText: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 16px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  contactText: {
    fontSize: '15px',
    color: '#111',
    fontWeight: 600,
    margin: 0,
    textAlign: 'center',
  },
  // Success
  successIcon: {
    margin: '0 auto 16px',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 12px',
    color: '#111',
    textAlign: 'center',
  },
  successText: {
    fontSize: '16px',
    color: '#333',
    margin: '0 0 8px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 24px',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  // Progress
  progressSection: {
    marginBottom: '20px',
  },
  progressLabel: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e5e5e5',
    borderRadius: '4px',
    overflow: 'hidden',
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
  pendingCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#22c55e',
  },
  formTime: {
    fontSize: '13px',
    color: '#999',
    marginTop: '2px',
  },
  startButton: {
    display: 'inline-block',
    padding: '8px 20px',
    background: '#000',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    flexShrink: 0,
  },
  infoNote: {
    marginTop: '20px',
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.5',
    textAlign: 'center',
  },
};
