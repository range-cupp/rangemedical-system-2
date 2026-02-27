import Layout from '../components/Layout';
import Head from 'next/head';

export default function HRTGuide() {
  return (
    <Layout
      title="Hormone Optimization Guide | Range Medical"
      description="Your guide to hormone replacement therapy. How HRT works, what to expect, and how we monitor your progress. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Hormone Optimization Guide",
              "description": "Patient guide for hormone replacement therapy including protocols, monitoring, and safety information.",
              "url": "https://www.range-medical.com/hrt-guide",
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
          <span className="hero-badge">Your Hormone Optimization Guide</span>
          <h1>Hormone Replacement Therapy</h1>
          <p className="hero-sub">Everything you need to know about your HRT program — how it works, what to expect, and how we monitor your progress.</p>
          <div className="hero-dose">
            <div><span>Program:</span> Monthly Membership</div>
            <div><span>Includes:</span> All Medications + Labs</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Are Hormones?</h2>
          <p className="section-subtitle">Hormones are chemical messengers that control nearly everything — energy, mood, metabolism, sleep, sex drive, and body composition. They peak in your 20s and decline every year after.</p>
          <p className="body-text">By the time most people notice something is off — fatigue, weight gain, brain fog, low drive — their hormones have been declining for years. Bioidentical HRT restores your hormones to optimal levels using compounds identical to what your body naturally produces.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">A personalized approach — not a one-size-fits-all prescription.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🔬 Baseline Labs</h3>
              <p>We test your hormones, thyroid, and metabolic markers to see exactly where you stand — not just "normal range" but optimal range.</p>
            </div>
            <div className="info-card">
              <h3>📋 Custom Protocol</h3>
              <p>Your provider reviews results and builds a personalized plan — testosterone, estrogen, progesterone, and/or thyroid — whatever you need.</p>
            </div>
            <div className="info-card">
              <h3>💊 Medications Included</h3>
              <p>All hormone medications, supplies, and syringes are included in your membership. No extra pharmacy costs.</p>
            </div>
            <div className="info-card">
              <h3>📊 Ongoing Monitoring</h3>
              <p>Quarterly lab monitoring to track progress and adjust doses. Your provider stays on top of your numbers so you don't have to.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Our Approach</div>
          <h2 className="section-title">What We Check That Others Miss</h2>
          <p className="section-subtitle">Most doctors test total testosterone and call it a day. We go deeper.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Free Testosterone</h3>
              <p>Total testosterone doesn't tell the full story. Free testosterone is what your body actually uses — and it's what we optimize.</p>
            </div>
            <div className="info-card">
              <h3>Full Thyroid Panel</h3>
              <p>Not just TSH. We test T3, T4, and thyroid antibodies to catch subclinical thyroid issues that others miss.</p>
            </div>
            <div className="info-card">
              <h3>Estrogen Metabolites</h3>
              <p>Estrogen balance matters for both men and women. We track metabolites to prevent imbalances as hormones are optimized.</p>
            </div>
            <div className="info-card">
              <h3>Optimal Ranges</h3>
              <p>"Normal" lab ranges include sick people. We use optimal ranges — where you feel and perform your best.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Pricing</div>
          <h2 className="section-title">HRT Monthly Membership</h2>
          <p className="section-subtitle">All-inclusive. No hidden costs. Everything you need in one monthly price.</p>

          <div className="protocol-grid single">
            <div className="protocol-card featured">
              <div className="protocol-days">Monthly Membership</div>
              <div className="protocol-price">$250<span className="price-period">/mo</span></div>
              <ul className="protocol-includes">
                <li>✓ All hormone medications</li>
                <li>✓ Testosterone, estrogen, progesterone as needed</li>
                <li>✓ Thyroid optimization</li>
                <li>✓ All supplies and syringes</li>
                <li>✓ Quarterly lab monitoring</li>
                <li>✓ Unlimited provider visits</li>
                <li>✓ Direct messaging with provider</li>
                <li>✓ 1 Range IV per month ($225 value)</li>
              </ul>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>📋 Baseline Labs Required</strong>
            <p>Before starting HRT, we need baseline labs to build your protocol. Essential Panel: $350 / Elite Panel: $750.</p>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">Getting Started</h2>
          <p className="section-subtitle">Your provider will walk you through everything — here's the overview.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Baseline Labs</h4>
                <p>Get your blood drawn at our clinic. Results come back in 3-5 business days.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Provider Review</h4>
                <p>Your provider reviews every result with you, explains what it means, and builds your custom protocol.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Learn to Inject</h4>
                <p>We teach you injection technique at the clinic. Testosterone is typically 2x per week. Most patients self-inject at home in under a minute.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Stay Consistent</h4>
                <p>Don't skip doses — consistency is key. Store medications as instructed. Set reminders on your phone for injection days.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Everyone responds differently, but here's what patients typically experience.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1–2</h4>
              <p>Body begins adjusting. Some notice improved sleep early on.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 3–4</h4>
              <p>Energy and mood often start improving. Mental clarity begins to sharpen.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 2–3</h4>
              <p>Noticeable changes in energy, body composition, and mental clarity. Libido often improves.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 3–6</h4>
              <p>Full optimization. Labs recheck and dose adjustments as needed. This is where you start feeling like yourself again.</p>
            </div>
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
              <h4>Do Not Use If You Have:</h4>
              <ul>
                <li>Active hormone-sensitive cancers (breast, prostate)</li>
                <li>Uncontrolled blood clotting disorders</li>
                <li>Severe liver disease</li>
                <li>Undiagnosed vaginal bleeding</li>
                <li>Pregnancy or breastfeeding</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Injection site soreness</li>
                <li>Temporary mood fluctuation during adjustment</li>
                <li>Mild acne or oily skin (usually temporary)</li>
                <li>Changes in libido (typically improvement)</li>
                <li>Fluid retention (monitored with labs)</li>
              </ul>
              <p className="safety-note">All side effects are monitored closely with quarterly labs. Your provider adjusts your protocol as needed.</p>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> Individual results vary. These treatments are not FDA-approved to diagnose, treat, cure, or prevent any disease. All protocols are monitored by licensed providers with regular lab work.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you want to adjust your protocol or have questions about your labs, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
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
        .section {
          padding: 3.5rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #000000;
          color: #ffffff;
        }
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .section-dark .section-kicker {
          color: rgba(255,255,255,0.6);
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
        .section-dark .section-subtitle {
          color: rgba(255,255,255,0.8);
        }
        .section-dark .section-title {
          color: #ffffff;
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
        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .info-card li {
          font-size: 0.9rem;
          color: #525252;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
        }
        .info-card li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000000;
          font-weight: 600;
        }
        .protocol-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .protocol-grid.single {
          grid-template-columns: 1fr;
          max-width: 400px;
          margin: 0 auto;
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
        .price-period {
          font-size: 1rem;
          font-weight: 400;
          color: #737373;
        }
        .protocol-desc {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
        }
        .protocol-includes {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: left;
        }
        .protocol-includes li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.375rem 0;
          line-height: 1.5;
        }
        .steps-list {
          margin-top: 1.5rem;
        }
        .step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 2rem;
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
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #000000;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
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
        .timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .timeline-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
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
          color: #737373;
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
          border: 1px solid #e5e5e5;
          border-radius: 8px;
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
        @media (max-width: 768px) {
          .peptide-hero h1 {
            font-size: 1.875rem;
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
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
