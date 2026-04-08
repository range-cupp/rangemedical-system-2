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
    description: 'Advanced peptide protocols for recovery, healing, and optimization. BPC-157, TB-500, GLOW, GHK-Cu, growth hormone blends, and more.',
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

export default function Ara290Guide() {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <Layout
      title="ARA-290 Peptide Guide | Range Medical"
      description="Your guide to ARA-290 peptide therapy. Neuroprotection, nerve pain support, and inflammation reduction. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", "name": "ARA-290 Peptide Guide", "description": "Patient guide for ARA-290 peptide therapy including protocol details, timeline, and safety information.", "url": "https://www.range-medical.com/ara-290-guide", "provider": { "@type": "MedicalBusiness", "name": "Range Medical", "telephone": "+1-949-997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } } }) }} />
      </Head>

      {/* Hero */}
      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Your Peptide Protocol Guide</span>
          <h1>ARA-290</h1>
          <p className="hero-sub">The neuroprotective peptide — an 11-amino-acid fragment derived from erythropoietin (EPO) that targets tissue repair and chronic inflammation without EPO's blood-forming effects.</p>
          <div className="hero-dose">
            <div><span>Dose:</span> 1.6–4 mg daily</div>
            <div><span>Duration:</span> Per provider protocol</div>
          </div>
        </div>
      </section>

      {/* What It Is */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is ARA-290?</h2>
          <p className="section-subtitle">ARA-290 (also called cibinetide) is a small peptide derived from a specific region of the EPO molecule.</p>
          <p className="body-text">It targets the innate repair receptor (IRR) — a receptor activated only when tissue is stressed or injured. That means ARA-290 can help with nerve repair, inflammation, and tissue healing in damaged areas without affecting red blood cell production the way full-length EPO would. It's been studied extensively for small-fiber neuropathy, sarcoidosis, and diabetic nerve pain.</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Key Benefits</div>
          <h2 className="section-title">What ARA-290 Does</h2>
          <p className="section-subtitle">The main mechanisms and effects patients can expect from a well-run protocol.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>Neuroprotection</h3>
              <ul>
                <li>Supports small-fiber nerve repair</li>
                <li>Activates the innate repair receptor</li>
                <li>Helps with nerve sensitivity and pain</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Anti-Inflammatory</h3>
              <ul>
                <li>Reduces chronic low-grade inflammation</li>
                <li>Helpful in neuroinflammatory conditions</li>
                <li>Supports tissue healing in injured areas</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Metabolic Support</h3>
              <ul>
                <li>Studied for diabetic neuropathy</li>
                <li>Supports peripheral nerve function</li>
                <li>May help insulin-related symptoms</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Recovery</h3>
              <ul>
                <li>Patients report reduced nerve pain</li>
                <li>Better sleep when pain decreases</li>
                <li>Supports functional quality of life</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Who It's For</div>
          <h2 className="section-title">Is This Right For You?</h2>
          <p className="section-subtitle">ARA-290 tends to be a strong fit for patients dealing with the following.</p>
          <div className="info-card">
            <ul>
                <li>Patients with small-fiber neuropathy or nerve pain</li>
                <li>Those with chronic inflammation-driven symptoms</li>
                <li>Patients recovering from injury-related nerve issues</li>
                <li>Patients with diabetic neuropathy (with provider oversight)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Protocol */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Your Protocol</div>
          <h2 className="section-title">How to Use ARA-290</h2>
          <p className="section-subtitle">Your provider has prescribed a protocol tailored to your goals. Here are the key details to keep in mind.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>Injection Frequency</h3>
              <p>Once daily subcutaneous injection, or as directed by your provider.</p>
            </div>
            <div className="info-card">
              <h3>Injection Site</h3>
              <p>Subcutaneous into the abdomen. Rotate sites daily.</p>
            </div>
            <div className="info-card">
              <h3>Duration</h3>
              <p>Typically run in structured cycles with a break between. Your provider will set the cadence based on your goals.</p>
            </div>
            <div className="info-card">
              <h3>Storage</h3>
              <p>Keep refrigerated. Do not freeze. Let the vial warm slightly before injection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Everyone responds differently, but here's what patients typically experience.</p>
          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1</h4>
              <p>Early signs — some patients notice nerve symptoms softening slightly. Most don't feel dramatic changes yet.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 2-3</h4>
              <p>Nerve pain and burning sensations often begin to reduce. Sleep frequently improves when pain decreases.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 4+</h4>
              <p>Cumulative repair effects. Patients typically report the biggest quality-of-life changes after several weeks of consistent use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Side Effects */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Safety</div>
          <h2 className="section-title">Side Effects</h2>
          <p className="section-subtitle">ARA-290 is generally well tolerated. Contact your provider if you experience anything unusual.</p>
          <div className="info-card">
            <ul>
                <li>Generally very well tolerated</li>
                <li>Mild injection-site redness</li>
                <li>Occasional mild fatigue early in protocol</li>
                <li>Unlike EPO, does not affect red blood cell production</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">FAQ</div>
          <h2 className="section-title">Common Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h4>Is this the same as EPO?</h4>
              <p>No. ARA-290 is a fragment of EPO that keeps the repair-signaling effects but not the red-blood-cell effects. Different receptor, different job.</p>
            </div>
            <div className="faq-item">
              <h4>How long does it take to work?</h4>
              <p>Most patients need several weeks of consistent use before nerve pain and inflammation meaningfully reduce.</p>
            </div>
            <div className="faq-item">
              <h4>Can I stack it with BPC-157?</h4>
              <p>Yes — many patients combine ARA-290 with BPC-157 for broader repair coverage.</p>
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
        .info-card li::before { content: "\u2713"; position: absolute; left: 0; color: #000000; font-weight: 600; }
        .tip-box { background: #ffffff; border-left: 4px solid #000000; padding: 1.25rem 1.5rem; border-radius: 0; }
        .tip-box strong { display: block; margin-bottom: 0.25rem; }
        .tip-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }
        .timeline-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .timeline-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.75rem; }
        .timeline-card h4 { font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 0.5rem; }
        .timeline-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .faq-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
        .faq-item { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; padding: 1.25rem 1.5rem; }
        .faq-item h4 { font-size: 0.9375rem; font-weight: 700; color: #171717; margin-bottom: 0.5rem; }
        .faq-item p { font-size: 0.9rem; color: #525252; line-height: 1.7; margin: 0; }
        .accordion-list { display: flex; flex-direction: column; gap: 0; margin-top: 1.5rem; }
        .accordion-item { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0; overflow: hidden; }
        .accordion-item + .accordion-item { border-top: 0; }
        .accordion-header { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 1.125rem 1.25rem; background: none; border: none; cursor: pointer; text-align: left; }
        .accordion-header:hover { background: #fafafa; }
        .accordion-header-left { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
        .accordion-name { font-size: 0.9375rem; font-weight: 700; color: #171717; }
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
