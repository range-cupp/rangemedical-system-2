// pages/peptide-sourcing.jsx
// Peptide Sourcing — Patient-facing comparison of U.S. vs overseas peptide manufacturing

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function PeptideSourcing() {
  const [openFaq, setOpenFaq] = useState(null);

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

    const elements = document.querySelectorAll('.pep-page .pep-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Patient-facing translation of the six manufacturing factors
  const comparisons = [
    {
      factor: 'Synthesis Method',
      us: {
        label: 'FMOC-controlled, step-verified',
        detail: 'Every amino acid is independently verified before the next is added.',
      },
      overseas: {
        label: 'Shortened cycles, reused resins',
        detail: 'Speed-optimized synthesis can leave hidden defects that pass weight tests but fail in your body.',
      },
    },
    {
      factor: 'Quality Verification',
      us: {
        label: 'HPLC + LC-MS/MS + NMR + endotoxin testing',
        detail: 'Multi-layer verification confirms purity, sequence, structure, and safety.',
      },
      overseas: {
        label: 'Often a single LC-MS check',
        detail: 'A correct molecular weight does not guarantee a correctly folded peptide.',
      },
    },
    {
      factor: 'Vial Glass',
      us: {
        label: 'Pharmaceutical-grade USP Type I',
        detail: 'Engineered to release zero endotoxins or heavy metals into your peptide.',
      },
      overseas: {
        label: 'Variable, often generic borosilicate',
        detail: 'Can leach metals and alkaline ions that degrade the peptide while it sits in the bottle.',
      },
    },
    {
      factor: 'Endotoxin & Metal Control',
      us: {
        label: 'Tested at parts-per-billion',
        detail: 'Even trace contamination is removed before the vial is filled.',
      },
      overseas: {
        label: 'Inconsistent or not tested',
        detail: 'Trace endotoxins disrupt peptide folding the moment you reconstitute it.',
      },
    },
    {
      factor: 'Cold Chain & Distribution',
      us: {
        label: 'Days from lab to vial, temperature-controlled',
        detail: 'Lyophilization integrity is preserved end-to-end.',
      },
      overseas: {
        label: 'Long transit, customs delays, inconsistent temps',
        detail: 'Heat and humidity damage the peptide before you ever open the box.',
      },
    },
    {
      factor: 'Bioactivity Over Time',
      us: {
        label: 'Stability tested under stress',
        detail: 'Designed to stay bioactive through the entire vial.',
      },
      overseas: {
        label: 'Acceptable at release, decays fast',
        detail: 'May lose effectiveness within days of reconstitution.',
      },
    },
  ];

  // The 4 pillars — what makes a peptide actually work
  const pillars = [
    {
      number: '01',
      title: 'How It Is Built',
      desc: 'Peptides are assembled one amino acid at a time. Each link has to be verified before the next is added. Skip a verification step and the peptide can pass a weight test but be subtly broken — wrong shape, wrong charge, wrong receptor fit.',
    },
    {
      number: '02',
      title: 'What It Is Stored In',
      desc: 'Cheap glass leaches heavy metals and alkaline ions into the liquid. Those contaminants slowly destroy the peptide. A great peptide is sealed in pharmaceutical-grade glass — the same standard used for hospital injectables — engineered to release no contaminants while it sits.',
    },
    {
      number: '03',
      title: 'How It Is Verified',
      desc: 'Real verification means HPLC, LC-MS/MS, NMR spectroscopy, endotoxin testing, and stability studies. Cheaper labs typically run one of these and ship. Our source runs all of them on every batch.',
    },
    {
      number: '04',
      title: 'How It Gets To You',
      desc: 'Peptides are temperature-sensitive. A few hours in a hot warehouse or at customs can damage them. Domestic supply means short transit, controlled temperature, and no surprises.',
    },
  ];

  // Patient-facing FAQs — translated from the technical source
  const faqs = [
    {
      question: 'Why does it matter where my peptides are made?',
      answer:
        'Two peptides can look identical in the bottle and behave completely differently in your body. The difference is process discipline — how the peptide is built, verified, stored, and shipped. U.S. labs are built around keeping the molecule structurally correct from synthesis to your refrigerator. Many overseas facilities prioritize speed and cost.',
    },
    {
      question: 'What is FMOC-controlled synthesis, in plain English?',
      answer:
        'It is a manufacturing method where every single amino acid added to the peptide chain is independently verified before the next one is added. Without that step-by-step verification, errors stack up silently — and you end up with a molecule that has roughly the right weight but the wrong structure.',
    },
    {
      question: 'Why does the glass vial matter as much as the peptide itself?',
      answer:
        'Peptides do not exist in isolation — they live inside the glass for weeks or months. Low-quality glass leaches heavy metals and alkaline ions into the liquid, which slowly degrade the molecule. A great peptide is sealed in pharmaceutical-grade glass engineered to release no detectable endotoxins or heavy metals — the same standard used for hospital injectables.',
    },
    {
      question: 'What are endotoxins and why should I care?',
      answer:
        'Endotoxins are bacterial fragments that contaminate poorly manufactured products. Even at parts-per-billion levels, they disrupt the precise charge balance that holds a peptide in its correct shape. A misfolded peptide cannot bind to the receptors it is supposed to. It is still in the vial — but it does not work.',
    },
    {
      question: 'How do I know my peptide is actually what the label says?',
      answer:
        'Real verification involves multiple independent tests: high-resolution HPLC (purity), LC-MS/MS (sequence confirmation), NMR (structural verification), endotoxin testing, and stress-stability studies. We only use peptides from sources that document all of these. A single mass-spec check is not verification.',
    },
    {
      question: 'Why do cheap peptides lose effect so quickly?',
      answer:
        'Each shortcut compounds. By the time a vial has gone through fast synthesis, reactive glass, possible contamination, and a long unrefrigerated shipment, the molecule inside is no longer the molecule that was promised. It might still pass a basic weight test — but it has already started falling apart at the bond level.',
    },
    {
      question: 'Why is Range Medical more expensive than gray-market peptides online?',
      answer:
        'Pharmaceutical-grade synthesis, hospital-grade glassware, multi-layer verification, and cold-chain distribution cost more than the alternative. Lower-cost peptides may meet superficial specs, but failure at the functional level costs far more — lost time, no results, and uncertainty about what you actually injected. A cheap peptide ends up being the most expensive one if it does not work.',
    },
    {
      question: 'Where does Range Medical source its peptides?',
      answer:
        'Range Medical sources peptides exclusively from documented U.S.-based manufacturers using FMOC-controlled synthesis, pharmaceutical-grade glassware, and full multi-layer analytical verification (HPLC, LC-MS/MS, NMR, endotoxin testing). Every batch is documented before it is dispensed. We do not source from gray-market or overseas mass-market suppliers.',
    },
  ];

  return (
    <Layout
      title="Peptide Sourcing | Why U.S. Manufacturing Matters | Newport Beach | Range Medical"
      description="Where your peptides are manufactured determines whether they work. A patient-friendly comparison of U.S. vs. overseas peptide quality, glass, verification, and supply chain."
    >
      <Head>
        <meta
          name="keywords"
          content="peptide sourcing, U.S. peptide manufacturing, pharmaceutical-grade peptides, FMOC synthesis, peptide quality, peptide therapy Newport Beach, Range Medical"
        />
        <link rel="canonical" href="https://www.range-medical.com/peptide-sourcing" />

        <meta property="og:title" content="Peptide Sourcing | Why U.S. Manufacturing Matters | Range Medical" />
        <meta
          property="og:description"
          content="Where your peptides come from changes whether they work. A patient-friendly comparison of U.S. vs. overseas peptide manufacturing."
        />
        <meta property="og:url" content="https://www.range-medical.com/peptide-sourcing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Peptide Sourcing | Range Medical" />
        <meta
          name="twitter:description"
          content="Where your peptides come from changes whether they work."
        />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="pep-page">
        {/* Hero */}
        <section className="pep-hero">
          <div className="pep-hero-inner">
            <div className="v2-label">
              <span className="v2-dot" /> PEPTIDE SOURCING
            </div>
            <h1>WHERE YOUR PEPTIDES COME FROM CHANGES WHETHER THEY WORK.</h1>
            <div className="pep-hero-rule" />
            <p className="pep-hero-sub">
              Two peptides can look identical in the bottle and behave completely differently in your body.
              The difference is not the molecule on the label — it is how the molecule was built, verified,
              and stored. Here is what we look for, and what we do not accept.
            </p>
            <div className="pep-hero-scroll">
              Scroll to explore
              <span>&#8595;</span>
            </div>
          </div>
        </section>

        {/* Intro + Stat Row */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="v2-label">
                <span className="v2-dot" /> The Standard
              </div>
              <h2>A PEPTIDE IS A FRAGILE SIGNAL.</h2>
              <p className="pep-body-text">
                Peptides are short chains of amino acids that tell your body to do specific things — heal a
                tendon, release growth hormone, calm inflammation. Their performance depends on getting the
                exact sequence, the exact shape, and the exact charge correct.
              </p>
              <p className="pep-body-text" style={{ marginTop: '1rem' }}>
                Tiny manufacturing errors do not always show up in the bottle. They show up when the peptide
                stops working in your body.
              </p>
            </div>

            <div className="pep-stat-row">
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">100%</div>
                <div className="pep-stat-label">U.S.-manufactured peptide
                  <br />
                  stock at Range Medical
                </div>
              </div>
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">5+</div>
                <div className="pep-stat-label">Independent verification
                  <br />
                  methods per batch
                </div>
              </div>
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">0</div>
                <div className="pep-stat-label">Detectable endotoxins
                  <br />
                  in our vial system
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Core Comparison — Visual Centerpiece */}
        <section className="pep-section">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="v2-label">
                <span className="v2-dot" /> Side By Side
              </div>
              <h2>U.S.-MADE VS. OVERSEAS MASS-MARKET.</h2>
              <p className="pep-body-text">
                The same molecule, manufactured two different ways. Six factors that decide whether the
                peptide in your vial actually does what it is supposed to.
              </p>
            </div>

            <div className="pep-compare pep-animate">
              <div className="pep-compare-head">
                <div className="pep-compare-head-cell pep-compare-head-spacer" />
                <div className="pep-compare-head-cell pep-compare-head-us">
                  <span className="pep-compare-tag pep-compare-tag-us">U.S. Pharmaceutical Grade</span>
                </div>
                <div className="pep-compare-head-cell pep-compare-head-them">
                  <span className="pep-compare-tag pep-compare-tag-them">Overseas Mass-Market</span>
                </div>
              </div>

              {comparisons.map((row, i) => (
                <div key={i} className="pep-compare-row">
                  <div className="pep-compare-factor">
                    <div className="pep-compare-factor-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="pep-compare-factor-label">{row.factor}</div>
                  </div>
                  <div className="pep-compare-cell pep-compare-cell-us">
                    <div className="pep-compare-cell-mark pep-compare-mark-good">✓</div>
                    <div className="pep-compare-cell-body">
                      <div className="pep-compare-cell-headline">{row.us.label}</div>
                      <div className="pep-compare-cell-detail">{row.us.detail}</div>
                    </div>
                  </div>
                  <div className="pep-compare-cell pep-compare-cell-them">
                    <div className="pep-compare-cell-mark pep-compare-mark-bad">×</div>
                    <div className="pep-compare-cell-body">
                      <div className="pep-compare-cell-headline">{row.overseas.label}</div>
                      <div className="pep-compare-cell-detail">{row.overseas.detail}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The 4 Pillars */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="v2-label">
                <span className="v2-dot" /> What We Look For
              </div>
              <h2>FOUR PILLARS OF A PEPTIDE THAT WORKS.</h2>
              <p className="pep-body-text">
                Range Medical does not source from gray-market suppliers. Every peptide we prescribe is
                evaluated against these four standards before it ever reaches a patient.
              </p>
            </div>

            <div className="pep-pillars-grid pep-animate">
              {pillars.map((p, i) => (
                <div key={i} className="pep-pillar-card">
                  <div className="pep-pillar-number">{p.number}</div>
                  <div className="pep-pillar-title">{p.title}</div>
                  <p className="pep-pillar-desc">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Process — Inverted Dark Section */}
        <section className="pep-section pep-section-inverted">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span className="v2-dot" /> The Process We Demand
              </div>
              <h2>WHAT SEPARATES A GREAT PEPTIDE FROM A CHEAP ONE.</h2>
              <div className="pep-hero-rule" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <p className="pep-body-text">
                Two things decide whether the molecule in your vial actually works: how it is built, and
                how it is stored. Anything else is shortcuts.
              </p>
            </div>

            <div className="pep-partners-grid pep-animate">
              <div className="pep-partner-card">
                <div className="pep-partner-eyebrow">How a Great Peptide Is Built</div>
                <div className="pep-partner-name">The Manufacturing Process</div>
                <p className="pep-partner-desc">
                  A great peptide is built one amino acid at a time, with FMOC-controlled solid-phase
                  synthesis where every coupling is independently verified before the next is added. Every
                  batch is checked with HPLC, LC-MS/MS, NMR spectroscopy, and endotoxin testing before it
                  is ever released.
                </p>
                <ul className="pep-partner-list">
                  <li>FMOC step-verified synthesis</li>
                  <li>Multi-layer analytical verification</li>
                  <li>Stability studies under thermal and solution stress</li>
                  <li>Documented batch records</li>
                </ul>
              </div>

              <div className="pep-partner-card">
                <div className="pep-partner-eyebrow">How a Great Peptide Is Stored</div>
                <div className="pep-partner-name">The Container System</div>
                <p className="pep-partner-desc">
                  A great peptide is sealed in pharmaceutical-grade glass — the same standard used for
                  hospital injectables. Engineered to release no detectable endotoxins, no heavy metals,
                  and extremely low extractables, so the molecule stays intact from fill to fridge to
                  injection.
                </p>
                <ul className="pep-partner-list">
                  <li>No detectable endotoxins</li>
                  <li>No heavy metal contamination</li>
                  <li>Extremely low extractables and leachables</li>
                  <li>Same standard used for hospital injectables</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* The Cost of a Cheap Peptide — Callout */}
        <section className="pep-section">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="v2-label">
                <span className="v2-dot" /> Why We Won't Cut Corners
              </div>
              <h2>WHAT A CHEAP PEPTIDE ACTUALLY COSTS YOU.</h2>
              <p className="pep-body-text">
                A cheaper peptide can meet a basic spec on paper and still be functionally useless by the
                time you reconstitute it. The real cost shows up in three ways.
              </p>
            </div>

            <div className="pep-cost-grid pep-animate">
              <div className="pep-cost-card">
                <div className="pep-cost-num">01</div>
                <div className="pep-cost-title">Lost Time</div>
                <p>
                  Weeks or months on a protocol that was never going to work. By the time you realize, the
                  injury or symptom you were treating has compounded.
                </p>
              </div>
              <div className="pep-cost-card">
                <div className="pep-cost-num">02</div>
                <div className="pep-cost-title">Unreliable Outcomes</div>
                <p>
                  When a peptide fails, you cannot tell whether the protocol was wrong, the diagnosis was
                  wrong, or the molecule was wrong. You lose the ability to course-correct.
                </p>
              </div>
              <div className="pep-cost-card">
                <div className="pep-cost-num">03</div>
                <div className="pep-cost-title">Real Safety Risk</div>
                <p>
                  Endotoxins, heavy metals, and degradation products do not just stop the peptide from
                  working — they can introduce contaminants you never agreed to inject.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="v2-label">
              <span className="v2-dot" /> Questions
            </div>
            <h2>COMMON QUESTIONS</h2>

            <div className="pep-faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`pep-faq-item ${openFaq === index ? 'pep-faq-open' : ''}`}
                >
                  <button
                    className="pep-faq-question"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="pep-faq-toggle">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className="pep-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <div className="container">
            <div className="pep-animate">
              <div
                className="v2-label"
                style={{ color: 'rgba(255,255,255,0.4)', justifyContent: 'center' }}
              >
                <span className="v2-dot" /> Next Steps
              </div>
              <h2>KNOW EXACTLY WHAT YOU ARE INJECTING.</h2>
              <div className="cta-rule" />
              <p>
                If you are going to commit to a peptide protocol, the molecule itself has to be correct.
                Start with a Range Assessment — we will review your goals, design your protocol, and source
                every peptide from documented U.S. manufacturers. $197, credited toward treatment.
              </p>
              <div className="pep-cta-buttons">
                <Link href="/assessment" className="btn-white">
                  Book Your Range Assessment
                </Link>
                <div className="pep-cta-or">or</div>
                <a href="tel:9499973988" className="pep-cta-phone">
                  (949) 997-3988
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== PEPTIDE SOURCING — V2 EDITORIAL ===== */
        .pep-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        .pep-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        :global(.pep-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        .pep-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .pep-section {
          padding: 6rem 2rem;
        }
        .pep-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }
        .pep-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
          padding: 6rem 2rem;
        }

        .pep-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          text-transform: uppercase;
        }
        .pep-page h2 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .pep-page h3 {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
        }
        .pep-section-inverted h1,
        .pep-section-inverted h2,
        .pep-section-inverted h3 {
          color: #ffffff;
        }

        .pep-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.75;
          color: #737373;
          max-width: 620px;
        }
        .pep-section-inverted .pep-body-text {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Hero */
        .pep-hero {
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .pep-hero-inner {
          max-width: 820px;
        }
        .pep-hero h1 {
          margin: 0 0 2rem;
        }
        .pep-hero-rule {
          width: 100%;
          max-width: 600px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 2rem;
        }
        .pep-hero-sub {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 620px;
          margin: 0 0 2.5rem;
        }
        .pep-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }
        .pep-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: pep-bounce 2s ease-in-out infinite;
        }
        @keyframes pep-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .pep-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 3rem;
          border-top: 1px solid #e0e0e0;
        }
        .pep-stat-item {
          text-align: center;
          padding: 2rem 1rem;
          border-right: 1px solid #e0e0e0;
        }
        .pep-stat-item:last-child { border-right: none; }
        .pep-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }
        .pep-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Comparison Table — the visual centerpiece */
        .pep-compare {
          margin-top: 3rem;
          border: 1px solid #e0e0e0;
          background: #ffffff;
        }
        .pep-compare-head {
          display: grid;
          grid-template-columns: 220px 1fr 1fr;
          background: #fafafa;
          border-bottom: 1px solid #e0e0e0;
        }
        .pep-compare-head-cell {
          padding: 1.25rem 1.5rem;
          border-right: 1px solid #e0e0e0;
        }
        .pep-compare-head-cell:last-child { border-right: none; }
        .pep-compare-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 0.875rem;
        }
        .pep-compare-tag-us {
          background: #1a1a1a;
          color: #ffffff;
        }
        .pep-compare-tag-them {
          background: #ffffff;
          color: #737373;
          border: 1px solid #e0e0e0;
        }

        .pep-compare-row {
          display: grid;
          grid-template-columns: 220px 1fr 1fr;
          border-bottom: 1px solid #e0e0e0;
        }
        .pep-compare-row:last-child { border-bottom: none; }

        .pep-compare-factor {
          padding: 1.5rem;
          background: #fafafa;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .pep-compare-factor-num {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #a0a0a0;
          margin-bottom: 0.5rem;
        }
        .pep-compare-factor-label {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.25;
        }

        .pep-compare-cell {
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          border-right: 1px solid #e0e0e0;
        }
        .pep-compare-cell:last-child { border-right: none; }

        .pep-compare-cell-mark {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          margin-top: 0.125rem;
        }
        .pep-compare-mark-good {
          background: rgba(46, 107, 53, 0.12);
          color: #2E6B35;
        }
        .pep-compare-mark-bad {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .pep-compare-cell-body { flex: 1; }
        .pep-compare-cell-headline {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.4rem;
          line-height: 1.4;
        }
        .pep-compare-cell-them .pep-compare-cell-headline {
          color: #525252;
        }
        .pep-compare-cell-detail {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }

        /* 4 Pillars */
        .pep-pillars-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
        }
        .pep-pillar-card {
          padding: 2.25rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
        }
        .pep-pillar-number {
          font-size: 2rem;
          font-weight: 900;
          color: #c4c4c4;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          line-height: 1;
        }
        .pep-pillar-title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin-bottom: 0.75rem;
        }
        .pep-pillar-desc {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #737373;
          margin: 0;
        }

        /* Quality Partner Cards */
        .pep-partners-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .pep-partner-card {
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pep-partner-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 1rem;
        }
        .pep-partner-name {
          font-size: 1.75rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
          line-height: 1;
        }
        .pep-partner-desc {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 1.5rem;
        }
        .pep-partner-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pep-partner-list li {
          padding: 0.75rem 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.78);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-left: 1.5rem;
          position: relative;
        }
        .pep-partner-list li:last-child {
          border-bottom: none;
        }
        .pep-partner-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #4ade80;
          font-weight: 700;
        }

        /* Cost of a Cheap Peptide */
        .pep-cost-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
        }
        .pep-cost-card {
          padding: 2.25rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
        }
        .pep-cost-num {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #a0a0a0;
          margin-bottom: 1rem;
        }
        .pep-cost-title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin-bottom: 0.75rem;
        }
        .pep-cost-card p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #737373;
          margin: 0;
        }

        /* FAQ */
        .pep-faq-list {
          max-width: 800px;
          border-top: 1px solid #e0e0e0;
        }
        .pep-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }
        .pep-faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          gap: 1rem;
        }
        .pep-faq-question span:first-child {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .pep-faq-toggle {
          font-size: 1.25rem;
          color: #a0a0a0;
          flex-shrink: 0;
        }
        .pep-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        .pep-faq-open .pep-faq-answer {
          max-height: 600px;
          padding-bottom: 1.5rem;
        }
        .pep-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          margin: 0;
        }

        /* Final CTA */
        :global(.final-cta) h2 { color: #ffffff; }
        :global(.final-cta) p { color: rgba(255, 255, 255, 0.5); }

        .pep-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        .pep-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }
        .pep-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }
        .pep-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .pep-pillars-grid {
            grid-template-columns: 1fr;
          }
          .pep-partners-grid {
            grid-template-columns: 1fr;
          }
          .pep-cost-grid {
            grid-template-columns: 1fr;
          }

          /* Comparison table → stacked card layout */
          .pep-compare-head { display: none; }
          .pep-compare-row {
            grid-template-columns: 1fr;
            border-bottom: 8px solid #fafafa;
          }
          .pep-compare-factor {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.25rem 1.5rem;
          }
          .pep-compare-cell {
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
            padding: 1.25rem 1.5rem;
          }
          .pep-compare-cell:last-child { border-bottom: none; }
          .pep-compare-cell-us::before {
            content: 'U.S. Pharmaceutical Grade';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #2E6B35;
            background: rgba(46, 107, 53, 0.08);
            padding: 0.25rem 0.625rem;
          }
          .pep-compare-cell-them::before {
            content: 'Overseas Mass-Market';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
            padding: 0.25rem 0.625rem;
          }
          .pep-compare-cell {
            position: relative;
            padding-top: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .pep-section,
          .pep-section-alt,
          .pep-section-inverted {
            padding: 4rem 1.5rem;
          }
          .pep-hero {
            padding: 4rem 1.5rem 5rem;
          }
          .pep-stat-row {
            grid-template-columns: 1fr;
          }
          .pep-stat-item {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }
          .pep-stat-item:last-child { border-bottom: none; }
          .pep-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
