import Layout from '../components/Layout';
import Head from 'next/head';

export default function NADGuide() {
  return (
    <Layout
      title="NAD+ Therapy Guide | Range Medical"
      description="Your guide to NAD+ therapy. IV infusions and injections for cellular energy, brain function, and healthy aging. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "NAD+ Therapy Guide",
              "description": "Patient guide for NAD+ therapy including IV infusions, injections, protocols, and safety information.",
              "url": "https://www.range-medical.com/nad-guide",
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
          <span className="hero-badge">Your NAD+ Therapy Guide</span>
          <h1>NAD+ Therapy</h1>
          <p className="hero-sub">Everything you need to know about NAD+ — how it works, your options, and what to expect as your cells recharge.</p>
          <div className="hero-dose">
            <div><span>NAD+ IV:</span> 225mg–1000mg</div>
            <div><span>NAD+ Injection:</span> $0.50/mg</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is NAD+?</h2>
          <p className="section-subtitle">NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme found in every cell. It's essential for energy production, DNA repair, and healthy aging.</p>
          <p className="body-text">By age 50, your NAD+ levels have declined by roughly 50%. Restoring NAD+ supports cellular function across your entire body — from your brain to your muscles to your immune system.</p>
        </div>
      </section>

      {/* What NAD+ Does */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What NAD+ Does for Your Body</h2>
          <p className="section-subtitle">NAD+ is involved in hundreds of metabolic processes. Here's what matters most.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>⚡ Cellular Energy</h3>
              <p>Converts food into ATP — your cells' energy currency. More NAD+ means more efficient energy production at the cellular level.</p>
            </div>
            <div className="info-card">
              <h3>🧬 DNA Repair</h3>
              <p>Activates PARP enzymes that repair damaged DNA. This is essential for preventing cellular aging and supporting long-term health.</p>
            </div>
            <div className="info-card">
              <h3>🧠 Brain Function</h3>
              <p>Supports neuronal health and mental clarity. NAD+ fuels the brain cells responsible for focus, memory, and cognitive performance.</p>
            </div>
            <div className="info-card">
              <h3>🔄 Healthy Aging</h3>
              <p>Activates sirtuins — proteins that regulate aging, inflammation, and stress response. Often called the "longevity proteins."</p>
            </div>
            <div className="info-card">
              <h3>📊 Metabolic Health</h3>
              <p>Supports glucose metabolism and lipid balance. Helps your body process nutrients more efficiently.</p>
            </div>
            <div className="info-card">
              <h3>💪 Recovery</h3>
              <p>Accelerates cellular repair and reduces inflammation. Supports faster recovery from exercise, illness, and stress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* IV Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">IV Infusions</div>
          <h2 className="section-title">NAD+ IV Pricing</h2>
          <p className="section-subtitle">Higher doses provide deeper cellular benefits. Your provider will recommend the right dose for your goals.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">225mg</div>
              <div className="protocol-price">$375</div>
              <p className="protocol-desc">Great starting point. Ideal for first-time NAD+ patients or maintenance sessions.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Most Popular</span>
              <div className="protocol-days">500mg</div>
              <div className="protocol-price">$525</div>
              <p className="protocol-desc">Full cellular benefit. The sweet spot for most patients seeking energy and clarity.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">750mg</div>
              <div className="protocol-price">$650</div>
              <p className="protocol-desc">High-dose protocol for patients seeking maximum cellular recharge.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">1000mg</div>
              <div className="protocol-price">$775</div>
              <p className="protocol-desc">Maximum dose. Recommended for intensive protocols or significant NAD+ depletion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Injection Pricing */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Injections</div>
          <h2 className="section-title">NAD+ Injection Pricing</h2>
          <p className="section-subtitle">Self-administered at home. $0.50 per mg. A convenient way to maintain NAD+ levels between IV sessions or as a standalone protocol.</p>

          <div className="dose-table">
            <div className="dose-row">
              <span className="dose-amount">50mg</span>
              <span className="dose-price">$25</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">75mg</span>
              <span className="dose-price">$37.50</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">100mg</span>
              <span className="dose-price">$50</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">125mg</span>
              <span className="dose-price">$62.50</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">150mg</span>
              <span className="dose-price">$75</span>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>📋 Recommended Protocols</strong>
            <p>Injection Protocol: 12 weeks, 3x per week, self-administered at home. IV Protocol: Quarterly — 5 IVs in 10 days + monthly maintenance IVs.</p>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">What to Know Before Your Session</h2>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Hydrate</h4>
                <p>Drink plenty of water before and after your session. Hydration supports absorption and reduces potential side effects.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Relax During Infusion</h4>
                <p>IV sessions last 1–4 hours depending on dose. Bring something to read, watch, or work on. You'll be comfortable the entire time.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>For Injections</h4>
                <p>We teach you subcutaneous injection technique at the clinic. Self-administer at home. Refrigerate vials. Consistent 3x/week dosing for best results.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Listen to Your Body</h4>
                <p>Some patients feel energized immediately; others notice gradual improvement over days. Both responses are normal.</p>
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
          <p className="section-subtitle">NAD+ benefits build over time. Here's what patients typically experience.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>After First IV</h4>
              <p>Many notice improved clarity and energy within hours to days. Some feel a calm, focused alertness.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 2–4</h4>
              <p>Cumulative benefits build — better sleep, mental sharpness, faster recovery from exercise and stress.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 2–3</h4>
              <p>Deeper cellular repair. Sustained energy improvements. Brain fog significantly reduced.</p>
            </div>
            <div className="timeline-card">
              <h4>Ongoing</h4>
              <p>Maintenance protocol keeps levels optimized. Most patients settle into a rhythm of monthly IVs or regular injections.</p>
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
              <h4>Not Recommended If You Are:</h4>
              <ul>
                <li>Pregnant or breastfeeding</li>
                <li>Managing uncontrolled medical conditions</li>
                <li>Taking medications that may interact (discuss with provider)</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild nausea during IV infusion</li>
                <li>Flushing or warmth</li>
                <li>Chest tightness (resolved by slowing drip rate)</li>
                <li>Mild soreness at injection site</li>
                <li>Temporary headache</li>
              </ul>
              <p className="safety-note">IV side effects are typically resolved by slowing the infusion rate. Let your nurse know if you experience discomfort.</p>
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
          <h2>Questions? We're Here.</h2>
          <p>Whether you want to schedule your next session or explore a protocol, our team can help.</p>
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
        .protocol-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
        .dose-table {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        .dose-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e5e5;
        }
        .dose-row:last-child {
          border-bottom: none;
        }
        .dose-amount {
          font-weight: 600;
          font-size: 1rem;
          color: #171717;
        }
        .dose-price {
          font-weight: 700;
          font-size: 1rem;
          color: #000000;
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
            grid-template-columns: 1fr 1fr;
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
