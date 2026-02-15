import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function CellularEnergyReset() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});

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
      answer: "Take our free 2-minute assessment quiz. It asks about your symptoms, energy levels, and health history to determine if the Cellular Energy Reset is the right fit. If it is, we'll schedule a consultation to build your plan. If something else is going on, we'll point you in the right direction."
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
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              },
              "priceRange": "$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "50"
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
              <span className="trust-rating">★★★★★</span> 5.0 on Google
            </span>
            <span className="trust-item">📍 Newport Beach, CA</span>
            <span className="trust-item">✓ Licensed Providers</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="cer-hero">
          <div className="cer-kicker">Energy · Recovery · Cellular</div>
          <h1>Your Guide to Cellular Energy Reset</h1>
          <p className="cer-body-text">
            A structured 6-week protocol combining HBOT and Red Light Therapy to restore energy
            at the cellular level — for those who want a clear plan to fix fatigue, brain fog,
            and slow recovery at the source.
          </p>
          <div className="cer-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="cer-what" className={`cer-section cer-animate ${isVisible['cer-what'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">The Benefits</span>
            <h2>What Red Light + HBOT Does for Your Body</h2>

            <div className="cer-benefits-grid">
              <div className="cer-benefit-card">
                <h4>Restore Your Natural Energy</h4>
                <p>HBOT floods cells with oxygen, Red Light activates the enzyme that drives ATP production. Real, sustained vitality — not caffeine.</p>
              </div>

              <div className="cer-benefit-card">
                <h4>Clear the Brain Fog</h4>
                <p>Your brain uses 20% of your body's energy. Restored cellular function means sharper thinking, better memory, and mental clarity that lasts.</p>
              </div>

              <div className="cer-benefit-card">
                <h4>Sleep That Actually Restores You</h4>
                <p>Improved mitochondrial function means your body repairs properly during sleep. Wake up feeling like sleep actually did something.</p>
              </div>

              <div className="cer-benefit-card">
                <h4>Faster Physical Recovery</h4>
                <p>Exercise, injury, daily wear and tear — when cells produce energy efficiently, your body repairs properly instead of falling behind.</p>
              </div>

              <div className="cer-benefit-card">
                <h4>Reduced Inflammation</h4>
                <p>Chronic low-grade inflammation drives fatigue, pain, and aging. HBOT and Red Light address it at the cellular level where it starts.</p>
              </div>

              <div className="cer-benefit-card">
                <h4>Slow Down Aging at Its Root</h4>
                <p>Mitochondrial dysfunction is a hallmark of aging. This protocol addresses it at the deepest biological level — where aging actually begins.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Is This You Section */}
        <section id="cer-who" className={`cer-section-alt cer-animate ${isVisible['cer-who'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Is This You?</span>
            <h2>Signs Your Cells Need a Reset</h2>

            <div className="cer-symptom-grid">
              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h4>You're Tired All the Time</h4>
                <p>Not lazy, not "just stressed." Persistent fatigue that sleep doesn't fix is a sign of mitochondrial dysfunction.</p>
              </div>

              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </div>
                <h4>Brain Fog is Your New Normal</h4>
                <p>Forgetting words, losing focus, walking into rooms and forgetting why. Your brain runs on ATP — and it's running low.</p>
              </div>

              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Your Doctor Says You're "Fine"</h4>
                <p>Labs look normal but you know something's off. Standard tests don't measure cellular energy production.</p>
              </div>

              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.93 19.07A10 10 0 1 1 19.07 4.93"/>
                    <path d="M2 12h2"/>
                    <path d="M12 2v2"/>
                  </svg>
                </div>
                <h4>The 2pm Crash Hits Every Day</h4>
                <p>Afternoon energy tank. Energy drinks and coffee create a cycle that makes the underlying problem worse.</p>
              </div>

              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </div>
                <h4>Sleep Doesn't Recharge You</h4>
                <p>8 hours but still waking up tired. Your cells don't have the energy to repair overnight — so sleep feels pointless.</p>
              </div>

              <div className="cer-symptom-card">
                <div className="cer-symptom-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
                  </svg>
                </div>
                <h4>Everything Aches</h4>
                <p>Joint stiffness, general soreness, feeling older than you are. Chronic inflammation at the cellular level is the root cause.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section id="cer-included" className={`cer-section cer-animate ${isVisible['cer-included'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Program Details</span>
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
        <section id="cer-timeline" className={`cer-section-alt cer-animate ${isVisible['cer-timeline'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Your Journey</span>
            <h2>The 6-Week Timeline</h2>

            <div className="cer-timeline">
              <div className="cer-timeline-item">
                <div className="cer-timeline-marker">1</div>
                <div className="cer-timeline-content">
                  <span className="cer-timeline-label">Weeks 1-2</span>
                  <h4>Foundation Phase</h4>
                  <p>3 HBOT + 3 Red Light sessions per week. Your cells begin adapting to increased oxygen and light stimulation. Some patients feel initial improvement.</p>
                </div>
              </div>

              <div className="cer-timeline-item">
                <div className="cer-timeline-marker">2</div>
                <div className="cer-timeline-content">
                  <span className="cer-timeline-label">Weeks 3-4</span>
                  <h4>Optimization Phase</h4>
                  <p>Continuing 3x weekly sessions. This is when most patients report noticeable improvements — more sustained energy, clearer thinking, better sleep.</p>
                </div>
              </div>

              <div className="cer-timeline-item">
                <div className="cer-timeline-marker">3</div>
                <div className="cer-timeline-content">
                  <span className="cer-timeline-label">Weeks 5-6</span>
                  <h4>Integration Phase</h4>
                  <p>Final sessions lock in your gains. Mitochondrial adaptations become more durable. Energy improvements feel like your new baseline.</p>
                </div>
              </div>

              <div className="cer-timeline-item">
                <div className="cer-timeline-marker cer-complete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="cer-timeline-content">
                  <span className="cer-timeline-label">Week 7</span>
                  <h4>Results Review</h4>
                  <p>Final consultation to measure progress. We'll review your energy scores, discuss what changed, and create a maintenance plan to preserve your results.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Section */}
        <section id="cer-pricing" className={`cer-section cer-animate ${isVisible['cer-pricing'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Investment</span>
            <h2>Program Pricing</h2>

            <div className="cer-pricing-grid">
              <div className="cer-pricing-card cer-pricing-main">
                <h3>6-Week Cellular Energy Reset</h3>
                <div className="cer-price">$3,999</div>
                <ul className="cer-pricing-features">
                  <li>All 36 sessions (18 HBOT + 18 Red Light)</li>
                  <li>Initial and results consultations</li>
                  <li>Weekly check-ins and tracking</li>
                  <li><strong>Bonus:</strong> 2 extra Red Light sessions</li>
                </ul>
                <p className="cer-pricing-note">Financing available through Affirm and Afterpay</p>
              </div>

              <div className="cer-pricing-card cer-pricing-addon">
                <h3>Optional: IV Upgrade</h3>
                <div className="cer-price-addon">+$999</div>
                <p>Add 6 weekly Energy IVs to accelerate results. Delivers B vitamins, amino acids, and minerals directly to cells.</p>
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
        <section id="cer-research" className={`cer-section-alt cer-animate ${isVisible['cer-research'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">The Evidence</span>
            <h2>Research Behind the Protocol</h2>
            <p className="cer-section-intro">
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
        <section id="cer-testimonials" className={`cer-section-alt cer-animate ${isVisible['cer-testimonials'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Results</span>
            <h2>What Patients Are Saying</h2>

            <div className="cer-testimonial-grid">
              <div className="cer-testimonial-card">
                <p className="cer-testimonial-quote">"I thought being tired was just my life now. By week 3, I had energy I hadn't felt in years."</p>
                <span className="cer-testimonial-author">— Sarah M., 45, Newport Beach</span>
              </div>

              <div className="cer-testimonial-card">
                <p className="cer-testimonial-quote">"The brain fog clearing was worth it alone. I can actually think through a full day without crashing."</p>
                <span className="cer-testimonial-author">— David R., 52, Newport Beach</span>
              </div>

              <div className="cer-testimonial-card">
                <p className="cer-testimonial-quote">"My doctor couldn't find anything wrong. This program found what labs missed — my cells were the problem."</p>
                <span className="cer-testimonial-author">— Jennifer L., 41, Newport Beach</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="cer-faq" className={`cer-section cer-animate ${isVisible['cer-faq'] ? 'cer-visible' : ''}`}>
          <div className="cer-container">
            <span className="cer-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="cer-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`cer-faq-item ${openFaq === index ? 'cer-faq-open' : ''}`}>
                  <button className="cer-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="cer-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cer-section-inverted">
          <div className="cer-container">
            <span className="cer-section-label-light">First Step</span>
            <h2>Stop Guessing. Start Fixing.</h2>
            <p className="cer-cta-text">
              Take the 2-minute assessment to see if the Cellular Energy Reset is right for you.
            </p>
            <Link href="/range-assessment" className="cer-btn-white">Take the Assessment</Link>
            <p className="cer-cta-location">
              Range Medical • 1901 Westcliff Dr, Newport Beach<br />
              <a href="tel:9499973988">(949) 997-3988</a>
            </p>
          </div>
        </section>

        <style jsx>{`
          /* Hero Section */
          .cer-kicker {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #737373;
            margin-bottom: 1.25rem;
          }

          .cer-body-text {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            max-width: 620px;
          }

          .cer-hero {
            padding: 4rem 1.5rem 5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .cer-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            max-width: 680px;
            margin: 0 0 1.5rem;
          }

          .cer-hero .cer-body-text {
            text-align: center;
            margin: 0 auto 2.5rem;
          }

          .cer-hero-scroll {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #737373;
            display: flex;
            flex-direction: column;
            align-items: center;
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

          /* Section Styles */
          .cer-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .cer-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .cer-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .cer-section-inverted h2 {
            color: #ffffff;
          }

          .cer-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .cer-section-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #737373;
            margin-bottom: 0.75rem;
          }

          .cer-section-label-light {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a3a3a3;
            margin-bottom: 0.75rem;
          }

          .cer-section h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .cer-section-alt h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .cer-section-intro {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 700px;
            margin: 0 0 2.5rem;
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

          /* What Is Grid */
          .cer-what-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .cer-what-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
          }

          .cer-what-icon {
            width: 64px;
            height: 64px;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.25rem;
            color: #737373;
          }

          .cer-what-card h3 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.75rem;
          }

          .cer-what-card p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Benefits Grid */
          .cer-benefits-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .cer-benefit-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
          }

          .cer-benefit-card h4 {
            font-size: 1.0625rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .cer-benefit-card p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Testimonials */
          .cer-testimonial-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .cer-testimonial-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
          }

          .cer-testimonial-quote {
            font-size: 1.0625rem;
            color: #171717;
            line-height: 1.7;
            font-style: italic;
            margin: 0 0 1.25rem;
          }

          .cer-testimonial-author {
            font-size: 0.875rem;
            color: #737373;
            font-weight: 500;
          }

          /* Conditions Tags */
          .cer-conditions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
            margin-bottom: 2.5rem;
          }

          .cer-condition-tag {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 100px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            color: #404040;
            font-weight: 500;
          }

          /* Symptom Grid */
          .cer-symptom-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .cer-symptom-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .cer-symptom-card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .cer-symptom-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: #525252;
          }

          .cer-symptom-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .cer-symptom-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Included Grid */
          .cer-included-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .cer-included-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
          }

          .cer-included-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #737373;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .cer-included-card h4 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .cer-included-card p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Timeline */
          .cer-timeline {
            max-width: 700px;
            margin: 0 auto;
          }

          .cer-timeline-item {
            display: flex;
            gap: 1.5rem;
            padding: 1.75rem 0;
            border-bottom: 1px solid #e5e5e5;
          }

          .cer-timeline-item:last-child {
            border-bottom: none;
          }

          .cer-timeline-marker {
            width: 48px;
            height: 48px;
            min-width: 48px;
            background: #000000;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.125rem;
          }

          .cer-timeline-marker.cer-complete {
            background: #22c55e;
          }

          .cer-timeline-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #737373;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .cer-timeline-content h4 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin: 0.25rem 0 0.5rem;
          }

          .cer-timeline-content p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Pricing */
          .cer-pricing-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1.5rem;
            max-width: 700px;
            margin: 0 auto 3rem;
            align-items: start;
          }

          .cer-pricing-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
          }

          .cer-pricing-main {
            border-color: #000000;
          }

          .cer-pricing-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.75rem;
          }

          .cer-price {
            font-size: 2.5rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 1.5rem;
          }

          .cer-price-addon {
            font-size: 1.5rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 1rem;
          }

          .cer-pricing-addon {
            max-width: 220px;
          }

          .cer-pricing-addon p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          .cer-pricing-features {
            list-style: none;
            padding: 0;
            margin: 0 0 1.5rem;
          }

          .cer-pricing-features li {
            font-size: 0.9375rem;
            color: #404040;
            padding: 0.625rem 0 0.625rem 1.75rem;
            position: relative;
            border-bottom: 1px solid #e5e5e5;
          }

          .cer-pricing-features li:last-child {
            border-bottom: none;
          }

          .cer-pricing-features li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: 700;
          }

          .cer-pricing-note {
            font-size: 0.875rem;
            color: #737373;
            margin: 0;
            padding-top: 1rem;
            border-top: 1px solid #e5e5e5;
          }

          /* Maintenance Preview */
          .cer-maintenance-preview {
            background: #f5f5f5;
            border-radius: 12px;
            padding: 2rem;
            max-width: 700px;
            margin: 0 auto;
          }

          .cer-maintenance-preview h3 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .cer-maintenance-preview > p {
            font-size: 0.9375rem;
            color: #525252;
            margin: 0 0 1.5rem;
          }

          .cer-maintenance-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .cer-maintenance-option {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 1.25rem;
          }

          .cer-maintenance-option h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.375rem;
          }

          .cer-maintenance-option p {
            font-size: 0.875rem;
            color: #525252;
            margin: 0 0 0.75rem;
            line-height: 1.5;
          }

          .cer-maintenance-price {
            font-size: 1rem;
            font-weight: 700;
            color: #000000;
          }

          /* Research Grid */
          .cer-research-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .cer-research-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
          }

          .cer-research-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.375rem;
          }

          .cer-research-journal {
            font-size: 0.8125rem;
            color: #737373;
            font-weight: 500;
            display: block;
            margin-bottom: 0.75rem;
          }

          .cer-research-card p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* FAQ */
          .cer-faq-list {
            max-width: 700px;
            margin: 0 auto;
          }

          .cer-faq-item {
            border-bottom: 1px solid #e5e5e5;
          }

          .cer-faq-item:last-child {
            border-bottom: none;
          }

          .cer-faq-question {
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

          .cer-faq-question span {
            font-size: 1rem;
            font-weight: 600;
            color: #171717;
            padding-right: 1rem;
          }

          .cer-faq-question svg {
            flex-shrink: 0;
            color: #737373;
            transition: transform 0.2s;
          }

          .cer-faq-open .cer-faq-question svg {
            transform: rotate(180deg);
          }

          .cer-faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
          }

          .cer-faq-open .cer-faq-answer {
            max-height: 300px;
            padding-bottom: 1.25rem;
          }

          .cer-faq-answer p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* CTA Section */
          .cer-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.7;
          }

          .cer-btn-white {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            transition: background 0.2s;
          }

          .cer-btn-white:hover {
            background: #f5f5f5;
          }

          .cer-cta-location {
            margin-top: 2rem;
            font-size: 0.9375rem;
            color: #a3a3a3;
            line-height: 1.6;
          }

          .cer-cta-location a {
            color: #ffffff;
            text-decoration: underline;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .cer-what-grid {
              grid-template-columns: 1fr;
            }

            .cer-benefits-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .cer-symptom-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .cer-testimonial-grid {
              grid-template-columns: 1fr;
            }

            .cer-research-grid {
              grid-template-columns: 1fr;
            }

            .cer-pricing-grid {
              grid-template-columns: 1fr;
            }

            .cer-pricing-addon {
              max-width: none;
            }
          }

          @media (max-width: 640px) {
            .cer-hero {
              padding: 3rem 1.5rem;
            }

            .cer-hero h1 {
              font-size: 2rem;
            }

            .cer-section h2,
            .cer-section-alt h2,
            .cer-section-inverted h2 {
              font-size: 1.75rem;
            }

            .cer-benefits-grid {
              grid-template-columns: 1fr;
            }

            .cer-symptom-grid {
              grid-template-columns: 1fr;
            }

            .cer-included-grid {
              grid-template-columns: 1fr;
            }

            .cer-timeline-item {
              flex-direction: column;
              text-align: center;
            }

            .cer-timeline-marker {
              margin: 0 auto;
            }

            .cer-maintenance-options {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
