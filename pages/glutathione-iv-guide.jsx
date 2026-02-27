import Layout from '../components/Layout';
import Head from 'next/head';

export default function GlutathioneIVGuide() {
  return (
    <Layout
      title="Glutathione IV Guide | Range Medical"
      description="Your guide to glutathione IV therapy. Your body's master antioxidant, delivered directly. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Glutathione IV Guide",
              "description": "Patient guide for glutathione IV therapy including dosing, pricing, and safety information.",
              "url": "https://www.range-medical.com/glutathione-iv-guide",
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
          <span className="hero-badge">Your Glutathione IV Guide</span>
          <h1>Glutathione IV</h1>
          <p className="hero-sub">Everything you need to know about your glutathione infusion — your body's master antioxidant, delivered directly.</p>
          <div className="hero-dose">
            <div><span>Doses:</span> 1g–3g</div>
            <div><span>Duration:</span> 15–30 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is Glutathione?</h2>
          <p className="section-subtitle">Glutathione is the most powerful antioxidant your body produces. It protects cells from damage, supports detoxification, and plays a role in immune function.</p>
          <p className="body-text">Levels decline with age, stress, and toxin exposure. Oral glutathione supplements are poorly absorbed — your digestive system breaks them down before they reach your cells. IV delivery restores levels far more effectively.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What Glutathione Does</h2>
          <p className="section-subtitle">Called the "master antioxidant" for a reason.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🛡️ Free Radical Defense</h3>
              <p>Neutralizes free radicals that damage cells, DNA, and proteins. Your first line of defense against oxidative stress.</p>
            </div>
            <div className="info-card">
              <h3>🔄 Detoxification</h3>
              <p>Supports liver detoxification pathways. Helps your body process and eliminate toxins, heavy metals, and metabolic waste.</p>
            </div>
            <div className="info-card">
              <h3>⚡ Antioxidant Recycling</h3>
              <p>Recycles other antioxidants like Vitamin C and E — making them effective again after they've been used up.</p>
            </div>
            <div className="info-card">
              <h3>🛡️ Immune Support</h3>
              <p>Supports immune cell function. Your immune system relies on glutathione to fight infections and maintain optimal performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Pricing</div>
          <h2 className="section-title">Choose Your Dose</h2>
          <p className="section-subtitle">Can be done as a standalone treatment or added as a push to any IV session.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">1g</div>
              <div className="protocol-price">$170</div>
              <p className="protocol-desc">Standard dose for maintenance and general wellness support.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Most Popular</span>
              <div className="protocol-days">2g</div>
              <div className="protocol-price">$190</div>
              <p className="protocol-desc">Enhanced dose for deeper detox support and skin brightness.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">3g</div>
              <div className="protocol-price">$215</div>
              <p className="protocol-desc">Maximum dose for intensive antioxidant and detoxification support.</p>
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
                <h4>Quick and Easy</h4>
                <p>Infusion takes just 15–30 minutes. One of the fastest IV treatments available.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Standalone or Add-On</h4>
                <p>Can be done as its own treatment or added as a push to any IV session for combined benefits.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>No Special Prep</h4>
                <p>No fasting or special preparation needed. Come as you are — we handle the rest.</p>
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
          <p className="section-subtitle">Benefits start quickly and build with regular sessions.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Immediately</h4>
              <p>Some patients notice improved mental clarity right after their session.</p>
            </div>
            <div className="timeline-card">
              <h4>24–48 Hours</h4>
              <p>Skin brightness and energy improvements. Your body is actively detoxifying and repairing.</p>
            </div>
            <div className="timeline-card">
              <h4>Regular Sessions</h4>
              <p>Cumulative detox and anti-aging benefits. Consistent sessions keep your antioxidant defense strong.</p>
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
              <h4>Important Considerations:</h4>
              <ul>
                <li>Not recommended for those with sulfite sensitivity</li>
                <li>Inform your provider of all medications and allergies</li>
                <li>Not recommended during pregnancy/breastfeeding</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild bloating or cramping (rare)</li>
                <li>Slight lightheadedness</li>
                <li>Mild discomfort at IV site</li>
              </ul>
              <p className="safety-note">Very well tolerated. Side effects are rare and typically mild. Let your nurse know if you experience any discomfort.</p>
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
          <p>Whether you want to schedule a session or add glutathione to your next IV, our team can help.</p>
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
        .protocol-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; text-align: center; transition: all 0.2s; }
        .protocol-card:hover { border-color: #000000; }
        .protocol-card.featured { border: 2px solid #000000; position: relative; }
        .protocol-badge { position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%); background: #000000; color: #ffffff; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
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
          .protocol-card.featured { order: -1; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
