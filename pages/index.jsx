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
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.home-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  return (
    <>
      <Head>
        <title>Range Medical | Newport Beach Wellness & Recovery Clinic</title>
        <meta name="description" content="Two ways to feel like yourself again. Range Medical in Newport Beach offers injury recovery and energy optimization programs. Take our Range Assessment to get started." />
        <meta name="keywords" content="wellness clinic Newport Beach, injury recovery, low energy treatment, brain fog help, hormone optimization, medical weight loss, peptide therapy, PRP therapy, IV therapy" />
        <link rel="canonical" href="https://www.range-medical.com/" />

        <meta property="og:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta property="og:description" content="Two ways to feel like yourself again. Injury recovery or energy optimization. Take our Range Assessment ($250, credited toward treatment)." />
        <meta property="og:url" content="https://www.range-medical.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-home.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta name="twitter:description" content="Two ways to feel like yourself again. Take our Range Assessment ($250, credited toward treatment)." />
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
                "reviewCount": "10",
                "bestRating": "5"
              },
              "sameAs": [
                "https://www.instagram.com/rangemedical",
                "https://www.facebook.com/rangemedical"
              ]
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
            <span className="trust-item">Licensed Providers</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero">
          <div className="v2-label"><span className="v2-dot" /> Recovery &middot; Energy &middot; Optimization</div>
          <h1>Two Ways to<br />Feel Like<br />Yourself Again.</h1>
          <div className="hero-rule" />
          <p className="hero-sub">
            Start with a Range Assessment for your biggest concern &mdash; injury recovery or low energy.
            One visit, one plan.
          </p>
        </section>

        {/* Two Doors Section */}
        <section id="home-doors" className={`home-section-alt home-animate ${isVisible['home-doors'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>Two Doors,<br />One Goal.</h2>
            <p className="home-section-intro">
              Pick the door that matches your main concern. Both start with a Range Assessment.
            </p>

            <div className="doors-grid">
              <div className="door-card">
                <span className="door-number">01</span>
                <h3>Injury &<br />Recovery</h3>
                <p>You&apos;re rehabbing an injury and healing feels slow. You want to speed things up.</p>
                <ul>
                  <li>Review your injury and rehab history</li>
                  <li>Discuss recovery timeline and goals</li>
                  <li>Get a clear protocol recommendation</li>
                  <li>Free &mdash; no cost to start</li>
                </ul>
                <Link href="/range-assessment?path=injury&from=start" className="v2-link-cta">
                  Start Here <span>&rarr;</span>
                </Link>
              </div>

              <div className="door-card featured">
                <span className="door-badge">Most Popular</span>
                <span className="door-number">02</span>
                <h3>Energy,<br />Hormones &<br />Weight Loss</h3>
                <p>You&apos;re tired, foggy, or just don&apos;t feel like yourself. You want answers and a plan.</p>
                <ul>
                  <li>We start with labs &mdash; real data, not guesswork</li>
                  <li>1:1 provider review of your results</li>
                  <li>Written plan in plain language</li>
                  <li>Essential ($350) or Elite ($750)</li>
                </ul>
                <Link href="/start/energy" className="v2-link-cta">
                  Start Here <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="home-services" className={`home-section home-animate ${isVisible['home-services'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> What We Offer</div>
            <h2>Tools We Use<br />to Help You<br />Feel Better.</h2>
            <p className="home-section-intro">
              Your provider picks the right tools for your situation. You don&apos;t have to figure it out yourself.
            </p>

            <div className="tools-grid">
              {[
                { name: 'Hyperbaric Oxygen', desc: 'More oxygen to your cells to support healing and energy.', href: '/hyperbaric-oxygen-therapy' },
                { name: 'Red Light Therapy', desc: 'Light wavelengths that help cells recover and function better.', href: '/red-light-therapy' },
                { name: 'IV Therapy', desc: 'Vitamins and nutrients delivered directly to your bloodstream.', href: '/iv-therapy' },
                { name: 'Hormone Optimization', desc: 'Balanced hormones for energy, mood, and how you feel.', href: '/hormone-optimization' },
                { name: 'Medical Weight Loss', desc: 'Medical support for weight, appetite, and metabolism.', href: '/weight-loss' },
                { name: 'Peptide Therapy', desc: 'Targeted peptides for recovery, performance, and longevity.', href: '/peptide-therapy' },
              ].map((svc, i) => (
                <Link key={i} href={svc.href} className="tool-card">
                  <span className="tool-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4>{svc.name}</h4>
                  <p>{svc.desc}</p>
                  <span className="tool-arrow">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="home-testimonials" className={`home-section-alt home-animate ${isVisible['home-testimonials'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Results</div>
            <h2>What Our<br />Patients Say.</h2>

            <div className="testimonials-grid" style={{ marginTop: '2.5rem' }}>
              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;I was skeptical, but after the Assessment I finally understood why I&apos;d been so tired.
                  Six weeks later I feel like myself again.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Sarah M.</strong>
                  <span>Newport Beach</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;My shoulder was taking forever to heal. The recovery protocol got me back to training
                  weeks faster than I expected.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Michael R.</strong>
                  <span>Costa Mesa</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;Clear communication, no pressure, and a plan that actually made sense.
                  This is what healthcare should be.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Jennifer K.</strong>
                  <span>Irvine</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link href="/reviews" className="btn-outline">Read More Reviews</Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to Feel<br />Like Yourself<br />Again?</h2>
            <div className="cta-rule" />
            <p>Pick the path that fits your situation.</p>
            <div className="cta-buttons">
              <Link href="/range-assessment?path=injury&from=start" className="btn-white">
                Injury & Recovery
              </Link>
              <Link href="/start/energy" style={{
                display: 'inline-block', background: 'transparent', color: '#ffffff',
                padding: '0.875rem 2rem', fontWeight: 700,
                fontSize: '11px', textDecoration: 'none', letterSpacing: '0.12em',
                border: '1px solid #404040', textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}>
                Energy, Hormones & Weight Loss
              </Link>
            </div>
            <p className="cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>
      </Layout>
    </>
  );
}
