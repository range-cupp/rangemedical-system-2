// pages/injection-therapy.jsx
// Injection Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function InjectionTherapy() {
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

    const elements = document.querySelectorAll('.inj-page .inj-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const standardInjections = [
    { name: 'B12 (Methylcobalamin)', benefit: 'Energy, mood, nerve health', price: '$35' },
    { name: 'B-Complex', benefit: 'Energy, metabolism, brain function', price: '$35' },
    { name: 'Vitamin D3', benefit: 'Immune support, bone health, mood', price: '$35' },
    { name: 'Biotin', benefit: 'Hair, skin, nails', price: '$35' },
    { name: 'Amino Blend', benefit: 'Energy, muscle support', price: '$35' },
    { name: 'NAC', benefit: 'Antioxidant, liver support', price: '$35' },
    { name: 'BCAA', benefit: 'Muscle recovery, energy', price: '$35' },
  ];

  const premiumInjections = [
    { name: 'L-Carnitine', benefit: 'Fat metabolism, energy', price: '$50' },
    { name: 'Glutathione (200mg)', benefit: 'Antioxidant, skin brightening, detox', price: '$50' },
    { name: 'MIC-B12 (Skinny Shot)', benefit: 'Fat metabolism, liver support, energy', price: '$50' },
  ];

  const nadDoses = [
    { dose: '50mg', desc: 'Quick boost', price: '$25' },
    { dose: '75mg', desc: '', price: '$37.50' },
    { dose: '100mg', desc: 'Standard dose', price: '$50' },
    { dose: '125mg', desc: '', price: '$62.50' },
    { dose: '150mg', desc: 'Higher dose', price: '$75' },
  ];

  const benefits = [
    { number: '01', title: '100% Absorption', desc: 'Injections bypass the digestive system entirely, delivering nutrients directly to your bloodstream where your cells can use them immediately.' },
    { number: '02', title: 'Fast', desc: 'In and out in under 5 minutes. No IV line, no sitting in a chair for an hour. Walk in, get your shot, and go.' },
    { number: '03', title: 'Targeted', desc: 'Get exactly what your body needs. Choose a specific vitamin or mineral based on your symptoms, goals, or lab results.' },
    { number: '04', title: 'Great Between IVs', desc: 'Injections are a perfect way to maintain nutrient levels between IV sessions, keeping you feeling your best week to week.' },
    { number: '05', title: 'Affordable', desc: 'Starting at $35 per injection, it\'s one of the most cost-effective ways to support your health with medical-grade nutrients.' },
    { number: '06', title: 'No Appointment Needed', desc: 'Walk-ins welcome for established patients. New to Range? Start with a quick assessment or give us a call.' },
  ];

  const tags = [
    'Low Energy / Fatigue',
    'Weight Loss Support',
    'Athletic Recovery',
    'Immune Support',
    'Hair, Skin & Nail Health',
    'Anti-Aging & Cellular Health',
    'Detox & Liver Support',
    'Brain Fog',
  ];

  const faqs = [
    {
      question: 'Do I need an appointment?',
      answer: 'Walk-ins are welcome for established patients. New patients should start with a Range Assessment or call us to get set up first.'
    },
    {
      question: 'How long does an injection take?',
      answer: 'Under 5 minutes. Most injections are intramuscular \u2014 quick, simple, and done. No IV line needed.'
    },
    {
      question: 'How often should I get injections?',
      answer: 'It depends on the injection and your goals. Many patients come weekly or bi-weekly for maintenance. Your provider can recommend a schedule based on your labs and symptoms.'
    },
    {
      question: 'Are injections safe?',
      answer: 'Yes. All injections are administered by trained medical staff using pharmaceutical-grade nutrients. We screen every patient before treatment.'
    },
    {
      question: 'What\'s the difference between an injection and an IV?',
      answer: 'An injection is a quick intramuscular shot \u2014 in and out in minutes. An IV delivers a larger volume of fluids and nutrients over 30-60 minutes through an IV line. Both bypass digestion for full absorption.'
    },
    {
      question: 'Can I combine multiple injections?',
      answer: 'Yes. Many patients get 2-3 injections at once depending on their needs. Your provider can help you choose the right combination.'
    },
  ];

  return (
    <Layout
      title="Injection Therapy | Vitamin Injections | Newport Beach | Range Medical"
      description="Vitamin and nutrient injections in Newport Beach. B12, glutathione, NAD+, MIC-B12, and more. Walk-ins welcome. In and out in 5 minutes."
    >
      <Head>
        <meta name="keywords" content="injection therapy Newport Beach, vitamin injections Orange County, B12 injection, glutathione injection, NAD injection, MIC B12 skinny shot, vitamin shots, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/injection-therapy" />

        <meta property="og:title" content="Injection Therapy | Vitamin Injections | Newport Beach" />
        <meta property="og:description" content="Vitamin and nutrient injections in Newport Beach. B12, glutathione, NAD+, and more. Walk-ins welcome." />
        <meta property="og:url" content="https://www.range-medical.com/injection-therapy" />
        <meta property="og:image" content="https://www.range-medical.com/brand/range_logo_transparent_black.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Injection Therapy | Vitamin Injections | Newport Beach" />
        <meta name="twitter:description" content="Vitamin and nutrient injections. B12, glutathione, NAD+, and more. Walk-ins welcome." />
        <meta name="twitter:image" content="https://www.range-medical.com/brand/range_logo_transparent_black.png" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

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
                "image": "https://www.range-medical.com/brand/range_logo_transparent_black.png",
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
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "MedicalTherapy",
                "name": "Injection Therapy",
                "description": "Vitamin and nutrient injections delivering targeted nutrients directly to the bloodstream for rapid absorption. B12, glutathione, NAD+, and more.",
                "url": "https://www.range-medical.com/injection-therapy",
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
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Walk-ins Welcome</span>
        </div>
      </div>

      <div className="inj-page">
        {/* Hero */}
        <section className="inj-hero">
          <div className="v2-label"><span className="v2-dot" /> INJECTION THERAPY</div>
          <h1>SKIP THE IV. GET WHAT YOU NEED IN 5 MINUTES.</h1>
          <div className="inj-hero-rule" />
          <p className="inj-body-text">Targeted vitamin, nutrient, and NAD+ injections. No appointment hassle, no sitting in a chair for an hour. In and out. Newport Beach.</p>
          <div className="inj-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="inj-section inj-section-alt">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> What Is Injection Therapy</div>
              <h2>Skip the Gut.<br />Get Exactly What<br />You Need.</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                When you take vitamins orally, your body only absorbs a fraction. Injections deliver nutrients directly to your bloodstream &mdash; 100% absorption, zero guesswork.
              </p>
              <p className="inj-body-text" style={{ marginTop: '1rem' }}>
                At Range Medical in Newport Beach, we offer a full menu of vitamin and nutrient injections for energy, immune support, recovery, weight loss, and general wellness. Great on their own or between IVs for ongoing support.
              </p>
            </div>

            <div className="inj-stat-row">
              <div className="inj-stat-item inj-animate">
                <div className="inj-stat-number">100%</div>
                <div className="inj-stat-label">Bioavailability<br />bypasses digestion entirely</div>
              </div>
              <div className="inj-stat-item inj-animate">
                <div className="inj-stat-number">&lt;5</div>
                <div className="inj-stat-label">Minutes per injection<br />in and out, no IV needed</div>
              </div>
              <div className="inj-stat-item inj-animate">
                <div className="inj-stat-number">17+</div>
                <div className="inj-stat-label">Injection options<br />standard, premium &amp; NAD+</div>
              </div>
            </div>
          </div>
        </section>

        {/* Standard Injections — $35 */}
        <section className="inj-section">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> Standard Injections</div>
              <h2>Essential Vitamins<br />&amp; Nutrients &mdash;<br />$35 Each</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                Our core lineup of vitamin and nutrient injections. Targeted support for energy, immunity, recovery, and more.
              </p>
            </div>

            <div className="inj-menu-grid inj-animate">
              {standardInjections.map((item, i) => (
                <div key={i} className="inj-menu-card">
                  <div className="inj-menu-info">
                    <div className="inj-menu-name">{item.name}</div>
                    <div className="inj-menu-benefit">{item.benefit}</div>
                  </div>
                  <div className="inj-menu-price">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Injections — $50 */}
        <section className="inj-section inj-section-alt">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> Premium Injections</div>
              <h2>Specialty Formulas<br />&mdash; $50 Each</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                Advanced injections for fat metabolism, detox, and skin health. Higher-concentration formulas for targeted results.
              </p>
            </div>

            <div className="inj-menu-grid inj-menu-grid-premium inj-animate">
              {premiumInjections.map((item, i) => (
                <div key={i} className="inj-menu-card inj-menu-card-premium">
                  <div className="inj-menu-info">
                    <div className="inj-menu-name">{item.name}</div>
                    <div className="inj-menu-benefit">{item.benefit}</div>
                  </div>
                  <div className="inj-menu-price">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NAD+ Injections */}
        <section className="inj-section">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> NAD+ Injections</div>
              <h2>Cellular Energy<br />at Every Dose &mdash;<br />$0.50/mg</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                NAD+ supports cellular energy, DNA repair, and healthy aging. Choose a dose based on your goals &mdash; from a quick boost to a full therapeutic dose.
              </p>
            </div>

            <div className="inj-nad-grid inj-animate">
              {nadDoses.map((item, i) => (
                <div key={i} className="inj-nad-card">
                  <div className="inj-nad-dose">{item.dose}</div>
                  {item.desc && <div className="inj-nad-desc">{item.desc}</div>}
                  <div className="inj-nad-price">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="inj-section inj-section-alt">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> Save More</div>
              <h2>Injection<br />Packages</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                Buy in bulk and save. Our injection packages are designed for patients on weekly or bi-weekly protocols &mdash; take your injections home and stay on track.
              </p>
            </div>

            <div className="inj-packages-grid">
              <div className="inj-package-card inj-animate">
                <div className="inj-package-badge">Most Popular</div>
                <h3>Standard Injection Package</h3>
                <div className="inj-package-price">$350</div>
                <div className="inj-package-detail">12 injections for the price of 10</div>
                <ul className="inj-package-list">
                  <li>Any standard injection ($35 each)</li>
                  <li>Take home for self-administration</li>
                  <li>Monday / Wednesday / Friday protocol</li>
                  <li>Save $70</li>
                </ul>
              </div>

              <div className="inj-package-card inj-package-card-featured inj-animate">
                <div className="inj-package-badge inj-package-badge-featured">Specialty</div>
                <h3>NAD+ / Premium Package</h3>
                <div className="inj-package-price">$500</div>
                <div className="inj-package-detail">12 injections for the price of 10</div>
                <ul className="inj-package-list">
                  <li>NAD+ (100mg) or any premium injection ($50 each)</li>
                  <li>Take home for self-administration</li>
                  <li>Monday / Wednesday / Friday protocol</li>
                  <li>Save $100</li>
                </ul>
              </div>
            </div>

            <div className="inj-packages-note inj-animate">
              <p>Packages are great for ongoing protocols. Your provider will walk you through self-administration &mdash; it's easier than you think.</p>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="inj-section inj-section-inverted">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> Who It&apos;s For</div>
              <h2>Targeted Support<br />for Real Goals.</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                Whether you're looking for an energy boost, weight loss support, or just want to stay on top of your health &mdash; injections are a fast, affordable way to get what you need.
              </p>
            </div>

            <div className="inj-tags-grid inj-animate">
              {tags.map((tag, i) => (
                <div key={i} className="inj-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Injections */}
        <section className="inj-section inj-section-alt">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label"><span className="v2-dot" /> Why Injections</div>
              <h2>The Fastest Way<br />to Feel the<br />Difference.</h2>
              <div className="inj-divider"></div>
              <p className="inj-body-text">
                Injections aren't just convenient &mdash; they're one of the most effective ways to deliver nutrients to your body. Here's why.
              </p>
            </div>

            <div className="inj-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="inj-benefit-card inj-animate">
                  <div className="inj-benefit-number">{benefit.number}</div>
                  <div className="inj-benefit-title">{benefit.title}</div>
                  <div className="inj-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="inj-section-alt">
          <div className="inj-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Common<br />Questions</h2>

            <div className="inj-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`inj-faq-item ${openFaq === index ? 'inj-faq-open' : ''}`}>
                  <button className="inj-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="inj-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="inj-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="inj-section inj-section-inverted inj-cta-section">
          <div className="inj-container">
            <div className="inj-animate">
              <div className="v2-label" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}><span className="v2-dot" /> Next Steps</div>
              <h2 className="inj-cta-title">Ready to Feel<br />the Difference?</h2>
              <p className="inj-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Walk-ins welcome for established patients. New to Range? Start with a quick assessment to get set up. Our Newport Beach team is ready to help.
              </p>
              <div className="inj-cta-buttons">
                <Link href="/assessment" className="btn-white">Book Your Range Assessment</Link>
                <div className="inj-cta-or">or</div>
                <a href="tel:9499973988" className="inj-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== INJECTION PAGE SCOPED STYLES — V2 ===== */
        .inj-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        /* Animations */
        .inj-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.inj-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .inj-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .inj-section {
          padding: 6rem 2rem;
        }

        .inj-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .inj-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        .inj-section-inverted h2 {
          color: #ffffff;
        }

        .inj-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .inj-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.75;
          color: #737373;
          max-width: 600px;
        }

        .inj-section-inverted .inj-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .inj-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .inj-section-inverted .inj-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        .inj-section-inverted :global(.v2-label) {
          color: rgba(255, 255, 255, 0.45);
        }

        .inj-section-inverted :global(.v2-dot) {
          background: rgba(255, 255, 255, 0.45);
        }

        .inj-section-inverted p,
        .inj-section-inverted .inj-cta-section p {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Hero */
        .inj-hero {
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .inj-hero h1 {
          max-width: 800px;
          margin-bottom: 2rem;
        }

        .inj-hero-rule {
          width: 100%;
          max-width: 700px;
          height: 1px;
          background: #e0e0e0;
          margin: 2rem 0;
        }

        .inj-hero .inj-body-text {
          max-width: 520px;
        }

        .inj-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 3rem;
        }

        .inj-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: inj-bounce 2s ease-in-out infinite;
        }

        @keyframes inj-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .inj-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .inj-stat-item {
          text-align: center;
        }

        .inj-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .inj-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Injection Menu Grid */
        .inj-menu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          background: #fafafa;
        }

        .inj-menu-grid-premium {
          background: #ffffff;
        }

        .inj-menu-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.15s ease;
        }

        .inj-menu-card:last-child {
          border-bottom: none;
        }

        .inj-menu-card:hover {
          background: #fafafa;
        }

        .inj-menu-card-premium {
          background: #ffffff;
        }

        .inj-menu-card-premium:hover {
          background: #f5f5f5;
        }

        .inj-menu-info {
          flex: 1;
        }

        .inj-menu-name {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.125rem;
        }

        .inj-menu-benefit {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.4;
        }

        .inj-menu-price {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-left: 2rem;
          flex-shrink: 0;
        }

        /* NAD+ Grid */
        .inj-nad-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
        }

        .inj-nad-card {
          padding: 1.5rem 1rem;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          background: #fafafa;
          text-align: center;
          transition: background 0.2s ease;
        }

        .inj-nad-card:hover {
          background: #ffffff;
        }

        .inj-nad-dose {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .inj-nad-desc {
          font-size: 0.75rem;
          color: #737373;
          margin-bottom: 0.5rem;
          min-height: 1rem;
        }

        .inj-nad-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: #808080;
        }

        /* Packages */
        .inj-packages-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .inj-package-card {
          padding: 2.5rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .inj-package-card:last-child {
          border-right: none;
        }

        .inj-package-card:hover {
          background: #fafafa;
        }

        .inj-package-card-featured {
          border-left: 3px solid #808080;
        }

        .inj-package-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.375rem 0.75rem;
          background: #1a1a1a;
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .inj-package-badge-featured {
          background: #808080;
          color: #ffffff;
        }

        .inj-package-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .inj-package-price {
          font-size: 2.25rem;
          font-weight: 900;
          color: #1a1a1a;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .inj-package-detail {
          font-size: 0.875rem;
          color: #737373;
          margin-bottom: 1.5rem;
        }

        .inj-package-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .inj-package-list li {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          padding-left: 1.5rem;
          position: relative;
        }

        .inj-package-list li::before {
          content: '–';
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        .inj-packages-note {
          margin-top: 2rem;
          padding: 1.25rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          text-align: center;
        }

        .inj-packages-note p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* Tags */
        .inj-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .inj-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .inj-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Cards */
        .inj-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .inj-benefit-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .inj-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .inj-benefit-card:hover {
          background: #fafafa;
        }

        .inj-benefit-number {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 1rem;
        }

        .inj-benefit-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .inj-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.75;
          color: #737373;
        }

        /* FAQ */
        .inj-faq-list {
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .inj-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .inj-faq-item:last-child {
          border-bottom: none;
        }

        .inj-faq-question {
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

        .inj-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          padding-right: 1rem;
        }

        .inj-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
        }

        .inj-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .inj-faq-open .inj-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .inj-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          margin: 0;
        }

        /* CTA Section */
        .inj-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .inj-cta-title {
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .inj-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .inj-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .inj-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .inj-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .inj-section {
            padding: 4rem 1.5rem;
          }

          .inj-section-alt {
            padding: 4rem 1.5rem;
          }

          .inj-hero {
            padding: 4rem 1.5rem;
          }

          .inj-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .inj-nad-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .inj-packages-grid {
            grid-template-columns: 1fr;
          }

          .inj-package-card {
            border-right: none;
          }

          .inj-benefits-grid {
            grid-template-columns: 1fr;
          }

          .inj-benefit-card {
            border-right: none;
          }

          .inj-cta-buttons {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .inj-nad-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </Layout>
  );
}
