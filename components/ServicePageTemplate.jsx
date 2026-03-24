import Layout from './Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

/**
 * ServicePageTemplate - V2 Editorial Design
 *
 * Props:
 * - seo: { title, description, keywords, canonical }
 * - badge: string (e.g., "Hormone Therapy", "Weight Loss")
 * - title: string
 * - subtitle: string
 * - trustBadge: string (optional, defaults to "Licensed Providers")
 * - ctaText: string (default: "Start Now")
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
  trustBadge = "Licensed Providers",
  ctaText = "Start Now",
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
  const [openFaq, setOpenFaq] = useState(null);

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
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">{trustBadge}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="spt-hero">
        <div className="spt-hero-inner">
          <div className="v2-label"><span className="v2-dot" /> {badge}</div>
          <h1>{title}</h1>
          <div className="spt-hero-rule" />
          <p className="spt-hero-sub">{subtitle}</p>
          <div className="spt-hero-cta">
            <Link href={ctaLink} className="btn-primary">{ctaText}</Link>
            {ctaSecondary && <p className="spt-hero-secondary">{ctaSecondary}</p>}
          </div>
        </div>
      </section>

      {/* Is This For You */}
      {isThisForYou && (
        <section className="spt-section spt-section-alt">
          <div className="spt-container">
            <div className="v2-label"><span className="v2-dot" /> Is This For You?</div>
            <h2>{isThisForYou.title}</h2>
            {isThisForYou.subtitle && (
              <p className="spt-section-body">{isThisForYou.subtitle}</p>
            )}

            <div className="spt-cards-grid">
              {isThisForYou.items.map((item, i) => (
                <div key={i} className="spt-card">
                  <span className="spt-card-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {howItWorks && (
        <section className="spt-section">
          <div className="spt-container">
            <div className="v2-label"><span className="v2-dot" /> Your Visit</div>
            <h2>{howItWorks.title}</h2>
            {howItWorks.subtitle && (
              <p className="spt-section-body">{howItWorks.subtitle}</p>
            )}

            <div className="spt-steps">
              {howItWorks.steps.map((step, i) => (
                <div key={i} className="spt-step">
                  <span className="spt-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="spt-step-content">
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
        <section className="spt-section spt-section-alt">
          <div className="spt-container">
            <div className="v2-label"><span className="v2-dot" /> Tools We Use</div>
            <h2>{tools.title}</h2>
            {tools.subtitle && (
              <p className="spt-section-body">{tools.subtitle}</p>
            )}

            <div className="spt-tools-list">
              {tools.items.map((tool, i) => (
                <Link key={i} href={tool.link} className="spt-tool-row">
                  <span className="spt-tool-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="spt-tool-name">{tool.title}</span>
                  <span className="spt-tool-desc">{tool.description}</span>
                  <span className="spt-tool-arrow">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="spt-section">
          <div className="spt-container">
            <div className="v2-label"><span className="v2-dot" /> Results</div>
            <h2>What Our<br />Patients Say.</h2>

            <div className="spt-testimonials">
              {testimonials.map((t, i) => (
                <div key={i} className="spt-testimonial">
                  <div className="spt-testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                  <cite>{t.name}{t.detail && ` \u2014 ${t.detail}`}</cite>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="spt-section spt-section-alt">
          <div className="spt-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Frequently<br />Asked.</h2>

            <div className="spt-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className="spt-faq-item">
                  <button
                    className="spt-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.question}</span>
                    <span className="spt-faq-toggle">{openFaq === i ? '\u2212' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="spt-faq-a">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>{finalCta?.title || "Ready to<br />Get Started?"}</h2>
          <div className="cta-rule" />
          <p>{finalCta?.subtitle || "Get started with a personalized plan."}</p>
          <Link href={ctaLink} className="btn-white">{ctaText}</Link>
          <p className="cta-location">
            Range Medical &bull; 1901 Westcliff Dr, Newport Beach &bull; (949) 997-3988
          </p>
        </div>
      </section>

      <style jsx>{`
        /* ── HERO ── */
        .spt-hero {
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .spt-hero-inner {
          max-width: 800px;
        }

        .spt-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          text-transform: uppercase;
          margin: 0 0 2rem;
        }

        .spt-hero-rule {
          width: 100%;
          max-width: 600px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 2rem;
        }

        .spt-hero-sub {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 520px;
          margin: 0 0 2.5rem;
        }

        .spt-hero-cta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .spt-hero-secondary {
          font-size: 13px;
          color: #737373;
        }

        .spt-hero-secondary :global(a) {
          color: #1a1a1a;
          font-weight: 700;
        }

        /* ── SECTIONS ── */
        .spt-section {
          padding: 6rem 2rem;
        }

        .spt-section-alt {
          background: #fafafa;
        }

        .spt-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .spt-section h2 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          text-transform: uppercase;
          margin: 0 0 1.5rem;
        }

        .spt-section-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 480px;
          margin: 0 0 3rem;
        }

        /* ── CARDS GRID ── */
        .spt-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
        }

        .spt-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }

        .spt-card:nth-child(2n) {
          border-right: none;
        }

        .spt-card-num {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #c4a882;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .spt-card h4 {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          margin: 0 0 0.5rem;
        }

        .spt-card p {
          font-size: 0.9375rem;
          color: #737373;
          margin: 0;
          line-height: 1.6;
        }

        /* ── STEPS ── */
        .spt-steps {
          border-top: 1px solid #e0e0e0;
          max-width: 800px;
        }

        .spt-step {
          display: flex;
          gap: 2rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .spt-step-num {
          font-size: 12px;
          font-weight: 600;
          color: #c4a882;
          letter-spacing: 0.05em;
          min-width: 2rem;
          padding-top: 0.25rem;
        }

        .spt-step-content h4 {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          margin: 0 0 0.5rem;
        }

        .spt-step-content p {
          font-size: 0.9375rem;
          color: #737373;
          margin: 0;
          line-height: 1.6;
        }

        /* ── TOOLS LIST ── */
        .spt-tools-list {
          border-top: 1px solid #e0e0e0;
        }

        :global(.spt-tool-row) {
          display: grid;
          grid-template-columns: 3rem 200px 1fr 2rem;
          gap: 2rem;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          text-decoration: none;
          transition: all 0.2s;
        }

        :global(.spt-tool-row:hover) {
          padding-left: 1rem;
          background: #ffffff;
        }

        .spt-tool-num {
          font-size: 12px;
          font-weight: 600;
          color: #c4a882;
          letter-spacing: 0.05em;
        }

        .spt-tool-name {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }

        .spt-tool-desc {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.5;
        }

        .spt-tool-arrow {
          font-size: 1rem;
          color: #d0d0d0;
          transition: color 0.2s;
        }

        :global(.spt-tool-row:hover) .spt-tool-arrow {
          color: #1a1a1a;
        }

        /* ── TESTIMONIALS ── */
        .spt-testimonials {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
          margin-top: 2.5rem;
        }

        .spt-testimonial {
          padding: 2.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }

        .spt-testimonial:last-child {
          border-right: none;
        }

        .spt-testimonial-stars {
          font-size: 12px;
          color: #1a1a1a;
          letter-spacing: 0.15em;
          margin-bottom: 1.25rem;
        }

        .spt-testimonial blockquote {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: #404040;
          margin: 0 0 1.5rem;
          font-style: normal;
        }

        .spt-testimonial cite {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          font-style: normal;
          letter-spacing: 0.02em;
        }

        /* ── FAQ ── */
        .spt-faq-list {
          border-top: 1px solid #e0e0e0;
          max-width: 800px;
        }

        .spt-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .spt-faq-q {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 1.5rem 0;
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          gap: 1rem;
        }

        .spt-faq-toggle {
          font-size: 1.25rem;
          color: #a0a0a0;
          flex-shrink: 0;
        }

        .spt-faq-a {
          padding: 0 0 1.5rem;
        }

        .spt-faq-a p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          margin: 0;
        }

        /* CTA Location */
        .cta-location :global(a) {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .spt-cards-grid {
            grid-template-columns: 1fr;
          }

          .spt-card {
            border-right: none;
          }

          :global(.spt-tool-row) {
            grid-template-columns: 3rem 1fr 2rem;
          }

          .spt-tool-desc {
            display: none;
          }

          .spt-testimonials {
            grid-template-columns: 1fr;
          }

          .spt-testimonial {
            border-right: none;
          }
        }

        @media (max-width: 640px) {
          .spt-hero {
            padding: 4rem 1.5rem 5rem;
          }

          .spt-section {
            padding: 4rem 1.5rem;
          }

          .spt-step {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </Layout>
  );
}
