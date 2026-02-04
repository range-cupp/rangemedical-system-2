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
    { step: "Step 1", title: "Book your assessment", desc: "Start with a $199 Range Assessment. We'll discuss your weight history, goals, and determine if GLP-1 medications are right for you." },
    { step: "Step 2", title: "Run comprehensive labs", desc: "We check metabolic markers, thyroid, hormones, and other factors that affect weight — not just the basics." },
    { step: "Step 3", title: "Start your medication", desc: "Your provider prescribes the right medication at the right starting dose. We teach you how to self-inject (it's easier than you think)." },
    { step: "Step 4", title: "Ongoing support", desc: "Weekly check-ins, dose adjustments based on your response, and lab monitoring throughout your journey. Real support, not just refills." }
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
                  "reviewCount": "90",
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
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      <div className="wl-page">
        {/* Hero */}
        <section className="wl-hero">
          <div className="wl-kicker">Weight Loss · Metabolism · Results</div>
          <h1>Your Guide to Medical Weight Loss</h1>
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
              <div className="wl-kicker">What Is It</div>
              <h2>A new class of medications that actually work.</h2>
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
              <div className="wl-kicker">Who It's For</div>
              <h2>You've tried everything. This is different.</h2>
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
              <div className="wl-kicker">Medications We Offer</div>
              <h2>The right medication for your situation.</h2>
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
              <div className="wl-kicker">How It May Help</div>
              <h2>More than just weight loss.</h2>
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
              <div className="wl-kicker">What to Expect</div>
              <h2>Your weight loss journey, week by week.</h2>
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
              <div className="wl-kicker">Backed by Science</div>
              <h2>What the Research Says</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                GLP-1 medications are the most studied weight loss drugs in history. Here's what the clinical trials show.
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
              <div className="wl-kicker">Getting Started</div>
              <h2>Your first visit, step by step.</h2>
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
        <section className="wl-section-alt">
          <div className="wl-container">
            <span className="wl-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="wl-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`wl-faq-item ${openFaq === index ? 'wl-faq-open' : ''}`}>
                  <button className="wl-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
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
              <div className="wl-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="wl-cta-title">Ready to lose weight for good?</h2>
              <p className="wl-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a $199 Range Assessment. We'll review your history, run labs, and see if GLP-1 medications are right for you. Our Newport Beach team is here to help.
              </p>
              <div className="wl-cta-buttons">
                <Link href="/book?reason=energy" className="wl-btn-primary">Book Your Assessment</Link>
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
        /* ===== WEIGHT LOSS PAGE SCOPED STYLES ===== */
        .wl-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
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
          padding: 4rem 1.5rem;
        }

        .wl-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .wl-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .wl-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .wl-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .wl-section-inverted .wl-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .wl-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .wl-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
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
          color: #525252;
          max-width: 600px;
        }

        .wl-section-inverted .wl-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .wl-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .wl-section-inverted .wl-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .wl-btn-primary {
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

        .wl-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .wl-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .wl-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .wl-hero .wl-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
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
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
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
          border-radius: 100px;
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
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wl-med-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .wl-med-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .wl-med-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          background: #16a34a;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
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
          color: #525252;
        }

        /* Benefit Cards */
        .wl-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wl-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .wl-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .wl-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
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
          color: #525252;
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
          color: #000000;
          min-width: 90px;
          letter-spacing: 0.02em;
          background: #ffffff;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
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
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .wl-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wl-research-card:hover {
          border-color: #171717;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .wl-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #16a34a;
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
          color: #525252;
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

        /* Expect List */
        .wl-expect-list {
          margin-top: 2.5rem;
        }

        .wl-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .wl-expect-item:last-child {
          border-bottom: none;
        }

        .wl-expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .wl-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .wl-expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .wl-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .wl-faq-item {
          border-bottom: 1px solid #e5e5e5;
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

        .wl-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .wl-faq-open .wl-faq-question svg {
          transform: rotate(180deg);
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
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .wl-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .wl-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
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

          .wl-benefits-grid {
            grid-template-columns: 1fr;
          }

          .wl-research-grid {
            grid-template-columns: 1fr;
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
