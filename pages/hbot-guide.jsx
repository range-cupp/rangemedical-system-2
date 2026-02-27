import Layout from '../components/Layout';
import Head from 'next/head';

export default function HBOTGuide() {
  return (
    <Layout
      title="Hyperbaric Oxygen Therapy Guide | Range Medical"
      description="Your guide to hyperbaric oxygen therapy (HBOT). How it works, what a session is like, and what to expect. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Hyperbaric Oxygen Therapy Guide",
              "description": "Patient guide for hyperbaric oxygen therapy including session expectations, pricing, and safety information.",
              "url": "https://www.range-medical.com/hbot-guide",
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
          <span className="hero-badge">Your Hyperbaric Oxygen Therapy Guide</span>
          <h1>Hyperbaric Oxygen Therapy</h1>
          <p className="hero-sub">Everything you need to know about HBOT — how it works, what a session is like, and what to expect.</p>
          <div className="hero-dose">
            <div><span>Pressure:</span> 2.0 ATA</div>
            <div><span>Session:</span> 60 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is HBOT?</h2>
          <p className="section-subtitle">You relax in a pressurized chamber while breathing pure oxygen at 2.0 ATA (atmospheres absolute). Under pressure, oxygen dissolves into your blood plasma at much higher concentrations than normal breathing.</p>
          <p className="body-text">This oxygen-rich blood reaches tissues that need it most — supporting recovery, reducing inflammation, and promoting cellular repair throughout your entire body.</p>
        </div>
      </section>

      {/* Sessions & Packs */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Sessions</div>
          <h2 className="section-title">Sessions & Packs</h2>
          <p className="section-subtitle">Start with a single session or save with a pack.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">Single Session</div>
              <div className="protocol-price">$185</div>
              <p className="protocol-desc">60 minutes at 2.0 ATA. Try HBOT or use as a one-off session.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Best Value</span>
              <div className="protocol-days">5-Pack</div>
              <div className="protocol-price">$850</div>
              <p className="protocol-desc">$170/session. Great for building initial momentum.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">10-Pack</div>
              <div className="protocol-price">$1,600</div>
              <p className="protocol-desc">$160/session. Best pack value for committed protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Memberships */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Memberships</div>
          <h2 className="section-title">HBOT Memberships</h2>
          <p className="section-subtitle">3-month minimum, then month-to-month. Additional sessions on membership: $150 each.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">1x / Week</div>
              <div className="protocol-price">$549<span className="price-period">/mo</span></div>
              <p className="protocol-desc">4 sessions per month. Maintain a baseline of recovery and cellular support.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Most Popular</span>
              <div className="protocol-days">2x / Week</div>
              <div className="protocol-price">$1,049<span className="price-period">/mo</span></div>
              <p className="protocol-desc">8 sessions per month. Consistent progress and compounding benefits.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">3x / Week</div>
              <div className="protocol-price">$1,499<span className="price-period">/mo</span></div>
              <p className="protocol-desc">12 sessions per month. Maximum frequency for accelerated results.</p>
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
                <h4>Wear Comfortable Clothing</h4>
                <p>Loose-fitting clothing works best. No metal jewelry in the chamber.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Equalize Ear Pressure</h4>
                <p>As the chamber pressurizes, equalize your ears as you would on an airplane — swallow, yawn, or pinch your nose and gently blow.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Relax for 60 Minutes</h4>
                <p>Read, listen to music, or sleep. The session is 60 minutes at pressure. Many patients find it deeply relaxing.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Hydrate Before and After</h4>
                <p>Good hydration supports oxygen circulation and recovery. Drink plenty of water before and after your session.</p>
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
          <p className="section-subtitle">Benefits build with consistent sessions.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>First Session</h4>
              <p>Some notice improved energy and clarity. Mild ear pressure is normal and resolves quickly.</p>
            </div>
            <div className="timeline-card">
              <h4>Sessions 5–10</h4>
              <p>Cumulative benefits — reduced inflammation, improved recovery, better sleep quality.</p>
            </div>
            <div className="timeline-card">
              <h4>Sessions 10–20+</h4>
              <p>Deeper tissue healing, sustained energy, cognitive improvements. This is where the compounding effect really shows.</p>
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
              <h4>Do Not Use If You Have:</h4>
              <ul>
                <li>Untreated pneumothorax</li>
                <li>Certain lung conditions</li>
                <li>Active ear infections</li>
                <li>Severe claustrophobia</li>
                <li>Pregnancy</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild ear pressure during pressurization</li>
                <li>Temporary lightheadedness</li>
                <li>Slight fatigue (resolves within hours)</li>
              </ul>
              <p className="safety-note">We screen for all contraindications before your first session. Let our team know if you experience anything unusual.</p>
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
          <p>Whether you want to schedule a session or explore a membership, our team can help.</p>
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
        .protocol-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .protocol-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; text-align: center; transition: all 0.2s; }
        .protocol-card:hover { border-color: #000000; }
        .protocol-card.featured { border: 2px solid #000000; position: relative; }
        .protocol-badge { position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%); background: #000000; color: #ffffff; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .protocol-days { font-size: 0.8125rem; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .protocol-price { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; }
        .price-period { font-size: 1rem; font-weight: 400; color: #737373; }
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
          .timeline-grid { grid-template-columns: 1fr; }
          .protocol-grid { grid-template-columns: 1fr; gap: 1rem; }
          .protocol-card.featured { order: -1; }
          .safety-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
