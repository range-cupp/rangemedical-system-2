import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import CheckoutModal from '../components/CheckoutModal';

export default function CellularEnergyReset() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const openCheckout = () => setCheckoutOpen(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );

    const sections = document.querySelectorAll('.cer-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I know if this is right for me?",
      answer: "Take our 2-minute assessment quiz. It asks about your symptoms, energy levels, and health history to determine if the Cellular Energy Reset is the right fit. If it is, we'll schedule a consultation to build your plan. If something else is going on, we'll point you in the right direction."
    },
    {
      question: "How long does each session take?",
      answer: "Plan for about 90 minutes door-to-door when doing HBOT and Red Light together. Red Light Therapy is 20 minutes, HBOT is 60 minutes. Most patients do both in the same visit to maximize efficiency."
    },
    {
      question: "When will I start feeling results?",
      answer: "Most patients notice improvements by Week 3 — less afternoon fatigue, better sleep quality, and improved mental clarity. The full benefits compound through Week 6 and continue with proper maintenance."
    },
    {
      question: "What happens after the 6 weeks?",
      answer: "At your Week 7 results review, we'll measure your progress and discuss maintenance options to preserve your gains. Most patients continue with monthly maintenance sessions to sustain their improved energy levels."
    },
    {
      question: "Is this covered by insurance?",
      answer: "HBOT and Red Light Therapy for optimization are typically not covered by insurance. We can provide superbills for HSA/FSA reimbursement, and financing is available through Affirm and Afterpay."
    },
    {
      question: "Can I just do HBOT or Red Light without the other?",
      answer: "While each therapy has standalone benefits, they work synergistically in this program. HBOT delivers oxygen to cells while Red Light stimulates the mitochondria to use that oxygen efficiently. Together, they produce better results than either alone."
    }
  ];

  const researchStudies = [
    {
      title: "HBOT Enhances Mitochondrial Function",
      journal: "Aging and Disease, 2021",
      finding: "Hyperbaric oxygen therapy significantly improved mitochondrial function and reduced markers of cellular senescence in healthy adults."
    },
    {
      title: "Red Light Therapy and ATP Production",
      journal: "Photomedicine and Laser Surgery, 2019",
      finding: "Near-infrared light at 660-850nm wavelengths increased cellular ATP production by up to 40% through cytochrome c oxidase activation."
    },
    {
      title: "Combined Oxygen and Light Therapy",
      journal: "Journal of Photochemistry and Photobiology, 2020",
      finding: "The combination of increased oxygen availability and photobiomodulation produced synergistic improvements in cellular respiration and energy output."
    },
    {
      title: "HBOT and Cognitive Function",
      journal: "Frontiers in Aging Neuroscience, 2020",
      finding: "Repeated hyperbaric oxygen sessions improved cerebral blood flow and cognitive performance in adults experiencing age-related decline."
    },
    {
      title: "Photobiomodulation for Fatigue",
      journal: "Lasers in Medical Science, 2018",
      finding: "Red light therapy reduced fatigue scores and improved exercise recovery in subjects experiencing chronic low energy states."
    },
    {
      title: "Mitochondrial Restoration Protocol",
      journal: "Mitochondrion, 2022",
      finding: "A 6-week protocol combining oxygen therapy and light stimulation restored mitochondrial membrane potential and improved subjective energy levels."
    }
  ];

  return (
    <>
      <Head>
        <title>Your Guide to Cellular Energy Reset | Range Medical | Newport Beach</title>
        <meta name="description" content="A structured 6-week program combining HBOT and Red Light Therapy to restore energy at the cellular level. For chronic fatigue, brain fog, and slow recovery." />
        <meta name="keywords" content="cellular energy reset, mitochondrial therapy, low energy treatment, brain fog help, HBOT Newport Beach, red light therapy program, chronic fatigue treatment" />
        <link rel="canonical" href="https://www.range-medical.com/cellular-energy-reset" />

        <meta property="og:title" content="Your Guide to Cellular Energy Reset | Range Medical" />
        <meta property="og:description" content="A structured 6-week program combining HBOT and Red Light Therapy to restore energy at the cellular level." />
        <meta property="og:url" content="https://www.range-medical.com/cellular-energy-reset" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-cellular-energy-reset.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to Cellular Energy Reset | Range Medical" />
        <meta name="twitter:description" content="A structured 6-week program combining HBOT and Red Light Therapy to restore energy at the cellular level." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-cellular-energy-reset.jpg" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "description": "Medical wellness clinic specializing in cellular energy optimization and regenerative therapies.",
              "url": "https://www.range-medical.com",
              "telephone": "+1-949-997-3988",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr, Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 33.6189,
                "longitude": -117.9298
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "07:00",
                  "closes": "18:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Saturday"],
                  "opens": "09:00",
                  "closes": "14:00"
                }
              ],
              "priceRange": "$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "10"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalTherapy",
              "name": "Cellular Energy Reset Program",
              "description": "A 6-week program combining Hyperbaric Oxygen Therapy and Red Light Therapy to restore mitochondrial function and cellular energy production.",
              "medicineSystem": "Western conventional medicine",
              "relevantSpecialty": "Regenerative medicine",
              "study": researchStudies.map(study => ({
                "@type": "MedicalStudy",
                "name": study.title,
                "description": study.finding
              }))
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      </Head>

      <Layout>
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

        {/* Hero Section */}
        <section className="cer-hero">
          <div className="cer-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> Energy &middot; Recovery &middot; Cellular</div>
            <h1>Your Guide to Cellular Energy Reset</h1>
            <div className="cer-hero-rule" />
            <p className="cer-hero-sub">
              A structured 6-week protocol combining HBOT and Red Light Therapy to restore energy
              at the cellular level — for those who want a clear plan to fix fatigue, brain fog,
              and slow recovery at the source.
            </p>
            <div className="cer-hero-scroll">
              Scroll to explore
              <span>&darr;</span>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="cer-what" className={`cer-section cer-section-alt cer-animate ${isVisible['cer-what'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> The Benefits</div>
            <h2>What Red Light + HBOT Does for Your Body</h2>

            <div className="cer-cards-grid">
              <div className="cer-card">
                <span className="cer-card-num">01</span>
                <h4>Restore Your Natural Energy</h4>
                <p>HBOT floods cells with oxygen, Red Light activates the enzyme that drives ATP production. Real, sustained vitality — not caffeine.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">02</span>
                <h4>Clear the Brain Fog</h4>
                <p>Your brain uses 20% of your body's energy. Restored cellular function means sharper thinking, better memory, and mental clarity that lasts.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">03</span>
                <h4>Sleep That Actually Restores You</h4>
                <p>Improved mitochondrial function means your body repairs properly during sleep. Wake up feeling like sleep actually did something.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">04</span>
                <h4>Faster Physical Recovery</h4>
                <p>Exercise, injury, daily wear and tear — when cells produce energy efficiently, your body repairs properly instead of falling behind.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">05</span>
                <h4>Reduced Inflammation</h4>
                <p>Chronic low-grade inflammation drives fatigue, pain, and aging. HBOT and Red Light address it at the cellular level where it starts.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">06</span>
                <h4>Slow Down Aging at Its Root</h4>
                <p>Mitochondrial dysfunction is a hallmark of aging. This protocol addresses it at the deepest biological level — where aging actually begins.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Is This You Section */}
        <section id="cer-who" className={`cer-section cer-animate ${isVisible['cer-who'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Is This You?</div>
            <h2>Signs Your Cells Need a Reset</h2>

            <div className="cer-cards-grid">
              <div className="cer-card">
                <span className="cer-card-num">01</span>
                <h4>You're Tired All the Time</h4>
                <p>Not lazy, not "just stressed." Persistent fatigue that sleep doesn't fix is a sign of mitochondrial dysfunction.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">02</span>
                <h4>Brain Fog is Your New Normal</h4>
                <p>Forgetting words, losing focus, walking into rooms and forgetting why. Your brain runs on ATP — and it's running low.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">03</span>
                <h4>Your Doctor Says You're "Fine"</h4>
                <p>Labs look normal but you know something's off. Standard tests don't measure cellular energy production.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">04</span>
                <h4>The 2pm Crash Hits Every Day</h4>
                <p>Afternoon energy tank. Energy drinks and coffee create a cycle that makes the underlying problem worse.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">05</span>
                <h4>Sleep Doesn't Recharge You</h4>
                <p>8 hours but still waking up tired. Your cells don't have the energy to repair overnight — so sleep feels pointless.</p>
              </div>

              <div className="cer-card">
                <span className="cer-card-num">06</span>
                <h4>Everything Aches</h4>
                <p>Joint stiffness, general soreness, feeling older than you are. Chronic inflammation at the cellular level is the root cause.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section id="cer-included" className={`cer-section cer-section-alt cer-animate ${isVisible['cer-included'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Program Details</div>
            <h2>What's Included</h2>

            <div className="cer-included-grid">
              <div className="cer-included-card">
                <div className="cer-included-number">18</div>
                <h4>HBOT Sessions</h4>
                <p>60 minutes each at 2.0 ATA. Increased oxygen delivery to support cellular repair and energy production.</p>
              </div>

              <div className="cer-included-card">
                <div className="cer-included-number">18</div>
                <h4>Red Light Sessions</h4>
                <p>Full-body treatment at 660-850nm wavelengths. Stimulates mitochondria to produce ATP more efficiently.</p>
              </div>

              <div className="cer-included-card">
                <div className="cer-included-number">2</div>
                <h4>Provider Consultations</h4>
                <p>Initial consultation to build your plan, plus Week 7 results review to measure your progress.</p>
              </div>

              <div className="cer-included-card">
                <div className="cer-included-number">6</div>
                <h4>Weekly Check-Ins</h4>
                <p>Track energy, sleep, and mental clarity throughout so we can adjust your protocol as needed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section id="cer-timeline" className={`cer-section cer-animate ${isVisible['cer-timeline'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Your Journey</div>
            <h2>The 6-Week Timeline</h2>

            <div className="cer-steps">
              <div className="cer-step">
                <span className="cer-step-num">01</span>
                <div className="cer-step-content">
                  <span className="cer-step-label">Weeks 1-2</span>
                  <h4>Foundation Phase</h4>
                  <p>3 HBOT + 3 Red Light sessions per week. Your cells begin adapting to increased oxygen and light stimulation. Some patients feel initial improvement.</p>
                </div>
              </div>

              <div className="cer-step">
                <span className="cer-step-num">02</span>
                <div className="cer-step-content">
                  <span className="cer-step-label">Weeks 3-4</span>
                  <h4>Optimization Phase</h4>
                  <p>Continuing 3x weekly sessions. This is when most patients report noticeable improvements — more sustained energy, clearer thinking, better sleep.</p>
                </div>
              </div>

              <div className="cer-step">
                <span className="cer-step-num">03</span>
                <div className="cer-step-content">
                  <span className="cer-step-label">Weeks 5-6</span>
                  <h4>Integration Phase</h4>
                  <p>Final sessions lock in your gains. Mitochondrial adaptations become more durable. Energy improvements feel like your new baseline.</p>
                </div>
              </div>

              <div className="cer-step">
                <span className="cer-step-num">04</span>
                <div className="cer-step-content">
                  <span className="cer-step-label">Week 7</span>
                  <h4>Results Review</h4>
                  <p>Final consultation to measure progress. We'll review your energy scores, discuss what changed, and create a maintenance plan to preserve your results.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Section */}
        <section id="cer-pricing" className={`cer-section cer-section-alt cer-animate ${isVisible['cer-pricing'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Investment</div>
            <h2>Program Pricing</h2>

            <div className="cer-pricing-grid">
              <div className="cer-pricing-card cer-pricing-main">
                <div className="cer-pricing-header">
                  <h3>6-Week Cellular Energy Reset</h3>
                  <div className="cer-price-block">
                    <span className="cer-price-retail">$4,860 value</span>
                    <div className="cer-price">$2,999</div>
                    <span className="cer-price-save">Save $1,861</span>
                  </div>
                </div>
                <div className="cer-savings-breakdown">
                  <div className="cer-savings-row">
                    <span>18 Hyperbaric Oxygen sessions <em>($185 each)</em></span>
                    <span>$3,330</span>
                  </div>
                  <div className="cer-savings-row">
                    <span>18 Red Light Therapy sessions <em>($85 each)</em></span>
                    <span>$1,530</span>
                  </div>
                  <div className="cer-savings-row cer-savings-subtotal">
                    <span>Total if purchased individually</span>
                    <span>$4,860</span>
                  </div>
                  <div className="cer-savings-row cer-savings-total">
                    <span>Program price</span>
                    <span>$2,999</span>
                  </div>
                  <div className="cer-savings-row cer-savings-you-save">
                    <span>You save</span>
                    <span>$1,861</span>
                  </div>
                </div>
                <ul className="cer-pricing-features">
                  <li>Structured 6-week schedule — 3 sessions per week</li>
                  <li>Weekly automated check-ins to track progress</li>
                  <li>Initial consult + Week 7 results review included</li>
                </ul>
                <button onClick={openCheckout} className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%', cursor: 'pointer' }}>Get Started — $2,999</button>
                <p className="cer-pricing-note">Financing available through Affirm and Afterpay</p>
              </div>

              <div className="cer-pricing-card cer-pricing-value">
                <h4>Best For</h4>
                <ul className="cer-bestfor-list">
                  <li>Fastest, most aggressive change in energy</li>
                  <li>Accelerated recovery from workouts or injuries</li>
                  <li>Peak performance over a focused 6-week window</li>
                  <li>Chronic fatigue or brain fog that won't go away</li>
                  <li>You want a structured protocol, not guesswork</li>
                </ul>
                <div className="cer-pricing-value-divider"></div>
                <div className="cer-guarantee">
                  <div className="cer-guarantee-icon">&#10003;</div>
                  <div>
                    <h4 className="cer-guarantee-title">Money-Back Guarantee</h4>
                    <p>Complete the full 6-week protocol as prescribed. If you don't experience measurable improvement, we'll refund your investment.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cer-maintenance-preview">
              <h3>After the Reset: Maintenance Options</h3>
              <p>At your Week 7 review, we'll discuss maintenance options to preserve your gains:</p>
              <div className="cer-maintenance-options">
                <div className="cer-maintenance-option">
                  <h4>Base Maintenance</h4>
                  <p>4 HBOT + 4 Red Light sessions every 4 weeks</p>
                  <span className="cer-maintenance-price">$599/cycle</span>
                </div>
                <div className="cer-maintenance-option">
                  <h4>Maintenance + IV</h4>
                  <p>Everything in Base, plus 1 Energy IV per cycle</p>
                  <span className="cer-maintenance-price">$799/cycle</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section id="cer-research" className={`cer-section cer-animate ${isVisible['cer-research'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> The Evidence</div>
            <h2>Research Behind the Protocol</h2>
            <p className="cer-section-body">
              This program is built on peer-reviewed research demonstrating the effectiveness of
              hyperbaric oxygen and photobiomodulation for mitochondrial restoration.
            </p>

            <div className="cer-research-grid">
              {researchStudies.map((study, index) => (
                <div key={index} className="cer-research-card">
                  <h4>{study.title}</h4>
                  <span className="cer-research-journal">{study.journal}</span>
                  <p>{study.finding}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="cer-testimonials" className={`cer-section cer-section-alt cer-animate ${isVisible['cer-testimonials'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Results</div>
            <h2>What Patients Are Saying</h2>

            <div className="cer-testimonials">
              <div className="cer-testimonial">
                <div className="cer-testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <blockquote>&ldquo;I thought being tired was just my life now. By week 3, I had energy I hadn't felt in years.&rdquo;</blockquote>
                <cite>Sarah M., 45, Newport Beach</cite>
              </div>

              <div className="cer-testimonial">
                <div className="cer-testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <blockquote>&ldquo;The brain fog clearing was worth it alone. I can actually think through a full day without crashing.&rdquo;</blockquote>
                <cite>David R., 52, Newport Beach</cite>
              </div>

              <div className="cer-testimonial">
                <div className="cer-testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <blockquote>&ldquo;My doctor couldn't find anything wrong. This program found what labs missed — my cells were the problem.&rdquo;</blockquote>
                <cite>Jennifer L., 41, Newport Beach</cite>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="cer-faq" className={`cer-section cer-animate ${isVisible['cer-faq'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Common Questions</h2>

            <div className="cer-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="cer-faq-item">
                  <button className="cer-faq-q" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="cer-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="cer-faq-a">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="final-cta">
          <div className="container">
            <h2>Stop Guessing.<br />Start Fixing.</h2>
            <div className="cta-rule" />
            <p>Book the 6-Week Cellular Energy Reset and we'll build your schedule.</p>
            <button onClick={openCheckout} className="btn-white" style={{ cursor: 'pointer' }}>Get Started — $2,999</button>
            <p className="cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach &bull; <a href="tel:9499973988">(949) 997-3988</a>
            </p>
          </div>
        </section>

        <style jsx>{`
          /* ── HERO ── */
          .cer-hero {
            padding: 6rem 2rem 7rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .cer-hero-inner {
            max-width: 800px;
          }

          .cer-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.03em;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 2rem;
          }

          .cer-hero-rule {
            width: 100%;
            max-width: 600px;
            height: 1px;
            background: #e0e0e0;
            margin-bottom: 2rem;
          }

          .cer-hero-sub {
            font-size: 1.0625rem;
            line-height: 1.75;
            color: #737373;
            max-width: 520px;
            margin: 0 0 2.5rem;
          }

          .cer-hero-scroll {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .cer-hero-scroll span {
            display: block;
            margin-top: 0.75rem;
            font-size: 1.125rem;
            animation: cer-bounce 2s ease-in-out infinite;
          }

          @keyframes cer-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }

          /* ── SECTIONS ── */
          .cer-section {
            padding: 6rem 2rem;
          }

          .cer-section-alt {
            background: #fafafa;
          }

          .cer-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .cer-section h2 {
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.02em;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 1.5rem;
          }

          .cer-section-body {
            font-size: 1.0625rem;
            line-height: 1.75;
            color: #737373;
            max-width: 480px;
            margin: 0 0 3rem;
          }

          /* Animation */
          .cer-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .cer-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* ── CARDS GRID ── */
          .cer-cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
          }

          .cer-card {
            padding: 2rem;
            border-bottom: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }

          .cer-card:nth-child(2n) {
            border-right: none;
          }

          .cer-card-num {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #808080;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
          }

          .cer-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 0.5rem;
          }

          .cer-card p {
            font-size: 0.9375rem;
            color: #737373;
            margin: 0;
            line-height: 1.6;
          }

          /* ── INCLUDED GRID ── */
          .cer-included-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
          }

          .cer-included-card {
            padding: 2rem;
            border-bottom: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }

          .cer-included-card:nth-child(2n) {
            border-right: none;
          }

          .cer-included-number {
            font-size: 2.5rem;
            font-weight: 900;
            color: #808080;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .cer-included-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 0.5rem;
          }

          .cer-included-card p {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* ── TIMELINE / STEPS ── */
          .cer-steps {
            border-top: 1px solid #e0e0e0;
            max-width: 800px;
          }

          .cer-step {
            display: flex;
            gap: 2rem;
            padding: 1.75rem 0;
            border-bottom: 1px solid #e0e0e0;
            align-items: flex-start;
          }

          .cer-step-num {
            font-size: 12px;
            font-weight: 600;
            color: #808080;
            letter-spacing: 0.05em;
            min-width: 2rem;
            padding-top: 0.25rem;
          }

          .cer-step-label {
            font-size: 11px;
            font-weight: 700;
            color: #737373;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            display: block;
            margin-bottom: 0.25rem;
          }

          .cer-step-content h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 0.5rem;
          }

          .cer-step-content p {
            font-size: 0.9375rem;
            color: #737373;
            margin: 0;
            line-height: 1.6;
          }

          /* ── PRICING ── */
          .cer-pricing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            max-width: 1000px;
            margin: 0 0 3rem;
            align-items: stretch;
          }

          .cer-pricing-card {
            border: 1px solid #e0e0e0;
            padding: 2.25rem;
            display: flex;
            flex-direction: column;
          }

          .cer-pricing-main {
            border-color: #1a1a1a;
            border-width: 2px;
          }

          .cer-pricing-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
            padding-bottom: 1.25rem;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid #e0e0e0;
          }

          .cer-pricing-card h3 {
            font-size: 1.125rem;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.2;
            padding-top: 0.25rem;
          }

          .cer-price-block {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.25rem;
          }

          .cer-price-retail {
            font-size: 0.75rem;
            font-weight: 600;
            color: #a0a0a0;
            text-decoration: line-through;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .cer-price {
            font-size: 2.25rem;
            font-weight: 900;
            color: #1a1a1a;
            line-height: 1;
            white-space: nowrap;
          }

          .cer-price-save {
            display: inline-block;
            background: #2E6B35;
            color: #ffffff;
            font-size: 0.6875rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.3125rem 0.5625rem;
            border-radius: 2px;
          }

          .cer-savings-breakdown {
            margin: 0 0 1.5rem;
            padding: 1rem 1.125rem;
            background: #fafafa;
            border: 1px solid #e8e8e8;
          }

          .cer-savings-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 1rem;
            font-size: 0.8125rem;
            color: #737373;
            padding: 0.3125rem 0;
          }

          .cer-savings-row em {
            font-style: normal;
            color: #a0a0a0;
            font-size: 0.75rem;
          }

          .cer-savings-row span:last-child {
            font-weight: 700;
            color: #404040;
            white-space: nowrap;
          }

          .cer-savings-subtotal {
            border-top: 1px solid #e0e0e0;
            padding-top: 0.625rem;
            margin-top: 0.25rem;
            color: #737373;
          }

          .cer-savings-subtotal span:first-child {
            font-weight: 600;
            color: #404040;
          }

          .cer-savings-subtotal span:last-child {
            text-decoration: line-through;
            color: #a0a0a0;
            font-weight: 500;
          }

          .cer-savings-total {
            font-size: 0.875rem;
          }

          .cer-savings-total span {
            font-weight: 800 !important;
            color: #1a1a1a !important;
          }

          .cer-savings-you-save {
            background: #F0F7F1;
            margin: 0.5rem -1.125rem -1rem;
            padding: 0.75rem 1.125rem;
            font-size: 0.9375rem;
          }

          .cer-savings-you-save span {
            color: #2E6B35 !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .cer-savings-you-save span:last-child {
            font-size: 1.125rem;
          }

          .cer-pricing-features {
            list-style: none;
            padding: 0;
            margin: 0 0 1.5rem;
            flex: 1;
          }

          .cer-pricing-features li {
            font-size: 0.9375rem;
            color: #737373;
            padding: 0.625rem 0 0.625rem 1.75rem;
            position: relative;
            border-bottom: 1px solid #e0e0e0;
          }

          .cer-pricing-features li:last-child {
            border-bottom: none;
          }

          .cer-pricing-features li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #808080;
            font-weight: 700;
          }

          .cer-pricing-note {
            font-size: 0.875rem;
            color: #737373;
            margin: 1rem 0 0;
          }

          .cer-guarantee {
            display: flex;
            gap: 0.875rem;
            align-items: flex-start;
          }

          .cer-guarantee-icon {
            width: 28px;
            height: 28px;
            min-width: 28px;
            background: #1a1a1a;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8125rem;
          }

          .cer-guarantee-title {
            font-size: 0.9375rem !important;
            font-weight: 800 !important;
            color: #1a1a1a !important;
            text-transform: uppercase !important;
            letter-spacing: 0 !important;
            margin: 0 0 0.375rem !important;
          }

          .cer-guarantee p {
            font-size: 0.8125rem;
            color: #737373;
            line-height: 1.55;
            margin: 0;
          }

          .cer-pricing-value {
            border: 1px solid #e0e0e0;
            background: #fafafa;
          }

          .cer-pricing-value-divider {
            height: 1px;
            background: #e0e0e0;
            margin: 1.5rem 0;
          }

          .cer-pricing-value h4 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #737373;
            margin: 0 0 1rem;
          }

          .cer-bestfor-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .cer-bestfor-list li {
            font-size: 0.9375rem;
            color: #737373;
            padding: 0.5rem 0 0.5rem 1.5rem;
            position: relative;
            line-height: 1.5;
            border-bottom: 1px solid #e0e0e0;
          }

          .cer-bestfor-list li:last-child {
            border-bottom: none;
          }

          .cer-bestfor-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #808080;
          }

          /* ── MAINTENANCE ── */
          .cer-maintenance-preview {
            border: 1px solid #e0e0e0;
            padding: 2rem;
            max-width: 800px;
          }

          .cer-maintenance-preview h3 {
            font-size: 1.125rem;
            font-weight: 800;
            color: #1a1a1a;
            text-transform: uppercase;
            margin: 0 0 0.5rem;
          }

          .cer-maintenance-preview > p {
            font-size: 0.9375rem;
            color: #737373;
            margin: 0 0 1.5rem;
          }

          .cer-maintenance-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .cer-maintenance-option {
            border: 1px solid #e0e0e0;
            padding: 1.25rem;
          }

          .cer-maintenance-option h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.375rem;
          }

          .cer-maintenance-option p {
            font-size: 0.875rem;
            color: #737373;
            margin: 0 0 0.75rem;
            line-height: 1.5;
          }

          .cer-maintenance-price {
            font-size: 1rem;
            font-weight: 900;
            color: #808080;
          }

          /* ── RESEARCH ── */
          .cer-research-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
          }

          .cer-research-card {
            padding: 1.75rem 2rem;
            border-bottom: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }

          .cer-research-card:nth-child(2n) {
            border-right: none;
          }

          .cer-research-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.375rem;
          }

          .cer-research-journal {
            font-size: 0.8125rem;
            color: #808080;
            font-weight: 600;
            display: block;
            margin-bottom: 0.75rem;
          }

          .cer-research-card p {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* ── TESTIMONIALS ── */
          .cer-testimonials {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            margin-top: 2.5rem;
          }

          .cer-testimonial {
            padding: 2.5rem 2rem;
            border-bottom: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
          }

          .cer-testimonial:last-child {
            border-right: none;
          }

          .cer-testimonial-stars {
            font-size: 12px;
            color: #1a1a1a;
            letter-spacing: 0.15em;
            margin-bottom: 1.25rem;
          }

          .cer-testimonial blockquote {
            font-size: 0.9375rem;
            line-height: 1.75;
            color: #404040;
            margin: 0 0 1.5rem;
            font-style: normal;
          }

          .cer-testimonial cite {
            font-size: 13px;
            font-weight: 700;
            color: #1a1a1a;
            font-style: normal;
            letter-spacing: 0.02em;
          }

          /* ── FAQ ── */
          .cer-faq-list {
            border-top: 1px solid #e0e0e0;
            max-width: 800px;
          }

          .cer-faq-item {
            border-bottom: 1px solid #e0e0e0;
          }

          .cer-faq-q {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 1.5rem 0;
            background: none;
            border: none;
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            cursor: pointer;
            font-family: inherit;
            text-align: left;
            gap: 1rem;
          }

          .cer-faq-toggle {
            font-size: 1.25rem;
            color: #a0a0a0;
            flex-shrink: 0;
          }

          .cer-faq-a {
            padding: 0 0 1.5rem;
          }

          .cer-faq-a p {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.75;
            margin: 0;
          }

          /* CTA Location */
          .cta-location :global(a) {
            color: #ffffff;
            text-decoration: underline;
            text-underline-offset: 2px;
          }

          /* ── RESPONSIVE ── */
          @media (max-width: 900px) {
            .cer-cards-grid {
              grid-template-columns: 1fr;
            }

            .cer-card {
              border-right: none;
            }

            .cer-included-grid {
              grid-template-columns: 1fr;
            }

            .cer-included-card {
              border-right: none;
            }

            .cer-testimonials {
              grid-template-columns: 1fr;
            }

            .cer-testimonial {
              border-right: none;
            }

            .cer-research-grid {
              grid-template-columns: 1fr;
            }

            .cer-research-card {
              border-right: none;
            }

            .cer-pricing-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .cer-hero {
              padding: 4rem 1.5rem 5rem;
            }

            .cer-section {
              padding: 4rem 1.5rem;
            }

            .cer-step {
              flex-direction: column;
              gap: 0.75rem;
            }

            .cer-maintenance-options {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        productName="6-Week Cellular Energy Reset"
        amountCents={299900}
        amountLabel="$2,999"
        description="Six-Week Cellular Energy Reset"
        serviceCategory="hbot"
        serviceName="Six-Week Cellular Energy Reset"
      />
    </>
  );
}
