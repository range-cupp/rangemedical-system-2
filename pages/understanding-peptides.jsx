// pages/understanding-peptides.jsx
// Understanding Peptides — Educational page explaining Range Medical's peptide therapy framework

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function UnderstandingPeptides() {
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll-based animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.pm-page .pm-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // ===== Process steps =====
  const steps = [
    { step: 'Step 1', title: 'Take Your Assessment', desc: 'Start with a quick online assessment. Tell us about your goals, symptoms, and health history so we can point you in the right direction.' },
    { step: 'Step 2', title: 'Consultation & Labs (If Needed)', desc: 'Meet with our medical team. If your peptide protocol requires labs, we\'ll run bloodwork first. Recovery peptides can often start the same day.' },
    { step: 'Step 3', title: 'Start with Pre-Filled Syringes', desc: 'Begin your protocol with pre-filled syringes. We handle the dosing, schedule check-ins, track your progress, and adjust as needed. You\'re never on your own.' },
    { step: 'Step 4', title: 'Graduate to Vials', desc: 'Once you\'re established and comfortable, you have the option to transition to at-home vials. We train you on everything — reconstitution, injection technique, and storage.' }
  ];

  // ===== Pre-filled syringe protocols =====
  const syringeProtocols = [
    {
      name: 'BPC-157',
      pathway: 'recovery',
      desc: 'Tissue repair, gut healing, and anti-inflammatory support. Our most popular recovery peptide.',
      durations: '10, 20, and 30-day protocols available'
    },
    {
      name: 'BPC-157 + Thymosin Beta-4',
      pathway: 'recovery',
      desc: 'Enhanced healing combo — BPC-157 for tissue repair paired with TB-4 for systemic recovery and flexibility.',
      durations: '10, 20, and 30-day protocols available'
    },
    {
      name: 'GHK-Cu',
      pathway: 'recovery',
      desc: 'Copper peptide for skin regeneration, wound healing, and collagen production.',
      durations: '30-day protocols available'
    },
    {
      name: 'GLOW Blend (GHK-Cu + BPC-157 + TB-500)',
      pathway: 'recovery',
      desc: 'Skin health, hair vitality, and tissue repair through a synergistic peptide combination.',
      durations: '30-day protocols available'
    },
    {
      name: 'MOTS-C',
      pathway: 'optimization',
      desc: 'Mitochondrial peptide that enhances cellular energy, metabolism, and anti-aging pathways.',
      durations: '20-day protocols available'
    },
    {
      name: '2X Blend (Tesamorelin / Ipamorelin)',
      pathway: 'optimization',
      desc: 'Growth hormone secretagogue blend for fat loss, recovery, and body composition.',
      durations: '30-day protocols available at multiple dosage levels'
    },
    {
      name: '3X Blend (Tesamorelin / MGF / Ipamorelin)',
      pathway: 'optimization',
      desc: 'Triple GH blend adding MGF for enhanced muscle recovery and growth factor support.',
      durations: '30-day protocols available at multiple dosage levels'
    },
    {
      name: '4X Blend (GHRP-2 / Tesamorelin / MGF / Ipamorelin)',
      pathway: 'optimization',
      desc: 'Our most comprehensive GH secretagogue blend for maximum recovery, growth, and cognition support.',
      durations: '30-day protocols available at multiple dosage levels'
    }
  ];

  // ===== Vial categories =====
  const vialCategories = [
    {
      id: 'healing',
      title: 'Healing & Recovery',
      labNote: 'No labs required',
      labColor: '#10b981',
      products: [
        { name: 'BPC-157', desc: 'Tissue repair, gut healing, and joint support' },
        { name: 'TB-500', desc: 'Systemic healing, tissue repair, and reduced inflammation' },
        { name: 'BPC-157 / Thymosin-Beta 4', desc: 'Enhanced healing combo for accelerated recovery' },
        { name: 'KPV', desc: 'Anti-inflammatory peptide supporting gut and immune health' },
        { name: 'GHK-Cu (Copper Peptide)', desc: 'Skin regeneration, wound healing, and collagen support' },
        { name: 'KLOW Blend (GHK-Cu, KPV, BPC-157, TB-500)', desc: 'Skin health, pigmentation balance, hair vitality, and tissue repair' },
        { name: 'LL-37', desc: 'Antimicrobial peptide with immune-boosting properties' },
        { name: 'GLOW (GHK-Cu + BPC-157 + TB-500)', desc: 'Skin health and tissue repair through synergistic peptide signaling' }
      ]
    },
    {
      id: 'longevity',
      title: 'Mitochondrial & Longevity',
      labNote: 'Labs optional',
      labColor: '#f59e0b',
      products: [
        { name: 'MOTS-C', desc: 'Cellular energy, metabolism, and anti-aging support' },
        { name: 'Epitalon', desc: 'Telomere regulation, sleep cycle support, and longevity' },
        { name: 'SS-31', desc: 'Mitochondrial-targeted peptide for cellular energy and recovery' },
        { name: 'NAD+ 1000mg', desc: 'Cellular repair, energy production, and neuroprotection' }
      ]
    },
    {
      id: 'fatloss',
      title: 'Fat Loss & Metabolism',
      labNote: 'Labs required',
      labColor: '#3b82f6',
      products: [
        { name: 'AOD-9604', desc: 'Fat-burning peptide fragment without affecting blood sugar' },
        { name: 'Tesamorelin', desc: 'Reduces visceral fat and enhances growth hormone release' },
        { name: 'CJC-1295 / Ipamorelin', desc: 'GH secretagogue duo for fat loss and lean mass' },
        { name: 'Tesamorelin / Ipamorelin', desc: 'Potent GH blend for body composition and recovery' },
        { name: '2X Blend (Tesamorelin / Ipamorelin)', desc: 'Synergistic GH-boosting blend' },
        { name: '3X Blend (Tesamorelin / MGF / Ipamorelin)', desc: 'Triple blend for recovery, growth, and cognition' },
        { name: '4X Blend (GHRP-2 / Tesamorelin / MGF / Ipamorelin)', desc: 'Comprehensive GH blend for maximum support' }
      ]
    }
  ];

  // ===== FAQ =====
  const faqs = [
    {
      question: 'What\'s the difference between pre-filled syringes and vials?',
      answer: 'Pre-filled syringes are pre-measured, ready-to-inject doses — no mixing or measuring required. They\'re how we start every patient so we can track your progress and adjust your protocol. Vials are multi-dose containers that you reconstitute and draw from at home. They offer more flexibility and are typically more cost-effective for long-term use. We transition patients to vials once they\'re established.'
    },
    {
      question: 'Do I need labs before starting peptides?',
      answer: 'It depends on the peptide. Recovery peptides like BPC-157, TB-500, and KPV do not require labs — you can start the same day after your assessment. Weight loss peptides and growth hormone secretagogues (the GH blends) do require bloodwork first. Mitochondrial and longevity peptides have optional labs, but we recommend them for a complete picture.'
    },
    {
      question: 'How long is a typical peptide protocol?',
      answer: 'Pre-filled syringe protocols range from 10 to 30 days depending on the peptide and your goals. Many patients cycle through multiple rounds based on their progress. Your provider will design a timeline specific to your situation during your consultation.'
    },
    {
      question: 'Can I combine multiple peptides?',
      answer: 'Absolutely. Many of our patients use multiple peptides as part of a broader protocol. For example, someone recovering from an injury might combine BPC-157 with TB-500. Someone focused on longevity might combine a GH blend with MOTS-C. Your provider will design the right combination for your goals.'
    },
    {
      question: 'How do the check-ins work?',
      answer: 'When you\'re on a pre-filled syringe protocol, we schedule regular check-ins to monitor your progress, assess how you\'re responding, and make any dosage adjustments. This is done through our patient portal and in-person visits. It\'s a hands-on process — we don\'t just hand you syringes and say good luck.'
    },
    {
      question: 'How do I store my peptides?',
      answer: 'Pre-filled syringes should be stored in the refrigerator. Vials that have been reconstituted also need refrigeration. Unreconstituted vial powder can be stored at room temperature. We provide full storage and handling instructions with every protocol.'
    }
  ];

  return (
    <Layout
      title="Understanding Peptides | How Peptide Therapy Works | Newport Beach | Range Medical"
      description="Learn how peptide therapy works at Range Medical. Guided pre-filled syringe protocols with check-ins and progress tracking, plus at-home vial options. Newport Beach."
    >
      <Head>
        <meta name="keywords" content="understanding peptides, peptide therapy Newport Beach, BPC-157, TB-500, growth hormone peptides, recovery peptides, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/understanding-peptides" />

        <meta property="og:title" content="Understanding Peptides | How Peptide Therapy Works | Newport Beach" />
        <meta property="og:description" content="Learn how peptide therapy works at Range Medical. Guided protocols with check-ins, progress tracking, and at-home options." />
        <meta property="og:url" content="https://www.range-medical.com/understanding-peptides" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Understanding Peptides | How Peptide Therapy Works | Newport Beach" />
        <meta name="twitter:description" content="Learn how peptide therapy works at Range Medical. Guided protocols with check-ins and progress tracking." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'MedicalBusiness',
                'name': 'Range Medical',
                'url': 'https://www.range-medical.com',
                'telephone': '(949) 997-3988',
                'address': {
                  '@type': 'PostalAddress',
                  'streetAddress': '1901 Westcliff Dr. Suite 10',
                  'addressLocality': 'Newport Beach',
                  'addressRegion': 'CA',
                  'postalCode': '92660',
                  'addressCountry': 'US'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': faqs.map(faq => ({
                  '@type': 'Question',
                  'name': faq.question,
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer
                  }
                }))
              }
            ])
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      <div className="pm-page">

        {/* ===== HERO ===== */}
        <section className="pm-hero">
          <div className="pm-kicker">Peptide Therapy · Range Medical</div>
          <h1>Understanding Peptides</h1>
          <p className="pm-body-text">
            How we guide you from your first protocol to at-home therapy — with check-ins, progress tracking, and clinical oversight every step of the way.
          </p>
          <div className="pm-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* ===== TWO PATHWAYS ===== */}
        <section className="pm-section pm-section-alt">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker">How You Get Started</div>
              <h2>Two pathways into peptide therapy.</h2>
              <div className="pm-divider"></div>
              <p className="pm-body-text">
                Which peptides are available to you depends on what you're looking to address. Here's how our two pathways work.
              </p>
            </div>

            <div className="pm-pathways-grid pm-animate">
              {/* Injury & Recovery Card */}
              <div className="pm-pathway-card">
                <div className="pm-pathway-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3>Injury & Recovery</h3>
                <div className="pm-pathway-badge" style={{ background: '#10b981' }}>No Labs Required</div>
                <p className="pm-pathway-desc">
                  For patients healing from injuries, managing chronic pain, recovering from surgery, or looking to accelerate their body's natural repair process.
                </p>
                <ul className="pm-pathway-list">
                  <li>Recovery peptides available immediately after assessment</li>
                  <li>BPC-157, TB-500, KPV, GHK-Cu, LL-37, and blends</li>
                  <li>Can start the same day</li>
                </ul>
              </div>

              {/* Energy & Optimization Card */}
              <div className="pm-pathway-card">
                <div className="pm-pathway-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3>Energy & Optimization</h3>
                <div className="pm-pathway-badge" style={{ background: '#3b82f6' }}>Labs May Be Required</div>
                <p className="pm-pathway-desc">
                  For patients focused on fat loss, growth hormone optimization, cellular energy, longevity, or overall performance enhancement.
                </p>
                <ul className="pm-pathway-list">
                  <li>Weight loss & GH peptides require labs (Essential or Elite panel)</li>
                  <li>Mitochondrial & longevity peptides — labs optional but recommended</li>
                  <li>Recovery peptides also available on this path without labs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="pm-section">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker">The Process</div>
              <h2>How peptide therapy works at Range.</h2>
              <div className="pm-divider"></div>
              <p className="pm-body-text">
                We don't just hand you peptides and wish you luck. Here's the guided process from start to finish.
              </p>
            </div>

            <div className="pm-steps-list">
              {steps.map((item, i) => (
                <div key={i} className="pm-step-item pm-animate">
                  <div className="pm-step-number">{item.step}</div>
                  <div className="pm-step-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRE-FILLED SYRINGES ===== */}
        <section className="pm-section pm-section-inverted">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker">Your Starting Point</div>
              <h2>Pre-Filled Syringe Protocols</h2>
              <div className="pm-divider"></div>
              <p className="pm-body-text">
                Every patient starts here. Pre-filled syringes are pre-measured, ready-to-inject doses — no mixing or guesswork. We track your progress, schedule check-ins, and adjust your protocol as needed.
              </p>
            </div>

            <div className="pm-features-row pm-animate">
              <div className="pm-feature-item">
                <div className="pm-feature-icon">✓</div>
                <div className="pm-feature-text">Pre-measured doses</div>
              </div>
              <div className="pm-feature-item">
                <div className="pm-feature-icon">✓</div>
                <div className="pm-feature-text">Regular check-ins</div>
              </div>
              <div className="pm-feature-item">
                <div className="pm-feature-icon">✓</div>
                <div className="pm-feature-text">Progress tracking</div>
              </div>
              <div className="pm-feature-item">
                <div className="pm-feature-icon">✓</div>
                <div className="pm-feature-text">Dosage adjustments</div>
              </div>
            </div>

            <div className="pm-syringe-grid pm-animate">
              {syringeProtocols.map((protocol, i) => (
                <div key={i} className="pm-syringe-card">
                  <div className="pm-syringe-badge" style={{ background: protocol.pathway === 'recovery' ? '#10b981' : '#3b82f6' }}>
                    {protocol.pathway === 'recovery' ? 'No Labs' : 'Labs Required'}
                  </div>
                  <h4 className="pm-syringe-name">{protocol.name}</h4>
                  <p className="pm-syringe-desc">{protocol.desc}</p>
                  <div className="pm-syringe-duration">{protocol.durations}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== VIALS ===== */}
        <section className="pm-section pm-section-alt">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker">The At-Home Option</div>
              <h2>Peptide Vials</h2>
              <div className="pm-divider"></div>
              <p className="pm-body-text">
                Once you've completed a supervised protocol and you're comfortable with the process, vials give you the flexibility to self-administer at home. We train you on everything — reconstitution, injection technique, and proper storage.
              </p>
            </div>

            {vialCategories.map((cat) => (
              <div key={cat.id} className="pm-vial-category pm-animate">
                <div className="pm-vial-category-header">
                  <h3>{cat.title}</h3>
                  <span className="pm-vial-lab-badge" style={{ background: cat.labColor }}>{cat.labNote}</span>
                </div>
                <div className="pm-vial-grid">
                  {cat.products.map((product, j) => (
                    <div key={j} className="pm-vial-item">
                      <div className="pm-vial-name">{product.name}</div>
                      <div className="pm-vial-desc">{product.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== COMPARISON ===== */}
        <section className="pm-section">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker">Vials vs. Pre-Filled</div>
              <h2>Which option is right for you?</h2>
              <div className="pm-divider"></div>
            </div>

            <div className="pm-compare-grid pm-animate">
              <div className="pm-compare-card">
                <div className="pm-compare-label">Start Here</div>
                <h3>Pre-Filled Syringes</h3>
                <ul className="pm-compare-list">
                  <li>Pre-measured — no mixing or guesswork</li>
                  <li>Supervised by our medical team</li>
                  <li>Regular check-ins and progress tracking</li>
                  <li>Dosage adjusted based on your response</li>
                  <li>Best for getting started and shorter protocols</li>
                </ul>
              </div>
              <div className="pm-compare-card">
                <div className="pm-compare-label">Graduate To</div>
                <h3>Vials</h3>
                <ul className="pm-compare-list">
                  <li>Self-administered at home on your schedule</li>
                  <li>More flexible dosing options</li>
                  <li>More cost-effective for long-term use</li>
                  <li>Full training provided on reconstitution and injection</li>
                  <li>Best for established patients on ongoing protocols</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="pm-section pm-section-alt">
          <div className="pm-container">
            <span className="pm-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="pm-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`pm-faq-item ${openFaq === index ? 'pm-faq-open' : ''}`}>
                  <button className="pm-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                    </svg>
                  </button>
                  <div className="pm-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="pm-section pm-section-inverted pm-cta-section">
          <div className="pm-container">
            <div className="pm-animate">
              <div className="pm-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="pm-cta-title">Ready to explore peptide therapy?</h2>
              <p className="pm-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a free assessment and our team will guide you to the right protocol. Or give us a call — we're happy to answer any questions.
              </p>
              <div className="pm-cta-buttons">
                <Link href="/range-assessment?path=injury" className="pm-btn-primary">Injury & Recovery</Link>
                <Link href="/range-assessment?path=energy" className="pm-btn-primary">Energy & Optimization</Link>
              </div>
              <div className="pm-cta-phone-row">
                <div className="pm-cta-or">or call us</div>
                <a href="tel:9499973988" className="pm-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        /* ===== PEPTIDE MENU PAGE SCOPED STYLES ===== */
        .pm-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .pm-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.pm-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .pm-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .pm-section {
          padding: 5rem 1.5rem;
        }

        .pm-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .pm-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        .pm-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        /* Kicker */
        .pm-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .pm-section-inverted .pm-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .pm-page h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #171717;
        }

        .pm-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .pm-page h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
        }

        .pm-section-inverted h1,
        .pm-section-inverted h2,
        .pm-section-inverted h3,
        .pm-section-inverted h4 {
          color: #ffffff;
        }

        /* Body Text */
        .pm-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 620px;
        }

        .pm-section-inverted .pm-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .pm-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .pm-section-inverted .pm-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* ===== HERO ===== */
        .pm-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pm-hero h1 {
          max-width: 700px;
          margin-bottom: 1.5rem;
        }

        .pm-hero .pm-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .pm-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .pm-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: pm-bounce 2s ease-in-out infinite;
        }

        @keyframes pm-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* ===== PATHWAYS ===== */
        .pm-pathways-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .pm-pathway-card {
          padding: 2.5rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pm-pathway-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .pm-pathway-icon {
          margin-bottom: 1.25rem;
        }

        .pm-pathway-card h3 {
          font-size: 1.375rem;
          margin-bottom: 0.75rem;
        }

        .pm-pathway-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffffff;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .pm-pathway-desc {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1.25rem;
        }

        .pm-pathway-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pm-pathway-list li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.5rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }

        .pm-pathway-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #737373;
        }

        /* ===== STEPS ===== */
        .pm-steps-list {
          margin-top: 2.5rem;
        }

        .pm-step-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .pm-step-item:last-child {
          border-bottom: none;
        }

        .pm-step-number {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .pm-step-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .pm-step-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* ===== PRE-FILLED FEATURES ===== */
        .pm-features-row {
          display: flex;
          gap: 2rem;
          margin: 2rem 0 2.5rem;
          flex-wrap: wrap;
        }

        .pm-feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pm-feature-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 700;
        }

        .pm-feature-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        /* ===== SYRINGE CARDS ===== */
        .pm-syringe-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .pm-syringe-card {
          padding: 1.75rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          transition: border-color 0.2s ease;
        }

        .pm-syringe-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .pm-syringe-badge {
          display: inline-block;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #ffffff;
          padding: 0.25rem 0.625rem;
          border-radius: 3px;
          margin-bottom: 0.875rem;
        }

        .pm-syringe-name {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .pm-syringe-desc {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.75rem;
        }

        .pm-syringe-duration {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ===== VIAL CATEGORIES ===== */
        .pm-vial-category {
          margin-top: 2.5rem;
        }

        .pm-vial-category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .pm-vial-category-header h3 {
          font-size: 1.125rem;
          margin: 0;
        }

        .pm-vial-lab-badge {
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #ffffff;
          padding: 0.25rem 0.625rem;
          border-radius: 3px;
        }

        .pm-vial-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .pm-vial-item {
          padding: 1.25rem 1.5rem;
          border-radius: 10px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease;
        }

        .pm-vial-item:hover {
          border-color: #000000;
        }

        .pm-vial-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .pm-vial-desc {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #737373;
        }

        /* ===== COMPARISON ===== */
        .pm-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .pm-compare-card {
          padding: 2.5rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
        }

        .pm-compare-label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0891b2;
          margin-bottom: 0.75rem;
        }

        .pm-compare-card h3 {
          margin-bottom: 1.25rem;
        }

        .pm-compare-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pm-compare-list li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
          border-bottom: 1px solid #f5f5f5;
        }

        .pm-compare-list li:last-child {
          border-bottom: none;
        }

        .pm-compare-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: 700;
          font-size: 0.8125rem;
        }

        /* ===== FAQ ===== */
        .pm-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .pm-faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .pm-faq-item:last-child {
          border-bottom: none;
        }

        .pm-faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }

        .pm-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .pm-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .pm-faq-open .pm-faq-question svg {
          transform: rotate(180deg);
        }

        .pm-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .pm-faq-open .pm-faq-answer {
          max-height: 400px;
          padding-bottom: 1.25rem;
        }

        .pm-faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* ===== CTA ===== */
        .pm-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .pm-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .pm-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .pm-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .pm-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        .pm-cta-phone-row {
          margin-top: 1.5rem;
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          align-items: center;
        }

        .pm-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .pm-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .pm-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .pm-section {
            padding: 3rem 1.5rem;
          }

          .pm-section-alt {
            padding: 3rem 1.5rem;
          }

          .pm-page h1 {
            font-size: 2.25rem;
          }

          .pm-page h2 {
            font-size: 1.5rem;
          }

          .pm-hero {
            padding: 3rem 1.5rem;
          }

          .pm-pathways-grid {
            grid-template-columns: 1fr;
          }

          .pm-syringe-grid {
            grid-template-columns: 1fr;
          }

          .pm-vial-grid {
            grid-template-columns: 1fr;
          }

          .pm-compare-grid {
            grid-template-columns: 1fr;
          }

          .pm-step-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .pm-features-row {
            gap: 1rem;
          }

          .pm-cta-title {
            font-size: 2rem;
          }

          .pm-cta-buttons {
            flex-direction: column;
          }

          .pm-cta-section {
            padding: 4rem 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
