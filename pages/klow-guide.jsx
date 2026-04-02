import { useState } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

const SERVICES = [
  {
    id: 'hrt',
    name: 'Hormone Optimization',
    price: '$250/mo',
    description: 'Testosterone, thyroid, and hormone balancing for men and women. Includes all medications, ongoing labs, provider check-ins, and one IV per month.',
  },
  {
    id: 'weight-loss',
    name: 'Medical Weight Loss',
    price: 'Starting at $350/mo',
    description: 'Physician-supervised GLP-1 medications (Semaglutide, Tirzepatide, Retatrutide) with labs and ongoing support.',
  },
  {
    id: 'iv',
    name: 'IV Therapy',
    price: 'Starting at $225',
    description: 'Custom IV vitamin infusions including NAD+, high-dose Vitamin C, glutathione, methylene blue, and build-your-own options.',
  },
  {
    id: 'peptide',
    name: 'Peptide Therapy',
    price: 'Varies',
    description: 'Advanced peptide protocols for recovery, healing, and optimization. BPC-157, TB-500, GLOW, GHK-Cu, growth hormone blends, and more.',
  },
  {
    id: 'injections',
    name: 'Vitamin Injections',
    price: '$35\u2013$75',
    description: 'Fast nutrient delivery: B12, B-Complex, D3, Biotin, Glutathione, NAD+, and more.',
  },
  {
    id: 'nad',
    name: 'NAD+ Therapy',
    price: '$0.50/mg',
    description: 'High-dose NAD+ via IV or injection for cellular energy, brain function, and recovery.',
  },
  {
    id: 'hbot',
    name: 'Hyperbaric Oxygen Therapy',
    price: 'Starting at $185/session',
    description: 'Pressurized oxygen therapy for injury recovery, cognitive performance, and longevity. Memberships from $549/mo.',
  },
  {
    id: 'rlt',
    name: 'Red Light Therapy',
    price: 'Starting at $85/session',
    description: 'Photobiomodulation for muscle recovery, skin health, and cellular regeneration. Memberships from $399/mo.',
  },
  {
    id: 'prp',
    name: 'PRP Therapy',
    price: 'Starting at $750',
    description: 'Your own concentrated platelets injected to support tissue repair for joint pain and tendon issues.',
  },
  {
    id: 'reset',
    name: '6-Week Cellular Reset',
    price: <><s style={{ color: '#a3a3a3', fontWeight: 400 }}>$3,999</s> $2,999</>,
    description: 'Comprehensive program combining multiple therapies for full cellular energy restoration.',
  },
];

