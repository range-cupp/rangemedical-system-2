import Layout from '../components/Layout';
import Head from 'next/head';

export default function RangeIVGuide() {
  return (
    <Layout
      title="Range IV Therapy Guide | Range Medical"
      description="Your guide to custom IV therapy. What's in your IV, how it works, and what to expect. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Range IV Therapy Guide",
              "description": "Patient guide for custom IV therapy including available vitamins, pricing, and what to expect.",
              "url": "https://www.range-medical.com/range-iv-guide",
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
          <span className="hero-badge">Your IV Therapy Guide</span>
          <h1>The Range IV</h1>
          <p className="hero-sub">Everything you need to know about your custom IV infusion — what's in it, how it works, and what to expect.</p>
          <div className="hero-dose">
            <div><span>Custom:</span> 5 vitamins & minerals</div>
            <div><span>Duration:</span> 45–90 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">Why IV Therapy?</h2>
          <p className="section-subtitle">IV therapy delivers vitamins, minerals, and amino acids directly into your bloodstream — bypassing your digestive system for 100% absorption.</p>
          <p className="body-text">Oral supplements lose 20–80% to digestion. IV puts everything directly where your cells can use it. The result is faster, more noticeable benefits — often within hours of your first session.</p>
        </div>
      </section>

      {/* Available Vitamins */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Custom IV</div>
          <h2 className="section-title">Choose 5 Vitamins & Minerals</h2>
          <p className="section-subtitle">Our nurses review your needs before every infusion. Additional add-ons available at $35 each.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🛡️ Vitamin C</h3>
              <p>Immune support, powerful antioxidant, collagen production</p>
            </div>
            <div className="info-card">
              <h3>⚡ B-Complex</h3>
              <p>Energy production, metabolism, nervous system support</p>
            </div>
            <div className="info-card">
              <h3>🧠 B12</h3>
              <p>Energy, mood, nerve function, red blood cell production</p>
            </div>
            <div className="info-card">
              <h3>💤 Magnesium</h3>
              <p>Muscle recovery, sleep quality, stress reduction</p>
            </div>
            <div className="info-card">
              <h3>🛡️ Zinc</h3>
              <p>Immune function, skin health, wound healing</p>
            </div>
            <div className="info-card">
              <h3>🔄 Glutathione</h3>
              <p>Master antioxidant, detoxification, anti-aging</p>
            </div>
            <div className="info-card">
              <h3>💪 Amino Acids</h3>
              <p>Muscle repair, recovery, protein synthesis</p>
            </div>
            <div className="info-card">
              <h3>🔥 L-Carnitine</h3>
              <p>Fat metabolism, cellular energy production</p>
            </div>
            <div className="info-card">
              <h3>🫁 NAC</h3>
              <p>Liver support, antioxidant, respiratory health</p>
            </div>
            <div className="info-card">
              <h3>🦴 Calcium</h3>
              <p>Bone health, muscle function, nerve signaling</p>
            </div>
            <div className="info-card">
              <h3>✨ Biotin</h3>
              <p>Hair, skin, and nail health</p>
            </div>
            <div className="info-card">
              <h3>☀️ Vitamin D3</h3>
              <p>Immune function, mood, bone health</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Pricing</div>
          <h2 className="section-title">Simple, Transparent Pricing</h2>

          <div className="protocol-grid single">
            <div className="protocol-card featured">
              <div className="protocol-days">The Range IV</div>
              <div className="protocol-price">$225</div>
              <p className="protocol-desc">5 vitamins and minerals included. Additional add-ons: +$35 each. 45–90 minute session.</p>
            </div>
          </div>

          <div className="combo-box" style={{ marginTop: '1.5rem' }}>
            <h3>Why IV Instead of Oral?</h3>
            <p>100% absorption vs 20–80% with pills. Rapid results — feel effects within hours. Higher therapeutic doses possible. Customized to your specific needs.</p>
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
                <h4>Hydrate</h4>
                <p>Drink plenty of water before your session. Being well-hydrated makes IV placement easier and improves absorption.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Wear Comfortable Clothing</h4>
                <p>Choose clothing with easy arm access. Short sleeves or sleeves that roll up easily work best.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Relax</h4>
                <p>Sessions are 45–90 minutes. You can relax, read, work on your laptop, or watch something. We have comfortable chairs and a calm environment.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>After Your Session</h4>
                <p>Continue hydrating. You can return to normal activities immediately. Many patients feel the effects within hours.</p>
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
          <p className="section-subtitle">Many patients feel the effects within hours. For ongoing wellness, consistent sessions provide cumulative benefit.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>During Session</h4>
              <p>Mild warmth or coolness at the IV site is normal. Some notice a vitamin taste — this is expected and harmless.</p>
            </div>
            <div className="timeline-card">
              <h4>Same Day</h4>
              <p>Energy, hydration, and immune benefits are often immediate. Many patients feel noticeably better within hours.</p>
            </div>
            <div className="timeline-card">
              <h4>Weekly Sessions</h4>
              <p>Consistent weekly or bi-weekly sessions provide cumulative benefits for energy, recovery, and immune support.</p>
            </div>
            <div className="timeline-card">
              <h4>Ongoing</h4>
              <p>Regular IV therapy keeps your nutrient levels optimized. Your body has what it needs to perform and recover at its best.</p>
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
              <h4>Tell Your Nurse If You Have:</h4>
              <ul>
                <li>Any known allergies</li>
                <li>Kidney disease or kidney problems</li>
                <li>Heart conditions</li>
                <li>Are pregnant or breastfeeding</li>
                <li>Are taking blood thinners</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Coolness or warmth at IV site</li>
                <li>Slight bruising at insertion point</li>
                <li>Temporary vitamin taste in mouth</li>
                <li>Mild flushing (magnesium)</li>
                <li>Allergic reactions are rare</li>
              </ul>
              <p className="safety-note">IV therapy is safe when administered by licensed providers. Inform your nurse of any discomfort during the session.</p>
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
          <p>Whether you want to customize your next IV or schedule a session, our team can help.</p>
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
        .combo-box { background: #000000; color: #ffffff; border-radius: 12px; padding: 1.75rem; text-align: center; }
        .combo-box h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff; }
        .combo-box p { font-size: 0.9rem; color: rgba(255,255,255,0.85); line-height: 1.7; }
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
