import Layout from '../components/Layout';
import Head from 'next/head';

export default function ComboMembershipGuide() {
  return (
    <Layout
      title="Combo Membership Guide | Range Medical"
      description="Your guide to the HBOT + Red Light Therapy combo membership. What to expect, session tips, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Combo Membership Guide — HBOT + Red Light Therapy",
              "description": "Patient guide for the HBOT + Red Light Therapy combo membership including session expectations, tips, and safety information.",
              "url": "https://www.range-medical.com/combo-membership-guide",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "telephone": "+1-949-997-3988",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Membership Guide</span>
          <h1>Your Combo Membership Guide</h1>
          <p className="hero-sub">Everything you need to know about your HBOT + Red Light Therapy combo membership — two therapies, one membership, maximum benefit.</p>
          <div className="hero-dose">
            <div><span>HBOT + RLT</span></div>
            <div><span>Period:</span> 30-day rolling</div>
          </div>
        </div>
      </section>

      {/* Your Membership */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Plan</div>
          <h2 className="section-title">Your Combo Membership</h2>
          <p className="section-subtitle">Two therapies that work together — oxygen from the inside, light from the outside.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Hyperbaric Oxygen Therapy</h3>
              <p>4 HBOT sessions per month. 60 minutes each at 2.0 atm — delivering concentrated oxygen deep into your tissues to support recovery and reduce inflammation.</p>
            </div>
            <div className="info-card">
              <h3>Red Light Therapy</h3>
              <p>Up to 12 RLT sessions per month. 20 minutes each — using 660nm red and 850nm near-infrared wavelengths to boost cellular energy, collagen production, and recovery.</p>
            </div>
          </div>

          <div className="combo-box">
            <h3>Why Combine Them?</h3>
            <p>HBOT floods your tissues with oxygen from the inside while RLT stimulates cellular repair from the outside. Together, they create a compounding effect — accelerating recovery, reducing inflammation, and supporting your body from multiple angles.</p>
          </div>
        </div>
      </section>

      {/* Membership Options */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Options</div>
          <h2 className="section-title">Choose Your Frequency</h2>
          <p className="section-subtitle">All plans include both HBOT and RLT sessions on a 30-day rolling period.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">1x / Week</div>
              <div className="protocol-price">$899</div>
              <p className="protocol-desc">4 HBOT + 4 RLT sessions per month. Great for maintaining a baseline of recovery and cellular support.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Most Popular</span>
              <div className="protocol-days">2x / Week</div>
              <div className="protocol-price">$1,499</div>
              <p className="protocol-desc">8 HBOT + 8 RLT sessions per month. The sweet spot for consistent progress and compounding benefits.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">3x / Week</div>
              <div className="protocol-price">$1,999</div>
              <p className="protocol-desc">12 HBOT + 12 RLT sessions per month. Maximum frequency for accelerated recovery and peak performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Is HBOT */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Therapy 1</div>
          <h2 className="section-title">Hyperbaric Oxygen Therapy (HBOT)</h2>
          <p className="body-text">You'll enter a pressurized chamber at 2.0 atmospheres where your lungs absorb significantly more oxygen than normal. This oxygen-rich blood reaches tissues throughout your body — supporting recovery, reducing inflammation, and promoting cellular repair.</p>
        </div>
      </section>

      {/* What Is RLT */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Therapy 2</div>
          <h2 className="section-title">Red Light Therapy (RLT)</h2>
          <p className="body-text">Our panels deliver 660nm red light and 850nm near-infrared light. Red light supports collagen production and skin health near the surface, while near-infrared penetrates deeper to reach muscles, joints, and bones. Both wavelengths boost cellular energy production (ATP), helping your body repair more efficiently.</p>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Visit</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Both therapies can be done in the same visit. Here's the flow for each.</p>

          <h3 className="therapy-label">HBOT Session</h3>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Check In</h4>
                <p>Arrive at the clinic and check in with our team.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Enter the Chamber</h4>
                <p>Get comfortable in the hyperbaric chamber. You can relax, read, or rest.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>60-Minute Session</h4>
                <p>The chamber pressurizes to 2.0 atm. You may feel mild ear pressure — this is normal and resolves quickly.</p>
              </div>
            </div>
          </div>

          <h3 className="therapy-label" style={{ marginTop: '2rem' }}>RLT Session</h3>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Position at the Panels</h4>
                <p>Stand or sit in front of the red light panels. Expose the target area directly for maximum absorption.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>20-Minute Session</h4>
                <p>Relax while the panels deliver therapeutic wavelengths. The light feels warm but comfortable — no UV exposure.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>You're Done</h4>
                <p>No recovery time needed. You're free to go about your day.</p>
              </div>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Same-Day Sessions</strong>
            <p>You can do both HBOT and RLT in the same visit. Many members schedule them back-to-back for convenience. The therapies complement each other and there's no conflict in doing both the same day.</p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Tips</div>
          <h2 className="section-title">Getting the Most Out of Your Combo Membership</h2>

          <div className="tip-box">
            <strong>Stay Hydrated</strong>
            <p>Drink plenty of water before and after sessions. Hydration supports oxygen circulation and the cellular processes that both therapies activate.</p>
          </div>
          <div className="tip-box">
            <strong>Be Consistent</strong>
            <p>Aim for 1 HBOT session per week and 2-3 RLT sessions per week. The benefits of both therapies build over time with regular use.</p>
          </div>
          <div className="tip-box">
            <strong>Expose Skin for RLT</strong>
            <p>Red and near-infrared light can't penetrate clothing. For RLT sessions, expose the target area directly to the panels.</p>
          </div>
          <div className="tip-box">
            <strong>Comfortable Clothing for HBOT</strong>
            <p>Wear loose, comfortable clothing for HBOT sessions. Avoid lotions, oils, or perfumes before entering the chamber.</p>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Safety</div>
          <h2 className="section-title">Important Safety Information</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Contraindications:</h4>
              <ul>
                <li>Untreated ear or sinus infections (HBOT)</li>
                <li>Severe claustrophobia (HBOT)</li>
                <li>Photosensitivity medications (RLT)</li>
                <li>Active skin cancer or lesions (RLT)</li>
                <li>Pregnancy</li>
                <li>Certain lung conditions (HBOT)</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild ear pressure during HBOT pressurization</li>
                <li>Temporary lightheadedness after HBOT</li>
                <li>Mild warmth or tingling during RLT</li>
                <li>Temporary skin redness from RLT (resolves quickly)</li>
                <li>Slight fatigue (typically resolves within hours)</li>
              </ul>
              <p className="safety-note">Side effects are generally mild and short-lived. If you experience anything unusual or persistent, let our team know.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you need to schedule sessions or have questions about your membership, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        /* Hero */
        .peptide-hero {
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          padding: 3.5rem 1.5rem 3rem;
          text-align: center;
        }

        .peptide-hero h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .hero-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }

        .hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #525252;
        }

        .hero-dose span {
          font-weight: 600;
          color: #171717;
        }

        /* Sections */
        .section {
          padding: 3.5rem 1.5rem;
        }

        .section-gray {
          background: #fafafa;
        }

        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }

        .section-subtitle {
          font-size: 1rem;
          color: #525252;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .body-text {
          font-size: 0.95rem;
          color: #525252;
          line-height: 1.7;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Therapy Label */
        .therapy-label {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #000000;
          display: inline-block;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .info-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }

        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .info-card p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Combo Box */
        .combo-box {
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          padding: 1.75rem;
          margin-top: 1.5rem;
          text-align: center;
        }

        .combo-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .combo-box p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.7;
        }

        /* Protocol Grid */
        .protocol-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .protocol-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s;
        }

        .protocol-card:hover {
          border-color: #000000;
        }

        .protocol-card.featured {
          border: 2px solid #000000;
          position: relative;
        }

        .protocol-badge {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
          background: #000000;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .protocol-days {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .protocol-price {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .protocol-desc {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Steps */
        .steps-list {
          margin-top: 1rem;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .step-item:last-child {
          border-bottom: none;
        }

        .step-number {
          width: 2rem;
          min-width: 2rem;
          height: 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .step-content p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Tip Box */
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #000000;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1rem;
          border-radius: 0 8px 8px 0;
        }

        .tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .tip-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
          margin: 0;
        }

        /* Safety */
        .safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .safety-card li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }

        .safety-card.warning li::before {
          content: "\u2715";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }

        .safety-card.effects li::before {
          content: "\u2022";
          position: absolute;
          left: 0;
          color: #737373;
          font-weight: 700;
        }

        .safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }

        /* Final CTA */
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }

        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .final-cta p {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 1.5rem;
        }

        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .btn-white:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }

        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .btn-outline-white:hover {
          background: #ffffff;
          color: #000000;
        }

        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .peptide-hero h1 {
            font-size: 1.875rem;
          }

          .hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }

          .info-grid,
          .safety-grid {
            grid-template-columns: 1fr;
          }

          .protocol-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .protocol-card.featured {
            order: -1;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
