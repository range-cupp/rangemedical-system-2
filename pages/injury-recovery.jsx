import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function InjuryRecovery() {
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
      answer: "Most orthopedic injuries — sprains, strains, tendon issues, ligament tears, post-surgical recovery, and chronic pain that's slow to heal. The online assessment will help confirm it's a good fit."
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
        <meta name="description" content="Speed up your injury recovery with targeted protocols including HBOT, red light therapy, peptides, and PRP. Start with a free Range Assessment in Newport Beach." />
        <meta name="keywords" content="injury recovery Newport Beach, sports injury treatment, HBOT injury recovery, red light therapy healing, peptide therapy recovery, PRP treatment, post-surgical recovery" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />

        <meta property="og:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta property="og:description" content="Speed up your injury recovery with targeted protocols. Start with a free Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta name="twitter:description" content="Speed up your injury recovery with targeted protocols. Start with a free Range Assessment." />
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
              <span className="trust-rating">★★★★★</span> 5.0 on Google
            </span>
            <span className="trust-item">📍 Newport Beach, CA</span>
            <span className="trust-item">✓ Licensed Providers</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="inj-hero">
          <div className="inj-kicker">Recovery · Healing · Results</div>
          <h1>Your Guide to Injury Recovery</h1>
          <p className="inj-body-text">
            Healing feels slow because your body needs more than time. We use targeted recovery
            protocols that may help support your body's natural healing process — whether you're post-surgery,
            rehabbing an injury, or stuck in a healing plateau.
          </p>
          <div className="inj-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="inj-conditions" className={`inj-section-alt inj-animate ${isVisible['inj-conditions'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <span className="inj-section-label">Who It's For</span>
            <h2>Injuries We Help With</h2>
            <p className="inj-section-intro">
              If healing feels slow or you've hit a plateau, our recovery protocols may help support your progress.
            </p>

            <div className="inj-conditions">
              <span className="inj-condition-tag">Sprains & Strains</span>
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
                <p>You're doing the rehab work but recovery is taking longer than expected.</p>
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
                <p>You improved at first but now you're stuck at the same level.</p>
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
            <span className="inj-section-label">How It Works</span>
            <h2>From Assessment to Recovery Plan</h2>
            <p className="inj-section-intro">
              Start with a free online assessment. We'll match you with the right recovery tools — no guesswork.
            </p>

            <div className="inj-process-grid">
              <div className="inj-process-step">
                <div className="inj-process-number">1</div>
                <h4>Take the Online Assessment</h4>
                <p>Answer a few questions about your injury, timeline, and recovery goals. Takes about 2 minutes.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">2</div>
                <h4>Get Your Recommendation</h4>
                <p>Based on your answers, we'll show you which recovery protocols fit your situation.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">3</div>
                <h4>Come In for Treatment</h4>
                <p>Visit our Newport Beach clinic to start your protocol. Your provider will refine the plan based on your progress.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">4</div>
                <h4>Track Your Progress</h4>
                <p>We monitor your recovery and adjust your protocol based on how you're responding.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recovery Tools Section */}
        <section id="inj-tools" className={`inj-section-alt inj-animate ${isVisible['inj-tools'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <span className="inj-section-label">Recovery Tools</span>
            <h2>How We Help You Heal Faster</h2>
            <p className="inj-section-intro">
              Your provider picks the right combination based on your injury. You don't have to figure it out yourself.
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
                <p>Cell-signaling molecules that may help support your body's natural repair signaling.</p>
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
            <span className="inj-section-label">The Evidence</span>
            <h2>Research Behind Recovery Protocols</h2>
            <p className="inj-section-intro">
              We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
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
            <span className="inj-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="inj-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`inj-faq-item ${openFaq === index ? 'inj-faq-open' : ''}`}>
                  <button className="inj-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="inj-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="inj-section-inverted">
          <div className="inj-container">
            <span className="inj-section-label-light">Get Started</span>
            <h2>Ready to Speed Up Your Recovery?</h2>
            <p className="inj-cta-text">
              Take the free online assessment. It takes 2 minutes and we'll show you exactly which recovery tools fit your situation.
            </p>
            <Link href="/range-assessment?path=injury" className="inj-btn-white">Take Assessment</Link>
            <p className="inj-cta-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Range Medical • 1901 Westcliff Dr, Newport Beach
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
          .inj-kicker {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #737373;
            margin-bottom: 1.25rem;
          }

          .inj-body-text {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            max-width: 620px;
          }

          .inj-hero {
            padding: 4rem 1.5rem 5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .inj-hero h1 {
            max-width: 680px;
            margin-bottom: 1.5rem;
          }

          .inj-hero .inj-body-text {
            text-align: center;
            margin: 0 auto 2.5rem;
          }

          .inj-hero-scroll {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #737373;
            display: flex;
            flex-direction: column;
            align-items: center;
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


          :global(.inj-btn-primary) {
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

          :global(.inj-btn-primary:hover) {
            background: #171717 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          /* Section Styles */
          .inj-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .inj-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .inj-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .inj-section-inverted h2 {
            color: #ffffff;
          }

          .inj-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .inj-section-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #737373;
            margin-bottom: 0.75rem;
          }

          .inj-section-label-light {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a3a3a3;
            margin-bottom: 0.75rem;
          }

          .inj-section h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .inj-section-alt h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .inj-section-intro {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
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
            justify-content: center;
            margin-bottom: 2.5rem;
          }

          .inj-condition-tag {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 100px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            color: #404040;
            font-weight: 500;
          }

          /* Signs Grid */
          .inj-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .inj-sign-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .inj-sign-card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .inj-sign-icon {
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

          .inj-sign-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .inj-sign-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Process Grid */
          .inj-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .inj-process-step {
            text-align: center;
            padding: 1rem;
          }

          .inj-process-number {
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

          .inj-process-step h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .inj-process-step p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Tools Grid */
          .inj-tools-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
          }

          .inj-tool-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .inj-tool-card:hover {
            border-color: #171717;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .inj-tool-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            color: #525252;
            transition: all 0.2s;
          }

          .inj-tool-card:hover .inj-tool-icon {
            background: #000000;
            color: #ffffff;
          }

          .inj-tool-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .inj-tool-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Research Grid */
          .inj-research-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }

          .inj-research-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .inj-research-card:hover {
            border-color: #171717;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
          }

          .inj-research-category {
            display: inline-block;
            font-size: 0.6875rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #16a34a;
            margin-bottom: 0.875rem;
          }

          .inj-research-headline {
            font-size: 1.0625rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.75rem;
            line-height: 1.4;
          }

          .inj-research-summary {
            font-size: 0.875rem;
            line-height: 1.7;
            color: #525252;
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
            line-height: 1.7;
          }

          /* FAQ */
          .inj-faq-list {
            max-width: 700px;
            margin: 0 auto;
          }

          .inj-faq-item {
            border-bottom: 1px solid #e5e5e5;
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
            color: #171717;
            padding-right: 1rem;
          }

          .inj-faq-question svg {
            flex-shrink: 0;
            color: #737373;
            transition: transform 0.2s;
          }

          .inj-faq-open .inj-faq-question svg {
            transform: rotate(180deg);
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
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* CTA Section */
          .inj-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.7;
          }

          :global(.inj-btn-white) {
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

          :global(.inj-btn-white:hover) {
            background: #f0f0f0 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
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
            .inj-trust-inner {
              flex-direction: column;
              gap: 0.5rem;
            }

            .inj-hero {
              padding: 3rem 1.5rem;
            }

            .inj-hero h1 {
              font-size: 2rem;
            }

            .inj-section h2,
            .inj-section-alt h2,
            .inj-section-inverted h2 {
              font-size: 1.75rem;
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
