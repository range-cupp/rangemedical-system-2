import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { getStudiesByService } from '../data/researchStudies';

export default function EnergyOptimization() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const studies = getStudiesByService('hormone-optimization');

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

    const sections = document.querySelectorAll('.eo-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };


  const faqs = [
    {
      question: "Do I need labs before my assessment?",
      answer: "No. Start with the $197 Range Assessment. During your visit, we'll discuss which lab panel makes sense for your situation and order it from there. No need to figure it out on your own."
    },
    {
      question: "What's the difference between Essential and Elite labs?",
      answer: "Essential covers hormones, thyroid, and metabolic basics. Elite goes deeper with inflammation markers, advanced thyroid, and longevity biomarkers. Your provider will recommend the right one at your assessment."
    },
    {
      question: "How soon will I feel better?",
      answer: "It depends on the treatment path. Most patients on hormone optimization notice improvements in energy and mood within 2\u20136 weeks. Weight loss patients typically see measurable results in the first month."
    },
    {
      question: "Do I have to commit to a monthly membership?",
      answer: "No. All memberships are month-to-month with no contracts. You can pause or cancel anytime. The $197 assessment credit applies toward your first month if you move forward."
    },
    {
      question: "Can I just get labs without treatment?",
      answer: "Yes. Some patients come just for comprehensive labs and a provider review. You're not obligated to start any program."
    },
    {
      question: "What if I also have an injury?",
      answer: "We can address both at your assessment. When you book, select 'Both' and we'll cover everything in one visit."
    }
  ];

  return (
    <>
      <Head>
        <title>Energy, Hormones & Weight Optimization | Range Medical | Newport Beach</title>
        <meta name="description" content="Feeling tired, foggy, or off? Start with a $197 Range Assessment at Range Medical in Newport Beach. We'll run the right labs, find the root cause, and build your plan." />
        <meta name="keywords" content="hormone optimization Newport Beach, low energy treatment, brain fog help, medical weight loss, testosterone therapy, thyroid optimization, peptide therapy, HRT" />
        <link rel="canonical" href="https://www.range-medical.com/energy-optimization" />

        <meta property="og:title" content="Energy, Hormones & Weight Optimization | Range Medical" />
        <meta property="og:description" content="Feeling tired, foggy, or off? Start with a $197 Range Assessment. We'll find the root cause and build your plan." />
        <meta property="og:url" content="https://www.range-medical.com/energy-optimization" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-home.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Energy, Hormones & Weight Optimization | Range Medical" />
        <meta name="twitter:description" content="Feeling tired, foggy, or off? Start with a $197 Range Assessment. We'll find the root cause and build your plan." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-home.jpg" />

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
              "description": "Medical wellness clinic specializing in hormone optimization, energy restoration, and medical weight loss.",
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
              <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
            </span>
            <span className="trust-item">Newport Beach, CA</span>
            <span className="trust-item">Board-Certified Providers</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="eo-hero">
          <div className="v2-label"><span className="v2-dot" /> Energy &middot; Hormones &middot; Weight</div>
          <h1>Your Guide to<br />Energy &amp;<br />Optimization</h1>
          <div className="eo-hero-rule" />
          <p className="eo-body-text">
            You&apos;re tired, foggy, or just don&apos;t feel like yourself. Your regular doctor says
            you&apos;re &ldquo;fine&rdquo; &mdash; but you know something&apos;s off. We dig deeper with
            real labs, find the root cause, and build a plan that actually works.
          </p>
          <div className="eo-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* Who It's For Section */}
        <section id="eo-symptoms" className={`eo-section-alt eo-animate ${isVisible['eo-symptoms'] ? 'eo-visible' : ''}`}>
          <div className="eo-container">
            <div className="v2-label"><span className="v2-dot" /> Who It&apos;s For</div>
            <h2>Sound Like<br />You?</h2>
            <p className="eo-section-intro">
              If any of these feel familiar, you&apos;re in the right place.
            </p>

            <div className="eo-signs-grid">
              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                </div>
                <h4>Always Tired</h4>
                <p>Exhausted even after a full night of sleep. Coffee barely makes a dent.</p>
              </div>

              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Brain Fog</h4>
                <p>Difficulty focusing, thinking clearly, or staying sharp through the day.</p>
              </div>

              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Weight Won&apos;t Budge</h4>
                <p>Diet and exercise aren&apos;t working like they used to. The scale won&apos;t move.</p>
              </div>

              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h4>Lost Your Edge</h4>
                <p>Motivation, drive, strength, or mood just feels lower than it used to be.</p>
              </div>

              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h4>Low Libido</h4>
                <p>Sex drive, performance, or interest has dropped noticeably.</p>
              </div>

              <div className="eo-sign-card">
                <div className="eo-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h4>&ldquo;Normal&rdquo; Labs</h4>
                <p>Your doctor says you&apos;re fine, but you don&apos;t feel fine. Standard labs miss a lot.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="eo-process" className={`eo-section eo-animate ${isVisible['eo-process'] ? 'eo-visible' : ''}`}>
          <div className="eo-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>From Assessment<br />to Answers</h2>
            <p className="eo-section-intro">
              Start with a $197 Range Assessment (credited toward treatment). Everything else flows from there.
            </p>

            <div className="eo-process-grid">
              <div className="eo-process-step">
                <div className="eo-process-number">01</div>
                <h4>Book Your Assessment</h4>
                <p>$197 Range Assessment. Meet with our team, discuss your symptoms and goals, and decide on the right lab panel together.</p>
              </div>

              <div className="eo-process-step">
                <div className="eo-process-number">02</div>
                <h4>Get Your Labs</h4>
                <p>Comprehensive blood work that goes beyond the basics &mdash; hormones, thyroid, metabolic markers, and more.</p>
              </div>

              <div className="eo-process-step">
                <div className="eo-process-number">03</div>
                <h4>Review Results</h4>
                <p>Your provider explains every number in plain language and recommends a personalized plan.</p>
              </div>

              <div className="eo-process-step">
                <div className="eo-process-number">04</div>
                <h4>Start Your Program</h4>
                <p>HRT, weight loss medication, peptides, IVs &mdash; whatever fits your situation. Ongoing monitoring and adjustments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Paths Section */}
        <section id="eo-paths" className={`eo-section-alt eo-animate ${isVisible['eo-paths'] ? 'eo-visible' : ''}`}>
          <div className="eo-container">
            <div className="v2-label"><span className="v2-dot" /> Treatment Paths</div>
            <h2>What We Can<br />Help With</h2>
            <p className="eo-section-intro">
              After your assessment and labs, your provider will recommend the right path. Here are the most common ones.
            </p>

            <div className="eo-tools-grid">
              <Link href="/hormone-optimization" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Hormone Optimization</h4>
                <p>Testosterone, thyroid, estrogen, progesterone &mdash; balanced hormones for energy, mood, and how you feel. $250/month membership.</p>
              </Link>

              <Link href="/weight-loss" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                </div>
                <h4>Medical Weight Loss</h4>
                <p>Tirzepatide, Semaglutide, or Retatrutide with labs and real medical support &mdash; not just a prescription.</p>
              </Link>

              <Link href="/peptide-therapy" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <h4>Peptide Therapy</h4>
                <p>Growth hormone peptides, recovery peptides, sleep peptides &mdash; targeted protocols for specific goals.</p>
              </Link>

              <Link href="/iv-therapy" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                </div>
                <h4>IV Therapy</h4>
                <p>Vitamins, minerals, and amino acids delivered directly to your bloodstream for immediate cellular support.</p>
              </Link>

              <Link href="/nad-therapy" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h4>NAD+ Therapy</h4>
                <p>Cellular energy at the deepest level. NAD+ supports mitochondrial function, brain clarity, and longevity.</p>
              </Link>

              <Link href="/lab-panels" className="eo-tool-card">
                <div className="eo-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h4>Comprehensive Labs</h4>
                <p>Essential ($350) or Elite ($750) panels that go far beyond standard bloodwork. Discussed at your assessment.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section id="eo-research" className={`eo-section eo-animate ${isVisible['eo-research'] ? 'eo-visible' : ''}`}>
          <div className="eo-container">
            <div className="v2-label"><span className="v2-dot" /> The Evidence</div>
            <h2>Research Behind<br />Optimization</h2>
            <p className="eo-section-intro">
              We&apos;ve summarized the peer-reviewed research. Click any study to get the full breakdown &mdash; free.
            </p>

            <div className="eo-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="eo-research-card"
                  onClick={() => window.location.href = '/research/' + study.id}
                >
                  <span className="eo-research-category">{study.category}</span>
                  <h4 className="eo-research-headline">{study.headline}</h4>
                  <p className="eo-research-summary">{study.summary}</p>
                  <p className="eo-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="eo-research-disclaimer">
              These studies reflect published research findings. Individual results may vary. All treatment at Range Medical is provided under licensed medical supervision.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="eo-faq" className={`eo-section-alt eo-animate ${isVisible['eo-faq'] ? 'eo-visible' : ''}`}>
          <div className="eo-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Common<br />Questions</h2>

            <div className="eo-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`eo-faq-item ${openFaq === index ? 'eo-faq-open' : ''}`}>
                  <button className="eo-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="eo-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="eo-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
        <section className="eo-section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="eo-container">
            <p style={{ fontSize: '0.8125rem', color: '#a3a3a3', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 700, margin: 0 }}>
              The information on this page is for educational purposes only and does not constitute medical advice for any specific condition or individual. All treatment decisions are made by a licensed provider after an in-person evaluation. Results vary by individual. Nothing on this page should be interpreted as a guarantee of outcomes or a recommendation to pursue any particular treatment.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="eo-section-inverted">
          <div className="eo-container">
            <div className="v2-label" style={{ justifyContent: 'center' }}><span className="v2-dot" /> Get Started</div>
            <h2>Ready to Find<br />Out What&apos;s Going On?</h2>
            <p className="eo-cta-text">
              Start with a $197 Range Assessment. We&apos;ll review your situation, discuss the right labs, and build your plan.
              If you move forward with treatment, the full $197 goes toward it.
            </p>
            <Link href="/range-assessment?path=energy" className="btn-white">Book Your $197 Range Assessment</Link>
            <p className="eo-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>


        <style jsx>{`
          /* Hero Section */
          .eo-body-text {
            font-size: 1.125rem;
            color: #737373;
            line-height: 1.75;
            max-width: 620px;
          }

          .eo-hero {
            padding: 6rem 2rem 7rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .eo-hero h1 {
            max-width: 800px;
            margin-bottom: 2rem;
          }

          .eo-hero-rule {
            width: 100%;
            max-width: 700px;
            height: 1px;
            background: #e0e0e0;
            margin: 2rem 0;
          }

          .eo-hero .eo-body-text {
            max-width: 520px;
          }

          .eo-hero-scroll {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #737373;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-top: 3rem;
          }

          .eo-hero-scroll span {
            display: block;
            margin-top: 0.75rem;
            font-size: 1.125rem;
            animation: eo-bounce 2s ease-in-out infinite;
          }

          @keyframes eo-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }

          /* Section Styles */
          .eo-section {
            padding: 6rem 2rem;
            background: #ffffff;
          }

          .eo-section-alt {
            padding: 6rem 2rem;
            background: #fafafa;
          }

          .eo-section-inverted {
            padding: 6rem 2rem;
            background: #1a1a1a;
            text-align: center;
          }

          .eo-section-inverted h2 {
            color: #ffffff;
          }

          .eo-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .eo-section-intro {
            font-size: 1.0625rem;
            color: #737373;
            line-height: 1.75;
            max-width: 600px;
            margin: 0 0 2.5rem;
          }

          /* Animation */
          .eo-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .eo-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Signs Grid */
          .eo-signs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .eo-sign-card {
            background: #ffffff;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            text-align: center;
            transition: background 0.2s;
          }

          .eo-sign-card:hover {
            background: #fafafa;
          }

          .eo-sign-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: #737373;
          }

          .eo-sign-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .eo-sign-card p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Process Grid */
          .eo-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .eo-process-step {
            text-align: center;
            padding: 2rem 1rem;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
          }

          .eo-process-number {
            font-size: 1.5rem;
            font-weight: 900;
            color: #808080;
            margin-bottom: 1rem;
          }

          .eo-process-step h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .eo-process-step p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* Tools Grid */
          .eo-tools-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .eo-tool-card {
            background: #ffffff;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            text-decoration: none;
            transition: background 0.2s;
          }

          .eo-tool-card:hover {
            background: #f5f5f5;
          }

          .eo-tool-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            color: #737373;
            transition: all 0.2s;
          }

          .eo-tool-card:hover .eo-tool-icon {
            background: #1a1a1a;
            color: #ffffff;
          }

          .eo-tool-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .eo-tool-card p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Research Grid */
          .eo-research-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .eo-research-card {
            background: #fafafa;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .eo-research-card:hover {
            background: #ffffff;
          }

          .eo-research-category {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #808080;
            margin-bottom: 0.875rem;
          }

          .eo-research-headline {
            font-size: 1.0625rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.75rem;
            line-height: 1.4;
          }

          .eo-research-summary {
            font-size: 0.875rem;
            line-height: 1.75;
            color: #737373;
            margin: 0 0 1rem;
          }

          .eo-research-source {
            font-size: 0.8125rem;
            font-style: italic;
            color: #737373;
            margin: 0;
          }

          .eo-research-disclaimer {
            font-size: 0.8125rem;
            color: #737373;
            text-align: center;
            max-width: 700px;
            margin: 3rem auto 0;
            line-height: 1.75;
          }

          /* FAQ */
          .eo-faq-list {
            max-width: 700px;
            margin: 2rem auto 0;
          }

          .eo-faq-item {
            border-bottom: 1px solid #e0e0e0;
          }

          .eo-faq-item:last-child {
            border-bottom: none;
          }

          .eo-faq-question {
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

          .eo-faq-question span {
            font-size: 1rem;
            font-weight: 600;
            color: #1a1a1a;
            padding-right: 1rem;
          }

          .eo-faq-toggle {
            flex-shrink: 0;
            font-size: 1.25rem;
            font-weight: 300;
            color: #737373;
            width: 24px;
            text-align: center;
          }

          .eo-faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
          }

          .eo-faq-open .eo-faq-answer {
            max-height: 300px;
            padding-bottom: 1.25rem;
          }

          .eo-faq-answer p {
            font-size: 0.9375rem;
            color: #737373;
            line-height: 1.75;
            margin: 0;
          }

          /* CTA Section */
          .eo-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 540px;
            margin: 0 auto 2rem;
            line-height: 1.75;
          }

          .eo-cta-location {
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
            .eo-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .eo-process-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .eo-tools-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .eo-research-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .eo-hero {
              padding: 4rem 1.5rem;
            }

            .eo-section {
              padding: 4rem 1.5rem;
            }

            .eo-section-alt {
              padding: 4rem 1.5rem;
            }

            .eo-section-inverted {
              padding: 4rem 1.5rem;
            }

            .eo-signs-grid {
              grid-template-columns: 1fr;
            }

            .eo-process-grid {
              grid-template-columns: 1fr;
            }

            .eo-tools-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
