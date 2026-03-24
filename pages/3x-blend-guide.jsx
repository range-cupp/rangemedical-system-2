import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function ThreeXBlendGuide() {
  return (
    <Layout
      title="3X Blend Guide | Range Medical"
      description="Your guide to the 3X Blend peptide therapy (Tesamorelin, Ipamorelin, MGF). Injection instructions, what to expect, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "3X Blend Peptide Guide",
              "description": "Patient guide for 3X Blend peptide therapy (Tesamorelin, Ipamorelin, MGF) including injection instructions, protocols, and safety information.",
              "url": "https://www.range-medical.com/3x-blend-guide",
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

      <div className="tx-page">
        {/* Hero */}
        <section className="tx-hero">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR PEPTIDE PROTOCOL GUIDE</div>
            <h1>3X BLEND</h1>
            <div className="tx-hero-rule"></div>
            <p className="tx-body-text">Everything you need to know about your peptide therapy — how it works, how to inject, and what to expect.</p>
            <div className="tx-hero-price">$400/month</div>
          </div>
        </section>

        {/* What Are Peptides */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
            <h2>WHAT ARE PEPTIDES?</h2>
            <div className="tx-divider"></div>
            <p className="tx-body-text">Peptides are short chains of amino acids — the building blocks of proteins. They act as natural signals in your body, telling your cells what to do and when to do it.</p>
            <p className="tx-body-text" style={{ marginTop: '1rem' }}>Unlike many medicines that force change, peptides support your body's own processes. Think of them as a boost to what your body already knows how to do.</p>
          </div>
        </section>

        {/* The Blend */}
        <section className="tx-section tx-section-alt">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR BLEND</div>
            <h2>3X BLEND</h2>
            <div className="tx-divider"></div>
            <p className="tx-body-text">Three peptides that work together to help your body release more growth hormone naturally.</p>

            <div className="tx-info-grid">
              <div className="tx-info-card">
                <h3>Tesamorelin</h3>
                <p className="tx-peptide-role">The Main Signal</p>
                <p>Tesamorelin tells your brain to release more growth hormone. It's the primary driver in this blend.</p>
                <ul>
                  <li>Helps reduce belly fat</li>
                  <li>Supports better body composition</li>
                  <li>Studied by the FDA for safety</li>
                </ul>
              </div>
              <div className="tx-info-card">
                <h3>Ipamorelin</h3>
                <p className="tx-peptide-role">The Clean Boost</p>
                <p>Ipamorelin triggers growth hormone release in a gentle, clean way. It doesn't cause the side effects that other options do.</p>
                <ul>
                  <li>Clean growth hormone pulse</li>
                  <li>No cortisol or hunger spikes</li>
                  <li>Well-tolerated by most people</li>
                </ul>
              </div>
              <div className="tx-info-card">
                <h3>MGF</h3>
                <p className="tx-peptide-role">The Repair Helper</p>
                <p>MGF (Mechano Growth Factor) helps your muscles recover faster. It works right where your body needs it most.</p>
                <ul>
                  <li>Speeds up muscle repair</li>
                  <li>Supports tissue healing</li>
                  <li>Works locally at injury sites</li>
                </ul>
              </div>
            </div>

            <div className="tx-combo-box">
              <h3>Why Together?</h3>
              <p>Each peptide does something different. Tesamorelin sends the signal. Ipamorelin amplifies it. MGF helps your body use the extra growth hormone for repair. Together, they work better than any one alone.</p>
            </div>
          </div>
        </section>

        {/* What Growth Hormone Does */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> WHY IT MATTERS</div>
            <h2>WHAT DOES GROWTH HORMONE DO?</h2>
            <div className="tx-divider"></div>
            <p className="tx-body-text">Growth hormone (GH) is something your body makes naturally. It helps you stay lean, recover fast, and feel energized. But as you get older, your body makes less of it.</p>
            <p className="tx-body-text" style={{ marginTop: '1rem' }}>The 3X Blend helps your body release more of its own growth hormone. Here's what that can mean for you:</p>

            <div className="tx-benefits-box">
              <ul>
                <li>Less belly fat, more lean muscle</li>
                <li>Faster recovery after workouts</li>
                <li>Better sleep quality</li>
                <li>More energy during the day</li>
                <li>Healthier-looking skin</li>
                <li>Support for joints and tissues</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to Inject */}
        <section className="tx-section tx-section-alt">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
            <h2>HOW TO USE YOUR INJECTIONS</h2>
            <div className="tx-divider"></div>
            <p className="tx-body-text">We did your first injection together at the clinic. Here's how to stay on track at home.</p>

            <div className="tx-steps-list">
              <div className="tx-step-item">
                <div className="tx-step-number">1</div>
                <div className="tx-step-content">
                  <h4>Prep</h4>
                  <p>Wash your hands. Clean the injection site with an alcohol pad. Take the syringe out of the fridge a few minutes early to let it reach room temperature.</p>
                </div>
              </div>
              <div className="tx-step-item">
                <div className="tx-step-number">2</div>
                <div className="tx-step-content">
                  <h4>Inject</h4>
                  <p>Inject just under the skin (subcutaneous) into a fatty area — lower abdomen, upper thigh, or back of the arm. Pinch the skin, insert at a 45° angle, inject slowly.</p>
                </div>
              </div>
              <div className="tx-step-item">
                <div className="tx-step-number">3</div>
                <div className="tx-step-content">
                  <h4>Rotate Sites</h4>
                  <p>Don't inject in the same spot every day. Rotate between your abdomen, thighs, and arms to prevent irritation and ensure consistent absorption.</p>
                </div>
              </div>
              <div className="tx-step-item">
                <div className="tx-step-number">4</div>
                <div className="tx-step-content">
                  <h4>Dispose Safely</h4>
                  <p>Each syringe is single-use — do not reuse or recap. Dispose in a sharps container or bring used syringes back to the clinic.</p>
                </div>
              </div>
            </div>

            <div className="tx-tip-box">
              <strong>Pro Tips</strong>
              <p>Inject on an empty stomach — no food 45 minutes before or after. Use it 5 days on, 2 days off. Keep syringes refrigerated. Set a daily phone reminder to stay consistent — same time every day keeps peptide levels stable and maximizes results.</p>
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="tx-section tx-section-inverted">
          <div className="tx-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> TIMELINE</div>
            <h2>WHAT TO EXPECT</h2>
            <div className="tx-divider"></div>
            <p className="tx-body-text">Everyone's different, but here's what patients typically experience.</p>

            <div className="tx-timeline-grid">
              <div className="tx-timeline-card">
                <h4>Weeks 1–2</h4>
                <p>Better sleep. More energy when you wake up. Some people feel it right away. Others take a little longer.</p>
              </div>
              <div className="tx-timeline-card">
                <h4>Weeks 3–4</h4>
                <p>Recovery feels faster. You might notice your workouts feel a bit easier. Energy stays more steady through the day.</p>
              </div>
              <div className="tx-timeline-card">
                <h4>Months 2–3</h4>
                <p>Body composition starts to shift. Less fat around the middle. Clothes fit differently. Skin may look healthier.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
            <h2>IMPORTANT SAFETY INFORMATION</h2>
            <div className="tx-divider"></div>

            <div className="tx-safety-grid">
              <div className="tx-safety-card tx-warning">
                <h4>Do Not Use If You Are:</h4>
                <ul>
                  <li>Pregnant or breastfeeding</li>
                  <li>Living with active cancer</li>
                  <li>Managing serious liver, kidney, or heart conditions</li>
                  <li>Dealing with uncontrolled medical conditions</li>
                  <li>Allergic to any ingredient</li>
                </ul>
              </div>
              <div className="tx-safety-card tx-effects">
                <h4>Possible Side Effects:</h4>
                <ul>
                  <li>Mild redness, swelling, or itching at injection site</li>
                  <li>Slight headache or fatigue</li>
                  <li>Tingling in hands or feet (usually temporary)</li>
                  <li>Occasional water retention</li>
                </ul>
                <p className="tx-safety-note">Usually mild and short-lived. If symptoms are moderate or severe, stop use and contact us.</p>
              </div>
            </div>

            <div className="tx-disclaimer">
              <p><strong>Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Handle and store as instructed. Individual results vary based on health status, dosage, and consistency.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="tx-section tx-section-inverted tx-cta-section">
          <div className="tx-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
            <h2>QUESTIONS? WE'RE HERE.</h2>
            <p className="tx-body-text" style={{ textAlign: 'center', margin: '0 auto 2rem' }}>Whether you want to extend your protocol or add other therapies, our team can help.</p>
            <div className="tx-cta-buttons">
              <a href="tel:+19499973988" className="tx-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="tx-btn-outline">TEXT US</a>
            </div>
            <p className="tx-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== 3X BLEND GUIDE V2 EDITORIAL DESIGN ===== */
        .tx-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        .tx-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .tx-section {
          padding: 6rem 2rem;
        }

        .tx-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .tx-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        .tx-page h1 {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1.5rem;
        }

        .tx-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }

        .tx-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .tx-section-inverted h1,
        .tx-section-inverted h2,
        .tx-section-inverted h3,
        .tx-section-inverted h4 {
          color: #ffffff;
        }

        .tx-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .tx-section-inverted .tx-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        .tx-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .tx-section-inverted .tx-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        .tx-hero {
          padding: 6rem 2rem 5rem;
        }

        .tx-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .tx-hero-price {
          display: inline-block;
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .tx-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2rem;
        }

        .tx-info-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
        }

        .tx-info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .tx-peptide-role {
          font-size: 0.8125rem;
          color: #808080;
          margin-bottom: 0.75rem;
        }

        .tx-info-card p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .tx-info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tx-info-card li {
          font-size: 0.8125rem;
          color: #737373;
          padding: 0.3rem 0;
          padding-left: 1.25rem;
          position: relative;
        }

        .tx-info-card li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        .tx-benefits-box {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 1.5rem 2rem;
          margin-top: 1.5rem;
        }

        .tx-benefits-box ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 2rem;
        }

        .tx-benefits-box li {
          font-size: 0.9rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .tx-benefits-box li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        .tx-combo-box {
          background: #1a1a1a;
          color: #ffffff;
          padding: 1.75rem;
          margin-top: 1.5rem;
          text-align: center;
        }

        .tx-combo-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .tx-combo-box p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.7;
        }

        .tx-steps-list {
          margin-top: 2rem;
        }

        .tx-step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .tx-step-item:last-child {
          border-bottom: none;
        }

        .tx-step-number {
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

        .tx-step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .tx-step-content p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
        }

        .tx-tip-box {
          background: #ffffff;
          border-left: 4px solid #1a1a1a;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }

        .tx-tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .tx-tip-box p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        .tx-timeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }

        .tx-timeline-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 1.5rem;
        }

        .tx-timeline-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .tx-timeline-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }

        .tx-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .tx-safety-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
        }

        .tx-safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .tx-safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tx-safety-card li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }

        .tx-safety-card.tx-warning li::before {
          content: "✕";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }

        .tx-safety-card.tx-effects li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        .tx-safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }

        .tx-disclaimer {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .tx-disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        .tx-cta-section {
          text-align: center;
        }

        .tx-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .tx-btn-primary {
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

        .tx-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        .tx-btn-outline {
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

        .tx-btn-outline:hover {
          background: #ffffff;
          color: #1a1a1a;
        }

        .tx-cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
        }

        @media (max-width: 768px) {
          .tx-page h1 {
            font-size: 2rem;
          }

          .tx-page h2 {
            font-size: 1.5rem;
          }

          .tx-hero {
            padding: 3.5rem 2rem;
          }

          .tx-section {
            padding: 3.5rem 1.5rem;
          }

          .tx-section-alt {
            padding: 3.5rem 1.5rem;
          }

          .tx-info-grid,
          .tx-timeline-grid {
            grid-template-columns: 1fr;
          }

          .tx-safety-grid {
            grid-template-columns: 1fr;
          }

          .tx-benefits-box ul {
            grid-template-columns: 1fr;
          }

          .tx-cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
