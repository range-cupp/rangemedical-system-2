import Layout from '../components/Layout';
import Head from 'next/head';

export default function VitaminCIVGuide() {
  return (
    <Layout
      title="High-Dose Vitamin C IV Guide | Range Medical"
      description="Your guide to high-dose Vitamin C IV therapy. Therapeutic doses delivered directly to your cells. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "High-Dose Vitamin C IV Guide",
              "description": "Patient guide for high-dose Vitamin C IV therapy including dosing, pricing, and safety information.",
              "url": "https://www.range-medical.com/vitamin-c-iv-guide",
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
          <span className="hero-badge">Your High-Dose Vitamin C Guide</span>
          <h1>High-Dose Vitamin C IV</h1>
          <p className="hero-sub">Everything you need to know about your Vitamin C infusion — therapeutic doses delivered directly to your cells.</p>
          <div className="hero-dose">
            <div><span>Doses:</span> 10g–75g</div>
            <div><span>Duration:</span> 60–120 minutes</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">Why High-Dose Vitamin C?</h2>
          <p className="section-subtitle">High-dose Vitamin C IV delivers concentrations 50–70x higher than what's achievable orally. At these levels, Vitamin C acts as a powerful antioxidant, supports immune function, and promotes tissue repair.</p>
          <p className="body-text">Your body can only absorb so much Vitamin C through digestion — roughly 200mg at a time, no matter how many pills you take. IV bypasses that limit entirely, delivering therapeutic doses directly to your cells.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What High-Dose Vitamin C Does</h2>
          <p className="section-subtitle">At therapeutic doses, Vitamin C does far more than fight colds.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🛡️ Immune Support</h3>
              <p>At high doses, Vitamin C generates hydrogen peroxide in tissues, which supports immune response and helps your body fight infections.</p>
            </div>
            <div className="info-card">
              <h3>🔄 Antioxidant Power</h3>
              <p>Acts as a potent free radical scavenger — neutralizing oxidative stress that damages cells and accelerates aging.</p>
            </div>
            <div className="info-card">
              <h3>✨ Collagen Production</h3>
              <p>Supports collagen synthesis for skin health, wound healing, and tissue repair throughout your body.</p>
            </div>
            <div className="info-card">
              <h3>⚡ Cellular Repair</h3>
              <p>Supports iron absorption and cellular repair processes. Helps your body recover faster from illness, stress, and physical demands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Pricing</div>
          <h2 className="section-title">Choose Your Dose</h2>
          <p className="section-subtitle">Higher doses provide more therapeutic benefit. Your provider will recommend the right dose for your goals.</p>

          <div className="protocol-grid">
            <div className="protocol-card">
              <div className="protocol-days">10g</div>
              <div className="protocol-price">$215</div>
              <p className="protocol-desc">Immune support and general wellness. Good for regular maintenance.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">25g</div>
              <div className="protocol-price">$255</div>
              <p className="protocol-desc">Enhanced immune support and antioxidant benefit. Popular for prevention.</p>
            </div>
            <div className="protocol-card featured">
              <span className="protocol-badge">Most Popular</span>
              <div className="protocol-days">50g</div>
              <div className="protocol-price">$330</div>
              <p className="protocol-desc">Therapeutic dose for chronic illness support, recovery, and deep antioxidant benefit.</p>
            </div>
            <div className="protocol-card">
              <div className="protocol-days">75g</div>
              <div className="protocol-price">$400</div>
              <p className="protocol-desc">Maximum dose. Cancer adjunct care (with oncologist approval) and intensive protocols.</p>
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
                <h4>Hydrate Well</h4>
                <p>Drink plenty of water before and after your session. Good hydration supports absorption and reduces potential side effects.</p>
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
                <h4>Allow Enough Time</h4>
                <p>Sessions run 60–120 minutes depending on dose. Higher doses require slower infusion rates for comfort and safety.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Relax and Recharge</h4>
                <p>Bring something to read, watch, or work on. Sessions are comfortable — you can relax while your cells recharge.</p>
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
          <p className="section-subtitle">Benefits begin quickly and compound with regular sessions.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Immediately</h4>
              <p>Improved hydration and energy. Many patients feel a boost within hours of their session.</p>
            </div>
            <div className="timeline-card">
              <h4>24–48 Hours</h4>
              <p>Immune support and reduced inflammation. Your body is actively using the Vitamin C for repair and defense.</p>
            </div>
            <div className="timeline-card">
              <h4>Regular Sessions</h4>
              <p>Cumulative antioxidant and wellness benefits. Consistent sessions keep your immune system strong and cells protected.</p>
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
                <li>G6PD deficiency screening may be required before high doses (50g+)</li>
                <li>Kidney disease patients should consult their provider first</li>
                <li>Inform your provider of all medications</li>
                <li>Not recommended during pregnancy/breastfeeding</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild nausea (especially on empty stomach)</li>
                <li>Vein irritation at IV site</li>
                <li>Temporary thirst or dry mouth</li>
                <li>Mild lightheadedness</li>
              </ul>
              <p className="safety-note">Generally well tolerated. Side effects are mild and typically resolve quickly. Let your nurse know if you experience discomfort.</p>
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
          <p>Whether you want to schedule your next session or discuss the right dose, our team can help.</p>
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
        .protocol-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
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
          .protocol-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .protocol-card.featured { order: -1; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
