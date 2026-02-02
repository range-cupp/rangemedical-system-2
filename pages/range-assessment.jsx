import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function RangeAssessment() {
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

    const sections = document.querySelectorAll('.ra-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Do I need labs before my Assessment?",
      answer: "No. Bring them if you have recent ones, but we can discuss whether labs would help during your visit. Many patients start without any labs."
    },
    {
      question: "What's the difference between this and Injury Recovery?",
      answer: "Injury Recovery focuses on healing a specific injury faster. This Assessment is for energy, hormones, weight, and overall optimization — how you feel day to day."
    },
    {
      question: "How does the $199 credit work?",
      answer: "Your Assessment fee is credited toward any program you start within 30 days — labs, peptides, hormones, whatever makes sense for you."
    },
    {
      question: "What if I'm not sure which Assessment I need?",
      answer: "Book whichever feels closest to your main concern. Your provider can always adjust the conversation based on what you share."
    },
    {
      question: "How long until I see results?",
      answer: "It depends on your situation. Some patients notice changes within days, others within a few weeks. Your provider will give you realistic expectations based on your specific plan."
    },
    {
      question: "Is this covered by insurance?",
      answer: "We don't bill insurance directly, but we can provide documentation for you to submit for potential reimbursement. Many HSA/FSA accounts cover our services."
    }
  ];

  return (
    <>
      <Head>
        <title>Your Guide to the Range Assessment | Range Medical | Newport Beach</title>
        <meta name="description" content="A 30-minute visit to understand your symptoms and build a clear plan. $199, credited toward any program. Energy, hormones, weight, and optimization." />
        <meta name="keywords" content="Range Assessment, wellness consultation Newport Beach, energy optimization, hormone testing, fatigue treatment, brain fog help, low energy doctor" />
        <link rel="canonical" href="https://www.range-medical.com/range-assessment" />

        <meta property="og:title" content="Your Guide to the Range Assessment | Range Medical" />
        <meta property="og:description" content="A 30-minute visit to understand your symptoms and build a clear plan. $199, credited toward any program." />
        <meta property="og:url" content="https://www.range-medical.com/range-assessment" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-assessment.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Guide to the Range Assessment | Range Medical" />
        <meta name="twitter:description" content="A 30-minute visit to understand your symptoms and build a clear plan. $199, credited toward any program." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-assessment.jpg" />

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
              "description": "Medical wellness clinic specializing in energy optimization and health assessment.",
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
              "name": "Range Assessment",
              "description": "Comprehensive health assessment for energy optimization, hormone balance, and wellness planning.",
              "medicineSystem": "Western conventional medicine",
              "relevantSpecialty": "Integrative medicine"
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
        <div className="ra-trust-bar">
          <div className="ra-trust-inner">
            <span className="ra-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>5.0 on Google</span>
            </span>
            <span className="ra-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Newport Beach, California</span>
            </span>
            <span className="ra-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Licensed Providers</span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="ra-hero">
          <div className="ra-hero-inner">
            <span className="ra-category">Energy & Optimization</span>
            <h1>Your Guide to the Range Assessment</h1>
            <p className="ra-hero-sub">
              A real conversation with a provider who listens. Understand what's going on,
              connect your symptoms to a plan, and leave with clear next steps — not a
              "wait and see" answer.
            </p>
            <div className="ra-hero-stats">
              <div className="ra-stat">
                <span className="ra-stat-value">$199</span>
                <span className="ra-stat-label">Assessment Fee</span>
              </div>
              <div className="ra-stat">
                <span className="ra-stat-value">30</span>
                <span className="ra-stat-label">Minute Visit</span>
              </div>
              <div className="ra-stat">
                <span className="ra-stat-value">100%</span>
                <span className="ra-stat-label">Credited to Program</span>
              </div>
            </div>
            <div className="ra-hero-cta">
              <Link href="/book?reason=energy" className="ra-btn-primary">Book Assessment — $199</Link>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section id="ra-who" className={`ra-section-alt ra-animate ${isVisible['ra-who'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">Who It's For</span>
            <h2>Is This You?</h2>
            <p className="ra-section-intro">
              If any of these sound familiar, the Range Assessment is a good place to start.
            </p>

            <div className="ra-signs-grid">
              <div className="ra-sign-card">
                <div className="ra-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                </div>
                <h4>Running on Caffeine</h4>
                <p>You rely on coffee or energy drinks just to get through your day.</p>
              </div>

              <div className="ra-sign-card">
                <div className="ra-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h4>Normal Labs, Still Tired</h4>
                <p>Your doctor says everything looks fine, but you know something's off.</p>
              </div>

              <div className="ra-sign-card">
                <div className="ra-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <h4>Brain Fog & Focus Issues</h4>
                <p>Your sleep, mood, or mental clarity is off and you can't figure out why.</p>
              </div>

              <div className="ra-sign-card">
                <div className="ra-sign-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10"/>
                    <path d="M18 20V4"/>
                    <path d="M6 20v-4"/>
                  </svg>
                </div>
                <h4>Want a Real Plan</h4>
                <p>You want a long-term approach to hormones, weight, or energy — not guesswork.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="ra-process" className={`ra-section ra-animate ${isVisible['ra-process'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">Your Visit</span>
            <h2>What Happens at Your Assessment</h2>
            <p className="ra-section-intro">
              A real conversation — not a rushed 10-minute appointment.
            </p>

            <div className="ra-process-grid">
              <div className="ra-process-step">
                <div className="ra-process-number">1</div>
                <h4>Review Your History</h4>
                <p>We go through your symptoms, health history, and what you've already tried. Bring any recent labs if you have them.</p>
              </div>

              <div className="ra-process-step">
                <div className="ra-process-number">2</div>
                <h4>Discuss Your Goals</h4>
                <p>What does "feeling better" mean for you? Energy? Sleep? Focus? Weight? We want to understand the full picture.</p>
              </div>

              <div className="ra-process-step">
                <div className="ra-process-number">3</div>
                <h4>Explain Your Options</h4>
                <p>Based on what we learn, we'll explain what might help and why. Labs if useful. Programs tailored to your situation.</p>
              </div>

              <div className="ra-process-step">
                <div className="ra-process-number">4</div>
                <h4>Build Your Plan</h4>
                <p>You leave with clear next steps. Your $199 is credited toward any program you choose.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section id="ra-included" className={`ra-section-alt ra-animate ${isVisible['ra-included'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">What's Included</span>
            <h2>Your Assessment Includes</h2>

            <div className="ra-included-box">
              <div className="ra-included-price-section">
                <div className="ra-included-price">$199</div>
                <div className="ra-included-duration">30-minute visit</div>
                <div className="ra-included-credit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Credited toward any program
                </div>
              </div>
              <div className="ra-included-list-section">
                <ul className="ra-included-list">
                  <li>One-on-one consultation with a provider</li>
                  <li>Full review of symptoms and history</li>
                  <li>Discussion of your health goals</li>
                  <li>Personalized recommendations</li>
                  <li>Clear next steps before you leave</li>
                  <li>Lab recommendations when helpful</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="ra-tools" className={`ra-section ra-animate ${isVisible['ra-tools'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">What Might Come Next</span>
            <h2>Tools We May Recommend</h2>
            <p className="ra-section-intro">
              Your provider picks the right combination based on your situation. You don't have to figure it out yourself.
            </p>

            <div className="ra-tools-grid">
              <Link href="/hormone-optimization" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Hormone Optimization</h4>
                <p>Balanced hormones for energy, mood, and how you feel every day.</p>
              </Link>

              <Link href="/weight-loss" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10"/>
                    <path d="M18 20V4"/>
                    <path d="M6 20v-4"/>
                  </svg>
                </div>
                <h4>Medical Weight Loss</h4>
                <p>Medical support for weight, appetite, and metabolism.</p>
              </Link>

              <Link href="/peptide-therapy" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <h4>Peptide Therapy</h4>
                <p>Targeted peptides for recovery, energy, and longevity.</p>
              </Link>

              <Link href="/iv-therapy" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v6l3 3-3 3v8"/>
                    <path d="M8 8l4 4-4 4"/>
                  </svg>
                </div>
                <h4>IV Therapy</h4>
                <p>Vitamins and nutrients delivered directly to your bloodstream.</p>
              </Link>

              <Link href="/hyperbaric-oxygen-therapy" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Hyperbaric Oxygen</h4>
                <p>More oxygen to your cells to support healing and clarity.</p>
              </Link>

              <Link href="/cellular-energy-reset" className="ra-tool-card">
                <div className="ra-tool-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h4>Cellular Energy Reset</h4>
                <p>Jump-start your energy at the cellular level.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="ra-testimonials" className={`ra-section-alt ra-animate ${isVisible['ra-testimonials'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">Results</span>
            <h2>What Our Patients Say</h2>

            <div className="ra-testimonials-grid">
              <div className="ra-testimonial-card">
                <div className="ra-testimonial-stars">★★★★★</div>
                <blockquote>
                  "I was skeptical, but after the Assessment I finally understood why I'd been so tired.
                  Six weeks later I feel like myself again."
                </blockquote>
                <cite>— Sarah M., Newport Beach</cite>
              </div>

              <div className="ra-testimonial-card">
                <div className="ra-testimonial-stars">★★★★★</div>
                <blockquote>
                  "No pushy sales, just real conversation. They helped me connect the dots between my
                  symptoms and gave me a clear plan."
                </blockquote>
                <cite>— Michael R., Costa Mesa</cite>
              </div>

              <div className="ra-testimonial-card">
                <div className="ra-testimonial-stars">★★★★★</div>
                <blockquote>
                  "The team takes time to actually listen. This is what healthcare should feel like."
                </blockquote>
                <cite>— Jennifer K., Irvine</cite>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="ra-faq" className={`ra-section ra-animate ${isVisible['ra-faq'] ? 'ra-visible' : ''}`}>
          <div className="ra-container">
            <span className="ra-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="ra-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`ra-faq-item ${openFaq === index ? 'ra-faq-open' : ''}`}>
                  <button className="ra-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="ra-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="ra-section-inverted">
          <div className="ra-container">
            <span className="ra-section-label-light">Get Started</span>
            <h2>Ready to Understand What's Going On?</h2>
            <p className="ra-cta-text">
              Book your Range Assessment. One visit to connect your symptoms to a plan.
            </p>
            <Link href="/book?reason=energy" className="ra-btn-white">Book Assessment — $199</Link>
            <p className="ra-cta-location">
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
          .ra-trust-bar {
            background: #000000;
            padding: 1rem 1.5rem;
          }

          .ra-trust-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 2.5rem;
            flex-wrap: wrap;
          }

          .ra-trust-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #ffffff;
            font-weight: 500;
          }

          /* Hero Section */
          .ra-hero {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            padding: 5rem 1.5rem;
          }

          .ra-hero-inner {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .ra-category {
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

          .ra-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            margin: 0 0 1.25rem;
          }

          .ra-hero-sub {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            margin: 0 0 2.5rem;
            max-width: 650px;
            margin-left: auto;
            margin-right: auto;
          }

          .ra-hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-bottom: 2.5rem;
          }

          .ra-stat {
            text-align: center;
          }

          .ra-stat-value {
            display: block;
            font-size: 2.5rem;
            font-weight: 700;
            color: #171717;
            line-height: 1;
          }

          .ra-stat-label {
            font-size: 0.8125rem;
            color: #737373;
            margin-top: 0.375rem;
            display: block;
          }

          .ra-hero-cta {
            margin-bottom: 1rem;
          }

          :global(.ra-btn-primary) {
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

          :global(.ra-btn-primary:hover) {
            background: #171717 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          /* Section Styles */
          .ra-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .ra-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .ra-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .ra-section-inverted h2 {
            color: #ffffff;
          }

          .ra-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .ra-section-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #0891b2;
            margin-bottom: 0.75rem;
          }

          .ra-section-label-light {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a3a3a3;
            margin-bottom: 0.75rem;
          }

          .ra-section h2,
          .ra-section-alt h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .ra-section-intro {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 600px;
            margin: 0 0 2.5rem;
          }

          /* Animation */
          .ra-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .ra-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Signs Grid */
          .ra-signs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .ra-sign-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .ra-sign-card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .ra-sign-icon {
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

          .ra-sign-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .ra-sign-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Process Grid */
          .ra-process-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }

          .ra-process-step {
            text-align: center;
            padding: 1rem;
          }

          .ra-process-number {
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

          .ra-process-step h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .ra-process-step p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.6;
            margin: 0;
          }

          /* Included Box */
          .ra-included-box {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 2rem;
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 16px;
            padding: 2.5rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .ra-included-price-section {
            text-align: center;
            padding-right: 2rem;
            border-right: 1px solid #e5e5e5;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .ra-included-price {
            font-size: 3rem;
            font-weight: 700;
            color: #171717;
            line-height: 1;
            margin-bottom: 0.25rem;
          }

          .ra-included-duration {
            font-size: 1rem;
            color: #737373;
            margin-bottom: 1rem;
          }

          .ra-included-credit {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: #ecfdf5;
            border: 1px solid #6ee7b7;
            color: #065f46;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.8125rem;
            font-weight: 600;
          }

          .ra-included-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .ra-included-list li {
            position: relative;
            padding-left: 1.5rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.9375rem;
            color: #404040;
            border-bottom: 1px solid #f5f5f5;
          }

          .ra-included-list li:last-child {
            border-bottom: none;
          }

          .ra-included-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #000000;
            font-weight: 700;
          }

          /* Tools Grid */
          .ra-tools-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
          }

          :global(.ra-tool-card) {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          :global(.ra-tool-card:hover) {
            border-color: #171717;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .ra-tool-icon {
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

          :global(.ra-tool-card:hover) .ra-tool-icon {
            background: #000000;
            color: #ffffff;
          }

          :global(.ra-tool-card) h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          :global(.ra-tool-card) p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          /* Testimonials Grid */
          .ra-testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .ra-testimonial-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
          }

          .ra-testimonial-stars {
            color: #000000;
            font-size: 1rem;
            letter-spacing: 2px;
            margin-bottom: 0.75rem;
          }

          .ra-testimonial-card blockquote {
            font-size: 0.9375rem;
            color: #404040;
            line-height: 1.7;
            margin: 0 0 1rem 0;
            font-style: normal;
          }

          .ra-testimonial-card cite {
            font-size: 0.875rem;
            font-weight: 600;
            color: #171717;
            font-style: normal;
          }

          /* FAQ */
          .ra-faq-list {
            max-width: 700px;
            margin: 0 auto;
          }

          .ra-faq-item {
            border-bottom: 1px solid #e5e5e5;
          }

          .ra-faq-item:last-child {
            border-bottom: none;
          }

          .ra-faq-question {
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

          .ra-faq-question span {
            font-size: 1rem;
            font-weight: 600;
            color: #171717;
            padding-right: 1rem;
          }

          .ra-faq-question svg {
            flex-shrink: 0;
            color: #737373;
            transition: transform 0.2s;
          }

          .ra-faq-open .ra-faq-question svg {
            transform: rotate(180deg);
          }

          .ra-faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease, padding 0.3s ease;
          }

          .ra-faq-open .ra-faq-answer {
            max-height: 300px;
            padding-bottom: 1.25rem;
          }

          .ra-faq-answer p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* CTA Section */
          .ra-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            max-width: 500px;
            margin: 0 auto 2rem;
            line-height: 1.7;
          }

          :global(.ra-btn-white) {
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

          :global(.ra-btn-white:hover) {
            background: #f0f0f0 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
          }

          .ra-cta-location {
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
            .ra-signs-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .ra-process-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .ra-tools-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .ra-testimonials-grid {
              grid-template-columns: 1fr;
            }

            .ra-included-box {
              grid-template-columns: 1fr;
              text-align: center;
            }

            .ra-included-price-section {
              padding-right: 0;
              border-right: none;
              padding-bottom: 1.5rem;
              border-bottom: 1px solid #e5e5e5;
            }
          }

          @media (max-width: 640px) {
            .ra-trust-inner {
              flex-direction: column;
              gap: 0.5rem;
            }

            .ra-hero h1 {
              font-size: 2rem;
            }

            .ra-hero-stats {
              flex-direction: column;
              gap: 1.5rem;
            }

            .ra-section h2,
            .ra-section-alt h2,
            .ra-section-inverted h2 {
              font-size: 1.75rem;
            }

            .ra-signs-grid {
              grid-template-columns: 1fr;
            }

            .ra-process-grid {
              grid-template-columns: 1fr;
            }

            .ra-tools-grid {
              grid-template-columns: 1fr;
            }

            .ra-included-box {
              padding: 1.5rem;
            }

            .ra-included-price {
              font-size: 2.5rem;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
