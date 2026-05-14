import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LabPanels() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('men');
  const [expandedMarker, setExpandedMarker] = useState(null);

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
    const elements = document.querySelectorAll('.tx-page .tx-animate');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);
  const toggleMarker = (markerId) => setExpandedMarker(expandedMarker === markerId ? null : markerId);

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

  const bundleComposition = {
    "Complete Metabolic Panel (CMP)": {
      count: 17,
      tagline: "Liver, kidneys, blood sugar, electrolytes, proteins",
      groups: [
        { label: "Blood sugar", markers: "Glucose" },
        { label: "Kidney function", markers: "BUN · Creatinine · eGFR" },
        { label: "Electrolytes", markers: "Sodium · Potassium · Chloride · CO2 · Calcium" },
        { label: "Proteins", markers: "Total Protein · Albumin · Globulin · A/G Ratio" },
        { label: "Liver enzymes", markers: "AST · ALT · ALP · Total Bilirubin" },
      ],
    },
    "Lipid Panel": {
      count: 6,
      tagline: "Cholesterol & heart disease risk",
      groups: [
        { label: "Cholesterol", markers: "Total · HDL · LDL · Non-HDL" },
        { label: "Triglycerides & ratios", markers: "Triglycerides · Total/HDL Ratio" },
      ],
    },
    "CBC with Differential": {
      count: 20,
      tagline: "Blood cells, anemia, immune function",
      groups: [
        { label: "Red blood cells", markers: "RBC · Hemoglobin · Hematocrit · MCV · MCH · MCHC · RDW" },
        { label: "White blood cells (5-part diff)", markers: "WBC · Neutrophils · Lymphocytes · Monocytes · Eosinophils · Basophils (% and absolute counts)" },
        { label: "Platelets", markers: "Platelet Count · MPV" },
      ],
    },
    "Iron & TIBC": {
      count: 3,
      tagline: "Iron stores and transport",
      groups: [
        { label: "Iron status", markers: "Serum Iron · TIBC · Transferrin Saturation" },
      ],
    },
  };

  const totalBiomarkers = {
    men: { essential: 55, elite: 78 },
    women: { essential: 57, elite: 78 },
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
        <div className="trust-bar">
          <div className="trust-inner">
            <span className="trust-item"><span className="trust-rating">5.0</span> on Google</span>
            <span className="trust-item">Newport Beach, CA</span>
            <span className="trust-item">Board-Certified Providers</span>
          </div>
        </div>

        <div className="tx-page">

          {/* Hero */}
          <section className="tx-hero">
            <div className="tx-container">
              <div className="tx-label">LABS &amp; TESTING</div>
              <h1>What your bloodwork isn&apos;t <em>telling you</em></h1>
              <div className="tx-rule" />
              <p className="tx-hero-sub">
                Standard bloodwork misses a lot. Our panels go deeper &mdash; hormones, metabolism,
                inflammation, and cardiovascular markers that tell you what&apos;s actually going on.
              </p>
              <Link href="/assessment/energy" className="tx-btn">Book Your Range Assessment</Link>
              <span className="tx-btn-note">
                Your provider will recommend the right panel at your assessment.
              </span>
            </div>
          </section>

          {/* Who It's For */}
          <section className="tx-section">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">WHO IT&apos;S FOR</div>
                <h2>When to get <em>tested</em></h2>
                <div className="tx-rule" />
                <p className="tx-section-intro">
                  Comprehensive labs give you answers that standard bloodwork misses.
                </p>
              </div>
              <div className="lp-signs-grid tx-animate">
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

          {/* Panels Comparison */}
          <section className="tx-section-alt">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">COMPARE PANELS</div>
                <h2>Essential vs <em>Elite</em></h2>
                <div className="tx-rule" />
                <p className="tx-section-intro">
                  See exactly what&apos;s included in each panel.
                </p>
              </div>

              <div className="tx-animate">
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

                {/* Biomarker Count Summary */}
                <div className="lp-chart-summary">
                  <div className="lp-chart-summary-pill">
                    <span className="lp-chart-summary-num">{totalBiomarkers[activeTab].essential}</span>
                    <span className="lp-chart-summary-label">Essential biomarkers</span>
                  </div>
                  <span className="lp-chart-summary-divider">vs.</span>
                  <div className="lp-chart-summary-pill lp-chart-summary-elite">
                    <span className="lp-chart-summary-num">{totalBiomarkers[activeTab].elite}</span>
                    <span className="lp-chart-summary-label">Elite biomarkers</span>
                  </div>
                </div>
                <p className="lp-chart-summary-note">
                  Bundle tests like CMP, Lipid Panel, and CBC each contain multiple individual biomarkers. Tap any row to see what&apos;s tested.
                </p>

                {/* Comparison Chart */}
                <div className="lp-chart-wrapper">
                  <div className="lp-chart">
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

                    <div className="lp-chart-hint">
                      <span>Tap any biomarker to learn why we test it</span>
                    </div>

                    <div className="lp-chart-body">
                      {(activeTab === 'men' ? menEssential : womenEssential).map((marker, index) => {
                        const bundle = bundleComposition[marker];
                        const isExpanded = expandedMarker === `essential-${index}`;
                        return (
                        <div key={index}>
                          <div
                            className={`lp-chart-row lp-chart-row-clickable ${isExpanded ? 'lp-chart-row-expanded' : ''}`}
                            onClick={() => toggleMarker(`essential-${index}`)}
                          >
                            <div className="lp-chart-marker-col">
                              <span className="lp-marker-name">
                                {marker}
                                {bundle && <span className="lp-marker-count-badge">{bundle.count} biomarkers</span>}
                              </span>
                              <span className={`lp-marker-toggle ${isExpanded ? 'lp-marker-toggle-open' : ''}`}>
                                {isExpanded ? '−' : '+'}
                              </span>
                            </div>
                            <div className="lp-chart-panel-col"><span className="lp-check">{'✓'}</span></div>
                            <div className="lp-chart-panel-col lp-chart-panel-featured"><span className="lp-check">{'✓'}</span></div>
                          </div>
                          {isExpanded && (biomarkerInfo[marker] || bundle) && (
                            <div className="lp-chart-description">
                              {biomarkerInfo[marker] && <p>{biomarkerInfo[marker]}</p>}
                              {bundle && (
                                <div className="lp-bundle-groups">
                                  {bundle.groups.map((group, gIdx) => (
                                    <div className="lp-bundle-group" key={gIdx}>
                                      <span className="lp-bundle-group-label">{group.label}</span>
                                      <span className="lp-bundle-group-markers">{group.markers}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
                      {(activeTab === 'men' ? menEliteExtra : womenEliteExtra).map((marker, index) => {
                        const bundle = bundleComposition[marker];
                        const isExpanded = expandedMarker === `elite-${index}`;
                        return (
                        <div key={`elite-${index}`}>
                          <div
                            className={`lp-chart-row lp-chart-row-elite lp-chart-row-clickable ${isExpanded ? 'lp-chart-row-expanded' : ''}`}
                            onClick={() => toggleMarker(`elite-${index}`)}
                          >
                            <div className="lp-chart-marker-col">
                              <span className="lp-marker-name">
                                {marker}
                                {bundle && <span className="lp-marker-count-badge">{bundle.count} biomarkers</span>}
                              </span>
                              <span className={`lp-marker-toggle ${isExpanded ? 'lp-marker-toggle-open' : ''}`}>
                                {isExpanded ? '−' : '+'}
                              </span>
                            </div>
                            <div className="lp-chart-panel-col"><span className="lp-dash">&mdash;</span></div>
                            <div className="lp-chart-panel-col lp-chart-panel-featured"><span className="lp-check">{'✓'}</span></div>
                          </div>
                          {isExpanded && (biomarkerInfo[marker] || bundle) && (
                            <div className="lp-chart-description lp-chart-description-elite">
                              {biomarkerInfo[marker] && <p>{biomarkerInfo[marker]}</p>}
                              {bundle && (
                                <div className="lp-bundle-groups">
                                  {bundle.groups.map((group, gIdx) => (
                                    <div className="lp-bundle-group" key={gIdx}>
                                      <span className="lp-bundle-group-label">{group.label}</span>
                                      <span className="lp-bundle-group-markers">{group.markers}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    <div className="lp-chart-footer">
                      <div className="lp-chart-marker-col"></div>
                      <div className="lp-chart-panel-col" style={{ gridColumn: 'span 2' }}>
                        <Link href="/assessment/energy" className="tx-btn lp-btn-chart">
                          START WITH ASSESSMENT
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Which Panel */}
          <section className="tx-section">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">WHICH PANEL?</div>
                <h2>Which panel is <em>right</em> for you?</h2>
                <div className="tx-rule" />
              </div>

              <div className="lp-compare-grid tx-animate">
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
                  <Link href="/assessment/energy" className="lp-btn-outline">
                    START WITH ASSESSMENT
                  </Link>
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
                  <Link href="/assessment/energy" className="tx-btn lp-btn-card">
                    START WITH ASSESSMENT
                  </Link>
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

          {/* Decision Guide */}
          <section className="tx-section-alt">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">NOT SURE?</div>
                <h2>Find your panel in <em>10 seconds</em></h2>
                <div className="tx-rule" />
                <p className="tx-section-intro">
                  Tell us why you&apos;re here and we&apos;ll point you to the right panel.
                </p>
              </div>

              <div className="lp-decide-grid tx-animate">
                {[
                  { scenario: "“I want testosterone” or “I need HRT”", panel: "essential", reason: "Covers total & free T, SHBG, estradiol, thyroid, and metabolic markers." },
                  { scenario: "“I want to lose weight” or GLP-1", panel: "essential", reason: "Covers insulin, A1c, lipids, thyroid — everything needed to prescribe." },
                  { scenario: "“I just want to see where I’m at”", panel: "essential", reason: "Great starting point. You can always upgrade to Elite next time." },
                  { scenario: "Family history of heart disease", panel: "elite", reason: "Apo B, Lp(a), and homocysteine are must-haves for hereditary risk." },
                  { scenario: "“I want the full longevity workup”", panel: "elite", reason: "This IS the longevity workup — Apo B, Lp(a), CRP-HS, IGF-1, and minerals." },
                  { scenario: "“I’m always tired and don’t know why”", panel: "elite", reason: "Could be hormones, thyroid, iron, B12, cortisol, or inflammation." },
                  { scenario: "Interested in Apo B, Lp(a), or specific markers", panel: "elite", reason: "You’ve done the research. Get the panel that includes what you came for." },
                  { scenario: "Biohacker / optimization / longevity-focused", panel: "elite", reason: "Same workup that longevity specialists order." },
                  { scenario: "“What do you recommend?” / Not sure yet", panel: "essential", reason: "Start with Essential. You can run Elite on follow-up if you want to go deeper." },
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

              <p className="lp-decide-note tx-animate">
                Both panels qualify you for every treatment at Range Medical. The Essential gives you what you need; the Elite gives you the full picture.
              </p>
            </div>
          </section>

          {/* Elite Markers */}
          <section className="tx-section">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">ELITE MARKERS</div>
                <h2>The three markers most doctors <em>miss</em></h2>
                <div className="tx-rule" />
                <p className="tx-section-intro">
                  These are the markers longevity specialists consider essential &mdash; and they&apos;re only in the Elite panel.
                </p>
              </div>

              <div className="lp-markers-grid tx-animate">
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

              <div className="lp-markers-cta tx-animate">
                <Link href="/assessment/energy" className="tx-btn">
                  START WITH ASSESSMENT
                </Link>
                <p>Your provider will recommend the right panel at your assessment</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="tx-section-alt">
            <div className="tx-container">
              <div className="tx-animate">
                <div className="tx-label">HOW IT WORKS</div>
                <h2>From order to <em>results</em></h2>
                <div className="tx-rule" />
              </div>
              <div className="tx-steps lp-four-steps tx-animate">
                <div className="tx-step">
                  <div className="tx-step-num">01</div>
                  <h3>Book or Call</h3>
                  <p>Schedule an Assessment or call us directly to order your panel.</p>
                </div>
                <div className="tx-step">
                  <div className="tx-step-num">02</div>
                  <h3>Get Your Draw</h3>
                  <p>Visit a local lab at your convenience. Fasting recommended.</p>
                </div>
                <div className="tx-step">
                  <div className="tx-step-num">03</div>
                  <h3>Results in 3&ndash;5 Days</h3>
                  <p>We receive your results and review them in detail.</p>
                </div>
                <div className="tx-step">
                  <div className="tx-step-num">04</div>
                  <h3>Review Together</h3>
                  <p>Your provider explains everything and builds your plan.</p>
                </div>
              </div>
              <div className="tx-animate" style={{ marginTop: '3rem' }}>
                <Link href="/assessment/energy" className="tx-btn">Book Your Range Assessment</Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="tx-section">
            <div className="tx-container">
              <div className="tx-label">COMMON QUESTIONS</div>
              <h2>Questions about <em>lab panels</em></h2>
              <div className="tx-faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}>
                    <button className="tx-faq-question" onClick={() => toggleFaq(index)}>
                      <span>{faq.question}</span>
                      <span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span>
                    </button>
                    <div className="tx-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="tx-cta">
            <div className="tx-container tx-animate">
              <h2>Ready to see what&apos;s <em>really</em> going on?</h2>
              <p>
                Start with an Assessment and your provider will recommend the right panel for your goals. Results in 3&ndash;5 business days.
              </p>
              <Link href="/assessment/energy" className="tx-btn">Book Your Range Assessment</Link>
              <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
            </div>
          </section>

        </div>

        <style jsx>{`
          /* Signs Grid */
          .lp-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-top: 2rem;
          }

          .lp-sign-card {
            background: #ffffff;
            border: 1px solid var(--color-border);
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s;
          }

          .lp-sign-card:hover {
            border-color: var(--color-text);
          }

          .lp-sign-icon {
            width: 48px;
            height: 48px;
            background: #fafafa;
            border: 1px solid var(--color-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: var(--color-text-muted);
          }

          .lp-sign-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: var(--color-text);
            margin: 0 0 0.5rem;
          }

          .lp-sign-card p {
            font-size: 0.875rem;
            color: var(--color-text-muted);
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
            border: 1px solid var(--color-border);
            background: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            border-radius: 0;
          }

          .lp-tab:first-child {
            border-right: none;
            border-radius: 999px 0 0 999px;
          }

          .lp-tab:last-child {
            border-radius: 0 999px 999px 0;
          }

          .lp-tab:hover {
            color: var(--color-text);
          }

          .lp-tab-active {
            background: var(--color-text);
            border-color: var(--color-text);
            color: #ffffff;
          }

          /* Biomarker Count Summary */
          .lp-chart-summary {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.75rem;
            flex-wrap: wrap;
          }

          .lp-chart-summary-pill {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #ffffff;
            border: 1px solid var(--color-border);
            padding: 1rem 2rem;
            min-width: 200px;
            border-radius: 8px;
          }

          .lp-chart-summary-elite {
            background: var(--color-text);
            border-color: var(--color-text);
          }

          .lp-chart-summary-num {
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--color-text);
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .lp-chart-summary-elite .lp-chart-summary-num {
            color: #ffffff;
          }

          .lp-chart-summary-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            margin-top: 0.5rem;
          }

          .lp-chart-summary-elite .lp-chart-summary-label {
            color: #b8b8b8;
          }

          .lp-chart-summary-divider {
            font-size: 0.875rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #b8b8b8;
            text-transform: uppercase;
          }

          .lp-chart-summary-note {
            text-align: center;
            font-size: 0.8125rem;
            color: var(--color-text-muted);
            margin: 0 0 1.5rem;
            font-style: italic;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
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
            border: 1px solid var(--color-border);
            border-radius: 8px;
            overflow: hidden;
          }

          .lp-chart-header {
            display: grid;
            grid-template-columns: 1fr 100px 100px;
            background: #fafafa;
            border-bottom: 1px solid var(--color-border);
            font-weight: 600;
          }

          .lp-chart-header .lp-chart-marker-col {
            padding: 1.25rem 1.5rem;
            color: var(--color-text);
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
            color: var(--color-text);
            font-weight: 700;
          }

          .lp-chart-panel-price {
            font-size: 0.8125rem;
            color: var(--color-text-muted);
            font-weight: 500;
          }

          .lp-chart-header .lp-chart-panel-featured {
            background: var(--color-text);
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
            border-bottom: 1px solid var(--color-border);
            font-size: 0.75rem;
            color: var(--color-text-muted);
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
            color: var(--color-text);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .lp-marker-name {
            flex: 1;
          }

          .lp-marker-toggle {
            color: var(--color-text-muted);
            font-size: 1.125rem;
            font-weight: 700;
            margin-left: 0.5rem;
            width: 20px;
            text-align: center;
            transition: color 0.2s;
          }

          .lp-marker-toggle-open {
            color: var(--color-text);
          }

          .lp-chart-description {
            padding: 1rem 1.5rem;
            background: #fafafa;
            border-bottom: 1px solid var(--color-border);
          }

          .lp-chart-description-elite {
            background: #f5f5f5;
          }

          .lp-chart-description p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--color-text-muted);
            line-height: 1.6;
          }

          .lp-marker-count-badge {
            display: inline-block;
            margin-left: 0.625rem;
            padding: 0.125rem 0.5rem;
            background: var(--color-text);
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            vertical-align: middle;
            line-height: 1.4;
            border-radius: 999px;
          }

          .lp-chart-row-elite .lp-marker-count-badge {
            background: #525252;
          }

          .lp-bundle-groups {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
            margin-top: 0.875rem;
            padding-top: 0.875rem;
            border-top: 1px solid var(--color-border);
          }

          .lp-bundle-group {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 1rem;
            align-items: baseline;
          }

          .lp-bundle-group-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text);
            line-height: 1.4;
          }

          .lp-bundle-group-markers {
            font-size: 0.8125rem;
            color: #404040;
            line-height: 1.5;
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
            color: var(--color-accent);
            font-size: 1.125rem;
            font-weight: 700;
          }

          .lp-dash {
            color: var(--color-border);
            font-size: 1rem;
          }

          .lp-chart-footer {
            display: grid;
            grid-template-columns: 1fr 100px 100px;
            border-top: 1px solid var(--color-border);
            background: #fafafa;
          }

          .lp-chart-footer .lp-chart-marker-col {
            padding: 1.25rem 1.5rem;
            font-weight: 600;
            color: var(--color-text);
          }

          .lp-chart-footer .lp-chart-panel-col {
            padding: 1.25rem 0.5rem;
            flex-direction: column;
            gap: 0.5rem;
          }

          :global(.lp-btn-chart) {
            font-size: 12px !important;
            padding: 10px 20px !important;
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
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
          }

          .lp-compare-card-header {
            text-align: center;
            margin-bottom: 1.25rem;
            padding-bottom: 1.25rem;
            border-bottom: 1px solid var(--color-border);
          }

          .lp-compare-card h4 {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: var(--color-text);
            margin-bottom: 0.75rem;
          }

          .lp-compare-price {
            font-size: 2.25rem;
            font-weight: 900;
            color: var(--color-text-muted);
            margin-bottom: 0.25rem;
          }

          .lp-compare-includes {
            font-size: 0.8125rem;
            color: var(--color-text-muted);
          }

          .lp-compare-desc {
            font-size: 0.9375rem;
            color: var(--color-text-muted);
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .lp-compare-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-accent);
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 0.375rem 1rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
            border-radius: 999px;
          }

          .lp-compare-featured {
            position: relative;
            padding-top: 2.5rem;
            border-color: var(--color-accent);
            border-width: 2px;
          }

          .lp-compare-note {
            text-align: center;
            font-size: 0.875rem;
            color: var(--color-text-muted);
            margin-top: 1.5rem;
          }

          .lp-compare-switch {
            background: none;
            border: none;
            color: var(--color-text);
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            text-decoration: underline;
            font-family: inherit;
          }

          .lp-compare-switch:hover {
            color: var(--color-text-muted);
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
            color: var(--color-text-muted);
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
            line-height: 1.5;
          }

          .lp-list-dash {
            position: absolute;
            left: 0;
            color: var(--color-accent);
            font-weight: 700;
          }

          .lp-btn-outline {
            display: block;
            text-align: center;
            background: #ffffff;
            color: var(--color-accent);
            padding: 16px 32px;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            text-decoration: none;
            border: 1px solid var(--color-accent);
            border-radius: 999px;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.04em;
          }

          .lp-btn-outline:hover {
            background: var(--color-accent);
            color: #ffffff;
          }

          :global(.lp-btn-card) {
            display: block !important;
            text-align: center;
            width: 100%;
          }

          /* Decision Guide */
          .lp-decide-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            background: #ffffff;
            overflow: hidden;
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
            color: var(--color-text);
            font-weight: 500;
          }

          .lp-decide-tag {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: var(--color-text-muted);
            padding: 0.25rem 0.5rem;
          }

          .lp-decide-tag-elite {
            color: var(--color-accent);
          }

          .lp-decide-reason {
            padding: 0.875rem 1.25rem;
            font-size: 0.875rem;
            color: var(--color-text-muted);
            line-height: 1.5;
            border-left: 1px solid #f0f0f0;
          }

          .lp-decide-note {
            max-width: 800px;
            margin: 1.5rem auto 0;
            text-align: center;
            font-size: 0.9375rem;
            color: var(--color-text-muted);
            line-height: 1.6;
            padding: 1.25rem;
            background: #fafafa;
            border: 1px solid var(--color-border);
            border-radius: 8px;
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
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 2rem 1.5rem;
            position: relative;
            transition: border-color 0.2s;
          }

          .lp-marker-card:hover {
            border-color: var(--color-text);
          }

          .lp-marker-card-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: var(--color-accent);
            margin-bottom: 1rem;
          }

          .lp-marker-card h4 {
            font-size: 1.0625rem;
            font-weight: 700;
            color: var(--color-text);
            margin: 0 0 0.75rem;
            line-height: 1.3;
          }

          .lp-marker-card-desc {
            font-size: 0.875rem;
            color: var(--color-text-muted);
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .lp-marker-card-plain {
            padding-top: 1rem;
            border-top: 1px solid #f0f0f0;
            font-size: 0.875rem;
            color: var(--color-text);
            font-style: italic;
            line-height: 1.5;
          }

          .lp-marker-card-plain-label {
            display: block;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--color-text-muted);
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
            color: var(--color-text-muted);
          }

          /* Four-step override */
          .lp-four-steps {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .lp-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .lp-compare-grid {
              grid-template-columns: 1fr;
            }

            .lp-four-steps {
              grid-template-columns: repeat(2, 1fr) !important;
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
              border-right: 1px solid var(--color-border);
              border-bottom: none;
              border-radius: 999px 999px 0 0;
            }

            .lp-tab:last-child {
              border-radius: 0 0 999px 999px;
            }

            .lp-chart-wrapper {
              margin: 0 -1rem;
              padding: 0 1rem;
              overflow-x: hidden;
            }

            .lp-chart {
              min-width: 0;
            }

            .lp-chart-body {
              max-height: none;
              overflow-y: visible;
            }

            .lp-chart-header,
            .lp-chart-row,
            .lp-chart-footer {
              grid-template-columns: 1fr 64px 64px;
            }

            .lp-chart-marker-col {
              padding: 0.75rem 0.75rem;
              font-size: 0.8125rem;
            }

            .lp-chart-header .lp-chart-marker-col {
              padding: 0.75rem;
              font-size: 10px;
            }

            .lp-chart-panel-col {
              padding: 0.75rem 0.25rem;
            }

            .lp-chart-panel-name {
              font-size: 0.75rem;
            }

            .lp-chart-panel-price {
              font-size: 0.6875rem;
            }

            .lp-chart-hint {
              font-size: 0.6875rem;
              padding: 0.5rem 0.75rem;
            }

            .lp-chart-description {
              padding: 0.875rem 0.75rem;
            }

            .lp-chart-description p {
              font-size: 0.8125rem;
            }

            .lp-chart-footer .lp-chart-panel-col {
              padding: 0.75rem 0.25rem;
            }

            :global(.lp-btn-chart) {
              font-size: 10px !important;
              padding: 8px 12px !important;
            }

            .lp-four-steps {
              grid-template-columns: 1fr !important;
            }

            .lp-chart-summary {
              flex-direction: column;
              gap: 0.75rem;
            }

            .lp-chart-summary-pill {
              width: 100%;
              max-width: 280px;
            }

            .lp-chart-summary-divider {
              transform: none;
            }

            .lp-bundle-group {
              grid-template-columns: 1fr;
              gap: 0.25rem;
            }

            .lp-marker-count-badge {
              display: block;
              margin-left: 0;
              margin-top: 0.25rem;
              width: fit-content;
            }
          }
        `}</style>
      </Layout>

    </>
  );
}
