// pages/weight-loss.jsx
// Medical Weight Loss - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function WeightLoss() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('weight-loss');

  // Scroll-based animations with IntersectionObserver
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

    const elements = document.querySelectorAll('.wl-page .wl-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleResearchClick = (studyId) => {
    const study = studies.find(s => s.id === studyId);
    if (study) {
      setSelectedStudy(study);
      setIsModalOpen(true);
    }
  };

  const faqs = [
    {
      question: "Which medication is right for me?",
      answer: "Your provider will recommend based on your labs, medical history, and goals. Most patients start with tirzepatide due to its dual-action mechanism. We'll discuss all options during your assessment."
    },
    {
      question: "How much weight can I lose?",
      answer: "Results vary, but clinical trials show patients typically lose 15-25% of their body weight over 6-12 months. Some patients lose more. Your results depend on your starting point, adherence, and lifestyle factors."
    },
    {
      question: "Do I have to stay on it forever?",
      answer: "No. Many patients use GLP-1 medications for 6-12 months to reach their goal, then maintain with healthy habits. Some choose to stay on a maintenance dose. We'll help you build a plan that works for your situation."
    },
    {
      question: "What are the side effects?",
      answer: "The most common side effect is mild nausea, especially in the first few weeks. This usually improves as your body adjusts. We start with low doses and increase gradually to minimize side effects."
    },
    {
      question: "How is this different from other weight loss clinics?",
      answer: "We don't just write prescriptions. We run comprehensive labs, monitor your metabolic health, adjust your dosing based on your response, and provide real medical supervision — not a telehealth script mill."
    },
    {
      question: "Do you accept insurance?",
      answer: "We don't bill insurance directly, but we can provide documentation for HSA/FSA reimbursement. Many patients find our pricing competitive with or better than insurance copays at other clinics."
    }
  ];

  const benefits = [
    { number: "01", title: "Reduced Appetite", desc: "GLP-1 medications work on the brain's hunger centers to naturally reduce appetite and cravings. You feel satisfied with less food — without constant willpower battles." },
    { number: "02", title: "Steady Weight Loss", desc: "Unlike crash diets, GLP-1s promote gradual, sustainable weight loss. Most patients lose 1-2 lbs per week consistently over months, not days." },
    { number: "03", title: "Metabolic Improvement", desc: "These medications don't just reduce weight — they improve metabolic markers like blood sugar, insulin sensitivity, and cholesterol levels." },
    { number: "04", title: "Reduced Cravings", desc: "Many patients report that their relationship with food changes. The constant mental chatter about food quiets down, making healthy choices easier." },
    { number: "05", title: "Preserved Muscle Mass", desc: "With proper protein intake and guidance, GLP-1 patients can lose fat while preserving lean muscle mass — unlike many other weight loss approaches." },
    { number: "06", title: "Long-Term Results", desc: "Studies show that patients who reach their goal weight can maintain results long-term, especially when they've built sustainable habits during treatment." }
  ];

  const medications = [
    {
      name: "Tirzepatide",
      brand: "Mounjaro / Zepbound",
      desc: "Dual GIP/GLP-1 receptor agonist. The newest and often most effective option, targeting two pathways for enhanced weight loss.",
      highlight: "Most Popular"
    },
    {
      name: "Semaglutide",
      brand: "Ozempic / Wegovy",
      desc: "GLP-1 receptor agonist. Well-studied with years of clinical data. Effective for weight loss and blood sugar control.",
      highlight: null
    }
  ];

  const tags = [
    "Tried Everything",
    "Always Hungry",
    "Cravings Control You",
    "Yo-Yo Dieting",
    "Metabolism Feels Slow",
    "Want Real Results",
    "Need Medical Support",
    "Ready to Change"
  ];

  const timeline = [
    { period: "Week 1-2", title: "Starting Low", desc: "Begin with a low dose to let your body adjust. Some appetite reduction begins. Mild nausea possible but usually manageable." },
    { period: "Week 3-4", title: "Building Up", desc: "Dose increases as tolerated. Appetite suppression becomes more noticeable. Most patients start seeing the scale move." },
    { period: "Month 2-3", title: "Finding Your Dose", desc: "We dial in your optimal dose. Weight loss becomes consistent — typically 1-2 lbs per week. Energy often improves." },
    { period: "Month 4-6", title: "Steady Progress", desc: "You're in a rhythm. Clothes fit differently. Lab markers improving. We continue monitoring and adjusting as needed." },
    { period: "Month 6-12", title: "Reaching Goals", desc: "Most patients approach or reach their goal weight. We discuss maintenance strategies and long-term planning." }
  ];

  const steps = [
    { step: "01", title: "Get started", desc: "Get started with Range Medical. We'll discuss your weight history, goals, and determine if GLP-1 medications are right for you." },
    { step: "02", title: "Run comprehensive labs", desc: "We check metabolic markers, thyroid, hormones, and other factors that affect weight — not just the basics." },
    { step: "03", title: "Start your medication", desc: "Your provider prescribes the right medication at the right starting dose. We teach you how to self-inject (it's easier than you think)." },
    { step: "04", title: "Ongoing support", desc: "Weekly check-ins, dose adjustments based on your response, and lab monitoring throughout your journey. Real support, not just refills." }
  ];


  return (
    <Layout
      title="Medical Weight Loss | Tirzepatide & Semaglutide | Newport Beach | Range Medical"
      description="Physician-supervised weight loss with Tirzepatide (Mounjaro) and Semaglutide (Ozempic/Wegovy) in Newport Beach. Real medical support, not just prescriptions."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="medical weight loss Newport Beach, Tirzepatide Orange County, Semaglutide clinic, Mounjaro, Ozempic, Wegovy, GLP-1 weight loss, weight loss doctor Newport Beach" />
        <link rel="canonical" href="https://www.range-medical.com/weight-loss" />

        {/* Open Graph */}
        <meta property="og:title" content="Medical Weight Loss | Tirzepatide & Semaglutide | Newport Beach | Range Medical" />
        <meta property="og:description" content="Physician-supervised GLP-1 weight loss with real medical support. Tirzepatide and Semaglutide available. Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/weight-loss" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Medical Weight Loss | Tirzepatide & Semaglutide | Newport Beach" />
        <meta name="twitter:description" content="Physician-supervised GLP-1 weight loss. Tirzepatide and Semaglutide. Real medical support in Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />

        {/* Geo Tags */}
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "url": "https://www.range-medical.com",
                "telephone": "(949) 997-3988",
                "image": "https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
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
                "areaServed": [
                  { "@type": "City", "name": "Newport Beach" },
                  { "@type": "City", "name": "Costa Mesa" },
                  { "@type": "City", "name": "Irvine" },
                  { "@type": "City", "name": "Huntington Beach" },
                  { "@type": "City", "name": "Laguna Beach" },
                  { "@type": "City", "name": "Corona del Mar" },
                  { "@type": "AdministrativeArea", "name": "Orange County" }
                ],
                "priceRange": "$",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "5.0",
                  "reviewCount": "10",
                  "bestRating": "5"
                },
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "09:00",
                  "closes": "17:00"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "MedicalTherapy",
                "name": "Medical Weight Loss",
                "alternateName": "GLP-1 Weight Loss Therapy",
                "description": "Physician-supervised weight loss using GLP-1 medications including Tirzepatide and Semaglutide with comprehensive metabolic monitoring.",
                "url": "https://www.range-medical.com/weight-loss",
                "provider": {
                  "@type": "MedicalBusiness",
                  "name": "Range Medical",
                  "url": "https://www.range-medical.com"
                },
                "areaServed": {
                  "@type": "City",
                  "name": "Newport Beach, CA"
                }
              },
              {
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
              }
            ])
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">5.0 on Google</span>
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="wl-page">
        {/* Hero */}
        <section className="wl-hero">
          <div className="v2-label"><span className="v2-dot" /> WEIGHT LOSS</div>
          <h1>YOUR GUIDE TO MEDICAL WEIGHT LOSS</h1>
          <div className="wl-hero-rule"></div>
          <p className="wl-body-text">Everything you need to know about GLP-1 medications like Tirzepatide and Semaglutide — how they work, what to expect, and whether they're right for you.</p>
          <div className="wl-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> WHAT IS IT</div>
              <h2>A NEW CLASS OF MEDICATIONS THAT ACTUALLY WORK.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                GLP-1 medications (like Tirzepatide and Semaglutide) work differently than anything before them. They target hormones that control hunger, satiety, and metabolism — helping your body naturally want less food while improving how you process what you eat.
              </p>
              <p className="wl-body-text" style={{ marginTop: '1rem' }}>
                This isn't about willpower. It's about biology. At Range Medical in Newport Beach, we combine these medications with real medical supervision — labs, monitoring, and ongoing support — not just a prescription.
              </p>
            </div>

            <div className="wl-stat-row">
              <div className="wl-stat-item wl-animate">
                <div className="wl-stat-number">15-25%</div>
                <div className="wl-stat-label">Average body weight loss<br />over 6-12 months</div>
              </div>
              <div className="wl-stat-item wl-animate">
                <div className="wl-stat-number">1-2 lbs</div>
                <div className="wl-stat-label">Typical weekly weight loss<br />once at therapeutic dose</div>
              </div>
              <div className="wl-stat-item wl-animate">
                <div className="wl-stat-number">20%</div>
                <div className="wl-stat-label">Reduction in heart attack<br />and stroke risk (SELECT trial)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="wl-section wl-section-inverted">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> WHO IT'S FOR</div>
              <h2>YOU'VE TRIED EVERYTHING. THIS IS DIFFERENT.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                If diets and exercise haven't worked long-term, it's not a character flaw — it's biology working against you. GLP-1 medications can help level the playing field. Sound familiar?
              </p>
            </div>

            <div className="wl-tags-grid wl-animate">
              {tags.map((tag, i) => (
                <div key={i} className="wl-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Medications */}
        <section className="wl-section">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> MEDICATIONS WE OFFER</div>
              <h2>THE RIGHT MEDICATION FOR YOUR SITUATION.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                We offer both major GLP-1 medications. Your provider will recommend the best option based on your labs, history, and goals.
              </p>
            </div>

            <div className="wl-meds-grid">
              {medications.map((med, i) => (
                <div key={i} className="wl-med-card wl-animate">
                  {med.highlight && <div className="wl-med-badge">{med.highlight}</div>}
                  <div className="wl-med-name">{med.name}</div>
                  <div className="wl-med-brand">{med.brand}</div>
                  <div className="wl-med-desc">{med.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> HOW IT MAY HELP</div>
              <h2>MORE THAN JUST WEIGHT LOSS.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                GLP-1 medications don't just help you lose weight — they change your relationship with food and improve your metabolic health.
              </p>
            </div>

            <div className="wl-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="wl-benefit-card wl-animate">
                  <div className="wl-benefit-number">{benefit.number}</div>
                  <div className="wl-benefit-title">{benefit.title}</div>
                  <div className="wl-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results Timeline */}
        <section className="wl-section wl-section-inverted">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> WHAT TO EXPECT</div>
              <h2>YOUR WEIGHT LOSS JOURNEY, WEEK BY WEEK.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                Results don't happen overnight, but they do happen. Here's the typical timeline our patients experience.
              </p>
            </div>

            <div className="wl-timeline">
              {timeline.map((item, i) => (
                <div key={i} className="wl-timeline-item wl-animate">
                  <div className="wl-timeline-period">{item.period}</div>
                  <div className="wl-timeline-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="wl-section" id="wl-research">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> BACKED BY SCIENCE</div>
              <h2>EVIDENCE-BASED RESULTS</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="wl-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="wl-research-card wl-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="wl-research-category">{study.category}</div>
                  <h3 className="wl-research-headline">{study.headline}</h3>
                  <p className="wl-research-summary">{study.summary}</p>
                  <p className="wl-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="wl-research-disclaimer wl-animate">
              These studies reflect clinical trial results. Individual results may vary. Medical weight loss at Range Medical is provided under physician supervision with regular monitoring.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> GETTING STARTED</div>
              <h2>YOUR FIRST VISIT, STEP BY STEP.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                Getting started is straightforward. Here's exactly what happens at our Newport Beach clinic.
              </p>
            </div>

            <div className="wl-expect-list">
              {steps.map((item, i) => (
                <div key={i} className="wl-expect-item wl-animate">
                  <div className="wl-expect-step">{item.step}</div>
                  <div className="wl-expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="wl-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`wl-faq-item ${openFaq === index ? 'wl-faq-open' : ''}`}>
                  <button className="wl-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="wl-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="wl-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="wl-section wl-section-inverted wl-cta-section">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label" style={{ marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
              <h2 className="wl-cta-title">READY TO LOSE WEIGHT FOR GOOD?</h2>
              <p className="wl-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Get started with Range Medical. We'll review your history, run labs, and see if GLP-1 medications are right for you. Our Newport Beach team is here to help.
              </p>
              <div className="wl-cta-buttons">
                <Link href="/start" className="wl-btn-primary">START NOW</Link>
                <div className="wl-cta-or">or</div>
                <a href="tel:9499973988" className="wl-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="weight-loss"
        />
      </div>

      <style jsx>{`
        /* ===== WEIGHT LOSS PAGE V2 SCOPED STYLES ===== */
        .wl-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Trust Bar */
        .trust-bar .trust-item {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #737373;
        }

        /* Animations */
        .wl-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.wl-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .wl-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .wl-section {
          padding: 6rem 2rem;
        }

        .wl-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .wl-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines */
        .wl-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #171717;
          text-transform: uppercase;
        }

        .wl-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #171717;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .wl-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .wl-section-inverted h1,
        .wl-section-inverted h2,
        .wl-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .wl-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .wl-section-inverted .wl-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .wl-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .wl-section-inverted .wl-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .wl-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #1a1a1a;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .wl-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        /* Hero */
        .wl-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .wl-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .wl-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .wl-hero .wl-body-text {
          text-align: left;
          margin: 0 0 2.5rem;
        }

        .wl-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .wl-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: wl-bounce 2s ease-in-out infinite;
        }

        @keyframes wl-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .wl-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .wl-stat-item {
          text-align: center;
        }

        .wl-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .wl-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .wl-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .wl-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .wl-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Medication Cards */
        .wl-meds-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }

        .wl-med-card {
          padding: 2rem;
          border-radius: 0;
          border: 1px solid #e0e0e0;
          border-right: none;
          background: #ffffff;
          transition: border-color 0.2s ease;
          position: relative;
        }

        .wl-med-card:last-child {
          border-right: 1px solid #e0e0e0;
        }

        .wl-med-card:hover {
          border-color: #1a1a1a;
        }

        .wl-med-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          background: #808080;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 0;
        }

        .wl-med-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .wl-med-brand {
          font-size: 0.8125rem;
          color: #737373;
          margin-bottom: 1rem;
        }

        .wl-med-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
        }

        /* Benefit Cards */
        .wl-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .wl-benefit-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .wl-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .wl-benefit-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .wl-benefit-card:hover {
          background: #fafafa;
        }

        .wl-benefit-number {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #808080;
          margin-bottom: 1rem;
        }

        .wl-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .wl-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
        }

        /* Timeline */
        .wl-timeline {
          margin-top: 2.5rem;
        }

        .wl-timeline-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          align-items: flex-start;
        }

        .wl-timeline-item:last-child {
          border-bottom: none;
        }

        .wl-timeline-period {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1a1a1a;
          min-width: 90px;
          letter-spacing: 0.02em;
          background: #808080;
          padding: 0.375rem 0.75rem;
          border-radius: 0;
          text-align: center;
        }

        .wl-timeline-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.375rem;
        }

        .wl-timeline-content p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.7;
        }

        /* Research Cards */
        .wl-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .wl-research-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .wl-research-card:nth-child(2n) {
          border-right: none;
        }

        .wl-research-card:last-child,
        .wl-research-card:nth-last-child(2):nth-child(odd) {
          border-bottom: none;
        }

        .wl-research-card:hover {
          background: #fafafa;
        }

        .wl-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 0.875rem;
        }

        .wl-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .wl-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
          margin-bottom: 1rem;
        }

        .wl-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .wl-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Expect List / Steps */
        .wl-expect-list {
          margin-top: 2.5rem;
        }

        .wl-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .wl-expect-item:last-child {
          border-bottom: none;
        }

        .wl-expect-step {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 56px;
          letter-spacing: -0.02em;
        }

        .wl-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .wl-expect-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* FAQ */
        .wl-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .wl-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .wl-faq-item:last-child {
          border-bottom: none;
        }

        .wl-faq-question {
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

        .wl-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .wl-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
          padding-right: 0 !important;
        }

        .wl-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .wl-faq-open .wl-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .wl-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .wl-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .wl-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #ffffff;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }

        .wl-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .wl-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .wl-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .wl-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .wl-section {
            padding: 3rem 1.5rem;
          }

          .wl-section-alt {
            padding: 3rem 1.5rem;
          }

          .wl-page h1 {
            font-size: 2rem;
          }

          .wl-page h2 {
            font-size: 1.5rem;
          }

          .wl-hero {
            padding: 3rem 1.5rem;
          }

          .wl-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .wl-meds-grid {
            grid-template-columns: 1fr;
          }

          .wl-med-card {
            border-right: 1px solid #e0e0e0;
            border-bottom: none;
          }

          .wl-med-card:last-child {
            border-bottom: 1px solid #e0e0e0;
          }

          .wl-benefits-grid {
            grid-template-columns: 1fr;
          }

          .wl-benefit-card {
            border-right: none;
          }

          .wl-benefit-card:last-child {
            border-bottom: none;
          }

          .wl-research-grid {
            grid-template-columns: 1fr;
          }

          .wl-research-card {
            border-right: none;
          }

          .wl-research-card:last-child {
            border-bottom: none;
          }

          .wl-timeline-item {
            flex-direction: column;
            gap: 0.75rem;
          }

          .wl-timeline-period {
            align-self: flex-start;
          }

          .wl-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .wl-cta-section {
            padding: 3rem 1.5rem;
          }

          .wl-cta-title {
            font-size: 2rem;
          }

          .wl-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
