import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import CheckoutModal from '../components/CheckoutModal';

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
      answer: "No. We require an Assessment first so your provider can recommend the right panel for your goals and properly interpret your results. This ensures you get the most value from your lab work."
    },
    {
      question: "Is the blood draw done at your office?",
      answer: "We partner with local labs for your blood draw. We'll send you the order and you can go at your convenience. Results come directly to us for review."
    }
  ];

  const [expandedMarker, setExpandedMarker] = useState(null);

  const toggleMarker = (markerId) => {
    setExpandedMarker(expandedMarker === markerId ? null : markerId);
  };

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  const openCheckout = (panel) => {
    const gender = activeTab === 'men' ? 'Male' : 'Female';
    const configs = {
      essential: { name: `Essential Panel — ${gender}`, amountCents: 35000, amountLabel: '$350', serviceCategory: 'lab_panel', serviceName: `Lab Panel — Essential (${gender})` },
      elite: { name: `Elite Panel — ${gender}`, amountCents: 75000, amountLabel: '$750', serviceCategory: 'lab_panel', serviceName: `Lab Panel — Elite (${gender})` },
    };
    setCheckoutProduct(configs[panel]);
    setCheckoutOpen(true);
  };

  // Biomarker descriptions - what we're looking for and why
  const biomarkerInfo = {
    "Complete Metabolic Panel (CMP)": "Evaluates kidney and liver function, blood sugar, and electrolyte balance. Helps detect diabetes, kidney disease, and liver problems early.",
    "Lipid Panel": "Measures cholesterol and triglycerides. Essential for assessing cardiovascular risk and guiding heart health strategies.",
    "CBC with Differential": "Counts red cells, white cells, and platelets. Detects anemia, infection, immune issues, and blood disorders.",
    "Estradiol": "The primary estrogen hormone. In men, high levels can cause fatigue and weight gain. In women, it's key for reproductive and bone health.",
    "HbA1c": "Shows your average blood sugar over 3 months. The gold standard for detecting pre-diabetes and diabetes risk.",
    "Insulin, Fasting": "Reveals how well your body manages blood sugar. High fasting insulin is an early warning sign of metabolic dysfunction.",
    "PSA, Total": "Prostate-specific antigen screening. Important for monitoring prostate health and detecting issues early.",
    "SHBG": "Sex hormone binding globulin affects how much testosterone is available to your body. Key for understanding hormone balance.",
    "T3, Free": "The active thyroid hormone. Low T3 causes fatigue, weight gain, and brain fog even when TSH looks normal.",
    "T4, Total": "The main thyroid hormone your body converts to T3. Helps assess overall thyroid function.",
    "Testosterone, Free": "The testosterone actually available for your body to use. More clinically relevant than total testosterone alone.",
    "Testosterone, Total": "Your overall testosterone production. Low levels cause fatigue, low libido, muscle loss, and mood changes.",
    "TPO Antibodies": "Detects autoimmune thyroid disease (Hashimoto's). Often elevated years before thyroid numbers go abnormal.",
    "TSH": "Thyroid-stimulating hormone. The first-line thyroid test, but doesn't tell the whole story on its own.",
    "Vitamin D, 25-OH": "Critical for immune function, mood, bone health, and hormone production. Most people are deficient.",
    "Apolipoprotein A-1": "The protein in 'good' HDL cholesterol. Higher levels are protective against heart disease.",
    "Apolipoprotein B": "The protein in 'bad' LDL particles. A better predictor of heart disease risk than standard cholesterol.",
    "CRP-HS (Inflammation)": "High-sensitivity inflammation marker. Elevated CRP indicates systemic inflammation linked to heart disease and chronic illness.",
    "Cortisol": "Your primary stress hormone. Chronic high or low cortisol affects energy, sleep, weight, and immune function.",
    "DHEA-S": "A precursor hormone that declines with age. Supports energy, mood, immune function, and hormone balance.",
    "Ferritin": "Your iron storage protein. Low ferritin causes fatigue even when iron looks normal. High levels indicate inflammation.",
    "Folate": "Essential B-vitamin for DNA synthesis and methylation. Low levels linked to fatigue, mood issues, and heart disease.",
    "FSH": "Follicle-stimulating hormone. Helps assess fertility, menopause status, and pituitary function.",
    "GGT": "A sensitive liver enzyme. Elevated early in liver stress, alcohol use, or bile duct issues.",
    "Homocysteine": "An amino acid linked to heart disease and stroke when elevated. Also indicates B-vitamin status.",
    "IGF-1": "Insulin-like growth factor reflects growth hormone status. Important for metabolism, muscle, and longevity.",
    "Iron & TIBC": "Measures iron levels and binding capacity. Helps diagnose anemia and iron overload conditions.",
    "LH": "Luteinizing hormone. Works with FSH to regulate reproductive function and hormone production.",
    "Lipoprotein(a)": "A genetic cardiovascular risk factor. High Lp(a) significantly increases heart attack and stroke risk.",
    "Magnesium": "Essential mineral for 300+ body functions. Deficiency causes muscle cramps, anxiety, sleep issues, and fatigue.",
    "PSA, Free & Total": "More detailed prostate screening. The free-to-total ratio helps distinguish cancer from benign conditions.",
    "Sed Rate": "Erythrocyte sedimentation rate measures inflammation. Elevated in autoimmune conditions and infections.",
    "T4, Free": "The unbound, active form of T4. More accurate than total T4 for assessing thyroid function.",
    "Thyroglobulin Antibodies": "Another marker for autoimmune thyroid disease. Often tested alongside TPO antibodies.",
    "Uric Acid": "High levels cause gout and are linked to metabolic syndrome, kidney stones, and heart disease.",
    "Vitamin B-12": "Essential for energy, nerve function, and red blood cell production. Deficiency is common and often missed.",
    "Progesterone": "Balances estrogen and supports mood, sleep, and reproductive health. Important throughout the menstrual cycle.",
    "DHT": "Dihydrotestosterone, a potent androgen. Relevant for hair loss, acne, and hormone balance assessment."
  };

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
                "reviewCount": "10"
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
        <div className="trust-bar">
          <div className="trust-inner">
            <span className="trust-item">
              <span className="trust-rating">{'\u2605\u2605\u2605\u2605\u2605'}</span> 5.0 on Google
            </span>
            <span className="trust-item">Newport Beach, CA</span>
            <span className="trust-item">Licensed Providers</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> LABS &middot; TESTING &middot; INSIGHTS</div>
            <h1>YOUR GUIDE<br />TO LAB PANELS</h1>
            <div className="lp-hero-rule" />
            <p className="lp-hero-body">
              Standard bloodwork misses a lot. Our panels go deeper &mdash; hormones, metabolism,
              inflammation, and cardiovascular markers that tell you what&apos;s actually going on.
            </p>
            <div className="lp-hero-scroll">
              Scroll to explore
              <span>{'\u2193'}</span>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section id="lab-who" className={`lp-section-alt lab-animate ${isVisible['lab-who'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> WHO IT&apos;S FOR</div>
            <h2>WHEN TO GET TESTED</h2>
            <p className="lp-section-intro">
              Comprehensive labs give you answers that standard bloodwork misses.
            </p>

            <div className="lp-signs-grid">
              <div className="lp-sign-card">
                <div className="lp-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Tired All the Time</h4>
                <p>Fatigue that doesn&apos;t improve with sleep or rest.</p>
              </div>

              <div className="lp-sign-card">
                <div className="lp-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                  </svg>
                </div>
                <h4>&ldquo;Normal&rdquo; Labs, Still Off</h4>
                <p>Your doctor says you&apos;re fine, but you know something&apos;s wrong.</p>
              </div>

              <div className="lp-sign-card">
                <div className="lp-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Starting HRT</h4>
                <p>Get a baseline before hormone optimization.</p>
              </div>

              <div className="lp-sign-card">
                <div className="lp-sign-icon">
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
        <section id="lab-panels" className={`lp-section lab-animate ${isVisible['lab-panels'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> COMPARE PANELS</div>
            <h2>ESSENTIAL VS ELITE</h2>
            <p className="lp-section-intro">
              See exactly what&apos;s included in each panel.
            </p>

            {/* Gender Tabs */}
            <div className="lp-tabs">
              <button
                className={`lp-tab ${activeTab === 'men' ? 'lp-tab-active' : ''}`}
                onClick={() => setActiveTab('men')}
              >
                MEN&apos;S PANELS
              </button>
              <button
                className={`lp-tab ${activeTab === 'women' ? 'lp-tab-active' : ''}`}
                onClick={() => setActiveTab('women')}
              >
                WOMEN&apos;S PANELS
              </button>
            </div>

            {/* Comparison Chart */}
            <div className="lp-chart-wrapper">
              <div className="lp-chart">
                {/* Header */}
                <div className="lp-chart-header">
                  <div className="lp-chart-marker-col">Biomarker</div>
                  <div className="lp-chart-panel-col">
                    <span className="lp-chart-panel-name">Essential</span>
                    <span className="lp-chart-panel-price">$350</span>
                  </div>
                  <div className="lp-chart-panel-col lp-chart-panel-featured">
                    <span className="lp-chart-panel-name">Elite</span>
                    <span className="lp-chart-panel-price">$750</span>
                  </div>
                </div>

                {/* Instruction */}
                <div className="lp-chart-hint">
                  <span>Tap any biomarker to learn why we test it</span>
                </div>

                {/* Rows */}
                <div className="lp-chart-body">
                  {(activeTab === 'men' ? menEssential : womenEssential).map((marker, index) => (
                    <div key={index}>
                      <div
                        className={`lp-chart-row lp-chart-row-clickable ${expandedMarker === `essential-${index}` ? 'lp-chart-row-expanded' : ''}`}
                        onClick={() => toggleMarker(`essential-${index}`)}
                      >
                        <div className="lp-chart-marker-col">
                          <span className="lp-marker-name">{marker}</span>
                          <span className={`lp-marker-toggle ${expandedMarker === `essential-${index}` ? 'lp-marker-toggle-open' : ''}`}>
                            {expandedMarker === `essential-${index}` ? '\u2212' : '+'}
                          </span>
                        </div>
                        <div className="lp-chart-panel-col"><span className="lp-check">{'\u2713'}</span></div>
                        <div className="lp-chart-panel-col lp-chart-panel-featured"><span className="lp-check">{'\u2713'}</span></div>
                      </div>
                      {expandedMarker === `essential-${index}` && biomarkerInfo[marker] && (
                        <div className="lp-chart-description">
                          <p>{biomarkerInfo[marker]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(activeTab === 'men' ? menEliteExtra : womenEliteExtra).map((marker, index) => (
                    <div key={`elite-${index}`}>
                      <div
                        className={`lp-chart-row lp-chart-row-elite lp-chart-row-clickable ${expandedMarker === `elite-${index}` ? 'lp-chart-row-expanded' : ''}`}
                        onClick={() => toggleMarker(`elite-${index}`)}
                      >
                        <div className="lp-chart-marker-col">
                          <span className="lp-marker-name">{marker}</span>
                          <span className={`lp-marker-toggle ${expandedMarker === `elite-${index}` ? 'lp-marker-toggle-open' : ''}`}>
                            {expandedMarker === `elite-${index}` ? '\u2212' : '+'}
                          </span>
                        </div>
                        <div className="lp-chart-panel-col"><span className="lp-dash">&mdash;</span></div>
                        <div className="lp-chart-panel-col lp-chart-panel-featured"><span className="lp-check">{'\u2713'}</span></div>
                      </div>
                      {expandedMarker === `elite-${index}` && biomarkerInfo[marker] && (
                        <div className="lp-chart-description lp-chart-description-elite">
                          <p>{biomarkerInfo[marker]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer with CTAs */}
                <div className="lp-chart-footer">
                  <div className="lp-chart-marker-col"></div>
                  <div className="lp-chart-panel-col">
                    <button onClick={() => openCheckout('essential')} className="lp-btn-sm">
                      BOOK ESSENTIAL
                    </button>
                  </div>
                  <div className="lp-chart-panel-col lp-chart-panel-featured">
                    <button onClick={() => openCheckout('elite')} className="lp-btn-sm-white">
                      BOOK ELITE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Which Panel Section */}
        <section id="lab-which" className={`lp-section-alt lab-animate ${isVisible['lab-which'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> WHICH PANEL?</div>
            <h2>WHICH PANEL IS<br />RIGHT FOR YOU?</h2>

            <div className="lp-compare-grid">
              <div className="lp-compare-card">
                <div className="lp-compare-card-header">
                  <h4>ESSENTIAL PANEL</h4>
                  <div className="lp-compare-price">$350</div>
                  <div className="lp-compare-includes">Includes provider review visit</div>
                </div>
                <p className="lp-compare-desc">A great first step to understand your health &mdash; hormones, thyroid, blood sugar, and more.</p>
                <ul>
                  <li><span className="lp-list-dash">&ndash;</span> You want a solid baseline of key health markers</li>
                  <li><span className="lp-list-dash">&ndash;</span> You&apos;re checking in after lifestyle changes</li>
                  <li><span className="lp-list-dash">&ndash;</span> You&apos;re new to comprehensive testing</li>
                  <li><span className="lp-list-dash">&ndash;</span> You want to track hormones and metabolic health</li>
                  <li><span className="lp-list-dash">&ndash;</span> You&apos;re monitoring HRT</li>
                </ul>
                <button onClick={() => openCheckout('essential')} className="lp-btn-outline">
                  BOOK ESSENTIAL &mdash; $350
                </button>
              </div>
              <div className="lp-compare-card lp-compare-featured">
                <div className="lp-compare-badge">MOST COMPLETE</div>
                <div className="lp-compare-card-header">
                  <h4>ELITE PANEL</h4>
                  <div className="lp-compare-price">$750</div>
                  <div className="lp-compare-includes">Includes provider review visit</div>
                </div>
                <p className="lp-compare-desc">The full picture &mdash; heart health, inflammation, vitamins, and advanced markers that basic tests miss.</p>
                <ul>
                  <li><span className="lp-list-dash">&ndash;</span> You want the full picture of your health</li>
                  <li><span className="lp-list-dash">&ndash;</span> You&apos;re focused on longevity and optimization</li>
                  <li><span className="lp-list-dash">&ndash;</span> You have a family history of heart disease</li>
                  <li><span className="lp-list-dash">&ndash;</span> You want advanced cardiovascular markers</li>
                  <li><span className="lp-list-dash">&ndash;</span> You&apos;re serious about prevention</li>
                </ul>
                <button onClick={() => openCheckout('elite')} className="lp-btn">
                  BOOK ELITE &mdash; $750
                </button>
              </div>
            </div>
            <p className="lp-compare-note">
              Viewing {activeTab === 'men' ? "Men's" : "Women's"} panels.{' '}
              <button className="lp-compare-switch" onClick={() => setActiveTab(activeTab === 'men' ? 'women' : 'men')}>
                Switch to {activeTab === 'men' ? "Women's" : "Men's"}
              </button>
            </p>
          </div>
        </section>

        {/* Decision Guide Section */}
        <section id="lab-decide" className={`lp-section lab-animate ${isVisible['lab-decide'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> NOT SURE?</div>
            <h2>FIND YOUR PANEL<br />IN 10 SECONDS</h2>
            <p className="lp-section-intro">
              Tell us why you&apos;re here and we&apos;ll point you to the right panel.
            </p>

            <div className="lp-decide-grid">
              {[
                { scenario: "\u201cI want testosterone\u201d or \u201cI need HRT\u201d", panel: "essential", reason: "Covers total & free T, SHBG, estradiol, thyroid, and metabolic markers." },
                { scenario: "\u201cI want to lose weight\u201d or GLP-1", panel: "essential", reason: "Covers insulin, A1c, lipids, thyroid \u2014 everything needed to prescribe." },
                { scenario: "\u201cI just want to see where I\u2019m at\u201d", panel: "essential", reason: "Great starting point. You can always upgrade to Elite next time." },
                { scenario: "Family history of heart disease", panel: "elite", reason: "Apo B, Lp(a), and homocysteine are must-haves for hereditary risk." },
                { scenario: "\u201cI want the full longevity workup\u201d", panel: "elite", reason: "This IS the longevity workup \u2014 Apo B, Lp(a), CRP-HS, IGF-1, and minerals." },
                { scenario: "\u201cI\u2019m always tired and don\u2019t know why\u201d", panel: "elite", reason: "Could be hormones, thyroid, iron, B12, cortisol, or inflammation." },
                { scenario: "Interested in Apo B, Lp(a), or specific markers", panel: "elite", reason: "You\u2019ve done the research. Get the panel that includes what you came for." },
                { scenario: "Biohacker / optimization / longevity-focused", panel: "elite", reason: "Same workup that longevity specialists order." },
                { scenario: "\u201cWhat do you recommend?\u201d / Not sure yet", panel: "essential", reason: "Start with Essential. You can run Elite on follow-up if you want to go deeper." },
              ].map((item, i) => (
                <div key={i} className="lp-decide-row">
                  <div className="lp-decide-scenario">{item.scenario}</div>
                  <div className={`lp-decide-tag ${item.panel === 'elite' ? 'lp-decide-tag-elite' : ''}`}>
                    {item.panel === 'elite' ? 'ELITE' : 'ESSENTIAL'}
                  </div>
                  <div className="lp-decide-reason">{item.reason}</div>
                </div>
              ))}
            </div>

            <p className="lp-decide-note">
              Both panels qualify you for every treatment at Range Medical. The Essential gives you what you need; the Elite gives you the full picture.
            </p>
          </div>
        </section>

        {/* Key Markers Section */}
        <section id="lab-markers" className={`lp-section-alt lab-animate ${isVisible['lab-markers'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> ELITE MARKERS</div>
            <h2>THE THREE MARKERS<br />MOST DOCTORS MISS</h2>
            <p className="lp-section-intro">
              These are the markers longevity specialists consider essential &mdash; and they&apos;re only in the Elite panel.
            </p>

            <div className="lp-markers-grid">
              <div className="lp-marker-card">
                <div className="lp-marker-card-label">ELITE ONLY</div>
                <h4>Apolipoprotein B (Apo B)</h4>
                <p className="lp-marker-card-desc">
                  Counts the number of particles carrying cholesterol into your artery walls. A better predictor of heart disease than standard LDL cholesterol.
                </p>
                <div className="lp-marker-card-plain">
                  <span className="lp-marker-card-plain-label">In plain English</span>
                  &ldquo;How many trucks are delivering cholesterol to your arteries?&rdquo;
                </div>
              </div>

              <div className="lp-marker-card">
                <div className="lp-marker-card-label">ELITE ONLY</div>
                <h4>Lipoprotein(a) &mdash; Lp(a)</h4>
                <p className="lp-marker-card-desc">
                  A genetic cardiovascular risk factor you can&apos;t change with diet or exercise. The strongest independent predictor of heart attack and stroke.
                </p>
                <div className="lp-marker-card-plain">
                  <span className="lp-marker-card-plain-label">In plain English</span>
                  &ldquo;A genetic risk factor that can only be found with a blood test.&rdquo;
                </div>
              </div>

              <div className="lp-marker-card">
                <div className="lp-marker-card-label">ELITE ONLY</div>
                <h4>Apolipoprotein A-1 (Apo A)</h4>
                <p className="lp-marker-card-desc">
                  Measures your HDL function &mdash; your body&apos;s ability to remove cholesterol from artery walls. Higher levels are protective.
                </p>
                <div className="lp-marker-card-plain">
                  <span className="lp-marker-card-plain-label">In plain English</span>
                  &ldquo;How good is your body at cleaning up cholesterol?&rdquo;
                </div>
              </div>
            </div>

            <div className="lp-markers-cta">
              <button onClick={() => openCheckout('elite')} className="lp-btn">
                BOOK ELITE &mdash; $750
              </button>
              <p>Includes all Essential markers + 20 advanced biomarkers</p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="lab-process" className={`lp-section lab-animate ${isVisible['lab-process'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
            <h2>FROM ORDER<br />TO RESULTS</h2>

            <div className="lp-process-grid">
              <div className="lp-process-step">
                <div className="lp-process-number">01</div>
                <h4>Book or Call</h4>
                <p>Schedule an Assessment or call us directly to order your panel.</p>
              </div>

              <div className="lp-process-step">
                <div className="lp-process-number">02</div>
                <h4>Get Your Draw</h4>
                <p>Visit a local lab at your convenience. Fasting recommended.</p>
              </div>

              <div className="lp-process-step">
                <div className="lp-process-number">03</div>
                <h4>Results in 3&ndash;5 Days</h4>
                <p>We receive your results and review them in detail.</p>
              </div>

              <div className="lp-process-step">
                <div className="lp-process-number">04</div>
                <h4>Review Together</h4>
                <p>Your provider explains everything and builds your plan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="lab-faq" className={`lp-section-alt lab-animate ${isVisible['lab-faq'] ? 'lab-visible' : ''}`}>
          <div className="lp-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="lp-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`lp-faq-item ${openFaq === index ? 'lp-faq-open' : ''}`}>
                  <button className="lp-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="lp-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="lp-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="lp-section-inverted">
          <div className="lp-container">
            <div className="v2-label" style={{ justifyContent: 'center' }}><span className="v2-dot" style={{ background: '#808080' }} /> GET STARTED</div>
            <h2>READY TO SEE WHAT&apos;S<br />REALLY GOING ON?</h2>
            <p className="lp-cta-text">
              Book your panel below and we&apos;ll get you scheduled for your blood draw. Results in 3&ndash;5 business days.
            </p>
            <div className="lp-cta-buttons">
              <button onClick={() => openCheckout('essential')} className="lp-btn-white">
                ESSENTIAL &mdash; $350
              </button>
              <button onClick={() => openCheckout('elite')} className="lp-btn-white-outline">
                ELITE &mdash; $750
              </button>
            </div>
            <p className="lp-cta-phone">
              Or call <a href="tel:9499973988">(949) 997-3988</a> to schedule labs directly
            </p>
            <p className="lp-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>

        <style jsx>{`
          /* Hero */
          .lp-hero {
            padding: 6rem 2rem 5rem;
            text-align: left;
          }

          .lp-hero-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .lp-hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 900;
            color: #1a1a1a;
            line-height: 0.95;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1.5rem;
          }

          .lp-hero-rule {
            width: 60px;
            height: 1px;
            background: #e0e0e0;
            margin-bottom: 1.5rem;
          }

          .lp-hero-body {
            font-size: 1.0625rem;
            color: #737373;
            line-height: 1.7;
            max-width: 540px;
            margin: 0 0 2.5rem;
          }

          .lp-hero-scroll {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .lp-hero-scroll span {
            display: block;
            margin-top: 0.75rem;
            font-size: 1.125rem;
            animation: lp-bounce 2s ease-in-out infinite;
          }

          @keyframes lp-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }

          /* Buttons */
          .lp-btn {
            display: block;
            text-align: center;
            background: #1a1a1a;
            color: #ffffff;
            padding: 0.875rem 2rem;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
          }

          .lp-btn:hover {
            background: #333333;
          }

          .lp-btn-outline {
            display: block;
            text-align: center;
            background: #ffffff;
            color: #1a1a1a;
            padding: 0.875rem 2rem;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
            border: 1px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.2s;
          }

          .lp-btn-outline:hover {
            border-color: #1a1a1a;
          }

          :global(.lp-btn-sm),
          :global(.lp-btn-sm-white) {
            display: inline-block;
            padding: 0.5rem 1rem;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            font-family: inherit;
          }

          :global(.lp-btn-sm) {
            background: #1a1a1a;
            color: #ffffff;
            border: 1px solid #1a1a1a;
          }

          :global(.lp-btn-sm:hover) {
            background: #333333;
          }

          :global(.lp-btn-sm-white) {
            background: #ffffff;
            color: #1a1a1a;
            border: 1px solid #ffffff;
          }

          :global(.lp-btn-sm-white:hover) {
            background: #f0f0f0;
          }

          /* Sections */
          .lp-section {
            padding: 6rem 2rem;
            background: #ffffff;
          }

          .lp-section-alt {
            padding: 6rem 2rem;
            background: #fafafa;
          }

          .lp-section-inverted {
            padding: 6rem 2rem;
            background: #1a1a1a;
            text-align: center;
          }

          .lp-section-inverted h2 {
            color: #ffffff;
          }

          .lp-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .lp-section h2,
          .lp-section-alt h2 {
            font-size: 2.25rem;
            font-weight: 900;
            color: #1a1a1a;
            line-height: 0.95;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1.25rem;
          }

          .lp-section-intro {
            font-size: 1.0625rem;
            color: #737373;
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
          .lp-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .lp-sign-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s;
          }

          .lp-sign-card:hover {
            border-color: #1a1a1a;
          }

          .lp-sign-icon {
            width: 48px;
            height: 48px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: #737373;
          }

          .lp-sign-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .lp-sign-card p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Tabs */
          .lp-tabs {
            display: flex;
            justify-content: center;
            gap: 0;
            margin-bottom: 2rem;
          }

          .lp-tab {
            padding: 0.75rem 2rem;
            border: 1px solid #e0e0e0;
            background: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #737373;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
          }

          .lp-tab:first-child {
            border-right: none;
          }

          .lp-tab:hover {
            color: #1a1a1a;
          }

          .lp-tab-active {
            background: #1a1a1a;
            border-color: #1a1a1a;
            color: #ffffff;
          }

          /* Comparison Chart */
          .lp-chart-wrapper {
            max-width: 800px;
            margin: 0 auto;
            overflow-x: auto;
          }

          .lp-chart {
            min-width: 500px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            overflow: hidden;
          }

          .lp-chart-header {
            display: grid;
            grid-template-columns: 1fr 100px 100px;
            background: #fafafa;
            border-bottom: 1px solid #e0e0e0;
            font-weight: 600;
          }

          .lp-chart-header .lp-chart-marker-col {
            padding: 1.25rem 1.5rem;
            color: #1a1a1a;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .lp-chart-header .lp-chart-panel-col {
            padding: 1rem 0.5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }

          .lp-chart-panel-name {
            font-size: 0.9375rem;
            color: #1a1a1a;
            font-weight: 700;
          }

          .lp-chart-panel-price {
            font-size: 0.8125rem;
            color: #737373;
            font-weight: 500;
          }

          .lp-chart-header .lp-chart-panel-featured {
            background: #1a1a1a;
          }

          .lp-chart-header .lp-chart-panel-featured .lp-chart-panel-name,
          .lp-chart-header .lp-chart-panel-featured .lp-chart-panel-price {
            color: #ffffff;
          }

          .lp-chart-hint {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.625rem 1rem;
            background: #fafafa;
            border-bottom: 1px solid #e0e0e0;
            font-size: 0.75rem;
            color: #737373;
            letter-spacing: 0.02em;
          }

          .lp-chart-body {
            max-height: 600px;
            overflow-y: auto;
          }

          .lp-chart-row {
            display: grid;
            grid-template-columns: 1fr 100px 100px;
            border-bottom: 1px solid #f0f0f0;
          }

          .lp-chart-row-clickable {
            cursor: pointer;
            transition: background-color 0.15s ease;
          }

          .lp-chart-row-clickable:hover {
            background-color: #fafafa;
          }

          .lp-chart-row-elite.lp-chart-row-clickable:hover {
            background-color: #f5f5f5;
          }

          .lp-chart-row-expanded {
            background-color: #fafafa !important;
          }

          .lp-chart-row-elite.lp-chart-row-expanded {
            background-color: #f5f5f5 !important;
          }

          .lp-chart-row:last-child {
            border-bottom: none;
          }

          .lp-chart-row-elite {
            background: #fafafa;
          }

          .lp-chart-marker-col {
            padding: 0.875rem 1.5rem;
            font-size: 0.9375rem;
            color: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .lp-marker-name {
            flex: 1;
          }

          .lp-marker-toggle {
            color: #808080;
            font-size: 1.125rem;
            font-weight: 700;
            margin-left: 0.5rem;
            width: 20px;
            text-align: center;
            transition: color 0.2s;
          }

          .lp-marker-toggle-open {
            color: #1a1a1a;
          }

          .lp-chart-description {
            padding: 1rem 1.5rem;
            background: #fafafa;
            border-bottom: 1px solid #e0e0e0;
          }

          .lp-chart-description-elite {
            background: #f5f5f5;
          }

          .lp-chart-description p {
            margin: 0;
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.6;
          }

          .lp-chart-panel-col {
            padding: 0.875rem 0.5rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .lp-chart-row .lp-chart-panel-featured {
            background: rgba(0,0,0,0.02);
          }

          .lp-chart-row-elite .lp-chart-panel-featured {
            background: rgba(0,0,0,0.04);
          }

          .lp-check {
            color: #808080;
            font-size: 1.125rem;
            font-weight: 700;
          }

          .lp-dash {
            color: #e0e0e0;
            font-size: 1rem;
          }

          .lp-chart-footer {
            display: grid;
            grid-template-columns: 1fr 100px 100px;
            border-top: 1px solid #e0e0e0;
            background: #fafafa;
          }

          .lp-chart-footer .lp-chart-marker-col {
            padding: 1.25rem 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
          }

          .lp-chart-footer .lp-chart-panel-col {
            padding: 1.25rem 0.5rem;
            flex-direction: column;
            gap: 0.5rem;
          }

          .lp-chart-footer .lp-chart-panel-featured {
            background: #1a1a1a;
          }

          /* Compare Grid */
          .lp-compare-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .lp-compare-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 2rem;
            display: flex;
            flex-direction: column;
          }

          .lp-compare-card-header {
            text-align: center;
            margin-bottom: 1.25rem;
            padding-bottom: 1.25rem;
            border-bottom: 1px solid #e0e0e0;
          }

          .lp-compare-card h4 {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: #1a1a1a;
            margin-bottom: 0.75rem;
          }

          .lp-compare-price {
            font-size: 2.25rem;
            font-weight: 900;
            color: #808080;
            margin-bottom: 0.25rem;
          }

          .lp-compare-includes {
            font-size: 0.8125rem;
            color: #737373;
          }

          .lp-compare-desc {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .lp-compare-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 0.375rem 1rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .lp-compare-featured {
            position: relative;
            padding-top: 2.5rem;
            border-color: #1a1a1a;
          }

          .lp-compare-note {
            text-align: center;
            font-size: 0.875rem;
            color: #737373;
            margin-top: 1.5rem;
          }

          .lp-compare-switch {
            background: none;
            border: none;
            color: #1a1a1a;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            text-decoration: underline;
            font-family: inherit;
          }

          .lp-compare-switch:hover {
            color: #737373;
          }

          .lp-compare-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
            flex: 1;
            margin-bottom: 1.5rem;
          }

          .lp-compare-card li {
            font-size: 0.9375rem;
            color: #737373;
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
            line-height: 1.5;
          }

          .lp-list-dash {
            position: absolute;
            left: 0;
            color: #808080;
            font-weight: 700;
          }

          /* Process Grid */
          .lp-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .lp-process-step {
            text-align: center;
            padding: 1rem;
          }

          .lp-process-number {
            font-size: 2rem;
            font-weight: 900;
            color: #808080;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
          }

          .lp-process-step h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .lp-process-step p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* FAQ */
          .lp-faq-list {
            max-width: 700px;
            margin: 0 auto;
          }

          .lp-faq-item {
            border-bottom: 1px solid #e0e0e0;
          }

          .lp-faq-item:last-child {
            border-bottom: none;
          }

          .lp-faq-question {
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

          .lp-faq-question span:first-child {
            font-size: 1rem;
            font-weight: 600;
            color: #1a1a1a;
            padding-right: 1rem;
          }

          .lp-faq-toggle {
            flex-shrink: 0;
            color: #808080;
            font-size: 1.25rem;
            font-weight: 700;
            width: 24px;
            text-align: center;
          }

          .lp-faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
          }

          .lp-faq-open .lp-faq-answer {
            max-height: 300px;
            padding-bottom: 1.25rem;
          }

          .lp-faq-answer p {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.7;
            margin: 0;
          }

          /* CTA Section */
          .lp-section-inverted h2 {
            font-size: 2.25rem;
            font-weight: 900;
            line-height: 0.95;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0 0 1.25rem;
          }

          .lp-cta-text {
            font-size: 1.0625rem;
            color: rgba(255,255,255,0.5);
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.7;
          }

          .lp-cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 1rem;
          }

          :global(.lp-btn-white) {
            display: inline-block;
            background: #ffffff;
            color: #1a1a1a;
            padding: 0.875rem 2rem;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
          }

          :global(.lp-btn-white:hover) {
            background: #f0f0f0;
          }

          :global(.lp-btn-white-outline) {
            display: inline-block;
            background: transparent;
            color: #ffffff;
            padding: 0.875rem 2rem;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.2s;
            cursor: pointer;
          }

          :global(.lp-btn-white-outline:hover) {
            border-color: rgba(255, 255, 255, 0.7);
          }

          .lp-cta-phone {
            font-size: 0.9375rem;
            color: rgba(255,255,255,0.5);
            margin-top: 1rem;
          }

          .lp-cta-phone a {
            color: #ffffff;
            text-decoration: underline;
          }

          .lp-cta-location {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
            font-size: 0.875rem;
            color: rgba(255,255,255,0.4);
            letter-spacing: 0.05em;
          }

          /* Decision Guide */
          .lp-decide-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e0e0e0;
            background: #ffffff;
          }

          .lp-decide-row {
            display: grid;
            grid-template-columns: 1fr 80px 1fr;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.15s;
          }

          .lp-decide-row:last-child {
            border-bottom: none;
          }

          .lp-decide-row:hover {
            background: #fafafa;
          }

          .lp-decide-scenario {
            padding: 0.875rem 1.25rem;
            font-size: 0.9375rem;
            color: #1a1a1a;
            font-weight: 500;
          }

          .lp-decide-tag {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: #737373;
            padding: 0.25rem 0.5rem;
          }

          .lp-decide-tag-elite {
            color: #2E6B35;
          }

          .lp-decide-reason {
            padding: 0.875rem 1.25rem;
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            border-left: 1px solid #f0f0f0;
          }

          .lp-decide-note {
            max-width: 800px;
            margin: 1.5rem auto 0;
            text-align: center;
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.6;
            padding: 1.25rem;
            background: #fafafa;
            border: 1px solid #e0e0e0;
          }

          /* Key Markers */
          .lp-markers-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            max-width: 900px;
            margin: 0 auto;
          }

          .lp-marker-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 2rem 1.5rem;
            position: relative;
            transition: border-color 0.2s;
          }

          .lp-marker-card:hover {
            border-color: #2E6B35;
          }

          .lp-marker-card-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: #2E6B35;
            margin-bottom: 1rem;
          }

          .lp-marker-card h4 {
            font-size: 1.0625rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.75rem;
            line-height: 1.3;
          }

          .lp-marker-card-desc {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .lp-marker-card-plain {
            padding-top: 1rem;
            border-top: 1px solid #f0f0f0;
            font-size: 0.875rem;
            color: #1a1a1a;
            font-style: italic;
            line-height: 1.5;
          }

          .lp-marker-card-plain-label {
            display: block;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #737373;
            font-style: normal;
            margin-bottom: 0.375rem;
          }

          .lp-markers-cta {
            text-align: center;
            margin-top: 2.5rem;
          }

          .lp-markers-cta p {
            margin-top: 0.75rem;
            font-size: 0.875rem;
            color: #737373;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .lp-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .lp-compare-grid {
              grid-template-columns: 1fr;
            }

            .lp-process-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .lp-markers-grid {
              grid-template-columns: 1fr;
              max-width: 500px;
              margin: 0 auto;
            }

            .lp-decide-row {
              grid-template-columns: 1fr;
              gap: 0;
            }

            .lp-decide-scenario {
              padding: 0.875rem 1.25rem 0.25rem;
            }

            .lp-decide-tag {
              text-align: left;
              padding: 0.25rem 1.25rem;
            }

            .lp-decide-reason {
              border-left: none;
              border-top: none;
              padding: 0.25rem 1.25rem 0.875rem;
            }
          }

          @media (max-width: 640px) {
            .lp-hero {
              padding: 4rem 1.5rem 3rem;
            }

            .lp-hero h1 {
              font-size: 2.25rem;
            }

            .lp-section,
            .lp-section-alt,
            .lp-section-inverted {
              padding: 4rem 1.5rem;
            }

            .lp-section h2,
            .lp-section-alt h2,
            .lp-section-inverted h2 {
              font-size: 1.75rem;
            }

            .lp-signs-grid {
              grid-template-columns: 1fr;
            }

            .lp-tabs {
              flex-direction: column;
            }

            .lp-tab {
              width: 100%;
            }

            .lp-tab:first-child {
              border-right: 1px solid #e0e0e0;
              border-bottom: none;
            }

            .lp-chart-wrapper {
              margin: 0 -1rem;
              padding: 0 1rem;
            }

            .lp-chart-header,
            .lp-chart-row,
            .lp-chart-footer {
              grid-template-columns: 1fr 80px 80px;
            }

            .lp-chart-marker-col {
              padding: 0.75rem 1rem;
              font-size: 0.875rem;
            }

            .lp-chart-header .lp-chart-marker-col {
              padding: 1rem;
            }

            .lp-chart-panel-name {
              font-size: 0.8125rem;
            }

            .lp-chart-panel-price {
              font-size: 0.75rem;
            }

            .lp-chart-hint {
              font-size: 0.6875rem;
              padding: 0.5rem 0.75rem;
            }

            .lp-chart-description {
              padding: 0.875rem 1rem;
            }

            .lp-chart-description p {
              font-size: 0.8125rem;
            }

            .lp-process-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>

      {checkoutProduct && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productName={checkoutProduct.name}
          amountCents={checkoutProduct.amountCents}
          amountLabel={checkoutProduct.amountLabel}
          description={checkoutProduct.serviceName}
          serviceCategory={checkoutProduct.serviceCategory}
          serviceName={checkoutProduct.serviceName}
        />
      )}
    </>
  );
}
