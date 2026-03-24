import Layout from '../components/Layout';
import Head from 'next/head';

export default function RecoveryBlendGuide() {
  return (
    <Layout
      title="Recovery Blend Guide — BPC-157 / TB-500 / KPV / MGF | Range Medical"
      description="Your guide to the Recovery Blend peptide protocol — BPC-157, TB-500, KPV, and MGF. Injection instructions, what to expect, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Recovery Blend Peptide Guide — BPC-157, TB-500, KPV, MGF",
              "description": "Patient guide for the Recovery Blend peptide therapy including BPC-157, TB-500, KPV, and MGF injection instructions, protocol details, and safety information.",
              "url": "https://www.range-medical.com/recovery-blend-guide",
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

      <div className="rb-page">
        {/* Hero */}
        <section className="rb-hero">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR PEPTIDE PROTOCOL GUIDE</div>
            <h1>RECOVERY BLEND</h1>
            <div className="rb-hero-rule"></div>
            <p className="rb-body-text">Everything you need to know about your peptide therapy — how it works, how to inject, and what to expect as you heal.</p>
            <div className="rb-hero-dose">
              <div><span>BPC-157</span></div>
              <div><span>TB-500</span></div>
              <div><span>KPV</span></div>
              <div><span>MGF</span></div>
            </div>
          </div>
        </section>

        {/* What Are Peptides */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
            <h2>WHAT ARE PEPTIDES?</h2>
            <div className="rb-divider"></div>
            <p className="rb-body-text">Peptides are short chains of amino acids — the building blocks of proteins. They act as natural signals in your body, telling your cells what to do and when to do it.</p>
            <p className="rb-body-text" style={{ marginTop: '1rem' }}>Unlike many medicines that force change, peptides support your body's own healing and recovery processes. Think of them as a boost to what your body already knows how to do.</p>
          </div>
        </section>

        {/* The Blend */}
        <section className="rb-section rb-section-alt">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR BLEND</div>
            <h2>BPC-157 + TB-500 + KPV + MGF</h2>
            <div className="rb-divider"></div>
            <p className="rb-body-text">Four peptides that work together to support deep tissue recovery, reduce inflammation, and accelerate healing.</p>

            <div className="rb-info-grid">
              <div className="rb-info-card">
                <h3>BPC-157</h3>
                <p>Body Protection Compound — found naturally in the stomach and known for its tissue repair properties.</p>
                <ul>
                  <li>Supports tendon, ligament, and muscle repair</li>
                  <li>Improves blood flow to injured tissue</li>
                  <li>May accelerate wound healing</li>
                </ul>
              </div>
              <div className="rb-info-card">
                <h3>TB-500</h3>
                <p>Thymosin Beta-500 — a regenerative peptide involved in tissue repair throughout the body.</p>
                <ul>
                  <li>Promotes new blood vessel growth</li>
                  <li>Supports cell migration and repair</li>
                  <li>Reduces inflammation</li>
                </ul>
              </div>
              <div className="rb-info-card">
                <h3>KPV</h3>
                <p>A powerful anti-inflammatory tripeptide derived from alpha-MSH — your body's natural inflammation regulator.</p>
                <ul>
                  <li>Strong anti-inflammatory properties</li>
                  <li>Supports gut lining repair and healing</li>
                  <li>Modulates immune response</li>
                </ul>
              </div>
              <div className="rb-info-card">
                <h3>MGF</h3>
                <p>Mechano Growth Factor — a variant of IGF-1 that activates muscle stem cells and promotes tissue repair.</p>
                <ul>
                  <li>Activates satellite cells for muscle repair</li>
                  <li>Supports recovery from exercise and injury</li>
                  <li>Promotes new tissue growth</li>
                </ul>
              </div>
            </div>

            <div className="rb-combo-box">
              <h3>Why This Blend?</h3>
              <p>BPC-157 drives direct tissue repair. TB-500 improves blood flow and cell migration. KPV calms systemic inflammation. MGF activates muscle stem cells for deep tissue recovery. Together, they address healing from every angle — repairing damaged tissue, building new blood supply, calming inflammation, and regenerating muscle.</p>
            </div>
          </div>
        </section>

        {/* Protocol Options */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> PROTOCOLS</div>
            <h2>CHOOSE YOUR PROTOCOL</h2>
            <div className="rb-divider"></div>
            <p className="rb-body-text">Pre-filled, single-use syringes delivered to your door. One injection per day.</p>

            <div className="rb-protocol-grid">
              <div className="rb-protocol-card">
                <div className="rb-protocol-days">10-Day</div>
                <div className="rb-protocol-price">$275</div>
                <p className="rb-protocol-desc">Starter protocol for recent injuries, flare-ups, or first-time users. Many notice improvement within this window.</p>
              </div>
              <div className="rb-protocol-card">
                <div className="rb-protocol-days">20-Day</div>
                <div className="rb-protocol-price">$500</div>
                <p className="rb-protocol-desc">Extended healing for moderate injuries. Builds on initial progress with continued support.</p>
              </div>
              <div className="rb-protocol-card rb-featured">
                <span className="rb-protocol-badge">Best Value</span>
                <div className="rb-protocol-days">30-Day</div>
                <div className="rb-protocol-price">$725</div>
                <p className="rb-protocol-desc">Advanced protocol for chronic issues, post-surgery recovery, or athletes in training.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Inject */}
        <section className="rb-section rb-section-alt">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
            <h2>HOW TO USE YOUR INJECTIONS</h2>
            <div className="rb-divider"></div>
            <p className="rb-body-text">We did your first injection together at the clinic. Here's how to stay on track at home.</p>

            <div className="rb-steps-list">
              <div className="rb-step-item">
                <div className="rb-step-number">1</div>
                <div className="rb-step-content">
                  <h4>Prep</h4>
                  <p>Wash your hands. Clean the injection site with an alcohol pad. Take the syringe out of the fridge a few minutes early to let it reach room temperature.</p>
                </div>
              </div>
              <div className="rb-step-item">
                <div className="rb-step-number">2</div>
                <div className="rb-step-content">
                  <h4>Inject</h4>
                  <p>Inject just under the skin (subcutaneous) into a fatty area — lower abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.</p>
                </div>
              </div>
              <div className="rb-step-item">
                <div className="rb-step-number">3</div>
                <div className="rb-step-content">
                  <h4>Rotate Sites</h4>
                  <p>Don't inject in the same spot every day. Rotate between your abdomen, thighs, and arms to prevent irritation and ensure consistent absorption.</p>
                </div>
              </div>
              <div className="rb-step-item">
                <div className="rb-step-number">4</div>
                <div className="rb-step-content">
                  <h4>Dispose Safely</h4>
                  <p>Each syringe is single-use — do not reuse or recap. Dispose in a sharps container or bring used syringes back to the clinic.</p>
                </div>
              </div>
            </div>

            <div className="rb-tip-box">
              <strong>Pro Tips</strong>
              <p>Keep syringes refrigerated. Set a daily phone reminder to stay consistent — same time every day (morning or evening) keeps peptide levels stable and maximizes healing. Mild redness at the injection site is normal and should fade quickly.</p>
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="rb-section rb-section-inverted">
          <div className="rb-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> TIMELINE</div>
            <h2>WHAT TO EXPECT</h2>
            <div className="rb-divider"></div>
            <p className="rb-body-text">Everyone's different, but here's what patients typically experience.</p>

            <div className="rb-timeline-grid">
              <div className="rb-timeline-card">
                <h4>Days 1-10</h4>
                <p>Reduced swelling and inflammation. Improved mobility. Many notice less pain during daily activities as KPV calms inflammation while BPC-157 begins tissue repair.</p>
              </div>
              <div className="rb-timeline-card">
                <h4>Days 10-30</h4>
                <p>Deeper healing and tissue regeneration. MGF activates muscle stem cells while TB-500 builds new blood supply to injured areas. Consistency compounds — the longer you stay on protocol, the more benefit you build.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
            <h2>IMPORTANT SAFETY INFORMATION</h2>
            <div className="rb-divider"></div>

            <div className="rb-safety-grid">
              <div className="rb-safety-card rb-warning">
                <h4>Do Not Use If You Are:</h4>
                <ul>
                  <li>Pregnant or breastfeeding</li>
                  <li>Living with active cancer</li>
                  <li>Managing serious liver, kidney, or heart conditions</li>
                  <li>Dealing with uncontrolled medical conditions</li>
                  <li>Allergic to any ingredient</li>
                </ul>
              </div>
              <div className="rb-safety-card rb-effects">
                <h4>Possible Side Effects:</h4>
                <ul>
                  <li>Mild redness, swelling, or itching at injection site</li>
                  <li>Slight headache or fatigue</li>
                  <li>Occasional nausea or lightheadedness</li>
                </ul>
                <p className="rb-safety-note">Usually mild and short-lived. If symptoms are moderate or severe, stop use and contact us.</p>
              </div>
            </div>

            <div className="rb-disclaimer">
              <p><strong>Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Handle and store as instructed. Individual results vary based on health status, dosage, and consistency.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="rb-section rb-section-inverted rb-cta-section">
          <div className="rb-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
            <h2>QUESTIONS? WE'RE HERE.</h2>
            <p className="rb-body-text" style={{ textAlign: 'center', margin: '0 auto 2rem' }}>Whether you want to extend your protocol or add other therapies, our team can help.</p>
            <div className="rb-cta-buttons">
              <a href="tel:+19499973988" className="rb-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="rb-btn-outline">TEXT US</a>
            </div>
            <p className="rb-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== RECOVERY BLEND GUIDE V2 EDITORIAL DESIGN ===== */
        .rb-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        .rb-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .rb-section {
          padding: 6rem 2rem;
        }

        .rb-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .rb-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines */
        .rb-page h1 {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1.5rem;
        }

        .rb-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }

        .rb-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .rb-section-inverted h1,
        .rb-section-inverted h2,
        .rb-section-inverted h3,
        .rb-section-inverted h4 {
          color: #ffffff;
        }

        /* Body Text */
        .rb-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .rb-section-inverted .rb-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .rb-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .rb-section-inverted .rb-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Hero */
        .rb-hero {
          padding: 6rem 2rem 5rem;
        }

        .rb-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .rb-hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #737373;
        }

        .rb-hero-dose span {
          font-weight: 600;
          color: #171717;
        }

        /* Info Grid */
        .rb-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .rb-info-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.75rem;
        }

        .rb-info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .rb-info-card p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .rb-info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .rb-info-card li {
          font-size: 0.9rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
        }

        .rb-info-card li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        /* Combo Box */
        .rb-combo-box {
          background: #1a1a1a;
          color: #ffffff;
          padding: 1.75rem;
          margin-top: 1.5rem;
          text-align: center;
        }

        .rb-combo-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .rb-combo-box p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.7;
        }

        /* Protocol Grid */
        .rb-protocol-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }

        .rb-protocol-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
          text-align: center;
          transition: border-color 0.2s;
        }

        .rb-protocol-card:hover {
          border-color: #1a1a1a;
        }

        .rb-protocol-card.rb-featured {
          border: 2px solid #1a1a1a;
          position: relative;
        }

        .rb-protocol-badge {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rb-protocol-days {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .rb-protocol-price {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
        }

        .rb-protocol-desc {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Steps */
        .rb-steps-list {
          margin-top: 2rem;
        }

        .rb-step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .rb-step-item:last-child {
          border-bottom: none;
        }

        .rb-step-number {
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

        .rb-step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .rb-step-content p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Tip Box */
        .rb-tip-box {
          background: #ffffff;
          border-left: 4px solid #1a1a1a;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }

        .rb-tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .rb-tip-box p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* Timeline */
        .rb-timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 2rem;
        }

        .rb-timeline-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 1.5rem;
        }

        .rb-timeline-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .rb-timeline-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }

        /* Safety */
        .rb-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .rb-safety-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
        }

        .rb-safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .rb-safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .rb-safety-card li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }

        .rb-safety-card.rb-warning li::before {
          content: "✕";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }

        .rb-safety-card.rb-effects li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        .rb-safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }

        /* Disclaimer */
        .rb-disclaimer {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .rb-disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA */
        .rb-cta-section {
          text-align: center;
        }

        .rb-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .rb-btn-primary {
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

        .rb-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        .rb-btn-outline {
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

        .rb-btn-outline:hover {
          background: #ffffff;
          color: #1a1a1a;
        }

        .rb-cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rb-page h1 {
            font-size: 2rem;
          }

          .rb-page h2 {
            font-size: 1.5rem;
          }

          .rb-hero {
            padding: 3.5rem 2rem;
          }

          .rb-hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }

          .rb-section {
            padding: 3.5rem 1.5rem;
          }

          .rb-section-alt {
            padding: 3.5rem 1.5rem;
          }

          .rb-info-grid,
          .rb-safety-grid,
          .rb-timeline-grid {
            grid-template-columns: 1fr;
          }

          .rb-protocol-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .rb-protocol-card.rb-featured {
            order: -1;
          }

          .rb-cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
