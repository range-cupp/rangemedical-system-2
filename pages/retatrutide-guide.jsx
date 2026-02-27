import Layout from '../components/Layout';
import Head from 'next/head';

export default function RetatrutideGuide() {
  return (
    <Layout
      title="Retatrutide Weight Loss Guide | Range Medical"
      description="Your guide to retatrutide weight loss therapy. How it works, injection instructions, and what to expect. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Retatrutide Weight Loss Guide",
              "description": "Patient guide for retatrutide weight loss therapy including injection instructions, dosing, and safety information.",
              "url": "https://www.range-medical.com/retatrutide-guide",
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
          <span className="hero-badge">Your Weight Loss Protocol Guide</span>
          <h1>Retatrutide</h1>
          <p className="hero-sub">Everything you need to know about your weight loss medication — how it works, how to inject, and what to expect.</p>
          <div className="hero-dose">
            <div><span>Type:</span> Triple Receptor Agonist</div>
            <div><span>Frequency:</span> 1x per week</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is Retatrutide?</h2>
          <p className="section-subtitle">Retatrutide is a triple receptor agonist — it targets GLP-1, GIP, and glucagon receptors simultaneously. This three-pronged approach addresses hunger, metabolism, and fat burning from multiple angles.</p>
          <p className="body-text">While other medications target one or two pathways, retatrutide works on three. The addition of glucagon receptor activation means your body actively burns more fat for energy — on top of the appetite reduction and improved metabolism.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">Three Pathways, One Medication</h2>
          <p className="section-subtitle">Each receptor plays a different role in weight management.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🧠 GLP-1 Receptor</h3>
              <p>Reduces appetite and slows stomach emptying. You feel full longer and eat less without fighting cravings.</p>
            </div>
            <div className="info-card">
              <h3>⚡ GIP Receptor</h3>
              <p>Improves insulin sensitivity and nutrient processing. Your body handles food more efficiently and stores less fat.</p>
            </div>
            <div className="info-card">
              <h3>🔥 Glucagon Receptor</h3>
              <p>Activates fat burning and increases energy expenditure. Your body uses stored fat for fuel — even at rest.</p>
            </div>
            <div className="info-card">
              <h3>🎯 Together</h3>
              <p>Three biological pathways addressed simultaneously. Appetite reduction + improved metabolism + active fat burning = faster, more sustainable results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Protocols</div>
          <h2 className="section-title">Dosing & Pricing</h2>
          <p className="section-subtitle">One injection per week. Standard protocol increases dose every 4 weeks. All-inclusive pricing — medication, supplies, monthly check-ins, dose adjustments, and nutrition guidance.</p>

          <div className="dose-table">
            <div className="dose-row">
              <span className="dose-amount">2 mg</span>
              <span className="dose-price">$500/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">4 mg</span>
              <span className="dose-price">$600/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">6 mg</span>
              <span className="dose-price">$700/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">8 mg</span>
              <span className="dose-price">$750/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">10 mg</span>
              <span className="dose-price">$800/mo</span>
            </div>
            <div className="dose-row">
              <span className="dose-amount">12 mg</span>
              <span className="dose-price">$850/mo</span>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>📋 Baseline Labs Required</strong>
            <p>Before starting, we need baseline labs to ensure this medication is safe and appropriate for you. Essential Panel: $350 / Elite Panel: $750.</p>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">How to Use Your Injections</h2>
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
            <strong>💡 Pro Tips</strong>
            <p>Titration is critical — standard protocol increases every 4 weeks. Stay hydrated. High-protein diet supports best results. If GI side effects occur, slow the titration. Store medication in the refrigerator.</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Clinical trials showed up to 24% body weight loss at 48 weeks at the highest doses.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1–4</h4>
              <p>Starting dose (2mg). Body adjusts. Early appetite changes begin. Mild GI side effects may occur.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 5–8</h4>
              <p>Dose increases. Noticeable appetite suppression and early weight loss. Energy levels begin improving.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 3–6</h4>
              <p>Therapeutic dose reached. Consistent fat loss. Energy improving. Body composition visibly changing.</p>
            </div>
            <div className="timeline-card">
              <h4>Month 6–12</h4>
              <p>Significant body composition changes. Approaching goal weight. Discuss maintenance plan with your provider.</p>
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
              <p className="safety-note">Retatrutide is currently used off-label/compounded and is not yet FDA-approved. Monitored closely by your provider. GI side effects typically resolve within 1–2 weeks of each dose increase.</p>
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
          <h2>Questions? We're Here.</h2>
          <p>Whether you need a dose adjustment or have questions about your protocol, our team can help.</p>
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
