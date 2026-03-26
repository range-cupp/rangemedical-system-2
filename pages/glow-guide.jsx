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

      <div className="gl-page">
        {/* Hero */}
        <section className="gl-hero">
          <div className="gl-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR PEPTIDE PROTOCOL GUIDE</div>
            <h1>GLOW PEPTIDE BLEND</h1>
            <div className="gl-hero-rule"></div>
            <p className="gl-body-text">Everything you need to know about your skin peptide therapy — how it works, how to inject, and what to expect as your skin rejuvenates.</p>
            <div className="gl-hero-dose">
              <div><span>GHK-Cu:</span> 1.67 mg</div>
              <div><span>BPC-157:</span> 333 mcg</div>
              <div><span>TB500:</span> 333 mcg</div>
            </div>
          </div>
        </section>

        {/* What Are Peptides */}
        <section className="gl-section">
          <div className="gl-container">
            <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
            <h2>WHAT ARE PEPTIDES?</h2>
            <div className="gl-divider"></div>
            <p className="gl-body-text">Peptides are short chains of amino acids — the building blocks of proteins. They act as natural signals in your body, telling your cells what to do and when to do it.</p>
            <p className="gl-body-text" style={{ marginTop: '1rem' }}>Unlike many medicines that force change, peptides support your body's own healing and recovery processes. Think of them as a boost to what your body already knows how to do.</p>
          </div>
        </section>

        {/* The Blend */}
        <section className="gl-section gl-section-alt">
          <div className="gl-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR BLEND</div>
            <h2>GHK-CU + BPC-157 + TB500</h2>
            <div className="gl-divider"></div>
            <p className="gl-body-text">Three peptides that work together to support skin repair, rejuvenation, and a healthy glow.</p>

            <div className="gl-info-grid">
              <div className="gl-info-card">
                <h3>GHK-Cu</h3>
                <p>A copper peptide naturally found in your body that declines with age — known for its powerful skin remodeling properties.</p>
                <ul>
                  <li>Stimulates collagen and elastin production</li>
                  <li>Promotes skin firmness and elasticity</li>
                  <li>Supports wound healing and skin renewal</li>
                </ul>
              </div>
              <div className="gl-info-card">
                <h3>BPC-157</h3>
                <p>Body Protection Compound — supports tissue repair from the inside out, helping your skin heal faster.</p>
                <ul>
                  <li>Accelerates skin tissue repair</li>
                  <li>Improves blood flow to the skin</li>
                  <li>Reduces inflammation and scarring</li>
                </ul>
              </div>
              <div className="gl-info-card">
                <h3>TB500</h3>
                <p>A regenerative peptide that promotes cell migration and new blood vessel growth for healthier skin.</p>
                <ul>
                  <li>Promotes new blood vessel formation</li>
                  <li>Supports cell migration and skin repair</li>
                  <li>Reduces inflammation</li>
                </ul>
              </div>
            </div>

            <div className="gl-combo-box">
              <h3>Why This Blend?</h3>
              <p>GHK-Cu drives collagen remodeling and skin tightening. BPC-157 accelerates tissue repair and improves blood flow. TB500 promotes cell migration and reduces inflammation. Together, they address skin rejuvenation from multiple angles — rebuilding structure, boosting circulation, and calming inflammation for a visible, lasting glow.</p>
            </div>
          </div>
        </section>

        {/* How to Inject */}
        <section className="gl-section gl-section-alt">
          <div className="gl-container">
            <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
            <h2>HOW TO USE YOUR INJECTIONS</h2>
            <div className="gl-divider"></div>
            <p className="gl-body-text">We did your first injection together at the clinic. Here's how to stay on track at home.</p>

            <div className="gl-steps-list">
              <div className="gl-step-item">
                <div className="gl-step-number">1</div>
                <div className="gl-step-content">
                  <h4>Prep</h4>
                  <p>Wash your hands. Clean the injection site with an alcohol pad. Take the syringe out of the fridge a few minutes early to let it reach room temperature.</p>
                </div>
              </div>
              <div className="gl-step-item">
                <div className="gl-step-number">2</div>
                <div className="gl-step-content">
                  <h4>Inject</h4>
                  <p>Inject just under the skin (subcutaneous) into a fatty area — lower abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.</p>
                </div>
              </div>
              <div className="gl-step-item">
                <div className="gl-step-number">3</div>
                <div className="gl-step-content">
                  <h4>Rotate Sites</h4>
                  <p>Don't inject in the same spot every day. Rotate between your abdomen, thighs, and arms to prevent irritation and ensure consistent absorption.</p>
                </div>
              </div>
              <div className="gl-step-item">
                <div className="gl-step-number">4</div>
                <div className="gl-step-content">
                  <h4>Dispose Safely</h4>
                  <p>Each syringe is single-use — do not reuse or recap. Dispose in a sharps container or bring used syringes back to the clinic.</p>
                </div>
              </div>
            </div>

            <div className="gl-tip-box">
              <strong>Pro Tips</strong>
              <p>Keep syringes refrigerated. Set a daily phone reminder to stay consistent — same time every day (morning or evening) keeps peptide levels stable and maximizes results. Mild redness at the injection site is normal and should fade quickly.</p>
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="gl-section gl-section-inverted">
          <div className="gl-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> TIMELINE</div>
            <h2>WHAT TO EXPECT</h2>
            <div className="gl-divider"></div>
            <p className="gl-body-text">Everyone's different, but here's what patients typically experience.</p>

            <div className="gl-timeline-grid">
              <div className="gl-timeline-card">
                <h4>Weeks 1–2</h4>
                <p>Improved skin healing and texture. Reduced redness and irritation. Skin may feel smoother and more hydrated as peptides begin working at the cellular level.</p>
              </div>
              <div className="gl-timeline-card">
                <h4>Weeks 3–4</h4>
                <p>Visible improvements in skin tone and firmness. Enhanced glow and radiance. Continued collagen remodeling leads to tighter, more youthful-looking skin. Some patients also notice improved hair quality.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="gl-section">
          <div className="gl-container">
            <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
            <h2>IMPORTANT SAFETY INFORMATION</h2>
            <div className="gl-divider"></div>

            <div className="gl-safety-grid">
              <div className="gl-safety-card gl-warning">
                <h4>Do Not Use If You Are:</h4>
                <ul>
                  <li>Pregnant or breastfeeding</li>
                  <li>Living with active cancer</li>
                  <li>Managing serious liver, kidney, or heart conditions</li>
                  <li>Dealing with uncontrolled medical conditions</li>
                  <li>Allergic to any ingredient</li>
                </ul>
              </div>
              <div className="gl-safety-card gl-effects">
                <h4>Possible Side Effects:</h4>
                <ul>
                  <li>Mild redness, swelling, or itching at injection site</li>
                  <li>Temporary skin flushing (common with GHK-Cu)</li>
                  <li>Slight headache or fatigue</li>
                  <li>Occasional nausea or lightheadedness</li>
                </ul>
                <p className="gl-safety-note">Usually mild and short-lived. If symptoms are moderate or severe, stop use and contact us.</p>
              </div>
            </div>

            <div className="gl-disclaimer">
              <p><strong>Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Handle and store as instructed. Individual results vary based on health status, dosage, and consistency.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="gl-section gl-section-inverted gl-cta-section">
          <div className="gl-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
            <h2>QUESTIONS? WE'RE HERE.</h2>
            <p className="gl-body-text" style={{ textAlign: 'center', margin: '0 auto 2rem' }}>Whether you want to extend your protocol or add other therapies, our team can help.</p>
            <div className="gl-cta-buttons">
              <a href="tel:+19499973988" className="gl-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="gl-btn-outline">TEXT US</a>
            </div>
            <p className="gl-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== GLOW GUIDE V2 EDITORIAL DESIGN ===== */
        .gl-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        .gl-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .gl-section {
          padding: 6rem 2rem;
        }

        .gl-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .gl-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines */
        .gl-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1.5rem;
        }

        .gl-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }

        .gl-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .gl-section-inverted h1,
        .gl-section-inverted h2,
        .gl-section-inverted h3,
        .gl-section-inverted h4 {
          color: #ffffff;
        }

        /* Body Text */
        .gl-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .gl-section-inverted .gl-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .gl-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .gl-section-inverted .gl-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Hero */
        .gl-hero {
          padding: 6rem 2rem 5rem;
        }

        .gl-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .gl-hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #737373;
        }

        .gl-hero-dose span {
          font-weight: 600;
          color: #171717;
        }

        /* Info Grid */
        .gl-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .gl-info-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.75rem;
        }

        .gl-info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .gl-info-card p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .gl-info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .gl-info-card li {
          font-size: 0.9rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
        }

        .gl-info-card li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        /* Combo Box */
        .gl-combo-box {
          background: #1a1a1a;
          color: #ffffff;
          padding: 1.75rem;
          margin-top: 1.5rem;
          text-align: center;
        }

        .gl-combo-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .gl-combo-box p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.7;
        }

        /* Steps */
        .gl-steps-list {
          margin-top: 2rem;
        }

        .gl-step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .gl-step-item:last-child {
          border-bottom: none;
        }

        .gl-step-number {
          width: 2rem;
          height: 2rem;
          background: #1a1a1a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .gl-step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .gl-step-content p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Tip Box */
        .gl-tip-box {
          background: #ffffff;
          border-left: 4px solid #1a1a1a;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }

        .gl-tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .gl-tip-box p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* Timeline */
        .gl-timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2rem;
        }

        .gl-timeline-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 1.5rem;
        }

        .gl-timeline-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .gl-timeline-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }

        /* Safety */
        .gl-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .gl-safety-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
        }

        .gl-safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .gl-safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .gl-safety-card li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }

        .gl-safety-card.gl-warning li::before {
          content: "✕";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }

        .gl-safety-card.gl-effects li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        .gl-safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }

        /* Disclaimer */
        .gl-disclaimer {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .gl-disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA */
        .gl-cta-section {
          text-align: center;
        }

        .gl-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .gl-btn-primary {
          display: inline-block;
          background: #ffffff;
          color: #1a1a1a;
          padding: 0.875rem 2rem;
          text-decoration: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: background 0.2s, transform 0.2s;
        }

        .gl-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        .gl-btn-outline {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 2rem;
          border: 1px solid rgba(255,255,255,0.3);
          text-decoration: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }

        .gl-btn-outline:hover {
          background: #ffffff;
          color: #1a1a1a;
        }

        .gl-cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gl-page h1 {
            font-size: 2rem;
          }

          .gl-page h2 {
            font-size: 1.5rem;
          }

          .gl-hero {
            padding: 3.5rem 2rem;
          }

          .gl-hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }

          .gl-section {
            padding: 3.5rem 1.5rem;
          }

          .gl-section-alt {
            padding: 3.5rem 1.5rem;
          }

          .gl-info-grid,
          .gl-safety-grid,
          .gl-timeline-grid {
            grid-template-columns: 1fr;
          }

          .gl-cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
