// pages/weight-loss.jsx
// Medical Weight Loss - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getStudiesByService } from '../data/researchStudies';

export default function WeightLoss() {
  const [openFaq, setOpenFaq] = useState(null);
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
      highlight: "Most Popular",
      sideEffectsLink: "/tirzepatide-side-effects-guide"
    },
    {
      name: "Semaglutide",
      brand: "Ozempic / Wegovy",
      desc: "GLP-1 receptor agonist. Well-studied with years of clinical data. Effective for weight loss and blood sugar control.",
      highlight: null,
      sideEffectsLink: "/semaglutide-side-effects-guide"
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
    { step: "01", title: "Get started", desc: "Get started with Range Medical. We'll discuss your weight history, goals, and determine if GLP-1 medications are right for you." },
    { step: "02", title: "Run comprehensive labs", desc: "We check metabolic markers, thyroid, hormones, and other factors that affect weight — not just the basics." },
    { step: "03", title: "Start your medication", desc: "Your provider prescribes the right medication at the right starting dose. We teach you how to self-inject (it's easier than you think)." },
    { step: "04", title: "Ongoing support", desc: "Weekly check-ins, dose adjustments based on your response, and lab monitoring throughout your journey. Real support, not just refills." }
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
                  "reviewCount": "10",
                  "bestRating": "5"
                },
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "07:00",
                    "closes": "18:00"
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Saturday"],
                    "opens": "09:00",
                    "closes": "14:00"
                  }
                ]
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
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="wl-page">
        {/* Hero */}
        <section className="wl-hero">
          <div className="v2-label"><span className="v2-dot" /> WEIGHT LOSS</div>
          <h1>STOP FIGHTING YOUR BODY.<br />START WORKING WITH IT.</h1>
          <div className="wl-hero-rule"></div>
          <p className="wl-body-text">GLP-1 medications like Tirzepatide and Semaglutide are changing everything about weight loss. Real science, real medical support, real results — in Newport Beach.</p>
          <div className="wl-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> WHAT IS IT</div>
              <h2>A NEW CLASS OF MEDICATIONS THAT ACTUALLY WORK.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> WHO IT'S FOR</div>
              <h2>YOU'VE TRIED EVERYTHING. THIS IS DIFFERENT.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> MEDICATIONS WE OFFER</div>
              <h2>THE RIGHT MEDICATION FOR YOUR SITUATION.</h2>
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
                  {med.sideEffectsLink && (
                    <Link href={med.sideEffectsLink} className="wl-med-se-link">
                      View Side Effects Guide <span>&rarr;</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> HOW IT MAY HELP</div>
              <h2>MORE THAN JUST WEIGHT LOSS.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> WHAT TO EXPECT</div>
              <h2>YOUR WEIGHT LOSS JOURNEY, WEEK BY WEEK.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> BACKED BY SCIENCE</div>
              <h2>EVIDENCE-BASED RESULTS</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="wl-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="wl-research-card wl-animate"
                  onClick={() => window.location.href = '/research/' + study.id}
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
              <div className="v2-label"><span className="v2-dot" /> GETTING STARTED</div>
              <h2>YOUR FIRST VISIT, STEP BY STEP.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                Getting started is straightforward — and your first assessment is free with no commitment. Here's exactly what happens.
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

        {/* Safety & Transparency */}
        <section className="wl-section">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                We believe you should know exactly what to expect — including the parts other clinics gloss over. Here are the most common side effects and who should not take these medications.
              </p>
            </div>

            <div className="wl-safety-grid wl-animate">
              <div className="wl-safety-card">
                <div className="wl-safety-label">Common Side Effects</div>
                <div className="wl-safety-items">
                  <div className="wl-safety-item">
                    <span className="wl-safety-icon">1</span>
                    <div>
                      <strong>Nausea</strong>
                      <p>The most common side effect. Affects 3-4 out of 10 people, mostly in the first 1-2 weeks at each new dose. Usually mild and temporary.</p>
                    </div>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-icon">2</span>
                    <div>
                      <strong>GI Changes</strong>
                      <p>Diarrhea, constipation, or heartburn as your digestive system adjusts to slower gastric emptying. Manageable with diet changes.</p>
                    </div>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-icon">3</span>
                    <div>
                      <strong>Reduced Appetite</strong>
                      <p>The intended effect — but it can go too far. We monitor nutrition closely and adjust dosing to keep you fueled properly.</p>
                    </div>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-icon">4</span>
                    <div>
                      <strong>Fatigue & Hair Thinning</strong>
                      <p>Less common. Usually related to eating too little or losing weight too fast — both of which we actively manage.</p>
                    </div>
                  </div>
                </div>
                <div className="wl-safety-guides">
                  <Link href="/semaglutide-side-effects-guide" className="wl-safety-guide-link">Semaglutide Guide <span>&rarr;</span></Link>
                  <Link href="/tirzepatide-side-effects-guide" className="wl-safety-guide-link">Tirzepatide Guide <span>&rarr;</span></Link>
                </div>
              </div>

              <div className="wl-safety-card wl-safety-card-dark">
                <div className="wl-safety-label">Who Should Not Take GLP-1 Medications</div>
                <div className="wl-safety-items">
                  <div className="wl-safety-item">
                    <span className="wl-safety-warn">!</span>
                    <p>Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)</p>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-warn">!</span>
                    <p>History of pancreatitis or active gallbladder disease</p>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-warn">!</span>
                    <p>Currently pregnant, planning to become pregnant, or breastfeeding</p>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-warn">!</span>
                    <p>Known allergy to semaglutide, tirzepatide, or any component of the formulation</p>
                  </div>
                  <div className="wl-safety-item">
                    <span className="wl-safety-warn">!</span>
                    <p>Type 1 diabetes (these medications are for type 2 diabetes and weight management only)</p>
                  </div>
                </div>
                <p className="wl-safety-note">We screen for all of these during your assessment. If you are unsure, we will review your history and let you know.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results */}
        <section className="wl-section wl-section-inverted">
          <div className="wl-container">
            <div className="wl-animate">
              <div className="v2-label"><span className="v2-dot" /> REAL RESULTS</div>
              <h2>WHAT LIFE LOOKS LIKE ON THE OTHER SIDE.</h2>
              <div className="wl-divider"></div>
              <p className="wl-body-text">
                These are real outcomes from Range Medical patients. Names omitted for privacy — but the results speak for themselves.
              </p>
            </div>

            <div className="wl-results-grid wl-animate">
              <div className="wl-result-card">
                <div className="wl-result-profile">Male, 38</div>
                <div className="wl-result-before">
                  <span className="wl-result-label">Before</span>
                  Came in at 245 lbs after years of yo-yo dieting. Pre-diabetic, on blood pressure medication, exhausted by 2pm every day.
                </div>
                <div className="wl-result-after">
                  <span className="wl-result-label">After 4 months</span>
                  Down 42 lbs. Off blood pressure medication. A1C normalized. Says he has energy he hasn't felt since his 20s.
                </div>
              </div>
              <div className="wl-result-card">
                <div className="wl-result-profile">Female, 44</div>
                <div className="wl-result-before">
                  <span className="wl-result-label">Before</span>
                  Gained 35 lbs over 3 years despite consistent exercise. Felt like her metabolism had shut down. Avoided photos.
                </div>
                <div className="wl-result-after">
                  <span className="wl-result-label">After 5 months</span>
                  Lost 38 lbs. Back in clothes she'd packed away. Says the biggest change was mental — she stopped obsessing over every meal.
                </div>
              </div>
              <div className="wl-result-card">
                <div className="wl-result-profile">Male, 52</div>
                <div className="wl-result-before">
                  <span className="wl-result-label">Before</span>
                  280 lbs with knee pain that made walking difficult. Doctor told him he needed to lose weight before knee replacement was an option.
                </div>
                <div className="wl-result-after">
                  <span className="wl-result-label">After 6 months</span>
                  Down 55 lbs. Knee surgery no longer needed. Walking 3 miles a day. Says he got his life back.
                </div>
              </div>
            </div>

            <div className="wl-inaction wl-animate">
              <div className="wl-inaction-label">THE COST OF WAITING</div>
              <p>Metabolic dysfunction doesn't pause while you decide. Insulin resistance worsens. Inflammation compounds. Blood pressure climbs. Every month you wait, the hill gets steeper. The best time to start was a year ago. The second best time is now.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="wl-section wl-section-alt">
          <div className="wl-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="wl-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`wl-faq-item ${openFaq === index ? 'wl-faq-open' : ''}`}>
                  <button className="wl-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="wl-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
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
              <div className="v2-label" style={{ marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
              <h2 className="wl-cta-title">IMAGINE WAKING UP AND NOT<br />THINKING ABOUT FOOD FIRST.</h2>
              <p className="wl-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                That's what our patients tell us within the first month. The constant mental battle with food quiets down — and you start living again. $197 assessment, credited toward treatment.
              </p>
              <div className="wl-cta-buttons">
                <Link href="/range-assessment" className="wl-btn-primary">Book Your $197 Range Assessment</Link>
                <div className="wl-cta-or">or</div>
                <a href="tel:9499973988" className="wl-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== WEIGHT LOSS PAGE V2 SCOPED STYLES ===== */
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
          padding: 6rem 2rem;
        }

        .wl-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .wl-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines */
        .wl-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #171717;
          text-transform: uppercase;
        }

        .wl-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #171717;
          margin-bottom: 1rem;
          text-transform: uppercase;
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
          color: #737373;
          max-width: 600px;
        }

        .wl-section-inverted .wl-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .wl-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .wl-section-inverted .wl-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .wl-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #1a1a1a;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .wl-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        /* Hero */
        .wl-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .wl-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .wl-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .wl-hero .wl-body-text {
          text-align: left;
          margin: 0 0 2.5rem;
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
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
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
          border-radius: 0;
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
          gap: 0;
          margin-top: 2.5rem;
        }

        .wl-med-card {
          padding: 2rem;
          border-radius: 0;
          border: 1px solid #e0e0e0;
          border-right: none;
          background: #ffffff;
          transition: border-color 0.2s ease;
          position: relative;
        }

        .wl-med-card:last-child {
          border-right: 1px solid #e0e0e0;
        }

        .wl-med-card:hover {
          border-color: #1a1a1a;
        }

        .wl-med-badge {
          position: absolute;
          top: -10px;
          left: 1.5rem;
          background: #808080;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 0;
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
          color: #737373;
        }

        /* Benefit Cards */
        .wl-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .wl-benefit-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .wl-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .wl-benefit-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .wl-benefit-card:hover {
          background: #fafafa;
        }

        .wl-benefit-number {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #808080;
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
          color: #737373;
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
          color: #1a1a1a;
          min-width: 90px;
          letter-spacing: 0.02em;
          background: #808080;
          padding: 0.375rem 0.75rem;
          border-radius: 0;
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
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .wl-research-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .wl-research-card:nth-child(2n) {
          border-right: none;
        }

        .wl-research-card:last-child,
        .wl-research-card:nth-last-child(2):nth-child(odd) {
          border-bottom: none;
        }

        .wl-research-card:hover {
          background: #fafafa;
        }

        .wl-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
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
          color: #737373;
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

        /* Expect List / Steps */
        .wl-expect-list {
          margin-top: 2.5rem;
        }

        .wl-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .wl-expect-item:last-child {
          border-bottom: none;
        }

        .wl-expect-step {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 56px;
          letter-spacing: -0.02em;
        }

        .wl-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .wl-expect-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* FAQ */
        .wl-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .wl-faq-item {
          border-bottom: 1px solid #e0e0e0;
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

        .wl-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
          padding-right: 0 !important;
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
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .wl-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .wl-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #ffffff;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
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

        /* Side Effects Link on Med Cards */
        .wl-med-se-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          padding: 0.5rem 0;
          border-top: 1px solid #f0f0f0;
          width: 100%;
          transition: color 0.2s;
        }
        .wl-med-se-link:hover {
          color: #525252;
        }
        .wl-med-se-link span {
          transition: transform 0.2s;
        }
        .wl-med-se-link:hover span {
          transform: translateX(3px);
        }

        /* Safety & Transparency */
        .wl-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .wl-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .wl-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .wl-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .wl-safety-card-dark .wl-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .wl-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .wl-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .wl-safety-card-dark .wl-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .wl-safety-item:last-child {
          border-bottom: none;
        }
        .wl-safety-icon {
          width: 1.5rem;
          height: 1.5rem;
          background: #171717;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.6875rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .wl-safety-warn {
          width: 1.5rem;
          height: 1.5rem;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .wl-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .wl-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .wl-safety-card-dark .wl-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .wl-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .wl-safety-guide-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          transition: all 0.2s;
        }
        .wl-safety-guide-link:hover {
          border-color: #171717;
        }
        .wl-safety-guide-link span {
          transition: transform 0.2s;
        }
        .wl-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .wl-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Real Results */
        .wl-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }
        .wl-result-card {
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .wl-result-card:last-child {
          border-right: none;
        }
        .wl-result-profile {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }
        .wl-result-before,
        .wl-result-after {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .wl-result-after {
          color: rgba(255,255,255,0.95);
        }
        .wl-result-label {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.3);
        }
        .wl-result-after .wl-result-label {
          color: #4ade80;
        }
        .wl-inaction {
          margin-top: 3rem;
          padding: 2rem 2.5rem;
          border-left: 3px solid rgba(255,255,255,0.15);
        }
        .wl-inaction-label {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.75rem;
        }
        .wl-inaction p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .wl-section {
            padding: 3rem 1.5rem;
          }

          .wl-section-alt {
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

          .wl-med-card {
            border-right: 1px solid #e0e0e0;
            border-bottom: none;
          }

          .wl-med-card:last-child {
            border-bottom: 1px solid #e0e0e0;
          }

          .wl-safety-grid {
            grid-template-columns: 1fr;
          }

          .wl-safety-guides {
            flex-direction: column;
          }

          .wl-benefits-grid {
            grid-template-columns: 1fr;
          }

          .wl-benefit-card {
            border-right: none;
          }

          .wl-benefit-card:last-child {
            border-bottom: none;
          }

          .wl-research-grid {
            grid-template-columns: 1fr;
          }

          .wl-research-card {
            border-right: none;
          }

          .wl-research-card:last-child {
            border-bottom: none;
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

          .wl-results-grid {
            grid-template-columns: 1fr;
          }

          .wl-result-card {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem 0;
          }

          .wl-result-card:last-child {
            border-bottom: none;
          }

          .wl-inaction {
            padding: 1.5rem;
          }

          .wl-cta-section {
            padding: 3rem 1.5rem;
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
