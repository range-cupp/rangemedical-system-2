import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function LabPanels() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [activeTab, setActiveTab] = useState('men');

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

    const sections = document.querySelectorAll('.lab-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Do I need to fast before my lab work?",
      answer: "Yes, we recommend fasting for 10-12 hours before your blood draw for the most accurate results, especially for glucose, insulin, and lipid markers. Water is fine."
    },
    {
      question: "How long until I get my results?",
      answer: "Most results are available within 3-5 business days. Your provider will review them with you and explain what everything means in plain language."
    },
    {
      question: "What's the difference between Essential and Elite?",
      answer: "Essential covers core hormone, metabolic, and thyroid markers — great for a baseline or routine check. Elite adds advanced cardiovascular, inflammation, and longevity markers for a complete picture of your health."
    },
    {
      question: "Do I need a doctor's order?",
      answer: "We handle everything. Your provider will order the labs and review the results with you. No need to go through your primary care doctor."
    },
    {
      question: "Can I just order labs without an Assessment?",
      answer: "Yes. You can schedule labs directly by calling (949) 997-3988. However, we recommend starting with an Assessment so your provider can recommend the right panel for your goals."
    },
    {
      question: "Is the blood draw done at your office?",
      answer: "We partner with local labs for your blood draw. We'll send you the order and you can go at your convenience. Results come directly to us for review."
    }
  ];

  const menEssential = [
    "Complete Metabolic Panel (CMP)",
    "Lipid Panel",
    "CBC with Differential",
    "Estradiol",
    "HbA1c",
    "Insulin, Fasting",
    "PSA, Total",
    "SHBG",
    "T3, Free",
    "T4, Total",
    "Testosterone, Free",
    "Testosterone, Total",
    "TPO Antibodies",
    "TSH",
    "Vitamin D, 25-OH"
  ];

  const menEliteExtra = [
    "Apolipoprotein A-1",
    "Apolipoprotein B",
    "CRP-HS (Inflammation)",
    "Cortisol",
    "DHEA-S",
    "Ferritin",
    "Folate",
    "FSH",
    "GGT",
    "Homocysteine",
    "IGF-1",
    "Iron & TIBC",
    "LH",
    "Lipoprotein(a)",
    "Magnesium",
    "PSA, Free & Total",
    "Sed Rate",
    "T4, Free",
    "Thyroglobulin Antibodies",
    "Uric Acid",
    "Vitamin B-12"
  ];

  const womenEssential = [
    "Complete Metabolic Panel (CMP)",
    "Lipid Panel",
    "CBC with Differential",
    "Estradiol",
    "FSH",
    "LH",
    "HbA1c",
    "Insulin, Fasting",
    "Progesterone",
    "SHBG",
    "T3, Free",
    "T4, Total",
    "Testosterone, Free",
    "Testosterone, Total",
    "TPO Antibodies",
    "TSH",
    "Vitamin D, 25-OH"
  ];

  const womenEliteExtra = [
    "Apolipoprotein A-1",
    "Apolipoprotein B",
    "CRP-HS (Inflammation)",
    "Cortisol",
    "DHEA-S",
    "DHT",
    "Ferritin",
    "Folate",
    "GGT",
    "Homocysteine",
    "IGF-1",
    "Iron & TIBC",
    "Lipoprotein(a)",
    "Magnesium",
    "Sed Rate",
    "T4, Free",
    "Thyroglobulin Antibodies",
    "Uric Acid",
    "Vitamin B-12"
  ];

  return (
    <>
      <Head>
        <title>Your Guide to Lab Panels | Range Medical | Newport Beach</title>
        <meta name="description" content="Comprehensive lab testing in Newport Beach. Essential Panel $350, Elite Panel $750. Hormones, metabolic markers, cardiovascular, and longevity testing." />
        <meta name="keywords" content="lab panels Newport Beach, hormone testing, comprehensive blood work, metabolic panel, thyroid testing, cardiovascular markers, longevity labs" />
        <link rel="canonical" href="https://www.range-medical.com/lab-panels" />

        <meta property="og:title" content="Your Guide to Lab Panels | Range Medical" />
        <meta property="og:description" content="Comprehensive lab testing. Essential Panel $350, Elite Panel $750. Get the full picture of your health." />
        <meta property="og:url" content="https://www.range-medical.com/lab-panels" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-lab-panels.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to Lab Panels | Range Medical" />
        <meta name="twitter:description" content="Comprehensive lab testing. Essential Panel $350, Elite Panel $750." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-lab-panels.jpg" />

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
              "description": "Medical wellness clinic offering comprehensive lab testing and health optimization.",
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
              "@type": "MedicalTest",
              "name": "Comprehensive Lab Panels",
              "description": "Blood testing panels including hormone, metabolic, thyroid, and cardiovascular markers.",
              "usedToDiagnose": "Hormone imbalances, metabolic disorders, thyroid dysfunction, cardiovascular risk"
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
        <div className="lab-trust-bar">
          <div className="lab-trust-inner">
            <span className="lab-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>5.0 on Google</span>
            </span>
            <span className="lab-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Newport Beach, California</span>
            </span>
            <span className="lab-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Licensed Providers</span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="lab-hero">
          <div className="lab-hero-inner">
            <span className="lab-category">Diagnostics</span>
            <h1>Your Guide to Lab Panels</h1>
            <p className="lab-hero-sub">
              Standard bloodwork misses a lot. Our panels go deeper — hormones, metabolism,
              inflammation, and cardiovascular markers that tell you what's actually going on.
            </p>
            <div className="lab-hero-stats">
              <div className="lab-stat">
                <span className="lab-stat-value">$350</span>
                <span className="lab-stat-label">Essential Panel</span>
              </div>
              <div className="lab-stat">
                <span className="lab-stat-value">$750</span>
                <span className="lab-stat-label">Elite Panel</span>
              </div>
              <div className="lab-stat">
                <span className="lab-stat-value">40+</span>
                <span className="lab-stat-label">Biomarkers (Elite)</span>
              </div>
            </div>
            <div className="lab-hero-cta">
              <Link href="/book?reason=energy" className="lab-btn-primary">Book Assessment — $199</Link>
              <p className="lab-hero-note">Or call (949) 997-3988 to schedule labs directly</p>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section id="lab-who" className={`lab-section-alt lab-animate ${isVisible['lab-who'] ? 'lab-visible' : ''}`}>
          <div className="lab-container">
            <span className="lab-section-label">Who It's For</span>
            <h2>When to Get Tested</h2>
            <p className="lab-section-intro">
              Comprehensive labs give you answers that standard bloodwork misses.
            </p>

            <div className="lab-signs-grid">
              <div className="lab-sign-card">
                <div className="lab-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Tired All the Time</h4>
                <p>Fatigue that doesn't improve with sleep or rest.</p>
              </div>

              <div className="lab-sign-card">
                <div className="lab-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                  </svg>
                </div>
                <h4>"Normal" Labs, Still Off</h4>
                <p>Your doctor says you're fine, but you know something's wrong.</p>
              </div>

              <div className="lab-sign-card">
                <div className="lab-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Starting HRT</h4>
                <p>Get a baseline before hormone optimization.</p>
              </div>

              <div className="lab-sign-card">
                <div className="lab-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10"/>
                    <path d="M18 20V4"/>
                    <path d="M6 20v-4"/>
                  </svg>
                </div>
                <h4>Tracking Progress</h4>
                <p>Monitor how your body responds to treatment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Panels Comparison Section */}
        <section id="lab-panels" className={`lab-section lab-animate ${isVisible['lab-panels'] ? 'lab-visible' : ''}`}>
          <div className="lab-container">
            <span className="lab-section-label">Compare Panels</span>
            <h2>Essential vs Elite</h2>
            <p className="lab-section-intro">
              Choose the panel that matches your goals.
            </p>

            {/* Gender Tabs */}
            <div className="lab-tabs">
              <button
                className={`lab-tab ${activeTab === 'men' ? 'lab-tab-active' : ''}`}
                onClick={() => setActiveTab('men')}
              >
                Men's Panels
              </button>
              <button
                className={`lab-tab ${activeTab === 'women' ? 'lab-tab-active' : ''}`}
                onClick={() => setActiveTab('women')}
              >
                Women's Panels
              </button>
            </div>

            {/* Panels Grid */}
            <div className="lab-panels-grid">
              {/* Essential Panel */}
              <div className="lab-panel-card">
                <div className="lab-panel-header">
                  <h3>Essential Panel</h3>
                  <div className="lab-panel-price">$350</div>
                  <p className="lab-panel-desc">Core hormone, metabolic, and thyroid markers</p>
                </div>
                <div className="lab-panel-markers">
                  <h4>{activeTab === 'men' ? menEssential.length : womenEssential.length} Biomarkers</h4>
                  <ul>
                    {(activeTab === 'men' ? menEssential : womenEssential).map((marker, index) => (
                      <li key={index}>{marker}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/book?reason=energy" className="lab-btn-secondary">Book Essential — $350</Link>
              </div>

              {/* Elite Panel */}
              <div className="lab-panel-card lab-panel-featured">
                <div className="lab-panel-badge">Most Comprehensive</div>
                <div className="lab-panel-header">
                  <h3>Elite Panel</h3>
                  <div className="lab-panel-price">$750</div>
                  <p className="lab-panel-desc">Everything in Essential + advanced markers</p>
                </div>
                <div className="lab-panel-markers">
                  <h4>Everything in Essential, Plus:</h4>
                  <ul>
                    {(activeTab === 'men' ? menEliteExtra : womenEliteExtra).map((marker, index) => (
                      <li key={index}>{marker}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/book?reason=energy" className="lab-btn-primary-card">Book Elite — $750</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Which Panel Section */}
        <section id="lab-which" className={`lab-section-alt lab-animate ${isVisible['lab-which'] ? 'lab-visible' : ''}`}>
          <div className="lab-container">
            <span className="lab-section-label">Which Panel?</span>
            <h2>Which Panel Is Right For You?</h2>

            <div className="lab-compare-grid">
              <div className="lab-compare-card">
                <h4>Choose Essential If:</h4>
                <ul>
                  <li>You want a solid baseline of key health markers</li>
                  <li>You're checking in after lifestyle changes</li>
                  <li>You're new to comprehensive testing</li>
                  <li>You want to track hormones and metabolic health</li>
                  <li>You're monitoring HRT</li>
                </ul>
              </div>
              <div className="lab-compare-card lab-compare-featured">
                <h4>Choose Elite If:</h4>
                <ul>
                  <li>You want the full picture of your health</li>
                  <li>You're focused on longevity and optimization</li>
                  <li>You have a family history of heart disease</li>
                  <li>You want advanced cardiovascular markers</li>
                  <li>You're serious about prevention</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="lab-process" className={`lab-section lab-animate ${isVisible['lab-process'] ? 'lab-visible' : ''}`}>
          <div className="lab-container">
            <span className="lab-section-label">How It Works</span>
            <h2>From Order to Results</h2>

            <div className="lab-process-grid">
              <div className="lab-process-step">
                <div className="lab-process-number">1</div>
                <h4>Book or Call</h4>
                <p>Schedule an Assessment or call us directly to order your panel.</p>
              </div>

              <div className="lab-process-step">
                <div className="lab-process-number">2</div>
                <h4>Get Your Draw</h4>
                <p>Visit a local lab at your convenience. Fasting recommended.</p>
              </div>

              <div className="lab-process-step">
                <div className="lab-process-number">3</div>
                <h4>Results in 3-5 Days</h4>
                <p>We receive your results and review them in detail.</p>
              </div>

              <div className="lab-process-step">
                <div className="lab-process-number">4</div>
                <h4>Review Together</h4>
                <p>Your provider explains everything and builds your plan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="lab-faq" className={`lab-section-alt lab-animate ${isVisible['lab-faq'] ? 'lab-visible' : ''}`}>
          <div className="lab-container">
            <span className="lab-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="lab-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`lab-faq-item ${openFaq === index ? 'lab-faq-open' : ''}`}>
                  <button className="lab-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="lab-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="lab-section-inverted">
          <div className="lab-container">
            <span className="lab-section-label-light">Get Started</span>
            <h2>Ready to See What's Really Going On?</h2>
            <p className="lab-cta-text">
              Book an Assessment to discuss which panel is right for you, or call to order labs directly.
            </p>
            <div className="lab-cta-buttons">
              <Link href="/book?reason=energy" className="lab-btn-white">Book Assessment — $199</Link>
            </div>
            <p className="lab-cta-phone">
              Or call <a href="tel:9499973988">(949) 997-3988</a> to schedule labs directly
            </p>
            <p className="lab-cta-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Range Medical • 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>

        <style jsx>{`
          /* Trust Bar */
          .lab-trust-bar {
            background: #000000;
            padding: 1rem 1.5rem;
          }

          .lab-trust-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 2.5rem;
            flex-wrap: wrap;
          }

          .lab-trust-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #ffffff;
            font-weight: 500;
          }

          /* Hero Section */
          .lab-hero {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            padding: 5rem 1.5rem;
          }

          .lab-hero-inner {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .lab-category {
            display: inline-block;
            background: #0891b2;
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 0.375rem 0.875rem;
            border-radius: 100px;
            margin-bottom: 1.5rem;
          }

          .lab-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            margin: 0 0 1.25rem;
          }

          .lab-hero-sub {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            margin: 0 0 2.5rem;
            max-width: 650px;
            margin-left: auto;
            margin-right: auto;
          }

          .lab-hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-bottom: 2.5rem;
          }

          .lab-stat {
            text-align: center;
          }

          .lab-stat-value {
            display: block;
            font-size: 2.5rem;
            font-weight: 700;
            color: #171717;
            line-height: 1;
          }

          .lab-stat-label {
            font-size: 0.8125rem;
            color: #737373;
            margin-top: 0.375rem;
            display: block;
          }

          .lab-hero-cta {
            margin-bottom: 1rem;
          }

          .lab-hero-note {
            font-size: 0.875rem;
            color: #737373;
            margin-top: 1rem;
          }

          :global(.lab-btn-primary) {
            display: inline-block;
            background: #000000 !important;
            color: #ffffff !important;
            padding: 1rem 2.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
          }

          :global(.lab-btn-primary:hover) {
            background: #171717 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          /* Section Styles */
          .lab-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .lab-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .lab-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .lab-section-inverted h2 {
            color: #ffffff;
          }

          .lab-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .lab-section-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #0891b2;
            margin-bottom: 0.75rem;
          }

          .lab-section-label-light {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a3a3a3;
            margin-bottom: 0.75rem;
          }

          .lab-section h2,
          .lab-section-alt h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .lab-section-intro {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 600px;
            margin: 0 0 2.5rem;
          }

          /* Animation */
          .lab-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .lab-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Signs Grid */
          .lab-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .lab-sign-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .lab-sign-card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .lab-sign-icon {
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

          .lab-sign-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .lab-sign-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Tabs */
          .lab-tabs {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
          }

          .lab-tab {
            padding: 0.75rem 2rem;
            border: 2px solid #e5e5e5;
            background: #ffffff;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            color: #525252;
            cursor: pointer;
            transition: all 0.2s;
          }

          .lab-tab:hover {
            border-color: #d4d4d4;
          }

          .lab-tab-active {
            background: #000000;
            border-color: #000000;
            color: #ffffff;
          }

          /* Panels Grid */
          .lab-panels-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            max-width: 900px;
            margin: 0 auto;
          }

          .lab-panel-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 16px;
            padding: 2rem;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .lab-panel-featured {
            border: 2px solid #000000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }

          .lab-panel-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #000000;
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.375rem 1rem;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }

          .lab-panel-header {
            text-align: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e5e5e5;
          }

          .lab-panel-header h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #171717;
            margin-bottom: 0.5rem;
          }

          .lab-panel-price {
            font-size: 2.5rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 0.5rem;
          }

          .lab-panel-desc {
            font-size: 0.9375rem;
            color: #737373;
            margin: 0;
          }

          .lab-panel-markers {
            flex: 1;
            margin-bottom: 1.5rem;
          }

          .lab-panel-markers h4 {
            font-size: 0.8125rem;
            font-weight: 700;
            color: #0891b2;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .lab-panel-markers ul {
            list-style: none;
            padding: 0;
            margin: 0;
            columns: 1;
          }

          .lab-panel-markers li {
            font-size: 0.875rem;
            color: #404040;
            padding: 0.375rem 0;
            padding-left: 1.25rem;
            position: relative;
            line-height: 1.4;
          }

          .lab-panel-markers li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: 700;
            font-size: 0.75rem;
          }

          :global(.lab-btn-secondary) {
            display: block;
            text-align: center;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 1rem 1.5rem;
            border: 2px solid #000000;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
          }

          :global(.lab-btn-secondary:hover) {
            background: #000000 !important;
            color: #ffffff !important;
          }

          :global(.lab-btn-primary-card) {
            display: block;
            text-align: center;
            background: #000000 !important;
            color: #ffffff !important;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
          }

          :global(.lab-btn-primary-card:hover) {
            background: #171717 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          /* Compare Grid */
          .lab-compare-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .lab-compare-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
          }

          .lab-compare-featured {
            border: 2px solid #000000;
          }

          .lab-compare-card h4 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin-bottom: 1.25rem;
          }

          .lab-compare-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .lab-compare-card li {
            font-size: 0.9375rem;
            color: #404040;
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
            line-height: 1.5;
          }

          .lab-compare-card li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: 700;
          }

          /* Process Grid */
          .lab-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .lab-process-step {
            text-align: center;
            padding: 1rem;
          }

          .lab-process-number {
            width: 52px;
            height: 52px;
            background: #000000;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.25rem;
            margin: 0 auto 1rem;
          }

          .lab-process-step h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .lab-process-step p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* FAQ */
          .lab-faq-list {
            max-width: 700px;
            margin: 0 auto;
          }

          .lab-faq-item {
            border-bottom: 1px solid #e5e5e5;
          }

          .lab-faq-item:last-child {
            border-bottom: none;
          }

          .lab-faq-question {
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

          .lab-faq-question span {
            font-size: 1rem;
            font-weight: 600;
            color: #171717;
            padding-right: 1rem;
          }

          .lab-faq-question svg {
            flex-shrink: 0;
            color: #737373;
            transition: transform 0.2s;
          }

          .lab-faq-open .lab-faq-question svg {
            transform: rotate(180deg);
          }

          .lab-faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
          }

          .lab-faq-open .lab-faq-answer {
            max-height: 300px;
            padding-bottom: 1.25rem;
          }

          .lab-faq-answer p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* CTA Section */
          .lab-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.7;
          }

          .lab-cta-buttons {
            margin-bottom: 1rem;
          }

          :global(.lab-btn-white) {
            display: inline-block;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 1rem 2.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(255, 255, 255, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
          }

          :global(.lab-btn-white:hover) {
            background: #f0f0f0 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
          }

          .lab-cta-phone {
            font-size: 0.9375rem;
            color: #a3a3a3;
            margin-top: 1rem;
          }

          .lab-cta-phone a {
            color: #ffffff;
            text-decoration: underline;
          }

          .lab-cta-location {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
            font-size: 0.9375rem;
            color: #a3a3a3;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .lab-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .lab-panels-grid {
              grid-template-columns: 1fr;
            }

            .lab-panel-featured {
              order: -1;
            }

            .lab-compare-grid {
              grid-template-columns: 1fr;
            }

            .lab-process-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 640px) {
            .lab-trust-inner {
              flex-direction: column;
              gap: 0.5rem;
            }

            .lab-hero h1 {
              font-size: 2rem;
            }

            .lab-hero-stats {
              flex-direction: column;
              gap: 1.5rem;
            }

            .lab-section h2,
            .lab-section-alt h2,
            .lab-section-inverted h2 {
              font-size: 1.75rem;
            }

            .lab-signs-grid {
              grid-template-columns: 1fr;
            }

            .lab-tabs {
              flex-direction: column;
            }

            .lab-tab {
              width: 100%;
            }

            .lab-process-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
