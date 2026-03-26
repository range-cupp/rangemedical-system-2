// pages/[locationPage].jsx
// Dynamic route for all location+service pages (e.g., /hormone-optimization-costa-mesa)
// Generates ~120 pages from one template using getStaticPaths/getStaticProps

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import {
  getAllLocationPaths,
  parseLocationSlug,
  getLocationPageData,
  CLINIC,
  CITIES,
  LOCATION_SERVICES,
  formatServiceName,
} from '../lib/location-seo';
import { buildLocationPageSchemas } from '../lib/seo-schemas';

export async function getStaticPaths() {
  const paths = getAllLocationPaths();
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const parsed = parseLocationSlug(params.locationPage);
  if (!parsed) return { notFound: true };

  const pageData = getLocationPageData(parsed.serviceSlug, parsed.citySlug);
  if (!pageData) return { notFound: true };

  // Build JSON-LD schemas
  const schemas = buildLocationPageSchemas({
    serviceTitle: pageData.service.title,
    serviceDescription: pageData.seo.description,
    serviceUrl: pageData.seo.canonical,
    cityName: pageData.city.name,
    faqs: pageData.faqs,
    breadcrumbs: [
      { name: 'Home', url: CLINIC.url },
      { name: pageData.service.title, url: `${CLINIC.url}/${parsed.serviceSlug}` },
      { name: `${pageData.service.title} in ${pageData.city.name}`, url: pageData.seo.canonical },
    ],
  });

  return {
    props: {
      pageData,
      schemas,
      serviceSlug: parsed.serviceSlug,
      citySlug: parsed.citySlug,
    },
  };
}

