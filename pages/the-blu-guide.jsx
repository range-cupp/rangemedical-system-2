import Layout from '../components/Layout';
import Head from 'next/head';

export default function TheBluGuide() {
  return (
    <Layout
      title="The Blu — Methylene Blue Sublingual Guide | Range Medical"
      description="Your guide to The Blu sublingual methylene blue. Mitochondrial support you can take at home. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "The Blu — Methylene Blue Sublingual Guide",
              "description": "Patient guide for The Blu sublingual methylene blue including usage instructions and safety information.",
              "url": "https://www.range-medical.com/the-blu-guide",
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

      <div className="blu-page">
        {/* Hero */}
        <section className="blu-hero">
          <div className="blu-container">
            <div className="v2-label"><span className="v2-dot" /> YOUR METHYLENE BLUE GUIDE</div>
            <h1>THE BLU — METHYLENE BLUE SUBLINGUAL</h1>
            <div className="blu-hero-rule"></div>
            <p className="blu-body-text">Everything you need to know about your sublingual methylene blue — mitochondrial support you can take at home.</p>
            <div className="blu-hero-dose">
              <div><span>Price:</span> $197</div>
              <div><span>Type:</span> Sublingual drops</div>
            </div>
          </div>
        </section>

        {/* The Basics */}
        <section className="blu-section">
          <div className="blu-container">
            <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
            <h2>WHAT IS THE BLU?</h2>
            <div className="blu-divider"></div>
            <p className="blu-body-text">The Blu is a sublingual (under the tongue) methylene blue formula designed for at-home use. Same mitochondrial benefits as the IV — in a convenient daily format.</p>
            <p className="blu-body-text" style={{ marginTop: '1rem' }}>Methylene blue supports your mitochondrial electron transport chain — the process your cells use to create energy. Sublingual delivery allows faster absorption than oral capsules, getting into your bloodstream quickly and efficiently.</p>
          </div>
        </section>

        {/* How It Works */}
        <section className="blu-section blu-section-alt">
          <div className="blu-container">
            <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
            <h2>WHAT METHYLENE BLUE DOES</h2>
            <div className="blu-divider"></div>
            <p className="blu-body-text">Cellular energy and cognitive support in every drop.</p>

            <div className="blu-info-grid">
              <div className="blu-info-card">
                <h3>Mitochondrial Support</h3>
                <p>Supports the mitochondrial electron transport chain — helping your cells produce energy more efficiently, even when normal pathways are impaired.</p>
              </div>
              <div className="blu-info-card">
                <h3>Brain Clarity</h3>
                <p>Crosses the blood-brain barrier for direct cognitive support. Many patients report sharper focus, better memory, and reduced brain fog.</p>
              </div>
              <div className="blu-info-card">
                <h3>Antioxidant Defense</h3>
                <p>Acts as an antioxidant, protecting cells from oxidative damage. Supports neuroprotection and cellular longevity.</p>
              </div>
              <div className="blu-info-card">
                <h3>ATP Production</h3>
                <p>Supports ATP production — the energy currency every cell needs. More efficient energy production means better performance across your entire body.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="blu-section">
          <div className="blu-container">
            <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
            <h2>HOW TO USE THE BLU</h2>
            <div className="blu-divider"></div>
            <p className="blu-body-text">Simple daily use — takes less than a minute.</p>

            <div className="blu-steps-list">
              <div className="blu-step-item">
                <div className="blu-step-number">1</div>
                <div className="blu-step-content">
                  <h4>Place Drops Under Tongue</h4>
                  <p>Place the prescribed number of drops under your tongue as directed by your provider.</p>
                </div>
              </div>
              <div className="blu-step-item">
                <div className="blu-step-number">2</div>
                <div className="blu-step-content">
                  <h4>Hold for 30–60 Seconds</h4>
                  <p>Hold under your tongue for 30–60 seconds before swallowing. This allows sublingual absorption directly into your bloodstream.</p>
                </div>
              </div>
              <div className="blu-step-item">
                <div className="blu-step-number">3</div>
                <div className="blu-step-content">
                  <h4>Take in the Morning</h4>
                  <p>Take in the morning for best results. Methylene blue may be energizing — taking it later in the day could affect sleep.</p>
                </div>
              </div>
              <div className="blu-step-item">
                <div className="blu-step-number">4</div>
                <div className="blu-step-content">
                  <h4>Expect the Blue</h4>
                  <p>Your lips, tongue, and mouth will temporarily turn blue. Blue-green urine is also normal. Both are harmless and expected.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="blu-section blu-section-inverted">
          <div className="blu-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> TIMELINE</div>
            <h2>WHAT TO EXPECT</h2>
            <div className="blu-divider"></div>
            <p className="blu-body-text">Benefits build with consistent daily use.</p>

            <div className="blu-timeline-grid">
              <div className="blu-timeline-card">
                <h4>First Use</h4>
                <p>Some notice improved focus and alertness within hours. Your cells are getting immediate mitochondrial support.</p>
              </div>
              <div className="blu-timeline-card">
                <h4>Week 1–2</h4>
                <p>More consistent energy and mental clarity. The cumulative effect of daily mitochondrial support begins to show.</p>
              </div>
              <div className="blu-timeline-card">
                <h4>Month 1+</h4>
                <p>Cumulative mitochondrial support. Sustained improvements in energy, focus, and cognitive performance.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="blu-section">
          <div className="blu-container">
            <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
            <h2>IMPORTANT SAFETY INFORMATION</h2>
            <div className="blu-divider"></div>

            <div className="blu-safety-grid">
              <div className="blu-safety-card blu-warning">
                <h4>Do NOT Use If You:</h4>
                <ul>
                  <li>Take SSRIs, SNRIs, or MAOIs</li>
                  <li>Take other serotonergic medications</li>
                  <li>Have G6PD deficiency</li>
                  <li>Are pregnant or breastfeeding</li>
                </ul>
              </div>
              <div className="blu-safety-card blu-effects">
                <h4>Expected Effects:</h4>
                <ul>
                  <li>Blue discoloration of mouth, lips, tongue (temporary)</li>
                  <li>Blue-green urine (normal)</li>
                  <li>Possible mild energizing effect</li>
                </ul>
                <p className="blu-safety-note">Inform your provider of ALL medications before use. The blue discoloration is completely harmless and expected.</p>
              </div>
            </div>

            <div className="blu-disclaimer">
              <p><strong>Important:</strong> Individual results vary. These treatments are not FDA-approved to diagnose, treat, cure, or prevent any disease.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="blu-section blu-section-inverted blu-cta-section">
          <div className="blu-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
            <h2>QUESTIONS? WE'RE HERE.</h2>
            <p className="blu-body-text" style={{ textAlign: 'center', margin: '0 auto 2rem' }}>Whether you have questions about dosing or want to explore other therapies, our team can help.</p>
            <div className="blu-cta-buttons">
              <a href="tel:+19499973988" className="blu-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="blu-btn-outline">TEXT US</a>
            </div>
            <p className="blu-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .blu-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #171717; overflow-x: hidden; }
        .blu-container { max-width: 800px; margin: 0 auto; padding: 0 2rem; }
        .blu-section { padding: 6rem 2rem; }
        .blu-section-alt { background: #fafafa; padding: 6rem 2rem; }
        .blu-section-inverted { background: #1a1a1a; color: #ffffff; }
        .blu-page h1 { font-size: 2.75rem; font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: #171717; margin-bottom: 1.5rem; }
        .blu-page h2 { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; line-height: 0.95; text-transform: uppercase; color: #171717; margin-bottom: 1rem; }
        .blu-page h3 { font-size: 1.125rem; font-weight: 700; color: #171717; }
        .blu-section-inverted h1, .blu-section-inverted h2, .blu-section-inverted h3, .blu-section-inverted h4 { color: #ffffff; }
        .blu-body-text { font-size: 1.0625rem; font-weight: 400; line-height: 1.7; color: #737373; max-width: 600px; }
        .blu-section-inverted .blu-body-text { color: rgba(255, 255, 255, 0.55); }
        .blu-divider { width: 48px; height: 1px; background: #e0e0e0; margin: 1.25rem 0; }
        .blu-section-inverted .blu-divider { background: rgba(255, 255, 255, 0.12); }
        .blu-hero { padding: 6rem 2rem 5rem; }
        .blu-hero-rule { width: 48px; height: 1px; background: #e0e0e0; margin-bottom: 1.5rem; }
        .blu-hero-dose { display: inline-flex; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e0e0e0; font-size: 0.9rem; color: #737373; }
        .blu-hero-dose span { font-weight: 600; color: #171717; }
        .blu-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
        .blu-info-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.75rem; }
        .blu-info-card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; }
        .blu-info-card p { font-size: 0.9rem; color: #737373; line-height: 1.7; }
        .blu-steps-list { margin-top: 2rem; }
        .blu-step-item { display: flex; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid #e0e0e0; }
        .blu-step-item:last-child { border-bottom: none; }
        .blu-step-number { width: 2rem; height: 2rem; background: #1a1a1a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
        .blu-step-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .blu-step-content p { font-size: 0.9rem; color: #737373; line-height: 1.6; }
        .blu-timeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
        .blu-timeline-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 1.5rem; }
        .blu-timeline-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .blu-timeline-card p { font-size: 0.875rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
        .blu-safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
        .blu-safety-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.5rem; }
        .blu-safety-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #171717; }
        .blu-safety-card ul { list-style: none; padding: 0; margin: 0; }
        .blu-safety-card li { font-size: 0.875rem; color: #737373; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
        .blu-safety-card.blu-warning li::before { content: "✕"; position: absolute; left: 0; color: #171717; font-weight: 600; }
        .blu-safety-card.blu-effects li::before { content: "•"; position: absolute; left: 0; color: #808080; font-weight: 700; }
        .blu-safety-note { font-size: 0.8125rem; color: #737373; margin-top: 0.75rem; padding-left: 0; }
        .blu-disclaimer { background: #fafafa; border: 1px solid #e0e0e0; padding: 1.25rem; margin-top: 1.5rem; }
        .blu-disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .blu-cta-section { text-align: center; }
        .blu-cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .blu-btn-primary { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2rem; text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s, transform 0.2s; }
        .blu-btn-primary:hover { background: #e0e0e0; transform: translateY(-1px); }
        .blu-btn-outline { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 2rem; border: 1px solid rgba(255,255,255,0.3); text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
        .blu-btn-outline:hover { background: #ffffff; color: #1a1a1a; }
        .blu-cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        @media (max-width: 768px) {
          .blu-page h1 { font-size: 2rem; }
          .blu-page h2 { font-size: 1.5rem; }
          .blu-hero { padding: 3.5rem 2rem; }
          .blu-hero-dose { flex-direction: column; gap: 0.5rem; }
          .blu-section { padding: 3.5rem 1.5rem; }
          .blu-section-alt { padding: 3.5rem 1.5rem; }
          .blu-info-grid, .blu-safety-grid, .blu-timeline-grid { grid-template-columns: 1fr; }
          .blu-cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
