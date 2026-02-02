// pages/exosome-therapy.jsx
// Exosome Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function ExosomeTherapy() {
  const [openFaq, setOpenFaq] = useState(null);

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

    const elements = document.querySelectorAll('.exo-page .exo-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Where do exosomes come from?",
      answer: "The exosomes we use are derived from carefully screened, ethically sourced donor tissue (typically umbilical cord or placental tissue). All sources undergo rigorous testing for safety, sterility, and quality before being processed into exosome preparations."
    },
    {
      question: "Is this the same as stem cell therapy?",
      answer: "No. Exosomes are not cells — they're tiny signaling vesicles released by cells. They carry proteins, lipids, and RNA that communicate with your cells to promote repair. This provides regenerative benefits without the complexity and regulatory issues of stem cell therapy."
    },
    {
      question: "How many treatments do I need?",
      answer: "It depends on your goals and condition. Some patients see significant benefit from a single infusion. Others, especially those with chronic conditions or significant inflammation, may benefit from 2-3 treatments spaced a few weeks apart."
    },
    {
      question: "What does an exosome IV feel like?",
      answer: "The infusion itself is similar to any standard IV — you'll feel the initial needle stick, then the infusion runs over 30-60 minutes. Most patients don't feel anything unusual during the infusion. Some report feeling energized or clear-headed afterward."
    },
    {
      question: "How long until I see results?",
      answer: "Exosomes work by signaling your cells to repair and regenerate, which takes time. Some patients notice improvements within 2-4 weeks. Full benefits often emerge over 2-3 months as cellular repair processes complete."
    },
    {
      question: "Is exosome therapy safe?",
      answer: "Yes, when sourced from reputable suppliers and administered by trained medical professionals. Exosomes have an excellent safety profile because they're naturally occurring signaling molecules. We use only rigorously tested, quality-controlled preparations."
    }
  ];

  const benefits = [
    { number: "01", title: "Cellular Communication", desc: "Exosomes are your body's natural cell-to-cell messengers. They carry instructions that tell cells to repair, regenerate, and reduce inflammation." },
    { number: "02", title: "Systemic Effects", desc: "Unlike localized treatments, IV exosomes circulate throughout your body, potentially supporting repair in multiple systems simultaneously." },
    { number: "03", title: "Anti-Inflammatory", desc: "Exosomes carry anti-inflammatory signals that may help modulate chronic inflammation — a driver of many age-related conditions." },
    { number: "04", title: "Tissue Regeneration", desc: "Research shows exosomes can promote tissue repair by stimulating resident stem cells and supporting cellular regeneration." },
    { number: "05", title: "No Cell Transplantation", desc: "Unlike stem cell therapy, exosomes don't involve transplanting cells. They deliver regenerative signals without the complexity of cell-based treatments." },
    { number: "06", title: "Emerging Science", desc: "Exosome therapy represents cutting-edge regenerative medicine. Research is rapidly expanding our understanding of their therapeutic potential." }
  ];

  const tags = [
    "Chronic Inflammation",
    "Anti-Aging",
    "Cognitive Support",
    "Athletic Recovery",
    "Tissue Repair",
    "Autoimmune Support",
    "Post-Injury Healing",
    "Longevity Optimization"
  ];

  const steps = [
    { step: "Step 1", title: "Assessment", desc: "Start with a Range Assessment. Your provider will discuss your goals, review your health history, and determine if exosome therapy is appropriate for your situation." },
    { step: "Step 2", title: "Preparation", desc: "On treatment day, we prepare the exosome solution. Our exosomes are sourced from vetted suppliers and stored under strict quality controls." },
    { step: "Step 3", title: "IV infusion", desc: "Exosomes are delivered through a standard IV, typically over 30-60 minutes. You can relax, read, or work during the infusion." },
    { step: "Step 4", title: "Signaling begins", desc: "Once in your bloodstream, exosomes circulate and deliver regenerative signals to cells throughout your body. Results develop over weeks to months." }
  ];

  const researchStudies = [
    {
      category: "MECHANISM",
      headline: "Exosomes Mediate Cell-to-Cell Communication",
      summary: "Research has established that exosomes are key mediators of intercellular communication, carrying proteins, lipids, and nucleic acids that influence recipient cell behavior and function.",
      source: "Théry et al., Nature Reviews Immunology, 2009"
    },
    {
      category: "REGENERATION",
      headline: "Exosomes Promote Tissue Repair",
      summary: "Studies demonstrate that mesenchymal stem cell-derived exosomes can promote tissue repair and regeneration by delivering regenerative signals to damaged tissues.",
      source: "Zhang et al., Frontiers in Cell and Developmental Biology, 2020"
    },
    {
      category: "INFLAMMATION",
      headline: "Anti-Inflammatory Properties Documented",
      summary: "Research shows exosomes carry immunomodulatory molecules that can help regulate inflammatory responses, making them promising for conditions involving chronic inflammation.",
      source: "Harrell et al., Cells, 2019"
    },
    {
      category: "NEUROLOGICAL",
      headline: "Potential for Neurological Support",
      summary: "Emerging research suggests exosomes can cross the blood-brain barrier and may support neurological health by delivering neuroprotective signals to brain tissue.",
      source: "Xin et al., Journal of Cerebral Blood Flow & Metabolism, 2017"
    },
    {
      category: "WOUND HEALING",
      headline: "Accelerated Wound Healing Observed",
      summary: "Clinical and preclinical studies show exosomes can accelerate wound healing by promoting angiogenesis, collagen synthesis, and cellular proliferation.",
      source: "Hu et al., Theranostics, 2018"
    },
    {
      category: "SAFETY",
      headline: "Favorable Safety Profile",
      summary: "Clinical studies report exosome therapy has a favorable safety profile with minimal adverse effects, as exosomes are naturally occurring biological messengers.",
      source: "Zhu et al., Stem Cells International, 2017"
    }
  ];

  return (
    <Layout
      title="Exosome Therapy | Regenerative Medicine | Newport Beach | Range Medical"
      description="Exosome IV therapy in Newport Beach for regeneration, anti-aging, and recovery. Cell signaling molecules that support your body's natural repair processes."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="exosome therapy Newport Beach, regenerative medicine Orange County, anti-aging therapy, cellular regeneration, exosome IV, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/exosome-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="Exosome Therapy | Regenerative Medicine | Newport Beach" />
        <meta property="og:description" content="Exosome IV therapy for regeneration and anti-aging. Cell signaling molecules that support natural repair. Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/exosome-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Exosome Therapy | Regenerative Medicine | Newport Beach" />
        <meta name="twitter:description" content="Exosome IV therapy for regeneration and anti-aging. Newport Beach." />
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
                "priceRange": "$$",
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
                "name": "Exosome Therapy",
                "description": "Exosome IV therapy delivers cell signaling molecules that communicate with your cells to promote repair, reduce inflammation, and support regeneration.",
                "url": "https://www.range-medical.com/exosome-therapy",
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

      <div className="exo-page">
        {/* Hero */}
        <section className="exo-hero">
          <div className="exo-kicker">Regenerative · Anti-Aging · Recovery</div>
          <h1>Your Guide to Exosome Therapy</h1>
          <p className="exo-body-text">Everything you need to know about exosomes — what they are, how they work, and whether they're right for your regenerative goals.</p>
          <div className="exo-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="exo-section exo-section-alt">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">What Are Exosomes</div>
              <h2>Your body's cellular messengers.</h2>
              <div className="exo-divider"></div>
              <p className="exo-body-text">
                Exosomes are tiny vesicles (30-150 nanometers) released by cells to communicate with other cells. They carry proteins, lipids, and genetic material that deliver instructions — telling recipient cells to repair, regenerate, or reduce inflammation.
              </p>
              <p className="exo-body-text" style={{ marginTop: '1rem' }}>
                Think of exosomes as packages of regenerative instructions. When delivered via IV, they circulate throughout your body, delivering these repair signals to cells and tissues that need them. At Range Medical in Newport Beach, we use exosome therapy for anti-aging, recovery, and regenerative support.
              </p>
            </div>

            <div className="exo-stat-row">
              <div className="exo-stat-item exo-animate">
                <div className="exo-stat-number">30-150</div>
                <div className="exo-stat-label">Nanometers in size<br />smaller than cells</div>
              </div>
              <div className="exo-stat-item exo-animate">
                <div className="exo-stat-number">30-60</div>
                <div className="exo-stat-label">Minutes for<br />IV infusion</div>
              </div>
              <div className="exo-stat-item exo-animate">
                <div className="exo-stat-number">2-3</div>
                <div className="exo-stat-label">Months for full<br />results to develop</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="exo-section exo-section-inverted">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">Who It's For</div>
              <h2>When you want to regenerate, not just treat.</h2>
              <div className="exo-divider"></div>
              <p className="exo-body-text">
                Exosome therapy is for people looking beyond symptom management — those who want to support their body's natural repair processes. If any of these resonate, exosomes might be worth exploring.
              </p>
            </div>

            <div className="exo-tags-grid exo-animate">
              {tags.map((tag, i) => (
                <div key={i} className="exo-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="exo-section">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">The Process</div>
              <h2>How exosome therapy works.</h2>
              <div className="exo-divider"></div>
              <p className="exo-body-text">
                The process is straightforward. Here's what to expect at our Newport Beach clinic.
              </p>
            </div>

            <div className="exo-steps-list">
              {steps.map((item, i) => (
                <div key={i} className="exo-step-item exo-animate">
                  <div className="exo-step-number">{item.step}</div>
                  <div className="exo-step-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="exo-section exo-section-alt">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">Why Exosomes</div>
              <h2>The potential of cellular signaling.</h2>
              <div className="exo-divider"></div>
              <p className="exo-body-text">
                Exosome therapy represents a new frontier in regenerative medicine. Here's what makes it unique.
              </p>
            </div>

            <div className="exo-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="exo-benefit-card exo-animate">
                  <div className="exo-benefit-number">{benefit.number}</div>
                  <div className="exo-benefit-title">{benefit.title}</div>
                  <div className="exo-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="exo-section" id="exo-research">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">Backed by Science</div>
              <h2>What the research shows.</h2>
              <div className="exo-divider"></div>
              <p className="exo-body-text">
                Exosome research is rapidly expanding. Here's what the science currently tells us.
              </p>
            </div>

            <div className="exo-research-grid">
              {researchStudies.map((study, i) => (
                <div key={i} className="exo-research-card exo-animate">
                  <div className="exo-research-category">{study.category}</div>
                  <h3 className="exo-research-headline">{study.headline}</h3>
                  <p className="exo-research-summary">{study.summary}</p>
                  <p className="exo-research-source">{study.source}</p>
                </div>
              ))}
            </div>

            <p className="exo-research-disclaimer exo-animate">
              Exosome therapy is an emerging field. These studies reflect current research findings. Individual results may vary. Treatment at Range Medical is provided under medical supervision.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="exo-section exo-section-inverted">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker">Common Questions</div>
              <h2>Everything you might be wondering.</h2>
              <div className="exo-divider"></div>
            </div>

            <div className="exo-faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`exo-faq-item ${openFaq === i ? 'open' : ''}`}
                  onClick={() => toggleFaq(i)}
                >
                  <div className="exo-faq-question">
                    {faq.question}
                    <span className="exo-faq-toggle">+</span>
                  </div>
                  <div className="exo-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="exo-section exo-section-inverted exo-cta-section">
          <div className="exo-container">
            <div className="exo-animate">
              <div className="exo-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="exo-cta-title">Interested in exosome therapy?</h2>
              <p className="exo-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a $199 Range Assessment. Your provider will review your goals and determine if exosome therapy is a good fit for your situation. Our Newport Beach team is here to help.
              </p>
              <div className="exo-cta-buttons">
                <Link href="/book" className="exo-btn-primary">Book Your Assessment</Link>
                <div className="exo-cta-or">or</div>
                <a href="tel:9499973988" className="exo-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== EXOSOME PAGE SCOPED STYLES ===== */
        .exo-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .exo-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.exo-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .exo-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .exo-section {
          padding: 4rem 1.5rem;
        }

        .exo-section-alt {
          background: #fafafa;
        }

        .exo-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .exo-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .exo-section-inverted .exo-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .exo-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .exo-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .exo-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .exo-section-inverted h1,
        .exo-section-inverted h2,
        .exo-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .exo-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .exo-section-inverted .exo-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .exo-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .exo-section-inverted .exo-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .exo-btn-primary {
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

        .exo-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .exo-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .exo-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .exo-hero .exo-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .exo-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .exo-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: exo-bounce 2s ease-in-out infinite;
        }

        @keyframes exo-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .exo-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .exo-stat-item {
          text-align: center;
        }

        .exo-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .exo-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .exo-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .exo-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .exo-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Steps List */
        .exo-steps-list {
          margin-top: 2.5rem;
        }

        .exo-step-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .exo-step-item:last-child {
          border-bottom: none;
        }

        .exo-step-number {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .exo-step-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .exo-step-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Benefit Cards */
        .exo-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .exo-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .exo-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .exo-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .exo-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .exo-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .exo-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .exo-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .exo-research-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .exo-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0891b2;
          margin-bottom: 0.875rem;
        }

        .exo-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .exo-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .exo-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .exo-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* FAQ */
        .exo-faq-list {
          margin-top: 2.5rem;
        }

        .exo-faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }

        .exo-faq-item:last-child {
          border-bottom: none;
        }

        .exo-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .exo-faq-toggle {
          font-size: 1.25rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .exo-faq-item.open .exo-faq-toggle {
          transform: rotate(45deg);
        }

        .exo-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }

        .exo-faq-item.open .exo-faq-answer {
          max-height: 300px;
          padding-top: 1rem;
          opacity: 1;
        }

        .exo-faq-answer p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.8;
        }

        .exo-faq-item.open .exo-faq-question {
          color: #ffffff;
        }

        /* CTA Section */
        .exo-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .exo-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .exo-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .exo-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .exo-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .exo-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .exo-section {
            padding: 3rem 1.5rem;
          }

          .exo-page h1 {
            font-size: 2rem;
          }

          .exo-page h2 {
            font-size: 1.5rem;
          }

          .exo-hero {
            padding: 3rem 1.5rem;
          }

          .exo-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .exo-step-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .exo-benefits-grid {
            grid-template-columns: 1fr;
          }

          .exo-research-grid {
            grid-template-columns: 1fr;
          }

          .exo-cta-title {
            font-size: 2rem;
          }

          .exo-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
