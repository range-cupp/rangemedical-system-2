// pages/iv-therapy.jsx
// IV Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function IVTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('iv-therapy');

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

    const elements = document.querySelectorAll('.iv-page .iv-animate');
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
      question: "Do I need an appointment?",
      answer: "Walk-ins are welcome for established patients. New patients should book a quick screening first to make sure IV therapy is appropriate for you. Most people can get started the same day."
    },
    {
      question: "How long does an IV take?",
      answer: "Most IVs take 30-60 minutes depending on the formulation and your hydration status. Bring a book, laptop, or just relax — we have comfortable chairs and Wi-Fi."
    },
    {
      question: "How often should I get an IV?",
      answer: "It depends on your goals. Some patients come weekly for performance or recovery support. Others come monthly for maintenance. We'll recommend a frequency based on your situation."
    },
    {
      question: "Is IV therapy safe?",
      answer: "Yes, when administered by trained medical professionals using sterile technique and pharmaceutical-grade nutrients. We screen all patients and monitor you throughout your infusion."
    },
    {
      question: "Will I feel results right away?",
      answer: "Most people notice improved energy and hydration within hours of their IV. The full benefits of certain nutrients (like glutathione for detox) may develop over 24-48 hours."
    },
    {
      question: "Can I customize my IV?",
      answer: "Yes. We can add specific vitamins, minerals, or amino acids to any IV based on your needs. Talk to your provider about customization options."
    }
  ];


  const benefits = [
    { number: "01", title: "100% Absorption", desc: "IV delivery bypasses the digestive system, delivering nutrients directly to your bloodstream. No loss from poor gut absorption or first-pass metabolism." },
    { number: "02", title: "Rapid Results", desc: "Feel the effects within hours, not days. IV therapy provides immediate hydration and nutrient delivery when your body needs it most." },
    { number: "03", title: "Higher Doses", desc: "IV allows therapeutic doses that aren't possible orally. High-dose Vitamin C, for example, reaches blood levels 50-70x higher than oral supplementation." },
    { number: "04", title: "Cellular Hydration", desc: "Proper hydration at the cellular level supports every system in your body — from cognitive function to physical performance to skin health." },
    { number: "05", title: "Immune Support", desc: "Key nutrients like Vitamin C, Zinc, and Glutathione support your immune system's ability to fight infections and recover from illness." },
    { number: "06", title: "Recovery & Performance", desc: "Athletes and active individuals use IV therapy to speed recovery, reduce inflammation, and maintain peak performance." }
  ];

  const tags = [
    "Low Energy / Fatigue",
    "Frequent Illness",
    "Slow Recovery",
    "Dehydration",
    "Jet Lag / Travel",
    "Hangover Recovery",
    "Athletic Performance",
    "General Wellness"
  ];

  
  return (
    <Layout
      title="IV Therapy | Vitamin Infusions | Newport Beach | Range Medical"
      description="IV vitamin therapy in Newport Beach. The Range IV delivers 5 essential nutrients directly to your bloodstream. Walk-ins welcome for established patients."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="IV therapy Newport Beach, vitamin IV Orange County, IV drip, hydration therapy, glutathione IV, vitamin C IV, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/iv-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="IV Therapy | Vitamin Infusions | Newport Beach" />
        <meta property="og:description" content="IV vitamin therapy delivering nutrients directly to your bloodstream. Walk-ins welcome in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/iv-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IV Therapy | Vitamin Infusions | Newport Beach" />
        <meta name="twitter:description" content="IV vitamin therapy delivering nutrients directly to your bloodstream. Newport Beach." />
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
                "name": "IV Therapy",
                "description": "IV vitamin infusion therapy delivering essential nutrients directly to the bloodstream for rapid absorption, hydration, and wellness support.",
                "url": "https://www.range-medical.com/iv-therapy",
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
          <span className="trust-item">✓ Walk-ins Welcome</span>
        </div>
      </div>

      <div className="iv-page">
        {/* Hero */}
        <section className="iv-hero">
          <div className="iv-kicker">Hydration · Energy · Recovery</div>
          <h1>Your Guide to IV Therapy</h1>
          <p className="iv-body-text">Everything you need to know about IV vitamin therapy — what it is, how it works, and whether it's right for your goals.</p>
          <div className="iv-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker">What Is IV Therapy</div>
              <h2>Skip the gut. Feed your cells directly.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                When you take vitamins orally, you lose 20-80% to digestion. IV therapy bypasses your GI tract entirely, delivering nutrients directly to your bloodstream where your cells can use them immediately.
              </p>
              <p className="iv-body-text" style={{ marginTop: '1rem' }}>
                At Range Medical in Newport Beach, we offer IV therapy for energy, immune support, recovery, and general wellness. Whether you're fighting fatigue, recovering from travel, or optimizing performance — IV therapy gets nutrients where they need to go.
              </p>
            </div>

            <div className="iv-stat-row">
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">100%</div>
                <div className="iv-stat-label">Bioavailability<br />with IV delivery</div>
              </div>
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">30-60</div>
                <div className="iv-stat-label">Minutes per session<br />comfortable & relaxing</div>
              </div>
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">5</div>
                <div className="iv-stat-label">Key nutrients<br />in the Range IV</div>
              </div>
            </div>
          </div>
        </section>

        {/* The Range IV */}
        <section className="iv-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker">Our Signature IV</div>
              <h2>The Range IV</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                Our signature IV delivers 5 essential vitamins and minerals chosen for their synergistic effects on energy, immunity, and recovery. This is our most popular formulation.
              </p>
            </div>

            <div className="iv-range-card iv-animate">
              <div className="iv-range-header">
                <div className="iv-range-badge">Signature Formula</div>
                <h3>A balanced blend for everyday wellness</h3>
              </div>
              <p className="iv-range-desc">
                The Range IV combines 5 essential vitamins and minerals selected for their synergistic effects on energy, immune function, and recovery. It's our go-to recommendation for patients looking for general wellness support, a post-travel reset, or regular maintenance.
              </p>
              <div className="iv-range-footer">
                <p>Add-ons available. Ask your provider about customization based on your specific needs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="iv-section iv-section-inverted">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker">Who It's For</div>
              <h2>Feel better faster.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                IV therapy helps a wide range of people. If any of these sound familiar, you might benefit from a session at our Newport Beach clinic.
              </p>
            </div>

            <div className="iv-tags-grid iv-animate">
              {tags.map((tag, i) => (
                <div key={i} className="iv-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker">Why IV Therapy Works</div>
              <h2>The science of direct delivery.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                IV therapy isn't just about convenience — it's about efficacy. Here's why direct nutrient delivery makes a difference.
              </p>
            </div>

            <div className="iv-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="iv-benefit-card iv-animate">
                  <div className="iv-benefit-number">{benefit.number}</div>
                  <div className="iv-benefit-title">{benefit.title}</div>
                  <div className="iv-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="iv-section" id="iv-research">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker">Backed by Science</div>
              <h2>Evidence-Based Results</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="iv-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="iv-research-card iv-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="iv-research-category">{study.category}</div>
                  <h3 className="iv-research-headline">{study.headline}</h3>
                  <p className="iv-research-summary">{study.summary}</p>
                  <p className="iv-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="iv-research-disclaimer iv-animate">
              These studies reflect research findings. Individual results may vary. IV therapy at Range Medical is provided under medical supervision.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="iv-section-alt">
          <div className="iv-container">
            <span className="iv-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="iv-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`iv-faq-item ${openFaq === index ? 'iv-faq-open' : ''}`}>
                  <button className="iv-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="iv-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="iv-section iv-section-inverted iv-cta-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="iv-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="iv-cta-title">Ready to feel the difference?</h2>
              <p className="iv-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Walk-ins welcome for established patients. New to Range? Book a quick screening to get started. Our Newport Beach team is ready to help.
              </p>
              <div className="iv-cta-buttons">
                <Link href="/range-assessment" className="iv-btn-primary">Take Your Assessment</Link>
                <div className="iv-cta-or">or</div>
                <a href="tel:9499973988" className="iv-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="iv-therapy"
        />
      </div>

      <style jsx>{`
        /* ===== IV PAGE SCOPED STYLES ===== */
        .iv-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .iv-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.iv-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .iv-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .iv-section {
          padding: 4rem 1.5rem;
        }

        .iv-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .iv-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .iv-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .iv-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .iv-section-inverted .iv-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .iv-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .iv-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .iv-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .iv-section-inverted h1,
        .iv-section-inverted h2,
        .iv-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .iv-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .iv-section-inverted .iv-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .iv-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .iv-section-inverted .iv-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .iv-btn-primary {
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

        .iv-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .iv-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .iv-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .iv-hero .iv-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .iv-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .iv-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: iv-bounce 2s ease-in-out infinite;
        }

        @keyframes iv-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .iv-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .iv-stat-item {
          text-align: center;
        }

        .iv-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .iv-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Range IV Card */
        .iv-range-card {
          margin-top: 2.5rem;
          padding: 2.5rem;
          border-radius: 12px;
          border: 2px solid #000000;
          background: #ffffff;
        }

        .iv-range-header {
          margin-bottom: 1.5rem;
        }

        .iv-range-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          background: #0891b2;
          color: #ffffff;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .iv-range-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
        }

        .iv-range-desc {
          font-size: 1rem;
          line-height: 1.7;
          color: #525252;
          margin: 0;
        }

        .iv-range-footer {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e5e5;
        }

        .iv-range-footer p {
          font-size: 0.875rem;
          color: #737373;
          text-align: center;
        }

        /* Tags */
        .iv-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .iv-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .iv-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Cards */
        .iv-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .iv-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .iv-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .iv-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .iv-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .iv-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .iv-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .iv-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .iv-research-card:hover {
          border-color: #171717;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .iv-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0891b2;
          margin-bottom: 0.875rem;
        }

        .iv-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .iv-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .iv-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .iv-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* FAQ */
        .iv-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .iv-faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .iv-faq-item:last-child {
          border-bottom: none;
        }

        .iv-faq-question {
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

        .iv-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .iv-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .iv-faq-open .iv-faq-question svg {
          transform: rotate(180deg);
        }

        .iv-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .iv-faq-open .iv-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .iv-faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .iv-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .iv-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .iv-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .iv-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .iv-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .iv-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .iv-section {
            padding: 3rem 1.5rem;
          }

          .iv-page h1 {
            font-size: 2rem;
          }

          .iv-page h2 {
            font-size: 1.5rem;
          }

          .iv-hero {
            padding: 3rem 1.5rem;
          }

          .iv-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .iv-benefits-grid {
            grid-template-columns: 1fr;
          }

          .iv-research-grid {
            grid-template-columns: 1fr;
          }

          .iv-cta-title {
            font-size: 2rem;
          }

          .iv-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
