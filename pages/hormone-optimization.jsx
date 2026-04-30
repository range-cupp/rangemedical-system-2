// pages/hormone-optimization.jsx
// Hormone Optimization - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getStudiesByService } from '../data/researchStudies';

export default function HormoneOptimization() {
  const [openFaq, setOpenFaq] = useState(null);
  const studies = getStudiesByService('hormone-optimization');

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

    const elements = document.querySelectorAll('.hrt-page .hrt-animate');
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
      question: "Is hormone therapy safe?",
      answer: "Yes, when monitored by a licensed provider with regular labs. We check your levels at 8 weeks and then quarterly to ensure your protocol is optimized and safe. Side effects are rare and typically mild when hormones are properly dosed."
    },
    {
      question: "How soon will I feel better?",
      answer: "Most patients notice improvements in sleep and energy within the first 1-2 weeks. Mood and mental clarity typically improve by weeks 3-4. Full optimization — including body composition changes — develops over 3-6 months."
    },
    {
      question: "What's included in the $250/month membership?",
      answer: "All hormone medications (testosterone, estrogen, progesterone, thyroid, support meds), a monthly Range IV ($225 value), all follow-up labs (8-week and quarterly), and direct provider access via text or call. Initial labs are billed separately."
    },
    {
      question: "Do I need labs first?",
      answer: "Yes — we run comprehensive labs to understand your baseline and personalize your protocol. Initial labs are billed separately (Essential Panel $350 or Elite Panel $750). All follow-up labs (8-week and quarterly) are included in your membership."
    },
    {
      question: "Is there a contract?",
      answer: "No. Our HRT membership is month-to-month. You can pause or cancel anytime with no penalties or fees."
    },
    {
      question: "Do you treat women too, or just men?",
      answer: "Absolutely. We treat both men and women. Women's hormone decline — especially during perimenopause and menopause — is one of the most under-addressed issues in medicine. We optimize testosterone, estrogen, progesterone, and thyroid for women with the same personalized, lab-driven approach."
    },
    {
      question: "What if I'm already on HRT somewhere else?",
      answer: "We can review your current protocol and labs. Many patients transfer to us for better monitoring, more comprehensive care, or simply better value. Book an assessment and bring your recent labs."
    }
  ];

  const benefits = [
    { number: "01", title: "Energy & Vitality", desc: "Balanced hormones help your cells produce energy more efficiently. Most patients report feeling more alert, less fatigued, and more motivated within the first few weeks." },
    { number: "02", title: "Mental Clarity", desc: "Brain fog, difficulty concentrating, and memory issues are often linked to hormone imbalances. Optimization may help restore focus and cognitive sharpness." },
    { number: "03", title: "Mood & Emotional Balance", desc: "Hormones directly affect neurotransmitters that regulate mood. Many patients experience reduced anxiety, irritability, and depressive symptoms." },
    { number: "04", title: "Body Composition", desc: "Optimized hormones support muscle growth and fat metabolism. Patients typically see 3-6 lbs of lean muscle gain and 3-6 lbs of fat loss over 6-12 months." },
    { number: "05", title: "Sleep Quality", desc: "Hormone imbalances often disrupt sleep. Patients frequently report deeper, more restorative sleep within the first 1-2 weeks of treatment." },
    { number: "06", title: "Libido & Sexual Health", desc: "Low hormones are a common cause of decreased sex drive and sexual dysfunction. Most patients see improvements within 3-6 weeks." }
  ];

  const tags = [
    "Always Tired",
    "Brain Fog",
    "Lost Your Edge",
    "Mood Swings",
    "Weight Gain",
    "Low Libido",
    "Poor Sleep",
    "Feeling 'Off'"
  ];

  const timeline = [
    { period: "Week 1-2", title: "Sleep & Early Energy", desc: "Most patients notice improved sleep quality and early energy gains." },
    { period: "Week 3-4", title: "Mood & Mental Clarity", desc: "Brain fog lifts, mood stabilizes, and libido begins to increase." },
    { period: "Week 8", title: "Measurable Changes", desc: "Lab work confirms optimization. Sexual function and mood improvements plateau." },
    { period: "Month 3-6", title: "Body Composition", desc: "Visible changes in muscle tone and body fat. Metabolic improvements measurable." },
    { period: "Month 6-12", title: "Full Optimization", desc: "Maximum benefits achieved: 3-8 lbs lean muscle, 3-6 lbs fat loss, sustained energy." }
  ];

  const steps = [
    { step: "01", title: "Get started", desc: "Get started with Range Medical. We'll discuss your symptoms, goals, and medical history to see if HRT is right for you." },
    { step: "02", title: "Run comprehensive labs", desc: "We check testosterone, estrogen, thyroid, metabolic markers, and more — not just the basics your regular doctor runs." },
    { step: "03", title: "Review & start protocol", desc: "Your provider explains your results and designs a personalized protocol. You start your $250/month membership." },
    { step: "04", title: "Ongoing optimization", desc: "Follow-up labs at 8 weeks, then quarterly. We adjust your protocol as needed. Direct access to your provider anytime." }
  ];

  const womenSymptoms = [
    "Hot Flashes",
    "Night Sweats",
    "Mood Changes",
    "Weight Gain",
    "Low Libido",
    "Vaginal Dryness",
    "Thinning Hair",
    "Sleep Disruption",
    "Anxiety",
    "Brain Fog"
  ];

  const womenMedications = [
    {
      name: "Testosterone",
      forms: "Cream or Injection",
      desc: "Not just for men. Testosterone plays a key role in women's energy, muscle tone, bone density, mood, and libido. Levels decline steadily after age 30 — most women are never tested for it."
    },
    {
      name: "Estrogen (Systemic)",
      forms: "Capsule, Cream, or Patch",
      desc: "Supports heart, brain, and bone health. Helps regulate body temperature, mood, and stress response. Often the foundation of hormone therapy during perimenopause and menopause."
    },
    {
      name: "Estrogen (Vaginal)",
      forms: "Cream or Suppository",
      desc: "Targeted local therapy for vaginal dryness, discomfort, and urinary symptoms. Works directly where it's needed without significantly raising systemic hormone levels."
    },
    {
      name: "Progesterone",
      forms: "Capsule or Cream",
      desc: "Balances estrogen, supports deep sleep, calms anxiety, and protects the uterine lining. Many women notice the biggest improvement in sleep and mood from progesterone alone."
    },
    {
      name: "Thyroid Optimization",
      forms: "Oral Medication",
      desc: "Sluggish thyroid is one of the most under-diagnosed issues in women. We test beyond basic TSH — checking Free T3, Free T4, and antibodies to get the full picture."
    }
  ];

  const womenLifeStages = [
    { stage: "30s", title: "Early Decline", desc: "Testosterone and progesterone begin dropping. You may notice subtle shifts in energy, sleep, and recovery that weren't there before." },
    { stage: "40s", title: "Perimenopause", desc: "Estrogen starts fluctuating. Hot flashes, irregular cycles, mood swings, and sleep disruption become more common. This can last 4-10 years." },
    { stage: "50s", title: "Menopause", desc: "Periods stop. Estrogen, progesterone, and testosterone are all significantly lower. Bone density, cardiovascular health, and cognitive function are affected." },
    { stage: "60s+", title: "Post-Menopause", desc: "Ongoing optimization supports bone health, heart health, brain function, and quality of life. It's never too late to feel better." }
  ];

  const membershipIncludes = [
    { title: "All Medications", desc: "Testosterone, estrogen, progesterone, thyroid, and support meds — all included." },
    { title: "Monthly Range IV", desc: "A custom Range IV every month ($225 value) — 5 vitamins and minerals tailored to support your protocol." },
    { title: "Follow-Up Labs", desc: "8-week follow-up and quarterly monitoring labs — all included. Initial labs billed separately." },
    { title: "Direct Provider Access", desc: "Text or call your provider directly. No waiting for appointments for simple questions." }
  ];


  return (
    <Layout
      title="Hormone Optimization & HRT | Newport Beach | Range Medical"
      description="Expert hormone replacement therapy in Newport Beach. $250/month all-inclusive membership includes medications, labs, and monthly IV. Testosterone, thyroid, and hormone balancing for men and women."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="hormone optimization Newport Beach, HRT Orange County, testosterone therapy, TRT clinic Newport Beach, thyroid optimization, hormone replacement therapy, low testosterone treatment" />
        <link rel="canonical" href="https://www.range-medical.com/hormone-optimization" />

        {/* Open Graph */}
        <meta property="og:title" content="Hormone Optimization & HRT | Newport Beach | Range Medical" />
        <meta property="og:description" content="$250/month all-inclusive HRT membership. Medications, labs, and monthly IV included. Expert hormone optimization in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/hormone-optimization" />
        <meta property="og:image" content="https://www.range-medical.com/brand/range_logo_transparent_black.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hormone Optimization & HRT | Newport Beach | Range Medical" />
        <meta name="twitter:description" content="$250/month all-inclusive HRT membership. Medications, labs, and monthly IV included. Newport Beach." />
        <meta name="twitter:image" content="https://www.range-medical.com/brand/range_logo_transparent_black.png" />

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
                "name": "Hormone Replacement Therapy",
                "alternateName": "HRT",
                "description": "Comprehensive hormone optimization including testosterone, estrogen, progesterone, and thyroid therapy with ongoing monitoring and support.",
                "url": "https://www.range-medical.com/hormone-optimization",
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
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="hrt-page">
        {/* Hero */}
        <section className="hrt-hero">
          <div className="v2-label"><span className="v2-dot" /> HORMONE OPTIMIZATION</div>
          <h1>TIRED, FOGGY, AND GAINING WEIGHT FOR NO REASON? IT&apos;S PROBABLY YOUR HORMONES.</h1>
          <div className="hrt-hero-rule" />
          <p className="hrt-body-text">We test what your regular doctor doesn&apos;t, find the imbalance, and fix it. Physician-supervised hormone optimization in Newport Beach.</p>
          <div className="hrt-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> What Is It</div>
              <h2>HORMONES CONTROL<br />HOW YOU FEEL<br />EVERY DAY.</h2>
              <p className="hrt-body-text">
                Hormone optimization is about restoring your hormones — testosterone, estrogen, progesterone, thyroid — to levels where your body functions best. When hormones decline or become imbalanced, you feel it: fatigue, brain fog, weight gain, low mood, poor sleep.
              </p>
              <p className="hrt-body-text" style={{ marginTop: '1rem' }}>
                HRT isn't about becoming superhuman. It's about getting back to how you're supposed to feel. At Range Medical in Newport Beach, we offer comprehensive hormone optimization with ongoing monitoring — all for one simple monthly price.
              </p>
            </div>

            <div className="hrt-stat-row">
              <div className="hrt-stat-item hrt-animate">
                <div className="hrt-stat-number">$250</div>
                <div className="hrt-stat-label">Per month, all-inclusive<br />No hidden fees</div>
              </div>
              <div className="hrt-stat-item hrt-animate">
                <div className="hrt-stat-number">2-4</div>
                <div className="hrt-stat-label">Weeks until most patients<br />feel noticeable improvement</div>
              </div>
              <div className="hrt-stat-item hrt-animate">
                <div className="hrt-stat-number">90+</div>
                <div className="hrt-stat-label">Patients optimized<br />at our Newport Beach clinic</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> Who It&apos;s For</div>
              <h2>YOUR LABS SAY<br />&ldquo;NORMAL&rdquo; BUT YOU<br />DON&apos;T FEEL NORMAL.</h2>
              <p className="hrt-body-text">
                Standard lab ranges are based on population averages — not optimal function. If any of these sound like you, hormone optimization at our Newport Beach clinic could help.
              </p>
            </div>

            <div className="hrt-tags-grid hrt-animate">
              {tags.map((tag, i) => (
                <div key={i} className="hrt-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Women's Hormone Health */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> Women&apos;s Hormone Health</div>
              <h2>HORMONE THERAPY<br />ISN&apos;T JUST<br />FOR MEN.</h2>
              <p className="hrt-body-text">
                Women experience hormone decline too &mdash; often earlier and more dramatically than they expect. Perimenopause can start in your late 30s, and by menopause, estrogen, progesterone, and testosterone have all dropped significantly. The symptoms are real, and they&apos;re treatable.
              </p>
            </div>

            <div className="hrt-women-symptoms hrt-animate">
              <div className="hrt-women-symptoms-label">Common symptoms in women</div>
              <div className="hrt-tags-grid-light">
                {womenSymptoms.map((symptom, i) => (
                  <div key={i} className="hrt-tag-pill-light">{symptom}</div>
                ))}
              </div>
            </div>

            <div className="hrt-life-stages hrt-animate">
              <div className="hrt-women-symptoms-label" style={{ marginTop: '3rem' }}>When it starts</div>
              {womenLifeStages.map((item, i) => (
                <div key={i} className="hrt-life-stage-item">
                  <div className="hrt-life-stage-age">{item.stage}</div>
                  <div className="hrt-life-stage-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Women's Medications */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> What We Prescribe</div>
              <h2>MEDICATIONS<br />TAILORED FOR<br />WOMEN.</h2>
              <p className="hrt-body-text">
                Every protocol is personalized based on your labs, symptoms, and goals. Here are the hormones we commonly optimize for women.
              </p>
            </div>

            <div className="hrt-women-meds-list">
              {womenMedications.map((med, i) => (
                <div key={i} className="hrt-women-med-item hrt-animate">
                  <div className="hrt-women-med-header">
                    <div className="hrt-women-med-name">{med.name}</div>
                    <div className="hrt-women-med-forms">{med.forms}</div>
                  </div>
                  <div className="hrt-women-med-desc">{med.desc}</div>
                </div>
              ))}
            </div>

            <div className="hrt-women-note hrt-animate">
              <p>All medications are included in the $250/month membership. Your provider will recommend the right combination based on your labs and how you feel &mdash; and adjust as needed over time.</p>
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> How It May Help</div>
              <h2>WHAT BALANCED<br />HORMONES CAN DO.</h2>
              <p className="hrt-body-text">
                When your hormones are optimized, your body works the way it's supposed to. Here's what patients typically experience.
              </p>
            </div>

            <div className="hrt-benefits-list">
              {benefits.map((benefit, i) => (
                <div key={i} className="hrt-benefit-item hrt-animate">
                  <div className="hrt-benefit-number">{benefit.number}</div>
                  <div className="hrt-benefit-content">
                    <div className="hrt-benefit-title">{benefit.title}</div>
                    <div className="hrt-benefit-desc">{benefit.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HRT Membership */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> HRT Membership</div>
              <h2>$250/MONTH.<br />EVERYTHING<br />INCLUDED.</h2>
              <p className="hrt-body-text">
                No surprise bills. No separate charges for follow-up labs or medications. One monthly price that covers everything you need for ongoing hormone optimization.
              </p>
            </div>

            <div className="hrt-membership-list">
              {membershipIncludes.map((item, i) => (
                <div key={i} className="hrt-membership-item hrt-animate">
                  <div className="hrt-membership-title"><span className="hrt-list-dash">&ndash;</span> {item.title}</div>
                  <div className="hrt-membership-desc">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="hrt-membership-compare hrt-animate">
              <p><strong>Typical cost elsewhere:</strong> $500-800+/month for separate medications, labs, and visits.</p>
              <p><strong>Range membership:</strong> $250/month — medications, monthly IV, follow-up labs, and provider access included. No contracts.</p>
            </div>
          </div>
        </section>

        {/* Results Timeline */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> What to Expect</div>
              <h2>WHEN YOU&apos;LL START<br />FEELING BETTER.</h2>
              <p className="hrt-body-text">
                Hormone optimization isn't instant — but it's not slow either. Here's the typical timeline most patients experience.
              </p>
            </div>

            <div className="hrt-timeline">
              {timeline.map((item, i) => (
                <div key={i} className="hrt-timeline-item hrt-animate">
                  <div className="hrt-timeline-period">{item.period}</div>
                  <div className="hrt-timeline-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="hrt-section" id="hrt-research">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> Backed by Science</div>
              <h2>EVIDENCE-BASED<br />RESULTS</h2>
              <p className="hrt-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="hrt-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="hrt-research-card hrt-animate"
                  onClick={() => window.location.href = '/research/' + study.id}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hrt-research-category">{study.category}</div>
                  <h3 className="hrt-research-headline">{study.headline}</h3>
                  <p className="hrt-research-summary">{study.summary}</p>
                  <p className="hrt-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="hrt-research-disclaimer hrt-animate">
              These studies reflect clinical research findings. Individual results may vary. Hormone therapy at Range Medical is provided under medical supervision with regular monitoring.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> Getting Started</div>
              <h2>YOUR FIRST VISIT,<br />STEP BY STEP.</h2>
              <p className="hrt-body-text">
                Getting started is simple. $197 assessment, credited toward treatment. Here&apos;s exactly what happens.
              </p>
            </div>

            <div className="hrt-expect-list">
              {steps.map((item, i) => (
                <div key={i} className="hrt-expect-item hrt-animate">
                  <div className="hrt-expect-step">{item.step}</div>
                  <div className="hrt-expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Transparency */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="hrt-divider"></div>
              <p className="hrt-body-text">
                Hormone therapy is safe when properly monitored — but you should know exactly what to expect, including what we watch for.
              </p>
            </div>

            <div className="hrt-safety-grid hrt-animate">
              <div className="hrt-safety-card">
                <div className="hrt-safety-label">Common Side Effects</div>
                <div className="hrt-safety-items">
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-icon">1</span>
                    <div>
                      <strong>Acne & Oily Skin</strong>
                      <p>Testosterone stimulates oil production. Usually mild and resolves within 2-3 months as your body adjusts.</p>
                    </div>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-icon">2</span>
                    <div>
                      <strong>Fluid Retention</strong>
                      <p>Temporary water retention in the first few weeks. Not fat gain — stabilizes as levels reach steady state.</p>
                    </div>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-icon">3</span>
                    <div>
                      <strong>Mood Changes</strong>
                      <p>Temporary irritability or emotional shifts as your brain adjusts to new hormone levels. Usually settles within 4-6 weeks.</p>
                    </div>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-icon">4</span>
                    <div>
                      <strong>Elevated Hematocrit</strong>
                      <p>Testosterone increases red blood cell production. We monitor this with regular bloodwork and adjust as needed.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hrt-safety-card hrt-safety-card-dark">
                <div className="hrt-safety-label">Who May Not Be a Candidate</div>
                <div className="hrt-safety-items">
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-warn">!</span>
                    <p>Active hormone-sensitive cancers (breast, prostate) or history of hormone-sensitive malignancy without clearance</p>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-warn">!</span>
                    <p>Untreated polycythemia (abnormally high red blood cell count)</p>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-warn">!</span>
                    <p>Severe untreated sleep apnea</p>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-warn">!</span>
                    <p>Active or recent blood clot (DVT/PE) without anticoagulation</p>
                  </div>
                  <div className="hrt-safety-item">
                    <span className="hrt-safety-warn">!</span>
                    <p>Pregnant or planning pregnancy (testosterone is contraindicated)</p>
                  </div>
                </div>
                <p className="hrt-safety-note">We review your full medical history and labs before starting any protocol. If there are concerns, we discuss them openly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> Real Results</div>
              <h2>WHAT LIFE LOOKS LIKE<br />AFTER OPTIMIZATION.</h2>
              <div className="hrt-divider" style={{ background: 'rgba(255,255,255,0.15)' }}></div>
              <p className="hrt-body-text">
                These are composite snapshots based on real patient outcomes. Names and identifying details are removed &mdash; the patterns are consistent.
              </p>
            </div>

            <div className="hrt-results-grid hrt-animate">
              <div className="hrt-result-card">
                <div className="hrt-result-profile">Male, 45</div>
                <div className="hrt-result-before">
                  <span className="hrt-result-label">Before</span>
                  Exhausted by 3pm every day. Brain fog so thick he couldn&apos;t focus through a meeting. Zero drive &mdash; at work or at home. Labs showed total testosterone at 280.
                </div>
                <div className="hrt-result-after">
                  <span className="hrt-result-label">After 3 months</span>
                  Energy back all day. Mental clarity sharp. Lost 12 lbs of fat. Sleeping through the night for the first time in years.
                </div>
              </div>
              <div className="hrt-result-card">
                <div className="hrt-result-profile">Male, 38</div>
                <div className="hrt-result-before">
                  <span className="hrt-result-label">Before</span>
                  Irritable with his family. Couldn&apos;t build muscle despite training 5x/week. Low libido affecting his relationship.
                </div>
                <div className="hrt-result-after">
                  <span className="hrt-result-label">After 4 months</span>
                  Mood stabilized. Putting on muscle again. Relationship improved. Says he feels like himself for the first time in years.
                </div>
              </div>
              <div className="hrt-result-card">
                <div className="hrt-result-profile">Female, 51</div>
                <div className="hrt-result-before">
                  <span className="hrt-result-label">Before</span>
                  Post-menopausal. Couldn&apos;t sleep more than 4 hours. Hot flashes 10x/day. Anxiety she&apos;d never experienced before.
                </div>
                <div className="hrt-result-after">
                  <span className="hrt-result-label">After 3 months</span>
                  Sleeping 7+ hours. Hot flashes gone. Mood calm and steady. Says she got her life back.
                </div>
              </div>
            </div>

            <div className="hrt-inaction hrt-animate">
              <div className="hrt-inaction-label">THE COST OF WAITING</div>
              <p>Testosterone declines roughly 1% per year after 30. Estrogen and progesterone shift dramatically during perimenopause. These aren&apos;t problems that resolve on their own &mdash; they compound. The fatigue gets worse. The weight gets harder to lose. The brain fog gets thicker. Starting sooner means less ground to make up.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>COMMON<br />QUESTIONS</h2>

            <div className="hrt-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`hrt-faq-item ${openFaq === index ? 'hrt-faq-open' : ''}`}>
                  <button className="hrt-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="hrt-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="hrt-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="hrt-section hrt-section-inverted hrt-cta-section">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> Next Steps</div>
              <h2 className="hrt-cta-title">IMAGINE HAVING<br />THE ENERGY AND DRIVE<br />YOU HAD 10 YEARS AGO.</h2>
              <p className="hrt-body-text" style={{ margin: '0 auto 2.5rem' }}>
                Waking up rested. Thinking clearly all day. Feeling strong in the gym and present at home. That&apos;s what optimized hormones feel like &mdash; and it&apos;s closer than you think. $197 assessment, credited toward treatment.
              </p>
              <div className="hrt-cta-buttons">
                <Link href="/assessment" className="hrt-btn-primary">Book Your Range Assessment</Link>
                <div className="hrt-cta-or">or</div>
                <a href="tel:9499973988" className="hrt-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== HRT PAGE V2 SCOPED STYLES ===== */
        .hrt-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .hrt-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.hrt-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .hrt-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .hrt-section {
          padding: 6rem 2rem;
        }

        .hrt-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .hrt-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines — V2: uppercase, weight 900, tight line-height */
        .hrt-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #171717;
        }

        .hrt-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }

        .hrt-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .hrt-section-inverted h1,
        .hrt-section-inverted h2,
        .hrt-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text — V2: #737373 */
        .hrt-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .hrt-section-inverted .hrt-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Buttons — V2: no border-radius, 11px, weight 700, uppercase */
        .hrt-btn-primary {
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
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .hrt-btn-primary:hover {
          background: #e0e0e0;
        }

        /* Hero — V2: left-aligned with rule between title and subtitle */
        .hrt-hero {
          padding: 4rem 2rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hrt-hero h1 {
          max-width: 680px;
          margin-bottom: 0;
        }

        .hrt-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.5rem 0;
        }

        .hrt-hero .hrt-body-text {
          margin: 0 0 2.5rem;
        }

        .hrt-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .hrt-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: hrt-bounce 2s ease-in-out infinite;
        }

        @keyframes hrt-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row — V2: accent color for numbers */
        .hrt-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .hrt-stat-item {
          text-align: center;
        }

        .hrt-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .hrt-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags — V2: no border-radius */
        .hrt-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .hrt-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .hrt-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Items — V2: hairline-separated list, not cards */
        .hrt-benefits-list {
          margin-top: 2.5rem;
        }

        .hrt-benefit-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .hrt-benefit-item:last-child {
          border-bottom: none;
        }

        .hrt-benefit-number {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 36px;
          letter-spacing: -0.02em;
        }

        .hrt-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
        }

        /* Membership Items — V2: hairline-separated list with en-dash */
        .hrt-membership-list {
          margin-top: 2.5rem;
        }

        .hrt-membership-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hrt-membership-item:last-child {
          border-bottom: none;
        }

        .hrt-list-dash {
          color: #808080;
          margin-right: 0.5rem;
          font-weight: 700;
        }

        .hrt-membership-title {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.375rem;
        }

        .hrt-membership-desc {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
          padding-left: 1.25rem;
        }

        .hrt-membership-compare {
          margin-top: 2.5rem;
          padding: 1.5rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }

        .hrt-membership-compare p {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .hrt-membership-compare p + p {
          margin-top: 0.5rem;
        }

        .hrt-membership-compare strong {
          color: #ffffff;
        }

        /* Timeline — V2: borders #e0e0e0, no border-radius on period badge */
        .hrt-timeline {
          margin-top: 2.5rem;
        }

        .hrt-timeline-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .hrt-timeline-item:last-child {
          border-bottom: none;
        }

        .hrt-timeline-period {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #808080;
          min-width: 80px;
          letter-spacing: 0.02em;
        }

        .hrt-timeline-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-timeline-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* Research Cards — V2: no border-radius, no box-shadow, hairline border */
        .hrt-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hrt-research-card {
          padding: 2rem;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .hrt-research-card:hover {
          border-color: #171717;
        }

        .hrt-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 0.875rem;
        }

        .hrt-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .hrt-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
          margin-bottom: 1rem;
        }

        .hrt-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .hrt-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Expect List — V2: gold step numbers */
        .hrt-expect-list {
          margin-top: 2.5rem;
        }

        .hrt-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .hrt-expect-item:last-child {
          border-bottom: none;
        }

        .hrt-expect-step {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 36px;
          letter-spacing: -0.02em;
        }

        .hrt-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-expect-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* FAQ — V2: accordion with +/- toggle, borders #e0e0e0 */
        .hrt-faq-list {
          max-width: 700px;
          margin-top: 2rem;
        }

        .hrt-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .hrt-faq-item:last-child {
          border-bottom: none;
        }

        .hrt-faq-question {
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

        .hrt-faq-question span:first-child {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .hrt-faq-toggle {
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
          transition: color 0.2s;
        }

        .hrt-faq-open .hrt-faq-toggle {
          color: #808080;
        }

        .hrt-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .hrt-faq-open .hrt-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .hrt-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .hrt-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .hrt-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .hrt-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .hrt-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .hrt-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .hrt-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Women's Symptoms */
        .hrt-women-symptoms {
          margin-top: 2.5rem;
        }

        .hrt-women-symptoms-label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 1rem;
        }

        .hrt-tags-grid-light {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
        }

        .hrt-tag-pill-light {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: 1px solid #e0e0e0;
          background: #fafafa;
          color: #171717;
          transition: all 0.2s ease;
        }

        .hrt-tag-pill-light:hover {
          border-color: #171717;
        }

        /* Life Stages */
        .hrt-life-stages {
          margin-top: 1rem;
        }

        .hrt-life-stage-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .hrt-life-stage-item:last-child {
          border-bottom: none;
        }

        .hrt-life-stage-age {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 50px;
          letter-spacing: -0.02em;
        }

        .hrt-life-stage-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-life-stage-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* Women's Medications */
        .hrt-women-meds-list {
          margin-top: 2.5rem;
        }

        .hrt-women-med-item {
          padding: 1.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hrt-women-med-item:last-child {
          border-bottom: none;
        }

        .hrt-women-med-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.5rem;
        }

        .hrt-women-med-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #ffffff;
        }

        .hrt-women-med-forms {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
        }

        .hrt-women-med-desc {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.7;
          max-width: 600px;
        }

        .hrt-women-note {
          margin-top: 2.5rem;
          padding: 1.5rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }

        .hrt-women-note p {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          margin: 0;
        }

        /* Safety & Transparency */
        .hrt-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .hrt-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .hrt-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .hrt-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .hrt-safety-card-dark .hrt-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .hrt-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hrt-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .hrt-safety-card-dark .hrt-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .hrt-safety-item:last-child {
          border-bottom: none;
        }
        .hrt-safety-icon {
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
        .hrt-safety-warn {
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
        .hrt-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .hrt-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .hrt-safety-card-dark .hrt-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .hrt-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .hrt-safety-guide-link {
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
        .hrt-safety-guide-link:hover {
          border-color: #171717;
        }
        .hrt-safety-guide-link span {
          transition: transform 0.2s;
        }
        .hrt-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .hrt-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Real Results */
        .hrt-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }
        .hrt-result-card {
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .hrt-result-card:last-child {
          border-right: none;
        }
        .hrt-result-profile {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }
        .hrt-result-before,
        .hrt-result-after {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .hrt-result-after {
          color: rgba(255,255,255,0.95);
        }
        .hrt-result-label {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.3);
        }
        .hrt-result-after .hrt-result-label {
          color: #4ade80;
        }
        .hrt-inaction {
          margin-top: 3rem;
          padding: 2rem 2.5rem;
          border-left: 3px solid rgba(255,255,255,0.15);
        }
        .hrt-inaction-label {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.75rem;
        }
        .hrt-inaction p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hrt-section,
          .hrt-section-alt {
            padding: 3rem 1.5rem;
          }

          .hrt-page h1 {
            font-size: 2rem;
          }

          .hrt-page h2 {
            font-size: 1.5rem;
          }

          .hrt-hero {
            padding: 3rem 1.5rem;
          }

          .hrt-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .hrt-research-grid {
            grid-template-columns: 1fr;
          }

          .hrt-timeline-item {
            flex-direction: column;
            gap: 0.75rem;
          }

          .hrt-timeline-period {
            align-self: flex-start;
          }

          .hrt-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hrt-benefit-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hrt-cta-title {
            font-size: 2rem;
          }

          .hrt-cta-buttons {
            flex-direction: column;
          }

          .hrt-life-stage-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hrt-women-med-header {
            flex-direction: column;
            gap: 0.25rem;
          }

          .hrt-safety-grid {
            grid-template-columns: 1fr;
          }
          .hrt-safety-guides {
            flex-direction: column;
          }
          .hrt-results-grid {
            grid-template-columns: 1fr;
          }
          .hrt-result-card {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem 0;
          }
          .hrt-result-card:last-child {
            border-bottom: none;
          }
          .hrt-inaction {
            padding: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
