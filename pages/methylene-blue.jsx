// pages/methylene-blue.jsx
// Methylene Blue — Capsule + IV landing page
// Range Medical

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const SMS_LINK = 'sms:+19499973988?body=Hi%2C%20I%27m%20interested%20in%20Methylene%20Blue';

export default function MethyleneBlue() {
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

    const elements = document.querySelectorAll('.mb-page .mb-animate');
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
      question: "Why does it turn my pee blue?",
      answer: "That's normal. When your body absorbs methylene blue, the leftover gets filtered through your kidneys. The blue color just means it went through your system. It's harmless."
    },
    {
      question: "How long has methylene blue been around?",
      answer: "Over 140 years. It was first made in 1876. Doctors have used it for everything from treating infections to supporting brain health. It has one of the longest safety records in medicine."
    },
    {
      question: "Can I take it if I'm on other medications?",
      answer: "Methylene blue can interact with certain medications, especially SSRIs and other antidepressants that affect serotonin. Always talk to a provider before starting. Text us and we'll help you figure out if it's right for you."
    },
    {
      question: "How fast will I notice a difference?",
      answer: "Some people notice clearer thinking and better mood within the first few days. Everyone responds differently. Your provider will help you find the right approach for your body."
    },
    {
      question: "Is it safe?",
      answer: "At low doses, methylene blue has a well-established safety profile. Common side effects are mild — mostly the blue urine and occasionally a slight headache. Serious issues are rare and usually linked to very high doses or drug interactions. We review your full history before recommending anything."
    }
  ];

  const energyLevels = [
    { time: '7 AM', level: 90, color: '#22c55e', label: 'High' },
    { time: '11 AM', level: 60, color: '#eab308', label: 'Mid' },
    { time: '2 PM', level: 30, color: '#ef4444', label: 'Low' },
    { time: '5 PM', level: 15, color: '#dc2626', label: 'Very Low' },
  ];

  return (
    <Layout
      title="Methylene Blue | Cellular Energy + Mood Support | Range Medical | Newport Beach"
      description="Methylene blue in Newport Beach — capsules, Blu liquid dropper, and IV infusion. Supports cellular energy, mood, and brain function. Text us to learn more."
    >
      <Head>
        <meta name="keywords" content="methylene blue Newport Beach, methylene blue capsules, methylene blue IV, cellular energy, mood support, brain health, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/methylene-blue" />

        <meta property="og:title" content="Methylene Blue | Cellular Energy + Mood Support | Newport Beach" />
        <meta property="og:description" content="Methylene blue capsules for cellular energy, mood, and brain function. Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/methylene-blue" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Methylene Blue | Cellular Energy + Mood Support | Newport Beach" />
        <meta name="twitter:description" content="Methylene blue capsules in Newport Beach. Supports cellular energy, mood, and brain function." />
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
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Methylene Blue Capsule",
                "description": "25mg methylene blue capsule for cellular energy and mood support.",
                "brand": { "@type": "Brand", "name": "Range Medical" },
                "offers": {
                  "@type": "Offer",
                  "price": "197",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
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

      <div className="mb-page">
        {/* Hero */}
        <section className="mb-hero">
          <div className="mb-badge">Cellular Energy + Mood Support</div>
          <h1>Your Brain Uses More Energy Than Any Part of Your Body. What Happens When It Runs Low?</h1>
          <p className="mb-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
            Methylene blue helps your cells make more energy, keeps your mood chemicals working longer, and cleans up the damage that slows you down.
          </p>
          <a href={SMS_LINK} className="mb-btn-primary mb-btn-dark">Text Us to Learn More</a>
          <p className="mb-hero-note">No cost to ask. No commitment.</p>
          <div className="mb-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-section mb-section-alt">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">The Problem</div>
              <h2>Why You Feel Tired, Flat, and Off by 2pm</h2>
              <div className="mb-divider"></div>
              <p className="mb-body-text">
                It's not about sleep. It's not about willpower. It starts inside your cells.
              </p>
            </div>

            <div className="mb-problems-grid mb-animate">
              <div className="mb-problem-card">
                <div className="mb-problem-number">01</div>
                <h3>Your Cellular Engines Slow Down</h3>
                <p>Your cells have tiny engines that turn food into energy. When those engines slow down, your brain feels it first — fog, flat mood, no drive.</p>
              </div>
              <div className="mb-problem-card">
                <div className="mb-problem-number">02</div>
                <h3>Your Mood Chemicals Break Down Too Fast</h3>
                <p>Your body breaks down serotonin and dopamine — the chemicals that make you feel good. When it breaks them down too fast, your mood drops before your day is even over.</p>
              </div>
              <div className="mb-problem-card">
                <div className="mb-problem-number">03</div>
                <h3>Cellular Waste Piles Up</h3>
                <p>When your cells make energy, they also make waste. Too much waste damages your cells and slows everything down even more. It becomes a cycle.</p>
              </div>
            </div>

            {/* Energy Bar Visual */}
            <div className="mb-energy-visual mb-animate">
              <div className="mb-energy-label">Typical Energy Throughout the Day</div>
              <div className="mb-energy-bars">
                {energyLevels.map((e, i) => (
                  <div key={i} className="mb-energy-item">
                    <div className="mb-energy-bar-track">
                      <div
                        className="mb-energy-bar-fill"
                        style={{ height: `${e.level}%`, background: e.color }}
                      />
                    </div>
                    <div className="mb-energy-time">{e.time}</div>
                    <div className="mb-energy-level" style={{ color: e.color }}>{e.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Helps */}
        <section className="mb-section">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">How It Helps</div>
              <h2>Methylene Blue Fixes Three Problems at Once</h2>
              <div className="mb-divider"></div>
              <p className="mb-body-text">
                It doesn't cover up symptoms. It works at the cell level where the problem starts.
              </p>
            </div>

            <div className="mb-benefits-grid mb-animate">
              <div className="mb-benefit-card">
                <div className="mb-benefit-icon">⚡</div>
                <h3>Keeps Your Energy Line Moving</h3>
                <p>Your cells have an assembly line that makes energy. When it gets backed up, less fuel gets made and your brain feels it first. Methylene blue clears the backup and keeps the power flowing.</p>
              </div>
              <div className="mb-benefit-card">
                <div className="mb-benefit-icon">😊</div>
                <h3>Protects Your Happy Chemicals</h3>
                <p>Your body has something that breaks down serotonin and dopamine — the chemicals that control your mood. It breaks them down too fast. Methylene blue slows that process so they stay active longer.</p>
              </div>
              <div className="mb-benefit-card">
                <div className="mb-benefit-icon">🛡</div>
                <h3>Cleans Up Cellular Waste</h3>
                <p>When your cells make energy, they also make waste called free radicals. Too much waste damages your cells and makes everything worse. Methylene blue cleans it up before it causes problems.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What Is It */}
        <section className="mb-section mb-section-alt">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">What It Is</div>
              <h2>Methylene Blue Is Not New. It's Just Been Forgotten.</h2>
              <div className="mb-divider"></div>
              <p className="mb-body-text">
                Methylene blue is one of the oldest compounds in modern medicine. It was first made in 1876. Doctors have used it safely for over a century.
              </p>
              <p className="mb-body-text" style={{ marginTop: '1rem' }}>
                It works because of a simple property — it can give and receive electrons inside your cells. That means it can step in when your cellular engines get stuck and keep things running.
              </p>
              <p className="mb-body-text" style={{ marginTop: '1rem' }}>
                And yes — it turns your pee blue. That just means it's moving through your body. Completely normal.
              </p>
            </div>

            <div className="mb-stat-row mb-animate">
              <div className="mb-stat-item">
                <div className="mb-stat-number">140+</div>
                <div className="mb-stat-label">Years in Medicine</div>
              </div>
              <div className="mb-stat-item">
                <div className="mb-stat-number">3</div>
                <div className="mb-stat-label">Cellular Benefits</div>
              </div>
              <div className="mb-stat-item">
                <div className="mb-stat-number">25mg</div>
                <div className="mb-stat-label">Per Capsule</div>
              </div>
              <div className="mb-stat-item">
                <div className="mb-stat-number">Low</div>
                <div className="mb-stat-label">Side Effect Profile</div>
              </div>
            </div>
          </div>
        </section>

        {/* Analogy Card */}
        <section className="mb-section mb-section-inverted">
          <div className="mb-container">
            <div className="mb-analogy-card mb-animate">
              <p className="mb-analogy-text">
                Think of your cells like a car engine. Methylene blue does three things: it clears the exhaust, keeps the pistons firing, and makes sure fuel turns into power instead of smoke. When your engine runs clean, you feel it — better energy, better mood, better days.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-section">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">How to Get It</div>
              <h2>Methylene Blue Options</h2>
              <div className="mb-divider"></div>
            </div>

            <div className="mb-options-grid mb-animate">
              <div className="mb-option-card mb-option-featured">
                <div className="mb-option-badge">Capsule</div>
                <h3>Methylene Blue Capsule</h3>
                <div className="mb-option-price">$197</div>
                <ul className="mb-option-details">
                  <li>25mg per capsule</li>
                  <li>Take by mouth in the morning</li>
                  <li>Good for daily support</li>
                  <li>Easy to use at home</li>
                </ul>
                <a href={SMS_LINK} className="mb-btn-primary mb-btn-dark mb-btn-full">Text Us to Order</a>
              </div>
              <div className="mb-option-card">
                <div className="mb-option-badge-outline">Liquid</div>
                <h3>Blu — Methylene Blue Dropper</h3>
                <div className="mb-option-price">$197</div>
                <ul className="mb-option-details">
                  <li>Liquid dropper form</li>
                  <li>Easy to dose and adjust</li>
                  <li>Take by mouth in the morning</li>
                  <li>Good for daily support</li>
                </ul>
                <a href={SMS_LINK} className="mb-btn-primary mb-btn-dark mb-btn-full">Text Us to Order</a>
              </div>
              <div className="mb-option-card">
                <div className="mb-option-badge-outline">IV Infusion</div>
                <h3>Methylene Blue IV</h3>
                <div className="mb-option-price">$550</div>
                <ul className="mb-option-details">
                  <li>Pharmaceutical-grade MB</li>
                  <li>Mixed with high-dose Vitamin C + magnesium</li>
                  <li>Direct into bloodstream</li>
                  <li>Takes 30–45 minutes</li>
                  <li>Best for deeper support</li>
                </ul>
                <a href={SMS_LINK} className="mb-btn-primary mb-btn-dark mb-btn-full">Ask About IV</a>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Warning */}
        <section className="mb-section mb-section-alt">
          <div className="mb-container">
            <div className="mb-safety-box mb-animate">
              <div className="mb-safety-icon">⚠</div>
              <h3>Important Safety Note</h3>
              <p>
                Methylene blue acts as a monoamine oxidase inhibitor (MAO-A inhibitor). If you take SSRIs, SNRIs, or other serotonin-affecting medications, talk to a provider before using methylene blue. Text us and we screen for this before recommending anything.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-section">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">Questions</div>
              <h2>Common Questions</h2>
              <div className="mb-divider"></div>
            </div>

            <div className="mb-faq-list mb-animate">
              {faqs.map((faq, index) => (
                <div key={index} className={`mb-faq-item ${openFaq === index ? 'mb-faq-open' : ''}`}>
                  <button className="mb-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="mb-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-section mb-section-inverted mb-cta-section">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="mb-kicker">Next Step</div>
              <h2 className="mb-cta-title">Want to Know If Methylene Blue Is Right for You?</h2>
              <p className="mb-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Text us. We'll answer your questions and help you decide.
              </p>
              <div className="mb-cta-buttons">
                <a href={SMS_LINK} className="mb-btn-primary">Text Us: (949) 997-3988</a>
                <div className="mb-cta-or">or</div>
                <a href="tel:9499973988" className="mb-cta-phone">Call Us</a>
              </div>
              <p className="mb-cta-location">Range Medical · 1901 Westcliff Dr, Newport Beach</p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mb-disclaimer">
          <p>For education only. Not medical advice. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
        </div>
      </div>

      <style jsx>{`
        .mb-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .mb-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.mb-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .mb-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Sections */
        .mb-section {
          padding: 5rem 1.5rem;
        }

        .mb-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .mb-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        .mb-section-inverted .mb-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        .mb-section-inverted h1,
        .mb-section-inverted h2,
        .mb-section-inverted h3 {
          color: #ffffff;
        }

        .mb-section-inverted .mb-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        .mb-section-inverted .mb-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Kicker */
        .mb-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        /* Headlines */
        .mb-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #171717;
        }

        .mb-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .mb-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        /* Body Text */
        .mb-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        /* Divider */
        .mb-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        /* Buttons */
        .mb-btn-primary {
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

        .mb-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        .mb-btn-dark {
          background: #000000;
          color: #ffffff;
        }

        .mb-btn-dark:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
        }

        .mb-btn-full {
          display: block;
          text-align: center;
          width: 100%;
        }

        /* Hero */
        .mb-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mb-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.375rem 1rem;
          background: #000000;
          color: #ffffff;
          border-radius: 100px;
          margin-bottom: 1.5rem;
        }

        .mb-hero h1 {
          max-width: 720px;
          margin-bottom: 1.5rem;
        }

        .mb-hero-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          margin-bottom: 0;
        }

        .mb-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2.5rem;
        }

        .mb-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: mb-bounce 2s ease-in-out infinite;
        }

        @keyframes mb-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Problem Cards */
        .mb-problems-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .mb-problem-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .mb-problem-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .mb-problem-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .mb-problem-card h3 {
          margin-bottom: 0.75rem;
        }

        .mb-problem-card p {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin: 0;
        }

        /* Energy Bar Visual */
        .mb-energy-visual {
          margin-top: 3rem;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
        }

        .mb-energy-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .mb-energy-bars {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
        }

        .mb-energy-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .mb-energy-bar-track {
          width: 48px;
          height: 120px;
          background: #f5f5f5;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .mb-energy-bar-fill {
          width: 100%;
          border-radius: 8px;
          transition: height 1s ease;
        }

        .mb-energy-time {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #171717;
        }

        .mb-energy-level {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Benefits Grid */
        .mb-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .mb-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .mb-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .mb-benefit-icon {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .mb-benefit-card h3 {
          margin-bottom: 0.75rem;
        }

        .mb-benefit-card p {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin: 0;
        }

        /* Stat Row */
        .mb-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .mb-stat-item {
          text-align: center;
        }

        .mb-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .mb-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Analogy Card */
        .mb-analogy-card {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          padding: 3rem 2rem;
        }

        .mb-analogy-text {
          font-size: 1.125rem;
          font-weight: 400;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-style: italic;
        }

        /* Options Grid */
        .mb-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .mb-option-card {
          position: relative;
          padding: 2.5rem 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .mb-option-card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .mb-option-featured {
          border: 2px solid #000000;
        }

        .mb-option-featured:hover {
          border-color: #000000;
        }

        .mb-option-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: #000000;
          color: #ffffff;
          border-radius: 100px;
        }

        .mb-option-badge-outline {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: #ffffff;
          color: #171717;
          border: 1.5px solid #e5e5e5;
          border-radius: 100px;
        }

        .mb-option-card h3 {
          margin-bottom: 0.75rem;
        }

        .mb-option-price {
          font-size: 2rem;
          font-weight: 800;
          color: #171717;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .mb-option-details {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem;
          flex: 1;
        }

        .mb-option-details li {
          font-size: 0.875rem;
          color: #525252;
          padding: 0.5rem 0 0.5rem 1.25rem;
          position: relative;
          border-bottom: 1px solid #f5f5f5;
          line-height: 1.6;
        }

        .mb-option-details li:last-child {
          border-bottom: none;
        }

        .mb-option-details li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 700;
          font-size: 0.75rem;
        }

        /* Safety Box */
        .mb-safety-box {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem;
          border-radius: 12px;
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .mb-safety-icon {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .mb-safety-box h3 {
          color: #92400e;
          margin-bottom: 0.75rem;
        }

        .mb-safety-box p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #78350f;
          margin: 0;
        }

        /* FAQ */
        .mb-faq-list {
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .mb-faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .mb-faq-item:last-child {
          border-bottom: none;
        }

        .mb-faq-question {
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

        .mb-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .mb-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .mb-faq-open .mb-faq-question svg {
          transform: rotate(180deg);
        }

        .mb-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .mb-faq-open .mb-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .mb-faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .mb-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .mb-cta-section h2.mb-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .mb-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .mb-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .mb-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .mb-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        .mb-cta-location {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 2rem;
          margin-bottom: 0;
        }

        /* Disclaimer */
        .mb-disclaimer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .mb-disclaimer p {
          font-size: 0.75rem;
          color: #a3a3a3;
          line-height: 1.6;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .mb-page h1 {
            font-size: 2rem;
          }

          .mb-page h2 {
            font-size: 1.5rem;
          }

          .mb-hero {
            padding: 3rem 1.5rem;
          }

          .mb-section {
            padding: 3rem 1.5rem;
          }

          .mb-section-alt {
            padding: 3rem 1.5rem;
          }

          .mb-problems-grid {
            grid-template-columns: 1fr;
          }

          .mb-benefits-grid {
            grid-template-columns: 1fr;
          }

          .mb-stat-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .mb-options-grid {
            grid-template-columns: 1fr;
          }

          .mb-energy-bars {
            gap: 1.5rem;
          }

          .mb-energy-bar-track {
            width: 40px;
            height: 90px;
          }

          .mb-cta-section {
            padding: 4rem 1.5rem;
          }

          .mb-cta-title {
            font-size: 2rem;
          }

          .mb-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
