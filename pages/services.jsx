// pages/services.jsx
// Services & Treatments — V2 design, full menu of Range Medical services

import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const CATEGORIES = [
  {
    id: 'recovery',
    label: 'RECOVERY & HEALING',
    services: [
      {
        name: 'Six-Week Cellular Energy Reset',
        price: '$2,999',
        originalPrice: '$3,999',
        desc: '18 HBOT + 18 Red Light sessions over 6 weeks. The most powerful recovery protocol we offer.',
        href: '/cellular-energy-reset',
        featured: true,
      },
      {
        name: 'Hyperbaric + Red Light Combo',
        price: 'From $899/mo',
        desc: 'Back-to-back HBOT and Red Light at a flexible weekly frequency.',
        href: '/hyperbaric-oxygen-therapy',
      },
      {
        name: 'Hyperbaric Oxygen Therapy',
        price: 'From $185/session',
        desc: '60 minutes at 2.0 ATA. Pressurized oxygen for healing and inflammation.',
        href: '/hyperbaric-oxygen-therapy',
      },
      {
        name: 'Red Light Therapy',
        price: 'From $85/session',
        desc: 'Full-body 660\u2013850nm wavelengths for cellular recovery and tissue repair.',
        href: '/red-light-therapy',
      },
      {
        name: 'PRP Therapy',
        price: '$750/injection',
        desc: 'Platelet-Rich Plasma from your own blood for joints, tendons, and tissue repair.',
        href: '/prp-therapy',
      },
      {
        name: 'Exosome Therapy',
        price: 'Consultation-based',
        desc: 'Cellular messengers delivered via IV for systemic regeneration.',
        href: '/exosome-therapy',
      },
    ],
  },
  {
    id: 'optimization',
    label: 'OPTIMIZATION & WELLNESS',
    services: [
      {
        name: 'Hormone Optimization',
        price: '$250/month',
        desc: 'All-inclusive HRT membership \u2014 medications, labs, and monthly IV included.',
        href: '/hormone-optimization',
      },
      {
        name: 'Medical Weight Loss',
        price: 'From $399/month',
        desc: 'Tirzepatide, Semaglutide, or Retatrutide with provider monitoring.',
        href: '/weight-loss',
      },
      {
        name: 'Peptide Therapy',
        price: '$150\u2013400/month',
        desc: 'Targeted protocols for recovery, growth hormone support, immune function, and more.',
        href: '/peptide-therapy',
      },
      {
        name: 'NAD+ Therapy',
        price: 'From $25',
        desc: 'Restore cellular energy and brain function via IV infusion or injection.',
        href: '/nad-therapy',
      },
      {
        name: 'Methylene Blue',
        price: 'Consultation-based',
        desc: 'Mitochondrial support, cognitive enhancement, and cellular energy.',
        href: '/methylene-blue',
      },
    ],
  },
  {
    id: 'iv-injections',
    label: 'IV & INJECTIONS',
    services: [
      {
        name: 'The Range IV',
        price: '$225/session',
        desc: 'Choose 5 vitamins and minerals tailored to your goals. 100% absorption.',
        href: '/iv-therapy',
      },
      {
        name: 'Vitamin & Nutrient Injections',
        price: 'From $35',
        desc: 'Quick nutrient shots \u2014 B12, Glutathione, MIC-B12, NAD+, and more. In and out in 5 minutes.',
        href: '/injection-therapy',
      },
    ],
  },
  {
    id: 'labs',
    label: 'LABS & TESTING',
    services: [
      {
        name: 'Essential Blood Panel',
        price: '$350',
        desc: 'Comprehensive baseline \u2014 hormones, thyroid, metabolism, vitamins. Includes provider review.',
        href: '/lab-panels',
      },
      {
        name: 'Elite Blood Panel',
        price: '$750',
        desc: 'Everything in Essential plus advanced heart, inflammation, and expanded hormone markers.',
        href: '/lab-panels',
        featured: true,
      },
    ],
  },
];

