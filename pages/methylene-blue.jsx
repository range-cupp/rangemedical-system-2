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
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="mb-page">
        {/* Hero */}
        <section className="mb-hero">
          <div className="mb-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> Cellular Energy + Mood Support</div>
            <h1>Your Brain Uses More Energy Than Any Part of Your Body. What Happens When It Runs Low?</h1>
            <div className="mb-hero-rule" />
            <p className="mb-hero-sub">
              Methylene blue helps your cells make more energy, keeps your mood chemicals working longer, and cleans up the damage that slows you down.
            </p>
            <a href={SMS_LINK} className="btn-primary">Text Us to Learn More</a>
            <p className="mb-hero-note">No cost to ask. No commitment.</p>
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-section mb-section-alt">
          <div className="mb-container">
            <div className="mb-animate">
              <div className="v2-label"><span className="v2-dot" /> The Problem</div>
              <h2>Why You Feel Tired, Flat, and Off by 2pm</h2>
              <p className="mb-section-body">
                It's not about sleep. It's not about willpower. It starts inside your cells.
              </p>
            </div>

            <div className="mb-cards-grid mb-animate">
              <div className="mb-card">
                <span className="mb-card-num">01</span>
                <h3>Your Cellular Engines Slow Down</h3>
                <p>Your cells have tiny engines that turn food into energy. When those engines slow down, your brain feels it first — fog, flat mood, no drive.</p>
              </div>
              <div className="mb-card">
                <span className="mb-card-num">02</span>
                <h3>Your Mood Chemicals Break Down Too Fast</h3>
                <p>Your body breaks down serotonin and dopamine — the chemicals that make you feel good. When it breaks them down too fast, your mood drops before your day is even over.</p>
              </div>
              <div className="mb-card">
                <span className="mb-card-num">03</span>
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
              <div className="v2-label"><span className="v2-dot" /> How It Helps</div>
              <h2>Methylene Blue Fixes Three Problems at Once</h2>
              <p className="mb-section-body">
                It doesn't cover up symptoms. It works at the cell level where the problem starts.
              </p>
            </div>

            <div className="mb-cards-grid mb-animate">
              <div className="mb-card">
                <span className="mb-card-num">01</span>
                <h3>Keeps Your Energy Line Moving</h3>
                <p>Your cells have an assembly line that makes energy. When it gets backed up, less fuel gets made and your brain feels it first. Methylene blue clears the backup and keeps the power flowing.</p>
              </div>
              <div className="mb-card">
                <span className="mb-card-num">02</span>
                <h3>Protects Your Happy Chemicals</h3>
                <p>Your body has something that breaks down serotonin and dopamine — the chemicals that control your mood. It breaks them down too fast. Methylene blue slows that process so they stay active longer.</p>
              </div>
              <div className="mb-card">
                <span className="mb-card-num">03</span>
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
              <div className="v2-label"><span className="v2-dot" /> What It Is</div>
              <h2>Methylene Blue Is Not New. It's Just Been Forgotten.</h2>
              <p className="mb-section-body">
                Methylene blue is one of the oldest compounds in modern medicine. It was first made in 1876. Doctors have used it safely for over a century.
              </p>
              <p className="mb-section-body" style={{ marginTop: '1rem' }}>
                It works because of a simple property — it can give and receive electrons inside your cells. That means it can step in when your cellular engines get stuck and keep things running.
              </p>
              <p className="mb-section-body" style={{ marginTop: '1rem' }}>
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
              <div className="v2-label"><span className="v2-dot" /> How to Get It</div>
              <h2>Methylene Blue Options</h2>
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
                <a href={SMS_LINK} className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Text Us to Order</a>
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
                <a href={SMS_LINK} className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Text Us to Order</a>
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
                <a href={SMS_LINK} className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Ask About IV</a>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Warning */}
        <section className="mb-section mb-section-alt">
          <div className="mb-container">
            <div className="mb-safety-box mb-animate">
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
              <div className="v2-label"><span className="v2-dot" /> Questions</div>
              <h2>Common Questions</h2>
            </div>

            <div className="mb-faq-list mb-animate">
              {faqs.map((faq, index) => (
                <div key={index} className="mb-faq-item">
                  <button className="mb-faq-q" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="mb-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="mb-faq-a">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <div className="container">
            <h2>Want to Know If Methylene<br />Blue Is Right for You?</h2>
            <div className="cta-rule" />
            <p>Text us. We'll answer your questions and help you decide.</p>
            <div className="mb-cta-buttons">
              <a href={SMS_LINK} className="btn-white">Text Us: (949) 997-3988</a>
              <div className="mb-cta-or">or</div>
              <a href="tel:9499973988" className="mb-cta-phone">Call Us</a>
            </div>
            <p className="cta-location">Range Medical &bull; 1901 Westcliff Dr, Newport Beach</p>
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
          color: #1a1a1a;
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
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Sections */
        .mb-section {
          padding: 6rem 2rem;
        }

        .mb-section-alt {
          background: #fafafa;
        }

        .mb-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        .mb-section-inverted h1,
        .mb-section-inverted h2,
        .mb-section-inverted h3 {
          color: #ffffff;
        }

        /* Headlines */
        .mb-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          text-transform: uppercase;
        }

        .mb-page h2 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          text-transform: uppercase;
          margin: 0 0 1.5rem;
        }

        .mb-page h3 {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
        }

        /* Section Body */
        .mb-section-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 480px;
          margin: 0 0 3rem;
        }

        /* ── HERO ── */
        .mb-hero {
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .mb-hero-inner {
          max-width: 800px;
        }

        .mb-hero h1 {
          margin: 0 0 2rem;
        }

        .mb-hero-rule {
          width: 100%;
          max-width: 600px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 2rem;
        }

        .mb-hero-sub {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 520px;
          margin: 0 0 2.5rem;
        }

        .mb-hero-note {
          font-size: 13px;
          color: #737373;
          margin-top: 1rem;
          margin-bottom: 0;
        }

        /* ── CARDS GRID ── */
        .mb-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
          margin-top: 0;
        }

        .mb-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }

        .mb-card:nth-child(3n) {
          border-right: none;
        }

        .mb-card-num {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .mb-card h3 {
          margin-bottom: 0.75rem;
        }

        .mb-card p {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }

        /* Energy Bar Visual */
        .mb-energy-visual {
          margin-top: 3rem;
          padding: 2rem;
          border: 1px solid #e0e0e0;
        }

        .mb-energy-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
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
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

        .mb-energy-bar-fill {
          width: 100%;
          transition: height 1s ease;
        }

        .mb-energy-time {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .mb-energy-level {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Stat Row */
        .mb-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-top: 3rem;
          border-top: 1px solid #e0e0e0;
        }

        .mb-stat-item {
          text-align: center;
          padding: 2rem 1rem;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        .mb-stat-item:last-child {
          border-right: none;
        }

        .mb-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
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

        /* ── OPTIONS GRID ── */
        .mb-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .mb-option-card {
          position: relative;
          padding: 2.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
        }

        .mb-option-card:last-child {
          border-right: none;
        }

        .mb-option-featured {
          border: 2px solid #1a1a1a;
        }

        .mb-option-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: #1a1a1a;
          color: #ffffff;
          margin-bottom: 1rem;
          align-self: flex-start;
        }

        .mb-option-badge-outline {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid #e0e0e0;
          margin-bottom: 1rem;
          align-self: flex-start;
        }

        .mb-option-card h3 {
          margin-bottom: 0.75rem;
        }

        .mb-option-price {
          font-size: 2rem;
          font-weight: 900;
          color: #1a1a1a;
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
          color: #737373;
          padding: 0.5rem 0 0.5rem 1.25rem;
          position: relative;
          border-bottom: 1px solid #e0e0e0;
          line-height: 1.6;
        }

        .mb-option-details li:last-child {
          border-bottom: none;
        }

        .mb-option-details li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
          font-size: 0.75rem;
        }

        /* Safety Box */
        .mb-safety-box {
          max-width: 700px;
          padding: 2rem;
          border: 1px solid #e0e0e0;
        }

        .mb-safety-box h3 {
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .mb-safety-box p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #737373;
          margin: 0;
        }

        /* ── FAQ ── */
        .mb-faq-list {
          border-top: 1px solid #e0e0e0;
          max-width: 800px;
        }

        .mb-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .mb-faq-q {
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

        .mb-faq-toggle {
          font-size: 1.25rem;
          color: #a0a0a0;
          flex-shrink: 0;
        }

        .mb-faq-a {
          padding: 0 0 1.5rem;
        }

        .mb-faq-a p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          margin: 0;
        }

        /* ── CTA ── */
        .mb-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .mb-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
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

        /* Disclaimer */
        .mb-disclaimer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }

        .mb-disclaimer p {
          font-size: 0.75rem;
          color: #a3a3a3;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .mb-cards-grid {
            grid-template-columns: 1fr;
          }

          .mb-card {
            border-right: none;
          }

          .mb-stat-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .mb-stat-item:nth-child(2) {
            border-right: none;
          }

          .mb-options-grid {
            grid-template-columns: 1fr;
          }

          .mb-option-card {
            border-right: none;
          }
        }

        @media (max-width: 640px) {
          .mb-hero {
            padding: 4rem 1.5rem 5rem;
          }

          .mb-section {
            padding: 4rem 1.5rem;
          }

          .mb-energy-bars {
            gap: 1.5rem;
          }

          .mb-energy-bar-track {
            width: 40px;
            height: 90px;
          }

          .mb-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
