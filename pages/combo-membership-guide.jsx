import Layout from '../components/Layout';
import Head from 'next/head';

export default function ComboMembershipGuide() {
  return (
    <Layout
      title="Combo Membership Guide | Range Medical"
      description="Your guide to the Hyperbaric + Red Light combo membership. Schedule, pricing, and how to get the most from your sessions. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Combo Membership Guide — HBOT + Red Light Therapy",
              "description": "Patient guide for the HBOT + Red Light Therapy combo membership including pricing, session expectations, and safety information.",
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
      <section className="guide-hero">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> YOUR COMBO MEMBERSHIP GUIDE</div>
          <h1>HYPERBARIC + RED LIGHT COMBO MEMBERSHIP</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Everything you need to know about your membership — your schedule, what each session includes, and how to get the most from it.</p>
          <div className="hero-dose">
            <div><span>HBOT:</span> 60 min at 2.0 ATA</div>
            <div><span>RLT:</span> 20 min full-body</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
          <h2 className="section-title">TWO THERAPIES, ONE VISIT</h2>
          <p className="section-subtitle">Your combo membership pairs both therapies into one visit. Each session includes a Hyperbaric Oxygen session (60 min) and a Red Light Therapy session (20 min) back to back.</p>
          <p className="body-text">Consistent combo sessions create compounding cellular benefits. HBOT floods your tissues with oxygen from the inside while RLT stimulates cellular repair from the outside. Together, they accelerate recovery, reduce inflammation, and support your body from multiple angles.</p>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> PRICING</div>
          <h2 className="section-title">CHOOSE YOUR FREQUENCY</h2>
          <p className="section-subtitle">3-month minimum, then month-to-month. All plans include both HBOT and RLT sessions.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">1x / Week</div>
              <div className="protocol-price">$899<span className="price-period">/mo</span></div>
              <p className="protocol-desc">4 HBOT + 4 Red Light sessions per month. $225/visit. Great for maintaining a baseline of recovery.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">MOST POPULAR</span>
              <div className="protocol-days">2x / Week</div>
              <div className="protocol-price">$1,499<span className="price-period">/mo</span></div>
              <p className="protocol-desc">8 HBOT + 8 Red Light sessions per month. $187/visit. The sweet spot for compounding benefits.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">3x / Week</div>
              <div className="protocol-price">$1,999<span className="price-period">/mo</span></div>
              <p className="protocol-desc">12 HBOT + 12 Red Light sessions per month. $167/visit. Maximum frequency for accelerated results.</p>
            </div>
          </div>

          <div className="combo-box" style={{ marginTop: '1.5rem' }}>
            <h3>How It Compares</h3>
            <p>Walk-in singles: $270/visit (HBOT $185 + RLT $85). Combo membership saves you $45–$103 per visit depending on your plan.</p>
          </div>
        </div>
      </section>

      {/* Each Session */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> YOUR SESSIONS</div>
          <h2 className="section-title">WHAT EACH VISIT INCLUDES</h2>
          <p className="section-subtitle">Most patients do Red Light first, then Hyperbaric. Both can be done in the same visit.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Hyperbaric Oxygen Therapy</h3>
              <p>60 minutes at 2.0 ATA. Relax in the pressurized chamber while concentrated oxygen reaches every tissue in your body. Supports recovery, reduces inflammation, and boosts cellular energy.</p>
            </div>
            <div className="info-card">
              <h3>Red Light Therapy</h3>
              <p>20-minute full-body treatment using 660nm red and 850nm near-infrared wavelengths. Stimulates mitochondria, boosts ATP production, and supports tissue repair.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
          <h2 className="section-title">GETTING THE MOST FROM YOUR MEMBERSHIP</h2>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Stay Hydrated</h4>
                <p>Drink plenty of water before and after sessions. Hydration supports oxygen circulation and the cellular processes both therapies activate.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Be Consistent</h4>
                <p>The benefits of both therapies build over time with regular use. Stick to your schedule — consistency compounds results.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Expose Skin for RLT</h4>
                <p>Red and near-infrared light can't penetrate clothing. For RLT sessions, expose the target area directly to the panels.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Comfortable Clothing for HBOT</h4>
                <p>Wear loose, comfortable clothing. No metal jewelry in the chamber. Avoid lotions, oils, or perfumes before HBOT sessions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> TIMELINE</div>
          <h2 className="section-title">WHAT TO EXPECT</h2>
          <p className="section-subtitle">Benefits build each month as your body adapts and cells become more efficient.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Month 1</h4>
              <p>Body adapts. Early improvements in sleep, energy, and recovery. Your cells are beginning to respond to consistent treatment.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 2–3</h4>
              <p>Compounding benefits. Noticeable improvements across energy, inflammation, and recovery. This is where the magic happens.</p>
            </div>
            <div className="timeline-card">
              <h4>Ongoing</h4>
              <p>Sustained optimization. Many patients stay on the membership after their initial 3-month commitment because the benefits continue to build.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Week Reset Callout */}
      <section className="section">
        <div className="container">
          <div className="combo-box">
            <h3>Already Considering the 6-Week Reset?</h3>
            <p>The Cellular Energy Reset ($3,999) is the most structured program — 18 HBOT + 18 Red Light sessions over 6 weeks with weekly check-ins and a money-back guarantee. The combo membership is ideal for patients who want ongoing access at their own pace.</p>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
          <h2 className="section-title">IMPORTANT SAFETY INFORMATION</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Contraindications:</h4>
              <ul>
                <li>Untreated pneumothorax (HBOT)</li>
                <li>Certain lung conditions (HBOT)</li>
                <li>Untreated ear or sinus infections (HBOT)</li>
                <li>Severe claustrophobia (HBOT)</li>
                <li>Active cancerous lesions (RLT)</li>
                <li>Photosensitivity medications (RLT)</li>
                <li>Pregnancy</li>
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
              <p className="safety-note">Side effects are generally mild and short-lived. We screen for all contraindications before your first session.</p>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> Individual results vary. These treatments are not FDA-approved to diagnose, treat, cure, or prevent any disease.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>QUESTIONS? WE'RE HERE.</h2>
          <p>Whether you need to schedule sessions or have questions about your membership, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">CALL (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">TEXT US</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .guide-hero {
          background: #ffffff;
          padding: 6rem 2rem 4rem;
          text-align: left;
        }
        .guide-hero h1 {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }
        .hero-rule {
          width: 60px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.25rem;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #737373;
          max-width: 600px;
          line-height: 1.7;
        }
        .hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #737373;
        }
        .hero-dose span {
          font-weight: 600;
          color: #171717;
        }
        .section {
          padding: 6rem 2rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #1a1a1a;
          color: #ffffff;
        }
        .section-dark .v2-label {
          color: rgba(255,255,255,0.6);
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #737373;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .section-dark .section-subtitle {
          color: rgba(255,255,255,0.8);
        }
        .section-dark .section-title {
          color: #ffffff;
        }
        .body-text {
          font-size: 0.95rem;
          color: #737373;
          line-height: 1.7;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .info-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.75rem;
        }
        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .info-card p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.7;
        }
        .combo-box {
          background: #1a1a1a;
          color: #ffffff;
          padding: 1.75rem;
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
        .protocol-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .protocol-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s;
        }
        .protocol-card:hover {
          border-color: #1a1a1a;
        }
        .protocol-card.featured {
          border: 2px solid #1a1a1a;
          position: relative;
        }
        .protocol-badge {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
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
          color: #808080;
        }
        .price-period {
          font-size: 1rem;
          font-weight: 400;
          color: #737373;
        }
        .protocol-desc {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }
        .steps-list {
          margin-top: 1.5rem;
        }
        .step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 2rem;
          height: 2rem;
          background: #808080;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
        }
        .timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .timeline-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 1.5rem;
        }
        .timeline-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .timeline-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .safety-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
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
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }
        .safety-card.warning li::before {
          content: "✕";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }
        .safety-card.effects li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }
        .safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }
        .disclaimer {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }
        .disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }
        .final-cta {
          background: #1a1a1a;
          color: #ffffff;
          padding: 6rem 2rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
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
          color: #1a1a1a;
          padding: 0.875rem 1.75rem;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
        }
        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: #1a1a1a;
        }
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }
        @media (max-width: 768px) {
          .guide-hero h1 {
            font-size: 2rem;
          }
          .guide-hero {
            padding: 4rem 1.5rem 3rem;
          }
          .hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }
          .info-grid,
          .safety-grid,
          .timeline-grid {
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
          .section {
            padding: 4rem 1.5rem;
          }
          .final-cta {
            padding: 4rem 1.5rem;
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