export default function KlowGuide() {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <Layout
      title="KLOW Peptide Blend Guide | Range Medical"
      description="Your guide to KLOW peptide blend therapy. GHK-Cu, KPV, BPC-157, and TB-4 combined for recovery and skin health. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", "name": "KLOW Peptide Blend Guide", "description": "Patient guide for KLOW peptide blend therapy combining GHK-Cu, KPV, BPC-157, and TB-4 for recovery and skin health.", "url": "https://www.range-medical.com/klow-guide", "provider": { "@type": "MedicalBusiness", "name": "Range Medical", "telephone": "+1-949-997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } } }) }} />
      </Head>

      {/* Hero */}
      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Your Peptide Protocol Guide</span>
          <h1>KLOW</h1>
          <p className="hero-sub">The ultimate recovery and skin blend — four peptides working together to heal tissue, reduce inflammation, and restore your skin from the inside out.</p>
          <div className="hero-dose">
            <div><span>Blend:</span> GHK-Cu / KPV / BPC-157 / TB-4</div>
          </div>
        </div>
      </section>

      {/* What Is KLOW */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is KLOW?</h2>
          <p className="section-subtitle">KLOW is a custom 4-peptide blend designed for patients who want recovery AND skin benefits in one injection.</p>
          <p className="body-text">By combining GHK-Cu (skin and collagen repair), KPV (anti-inflammatory), BPC-157 (tissue healing), and TB-4 (wound recovery), KLOW addresses multiple pathways at once. Instead of running separate protocols, this blend delivers broad-spectrum healing and rejuvenation in a single daily injection.</p>
        </div>
      </section>

      {/* The Blend */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Blend</div>
          <h2 className="section-title">Four Peptides. One Protocol.</h2>
          <p className="section-subtitle">Each peptide in KLOW targets a different mechanism — together they cover recovery, inflammation, skin health, and deep tissue repair.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>GHK-Cu</h3>
              <ul>
                <li>Stimulates collagen production</li>
                <li>Supports skin repair and elasticity</li>
                <li>Anti-aging at the cellular level</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>KPV</h3>
              <ul>
                <li>Powerful anti-inflammatory peptide</li>
                <li>Supports gut health and barrier function</li>
                <li>Reduces skin inflammation and redness</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>BPC-157</h3>
              <ul>
                <li>Accelerates tissue repair</li>
                <li>Supports tendon and ligament healing</li>
                <li>Improves blood flow to injury sites</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>TB-4</h3>
              <ul>
                <li>Accelerates wound healing</li>
                <li>Reduces scar tissue formation</li>
                <li>Promotes cellular migration and repair</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Your Protocol */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How to Use KLOW</h2>
          <p className="section-subtitle">Your provider has prescribed a protocol tailored to your goals. Here are the key details to keep in mind.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>Injection Frequency</h3>
              <p>Daily injection. Consistency is key — same time every day for best results.</p>
            </div>
            <div className="info-card">
              <h3>Injection Site</h3>
              <p>Subcutaneous injection in the abdomen or near the target area. Rotate sites daily to prevent irritation.</p>
            </div>
            <div className="info-card">
              <h3>Duration</h3>
              <p>10, 20, or 30 day protocols available. Your provider will recommend the right length based on your goals and response.</p>
            </div>
            <div className="info-card">
              <h3>Storage</h3>
              <p>Keep refrigerated at all times. Do not freeze. Remove from fridge a few minutes before injection to reach room temperature.</p>
            </div>
          </div>
          <div className="pricing-box" style={{ marginTop: '1.5rem' }}>
            <div className="pricing-row"><span>10 Day Protocol</span><span className="pricing-amount">$250</span></div>
            <div className="pricing-row"><span>20 Day Protocol</span><span className="pricing-amount">$450</span></div>
            <div className="pricing-row"><span>30 Day Protocol</span><span className="pricing-amount">$675</span></div>
          </div>
          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Pro Tip</strong>
            <p>Set a daily phone reminder to stay consistent. Injecting at the same time each day keeps peptide levels stable and maximizes results.</p>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Everyone responds differently, but here's what patients typically experience during a KLOW protocol.</p>
          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1-2</h4>
              <p>Reduced inflammation and early healing signals. Some patients notice decreased pain, less skin redness, and improved comfort. The anti-inflammatory peptides get to work first.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 3-4</h4>
              <p>Visible skin improvements and deeper tissue repair. Collagen production ramps up. Many patients report improved skin tone, better recovery from workouts, and reduced joint stiffness.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 5+</h4>
              <p>Compounding benefits across all four peptides. Skin quality, elasticity, and glow continue to improve. Tissue healing matures and strengthens. Best results come from completing the full protocol.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Accordion */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What We Offer</div>
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Based on your goals, your provider may recommend one or more of the following.</p>
          <div className="accordion-list">
            {SERVICES.map((service) => {
              const isOpen = openAccordion === service.id;
              return (
                <div key={service.id} className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => toggleAccordion(service.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="accordion-header-left">
                      <span className="accordion-name">{service.name}</span>
                      <span className="accordion-price">{service.price}</span>
                    </div>
                    <span className={`accordion-chevron ${isOpen ? 'accordion-chevron-open' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>
                  <div
                    className="accordion-body"
                    style={{
                      maxHeight: isOpen ? '200px' : '0',
                      opacity: isOpen ? 1 : 0,
                      padding: isOpen ? '0 1.25rem 1.25rem' : '0 1.25rem',
                    }}
                  >
                    <p className="accordion-desc">{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> Peptides are classified for research purposes only and are not FDA-approved to diagnose, treat, cure, or prevent any disease. Individual results vary based on health status, dosage, and consistency. Do not adjust your protocol without consulting your provider.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you want to adjust your protocol or explore additional therapies, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .peptide-hero { background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); padding: 3.5rem 1.5rem 3rem; text-align: center; }
        .peptide-hero h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 1.25rem; }
        .hero-badge { display: inline-block; background: #000000; color: #ffffff; padding: 0.5rem 1rem; border-radius: 0; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.25rem; }
        .hero-sub { font-size: 1.0625rem; color: #525252; max-width: 600px; margin: 0 auto; line-height: 1.7; }
        .hero-dose { display: inline-flex; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; font-size: 0.9rem; color: #525252; }
        .hero-dose span { font-weight: 600; color: #171717; }
        .section { padding: 3.5rem 1.5rem; }
        .section-gray { background: #fafafa; }
        .section-kicker { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #737373; margin-bottom: 0.5rem; }
        .section-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 0.75rem; }
        .section-subtitle { font-size: 1rem; color: #525252; max-width: 600px; line-height: 1.7; margin-bottom: 2rem; }
        .body-text { font-size: 0.95rem; color: #525252; line-height: 1.7; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .info-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.75rem; }
        .info-card h3 { font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.75rem; }
        .info-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .info-card ul { list-style: none; padding: 0; margin: 0; }
        .info-card li { font-size: 0.9rem; color: #525252; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; }
        .info-card li::before { content: "✓"; position: absolute; left: 0; color: #000000; font-weight: 600; }
        .pricing-box { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; overflow: hidden; }
        .pricing-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; font-size: 0.9375rem; color: #525252; }
        .pricing-row + .pricing-row { border-top: 1px solid #e5e5e5; }
        .pricing-amount { font-weight: 700; color: #171717; }
        .tip-box { background: #ffffff; border-left: 4px solid #000000; padding: 1.25rem 1.5rem; border-radius: 0; }
        .tip-box strong { display: block; margin-bottom: 0.25rem; }
        .tip-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }

        .timeline-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .timeline-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.75rem; }
        .timeline-card h4 { font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.5rem; }
        .timeline-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }

        .accordion-list { display: flex; flex-direction: column; gap: 0; margin-top: 1.5rem; }
        .accordion-item { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; overflow: hidden; }
        .accordion-item + .accordion-item { border-top: 0; }
        .accordion-header { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 1.125rem 1.25rem; background: none; border: none; cursor: pointer; text-align: left; }
        .accordion-header:hover { background: #fafafa; }
        .accordion-header-left { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
        .accordion-name { font-size: 0.9375rem; font-weight: 700; color: #171717; }
        .accordion-price { font-size: 0.8125rem; color: #737373; font-weight: 400; }
        .accordion-chevron { display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; flex-shrink: 0; }
        .accordion-chevron-open { transform: rotate(180deg); }
        .accordion-body { overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease; }
        .accordion-desc { font-size: 0.9rem; color: #525252; line-height: 1.7; margin: 0; }

        .disclaimer { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.25rem; }
        .disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .final-cta { background: #000000; color: #ffffff; padding: 3.5rem 1.5rem; text-align: center; }
        .final-cta h2 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 1rem; }
        .final-cta p { font-size: 1rem; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-white { display: inline-block; background: #ffffff; color: #000000; padding: 0.875rem 1.75rem; border-radius: 0; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-white:hover { background: #f5f5f5; transform: translateY(-1px); }
        .btn-outline-white { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 1.75rem; border-radius: 0; border: 2px solid #ffffff; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-outline-white:hover { background: #ffffff; color: #000000; }
        .cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        @media (max-width: 768px) {
          .peptide-hero h1 { font-size: 2rem; }
          .hero-dose { flex-direction: column; gap: 0.5rem; }
          .info-grid { grid-template-columns: 1fr; }
          .timeline-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
          .accordion-header-left { flex-direction: column; gap: 0.25rem; }
        }
      `}</style>
    </Layout>
  );
}
