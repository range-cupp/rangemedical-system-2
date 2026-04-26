// pages/guides/[slug].jsx
// Public-facing guide landing pages (lead magnets distributed via DMs/SMS).
// Content is data-driven from data/guides.js — add new slugs there to publish more.

import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { guides, getGuideSlugs, getGuide } from '../../data/guides';

export async function getStaticPaths() {
  return {
    paths: getGuideSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const guide = getGuide(params.slug);
  if (!guide) {
    return { notFound: true };
  }
  return { props: { guide } };
}

export default function GuidePage({ guide }) {
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
    const sections = document.querySelectorAll('.guide-animate');
    sections.forEach((s) => observer.observe(s));
    return () => sections.forEach((s) => observer.unobserve(s));
  }, []);

  const trackDownload = () => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: guide.trackingName });
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'guide_download', {
        guide_slug: guide.slug,
      });
    }
  };

  const trackBookClick = () => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: `${guide.slug}-guide-book-cta` });
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'assessment_cta_click', {
        guide_slug: guide.slug,
      });
    }
  };

  return (
    <>
      <Head>
        <link rel="canonical" href={guide.seo.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={guide.seo.title} />
        <meta property="og:description" content={guide.seo.description} />
        <meta property="og:url" content={guide.seo.canonical} />
        <meta property="og:image" content={guide.seo.ogImage} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={guide.seo.title} />
        <meta name="twitter:description" content={guide.seo.description} />
        <meta name="twitter:image" content={guide.seo.ogImage} />

        {/* Geo */}
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
      </Head>

      <Layout title={guide.seo.title} description={guide.seo.description}>
        {/* Trust Bar */}
        <div className="trust-bar">
          <div className="trust-inner">
            <span className="trust-item">
              <span className="trust-rating">{'★★★★★'}</span> 5.0 on Google
            </span>
            <span className="trust-item">Newport Beach, CA</span>
            <span className="trust-item">Board-Certified Providers</span>
          </div>
        </div>

        {/* Hero */}
        <section className="g-hero">
          <div className="g-container">
            <div className="v2-label"><span className="v2-dot" /> {guide.hero.kicker}</div>
            <h1 className="g-h1">{guide.hero.title}</h1>
            <div className="g-hero-rule" />
            <p className="g-hero-sub">{guide.hero.subhead}</p>
            <div className="g-hero-buttons">
              <a
                href={guide.pdfPath}
                download={guide.pdfFilename}
                onClick={trackDownload}
                className="g-btn-primary"
              >
                Download the Guide (PDF)
              </a>
              <Link
                href={guide.heroBookHref || '/assessment'}
                onClick={trackBookClick}
                className="g-btn-outline"
              >
                Book Range Assessment
              </Link>
            </div>
            <p className="g-hero-phone">
              Or call <a href="tel:9499973988">(949) 997-3988</a>
            </p>
          </div>
        </section>

        {/* What's Inside */}
        <section
          id="g-inside"
          className={`g-section-alt guide-animate ${isVisible['g-inside'] ? 'guide-visible' : ''}`}
        >
          <div className="g-container">
            <div className="g-center">
              <div className="v2-label v2-label-center"><span className="v2-dot" /> {guide.whatsInside.kicker}</div>
              <h2 className="g-h2">{guide.whatsInside.title}</h2>
            </div>
            <div className="g-card-grid">
              {guide.whatsInside.cards.map((card) => (
                <div key={card.number} className="g-card">
                  <div className="g-card-number">{card.number}</div>
                  <h3 className="g-card-title">{card.title}</h3>
                  <p className="g-card-body">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section
          id="g-who"
          className={`g-section guide-animate ${isVisible['g-who'] ? 'guide-visible' : ''}`}
        >
          <div className="g-container g-container-narrow">
            <div className="g-center">
              <div className="v2-label v2-label-center"><span className="v2-dot" /> {guide.whoItsFor.kicker}</div>
              <h2 className="g-h2">{guide.whoItsFor.title}</h2>
            </div>
            <ul className="g-list">
              {guide.whoItsFor.items.map((item, i) => (
                <li key={i} className="g-list-item">
                  <span className="g-list-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="g-list-text">{item}</span>
                </li>
              ))}
            </ul>
            <p className="g-list-footer">{guide.whoItsFor.footer}</p>
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="g-final"
          className={`g-section-alt guide-animate ${isVisible['g-final'] ? 'guide-visible' : ''}`}
        >
          <div className="g-container g-container-narrow">
            <div className="g-center">
              <div className="v2-label v2-label-center"><span className="v2-dot" /> {guide.finalCta.kicker}</div>
              <h2 className="g-h2">{guide.finalCta.title}</h2>
              <p className="g-final-body">{guide.finalCta.body}</p>
              <div className="g-hero-buttons g-hero-buttons-center">
                <Link
                  href={guide.finalCta.primaryHref}
                  onClick={trackBookClick}
                  className="g-btn-primary"
                >
                  {guide.finalCta.primaryLabel}
                </Link>
                <a
                  href={guide.pdfPath}
                  download={guide.pdfFilename}
                  onClick={trackDownload}
                  className="g-btn-outline"
                >
                  {guide.finalCta.outlineLabel}
                </a>
              </div>
              <p className="g-hero-phone">
                <a href="tel:9499973988">(949) 997-3988</a>
              </p>
            </div>
          </div>
        </section>

        <style jsx>{`
          /* ── Sections ── */
          .g-hero {
            padding: 6rem 1.5rem 5rem;
            background: #ffffff;
          }
          .g-section {
            padding: 6rem 1.5rem;
            background: #ffffff;
          }
          .g-section-alt {
            padding: 6rem 1.5rem;
            background: #fafafa;
          }
          .g-container {
            max-width: 1100px;
            margin: 0 auto;
          }
          .g-container-narrow {
            max-width: 760px;
          }
          .g-center {
            text-align: center;
          }

          /* ── Typography (override globals.css h1/h2 uppercase + 900 weight) ── */
          .g-h1 {
            font-size: clamp(2rem, 5vw, 2.75rem);
            font-weight: 700;
            color: #171717;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin: 0 0 1.5rem;
            max-width: 760px;
            text-transform: none;
          }
          .g-h2 {
            font-size: clamp(1.625rem, 3.5vw, 2rem);
            font-weight: 700;
            color: #171717;
            line-height: 1.15;
            letter-spacing: -0.02em;
            margin: 0 0 2.5rem;
            text-transform: none;
          }
          .g-hero-rule {
            width: 60px;
            height: 1px;
            background: #e5e5e5;
            margin-bottom: 1.5rem;
          }
          .g-hero-sub {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 580px;
            margin: 0 0 2.5rem;
          }

          /* ── v2-label center variant (override globals justify) ── */
          :global(.v2-label-center) {
            justify-content: center;
            margin-bottom: 1.25rem;
          }

          /* ── Buttons ── */
          .g-hero-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 1.25rem;
          }
          .g-hero-buttons-center {
            justify-content: center;
          }
          :global(.g-btn-primary) {
            display: inline-block;
            background: #171717;
            color: #ffffff;
            padding: 0.875rem 1.75rem;
            font-size: 0.9375rem;
            font-weight: 600;
            text-decoration: none;
            border: 1px solid #171717;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
            min-height: 44px;
            line-height: 1.4;
            font-family: inherit;
          }
          :global(.g-btn-primary:hover) {
            background: #262626;
            transform: translateY(-1px);
          }
          :global(.g-btn-outline) {
            display: inline-block;
            background: transparent;
            color: #171717;
            padding: 0.875rem 1.75rem;
            font-size: 0.9375rem;
            font-weight: 600;
            text-decoration: none;
            border: 2px solid #171717;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 44px;
            line-height: 1.4;
            font-family: inherit;
          }
          :global(.g-btn-outline:hover) {
            background: #171717;
            color: #ffffff;
          }

          /* ── Phone line ── */
          .g-hero-phone {
            font-size: 0.9375rem;
            color: #737373;
            margin: 0;
          }
          .g-hero-phone :global(a) {
            color: #171717;
            text-decoration: none;
            font-weight: 600;
          }
          .g-hero-phone :global(a:hover) {
            text-decoration: underline;
          }

          /* ── What's Inside cards ── */
          .g-card-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
          .g-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 2rem;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .g-card:hover {
            border-color: #171717;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          }
          .g-card-number {
            font-size: 0.875rem;
            font-weight: 700;
            color: #999999;
            letter-spacing: 0.06em;
            margin-bottom: 1.25rem;
          }
          .g-card-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #171717;
            line-height: 1.3;
            letter-spacing: -0.01em;
            margin: 0 0 0.75rem;
            text-transform: none;
          }
          .g-card-body {
            font-size: 0.9375rem;
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* ── Who It's For list ── */
          .g-list {
            list-style: none;
            padding: 0;
            margin: 0 0 2rem;
            border-top: 1px solid #e5e5e5;
          }
          .g-list-item {
            display: flex;
            align-items: baseline;
            gap: 1.25rem;
            padding: 1.125rem 0.25rem;
            border-bottom: 1px solid #e5e5e5;
            font-size: 1.0625rem;
            color: #171717;
            line-height: 1.5;
          }
          .g-list-num {
            flex-shrink: 0;
            font-size: 0.8125rem;
            font-weight: 700;
            color: #999999;
            letter-spacing: 0.06em;
            font-variant-numeric: tabular-nums;
            min-width: 24px;
          }
          .g-list-text {
            flex: 1;
          }
          .g-list-footer {
            font-size: 1rem;
            color: #525252;
            line-height: 1.7;
            margin: 0;
          }

          /* ── Final CTA body ── */
          .g-final-body {
            font-size: 1.0625rem;
            color: #525252;
            line-height: 1.7;
            max-width: 580px;
            margin: 0 auto 2.5rem;
          }

          /* ── Animation ── */
          .guide-animate {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }
          .guide-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* ── Responsive ── */
          @media (max-width: 900px) {
            .g-card-grid {
              grid-template-columns: 1fr;
              max-width: 520px;
              margin: 0 auto;
            }
          }
          @media (max-width: 640px) {
            .g-hero {
              padding: 4rem 1.5rem 3.5rem;
            }
            .g-section,
            .g-section-alt {
              padding: 4rem 1.5rem;
            }
            .g-h1 {
              font-size: 2rem;
            }
            .g-h2 {
              font-size: 1.5rem;
            }
            .g-hero-buttons :global(.g-btn-primary),
            .g-hero-buttons :global(.g-btn-outline) {
              width: 100%;
              text-align: center;
            }
            .g-list-item {
              font-size: 1rem;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
