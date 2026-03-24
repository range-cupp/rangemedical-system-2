import Layout from '../components/Layout';
import Head from 'next/head';

export default function TirzepatideGuide() {
  return (
    <Layout
      title="Tirzepatide Weight Loss Guide | Range Medical"
      description="Your guide to tirzepatide weight loss therapy. How it works, injection instructions, and what to expect. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Tirzepatide Weight Loss Guide",
              "description": "Patient guide for tirzepatide weight loss therapy including injection instructions, dosing, and safety information.",
              "url": "https://www.range-medical.com/tirzepatide-guide",
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
          <div className="v2-label"><span className="v2-dot" /> YOUR WEIGHT LOSS PROTOCOL GUIDE</div>
          <h1>TIRZEPATIDE</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Everything you need to know about your weight loss medication — how it works, how to inject, and what to expect.</p>
          <div className="hero-dose">
            <div><span>Type:</span> GLP-1/GIP Dual Agonist</div>
            <div><span>Frequency:</span> 1x per week</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
          <h2 className="section-title">WHAT IS TIRZEPATIDE?</h2>
          <p className="section-subtitle">Tirzepatide is a dual GLP-1/GIP receptor agonist. It works on the hormones that control hunger, satiety, and metabolism — helping your body naturally want less food while improving how you process what you eat.</p>
          <p className="body-text">Unlike diet pills that rely on stimulants, tirzepatide works with your body's own hormone systems. It quiets the constant mental chatter about food — what many patients describe as "food noise" — and lets you eat less without feeling deprived.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
          <h2 className="section-title">WHY TIRZEPATIDE WORKS</h2>
          <p className="section-subtitle">Four mechanisms working together for consistent, sustainable weight loss.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Appetite Reduction</h3>
              <p>Works on the brain's hunger centers to naturally reduce appetite. You feel satisfied with less food — without willpower battles.</p>
            </div>
            <div className="info-card">
              <h3>Slower Digestion</h3>
              <p>Slows stomach emptying so you feel full longer after meals. No more hunger pangs an hour after eating.</p>
            </div>
            <div className="info-card">
              <h3>Blood Sugar Control</h3>
              <p>Improves blood sugar and insulin sensitivity. Better glucose control means less fat storage and more stable energy.</p>
            </div>
            <div className="info-card">
              <h3>Quiets Food Noise</h3>
              <p>The constant mental chatter about food goes away. Patients report thinking about food less and making better choices effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> PROTOCOLS</div>
          <h2 className="section-title">DOSING & PRICING</h2>
          <p className="section-subtitle">One injection per week. We start low and titrate up based on your response. All-inclusive pricing — medication, supplies, monthly check-ins, dose adjustments, and nutrition guidance.</p>

          <div className="dose-table">
            <div className="dose-row">
              <span className="dose-amount">2.5 mg</span>
              <span className="dose-price">$399/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">5.0 mg</span>
              <span className="dose-price">$549/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">7.5 mg</span>
              <span className="dose-price">$599/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">10.0 mg</span>
              <span className="dose-price">$649/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">12.5 mg</span>
              <span className="dose-price">$699/mo</span>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Baseline Labs Required</strong>
            <p>Before starting, we need baseline labs to ensure this medication is safe and appropriate for you. Essential Panel: $350 / Elite Panel: $750.</p>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
          <h2 className="section-title">HOW TO USE YOUR INJECTIONS</h2>
          <p className="section-subtitle">We teach you at the clinic — most people self-inject at home in under a minute.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Prep</h4>
                <p>Wash your hands. Clean the injection site with an alcohol pad. Take medication out of the fridge a few minutes early to reach room temperature.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Inject</h4>
                <p>Inject subcutaneously (just under the skin) into the abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Same Day Each Week</h4>
                <p>Pick the same day each week for consistency. Set a phone reminder so you never miss a dose.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Rotate Sites</h4>
                <p>Don't inject in the same spot every week. Rotate between abdomen, thighs, and arms to prevent irritation.</p>
              </div>
            </div>
          </div>

          <div className="tip-box">
            <strong>Pro Tips</strong>
            <p>Start low and titrate up slowly to minimize GI side effects. Stay hydrated. Prioritize protein at every meal. If nausea occurs, eat smaller meals more frequently. Store medication in the refrigerator.</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> TIMELINE</div>
          <h2 className="section-title">WHAT TO EXPECT</h2>
          <p className="section-subtitle">Typical weight loss is 15–25% of body weight over 6–12 months, averaging 1–2 lbs per week.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1–2</h4>
              <p>Start low dose. Body adjusts. Appetite begins to reduce. You may notice less food noise.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 3–4</h4>
              <p>Dose increases. Appetite suppression kicks in. Scale starts moving. Energy often improves.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 2–3</h4>
              <p>Optimal dose dialed in. Consistent 1–2 lb/week loss. Clothes start fitting differently.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 4–6</h4>
              <p>In a rhythm. Significant body composition changes. Labs improving. Confidence building.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 6–12</h4>
              <p>Approaching goal weight. Discuss maintenance plan with your provider to keep results long-term.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
          <h2 className="section-title">IMPORTANT SAFETY INFORMATION</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Do Not Use If You:</h4>
              <ul>
                <li>Are pregnant or breastfeeding</li>
                <li>Have a history of medullary thyroid cancer or MEN 2</li>
                <li>Have a history of pancreatitis</li>
                <li>Have severe gastrointestinal disease</li>
                <li>Are allergic to any ingredient</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Nausea (most common, usually temporary)</li>
                <li>Diarrhea or constipation</li>
                <li>Injection site reactions</li>
                <li>Decreased appetite (intended effect)</li>
                <li>Mild fatigue during initial adjustment</li>
              </ul>
              <p className="safety-note">GI side effects are most common when starting or increasing dose. They typically resolve within 1–2 weeks. If severe, contact us.</p>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> Individual results vary. These treatments are not FDA-approved to diagnose, treat, cure, or prevent any disease. All protocols are monitored by licensed providers.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>QUESTIONS? WE'RE HERE.</h2>
          <p>Whether you need a dose adjustment or have questions about your protocol, our team can help.</p>
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
        .dose-table {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          overflow: hidden;
        }
        .dose-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e0e0e0;
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
          color: #808080;
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
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #808080;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }
        .tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        .tip-box p {
          font-size: 0.9rem;
          color: #737373;
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
          content: "\\2715";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }
        .safety-card.effects li::before {
          content: "\\2022";
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
