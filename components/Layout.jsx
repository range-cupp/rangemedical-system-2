import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Layout({ children, title, description }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileTreatmentsOpen, setMobileTreatmentsOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title || 'Range Medical | Newport Beach'}</title>
        <meta name="description" content={description || 'Range Medical in Newport Beach. Two ways to feel like yourself again.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {/* Header */}
      <header className="rm-header">
        <div className="rm-header-inner">
          <Link href="/" className="rm-wordmark">RANGE MEDICAL</Link>

          {/* Desktop Navigation */}
          <nav className="rm-nav">
            <div className="rm-nav-links">
              <Link href="/injury-recovery" className="rm-nav-link">Recovery</Link>

              {/* How We Treat Dropdown */}
              <div
                className="rm-dropdown"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="rm-nav-link rm-dropdown-trigger">
                  Treatments
                  <svg width="8" height="5" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={`rm-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                  <Link href="/hormone-optimization">Hormone Optimization</Link>
                  <Link href="/weight-loss">Weight Loss</Link>
                  <Link href="/peptide-therapy">Peptide Therapy</Link>
                  <Link href="/nad-therapy">NAD+ Therapy</Link>
                  <Link href="/iv-therapy">IV Therapy</Link>
                  <Link href="/injection-therapy">Injection Therapy</Link>
                  <Link href="/cellular-energy-reset">Cellular Reset</Link>
                  <Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link>
                  <Link href="/red-light-therapy">Red Light Therapy</Link>
                  <Link href="/prp-therapy">PRP Therapy</Link>
                  <Link href="/exosome-therapy">Exosome Therapy</Link>
                  <Link href="/methylene-blue">Methylene Blue</Link>
                </div>
              </div>

              <Link href="/lab-panels" className="rm-nav-link">Labs</Link>
              <Link href="/grand-opening" className="rm-nav-link">Grand Opening</Link>
            </div>

            <Link href="/start" className="rm-nav-cta">
              START HERE
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="rm-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`rm-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link href="/injury-recovery" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Recovery</Link>
          <button
            className="rm-mobile-accordion"
            onClick={() => setMobileTreatmentsOpen(!mobileTreatmentsOpen)}
          >
            <span>Treatments</span>
            <svg
              width="10" height="6" viewBox="0 0 12 7" fill="none"
              style={{ transform: mobileTreatmentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {mobileTreatmentsOpen && (
            <div className="rm-mobile-sub">
              <Link href="/hormone-optimization" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hormone Optimization</Link>
              <Link href="/weight-loss" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Weight Loss</Link>
              <Link href="/peptide-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Peptide Therapy</Link>
              <Link href="/nad-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>NAD+ Therapy</Link>
              <Link href="/iv-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>IV Therapy</Link>
              <Link href="/injection-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Injection Therapy</Link>
              <Link href="/cellular-energy-reset" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Cellular Reset</Link>
              <Link href="/hyperbaric-oxygen-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hyperbaric Oxygen</Link>
              <Link href="/red-light-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Red Light Therapy</Link>
              <Link href="/prp-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>PRP Therapy</Link>
              <Link href="/exosome-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Exosome Therapy</Link>
              <Link href="/methylene-blue" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Methylene Blue</Link>
            </div>
          )}
          <Link href="/lab-panels" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Labs & Testing</Link>
          <Link href="/grand-opening" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Grand Opening</Link>
          <Link href="/start" className="rm-mobile-cta" onClick={() => setMobileMenuOpen(false)}>START HERE</Link>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="rm-footer">
        <div className="rm-footer-inner">
          <div className="rm-footer-brand">
            <span className="rm-footer-wordmark">RANGE MEDICAL</span>
            <p className="rm-footer-tagline">Feel like yourself again.</p>
            <a href="tel:9499973988" className="rm-footer-contact">(949) 997-3988</a>
            <p className="rm-footer-address">
              1901 Westcliff Dr. Suite 10<br />
              Newport Beach, CA 92660
            </p>
          </div>
          <div className="rm-footer-links">
            <div className="rm-footer-col">
              <h4>START</h4>
              <ul>
                <li><Link href="/start">Start Here</Link></li>
                <li><Link href="/injury-recovery">Injury Recovery</Link></li>
                <li><Link href="/lab-panels">Labs & Testing</Link></li>
              </ul>
            </div>
            <div className="rm-footer-col">
              <h4>TREATMENTS</h4>
              <ul>
                <li><Link href="/hormone-optimization">Hormones</Link></li>
                <li><Link href="/weight-loss">Weight Loss</Link></li>
                <li><Link href="/peptide-therapy">Peptides</Link></li>
                <li><Link href="/nad-therapy">NAD+</Link></li>
                <li><Link href="/iv-therapy">IV Therapy</Link></li>
                <li><Link href="/injection-therapy">Injections</Link></li>
                <li><Link href="/cellular-energy-reset">Cellular Reset</Link></li>
              </ul>
            </div>
            <div className="rm-footer-col">
              <h4>MORE</h4>
              <ul>
                <li><Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link></li>
                <li><Link href="/red-light-therapy">Red Light</Link></li>
                <li><Link href="/prp-therapy">PRP Therapy</Link></li>
                <li><Link href="/exosome-therapy">Exosomes</Link></li>
                <li><Link href="/methylene-blue">Methylene Blue</Link></li>
                <li><Link href="/reviews">Reviews</Link></li>
                <li><Link href="/gift-cards">Gift Cards</Link></li>
                <li><Link href="/grand-opening">Grand Opening</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="rm-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Range Medical. All rights reserved.</p>
          <div className="rm-footer-legal">
            <Link href="/terms-of-use">Terms</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* ── HEADER ── */
        .rm-header {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid #e8e8e8;
          z-index: 1000;
        }

        .rm-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        :global(.rm-wordmark) {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #1a1a1a;
          text-decoration: none;
          line-height: 1;
        }

        /* Desktop Nav */
        .rm-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .rm-nav-links {
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }

        .rm-nav-link {
          color: #737373;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: inherit;
          line-height: 1;
        }

        .rm-nav-link:hover {
          color: #1a1a1a;
        }

        :global(.rm-nav-cta) {
          background: #1a1a1a;
          color: #ffffff;
          padding: 10px 20px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-decoration: none;
          transition: background 0.2s;
          line-height: 1;
        }

        :global(.rm-nav-cta:hover) {
          background: #404040;
        }

        /* Dropdown */
        .rm-dropdown {
          position: relative;
        }

        .rm-dropdown-trigger {
          font-family: inherit;
        }

        .rm-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #ffffff;
          border: 1px solid #e8e8e8;
          padding: 0.5rem 0;
          min-width: 200px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .rm-dropdown-menu.open {
          opacity: 1;
          visibility: visible;
        }

        .rm-dropdown-menu :global(a) {
          display: block;
          padding: 0.5rem 1rem;
          font-size: 12px;
          color: #737373;
          text-decoration: none;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }

        .rm-dropdown-menu :global(a:hover) {
          background: #fafafa;
          color: #1a1a1a;
        }

        /* Mobile Toggle */
        .rm-mobile-toggle {
          display: none;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .rm-mobile-toggle span {
          display: block;
          width: 24px;
          height: 1.5px;
          background: #1a1a1a;
          transition: all 0.3s;
        }

        /* Mobile Menu */
        .rm-mobile-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border-bottom: 1px solid #e8e8e8;
          padding: 1rem 2rem 1.5rem;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }

        .rm-mobile-menu.open {
          display: block;
        }

        :global(.rm-mobile-link) {
          display: block;
          padding: 0.75rem 0;
          color: #404040;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 1px solid #f0f0f0;
        }

        .rm-mobile-accordion {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0.75rem 0;
          background: none;
          border: none;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
          font-weight: 500;
          color: #404040;
          cursor: pointer;
          font-family: inherit;
        }

        .rm-mobile-sub {
          padding-left: 1rem;
        }

        .rm-mobile-sub :global(a) {
          font-size: 13px;
          color: #737373;
        }

        :global(.rm-mobile-cta) {
          display: block;
          background: #1a1a1a;
          color: #ffffff !important;
          text-align: center;
          padding: 0.875rem 1rem !important;
          margin-top: 1rem;
          font-weight: 700 !important;
          font-size: 11px !important;
          letter-spacing: 0.12em;
          text-decoration: none;
          border: none !important;
        }

        /* ── FOOTER ── */
        .rm-footer {
          background: #fafafa;
          border-top: 1px solid #e0e0e0;
          padding: 4rem 2rem 2rem;
        }

        .rm-footer-inner {
          max-width: 1200px;
          margin: 0 auto 3rem;
          display: flex;
          justify-content: space-between;
          gap: 4rem;
        }

        .rm-footer-wordmark {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #1a1a1a;
        }

        .rm-footer-tagline {
          font-size: 14px;
          color: #737373;
          margin: 0.75rem 0 0;
        }

        .rm-footer-contact {
          display: inline-block;
          font-size: 13px;
          color: #737373;
          text-decoration: none;
          margin-top: 0.5rem;
          transition: color 0.2s;
        }

        .rm-footer-contact:hover {
          color: #1a1a1a;
        }

        .rm-footer-address {
          font-size: 13px;
          color: #a0a0a0;
          margin: 0.375rem 0 0;
          line-height: 1.5;
        }

        .rm-footer-links {
          display: flex;
          gap: 4rem;
        }

        .rm-footer-col h4 {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #1a1a1a;
          margin: 0 0 1rem;
        }

        .rm-footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .rm-footer-col li {
          margin: 0;
        }

        .rm-footer-col :global(a) {
          display: block;
          font-size: 13px;
          color: #737373;
          text-decoration: none;
          padding: 0.375rem 0;
          transition: color 0.2s;
        }

        .rm-footer-col :global(a:hover) {
          color: #1a1a1a;
        }

        .rm-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e0e0e0;
          padding-top: 1.5rem;
        }

        .rm-footer-bottom p {
          font-size: 12px;
          color: #a0a0a0;
          margin: 0;
        }

        .rm-footer-legal {
          display: flex;
          gap: 1.5rem;
        }

        .rm-footer-legal :global(a) {
          font-size: 12px;
          color: #a0a0a0;
          text-decoration: none;
          transition: color 0.2s;
        }

        .rm-footer-legal :global(a:hover) {
          color: #1a1a1a;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rm-nav {
            display: none;
          }

          .rm-mobile-toggle {
            display: flex;
          }

          .rm-footer-inner {
            flex-direction: column;
            gap: 2.5rem;
          }

          .rm-footer-links {
            flex-direction: column;
            gap: 2rem;
          }

          .rm-footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
