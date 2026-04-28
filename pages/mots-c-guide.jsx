import { useState } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

const SERVICES = [
  {
    id: 'hrt',
    name: 'Hormone Optimization',
    description: 'Testosterone, thyroid, and hormone balancing for men and women. Includes all medications, ongoing labs, provider check-ins, and one IV per month.',
  },
  {
    id: 'weight-loss',
    name: 'Medical Weight Loss',
    description: 'Physician-supervised GLP-1 medications (Semaglutide, Tirzepatide, Retatrutide) with labs and ongoing support.',
  },
  {
    id: 'iv',
    name: 'IV Therapy',
    description: 'Custom IV vitamin infusions including NAD+, high-dose Vitamin C, glutathione, methylene blue, and build-your-own options.',
  },
  {
    id: 'peptide',
    name: 'Peptide Therapy',
    description: 'Advanced peptide protocols for recovery, healing, and optimization. BPC-157, TB-4, GLOW, GHK-Cu, growth hormone blends, and more.',
  },
  {
    id: 'injections',
    name: 'Vitamin Injections',
    description: 'Fast nutrient delivery: B12, B-Complex, D3, Biotin, Glutathione, NAD+, and more.',
  },
  {
    id: 'nad',
    name: 'NAD+ Therapy',
    description: 'High-dose NAD+ via IV or injection for cellular energy, brain function, and recovery.',
  },
  {
    id: 'hbot',
    name: 'Hyperbaric Oxygen Therapy',
    description: 'Pressurized oxygen therapy for injury recovery, cognitive performance, and longevity.',
  },
  {
    id: 'rlt',
    name: 'Red Light Therapy',
    description: 'Photobiomodulation for muscle recovery, skin health, and cellular regeneration.',
  },
  {
    id: 'prp',
    name: 'PRP Therapy',
    description: 'Your own concentrated platelets injected to support tissue repair for joint pain and tendon issues.',
  },
  {
    id: 'reset',
    name: '6-Week Cellular Reset',
    description: 'Comprehensive program combining multiple therapies for full cellular energy restoration.',
  },
];

