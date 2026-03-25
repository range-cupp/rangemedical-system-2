import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ScheduleIV() {
  const router = useRouter();
  const [calUrl, setCalUrl] = useState('');

  useEffect(() => {
    // Build Cal.com embed URL with optional pre-filled name/email from query params
    const base = 'https://range-medical.cal.com/range-team/range-iv';
    const params = new URLSearchParams({
      embed: 'true',
      layout: 'month_view',
      theme: 'light',
    });

    // Pre-fill patient name and email if passed via URL (e.g., ?name=Chris&email=chris@test.com)
    if (router.query.name) params.set('name', router.query.name);
    if (router.query.email) params.set('email', router.query.email);

    setCalUrl(`${base}?${params.toString()}`);
  }, [router.query]);

  return (
    <Layout
      title="Schedule Your Range IV | Range Medical"
      description="Schedule your complimentary Range IV session at Range Medical in Newport Beach. Included with your HRT membership."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">HRT Membership Perk</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Complimentary with HRT Membership</span>
          <h1>Schedule Your Range IV</h1>
          <p className="hero-sub">Your monthly Range IV is ready. Pick a time below and we will have everything prepared for your visit.</p>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Visit</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">A personalized IV session included with your HRT membership.</p>

          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>&#128167;</div>
              <h3 style={styles.infoCardTitle}>Custom IV Blend</h3>
              <p style={styles.infoCardText}>5 vitamins and minerals tailored to how you are feeling that day. Add extras for a small upcharge.</p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>&#9201;</div>
              <h3 style={styles.infoCardTitle}>~60 Minute Session</h3>
              <p style={styles.infoCardText}>Relax in our comfortable lounge while your IV drip does the work.</p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>&#10003;</div>
              <h3 style={styles.infoCardTitle}>No Additional Cost</h3>
              <p style={styles.infoCardText}>Your Range IV with 5 vitamins and minerals is included at no charge with your HRT membership.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="section section-gray" id="book">
        <div className="container">
          <div className="section-kicker">Pick a Time</div>
          <h2 className="section-title">Select Your Appointment</h2>
          <p className="section-subtitle">Choose a time that works for you. Sessions are approximately 60 minutes.</p>

          <div className="calendar-container visible" style={{ marginTop: '24px' }}>
            <div className="calendar-embed">
              {calUrl && (
                <iframe
                  src={calUrl}
                  style={{ width: '100%', height: '700px', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                />
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Questions? Call us at <a href="tel:+19499973988" style={{ color: '#111', fontWeight: 600 }}>(949) 997-3988</a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

const styles = {
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginTop: '32px',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  infoCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0',
    padding: '28px 24px',
    textAlign: 'center',
  },
  infoIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  infoCardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111',
    margin: '0 0 8px',
  },
  infoCardText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#6b7280',
    margin: 0,
  },
};