export default function Services() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.v2-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Services & Treatments | Range Medical | Newport Beach</title>
        <meta name="description" content="Explore all regenerative medicine services at Range Medical in Newport Beach. Hormone optimization, weight loss, HBOT, red light therapy, peptides, IV therapy, PRP, exosomes, and lab panels." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="regenerative medicine Newport Beach, HRT Orange County, weight loss clinic, HBOT, red light therapy, peptide therapy, IV therapy, PRP, exosome therapy, lab panels, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/services" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <meta property="og:title" content="Services & Treatments | Range Medical | Newport Beach" />
        <meta property="og:description" content="Explore all regenerative medicine services at Range Medical. Hormone optimization, weight loss, HBOT, red light, peptides, IV therapy, and more." />
        <meta property="og:url" content="https://www.range-medical.com/services" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "url": "https://www.range-medical.com",
              "telephone": "(949) 997-3988",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr. Suite 10",
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
              "areaServed": [
                { "@type": "City", "name": "Newport Beach" },
                { "@type": "City", "name": "Costa Mesa" },
                { "@type": "City", "name": "Irvine" },
                { "@type": "City", "name": "Huntington Beach" },
                { "@type": "City", "name": "Laguna Beach" },
                { "@type": "AdministrativeArea", "name": "Orange County" }
              ],
              "priceRange": "$\u2013$$$$"
            })
          }}
        />
      </Head>

      {/* ── NAV ── */}
      <header className="v2-header">
        <div className="v2-header-inner">
          <Link href="/" className="v2-wordmark">RANGE MEDICAL</Link>
          <nav className="v2-nav-desktop">
            <Link href="/injury-recovery">Recovery</Link>
            <Link href="/hormone-optimization">Hormones</Link>
            <Link href="/weight-loss">Weight Loss</Link>
            <Link href="/lab-panels">Labs</Link>
          </nav>
          <Link href="/start" className="v2-nav-cta">START HERE</Link>
          <button className="v2-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="v2-mobile-menu">
            <Link href="/injury-recovery" onClick={() => setMenuOpen(false)}>Recovery</Link>
            <Link href="/hormone-optimization" onClick={() => setMenuOpen(false)}>Hormones</Link>
            <Link href="/weight-loss" onClick={() => setMenuOpen(false)}>Weight Loss</Link>
            <Link href="/peptide-therapy" onClick={() => setMenuOpen(false)}>Peptide Therapy</Link>
            <Link href="/iv-therapy" onClick={() => setMenuOpen(false)}>IV Therapy</Link>
            <Link href="/hyperbaric-oxygen-therapy" onClick={() => setMenuOpen(false)}>Hyperbaric Oxygen</Link>
            <Link href="/red-light-therapy" onClick={() => setMenuOpen(false)}>Red Light Therapy</Link>
            <Link href="/lab-panels" onClick={() => setMenuOpen(false)}>Labs & Testing</Link>
            <Link href="/start" className="v2-mobile-cta" onClick={() => setMenuOpen(false)}>START HERE</Link>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="v2-hero">
          <div className="v2-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> SERVICES & TREATMENTS</div>
            <h1>EVERYTHING<br />WE OFFER.<br />ONE PAGE.</h1>
            <div className="v2-hero-rule" />
            <p className="v2-hero-body">
              Every patient starts with a Range Assessment &mdash; a quick interactive
              process to understand your symptoms and goals. From there, we recommend the right plan.
            </p>
          </div>
        </section>

        {/* ── JUMP NAV ── */}
        <div className="svc-jump-bar">
          <div className="svc-jump-inner">
            {CATEGORIES.map((cat) => (
              <a key={cat.id} href={`#${cat.id}`} className="svc-jump-link">
                {cat.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── CATEGORY SECTIONS ── */}
        {CATEGORIES.map((cat, catIdx) => (
          <section
            key={cat.id}
            id={cat.id}
            className={`v2-section v2-reveal ${catIdx % 2 === 1 ? 'v2-bg-light' : ''} ${visible[cat.id] ? 'v2-visible' : ''}`}
          >
            <div className="v2-container">
              <div className="v2-label"><span className="v2-dot" /> {cat.label}</div>

              <div className="svc-list">
                {cat.services.map((svc, i) => (
                  <Link key={i} href={svc.href} className="svc-row">
                    <div className="svc-row-left">
                      <span className="svc-row-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="svc-row-info">
                        <div className="svc-row-name-line">
                          <span className="svc-row-name">{svc.name}</span>
                          {svc.featured && <span className="svc-row-tag">POPULAR</span>}
                        </div>
                        <span className="svc-row-desc">{svc.desc}</span>
                      </div>
                    </div>
                    <div className="svc-row-right">
                      <span className="svc-row-price">
                        {svc.originalPrice && (
                          <span className="svc-row-original">{svc.originalPrice}</span>
                        )}
                        {svc.price}
                      </span>
                      <span className="svc-row-arrow">&rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ── CTA ── */}
        <section className="v2-section v2-cta-section">
          <div className="v2-container v2-cta-inner">
            <h2>READY TO<br />GET STARTED?</h2>
            <div className="v2-cta-rule" />
            <p>Pick the path that fits your situation.</p>
            <div className="v2-cta-buttons">
              <Link href="/range-assessment?path=injury&from=start" className="v2-btn-white">INJURY & RECOVERY</Link>
              <Link href="/start/energy" className="v2-btn-outline">ENERGY & HORMONES</Link>
            </div>
            <div className="v2-cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach &bull; (949) 997-3988
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="v2-footer">
        <div className="v2-footer-inner">
          <div className="v2-footer-brand">
            <span className="v2-wordmark-sm">RANGE MEDICAL</span>
            <p>Feel like yourself again.</p>
          </div>
          <div className="v2-footer-links">
            <div className="v2-footer-col">
              <h4>START</h4>
              <Link href="/start">Start Here</Link>
              <Link href="/injury-recovery">Injury Recovery</Link>
              <Link href="/lab-panels">Labs & Testing</Link>
            </div>
            <div className="v2-footer-col">
              <h4>TREATMENTS</h4>
              <Link href="/hormone-optimization">Hormones</Link>
              <Link href="/weight-loss">Weight Loss</Link>
              <Link href="/peptide-therapy">Peptides</Link>
              <Link href="/iv-therapy">IV Therapy</Link>
              <Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link>
              <Link href="/red-light-therapy">Red Light</Link>
            </div>
            <div className="v2-footer-col">
              <h4>MORE</h4>
              <Link href="/prp-therapy">PRP Therapy</Link>
              <Link href="/exosome-therapy">Exosomes</Link>
              <Link href="/nad-therapy">NAD+</Link>
              <Link href="/methylene-blue">Methylene Blue</Link>
              <Link href="/reviews">Reviews</Link>
              <Link href="/gift-cards">Gift Cards</Link>
            </div>
          </div>
        </div>
        <div className="v2-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Range Medical. All rights reserved.</p>
          <div className="v2-footer-legal">
            <Link href="/terms-of-use">Terms</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* ── RESET ── */
        :global(body) {
          margin: 0;
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #1a1a1a;
        }

        /* ── HEADER ── */
        .v2-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #ffffff;
          border-bottom: 1px solid #e8e8e8;
        }

        .v2-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        :global(.v2-wordmark) {
          font-size: 13px !important;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #1a1a1a;
          text-decoration: none;
          line-height: 1;
        }

        .v2-nav-desktop {
          display: flex;
          gap: 28px;
          align-items: center;
        }

        .v2-nav-desktop :global(a) {
          font-size: 12px !important;
          font-weight: 500;
          color: #737373;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.2s;
          line-height: 1;
        }

        .v2-nav-desktop :global(a:hover) { color: #1a1a1a; }

        :global(.v2-nav-cta) {
          font-size: 11px !important;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: #1a1a1a;
          color: #ffffff;
          padding: 10px 20px;
          text-decoration: none;
          transition: background 0.2s;
          line-height: 1;
        }

        :global(.v2-nav-cta:hover) { background: #404040; }

        .v2-hamburger {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .v2-hamburger span {
          display: block;
          width: 24px;
          height: 1.5px;
          background: #1a1a1a;
        }

        .v2-mobile-menu {
          display: none;
          padding: 1rem 2rem 1.5rem;
          border-bottom: 1px solid #e8e8e8;
        }

        .v2-mobile-menu :global(a) {
          display: block;
          padding: 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #404040;
          text-decoration: none;
          border-bottom: 1px solid #f0f0f0;
        }

        :global(.v2-mobile-cta) {
          display: block;
          background: #1a1a1a;
          color: #ffffff !important;
          text-align: center;
          padding: 0.875rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em;
          margin-top: 1rem;
          border: none !important;
        }

        /* ── HERO ── */
        .v2-hero {
          padding: 6rem 2rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .v2-hero-inner { max-width: 800px; }

        .v2-label {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #737373;
          text-transform: uppercase;
          margin-bottom: 2rem;
        }

        .v2-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #808080;
        }

        .v2-hero h1 {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          margin: 0 0 2.5rem;
        }

        .v2-hero-rule {
          width: 100%;
          max-width: 700px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 2rem;
        }

        .v2-hero-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 520px;
          margin: 0;
        }

        /* ── JUMP NAV ── */
        .svc-jump-bar {
          position: sticky;
          top: 56px;
          z-index: 90;
          background: #ffffff;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        .svc-jump-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          gap: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .svc-jump-inner::-webkit-scrollbar { display: none; }

        .svc-jump-link {
          flex-shrink: 0;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #737373;
          text-decoration: none;
          padding: 1rem 1.5rem;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .svc-jump-link:hover {
          color: #1a1a1a;
          border-bottom-color: #1a1a1a;
        }

        /* ── SECTIONS ── */
        .v2-section {
          padding: 5rem 2rem;
        }

        .v2-bg-light { background: #fafafa; }

        .v2-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── SERVICE ROWS ── */
        .svc-list {
          border-top: 1px solid #e0e0e0;
          margin-top: 2rem;
        }

        :global(.svc-row) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          text-decoration: none;
          transition: all 0.2s;
          gap: 2rem;
        }

        :global(.svc-row:hover) {
          padding-left: 1rem;
          padding-right: 1rem;
          background: #ffffff;
        }

        .svc-row-left {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          flex: 1;
          min-width: 0;
        }

        .svc-row-num {
          font-size: 0.75rem;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          padding-top: 0.125rem;
        }

        .svc-row-info {
          flex: 1;
          min-width: 0;
        }

        .svc-row-name-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.375rem;
          flex-wrap: wrap;
        }

        .svc-row-name {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .svc-row-tag {
          font-size: 0.5625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #ffffff;
          background: #1a1a1a;
          padding: 0.25rem 0.625rem;
          flex-shrink: 0;
        }

        .svc-row-desc {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.5;
        }

        .svc-row-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-shrink: 0;
        }

        .svc-row-price {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: right;
          white-space: nowrap;
        }

        .svc-row-original {
          text-decoration: line-through;
          color: #a0a0a0;
          font-weight: 500;
          margin-right: 0.375rem;
        }

        .svc-row-arrow {
          font-size: 1rem;
          color: #d0d0d0;
          transition: color 0.2s;
        }

        :global(.svc-row:hover) .svc-row-arrow { color: #1a1a1a; }

        /* ── CTA ── */
        .v2-cta-section { background: #1a1a1a; text-align: center; }

        .v2-cta-inner h2 {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 1.5rem;
        }

        .v2-cta-rule {
          width: 60px;
          height: 1px;
          background: #404040;
          margin: 0 auto 2rem;
        }

        .v2-cta-inner p {
          font-size: 1rem;
          color: #737373;
          margin: 0 0 2.5rem;
        }

        .v2-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        :global(.v2-btn-white) {
          display: inline-block;
          background: #ffffff;
          color: #1a1a1a;
          padding: 0.875rem 2rem;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-decoration: none;
          transition: all 0.2s;
        }

        :global(.v2-btn-white:hover) { background: #f0f0f0; }

        :global(.v2-btn-outline) {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 2rem;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-decoration: none;
          border: 1px solid #404040;
          transition: all 0.2s;
        }

        :global(.v2-btn-outline:hover) { border-color: #ffffff; }

        .v2-cta-location {
          font-size: 0.8125rem;
          color: #525252;
          letter-spacing: 0.03em;
        }

        /* ── FOOTER ── */
        .v2-footer {
          background: #fafafa;
          border-top: 1px solid #e0e0e0;
          padding: 4rem 2rem 2rem;
        }

        .v2-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 4rem;
          margin-bottom: 3rem;
        }

        .v2-wordmark-sm {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #1a1a1a;
        }

        .v2-footer-brand p {
          font-size: 0.875rem;
          color: #737373;
          margin: 0.75rem 0 0;
          line-height: 1.6;
        }

        .v2-footer-links { display: flex; gap: 4rem; }

        .v2-footer-col h4 {
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #1a1a1a;
          margin: 0 0 1rem;
        }

        .v2-footer-col :global(a) {
          display: block;
          font-size: 0.8125rem;
          color: #737373;
          text-decoration: none;
          padding: 0.375rem 0;
          transition: color 0.2s;
        }

        .v2-footer-col :global(a:hover) { color: #1a1a1a; }

        .v2-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e0e0e0;
          padding-top: 1.5rem;
        }

        .v2-footer-bottom p {
          font-size: 0.75rem;
          color: #a0a0a0;
          margin: 0;
        }

        .v2-footer-legal { display: flex; gap: 1.5rem; }

        .v2-footer-legal :global(a) {
          font-size: 0.75rem;
          color: #a0a0a0;
          text-decoration: none;
        }

        .v2-footer-legal :global(a:hover) { color: #1a1a1a; }

        /* ── ANIMATIONS ── */
        .v2-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .v2-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .v2-nav-desktop { display: none; }
          :global(.v2-nav-cta) { display: none; }
          .v2-hamburger { display: flex; }
          .v2-mobile-menu { display: block; }

          .v2-hero { padding: 4rem 1.5rem 3rem; }

          .v2-hero h1 { font-size: clamp(2.25rem, 10vw, 3.5rem); }

          .v2-section { padding: 3.5rem 1.5rem; }

          .svc-jump-link { padding: 0.875rem 1rem; font-size: 0.625rem; }

          :global(.svc-row) {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .svc-row-right {
            padding-left: 2.25rem;
            width: 100%;
            justify-content: space-between;
          }

          .svc-row-desc { display: none; }

          .v2-cta-inner h2 { font-size: clamp(2rem, 8vw, 3rem); }

          .v2-footer-inner { flex-direction: column; gap: 2.5rem; }
          .v2-footer-links { flex-direction: column; gap: 2rem; }
          .v2-footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
        }
      `}</style>
    </>
  );
}
