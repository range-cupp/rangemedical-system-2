import Layout from '../components/Layout';
import { useEffect } from 'react';
import Head from 'next/head';

export default function ScheduleIV() {
  // Load Cal.com embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
          <p className="section-subtitle">A personalized IV session tailored to how you are feeling.</p>

          <div className="included-box">
            <div className="included-left">
              <div className="included-price">included</div>
              <div className="included-duration">~60 minute session</div>
              <span className="included-credit">Complimentary with HRT membership</span>
            </div>
            <div className="included-right">
              <h3>Your Range IV includes:</h3>
              <ul className="included-list">
                <li>Custom blend of vitamins and minerals</li>
                <li>Tailored to how you are feeling that day</li>
                <li>Comfortable lounge setting</li>
                <li>Hydration + nutrient support</li>
                <li>No additional cost — included with your membership</li>
              </ul>
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
              <iframe
                src="https://range-medical.cal.com/range-team/range-iv?embed=true&layout=month_view&theme=light"
                style={{ width: '100%', height: '700px', border: 'none', overflow: 'hidden' }}
                scrolling="no"
              />
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
