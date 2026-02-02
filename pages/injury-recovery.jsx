import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function InjuryRecovery() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});

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

  const faqs = [
    {
      question: "Do I need to be a patient at Range Sports Therapy?",
      answer: "No. Anyone with an injury can book a Recovery Assessment. Many people are referred from Range Sports Therapy, but you can also book directly with us."
    },
    {
      question: "Does this replace my physical therapy or rehab?",
      answer: "No. Our programs support and accelerate the recovery work you're already doing with your PT, chiropractor, or trainer. We work alongside your existing care team."
    },
    {
      question: "Will I need labs or blood work?",
      answer: "Usually not. Most recovery programs don't require lab work to get started. Your provider will let you know if any testing would be helpful for your situation."
    },
    {
      question: "What kinds of injuries does this help with?",
      answer: "Most orthopedic injuries — sprains, strains, tendon issues, ligament tears, post-surgical recovery, and chronic pain that's slow to heal. We'll confirm it's a good fit at your Assessment."
    },
    {
      question: "How quickly will I see results?",
      answer: "Many patients notice improvements within the first 1-2 weeks, though this varies based on injury severity and treatment protocol. Your provider will give you realistic expectations at your Assessment."
    },
    {
      question: "What if I also want help with energy or hormones?",
      answer: "We can discuss that at your Assessment. If energy optimization is your main concern, you might want to start with the Energy & Optimization pathway instead, or we can address both."
    }
  ];

  const researchStudies = [
    {
      title: "Hyperbaric Oxygen for Soft Tissue Healing",
      journal: "Journal of Athletic Training, 2020",
      finding: "HBOT significantly accelerated soft tissue healing and reduced recovery time in athletes with acute injuries."
    },
    {
      title: "Photobiomodulation for Tendon Repair",
      journal: "Lasers in Medical Science, 2019",
      finding: "Red light therapy at 660nm wavelength improved collagen synthesis and tendon healing by up to 30%."
    },
    {
      title: "Peptide Therapy in Tissue Regeneration",
      journal: "Growth Factors, 2021",
      finding: "Targeted peptide protocols showed significant improvements in tissue repair markers and functional recovery outcomes."
    },
    {
      title: "PRP for Musculoskeletal Injuries",
      journal: "American Journal of Sports Medicine, 2020",
      finding: "Platelet-rich plasma injections demonstrated superior outcomes compared to standard care for chronic tendon injuries."
    },
    {
      title: "Combined Modality Recovery Protocols",
      journal: "Sports Medicine, 2022",
      finding: "Multi-modal recovery approaches combining oxygen therapy, light therapy, and regenerative treatments produced faster return-to-activity times."
    },
    {
      title: "IV Nutrient Support for Healing",
      journal: "Nutrients, 2021",
      finding: "Targeted IV nutrient delivery improved tissue repair markers and reduced inflammatory markers in post-injury patients."
    }
  ];

  return (
    <>
      <Head>
        <title>Your Guide to Injury Recovery | Range Medical | Newport Beach</title>
        <meta name="description" content="Speed up your injury recovery with targeted protocols including HBOT, red light therapy, peptides, and PRP. Start with a $199 Range Assessment in Newport Beach." />
        <meta name="keywords" content="injury recovery Newport Beach, sports injury treatment, HBOT injury recovery, red light therapy healing, peptide therapy recovery, PRP treatment, post-surgical recovery" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />

        <meta property="og:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta property="og:description" content="Speed up your injury recovery with targeted protocols. Start with a $199 Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to Injury Recovery | Range Medical" />
        <meta name="twitter:description" content="Speed up your injury recovery with targeted protocols. Start with a $199 Range Assessment." />
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
        <div className="inj-trust-bar">
          <div className="inj-trust-inner">
            <span className="inj-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>5.0 on Google</span>
            </span>
            <span className="inj-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Newport Beach, California</span>
            </span>
            <span className="inj-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Licensed Providers</span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="inj-hero">
          <div className="inj-hero-inner">
            <span className="inj-category">Recovery Programs</span>
            <h1>Your Guide to Injury Recovery</h1>
            <p className="inj-hero-sub">
              Healing feels slow because your body needs more than time. We use targeted recovery
              protocols to help you get back to normal faster — whether you're post-surgery,
              rehabbing an injury, or stuck in a healing plateau.
            </p>
            <div className="inj-hero-stats">
              <div className="inj-stat">
                <span className="inj-stat-value">$199</span>
                <span className="inj-stat-label">Assessment Fee</span>
              </div>
              <div className="inj-stat">
                <span className="inj-stat-value">30</span>
                <span className="inj-stat-label">Minute Visit</span>
              </div>
              <div className="inj-stat">
                <span className="inj-stat-value">100%</span>
                <span className="inj-stat-label">Credited to Program</span>
              </div>
            </div>
            <div className="inj-hero-cta">
              <Link href="/book?reason=injury" className="inj-btn-primary">Book Assessment — $199</Link>
            </div>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="inj-conditions" className={`inj-section-alt inj-animate ${isVisible['inj-conditions'] ? 'inj-visible' : ''}`}>
          <div className="inj-container">
            <span className="inj-section-label">Who It's For</span>
            <h2>Injuries We Help With</h2>
            <p className="inj-section-intro">
              If healing feels slow or you've hit a plateau, our recovery protocols can help accelerate your progress.
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
            <span className="inj-section-label">Your Visit</span>
            <h2>What Happens at Your Assessment</h2>
            <p className="inj-section-intro">
              A focused 30-minute visit to understand your injury and build the right recovery plan.
            </p>

            <div className="inj-process-grid">
              <div className="inj-process-step">
                <div className="inj-process-number">1</div>
                <h4>Review Your Injury</h4>
                <p>We go over your injury history, current rehab, imaging, and goals for getting back to normal.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">2</div>
                <h4>Assess Key Movements</h4>
                <p>We look at how the injured area responds and identify what might be slowing your recovery.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">3</div>
                <h4>Discuss Your History</h4>
                <p>We talk through what you've already tried and what has or hasn't helped.</p>
              </div>

              <div className="inj-process-step">
                <div className="inj-process-number">4</div>
                <h4>Build Your Protocol</h4>
                <p>Your provider recommends the right recovery tools based on your injury, timeline, and goals.</p>
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
                <p>Pressurized oxygen floods injured tissues with healing support, reducing inflammation and accelerating repair.</p>
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
                <p>Specific wavelengths stimulate cellular repair, improve collagen production, and reduce pain.</p>
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
                <p>Targeted peptides support tissue repair, reduce inflammation, and help your body heal itself.</p>
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
                <p>Cell-signaling molecules that communicate repair instructions to damaged tissue.</p>
              </Link>

              <Link href="/iv-therapy" className="inj-tool-card">
                <div className="inj-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>IV Therapy</h4>
                <p>Direct nutrient delivery supports healing from the inside with vitamins, minerals, and amino acids.</p>
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
              Our approach is built on peer-reviewed research demonstrating the effectiveness of these recovery tools.
            </p>

            <div className="inj-research-grid">
              {researchStudies.map((study, index) => (
                <div key={index} className="inj-research-card">
                  <h4>{study.title}</h4>
                  <span className="inj-research-journal">{study.journal}</span>
                  <p>{study.finding}</p>
                </div>
              ))}
            </div>
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
              Book your Range Assessment. If you move forward with a program, the $199 is credited toward it.
            </p>
            <Link href="/book?reason=injury" className="inj-btn-white">Book Assessment — $199</Link>
            <p className="inj-cta-location">
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
          .inj-trust-bar {
            background: #000000;
            padding: 1rem 1.5rem;
          }

          .inj-trust-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 2.5rem;
            flex-wrap: wrap;
          }

          .inj-trust-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #ffffff;
            font-weight: 500;
          }

          /* Hero Section */
          .inj-hero {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            padding: 5rem 1.5rem;
          }

          .inj-hero-inner {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .inj-category {
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

          .inj-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            margin: 0 0 1.25rem;
          }

          .inj-hero-sub {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            margin: 0 0 2.5rem;
            max-width: 650px;
            margin-left: auto;
            margin-right: auto;
          }

          .inj-hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-bottom: 2.5rem;
          }

          .inj-stat {
            text-align: center;
          }

          .inj-stat-value {
            display: block;
            font-size: 2.5rem;
            font-weight: 700;
            color: #171717;
            line-height: 1;
          }

          .inj-stat-label {
            font-size: 0.8125rem;
            color: #737373;
            margin-top: 0.375rem;
            display: block;
          }

          .inj-hero-cta {
            margin-bottom: 1rem;
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
            color: #0891b2;
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
          }

          .inj-research-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.375rem;
          }

          .inj-research-journal {
            font-size: 0.8125rem;
            color: #0891b2;
            font-weight: 500;
            display: block;
            margin-bottom: 0.75rem;
          }

          .inj-research-card p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
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

            .inj-hero h1 {
              font-size: 2rem;
            }

            .inj-hero-stats {
              flex-direction: column;
              gap: 1.5rem;
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
