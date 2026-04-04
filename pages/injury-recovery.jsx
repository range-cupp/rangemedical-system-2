import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function InjuryRecovery() {
  const router = useRouter();
  const fromStart = router.query.from === 'start';
  const assessmentLink = '/range-assessment';

  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('injury-recovery');

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

    const sections = document.querySelectorAll('.inj-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleResearchClick = (studyId) => {
    const study = studies.find(s => s.id === studyId);
    if (study) {
      setSelectedStudy(study);
      setIsModalOpen(true);
    }
  };

  const faqs = [
    {
      question: "Do I need a referral to get started?",
      answer: "No. Anyone with an injury can take the online assessment and book treatment. Many patients are referred from physical therapists and chiropractors, but you can also come to us directly."
    },
    {
      question: "Does this replace my physical therapy or rehab?",
      answer: "No. Our programs are designed to support the recovery work you're already doing with your PT, chiropractor, or trainer. We work alongside your existing care team."
    },
    {
      question: "Will I need labs or blood work?",
      answer: "Usually not. Most recovery programs don't require lab work to get started. Your provider will let you know if any testing would be helpful for your situation."
    },
    {
      question: "What kinds of injuries does this help with?",
      answer: "Most orthopedic injuries \u2014 sprains, strains, tendon issues, ligament tears, post-surgical recovery, and chronic pain that's slow to heal. The online assessment will help confirm it's a good fit."
    },
    {
      question: "How quickly will I see results?",
      answer: "Recovery timelines vary by individual and injury type. Your provider will give you realistic expectations at your first visit."
    },
    {
      question: "What if I also want help with energy or hormones?",
      answer: "We can discuss that at your first visit. If energy optimization is your main concern, you might want to start with the Energy & Optimization pathway instead, or we can address both."
    }
  ];

  return (
    <>
      <Head>
        <title>Your Guide to Injury Recovery | Range Medical | Newport Beach</title>
        <meta name="description" content="Speed up your injury recovery with targeted protocols including HBOT, red light therapy, peptides, and PRP. Start with a $197 Range Assessment at Range Medical in Newport Beach." />
        <meta name="keywords" content="injury recovery Newport Beach, sports injury treatment, HBOT injury recovery, red light therapy healing, peptide therapy recovery, PRP treatment, post-surgical recovery" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />

        <meta property="og:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta property="og:description" content="Speed up your injury recovery with targeted protocols. Start with a $197 Range Assessment at Range Medical." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta name="twitter:description" content="Speed up your injury recovery with targeted protocols. Start with a $197 Range Assessment at Range Medical." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />

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
              "description": "Medical wellness clinic specializing in injury recovery and regenerative therapies.",
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
              "@type": "MedicalTherapy",
              "name": "Injury Recovery Program",
              "description": "Comprehensive injury recovery protocols combining hyperbaric oxygen therapy, red light therapy, peptide therapy, and regenerative treatments.",
              "medicineSystem": "Western conventional medicine",
              "relevantSpecialty": "Sports medicine"
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
        <section className="inj-hero">
          <div className="v2-label"><span className="v2-dot" /> Recovery &middot; Healing &middot; Results</div>
          <h1>Your Guide to<br />Injury Recovery</h1>
          <div className="inj-hero-rule" />
          <p className="inj-body-text">
            Healing feels slow because your body needs more than time. We use targeted recovery
            protocols that may help support your body&apos;s natural healing process &mdash; whether you&apos;re post-surgery,
            rehabbing an injury, or stuck in a healing plateau.
          </p>
          <div className="inj-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="inj-conditions" className={`inj-section-alt inj-animate ${isVisible['inj-conditions'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <div className="v2-label"><span className="v2-dot" /> Who It&apos;s For</div>
            <h2>Injuries We<br />Help With</h2>
            <p className="inj-section-intro">
              If healing feels slow or you&apos;ve hit a plateau, our recovery protocols may help support your progress.
            </p>

            <div className="inj-conditions">
              <span className="inj-condition-tag">Sprains &amp; Strains</span>
              <span className="inj-condition-tag">Tendon Injuries</span>
              <span className="inj-condition-tag">Ligament Tears</span>
              <span className="inj-condition-tag">Post-Surgical Recovery</span>
              <span className="inj-condition-tag">Muscle Tears</span>
              <span className="inj-condition-tag">Joint Injuries</span>
              <span className="inj-condition-tag">Chronic Pain</span>
              <span className="inj-condition-tag">Sports Injuries</span>
            </div>

            <div className="inj-signs-grid">
              <div className="inj-sign-card">
                <div className="inj-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Progress Feels Slow</h4>
                <p>You&apos;re doing the rehab work but recovery is taking longer than expected.</p>
              </div>

              <div className="inj-sign-card">
                <div className="inj-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Pain Keeps Returning</h4>
                <p>Swelling, pain, or tightness keeps coming back between therapy sessions.</p>
              </div>

              <div className="inj-sign-card">
                <div className="inj-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                </div>
                <h4>Hit a Plateau</h4>
                <p>You improved at first but now you&apos;re stuck at the same level.</p>
              </div>

              <div className="inj-sign-card">
                <div className="inj-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h4>Want to Get Back Faster</h4>
                <p>You need to return to work, sport, or life sooner than standard timelines.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="inj-process" className={`inj-section inj-animate ${isVisible['inj-process'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>From Assessment<br />to Recovery Plan</h2>
            <p className="inj-section-intro">
              Start with a $197 Range Assessment (credited toward treatment). We&apos;ll learn about your situation so your provider can determine the best approach during your visit.
            </p>

            <div className="inj-process-grid">
              <div className="inj-process-step">
                <div className="inj-process-number">01</div>
                <h4>Start Online</h4>
                <p>Answer a few questions about what you&apos;re dealing with and your recovery goals. Takes about 2 minutes.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">02</div>
                <h4>Learn About Your Options</h4>
                <p>We&apos;ll share general information about recovery tools that may be worth exploring with a provider.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">03</div>
                <h4>Meet with a Provider</h4>
                <p>Visit our Newport Beach clinic for an in-person evaluation. Your provider will assess your situation and discuss what makes sense for you.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">04</div>
                <h4>Follow-Up &amp; Progress</h4>
                <p>If treatment is recommended, your provider will monitor your progress and make adjustments as needed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recovery Tools Section */}
        <section id="inj-tools" className={`inj-section-alt inj-animate ${isVisible['inj-tools'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <div className="v2-label"><span className="v2-dot" /> Recovery Tools</div>
            <h2>Recovery Tools<br />We Offer</h2>
            <p className="inj-section-intro">
              These are some of the tools our providers may consider during your evaluation. What&apos;s right for you depends on your specific situation.
            </p>

            <div className="inj-tools-grid">
              <Link href="/hyperbaric-oxygen-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Hyperbaric Oxygen</h4>
                <p>Pressurized oxygen floods injured tissues with healing support, which may help reduce inflammation and support tissue repair.</p>
              </Link>

              <Link href="/red-light-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  </svg>
                </div>
                <h4>Red Light Therapy</h4>
                <p>Specific wavelengths may help stimulate cellular repair, support collagen production, and reduce discomfort.</p>
              </Link>

              <Link href="/peptide-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <h4>Peptide Therapy</h4>
                <p>Targeted peptides may support tissue repair and help manage inflammation.</p>
              </Link>

              <Link href="/prp-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                </div>
                <h4>PRP Therapy</h4>
                <p>Your own concentrated platelets deliver growth factors directly to damaged tissue.</p>
              </Link>

              <Link href="/exosome-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8"/>
                  </svg>
                </div>
                <h4>Exosome Therapy</h4>
                <p>Cell-signaling molecules that may help support your body&apos;s natural repair signaling.</p>
              </Link>

              <Link href="/iv-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>IV Therapy</h4>
                <p>Direct nutrient delivery may support recovery from the inside with vitamins, minerals, and amino acids.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section id="inj-research" className={`inj-section inj-animate ${isVisible['inj-research'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <div className="v2-label"><span className="v2-dot" /> The Evidence</div>
            <h2>Research Behind<br />Recovery Protocols</h2>
            <p className="inj-section-intro">
              We&apos;ve summarized the peer-reviewed research. Click any study to get the full breakdown &mdash; free.
            </p>

            <div className="inj-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="inj-research-card"
                  onClick={() => handleResearchClick(study.id)}
                >
                  <span className="inj-research-category">{study.category}</span>
                  <h4 className="inj-research-headline">{study.headline}</h4>
                  <p className="inj-research-summary">{study.summary}</p>
                  <p className="inj-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="inj-research-disclaimer">
              These studies reflect published research findings. Individual results may vary. Recovery protocols at Range Medical are provided under licensed medical supervision.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="inj-faq" className={`inj-section-alt inj-animate ${isVisible['inj-faq'] ? 'inj-visible' : ''}`}>
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

        {/* Medical Disclaimer */}
        <section className="inj-section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="inj-container">
            <p style={{ fontSize: '0.8125rem', color: '#a3a3a3', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 700, margin: 0 }}>
              The information on this page is for educational purposes only and does not constitute medical advice for any specific condition or individual. All treatment decisions are made by a licensed provider after an in-person evaluation. Results vary by individual. Nothing on this page should be interpreted as a guarantee of outcomes or a recommendation to pursue any particular treatment.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="inj-section-inverted">
          <div className="inj-container">
            <div className="v2-label" style={{ justifyContent: 'center' }}><span className="v2-dot" /> Get Started</div>
            <h2>Ready to Explore<br />Your Options?</h2>
            <p className="inj-cta-text">
              Take the online assessment. It takes 2 minutes and helps our team understand your situation before your visit.
            </p>
            <Link href={assessmentLink} className="btn-white">Book Your $197 Range Assessment</Link>
            <p className="inj-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="injury-recovery"
        />

        <style jsx>{`
          /* Hero Section */
          .inj-body-text {
            font-size: 1.125rem;
            color: #737373;
            line-height: 1.75;
            max-width: 620px;
          }

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
            display: flex;
            flex-direction: column;
            align-items: flex-start;
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

          /* Section Styles */
          .inj-section {
            padding: 6rem 2rem;
            background: #ffffff;
          }

          .inj-section-alt {
            padding: 6rem 2rem;
            background: #fafafa;
          }

          .inj-section-inverted {
            padding: 6rem 2rem;
            background: #1a1a1a;
            text-align: center;
          }

          .inj-section-inverted h2 {
            color: #ffffff;
          }

          .inj-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .inj-section-intro {
            font-size: 1.0625rem;
            color: #737373;
            line-height: 1.75;
            max-width: 600px;
            margin: 0 0 2.5rem;
          }

          /* Animation */
          .inj-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .inj-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Conditions Tags */
          .inj-conditions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 2.5rem;
          }

          .inj-condition-tag {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            color: #404040;
            font-weight: 500;
          }

          /* Signs Grid */
          .inj-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .inj-sign-card {
            background: #ffffff;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            text-align: center;
            transition: background 0.2s;
          }

          .inj-sign-card:hover {
            background: #fafafa;
          }

          .inj-sign-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: #737373;
          }

          .inj-sign-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .inj-sign-card p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Process Grid */
          .inj-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .inj-process-step {
            text-align: center;
            padding: 2rem 1rem;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
          }

          .inj-process-number {
            font-size: 1.5rem;
            font-weight: 900;
            color: #808080;
            margin-bottom: 1rem;
          }

          .inj-process-step h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .inj-process-step p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.6;
            margin: 0;
          }

          /* Tools Grid */
          .inj-tools-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .inj-tool-card {
            background: #ffffff;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            text-decoration: none;
            transition: background 0.2s;
          }

          .inj-tool-card:hover {
            background: #f5f5f5;
          }

          .inj-tool-icon {
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

          .inj-tool-card:hover .inj-tool-icon {
            background: #1a1a1a;
            color: #ffffff;
          }

          .inj-tool-card h4 {
            font-size: 1rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.5rem;
          }

          .inj-tool-card p {
            font-size: 0.875rem;
            color: #737373;
            line-height: 1.5;
            margin: 0;
          }

          /* Research Grid */
          .inj-research-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
            border-top: 1px solid #e0e0e0;
            border-left: 1px solid #e0e0e0;
          }

          .inj-research-card {
            background: #fafafa;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 1.75rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .inj-research-card:hover {
            background: #ffffff;
          }

          .inj-research-category {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #808080;
            margin-bottom: 0.875rem;
          }

          .inj-research-headline {
            font-size: 1.0625rem;
            font-weight: 800;
            color: #1a1a1a;
            margin: 0 0 0.75rem;
            line-height: 1.4;
          }

          .inj-research-summary {
            font-size: 0.875rem;
            line-height: 1.75;
            color: #737373;
            margin: 0 0 1rem;
          }

          .inj-research-source {
            font-size: 0.8125rem;
            font-style: italic;
            color: #737373;
            margin: 0;
          }

          .inj-research-disclaimer {
            font-size: 0.8125rem;
            color: #737373;
            text-align: center;
            max-width: 700px;
            margin: 3rem auto 0;
            line-height: 1.75;
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
          .inj-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.75;
          }

          .inj-cta-location {
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
            .inj-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .inj-process-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .inj-tools-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .inj-research-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .inj-hero {
              padding: 4rem 1.5rem;
            }

            .inj-section {
              padding: 4rem 1.5rem;
            }

            .inj-section-alt {
              padding: 4rem 1.5rem;
            }

            .inj-section-inverted {
              padding: 4rem 1.5rem;
            }

            .inj-signs-grid {
              grid-template-columns: 1fr;
            }

            .inj-process-grid {
              grid-template-columns: 1fr;
            }

            .inj-tools-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
