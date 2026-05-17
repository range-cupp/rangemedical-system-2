// pages/hbot-trial/rebook.jsx
// Re-engagement landing page for HBOT trial no-shows.
// Friendly "second chance" messaging, card on file required, $25 no-show policy.

import Layout from '../../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FreeSessionScheduler from '../../components/FreeSessionScheduler';

const ACCENT = '#0891b2';
const ACCENT_BG = '#ecfeff';

export default function HBOTRebook() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trialData, setTrialData] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/hbot-trial/rebook-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trialId: token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTrialData(data);
        }
      })
      .catch(() => setError('Something went wrong. Please try again or call us.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <Layout>
        <section style={{ maxWidth: 560, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Invalid Link</h1>
          <p style={{ fontSize: 15, color: '#525252', lineHeight: 1.6 }}>
            This link appears to be missing some information. If you received this in an email,
            try clicking the button again or call us at{' '}
            <a href="tel:9499973988" style={{ color: ACCENT, fontWeight: 600 }}>(949) 997-3988</a>.
          </p>
        </section>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <section style={{ maxWidth: 560, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e5e5e5', borderTopColor: ACCENT, borderRadius: '50%', animation: 'rebook-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, color: '#737373' }}>Loading your session...</p>
          <style>{`@keyframes rebook-spin { to { transform: rotate(360deg); } }`}</style>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section style={{ maxWidth: 560, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Oops</h1>
          <p style={{ fontSize: 15, color: '#525252', lineHeight: 1.6 }}>
            {error}
          </p>
          <p style={{ fontSize: 14, color: '#737373', marginTop: 16 }}>
            Need help? Call or text{' '}
            <a href="tel:9499973988" style={{ color: ACCENT, fontWeight: 600 }}>(949) 997-3988</a>
          </p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Rebook Your Free HBOT Session | Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '48px 2rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: ACCENT_BG, borderRadius: '50%', marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#171717' }}>
            We saved your spot, {trialData.firstName}
          </h1>
          <p style={{ fontSize: 15, color: '#525252', margin: '0 auto', maxWidth: 480, lineHeight: 1.6 }}>
            Life gets busy — we get it. Your free 60-minute Hyperbaric Oxygen session is still
            available. Pick a new time below and we&apos;ll get you in.
          </p>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            A card on file is required to hold your spot. You&apos;ll only be charged $25 if you
            don&apos;t show up and haven&apos;t cancelled at least an hour ahead. The session itself is completely free.
          </p>
        </div>
      </section>

      <FreeSessionScheduler
        trialId={trialData.trialId}
        eventTypeId={trialData.eventTypeId}
        setupClientSecret={trialData.setupClientSecret}
        sessionDurationMinutes={trialData.sessionDurationMinutes}
        trialLabel="Hyperbaric Oxygen"
        accentColor={ACCENT}
        accentBg={ACCENT_BG}
        firstName={trialData.firstName}
        scheduleLabel="Pick a new time"
        scheduleTitle="When works for you?"
        scheduleSubtitle={`Pacific time · 60 minutes · Newport Beach. You'll add a card on the next step for the $25 no-show hold (only charged if you miss it again).`}
        requiresCard={true}
      />
    </Layout>
  );
}
