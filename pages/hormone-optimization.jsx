// pages/hormone-optimization.jsx
// Hormone Optimization - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function HormoneOptimization() {
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
      answer: "Yes, when monitored by a licensed provider with regular labs. We check your levels at 6-8 weeks and then quarterly to ensure your protocol is optimized and safe. Side effects are rare and typically mild when hormones are properly dosed."
    },
    {
      question: "How soon will I feel better?",
      answer: "Most patients notice improvements in sleep and energy within the first 1-2 weeks. Mood and mental clarity typically improve by weeks 3-4. Full optimization — including body composition changes — develops over 3-6 months."
    },
    {
      question: "What's included in the $250/month membership?",
      answer: "Everything. All hormone medications (testosterone, estrogen, progesterone, thyroid, support meds), one custom IV per month ($225 value), all follow-up labs, and direct provider access via text or call. No hidden fees."
    },
    {
      question: "Do I need labs first?",
      answer: "Yes — we run comprehensive labs to understand your baseline and personalize your protocol. This is included in your membership after the initial assessment."
    },
    {
      question: "Is there a contract?",
      answer: "No. Our HRT membership is month-to-month. You can pause or cancel anytime with no penalties or fees."
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
    { period: "Week 6-8", title: "Measurable Changes", desc: "Lab work confirms optimization. Sexual function and mood improvements plateau." },
    { period: "Month 3-6", title: "Body Composition", desc: "Visible changes in muscle tone and body fat. Metabolic improvements measurable." },
    { period: "Month 6-12", title: "Full Optimization", desc: "Maximum benefits achieved: 3-8 lbs lean muscle, 3-6 lbs fat loss, sustained energy." }
  ];

  const steps = [
    { step: "Step 1", title: "Book your assessment", desc: "Start with a $199 Range Assessment. We'll discuss your symptoms, goals, and medical history to see if HRT is right for you." },
    { step: "Step 2", title: "Run comprehensive labs", desc: "We check testosterone, estrogen, thyroid, metabolic markers, and more — not just the basics your regular doctor runs." },
    { step: "Step 3", title: "Review & start protocol", desc: "Your provider explains your results and designs a personalized protocol. You start your $250/month membership." },
    { step: "Step 4", title: "Ongoing optimization", desc: "Follow-up labs at 6-8 weeks, then quarterly. We adjust your protocol as needed. Direct access to your provider anytime." }
  ];

  const membershipIncludes = [
    { icon: "💊", title: "All Medications", desc: "Testosterone, estrogen, progesterone, thyroid, and support meds — all included." },
    { icon: "💉", title: "Monthly IV Therapy", desc: "One custom IV infusion per month ($225 value) with vitamins tailored to you." },
    { icon: "🔬", title: "All Lab Work", desc: "Initial labs, 6-8 week follow-up, and quarterly monitoring — no extra charges." },
    { icon: "📱", title: "Direct Provider Access", desc: "Text or call your provider directly. No waiting for appointments for simple questions." }
  ];

  const researchStudies = [
    {
      category: "ENERGY & FATIGUE",
      headline: "Significant Improvement in Fatigue Symptoms",
      summary: "A meta-analysis of 27 randomized controlled trials found that testosterone therapy significantly improved fatigue symptoms in men with low testosterone, with effects seen as early as 4 weeks into treatment.",
      source: "Journal of Clinical Endocrinology & Metabolism, 2018"
    },
    {
      category: "BODY COMPOSITION",
      headline: "Increased Lean Mass, Decreased Fat Mass",
      summary: "A systematic review of 59 studies found that testosterone therapy increased lean body mass by an average of 3-5 kg and decreased fat mass by 2-3 kg over 6-12 months in men with low testosterone.",
      source: "Endocrine Reviews, 2018"
    },
    {
      category: "COGNITIVE FUNCTION",
      headline: "Improved Verbal Memory and Spatial Ability",
      summary: "A randomized controlled trial showed that testosterone therapy improved verbal memory and spatial ability in older men with low testosterone levels over a 12-month period.",
      source: "JAMA Internal Medicine, 2017"
    },
    {
      category: "MOOD & DEPRESSION",
      headline: "Reduced Depressive Symptoms",
      summary: "A meta-analysis of 27 randomized controlled trials found that testosterone treatment significantly reduced depressive symptoms, particularly in men with baseline low testosterone and mild depression.",
      source: "JAMA Psychiatry, 2019"
    },
    {
      category: "BONE HEALTH",
      headline: "Increased Bone Mineral Density",
      summary: "The Testosterone Trials found that one year of testosterone treatment significantly increased volumetric bone mineral density and estimated bone strength in older men with low testosterone.",
      source: "JAMA Internal Medicine, 2017"
    },
    {
      category: "CARDIOVASCULAR",
      headline: "No Increased Cardiovascular Risk",
      summary: "A large randomized controlled trial (TRAVERSE) of over 5,000 men found that testosterone replacement therapy did not increase the incidence of major cardiovascular events compared to placebo.",
      source: "New England Journal of Medicine, 2023"
    }
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
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hormone Optimization & HRT | Newport Beach | Range Medical" />
        <meta name="twitter:description" content="$250/month all-inclusive HRT membership. Medications, labs, and monthly IV included. Newport Beach." />
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
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      <div className="hrt-page">
        {/* Hero */}
        <section className="hrt-hero">
          <div className="hrt-kicker">Energy · Clarity · Vitality</div>
          <h1>Your Guide to Hormone Optimization</h1>
          <p className="hrt-body-text">Everything you need to know about hormone replacement therapy — how it works, what to expect, and why it might help you feel like yourself again.</p>
          <div className="hrt-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="hrt-kicker">What Is It</div>
              <h2>Hormones control how you feel every day.</h2>
              <div className="hrt-divider"></div>
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
              <div className="hrt-kicker">Who It's For</div>
              <h2>Your labs say "normal" but you don't feel normal.</h2>
              <div className="hrt-divider"></div>
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

        {/* How It May Help */}
        <section className="hrt-section">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="hrt-kicker">How It May Help</div>
              <h2>What balanced hormones can do.</h2>
              <div className="hrt-divider"></div>
              <p className="hrt-body-text">
                When your hormones are optimized, your body works the way it's supposed to. Here's what patients typically experience.
              </p>
            </div>

            <div className="hrt-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="hrt-benefit-card hrt-animate">
                  <div className="hrt-benefit-number">{benefit.number}</div>
                  <div className="hrt-benefit-title">{benefit.title}</div>
                  <div className="hrt-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HRT Membership */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="hrt-kicker">HRT Membership</div>
              <h2>$250/month. Everything included.</h2>
              <div className="hrt-divider"></div>
              <p className="hrt-body-text">
                No surprise bills. No separate charges for labs or medications. One monthly price that covers everything you need for proper hormone optimization.
              </p>
            </div>

            <div className="hrt-membership-grid">
              {membershipIncludes.map((item, i) => (
                <div key={i} className="hrt-membership-card hrt-animate">
                  <div className="hrt-membership-icon">{item.icon}</div>
                  <div className="hrt-membership-title">{item.title}</div>
                  <div className="hrt-membership-desc">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="hrt-membership-compare hrt-animate">
              <p><strong>Typical cost elsewhere:</strong> $500-800+/month for separate medications, IVs, labs, and visits.</p>
              <p><strong>Range membership:</strong> $250/month, all-inclusive. No contracts.</p>
            </div>
          </div>
        </section>

        {/* Results Timeline */}
        <section className="hrt-section hrt-section-alt">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="hrt-kicker">What to Expect</div>
              <h2>When you'll start feeling better.</h2>
              <div className="hrt-divider"></div>
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
              <div className="hrt-kicker">Backed by Science</div>
              <h2>What the Research Says</h2>
              <div className="hrt-divider"></div>
              <p className="hrt-body-text">
                Hormone replacement therapy has been studied extensively. Here's what the evidence shows.
              </p>
            </div>

            <div className="hrt-research-grid">
              {researchStudies.map((study, i) => (
                <div key={i} className="hrt-research-card hrt-animate">
                  <div className="hrt-research-category">{study.category}</div>
                  <h3 className="hrt-research-headline">{study.headline}</h3>
                  <p className="hrt-research-summary">{study.summary}</p>
                  <p className="hrt-research-source">{study.source}</p>
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
              <div className="hrt-kicker">Getting Started</div>
              <h2>Your first visit, step by step.</h2>
              <div className="hrt-divider"></div>
              <p className="hrt-body-text">
                Getting started is simple. Here's exactly what happens.
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

        {/* FAQ */}
        <section className="hrt-section hrt-section-inverted">
          <div className="hrt-container">
            <div className="hrt-animate">
              <div className="hrt-kicker">Common Questions</div>
              <h2>Everything you might be wondering.</h2>
              <div className="hrt-divider"></div>
            </div>

            <div className="hrt-faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`hrt-faq-item ${openFaq === i ? 'open' : ''}`}
                  onClick={() => toggleFaq(i)}
                >
                  <div className="hrt-faq-question">
                    {faq.question}
                    <span className="hrt-faq-toggle">+</span>
                  </div>
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
              <div className="hrt-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="hrt-cta-title">Ready to feel like yourself again?</h2>
              <p className="hrt-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a $199 Range Assessment. We'll review your symptoms, run comprehensive labs, and build a plan. Our Newport Beach team is here to help.
              </p>
              <div className="hrt-cta-buttons">
                <Link href="/book?reason=energy" className="hrt-btn-primary">Book Your Assessment</Link>
                <div className="hrt-cta-or">or</div>
                <a href="tel:9499973988" className="hrt-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== HRT PAGE SCOPED STYLES ===== */
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
          padding: 4rem 1.5rem;
        }

        .hrt-section-alt {
          background: #fafafa;
        }

        .hrt-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .hrt-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .hrt-section-inverted .hrt-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .hrt-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .hrt-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
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

        /* Body Text */
        .hrt-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .hrt-section-inverted .hrt-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .hrt-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .hrt-section-inverted .hrt-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .hrt-btn-primary {
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

        .hrt-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .hrt-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hrt-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .hrt-hero .hrt-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
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

        /* Stat Row */
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
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .hrt-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
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
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .hrt-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Cards */
        .hrt-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hrt-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hrt-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .hrt-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .hrt-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .hrt-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Membership Cards */
        .hrt-membership-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hrt-membership-card {
          padding: 1.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.2s ease;
        }

        .hrt-membership-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .hrt-membership-icon {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .hrt-membership-title {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .hrt-membership-desc {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
        }

        .hrt-membership-compare {
          margin-top: 2.5rem;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
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

        /* Timeline */
        .hrt-timeline {
          margin-top: 2.5rem;
        }

        .hrt-timeline-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .hrt-timeline-item:last-child {
          border-bottom: none;
        }

        .hrt-timeline-period {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #171717;
          min-width: 80px;
          letter-spacing: 0.02em;
          background: #e5e5e5;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          text-align: center;
        }

        .hrt-timeline-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-timeline-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Research Cards */
        .hrt-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hrt-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hrt-research-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .hrt-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7c3aed;
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
          color: #525252;
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

        /* Expect List */
        .hrt-expect-list {
          margin-top: 2.5rem;
        }

        .hrt-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .hrt-expect-item:last-child {
          border-bottom: none;
        }

        .hrt-expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .hrt-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hrt-expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .hrt-faq-list {
          margin-top: 2.5rem;
        }

        .hrt-faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }

        .hrt-faq-item:last-child {
          border-bottom: none;
        }

        .hrt-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .hrt-faq-toggle {
          font-size: 1.25rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .hrt-faq-item.open .hrt-faq-toggle {
          transform: rotate(45deg);
        }

        .hrt-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }

        .hrt-faq-item.open .hrt-faq-answer {
          max-height: 300px;
          padding-top: 1rem;
          opacity: 1;
        }

        .hrt-faq-answer p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.8;
        }

        .hrt-faq-item.open .hrt-faq-question {
          color: #ffffff;
        }

        /* CTA Section */
        .hrt-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .hrt-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
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

        /* Responsive */
        @media (max-width: 768px) {
          .hrt-section {
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

          .hrt-benefits-grid {
            grid-template-columns: 1fr;
          }

          .hrt-membership-grid {
            grid-template-columns: 1fr;
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

          .hrt-cta-title {
            font-size: 2rem;
          }

          .hrt-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