export default function LocationPage({ pageData, schemas, serviceSlug, citySlug }) {
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll-based animations
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

    const elements = document.querySelectorAll('.loc-page .loc-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const { service, city, seo, intro, faqs } = pageData;

  // Other cities for this service (for internal linking)
  const otherCities = Object.keys(CITIES)
    .filter((slug) => slug !== citySlug)
    .slice(0, 5);

  return (
    <Layout title={seo.title} description={seo.description}>
      <Head>
        <meta name="keywords" content={seo.keywords} />
        <link rel="canonical" href={seo.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content={CLINIC.image} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={CLINIC.image} />

        {/* Geo Tags — city-specific */}
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content={city.name} />
        <meta name="geo.position" content={`${city.lat};${city.lng}`} />
        <meta name="ICBM" content={`${city.lat}, ${city.lng}`} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">&#128205; Newport Beach, CA</span>
          <span className="trust-item">&#10003; Licensed Providers</span>
        </div>
      </div>

      <div className="loc-page">
        {/* Hero */}
        <section className="loc-hero">
          {service.badge && <div className="loc-kicker">{service.badge}</div>}
          <h1>{service.title} in {city.name}</h1>
          <p className="loc-body-text">{service.subtitle}</p>
          <p className="loc-body-text loc-intro">{intro}</p>
          <Link href="/start" className="loc-btn-primary">
            Start Here
          </Link>
        </section>

        {/* Who This Is For */}
        {service.isThisForYou && (
          <section className="loc-section loc-section-alt">
            <div className="loc-container">
              <div className="loc-animate">
                <div className="loc-kicker">Who This Is For</div>
                <h2>{service.isThisForYou.title || 'Is this you?'}</h2>
                <div className="loc-divider"></div>
              </div>
              <div className="loc-cards-grid">
                {service.isThisForYou.items.map((item, i) => (
                  <div key={i} className="loc-card loc-animate">
                    <span className="loc-card-emoji">{item.emoji}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        {service.howItWorks && (
          <section className="loc-section">
            <div className="loc-container">
              <div className="loc-animate">
                <div className="loc-kicker">How It Works</div>
                <h2>Getting started is simple.</h2>
                <div className="loc-divider"></div>
              </div>
              <div className="loc-steps">
                {service.howItWorks.steps.map((step, i) => (
                  <div key={i} className="loc-step loc-animate">
                    <div className="loc-step-number">{String(i + 1).padStart(2, '0')}</div>
                    <div className="loc-step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        {service.pricing && (
          <section className="loc-section loc-section-dark">
            <div className="loc-container">
              <div className="loc-animate">
                <div className="loc-kicker" style={{ color: 'rgba(255,255,255,0.4)' }}>Pricing</div>
                <h2 style={{ color: '#fff' }}>{service.pricing.title}</h2>
                <div className="loc-price-tag">{service.pricing.price}</div>
                {service.pricing.includes && (
                  <ul className="loc-includes-list">
                    {service.pricing.includes.map((item, i) => (
                      <li key={i}>&#10003; {item}</li>
                    ))}
                  </ul>
                )}
                <Link href={service.pricing.link || '/start'} className="loc-btn-primary" style={{ marginTop: '1.5rem' }}>
                  Learn More
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <section className="loc-section loc-section-alt">
            <div className="loc-container">
              <div className="loc-animate">
                <div className="loc-kicker">FAQs</div>
                <h2>Common questions about {service.title.toLowerCase()} near {city.name}.</h2>
                <div className="loc-divider"></div>
              </div>
              <div className="loc-faqs">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className={`loc-faq-item loc-animate ${openFaq === i ? 'open' : ''}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="loc-faq-question">
                      <span>{faq.question}</span>
                      <span className="loc-faq-icon">{openFaq === i ? '\u2212' : '+'}</span>
                    </div>
                    {openFaq === i && (
                      <div className="loc-faq-answer">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location CTA */}
        <section className="loc-section loc-section-dark">
          <div className="loc-container" style={{ textAlign: 'center' }}>
            <div className="loc-animate">
              <div className="loc-kicker" style={{ color: 'rgba(255,255,255,0.4)' }}>Visit Us</div>
              <h2 style={{ color: '#fff' }}>{service.title} for {city.name} Residents</h2>
              <p className="loc-body-text" style={{ color: 'rgba(255,255,255,0.55)', margin: '0 auto 1rem', textAlign: 'center' }}>
                Our clinic is just {city.drivingMinutes} minutes {city.drivingDirection} of {city.name}. Free parking on-site.
              </p>
              <p className="loc-address">
                {CLINIC.address}, {CLINIC.city}, {CLINIC.state} {CLINIC.zip}<br />
                {CLINIC.phone}
              </p>
              <Link href="/start" className="loc-btn-primary" style={{ marginTop: '1.5rem' }}>
                Start Here
              </Link>
            </div>
          </div>
        </section>

        {/* Related Services & Other Cities */}
        <section className="loc-section">
          <div className="loc-container">
            <div className="loc-animate">
              <div className="loc-kicker">Also Serving</div>
              <h2>{service.title} near you.</h2>
              <div className="loc-divider"></div>
              <div className="loc-city-links">
                <Link href={`/${serviceSlug}`} className="loc-city-link">
                  {service.title} in Newport Beach
                </Link>
                {otherCities.map((slug) => (
                  <Link key={slug} href={`/${serviceSlug}-${slug}`} className="loc-city-link">
                    {service.title} in {CITIES[slug].name}
                  </Link>
                ))}
              </div>
            </div>

            {service.tools && (
              <div className="loc-animate" style={{ marginTop: '3rem' }}>
                <div className="loc-kicker">Related Treatments</div>
                <div className="loc-related-grid">
                  {service.tools.items.map((tool, i) => (
                    <Link key={i} href={tool.link} className="loc-related-card">
                      <h3>{tool.title}</h3>
                      <p>{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .loc-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        .loc-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.loc-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        .loc-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .loc-section {
          padding: 4rem 1.5rem;
        }

        .loc-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .loc-section-dark {
          background: #000000;
          color: #ffffff;
          padding: 5rem 1.5rem;
        }

        .loc-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .loc-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1.5rem;
        }

        .loc-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .loc-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .loc-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .loc-intro {
          margin-top: 0.5rem;
          margin-bottom: 2rem;
        }

        .loc-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .loc-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #000000;
          color: #ffffff;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .loc-section-dark .loc-btn-primary {
          background: #ffffff;
          color: #000000;
        }

        .loc-btn-primary:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        /* Hero */
        .loc-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .loc-hero h1 {
          max-width: 700px;
        }

        .loc-hero .loc-body-text {
          text-align: center;
          margin: 0 auto;
        }

        /* Cards */
        .loc-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .loc-card {
          padding: 2rem;
          border-radius: 0;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .loc-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .loc-card-emoji {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .loc-card h3 {
          margin-bottom: 0.5rem;
        }

        .loc-card p {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Steps */
        .loc-steps {
          margin-top: 2.5rem;
        }

        .loc-step {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .loc-step:last-child {
          border-bottom: none;
        }

        .loc-step-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #737373;
          min-width: 2rem;
          padding-top: 0.25rem;
        }

        .loc-step-content h3 {
          margin-bottom: 0.5rem;
        }

        .loc-step-content p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Pricing */
        .loc-price-tag {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          margin: 1rem 0;
        }

        .loc-includes-list {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }

        .loc-includes-list li {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.7);
          padding: 0.375rem 0;
        }

        /* FAQs */
        .loc-faqs {
          margin-top: 2rem;
        }

        .loc-faq-item {
          border-bottom: 1px solid #e5e5e5;
          cursor: pointer;
          padding: 1.25rem 0;
        }

        .loc-faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
        }

        .loc-faq-icon {
          font-size: 1.25rem;
          font-weight: 400;
          color: #737373;
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .loc-faq-answer {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #525252;
          margin-top: 0.75rem;
          padding-right: 2rem;
        }

        /* Address */
        .loc-address {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.7;
          margin-top: 1rem;
        }

        /* City Links */
        .loc-city-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .loc-city-link {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: 0;
          border: 1px solid #e5e5e5;
          color: #171717;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .loc-city-link:hover {
          border-color: #000000;
          background: #000000;
          color: #ffffff;
        }

        /* Related */
        .loc-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .loc-related-card {
          padding: 1.5rem;
          border-radius: 0;
          border: 1px solid #e5e5e5;
          text-decoration: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .loc-related-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .loc-related-card h3 {
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .loc-related-card p {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #525252;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .loc-page h1 {
            font-size: 2rem;
          }

          .loc-page h2 {
            font-size: 1.5rem;
          }

          .loc-cards-grid,
          .loc-related-grid {
            grid-template-columns: 1fr;
          }

          .loc-hero {
            padding: 3rem 1rem 3.5rem;
          }

          .loc-section,
          .loc-section-alt,
          .loc-section-dark {
            padding: 3rem 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}
