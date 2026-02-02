// pages/peptide-therapy.jsx
// Peptide Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function PeptideTherapy() {
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

    const elements = document.querySelectorAll('.pep-page .pep-animate');
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
      question: "Are peptides safe?",
      answer: "Yes, when prescribed by a licensed provider and sourced from licensed compounding pharmacies. Peptides have been studied for decades and have a strong safety profile. We only use peptides from reputable, FDA-registered pharmacies."
    },
    {
      question: "Do I have to inject myself?",
      answer: "Most peptides are subcutaneous injections — a tiny needle just under the skin, similar to what diabetics use for insulin. It's much easier than people expect. We'll teach you exactly how to do it, and most patients are comfortable after their first try."
    },
    {
      question: "How long until I see results?",
      answer: "It depends on the peptide and your goals. Healing peptides often show improvement in 2-4 weeks. Growth hormone peptides may take 4-8 weeks for noticeable changes. We'll set realistic expectations based on your protocol."
    },
    {
      question: "Can I combine peptides with other treatments?",
      answer: "Absolutely. Peptides often work synergistically with other therapies like hormone optimization, IV therapy, and hyperbaric oxygen. Many of our patients use peptides as part of a broader protocol."
    },
    {
      question: "How much do peptides cost?",
      answer: "Pricing varies by peptide and dosing protocol. After your assessment, we'll provide a clear cost breakdown. Most patients spend $150-400/month depending on their protocol. No hidden fees."
    },
    {
      question: "Do I need a prescription?",
      answer: "Yes. All peptides we provide require a prescription from our medical provider. This ensures proper dosing, monitoring, and sourcing from legitimate pharmacies."
    }
  ];

  const benefits = [
    { number: "01", title: "Injury Healing", desc: "Therapeutic peptides may accelerate tissue repair by promoting angiogenesis, reducing inflammation, and supporting collagen synthesis." },
    { number: "02", title: "Faster Recovery", desc: "Whether from workouts, surgery, or illness, certain peptides may help your body recover faster by supporting natural repair mechanisms." },
    { number: "03", title: "Better Sleep", desc: "Growth hormone-releasing peptides may improve sleep quality and depth, which is when your body does most of its repair and recovery work." },
    { number: "04", title: "Reduced Inflammation", desc: "Several peptides have anti-inflammatory properties that may help with chronic pain, gut issues, and systemic inflammation." },
    { number: "05", title: "Immune Support", desc: "Certain peptides may support immune function, helping your body fight infections and maintain optimal health." },
    { number: "06", title: "Performance & Longevity", desc: "Growth hormone peptides may support lean muscle, fat metabolism, and cellular health — key factors in performance and healthy aging." }
  ];

  const treatmentAreas = [
    {
      name: "Recovery & Healing",
      category: "Most Common",
      desc: "Struggling with an injury that won't heal? Recovering from surgery? Our recovery protocols support tissue repair, reduce inflammation, and accelerate your body's natural healing process.",
      highlight: "Most Popular"
    },
    {
      name: "Growth Hormone Optimization",
      category: "Performance",
      desc: "Poor sleep, slow recovery, declining body composition? Growth hormone-releasing peptides may support deeper sleep, faster recovery, and improved vitality without suppressing natural production.",
      highlight: null
    },
    {
      name: "Immune Support",
      category: "Wellness",
      desc: "Getting sick frequently? Feeling run down? Certain peptides may help strengthen your immune system and support your body's natural defense mechanisms.",
      highlight: null
    },
    {
      name: "Sexual Wellness",
      category: "Intimacy",
      desc: "Experiencing decreased libido or sexual function? We offer peptide protocols that work with your nervous system to support arousal and function in both men and women.",
      highlight: null
    },
    {
      name: "Mitochondrial Health",
      category: "Energy & Longevity",
      desc: "Chronic fatigue? Low energy? Mitochondrial peptides support cellular energy production, metabolic function, and healthy aging at the cellular level.",
      highlight: null
    },
    {
      name: "Gut Health",
      category: "Digestive",
      desc: "Dealing with gut issues, IBS, or digestive discomfort? Certain peptides have been studied for their protective effects on the GI tract and may support mucosal healing.",
      highlight: null
    }
  ];

  const tags = [
    "Healing From Injury",
    "Slow Recovery",
    "Poor Sleep Quality",
    "Chronic Inflammation",
    "Low Energy",
    "Want Better Performance",
    "Post-Surgery Healing",
    "Optimizing Longevity"
  ];

  const steps = [
    { step: "Step 1", title: "Book your assessment", desc: "Start with a $199 Range Assessment. We'll discuss your goals, medical history, and determine which peptides might help your situation." },
    { step: "Step 2", title: "Get your protocol", desc: "Your provider designs a personalized peptide protocol — which peptides, what doses, and how long. We explain everything clearly." },
    { step: "Step 3", title: "Learn to inject", desc: "We teach you how to self-administer subcutaneous injections. It's easier than you think — most patients are comfortable immediately." },
    { step: "Step 4", title: "Track & adjust", desc: "Regular check-ins to monitor your progress. We adjust your protocol as needed to optimize results." }
  ];

  const researchStudies = [
    {
      category: "TISSUE HEALING",
      headline: "Peptides Accelerate Tendon Healing",
      summary: "Multiple studies show healing peptides significantly accelerate tendon-to-bone healing and improve functional recovery, with effects on angiogenesis and growth factor expression.",
      source: "Journal of Orthopaedic Research, 2019"
    },
    {
      category: "GUT HEALTH",
      headline: "Peptides Protect Against GI Damage",
      summary: "Research demonstrates protective effects of certain peptides against various GI lesions, including those caused by NSAIDs, alcohol, and stress, with promotion of mucosal healing.",
      source: "Current Pharmaceutical Design, 2018"
    },
    {
      category: "WOUND HEALING",
      headline: "Peptides Enhance Tissue Repair",
      summary: "Healing peptides have been shown to promote wound healing, reduce inflammation, and support tissue regeneration through multiple cellular mechanisms.",
      source: "Annals of the New York Academy of Sciences, 2012"
    },
    {
      category: "GROWTH HORMONE",
      headline: "Peptides Support GH Production",
      summary: "Clinical trials show that growth hormone-releasing peptides significantly increase GH and IGF-1 levels with sustained effects, supporting recovery and body composition.",
      source: "Journal of Clinical Endocrinology & Metabolism, 2006"
    },
    {
      category: "IMMUNE FUNCTION",
      headline: "Peptides Boost Immunity",
      summary: "Immune-supporting peptides have been shown to enhance immune function in clinical trials, with applications in infection support and immune deficiency conditions.",
      source: "Expert Opinion on Biological Therapy, 2017"
    },
    {
      category: "MITOCHONDRIAL HEALTH",
      headline: "Peptides Support Cellular Energy",
      summary: "Research shows mitochondrial peptides support cellular energy production, metabolic function, and exercise capacity — key factors in healthy aging and performance.",
      source: "Cell Metabolism, 2020"
    }
  ];

  return (
    <Layout
      title="Peptide Therapy | Healing, Recovery & Performance | Newport Beach | Range Medical"
      description="Advanced peptide therapy in Newport Beach for healing, recovery, immune support, and optimization. Expert-guided protocols tailored to your goals."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="peptide therapy Newport Beach, healing peptides Orange County, recovery peptides, immune support peptides, growth hormone peptides, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/peptide-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="Peptide Therapy | Healing, Recovery & Performance | Newport Beach" />
        <meta property="og:description" content="Advanced peptide therapy for healing, recovery, and optimization. Expert-guided protocols in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/peptide-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Peptide Therapy | Healing & Recovery | Newport Beach" />
        <meta name="twitter:description" content="Advanced peptide therapy for healing and recovery. Expert-guided protocols in Newport Beach." />
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
                "name": "Peptide Therapy",
                "description": "Advanced peptide therapy protocols for healing, recovery, immune support, and optimization. Personalized protocols tailored to your health goals.",
                "url": "https://www.range-medical.com/peptide-therapy",
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

      <div className="pep-page">
        {/* Hero */}
        <section className="pep-hero">
          <div className="pep-kicker">Recovery · Healing · Performance</div>
          <h1>Your Guide to Peptide Therapy</h1>
          <p className="pep-body-text">Everything you need to know about therapeutic peptides — what they are, how they work, and whether they're right for your goals.</p>
          <div className="pep-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">What Are Peptides</div>
              <h2>Small proteins with targeted effects.</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Peptides are short chains of amino acids — essentially small proteins that signal your body to do specific things. Different peptides trigger different responses: healing tissue, releasing growth hormone, reducing inflammation, or supporting immune function.
              </p>
              <p className="pep-body-text" style={{ marginTop: '1rem' }}>
                Unlike drugs that force a response, peptides work with your body's natural systems. At Range Medical in Newport Beach, we design personalized peptide protocols based on your specific goals — whether that's healing an injury, improving recovery, or optimizing performance.
              </p>
            </div>

            <div className="pep-stat-row">
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">2-4</div>
                <div className="pep-stat-label">Weeks to see results<br />with healing peptides</div>
              </div>
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">60+</div>
                <div className="pep-stat-label">Years of peptide research<br />in medical literature</div>
              </div>
              <div className="pep-stat-item pep-animate">
                <div className="pep-stat-number">6</div>
                <div className="pep-stat-label">Treatment areas<br />we address with peptides</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="pep-section pep-section-inverted">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">Who It's For</div>
              <h2>For people who want to heal and perform better.</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Peptides aren't just for athletes or biohackers. If any of these sound familiar, peptide therapy at our Newport Beach clinic might help.
              </p>
            </div>

            <div className="pep-tags-grid pep-animate">
              {tags.map((tag, i) => (
                <div key={i} className="pep-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Treatment Areas */}
        <section className="pep-section">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">What We Treat</div>
              <h2>Conditions that respond well to peptide therapy.</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Different peptides target different issues. Tell us what you're dealing with, and we'll design a protocol tailored to your needs.
              </p>
            </div>

            <div className="pep-peptides-grid">
              {treatmentAreas.map((area, i) => (
                <div key={i} className="pep-peptide-card pep-animate">
                  {area.highlight && <div className="pep-peptide-badge">{area.highlight}</div>}
                  <div className="pep-peptide-category">{area.category}</div>
                  <div className="pep-peptide-name">{area.name}</div>
                  <div className="pep-peptide-desc">{area.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">How Peptides May Help</div>
              <h2>Targeted support for your body.</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Different peptides support different goals. Here are the main ways peptide therapy could help.
              </p>
            </div>

            <div className="pep-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="pep-benefit-card pep-animate">
                  <div className="pep-benefit-number">{benefit.number}</div>
                  <div className="pep-benefit-title">{benefit.title}</div>
                  <div className="pep-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="pep-section" id="pep-research">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">Backed by Science</div>
              <h2>What the Research Says</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Peptides have been studied extensively in medical research. Here's what the science shows.
              </p>
            </div>

            <div className="pep-research-grid">
              {researchStudies.map((study, i) => (
                <div key={i} className="pep-research-card pep-animate">
                  <div className="pep-research-category">{study.category}</div>
                  <h3 className="pep-research-headline">{study.headline}</h3>
                  <p className="pep-research-summary">{study.summary}</p>
                  <p className="pep-research-source">{study.source}</p>
                </div>
              ))}
            </div>

            <p className="pep-research-disclaimer pep-animate">
              These studies reflect research findings. Individual results may vary. Peptide therapy at Range Medical is provided under medical supervision with proper monitoring.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="pep-section pep-section-alt">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">Getting Started</div>
              <h2>Your first visit, step by step.</h2>
              <div className="pep-divider"></div>
              <p className="pep-body-text">
                Getting started with peptides is straightforward. Here's exactly what happens at our Newport Beach clinic.
              </p>
            </div>

            <div className="pep-expect-list">
              {steps.map((item, i) => (
                <div key={i} className="pep-expect-item pep-animate">
                  <div className="pep-expect-step">{item.step}</div>
                  <div className="pep-expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pep-section pep-section-inverted">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker">Common Questions</div>
              <h2>Everything you might be wondering.</h2>
              <div className="pep-divider"></div>
            </div>

            <div className="pep-faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`pep-faq-item ${openFaq === i ? 'open' : ''}`}
                  onClick={() => toggleFaq(i)}
                >
                  <div className="pep-faq-question">
                    {faq.question}
                    <span className="pep-faq-toggle">+</span>
                  </div>
                  <div className="pep-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pep-section pep-section-inverted pep-cta-section">
          <div className="pep-container">
            <div className="pep-animate">
              <div className="pep-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="pep-cta-title">Ready to optimize your recovery?</h2>
              <p className="pep-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a $199 Range Assessment. We'll discuss your goals and design a peptide protocol for your situation. Our Newport Beach team is here to help.
              </p>
              <div className="pep-cta-buttons">
                <Link href="/book?reason=injury" className="pep-btn-primary">Book Your Assessment</Link>
                <div className="pep-cta-or">or</div>
                <a href="tel:9499973988" className="pep-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== PEPTIDE PAGE SCOPED STYLES ===== */
        .pep-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .pep-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.pep-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .pep-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .pep-section {
          padding: 4rem 1.5rem;
        }

        .pep-section-alt {
          background: #fafafa;
        }

        .pep-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .pep-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .pep-section-inverted .pep-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .pep-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .pep-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .pep-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .pep-section-inverted h1,
        .pep-section-inverted h2,
        .pep-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .pep-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .pep-section-inverted .pep-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .pep-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .pep-section-inverted .pep-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .pep-btn-primary {
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

        .pep-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .pep-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pep-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .pep-hero .pep-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .pep-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
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
          gap: 2rem;
          margin-top: 3rem;
        }

        .pep-stat-item {
          text-align: center;
        }

        .pep-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .pep-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .pep-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .pep-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .pep-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Peptide Cards */
        .pep-peptides-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .pep-peptide-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .pep-peptide-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .pep-peptide-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          background: #0891b2;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
        }

        .pep-peptide-category {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0891b2;
          margin-bottom: 0.5rem;
        }

        .pep-peptide-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .pep-peptide-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Benefit Cards */
        .pep-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .pep-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pep-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .pep-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .pep-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .pep-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .pep-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .pep-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pep-research-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .pep-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0891b2;
          margin-bottom: 0.875rem;
        }

        .pep-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .pep-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .pep-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .pep-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Expect List */
        .pep-expect-list {
          margin-top: 2.5rem;
        }

        .pep-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .pep-expect-item:last-child {
          border-bottom: none;
        }

        .pep-expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .pep-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .pep-expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .pep-faq-list {
          margin-top: 2.5rem;
        }

        .pep-faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }

        .pep-faq-item:last-child {
          border-bottom: none;
        }

        .pep-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .pep-faq-toggle {
          font-size: 1.25rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .pep-faq-item.open .pep-faq-toggle {
          transform: rotate(45deg);
        }

        .pep-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }

        .pep-faq-item.open .pep-faq-answer {
          max-height: 300px;
          padding-top: 1rem;
          opacity: 1;
        }

        .pep-faq-answer p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.8;
        }

        .pep-faq-item.open .pep-faq-question {
          color: #ffffff;
        }

        /* CTA Section */
        .pep-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .pep-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .pep-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .pep-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
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
        @media (max-width: 768px) {
          .pep-section {
            padding: 3rem 1.5rem;
          }

          .pep-page h1 {
            font-size: 2rem;
          }

          .pep-page h2 {
            font-size: 1.5rem;
          }

          .pep-hero {
            padding: 3rem 1.5rem;
          }

          .pep-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .pep-peptides-grid {
            grid-template-columns: 1fr;
          }

          .pep-benefits-grid {
            grid-template-columns: 1fr;
          }

          .pep-research-grid {
            grid-template-columns: 1fr;
          }

          .pep-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .pep-cta-title {
            font-size: 2rem;
          }

          .pep-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
