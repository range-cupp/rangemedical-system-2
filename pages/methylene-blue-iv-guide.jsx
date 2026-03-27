import Layout from '../components/Layout';
import Head from 'next/head';

export default function MethyleneBlueIVGuide() {
  return (
    <Layout
      title="Methylene Blue IV Guide | Range Medical"
      description="Your guide to methylene blue IV therapy. Mitochondrial support at the cellular level. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Methylene Blue IV Guide",
              "description": "Patient guide for methylene blue IV therapy including safety precautions, what to expect, and contraindications.",
              "url": "https://www.range-medical.com/methylene-blue-iv-guide",
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
          <div className="v2-label"><span className="v2-dot" /> YOUR METHYLENE BLUE IV GUIDE</div>
          <h1>METHYLENE BLUE IV</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Everything you need to know about your methylene blue infusion — mitochondrial support at the cellular level.</p>
          <div className="hero-dose">
            <div><span>Price:</span> $450</div>
            <div><span>Duration:</span> 30–60 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
          <h2 className="section-title">WHAT IS METHYLENE BLUE?</h2>
          <p className="section-subtitle">Methylene Blue is one of the oldest pharmaceutical compounds, now being used for its powerful effects on mitochondrial function.</p>
          <p className="body-text">It acts as an alternative electron carrier in the mitochondrial electron transport chain — essentially giving your cells a backup power source. When mitochondria aren't working efficiently, you feel it as brain fog, fatigue, and slow recovery. Methylene blue helps your cells produce energy even when normal pathways are impaired.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
          <h2 className="section-title">WHAT METHYLENE BLUE DOES</h2>
          <p className="section-subtitle">Targets your cells' energy production at the most fundamental level.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Electron Transport</h3>
              <p>Donates and accepts electrons in the mitochondrial electron transport chain — supporting ATP (cellular energy) production even when normal pathways are impaired.</p>
            </div>
            <div className="info-card">
              <h3>Crosses Blood-Brain Barrier</h3>
              <p>One of the few compounds that crosses the blood-brain barrier, directly supporting brain cell energy and cognitive function.</p>
            </div>
            <div className="info-card">
              <h3>Antioxidant Properties</h3>
              <p>Acts as an antioxidant and anti-inflammatory, protecting cells from oxidative damage while supporting repair.</p>
            </div>
            <div className="info-card">
              <h3>Cellular Energy</h3>
              <p>Supports ATP production — the energy currency every cell in your body needs to function. More efficient mitochondria = more energy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> PRICING</div>
          <h2 className="section-title">METHYLENE BLUE IV</h2>

          <div className="protocol-grid single">
            <div className="protocol-card featured">
              <div className="protocol-days">Methylene Blue IV</div>
              <div className="protocol-price">$450</div>
              <p className="protocol-desc">30–60 minute infusion. Direct mitochondrial support for energy, clarity, and cellular function.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> INSTRUCTIONS</div>
          <h2 className="section-title">WHAT TO KNOW BEFORE YOUR SESSION</h2>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Medication Check</h4>
                <p>Inform your provider of ALL medications — especially SSRIs, SNRIs, and MAOIs. This is critical for your safety.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Hydrate</h4>
                <p>Drink plenty of water before and after your session. Hydration supports absorption and recovery.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Expect the Blue</h4>
                <p>Your urine and potentially skin may have a blue-green tint for 24–48 hours after infusion. This is completely normal and expected.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Relax</h4>
                <p>Session takes 30–60 minutes. Bring something to read or watch. You'll be comfortable the entire time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" /> TIMELINE</div>
          <h2 className="section-title">WHAT TO EXPECT</h2>
          <p className="section-subtitle">Mitochondrial benefits build with regular sessions.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>During/After Infusion</h4>
              <p>Some notice improved clarity and alertness during or shortly after the session.</p>
            </div>
            <div className="timeline-card">
              <h4>24–72 Hours</h4>
              <p>Enhanced energy, reduced brain fog. Your mitochondria are producing energy more efficiently.</p>
            </div>
            <div className="timeline-card">
              <h4>Regular Sessions</h4>
              <p>Cumulative mitochondrial benefits. Sustained improvements in energy, clarity, and cognitive function.</p>
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
                <li>Take SSRIs, SNRIs, or MAOIs (risk of serotonin syndrome)</li>
                <li>Take other serotonergic medications</li>
                <li>Have G6PD deficiency</li>
                <li>Are pregnant or breastfeeding</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Blue-green urine and stool (normal, expected)</li>
                <li>Temporary blue-green skin tint</li>
                <li>Mild nausea</li>
                <li>Temporary headache</li>
              </ul>
              <p className="safety-note">The blue discoloration is completely harmless and resolves within 24–48 hours. Inform your provider of ALL medications before treatment.</p>
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
          <p>Whether you have questions about medications or want to schedule your session, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">CALL (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">TEXT US</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .guide-hero { padding: 6rem 2rem 5rem; }
        .guide-hero h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: #1a1a1a; margin-bottom: 2rem; }
        .hero-rule { width: 100%; max-width: 700px; height: 1px; background: #e0e0e0; margin-bottom: 1.5rem; }
        .hero-sub { font-size: 1.0625rem; color: #737373; max-width: 600px; line-height: 1.75; }
        .hero-dose { display: inline-flex; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e0e0e0; font-size: 0.9rem; color: #737373; }
        .hero-dose span { font-weight: 700; color: #1a1a1a; }
        .section { padding: 6rem 2rem; }
        .section-gray { background: #fafafa; }
        .section-dark { background: #1a1a1a; color: #ffffff; }
        .section-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: #1a1a1a; margin-bottom: 1rem; }
        .section-subtitle { font-size: 1rem; color: #737373; max-width: 600px; line-height: 1.75; margin-bottom: 2rem; }
        .section-dark .section-subtitle { color: rgba(255,255,255,0.7); }
        .section-dark .section-title { color: #ffffff; }
        .body-text { font-size: 0.95rem; color: #737373; line-height: 1.75; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .info-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.75rem; }
        .info-card h3 { font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.75rem; color: #1a1a1a; }
        .info-card p { font-size: 0.9rem; color: #737373; line-height: 1.7; }
        .protocol-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .protocol-grid.single { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
        .protocol-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.5rem; text-align: center; transition: border-color 0.2s; }
        .protocol-card:hover { border-color: #1a1a1a; }
        .protocol-card.featured { border: 2px solid #1a1a1a; position: relative; }
        .protocol-days { font-size: 0.8125rem; font-weight: 700; color: #737373; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .protocol-price { font-size: 1.75rem; font-weight: 900; margin-bottom: 0.75rem; color: #808080; }
        .protocol-desc { font-size: 0.8125rem; color: #737373; line-height: 1.6; }
        .steps-list { margin-top: 1.5rem; }
        .step-item { display: flex; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid #e0e0e0; }
        .step-item:last-child { border-bottom: none; }
        .step-number { width: 2rem; height: 2rem; background: #808080; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
        .step-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; color: #1a1a1a; }
        .step-content p { font-size: 0.9rem; color: #737373; line-height: 1.6; }
        .timeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .timeline-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); padding: 1.5rem; }
        .timeline-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff; }
        .timeline-card p { font-size: 0.875rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
        .safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .safety-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 1.5rem; }
        .safety-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #1a1a1a; }
        .safety-card ul { list-style: none; padding: 0; margin: 0; }
        .safety-card li { font-size: 0.875rem; color: #737373; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
        .safety-card.warning li::before { content: "✕"; position: absolute; left: 0; color: #1a1a1a; font-weight: 600; }
        .safety-card.effects li::before { content: "•"; position: absolute; left: 0; color: #808080; font-weight: 700; }
        .safety-note { font-size: 0.8125rem; color: #737373; margin-top: 0.75rem; padding-left: 0; }
        .disclaimer { background: #fafafa; border: 1px solid #e0e0e0; padding: 1.25rem; margin-top: 1.5rem; }
        .disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .final-cta { background: #1a1a1a; color: #ffffff; padding: 6rem 2rem; text-align: center; }
        .final-cta h2 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 1rem; }
        .final-cta p { font-size: 1rem; color: rgba(255,255,255,0.7); margin-bottom: 1.5rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-white { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 1.75rem; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s; }
        .btn-white:hover { background: #f5f5f5; }
        .btn-outline-white { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 1.75rem; border: 1px solid #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
        .btn-outline-white:hover { background: #ffffff; color: #1a1a1a; }
        .cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        @media (max-width: 768px) {
          .guide-hero h1 { font-size: 2rem; }
          .hero-dose { flex-direction: column; gap: 0.5rem; }
          .info-grid, .safety-grid, .timeline-grid { grid-template-columns: 1fr; }
          .protocol-grid { grid-template-columns: 1fr; gap: 1rem; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
          .section, .guide-hero, .final-cta { padding-left: 1.5rem; padding-right: 1.5rem; }
        }
      `}</style>
    </Layout>
  );
}
