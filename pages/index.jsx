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
        <meta name="description" content="Start with a $197 Range Assessment at Range Medical in Newport Beach. If you move forward with treatment, we apply the full amount to your plan. Injury recovery and energy optimization." />
        <meta name="keywords" content="wellness clinic Newport Beach, injury recovery, low energy treatment, brain fog help, hormone optimization, medical weight loss, peptide therapy, PRP therapy, IV therapy" />
        <link rel="canonical" href="https://www.range-medical.com/" />

        <meta property="og:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta property="og:description" content="Start with a $197 Range Assessment. If you move forward with treatment, we apply the full amount to your plan. Injury recovery or energy optimization." />
        <meta property="og:url" content="https://www.range-medical.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-home.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta name="twitter:description" content="Start with a $197 Range Assessment. If you move forward with treatment, we apply the full amount to your plan." />
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
              ],
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
        {/* Special Offer Banner */}
        <div className="promo-bar">
          <div className="promo-bar-shimmer" aria-hidden="true" />
          <div className="promo-bar-inner">
            <span className="promo-bar-badge">Free This Month</span>
            <span className="promo-bar-text">
              Try a session on us &mdash;
            </span>
            <Link href="/hbot-trial" className="promo-bar-cta">
              Free HBOT <span>&rarr;</span>
            </Link>
            <span className="promo-bar-divider" aria-hidden="true">•</span>
            <Link href="/rlt-trial" className="promo-bar-cta">
              Free Red Light <span>&rarr;</span>
            </Link>
          </div>
        </div>

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
        <section className="hero">
          <div className="v2-label"><span className="v2-dot" /> Recovery &middot; Energy &middot; Optimization</div>
          <h1>One Assessment.<br />One Plan.<br />Feel Like<br />Yourself Again.</h1>
          <div className="hero-rule" />
          <p className="hero-sub">
            Start with a $197 Range Assessment. We&apos;ll review your history, symptoms, and goals &mdash; then build your plan.
            If you move forward with treatment, the full $197 goes toward it.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/assessment" className="btn-primary">
              Book Your Range Assessment
            </Link>
          </div>
        </section>

        {/* Two Paths Section */}
        <section id="home-doors" className={`home-section-alt home-animate ${isVisible['home-doors'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>One Assessment.<br />Two Paths.</h2>
            <p className="home-section-intro">
              Every patient starts with a $197 Range Assessment. Tell us what brings you in, and we&apos;ll take it from there.
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
                  <li>$197 credited toward your treatment</li>
                </ul>
                <Link href="/assessment?path=injury" className="v2-link-cta">
                  Book Assessment <span>&rarr;</span>
                </Link>
              </div>

              <div className="door-card featured">
                <span className="door-badge">Most Popular</span>
                <span className="door-number">02</span>
                <h3>Energy,<br />Hormones &<br />Weight</h3>
                <p>You&apos;re tired, foggy, or just don&apos;t feel like yourself. You want answers and a plan.</p>
                <ul>
                  <li>Review symptoms, goals, and history</li>
                  <li>Discuss the right lab panel for you</li>
                  <li>Get a clear path forward</li>
                  <li>$197 credited toward your program</li>
                </ul>
                <Link href="/assessment?path=energy" className="v2-link-cta">
                  Book Assessment <span>&rarr;</span>
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

        {/* Cash-Pay Model Section */}
        <section id="home-cashpay" className={`home-section home-animate ${isVisible['home-cashpay'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How We Work</div>
            <h2>No Insurance.<br />On Purpose.</h2>
            <p className="home-section-intro">
              We&apos;re a cash-pay clinic &mdash; and that&apos;s by design. It means more time with your provider,
              transparent pricing, and zero insurance red tape.
            </p>

            <div className="cashpay-grid">
              <div className="cashpay-item">
                <span className="cashpay-num">01</span>
                <h4>More Time With You</h4>
                <p>Insurance-based clinics move fast because they have to. We don&apos;t. Your visits are longer, your provider actually listens, and your plan is built around you &mdash; not a billing code.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">02</span>
                <h4>Transparent Pricing</h4>
                <p>You know what everything costs before you commit. No surprise bills, no co-pay confusion, no &ldquo;we&apos;ll see what insurance covers.&rdquo; The price we quote is the price you pay.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">03</span>
                <h4>Better Treatment Options</h4>
                <p>Many of the therapies we offer &mdash; peptides, hyperbaric oxygen, advanced labs &mdash; aren&apos;t covered by insurance anyway. Going cash-pay means we can offer what actually works, not just what gets approved.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">04</span>
                <h4>HSA & FSA Accepted</h4>
                <p>You can use your Health Savings Account or Flexible Spending Account for any of our services. Same card, same process &mdash; just swipe it like a credit card.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/cash-pay" className="btn-outline">Learn More About Our Model</Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to Feel<br />Like Yourself<br />Again?</h2>
            <div className="cta-rule" />
            <p>One assessment. One plan. $197 credited toward your treatment.</p>
            <div className="cta-buttons">
              <Link href="/assessment" className="btn-white">
                Book Your Range Assessment
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
