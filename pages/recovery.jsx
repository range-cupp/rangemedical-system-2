import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

export default function Recovery() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <Layout
      title="Recovery & Energy Programs | Range Medical Newport Beach"
      description="Hyperbaric oxygen therapy and red light therapy programs for recovery, energy, and performance. Test Drive, 14-Day Sprint, and Recovery Membership available."
    >
      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Results-backed programs</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">HBOT + Red Light Therapy</span>
          <h1>Recovery & Energy Programs</h1>
          <p className="hero-sub">
            Structured programs that combine hyperbaric oxygen and red light therapy to accelerate recovery, reduce pain, and restore energy. One visit at a time.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <a href="#programs" className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              View Programs
            </a>
            <a href="tel:9499973988" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Call (949) 997-3988
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{ background: '#fafafa' }}>
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">Two therapies. One visit. Real results.</h2>
          <p className="section-subtitle">
            By default, each Recovery Session combines hyperbaric oxygen (60 min) and red light therapy (20 min) in the same visit. If you prefer one modality over the other, we adjust the protocol to fit you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '40px' }}>
            <div className="feature-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>O&#8322;</div>
              <h3>Hyperbaric Oxygen</h3>
              <p>Pressurized oxygen saturates your blood and tissues, accelerating healing, reducing inflammation, and boosting cellular energy production.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>&#9737;</div>
              <h3>Red Light Therapy</h3>
              <p>Near-infrared and red wavelengths penetrate tissue to stimulate mitochondria, promote collagen, and reduce oxidative stress.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>&#10003;</div>
              <h3>Combined Effect</h3>
              <p>Together, these therapies compound recovery outcomes. Most patients report noticeable improvement in pain, energy, or both within the first 2 weeks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section" id="programs">
        <div className="container">
          <div className="section-kicker">Programs</div>
          <h2 className="section-title">Choose your starting point</h2>
          <p className="section-subtitle">
            Every program includes the same Recovery Sessions. Pick the commitment level that fits where you are.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '40px' }}>

            {/* Test Drive */}
            <div className="pricing-card">
              <div className="pricing-badge">New Patients</div>
              <h3 className="pricing-name">Recovery Session Test Drive</h3>
              <p className="pricing-desc">Try one HBOT session and one red light session. Same day or within 7 days.</p>
              <div className="pricing-price">
                <span className="pricing-amount">$149</span>
              </div>
              <div className="pricing-value">Normal value: $270</div>
              <ul className="pricing-features">
                <li>1 HBOT session (60 min)</li>
                <li>1 red light session (20 min)</li>
                <li>No commitment</li>
                <li>Limit 1 per person</li>
              </ul>
              <a href="tel:9499973988" className="btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Book Test Drive
              </a>
            </div>

            {/* Sprint */}
            <div className="pricing-card" style={{ border: '2px solid #000' }}>
              <div className="pricing-badge" style={{ background: '#000', color: '#fff' }}>Most Popular</div>
              <h3 className="pricing-name">14-Day Recovery & Energy Sprint</h3>
              <p className="pricing-desc">8 Recovery Sessions over 14 days with baseline and Day-14 symptom scoring to measure your progress.</p>
              <div className="pricing-price">
                <span className="pricing-amount">$997</span>
              </div>
              <div className="pricing-value">Normal value: $2,160</div>
              <ul className="pricing-features">
                <li>8 HBOT sessions</li>
                <li>8 red light sessions</li>
                <li>Baseline symptom scoring</li>
                <li>Day-14 progress re-score</li>
                <li>Results guarantee*</li>
              </ul>
              <a href="tel:9499973988" className="btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Start the Sprint
              </a>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
                *If your recovery or energy hasn't improved by 2+ points by day 14, we add 2 extra weeks at no charge.
              </p>
            </div>

            {/* Membership */}
            <div className="pricing-card">
              <div className="pricing-badge" style={{ background: '#166534', color: '#fff' }}>Best Value</div>
              <h3 className="pricing-name">Recovery Membership</h3>
              <p className="pricing-desc">Up to 8 Recovery Sessions every 28 days on autopay. Priority scheduling and member pricing.</p>
              <div className="pricing-price">
                <span className="pricing-amount">$799</span>
                <span className="pricing-interval"> / 28 days</span>
              </div>
              <div className="pricing-value">Normal value: $2,160/cycle</div>
              <ul className="pricing-features">
                <li>Up to 8 Recovery Sessions per cycle</li>
                <li>Priority scheduling</li>
                <li>Member pricing on extras</li>
                <li>14-Day Sprint included as new-member bonus</li>
                <li>Power Pack add-on available (+8 sessions for $399)</li>
              </ul>
              <a href="tel:9499973988" className="btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Join Membership
              </a>
            </div>
          </div>

          {/* Single session fallback */}
          <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px', background: '#fafafa' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Just want a single session? HBOT is <strong>$185</strong> and red light is <strong>$85</strong>.
              <br />
              <span style={{ fontSize: '14px' }}>Most people who want results start with the 14-Day Sprint.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Modality Note */}
      <section className="section" style={{ background: '#fafafa' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-kicker">Flexible Protocols</div>
          <h2 className="section-title">Your program, your preference</h2>
          <p style={{ fontSize: '17px', lineHeight: '1.7', color: '#333' }}>
            By default, every Recovery Session combines the chamber and red light because that's where we see the best results. But every program can be adjusted:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ padding: '20px', background: '#fff', border: '1px solid #e5e5e5' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Combined</div>
              <div style={{ fontSize: '14px', color: '#666' }}>HBOT + Red Light in the same visit. Best results.</div>
            </div>
            <div style={{ padding: '20px', background: '#fff', border: '1px solid #e5e5e5' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Red Light Only</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Same program, red light sessions only. Great if you prefer to skip the chamber.</div>
            </div>
            <div style={{ padding: '20px', background: '#fff', border: '1px solid #e5e5e5' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>HBOT Only</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Same program, chamber sessions only. Common for post-surgery recovery.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-kicker">FAQ</div>
          <h2 className="section-title">Common questions</h2>

          {[
            {
              q: 'What is a Recovery Session?',
              a: 'A Recovery Session is one visit that includes a 60-minute hyperbaric oxygen session and a 20-minute red light therapy session (by default). If you prefer just one modality, we adjust the protocol — same pricing, same structure.',
            },
            {
              q: 'How often should I come?',
              a: 'Most patients in the Sprint or Membership come 4 times per week. For the Test Drive, you can do both sessions on the same day or spread them across the week.',
            },
            {
              q: 'What does the results guarantee cover?',
              a: 'If your recovery or energy score hasn\'t improved by at least 2 points on our 0-10 scale by day 14 of the Sprint, we add 2 extra weeks (6 red light sessions) at no charge.',
            },
            {
              q: 'Can I upgrade from the Sprint to a Membership?',
              a: 'Yes. If you join the Membership, the Sprint is included as your new-member bonus at no extra charge — so you save $997 compared to doing both separately.',
            },
            {
              q: 'What is the Power Pack?',
              a: 'The Power Pack adds 8 extra Recovery Sessions to your current membership cycle for $399. It\'s for members who want to train at higher frequency temporarily — surgery recovery, competition prep, etc. Sessions don\'t roll over.',
            },
            {
              q: 'Is there a contract?',
              a: 'The Membership bills every 28 days on autopay. You can pause or cancel anytime — no long-term commitment required.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid #e5e5e5',
                padding: '20px 0',
              }}
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '17px', fontWeight: '600', color: '#000' }}>{faq.q}</span>
                <span style={{ fontSize: '20px', color: '#999', flexShrink: 0, marginLeft: '16px' }}>
                  {expandedFaq === i ? '\u2212' : '+'}
                </span>
              </button>
              {expandedFaq === i && (
                <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#555', marginTop: '12px', marginBottom: 0 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: '#000', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>Ready to start recovering?</h2>
          <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
            Call or text to book your first session. We'll help you pick the right program.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:9499973988" style={{
              padding: '16px 32px',
              background: '#fff',
              color: '#000',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
            }}>
              Call (949) 997-3988
            </a>
            <a href="sms:9499973988" style={{
              padding: '16px 32px',
              background: 'transparent',
              color: '#fff',
              border: '1px solid #fff',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
            }}>
              Text Us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
