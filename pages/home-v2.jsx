import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function HomeV2() {
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
        <title>Range Medical | Newport Beach</title>
        <meta name="description" content="Regenerative medicine. Injury recovery. Hormone optimization. One clinic, no guesswork." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
          <Link href="/range-assessment" className="v2-nav-cta">Book Your $197 Range Assessment</Link>
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
            <Link href="/range-assessment" className="v2-mobile-cta" onClick={() => setMenuOpen(false)}>Book Your $197 Range Assessment</Link>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="v2-hero">
          <div className="v2-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> REGENERATIVE MEDICINE</div>
            <h1>STOP GUESSING<br />WHY YOU FEEL<br />THIS WAY.</h1>
            <div className="v2-hero-rule" />
            <p className="v2-hero-body">
              We start with labs. Real data — not symptoms. One visit, one plan,
              and a provider who actually explains what&apos;s going on. Injury recovery
              or energy optimization. Newport Beach.
            </p>
          </div>
        </section>

        {/* ── TWO PATHS ── */}
        <section id="v2-paths" className={`v2-section v2-reveal ${visible['v2-paths'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> HOW IT WORKS</div>
            <h2>TWO DOORS.<br />ONE GOAL.</h2>
            <p className="v2-section-body">
              Pick the path that matches your situation. Both start with an assessment.
            </p>

            <div className="v2-paths-grid">
              <div className="v2-path-card">
                <span className="v2-path-number">01</span>
                <h3>INJURY &<br />RECOVERY</h3>
                <p>
                  You&apos;re rehabbing an injury and healing feels slow.
                  We build a recovery protocol around your timeline.
                </p>
                <ul>
                  <li>Review your injury and rehab history</li>
                  <li>Discuss recovery timeline and goals</li>
                  <li>Get a clear protocol recommendation</li>
                  <li>$197 — credited toward treatment</li>
                </ul>
                <Link href="/range-assessment?path=injury&from=start" className="v2-path-link">
                  Book Your $197 Range Assessment <span>&rarr;</span>
                </Link>
              </div>

              <div className="v2-path-card v2-path-featured">
                <span className="v2-path-tag">MOST POPULAR</span>
                <span className="v2-path-number">02</span>
                <h3>ENERGY,<br />HORMONES &<br />WEIGHT LOSS</h3>
                <p>
                  Tired, foggy, or just off. We start with labs —
                  real data, not guesswork — and build a plan from there.
                </p>
                <ul>
                  <li>Comprehensive lab panel</li>
                  <li>1:1 provider review of results</li>
                  <li>Written plan in plain language</li>
                  <li>Essential ($350) or Elite ($750)</li>
                </ul>
                <Link href="/range-assessment" className="v2-path-link">
                  Book Your $197 Range Assessment <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="v2-services" className={`v2-section v2-bg-light v2-reveal ${visible['v2-services'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> WHAT WE USE</div>
            <h2>THE TOOLS<br />BEHIND THE<br />PROTOCOL.</h2>
            <p className="v2-section-body">
              Your provider picks the right combination. You don&apos;t have to figure it out.
            </p>

            <div className="v2-services-list">
              {[
                { name: 'Hyperbaric Oxygen', desc: 'Pressurized oxygen to accelerate tissue repair and reduce inflammation.', href: '/hyperbaric-oxygen-therapy' },
                { name: 'Red Light Therapy', desc: 'Light wavelengths that stimulate cellular recovery and mitochondrial function.', href: '/red-light-therapy' },
                { name: 'IV Therapy', desc: 'Vitamins and nutrients delivered directly to your bloodstream for immediate effect.', href: '/iv-therapy' },
                { name: 'Hormone Optimization', desc: 'Data-driven hormone balancing for energy, mood, and performance.', href: '/hormone-optimization' },
                { name: 'Medical Weight Loss', desc: 'Medical-grade support for metabolism, appetite, and body composition.', href: '/weight-loss' },
                { name: 'Peptide Therapy', desc: 'Targeted peptides for recovery, performance, sleep, and longevity.', href: '/peptide-therapy' },
              ].map((svc, i) => (
                <Link key={i} href={svc.href} className="v2-service-row">
                  <span className="v2-service-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="v2-service-name">{svc.name}</span>
                  <span className="v2-service-desc">{svc.desc}</span>
                  <span className="v2-service-arrow">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="v2-results" className={`v2-section v2-reveal ${visible['v2-results'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> RESULTS</div>
            <h2>WHAT OUR<br />PATIENTS SAY.</h2>

            <div className="v2-testimonials">
              {[
                { quote: 'I was skeptical, but after the assessment I finally understood why I\'d been so tired. Six weeks later I feel like myself again.', name: 'Sarah M.', loc: 'Newport Beach' },
                { quote: 'My shoulder was taking forever to heal. The recovery protocol got me back to training weeks faster than I expected.', name: 'Michael R.', loc: 'Costa Mesa' },
                { quote: 'Clear communication, no pressure, and a plan that actually made sense. This is what healthcare should be.', name: 'Jennifer K.', loc: 'Irvine' },
              ].map((t, i) => (
                <div key={i} className="v2-testimonial">
                  <div className="v2-testimonial-stars">★★★★★</div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                  <cite>{t.name} — {t.loc}</cite>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="v2-section v2-cta-section">
          <div className="v2-container v2-cta-inner">
            <h2>READY TO FEEL<br />LIKE YOURSELF<br />AGAIN?</h2>
            <div className="v2-cta-rule" />
            <p>Pick the path that fits your situation.</p>
            <div className="v2-cta-buttons">
              <Link href="/range-assessment?path=injury&from=start" className="v2-btn-white">INJURY & RECOVERY</Link>
              <Link href="/range-assessment" className="v2-btn-outline">ENERGY & HORMONES</Link>
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
              <Link href="/range-assessment">Book Your $197 Range Assessment</Link>
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
        /* ── RESET & BASE ── */
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

        .v2-nav-desktop :global(a:hover) {
          color: #1a1a1a;
        }

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

        :global(.v2-nav-cta:hover) {
          background: #404040;
        }

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
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .v2-hero-inner {
          max-width: 800px;
        }

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

        /* ── SECTIONS ── */
        .v2-section {
          padding: 6rem 2rem;
        }

        .v2-bg-light {
          background: #fafafa;
        }

        .v2-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .v2-section h2 {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          margin: 0 0 1.5rem;
        }

        .v2-section-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 480px;
          margin: 0 0 3.5rem;
        }

        /* ── PATHS ── */
        .v2-paths-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-top: 1px solid #e0e0e0;
        }

        .v2-path-card {
          padding: 3rem 2.5rem 2.5rem;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
        }

        .v2-path-card:first-child {
          border-right: 1px solid #e0e0e0;
        }

        .v2-path-featured {
          background: #fafafa;
        }

        .v2-path-tag {
          display: inline-block;
          font-size: 0.5625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #ffffff;
          background: #1a1a1a;
          padding: 0.375rem 0.75rem;
          margin-bottom: 1.25rem;
        }

        .v2-path-number {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .v2-path-card h3 {
          font-size: 1.75rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.02em;
          color: #1a1a1a;
          margin: 0 0 1.25rem;
        }

        .v2-path-card > p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #737373;
          margin: 0 0 1.5rem;
        }

        .v2-path-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem;
        }

        .v2-path-card li {
          font-size: 0.875rem;
          color: #404040;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f0f0f0;
          padding-left: 1.25rem;
          position: relative;
        }

        .v2-path-card li::before {
          content: "–";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        .v2-path-card li:last-child {
          border-bottom: none;
        }

        :global(.v2-path-link) {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #1a1a1a;
          text-decoration: none;
          border-bottom: 1.5px solid #1a1a1a;
          padding-bottom: 0.25rem;
          transition: all 0.2s;
        }

        :global(.v2-path-link:hover) {
          color: #737373;
          border-color: #737373;
        }

        /* ── SERVICES LIST ── */
        .v2-services-list {
          border-top: 1px solid #e0e0e0;
        }

        :global(.v2-service-row) {
          display: grid;
          grid-template-columns: 3rem 200px 1fr 2rem;
          gap: 2rem;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          text-decoration: none;
          transition: all 0.2s;
        }

        :global(.v2-service-row:hover) {
          padding-left: 1rem;
          background: #ffffff;
        }

        .v2-service-num {
          font-size: 0.75rem;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
        }

        .v2-service-name {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .v2-service-desc {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.5;
        }

        .v2-service-arrow {
          font-size: 1rem;
          color: #d0d0d0;
          transition: color 0.2s;
        }

        :global(.v2-service-row:hover) .v2-service-arrow {
          color: #1a1a1a;
        }

        /* ── TESTIMONIALS ── */
        .v2-testimonials {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
        }

        .v2-testimonial {
          padding: 2.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }

        .v2-testimonial:last-child {
          border-right: none;
        }

        .v2-testimonial-stars {
          font-size: 0.75rem;
          color: #1a1a1a;
          letter-spacing: 0.15em;
          margin-bottom: 1.25rem;
        }

        .v2-testimonial blockquote {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: #404040;
          margin: 0 0 1.5rem;
          font-style: normal;
        }

        .v2-testimonial cite {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1a1a1a;
          font-style: normal;
          letter-spacing: 0.02em;
        }

        /* ── CTA ── */
        .v2-cta-section {
          background: #1a1a1a;
          text-align: center;
        }

        .v2-cta-inner h2 {
          color: #ffffff;
          font-size: clamp(2.25rem, 5vw, 3.5rem);
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

        :global(.v2-btn-white:hover) {
          background: #f0f0f0;
        }

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

        :global(.v2-btn-outline:hover) {
          border-color: #ffffff;
        }

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

        .v2-footer-links {
          display: flex;
          gap: 4rem;
        }

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

        .v2-footer-col :global(a:hover) {
          color: #1a1a1a;
        }

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

        .v2-footer-legal {
          display: flex;
          gap: 1.5rem;
        }

        .v2-footer-legal :global(a) {
          font-size: 0.75rem;
          color: #a0a0a0;
          text-decoration: none;
        }

        .v2-footer-legal :global(a:hover) {
          color: #1a1a1a;
        }

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
          .v2-paths-grid {
            grid-template-columns: 1fr;
          }

          .v2-path-card:first-child {
            border-right: none;
          }

          :global(.v2-service-row) {
            grid-template-columns: 3rem 1fr 2rem;
          }

          .v2-service-desc {
            display: none;
          }

          .v2-testimonials {
            grid-template-columns: 1fr;
          }

          .v2-testimonial {
            border-right: none;
          }

          .v2-footer-inner {
            flex-direction: column;
            gap: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .v2-nav-desktop {
            display: none;
          }

          :global(.v2-nav-cta) {
            display: none;
          }

          .v2-hamburger {
            display: flex;
          }

          .v2-mobile-menu {
            display: block;
          }

          .v2-hero {
            padding: 4rem 1.5rem 5rem;
          }

          .v2-hero h1 {
            font-size: 2.75rem;
          }

          .v2-section {
            padding: 4rem 1.5rem;
          }

          .v2-section h2 {
            font-size: 2.25rem;
          }

          .v2-path-card {
            padding: 2rem 1.5rem;
          }

          .v2-cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          :global(.v2-btn-white),
          :global(.v2-btn-outline) {
            width: 100%;
            max-width: 280px;
            text-align: center;
          }

          .v2-footer-links {
            flex-direction: column;
            gap: 2rem;
          }

          .v2-footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
