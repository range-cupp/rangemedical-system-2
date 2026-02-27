import Layout from '../components/Layout';
import Head from 'next/head';

export default function MethyleneBlueComboIVGuide() {
  return (
    <Layout
      title="Methylene Blue Combo IV Guide | Range Medical"
      description="Your guide to the Methylene Blue + Vitamin C + Magnesium combo IV. Mitochondrial support, immune power, and cellular recovery in one session. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Methylene Blue Combo IV Guide",
              "description": "Patient guide for the Methylene Blue + High-Dose Vitamin C + Magnesium combo IV therapy.",
              "url": "https://www.range-medical.com/methylene-blue-combo-iv-guide",
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
          <span className="hero-badge">Your Methylene Blue Combo IV Guide</span>
          <h1>Methylene Blue + High-Dose Vitamin C + Magnesium</h1>
          <p className="hero-sub">Everything you need to know about your combination infusion — mitochondrial support, immune power, and cellular recovery in one session.</p>
          <div className="hero-dose">
            <div><span>Price:</span> $750</div>
            <div><span>Duration:</span> 90–120 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">Three Powerhouses, One Session</h2>
          <p className="section-subtitle">This combination pairs methylene blue's mitochondrial benefits with high-dose Vitamin C's immune and antioxidant power plus magnesium's role in muscle function, nerve signaling, and over 300 enzymatic reactions.</p>
          <p className="body-text">Together, they provide a comprehensive cellular recharge — targeting energy production, immune defense, and recovery from multiple pathways simultaneously.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What Each Component Does</h2>
          <p className="section-subtitle">Multi-pathway cellular support — energy production, immune defense, and recovery.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>⚡ Methylene Blue</h3>
              <p>Mitochondrial electron support, brain clarity, and cellular energy. Crosses the blood-brain barrier for direct cognitive support.</p>
            </div>
            <div className="info-card">
              <h3>🛡️ High-Dose Vitamin C</h3>
              <p>Immune support, free radical scavenging, collagen production, and tissue repair. Therapeutic doses far beyond what oral supplements provide.</p>
            </div>
            <div className="info-card">
              <h3>💤 Magnesium</h3>
              <p>Muscle relaxation, nerve function, sleep support, and inflammation reduction. Involved in over 300 enzymatic reactions.</p>
            </div>
            <div className="info-card">
              <h3>🎯 Together</h3>
              <p>Multi-pathway cellular support — energy production from methylene blue, immune defense from Vitamin C, and recovery from magnesium. The complete cellular recharge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Pricing</div>
          <h2 className="section-title">Methylene Blue Combo IV</h2>

          <div className="protocol-grid single">
            <div className="protocol-card featured">
              <div className="protocol-days">Complete Combo</div>
              <div className="protocol-price">$750</div>
              <p className="protocol-desc">Methylene Blue + High-Dose Vitamin C + Magnesium. 90–120 minute session. The full cellular recharge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">What to Know Before Your Session</h2>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Medication Check</h4>
                <p>Inform your provider of ALL medications — especially SSRIs, SNRIs, and MAOIs. This is critical. Methylene blue cannot be combined with serotonergic medications.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Eat a Light Meal</h4>
                <p>Have a light meal before your session. Don't come on an empty stomach — it helps prevent nausea.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Hydrate Well</h4>
                <p>Drink plenty of water before and after. The combined infusion works best when you're well hydrated.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Plan for 2 Hours</h4>
                <p>The combined infusion takes 90–120 minutes. Bring something to read, watch, or work on. Expect blue-green urine for 24–48 hours (normal).</p>
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
          <p className="section-subtitle">Benefits from all three components begin quickly.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>During Session</h4>
              <p>Warmth from magnesium, mental clarity from methylene blue. Some patients feel calm and focused during the infusion.</p>
            </div>
            <div className="timeline-card">
              <h4>24–48 Hours</h4>
              <p>Improved energy, reduced inflammation, immune support. Your cells are actively using all three components for repair and defense.</p>
            </div>
            <div className="timeline-card">
              <h4>Regular Sessions</h4>
              <p>Deep cellular optimization across multiple systems. Sustained improvements in energy, clarity, immune function, and recovery.</p>
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
                <li>Take SSRIs, SNRIs, or MAOIs (risk of serotonin syndrome)</li>
                <li>Take other serotonergic medications</li>
                <li>Have G6PD deficiency</li>
                <li>Are pregnant or breastfeeding</li>
                <li>Have kidney disease (consult provider for high-dose Vitamin C)</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Blue-green urine and stool (normal from methylene blue)</li>
                <li>Warmth or flushing (from magnesium — normal and temporary)</li>
                <li>Mild nausea</li>
                <li>Temporary headache</li>
                <li>Vein irritation at IV site</li>
              </ul>
              <p className="safety-note">G6PD screening may be required for high-dose Vitamin C. Inform your provider of ALL medications before treatment.</p>
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
          <p>Whether you have questions about medications or want to schedule your session, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .peptide-hero { background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); padding: 3.5rem 1.5rem 3rem; text-align: center; }
        .peptide-hero h1 { font-size: 2.25rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 1rem; }
        .hero-badge { display: inline-block; background: #000000; color: #ffffff; padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.25rem; }
        .hero-sub { font-size: 1.0625rem; color: #525252; max-width: 600px; margin: 0 auto; line-height: 1.7; }
        .hero-dose { display: inline-flex; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; font-size: 0.9rem; color: #525252; }
        .hero-dose span { font-weight: 600; color: #171717; }
        .section { padding: 3.5rem 1.5rem; }
        .section-gray { background: #fafafa; }
        .section-dark { background: #000000; color: #ffffff; }
        .section-kicker { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; margin-bottom: 0.5rem; }
        .section-dark .section-kicker { color: rgba(255,255,255,0.6); }
        .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
        .section-subtitle { font-size: 1rem; color: #525252; max-width: 600px; line-height: 1.7; margin-bottom: 2rem; }
        .section-dark .section-subtitle { color: rgba(255,255,255,0.8); }
        .section-dark .section-title { color: #ffffff; }
        .body-text { font-size: 0.95rem; color: #525252; line-height: 1.7; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .info-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.75rem; }
        .info-card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; }
        .info-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .protocol-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .protocol-grid.single { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
        .protocol-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; text-align: center; transition: all 0.2s; }
        .protocol-card:hover { border-color: #000000; }
        .protocol-card.featured { border: 2px solid #000000; position: relative; }
        .protocol-days { font-size: 0.8125rem; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .protocol-price { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; }
        .protocol-desc { font-size: 0.8125rem; color: #525252; line-height: 1.6; }
        .steps-list { margin-top: 1.5rem; }
        .step-item { display: flex; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid #e5e5e5; }
        .step-item:last-child { border-bottom: none; }
        .step-number { width: 2rem; height: 2rem; background: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
        .step-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .step-content p { font-size: 0.9rem; color: #525252; line-height: 1.6; }
        .timeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .timeline-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 1.5rem; }
        .timeline-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .timeline-card p { font-size: 0.875rem; color: rgba(255,255,255,0.8); line-height: 1.6; }
        .safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .safety-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; }
        .safety-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #171717; }
        .safety-card ul { list-style: none; padding: 0; margin: 0; }
        .safety-card li { font-size: 0.875rem; color: #525252; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
        .safety-card.warning li::before { content: "✕"; position: absolute; left: 0; color: #171717; font-weight: 600; }
        .safety-card.effects li::before { content: "•"; position: absolute; left: 0; color: #737373; font-weight: 700; }
        .safety-note { font-size: 0.8125rem; color: #737373; margin-top: 0.75rem; padding-left: 0; }
        .disclaimer { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.25rem; margin-top: 1.5rem; }
        .disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .final-cta { background: #000000; color: #ffffff; padding: 3.5rem 1.5rem; text-align: center; }
        .final-cta h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .final-cta p { font-size: 1rem; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-white { display: inline-block; background: #ffffff; color: #000000; padding: 0.875rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-white:hover { background: #f5f5f5; transform: translateY(-1px); }
        .btn-outline-white { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 1.75rem; border-radius: 8px; border: 2px solid #ffffff; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-outline-white:hover { background: #ffffff; color: #000000; }
        .cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        @media (max-width: 768px) {
          .peptide-hero h1 { font-size: 1.875rem; }
          .hero-dose { flex-direction: column; gap: 0.5rem; }
          .info-grid, .safety-grid, .timeline-grid { grid-template-columns: 1fr; }
          .protocol-grid { grid-template-columns: 1fr; gap: 1rem; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
