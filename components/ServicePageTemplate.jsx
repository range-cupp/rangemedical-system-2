import Layout from './Layout';
import Link from 'next/link';
import Head from 'next/head';

/**
 * ServicePageTemplate - Unified template for all Range Medical service pages
 *
 * Props:
 * - seo: { title, description, keywords, canonical }
 * - badge: string (e.g., "Hormone Therapy", "Weight Loss")
 * - title: string
 * - subtitle: string
 * - trustBadge: string (optional, defaults to "✓ Licensed Providers")
 * - ctaText: string (default: "Book Your Assessment — $199")
 * - ctaLink: string (default: "/book")
 * - ctaSecondary: string (optional secondary text below CTA)
 * - isThisForYou: { title, subtitle, items: [{emoji, title, description}] }
 * - howItWorks: { title, subtitle, steps: [{title, description}] }
 * - tools: { title, subtitle, items: [{title, description, link}] } (optional)
 * - testimonials: [{quote, name, detail}] (optional)
 * - faqs: [{question, answer}]
 * - finalCta: { title, subtitle } (optional, uses defaults if not provided)
 * - children: any additional sections to render before FAQ
 */
export default function ServicePageTemplate({
  seo,
  badge,
  title,
  subtitle,
  trustBadge = "✓ Licensed Providers",
  ctaText = "Book Your Assessment — $199",
  ctaLink = "/book",
  ctaSecondary,
  isThisForYou,
  howItWorks,
  tools,
  testimonials,
  faqs,
  finalCta,
  children
}) {
  return (
    <Layout title={seo.title} description={seo.description}>
      <Head>
        {seo.keywords && <meta name="keywords" content={seo.keywords} />}
        {seo.canonical && <link rel="canonical" href={seo.canonical} />}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        {seo.canonical && <meta property="og:url" content={seo.canonical} />}
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">{trustBadge}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">{badge}</span>
          <h1>{title}</h1>
          <p className="hero-sub">{subtitle}</p>
          <div className="hero-cta">
            <Link href={ctaLink} className="btn-primary">{ctaText}</Link>
            {ctaSecondary && <p className="hero-secondary">{ctaSecondary}</p>}
          </div>
        </div>
      </section>

      {/* Is This For You */}
      {isThisForYou && (
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Is This For You?</div>
            <h2 className="section-title">{isThisForYou.title}</h2>
            {isThisForYou.subtitle && (
              <p className="section-subtitle">{isThisForYou.subtitle}</p>
            )}

            <div className="is-this-you-grid">
              {isThisForYou.items.map((item, i) => (
                <div key={i} className="is-this-you-card">
                  <span className="card-icon">{item.emoji}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works / What Happens */}
      {howItWorks && (
        <section className="section">
          <div className="container">
            <div className="section-kicker">Your Visit</div>
            <h2 className="section-title">{howItWorks.title}</h2>
            {howItWorks.subtitle && (
              <p className="section-subtitle">{howItWorks.subtitle}</p>
            )}

            <div className="steps-list">
              {howItWorks.steps.map((step, i) => (
                <div key={i} className="step-item">
                  <div className="step-number">{i + 1}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Additional custom sections */}
      {children}

      {/* Tools We Use */}
      {tools && (
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Tools We Use</div>
            <h2 className="section-title">{tools.title}</h2>
            {tools.subtitle && (
              <p className="section-subtitle">{tools.subtitle}</p>
            )}

            <div className="tools-grid">
              {tools.items.map((tool, i) => (
                <Link key={i} href={tool.link} className="tool-card">
                  <h4>{tool.title}</h4>
                  <p>{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-kicker">Results</div>
            <h2 className="section-title">What Our Patients Say</h2>

            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div className="testimonial-stars">★★★★★</div>
                  <blockquote>{t.quote}</blockquote>
                  <cite>— {t.name}{t.detail && `, ${t.detail}`}</cite>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Questions</div>
            <h2 className="section-title">Frequently Asked Questions</h2>

            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <h4>{faq.question}</h4>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Next Step</span>
          <h2>{finalCta?.title || "Ready to Get Started?"}</h2>
          <p>{finalCta?.subtitle || "Book your Range Assessment and get a personalized plan."}</p>
          <Link href={ctaLink} className="btn-white">{ctaText}</Link>
          <p className="cta-location">
            Range Medical • 1901 Westcliff Dr, Newport Beach<br />
            <a href="tel:9499973988">(949) 997-3988</a>
          </p>
        </div>
      </section>

      <style jsx>{`
        /* Is This For You Grid */
        .is-this-you-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .is-this-you-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s;
        }

        .is-this-you-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .card-icon {
          font-size: 1.75rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .is-this-you-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .is-this-you-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Steps List */
        .steps-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .step-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .step-item:last-child {
          border-bottom: none;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .step-content p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Tools Grid */
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .tool-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          transition: all 0.2s;
        }

        .tool-card:hover {
          border-color: #000000;
          transform: translateY(-2px);
        }

        .tool-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .tool-card p {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Testimonials Grid */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .testimonial-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }

        .testimonial-stars {
          color: #fbbf24;
          font-size: 1rem;
          letter-spacing: 2px;
          margin-bottom: 0.75rem;
        }

        .testimonial-card blockquote {
          font-size: 0.9375rem;
          color: #404040;
          line-height: 1.7;
          margin: 0 0 1rem 0;
          font-style: italic;
        }

        .testimonial-card cite {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
          font-style: normal;
        }

        /* FAQ List */
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .faq-item:first-child {
          padding-top: 0;
        }

        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .faq-item h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.75rem 0;
        }

        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Location */
        .cta-location a {
          color: #ffffff;
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .is-this-you-grid {
            grid-template-columns: 1fr;
          }

          .tools-grid {
            grid-template-columns: 1fr 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .step-item {
            flex-direction: column;
            text-align: center;
          }

          .step-number {
            margin: 0 auto 1rem;
          }

          .tools-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