export default function MOTScGuide() {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <Layout
      title="MOTS-C Peptide Guide | Range Medical"
      description="Your guide to MOTS-C peptide therapy. How it works, protocol options, what to expect, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", "name": "MOTS-C Peptide Guide", "description": "Patient guide for MOTS-C peptide therapy including protocol details, phased dosing, timeline, and safety information.", "url": "https://www.range-medical.com/mots-c-guide", "provider": { "@type": "MedicalBusiness", "name": "Range Medical", "telephone": "+1-949-997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } } }) }} />
      </Head>

      {/* Hero */}
      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Your Peptide Protocol Guide</span>
          <h1>MOTS-C</h1>
          <p className="hero-sub">The mitochondrial metabolic peptide — a naturally encoded signaling molecule that regulates metabolism, glucose handling, and fat burning at the deepest level of your cellular biology.</p>
          <div className="hero-dose">
            <div><span>Category:</span> Longevity</div>
            <div><span>Delivery:</span> In-clinic or take-home</div>
          </div>
        </div>
      </section>

      {/* What Is MOTS-C */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is MOTS-C?</h2>
          <p className="section-subtitle">MOTS-C stands for Mitochondrial Open Reading Frame of the 12S rRNA Type-c. It's a 16-amino-acid peptide encoded in your mitochondrial DNA — not your nuclear DNA like most proteins.</p>
          <p className="body-text">MOTS-C is a natural signaling molecule produced by your mitochondria to regulate metabolism, glucose handling, and fat burning throughout your body. Think of it as a message your mitochondria send to keep your metabolism running efficiently. As you age, your natural MOTS-C levels decline — which is a key reason metabolic function slows down over time. Supplementing MOTS-C helps restore that signal to more youthful levels.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What MOTS-C Does</h2>
          <p className="section-subtitle">Four key mechanisms that make MOTS-C one of the most powerful longevity peptides available.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>Metabolic Activation</h3>
              <ul>
                <li>Activates the AMPK pathway (metabolic master switch)</li>
                <li>Improves glucose uptake and insulin sensitivity</li>
                <li>Shifts cells toward energy production over storage</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Fat Metabolism</h3>
              <ul>
                <li>Promotes fat burning and improves body composition</li>
                <li>Supports exercise-mimetic effects at the cellular level</li>
                <li>Enhances how cells use fatty acids for fuel</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Exercise Performance</h3>
              <ul>
                <li>Enhances endurance and exercise capacity</li>
                <li>Improves how cells use energy during activity</li>
                <li>Supports faster recovery between sessions</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Longevity</h3>
              <ul>
                <li>Supports healthy aging at the mitochondrial level</li>
                <li>Protects against age-related metabolic decline</li>
                <li>Promotes mitochondrial biogenesis (new mitochondria)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Your Protocol */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How to Use MOTS-C</h2>
          <p className="section-subtitle">MOTS-C offers two protocol options. Your provider will recommend the best fit based on your goals and lifestyle.</p>

          <div className="protocol-options">
            <div className="protocol-option-card">
              <div className="protocol-option-label">Option A</div>
              <h3>20-Day Protocol</h3>
              <p className="protocol-option-desc">5mg injection every 5 days (4 injections per phase). Best for patients who prefer fewer, higher-dose injections with more time between each one.</p>
            </div>
            <div className="protocol-option-card">
              <div className="protocol-option-label">Option B</div>
              <h3>30-Day Protocol</h3>
              <p className="protocol-option-desc">1mg daily, 5 days on / 2 days off (20 injections per phase). Best for patients who prefer consistent daily dosing with lower individual doses.</p>
            </div>
          </div>

          <div className="info-grid" style={{ marginTop: '1.5rem' }}>
            <div className="info-card">
              <h3>Injection Site</h3>
              <p>Subcutaneous injection in the abdomen. Rotate sites to prevent irritation. Morning injection is recommended.</p>
            </div>
            <div className="info-card">
              <h3>Storage</h3>
              <p>Keep refrigerated at all times. Do not freeze. Remove from fridge a few minutes before injection to reach room temperature.</p>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Pro Tip</strong>
            <p>For the 30-day protocol, set a daily phone reminder. For the 20-day protocol, mark your injection days on a calendar. Consistency is key to maximizing results.</p>
          </div>
        </div>
      </section>

      {/* Phased Dosing */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Phased Dosing</div>
          <h2 className="section-title">Phase 1 &amp; Phase 2</h2>
          <p className="section-subtitle">MOTS-C uses a phased approach — starting at a baseline dose, then increasing for deeper metabolic optimization.</p>

          <div className="phase-card">
            <div className="phase-header">
              <h3>Phase 1 — Baseline</h3>
            </div>
            <p className="phase-total">20mg total peptide</p>
            <div className="phase-options">
              <div className="phase-option">
                <span className="phase-option-label">20-Day Protocol:</span> 5mg every 5 days (4 injections)
              </div>
              <div className="phase-option">
                <span className="phase-option-label">30-Day Protocol:</span> 1mg daily, 5 on / 2 off (20 injections)
              </div>
            </div>
          </div>

          <div className="phase-card">
            <div className="phase-header">
              <h3>Phase 2 — Escalation</h3>
            </div>
            <p className="phase-total">40mg total peptide</p>
            <div className="phase-options">
              <div className="phase-option">
                <span className="phase-option-label">20-Day Protocol:</span> 10mg every 5 days (4 injections)
              </div>
              <div className="phase-option">
                <span className="phase-option-label">30-Day Protocol:</span> 2mg daily, 5 on / 2 off (20 injections)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Everyone responds differently, but here's what patients typically experience during a MOTS-C protocol.</p>
          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1-2</h4>
              <p>Improved energy levels and better exercise tolerance. Some patients notice they feel more alert and their workouts feel more productive. Early metabolic signaling begins.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 3-4</h4>
              <p>Body composition changes become noticeable. Sustained metabolic improvement, better endurance, and improved recovery between training sessions.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 5+</h4>
              <p>Deep metabolic optimization. Compounding benefits in energy production, fat utilization, and cellular efficiency. Many patients report their best results in this phase.</p>
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
        .tip-box { background: #ffffff; border-left: 4px solid #000000; padding: 1.25rem 1.5rem; border-radius: 0; }
        .tip-box strong { display: block; margin-bottom: 0.25rem; }
        .tip-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }

        .protocol-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .protocol-option-card { background: #ffffff; border: 2px solid #e5e5e5; border-radius: 0; padding: 1.75rem; }
        .protocol-option-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #737373; margin-bottom: 0.5rem; }
        .protocol-option-card h3 { font-size: 1.125rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.75rem; }
        .protocol-option-desc { font-size: 0.9rem; color: #525252; line-height: 1.7; margin: 0; }

        .phase-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.75rem; margin-bottom: 1.25rem; }
        .phase-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.25rem; }
        .phase-header h3 { font-size: 1.125rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin: 0; }
        .phase-price { font-size: 1.125rem; font-weight: 900; color: #171717; }
        .phase-total { font-size: 0.875rem; color: #737373; margin-bottom: 1rem; }
        .phase-options { display: flex; flex-direction: column; gap: 0.5rem; }
        .phase-option { font-size: 0.9rem; color: #525252; line-height: 1.6; padding: 0.625rem 0.875rem; background: #fafafa; border: 1px solid #f0f0f0; }
        .phase-option-label { font-weight: 700; color: #171717; }

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
          .protocol-options { grid-template-columns: 1fr; }
          .timeline-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
          .accordion-header-left { flex-direction: column; gap: 0.25rem; }
          .phase-header { flex-direction: column; gap: 0.25rem; }
        }
      `}</style>
    </Layout>
  );
}
