import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
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

    const sections = document.querySelectorAll('.home-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  return (
    <>
      <Head>
        <title>Range Medical | Newport Beach Wellness & Recovery Clinic</title>
        <meta name="description" content="Two ways to feel like yourself again. Range Medical in Newport Beach offers injury recovery and energy optimization programs. Start with a $199 Range Assessment." />
        <meta name="keywords" content="wellness clinic Newport Beach, injury recovery, low energy treatment, brain fog help, hormone optimization, medical weight loss, peptide therapy, PRP therapy, IV therapy" />
        <link rel="canonical" href="https://www.range-medical.com/" />

        <meta property="og:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta property="og:description" content="Two ways to feel like yourself again. Injury recovery or energy optimization. Start with a $199 Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-home.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta name="twitter:description" content="Two ways to feel like yourself again. Start with a $199 Range Assessment." />
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
              "description": "Medical wellness clinic specializing in injury recovery and health optimization in Newport Beach, California.",
              "url": "https://www.range-medical.com",
              "telephone": "+1-949-997-3988",
              "email": "info@range-medical.com",
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
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              },
              "priceRange": "$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "50",
                "bestRating": "5"
              },
              "sameAs": [
                "https://www.instagram.com/rangemedical",
                "https://www.facebook.com/rangemedical"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Range Medical",
              "url": "https://www.range-medical.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.range-medical.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>

      <Layout>
        {/* Trust Bar */}
        <div className="home-trust-bar">
          <div className="home-trust-inner">
            <span className="home-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>5.0 on Google</span>
            </span>
            <span className="home-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Newport Beach, CA</span>
            </span>
            <span className="home-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Evidence-Based Care</span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero-inner">
            <h1>Two Ways to Feel Like Yourself Again</h1>
            <p className="home-hero-sub">
              Start with a Range Assessment for your biggest concern — injury recovery or low energy.
              One visit, one plan, $199 to start.
            </p>
            <div className="home-hero-buttons">
              <Link href="/book?reason=injury" className="home-btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>Injury & Recovery</span>
                <span className="home-btn-price">$199</span>
              </Link>
              <Link href="/book?reason=energy" className="home-btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Energy & Optimization</span>
                <span className="home-btn-price">$199</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Two Doors Section */}
        <section id="home-doors" className={`home-section-alt home-animate ${isVisible['home-doors'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <span className="home-section-label">How It Works</span>
            <h2>Two Doors, One Goal: Help You Feel Better</h2>
            <p className="home-section-intro">
              Pick the door that matches your main concern. Both start with a $199 Range Assessment.
            </p>

            <div className="home-doors-grid">
              <div className="home-door-card">
                <div className="home-door-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h3>Injury & Recovery</h3>
                <p>You're rehabbing an injury and healing feels slow. You want to speed things up.</p>
                <ul className="home-door-list">
                  <li>Review your injury and rehab history</li>
                  <li>Discuss recovery timeline and goals</li>
                  <li>Get a clear protocol recommendation</li>
                  <li>$199 credited toward your program</li>
                </ul>
                <Link href="/book?reason=injury" className="home-door-btn">
                  Book Assessment
                </Link>
              </div>

              <div className="home-door-card home-door-featured">
                <span className="home-door-badge">Most Popular</span>
                <div className="home-door-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3>Energy & Optimization</h3>
                <p>You're tired, foggy, or just don't feel like yourself. You want answers and a plan.</p>
                <ul className="home-door-list">
                  <li>Connect symptoms to root causes</li>
                  <li>Review labs if you have them</li>
                  <li>Get a personalized program</li>
                  <li>$199 credited toward treatment</li>
                </ul>
                <Link href="/book?reason=energy" className="home-door-btn">
                  Book Assessment
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="home-services" className={`home-section home-animate ${isVisible['home-services'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <span className="home-section-label">What We Offer</span>
            <h2>Tools We Use to Help You Feel Better</h2>
            <p className="home-section-intro">
              Your provider picks the right tools for your situation. You don't have to figure it out yourself.
            </p>

            <div className="home-services-grid">
              <Link href="/hyperbaric-oxygen-therapy" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Hyperbaric Oxygen</h4>
                <p>More oxygen to your cells to support healing and energy.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>

              <Link href="/red-light-therapy" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                </div>
                <h4>Red Light Therapy</h4>
                <p>Light wavelengths that help cells recover and function better.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>

              <Link href="/iv-therapy" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                </div>
                <h4>IV Therapy</h4>
                <p>Vitamins and nutrients delivered directly to your bloodstream.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>

              <Link href="/hormone-optimization" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h4>Hormone Optimization</h4>
                <p>Balanced hormones for energy, mood, and how you feel.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>

              <Link href="/weight-loss" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                </div>
                <h4>Medical Weight Loss</h4>
                <p>Medical support for weight, appetite, and metabolism.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>

              <Link href="/peptide-therapy" className="home-service-card">
                <div className="home-service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/>
                    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
                  </svg>
                </div>
                <h4>Peptide Therapy</h4>
                <p>Targeted peptides for recovery, performance, and longevity.</p>
                <span className="home-service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="home-testimonials" className={`home-section-alt home-animate ${isVisible['home-testimonials'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <span className="home-section-label">Results</span>
            <h2>What Our Patients Say</h2>

            <div className="home-testimonials-grid">
              <div className="home-testimonial-card">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <blockquote>
                  "I was skeptical, but after the Assessment I finally understood why I'd been so tired.
                  Six weeks later I feel like myself again."
                </blockquote>
                <cite>— Sarah M., Newport Beach</cite>
              </div>

              <div className="home-testimonial-card">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <blockquote>
                  "My shoulder was taking forever to heal. The recovery protocol got me back to training
                  weeks faster than I expected."
                </blockquote>
                <cite>— Michael R., Costa Mesa</cite>
              </div>

              <div className="home-testimonial-card">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <blockquote>
                  "Clear communication, no pressure, and a plan that actually made sense.
                  This is what healthcare should be."
                </blockquote>
                <cite>— Jennifer K., Irvine</cite>
              </div>
            </div>

            <div className="home-testimonials-cta">
              <Link href="/reviews" className="home-btn-outline">Read More Reviews</Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="home-section-inverted">
          <div className="home-container">
            <h2>Ready to Feel Like Yourself Again?</h2>
            <p className="home-cta-text">
              Pick the door that fits your situation. Both start with a $199 Range Assessment.
            </p>
            <div className="home-cta-buttons">
              <Link href="/book?reason=injury" className="home-btn-white">
                Injury & Recovery
              </Link>
              <Link href="/book?reason=energy" className="home-btn-outline-white">
                Energy & Optimization
              </Link>
            </div>
            <p className="home-cta-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Range Medical • 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>

        <style jsx>{`
          /* Trust Bar */
          .home-trust-bar {
            background: #fafafa;
            border-bottom: 1px solid #e5e5e5;
            padding: 0.75rem 1.5rem;
          }

          .home-trust-inner {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
          }

          .home-trust-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #525252;
            font-weight: 500;
          }

          .home-trust-item svg {
            color: #171717;
          }

          /* Hero Section */
          .home-hero {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            padding: 5rem 1.5rem;
          }

          .home-hero-inner {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .home-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            margin: 0 0 1.25rem;
          }

          .home-hero-sub {
            font-size: 1.125rem;
            color: #525252;
            line-height: 1.7;
            margin: 0 0 2.5rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }

          .home-hero-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .home-btn-primary,
          .home-btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 0.625rem;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9375rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .home-btn-primary {
            background: #000000;
            color: #ffffff;
          }

          .home-btn-primary:hover {
            background: #333333;
          }

          .home-btn-secondary {
            background: #ffffff;
            color: #171717;
            border: 1px solid #e5e5e5;
          }

          .home-btn-secondary:hover {
            border-color: #171717;
          }

          .home-btn-price {
            padding-left: 0.625rem;
            border-left: 1px solid rgba(255,255,255,0.3);
            margin-left: 0.25rem;
          }

          .home-btn-secondary .home-btn-price {
            border-color: #e5e5e5;
          }

          /* Section Styles */
          .home-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .home-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .home-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .home-section-inverted h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 0.75rem;
          }

          .home-container {
            max-width: 1000px;
            margin: 0 auto;
          }

          .home-section-label {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #0891b2;
            margin-bottom: 0.75rem;
          }

          .home-section h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .home-section-alt h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .home-section-intro {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 600px;
            margin: 0 0 2.5rem;
          }

          /* Animation */
          .home-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .home-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Doors Grid */
          .home-doors-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .home-door-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
            position: relative;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .home-door-card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          }

          .home-door-featured {
            border-color: #000000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }

          .home-door-badge {
            position: absolute;
            top: -0.75rem;
            left: 1.5rem;
            background: #000000;
            color: #ffffff;
            font-size: 0.6875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.375rem 0.75rem;
            border-radius: 100px;
          }

          .home-door-icon {
            width: 56px;
            height: 56px;
            background: #f5f5f5;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.25rem;
            color: #171717;
          }

          .home-door-featured .home-door-icon {
            background: #000000;
            color: #ffffff;
          }

          .home-door-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.5rem;
          }

          .home-door-card > p {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.6;
            margin: 0 0 1.25rem;
          }

          .home-door-list {
            list-style: none;
            padding: 0;
            margin: 0 0 1.5rem;
          }

          .home-door-list li {
            font-size: 0.875rem;
            color: #404040;
            padding: 0.5rem 0 0.5rem 1.5rem;
            position: relative;
            border-bottom: 1px solid #f5f5f5;
          }

          .home-door-list li:last-child {
            border-bottom: none;
          }

          .home-door-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: 700;
            font-size: 0.8125rem;
          }

          .home-door-btn {
            display: block;
            width: 100%;
            text-align: center;
            background: #000000;
            color: #ffffff;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9375rem;
            text-decoration: none;
            transition: background 0.2s;
          }

          .home-door-btn:hover {
            background: #333333;
          }

          /* Services Grid */
          .home-services-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
          }

          .home-service-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            transition: all 0.2s;
            position: relative;
          }

          .home-service-card:hover {
            border-color: #171717;
            background: #ffffff;
          }

          .home-service-icon {
            width: 44px;
            height: 44px;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            color: #525252;
            transition: all 0.2s;
          }

          .home-service-card:hover .home-service-icon {
            background: #000000;
            border-color: #000000;
            color: #ffffff;
          }

          .home-service-card h4 {
            font-size: 1rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.375rem;
          }

          .home-service-card p {
            font-size: 0.875rem;
            color: #525252;
            line-height: 1.5;
            margin: 0;
          }

          .home-service-arrow {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            color: #d4d4d4;
            transition: color 0.2s;
          }

          .home-service-card:hover .home-service-arrow {
            color: #171717;
          }

          /* Testimonials */
          .home-testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }

          .home-testimonial-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 1.75rem;
            transition: all 0.2s;
          }

          .home-testimonial-card:hover {
            border-color: #171717;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          }

          .home-testimonial-stars {
            display: flex;
            gap: 0.125rem;
            color: #171717;
            margin-bottom: 1rem;
          }

          .home-testimonial-card blockquote {
            font-size: 0.9375rem;
            color: #404040;
            line-height: 1.7;
            margin: 0 0 1.25rem;
            font-style: normal;
          }

          .home-testimonial-card cite {
            font-size: 0.875rem;
            font-weight: 600;
            color: #171717;
            font-style: normal;
          }

          .home-testimonials-cta {
            text-align: center;
          }

          .home-btn-outline {
            display: inline-block;
            background: transparent;
            color: #171717;
            padding: 0.875rem 2rem;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
            font-weight: 600;
            font-size: 0.9375rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .home-btn-outline:hover {
            border-color: #171717;
          }

          /* CTA Section */
          .home-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            margin: 0 0 2rem;
          }

          .home-cta-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
          }

          .home-btn-white {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9375rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .home-btn-white:hover {
            background: #f5f5f5;
          }

          .home-btn-outline-white {
            display: inline-block;
            background: transparent;
            color: #ffffff;
            padding: 1rem 2rem;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.3);
            font-weight: 600;
            font-size: 0.9375rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .home-btn-outline-white:hover {
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.5);
          }

          .home-cta-location {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 0.9375rem;
            color: #737373;
            margin: 0;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .home-doors-grid {
              grid-template-columns: 1fr;
              max-width: 450px;
            }

            .home-services-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .home-testimonials-grid {
              grid-template-columns: 1fr;
              max-width: 500px;
              margin-left: auto;
              margin-right: auto;
            }
          }

          @media (max-width: 640px) {
            .home-trust-inner {
              flex-direction: column;
              gap: 0.5rem;
            }

            .home-hero {
              padding: 3.5rem 1.5rem;
            }

            .home-hero h1 {
              font-size: 2rem;
            }

            .home-hero-buttons {
              flex-direction: column;
              align-items: center;
            }

            .home-btn-primary,
            .home-btn-secondary {
              width: 100%;
              max-width: 300px;
              justify-content: center;
            }

            .home-section,
            .home-section-alt,
            .home-section-inverted {
              padding: 3.5rem 1.5rem;
            }

            .home-section h2,
            .home-section-alt h2,
            .home-section-inverted h2 {
              font-size: 1.75rem;
            }

            .home-services-grid {
              grid-template-columns: 1fr;
            }

            .home-cta-buttons {
              flex-direction: column;
              align-items: center;
            }

            .home-btn-white,
            .home-btn-outline-white {
              width: 100%;
              max-width: 280px;
              text-align: center;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
