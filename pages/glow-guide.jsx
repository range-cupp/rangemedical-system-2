import Layout from '../components/Layout';
import Head from 'next/head';

export default function GlowGuide() {
  return (
    <Layout
      title="GLOW Peptide Blend Guide | Range Medical"
      description="Your guide to the GLOW skin peptide protocol — GHK-Cu, BPC-157, and TB500 for skin rejuvenation. Injection instructions, what to expect, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "GLOW Peptide Blend Guide",
              "description": "Patient guide for GLOW skin peptide therapy including GHK-Cu, BPC-157, and TB500 injection instructions, protocol details, and safety information.",
              "url": "https://www.range-medical.com/glow-guide",
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
          <span className="hero-badge">Your Peptide Protocol Guide</span>
          <h1>GLOW Peptide Blend</h1>
          <p className="hero-sub">Everything you need to know about your skin peptide therapy — how it works, how to inject, and what to expect as your skin rejuvenates.</p>
          <div className="hero-dose">
            <div><span>GHK-Cu:</span> 1.67 mg</div>
            <div><span>BPC-157:</span> 333 mcg</div>
            <div><span>TB500:</span> 333 mcg</div>
          </div>
        </div>
      </section>

      {/* What Are Peptides */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Are Peptides?</h2>
          <p className="section-subtitle">Peptides are short chains of amino acids — the building blocks of proteins. They act as natural signals in your body, telling your cells what to do and when to do it.</p>
          <p className="body-text">Unlike many medicines that force change, peptides support your body's own healing and recovery processes. Think of them as a boost to what your body already knows how to do.</p>
        </div>
      </section>

      {/* The Blend */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Blend</div>
          <h2 className="section-title">GHK-Cu + BPC-157 + TB500</h2>
          <p className="section-subtitle">Three peptides that work together to support skin repair, rejuvenation, and a healthy glow.</p>

          <div className="info-grid-three">
            <div className="info-card">
              <h3>✨ GHK-Cu</h3>
              <p>A copper peptide naturally found in your body that declines with age — known for its powerful skin remodeling properties.</p>
              <ul>
                <li>Stimulates collagen and elastin production</li>
                <li>Promotes skin firmness and elasticity</li>
                <li>Supports wound healing and skin renewal</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>🧬 BPC-157</h3>
              <p>Body Protection Compound — supports tissue repair from the inside out, helping your skin heal faster.</p>
              <ul>
                <li>Accelerates skin tissue repair</li>
                <li>Improves blood flow to the skin</li>
                <li>Reduces inflammation and scarring</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>⚡ TB500</h3>
              <p>A regenerative peptide that promotes cell migration and new blood vessel growth for healthier skin.</p>
              <ul>
                <li>Promotes new blood vessel formation</li>
                <li>Supports cell migration and skin repair</li>
                <li>Reduces inflammation</li>
              </ul>
            </div>
          </div>

          <div className="combo-box">
            <h3>Why This Blend?</h3>
            <p>GHK-Cu drives collagen remodeling and skin tightening. BPC-157 accelerates tissue repair and improves blood flow. TB500 promotes cell migration and reduces inflammation. Together, they address skin rejuvenation from multiple angles — rebuilding structure, boosting circulation, and calming inflammation for a visible, lasting glow.</p>
          </div>
        </div>
      </section>

      {/* How to Inject */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">How to Use Your Injections</h2>
          <p className="section-subtitle">We did your first injection together at the clinic. Here's how to stay on track at home.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Prep</h4>
                <p>Wash your hands. Clean the injection site with an alcohol pad. Take the syringe out of the fridge a few minutes early to let it reach room temperature.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Inject</h4>
                <p>Inject just under the skin (subcutaneous) into a fatty area — lower abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Rotate Sites</h4>
                <p>Don't inject in the same spot every day. Rotate between your abdomen, thighs, and arms to prevent irritation and ensure consistent absorption.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Dispose Safely</h4>
                <p>Each syringe is single-use — do not reuse or recap. Dispose in a sharps container or bring used syringes back to the clinic.</p>
              </div>
            </div>
          </div>

          <div className="tip-box">
            <strong>💡 Pro Tips</strong>
            <p>Keep syringes refrigerated. Set a daily phone reminder to stay consistent — same time every day (morning or evening) keeps peptide levels stable and maximizes results. Mild redness at the injection site is normal and should fade quickly.</p>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Everyone's different, but here's what patients typically experience.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Weeks 1–2</h4>
              <p>Improved skin healing and texture. Reduced redness and irritation. Skin may feel smoother and more hydrated as peptides begin working at the cellular level.</p>
            </div>
            <div className="timeline-card">
              <h4>Weeks 3–4</h4>
              <p>Visible improvements in skin tone and firmness. Enhanced glow and radiance. Continued collagen remodeling leads to tighter, more youthful-looking skin. Some patients also notice improved hair quality.</p>
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
              <h4>Do Not Use If You Are:</h4>
              <ul>
                <li>Pregnant or breastfeeding</li>
                <li>Living with active cancer</li>
                <li>Managing serious liver, kidney, or heart conditions</li>
                <li>Dealing with uncontrolled medical conditions</li>
                <li>Allergic to any ingredient</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild redness, swelling, or itching at injection site</li>
                <li>Temporary skin flushing (common with GHK-Cu)</li>
                <li>Slight headache or fatigue</li>
                <li>Occasional nausea or lightheadedness</li>
              </ul>
              <p className="safety-note">Usually mild and short-lived. If symptoms are moderate or severe, stop use and contact us.</p>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Handle and store as instructed. Individual results vary based on health status, dosage, and consistency.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you want to extend your protocol or add other therapies, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
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

        /* Info Grid - Three Column */
        .info-grid-three {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
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
          margin-bottom: 1rem;
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

        /* Steps */
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

        /* Tip Box */
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

        /* Timeline */
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

        /* Disclaimer */
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

          .info-grid-three,
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
