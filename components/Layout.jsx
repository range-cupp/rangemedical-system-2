import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Layout({ children, title, description }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title || 'Range Medical | Newport Beach'}</title>
        <meta name="description" content={description || 'Range Medical in Newport Beach. Two ways to feel like yourself again.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Header */}
      <header className="rm-header">
        <div className="rm-header-inner">
          <Link href="/" className="rm-logo">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="rm-nav">
            <div className="rm-nav-links">
              <Link href="/injury-recovery" className="rm-nav-link">Injury Recovery</Link>
              <Link href="/range-assessment" className="rm-nav-link">Range Assessment</Link>
              
              {/* How We Treat Dropdown */}
              <div 
                className="rm-dropdown"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="rm-nav-link rm-dropdown-trigger">
                  How We Treat 
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={`rm-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                  <Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link>
                  <Link href="/red-light-therapy">Red Light Therapy</Link>
                  <Link href="/peptide-therapy">Peptide Therapy</Link>
                  <Link href="/iv-therapy">IV Therapy</Link>
                  <Link href="/hormone-optimization">Hormone Optimization</Link>
                  <Link href="/weight-loss">Medical Weight Loss</Link>
                </div>
              </div>

              <Link href="/lab-panels" className="rm-nav-link">Labs & Testing</Link>
            </div>
            <Link href="/book" className="rm-nav-cta">Book Assessment</Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="rm-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`rm-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="rm-mobile-section-label">Start Here</div>
          <Link href="/injury-recovery" onClick={() => setMobileMenuOpen(false)}>Injury & Recovery</Link>
          <Link href="/range-assessment" onClick={() => setMobileMenuOpen(false)}>Energy & Optimization</Link>
          
          <div className="rm-mobile-divider"></div>
          <div className="rm-mobile-section-label">How We Treat</div>
          <Link href="/hyperbaric-oxygen-therapy" onClick={() => setMobileMenuOpen(false)}>Hyperbaric Oxygen</Link>
          <Link href="/red-light-therapy" onClick={() => setMobileMenuOpen(false)}>Red Light Therapy</Link>
          <Link href="/peptide-therapy" onClick={() => setMobileMenuOpen(false)}>Peptide Therapy</Link>
          <Link href="/iv-therapy" onClick={() => setMobileMenuOpen(false)}>IV Therapy</Link>
          <Link href="/hormone-optimization" onClick={() => setMobileMenuOpen(false)}>Hormone Optimization</Link>
          <Link href="/weight-loss" onClick={() => setMobileMenuOpen(false)}>Medical Weight Loss</Link>
          
          <div className="rm-mobile-divider"></div>
          <Link href="/lab-panels" onClick={() => setMobileMenuOpen(false)}>Labs & Testing</Link>
          <Link href="/book" className="rm-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Book Assessment — $199</Link>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="rm-footer">
        <div className="rm-footer-inner">
          <div className="rm-footer-grid">
            {/* Column 1: Logo & Contact */}
            <div className="rm-footer-col">
              <img 
                src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
                alt="Range Medical" 
                className="rm-footer-logo"
              />
              <p className="rm-footer-tagline">Feel like yourself again.</p>
              <a href="tel:+19499973988" className="rm-footer-phone">(949) 997-3988</a>
              <p className="rm-footer-address">
                1901 Westcliff Dr, Suite 10<br />
                Newport Beach, CA 92660
              </p>
            </div>

            {/* Column 2: Start Here */}
            <div className="rm-footer-col">
              <h4>Start Here</h4>
              <Link href="/injury-recovery">Injury & Recovery</Link>
              <Link href="/range-assessment">Energy & Optimization</Link>
              <Link href="/book">Book Assessment</Link>
            </div>

            {/* Column 3: How We Treat */}
            <div className="rm-footer-col">
              <h4>How We Treat</h4>
              <Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link>
              <Link href="/red-light-therapy">Red Light Therapy</Link>
              <Link href="/peptide-therapy">Peptide Therapy</Link>
              <Link href="/iv-therapy">IV Therapy</Link>
              <Link href="/hormone-optimization">Hormone Optimization</Link>
              <Link href="/weight-loss">Medical Weight Loss</Link>
            </div>

            {/* Column 4: More */}
            <div className="rm-footer-col">
              <h4>More</h4>
              <Link href="/lab-panels">Labs & Testing</Link>
              <Link href="/reviews">Reviews</Link>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          <div className="rm-footer-bottom">
            <p>© {new Date().getFullYear()} Range Medical. All rights reserved.</p>
            <div className="rm-footer-legal">
              <Link href="/terms-of-use">Terms</Link>
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/refund-policy">Refunds</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Header */
        .rm-header {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid #e5e5e5;
          z-index: 1000;
        }

        .rm-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rm-logo {
          display: flex;
          align-items: center;
        }

        .rm-logo img {
          height: 32px;
          width: auto;
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
          gap: 1.5rem;
        }

        .rm-nav-link {
          color: #404040;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .rm-nav-link:hover {
          color: #000000;
        }

        /* Dropdown */
        .rm-dropdown {
          position: relative;
        }

        .rm-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.5rem 0;
          min-width: 200px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .rm-dropdown-menu.open {
          opacity: 1;
          visibility: visible;
        }

        .rm-dropdown-menu a {
          display: block;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #404040;
          text-decoration: none;
        }

        .rm-dropdown-menu a:hover {
          background: #fafafa;
          color: #000000;
        }

        .rm-nav-cta {
          background: #000000;
          color: #ffffff;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background 0.2s;
        }

        .rm-nav-cta:hover {
          background: #262626;
        }

        /* Mobile Toggle */
        .rm-mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .rm-mobile-toggle svg {
          width: 24px;
          height: 24px;
        }

        /* Mobile Menu */
        .rm-mobile-menu {
          display: none;
          background: #ffffff;
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem;
        }

        .rm-mobile-menu.open {
          display: block;
        }

        .rm-mobile-menu a {
          display: block;
          padding: 0.75rem 0;
          color: #404040;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #f5f5f5;
        }

        .rm-mobile-menu a:last-child {
          border-bottom: none;
        }

        .rm-mobile-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          padding: 1rem 0 0.5rem;
        }

        .rm-mobile-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 0.5rem 0;
        }

        .rm-mobile-cta {
          display: block;
          background: #000000;
          color: #ffffff !important;
          text-align: center;
          padding: 0.875rem 1rem !important;
          border-radius: 8px;
          margin-top: 1rem;
          font-weight: 600 !important;
        }

        /* Footer */
        .rm-footer {
          background: #000000;
          color: #ffffff;
          padding: 4rem 1.5rem 2rem;
        }

        .rm-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .rm-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .rm-footer-logo {
          height: 28px;
          width: auto;
          filter: brightness(0) invert(1);
          margin-bottom: 1rem;
        }

        .rm-footer-tagline {
          color: rgba(255,255,255,0.7);
          font-size: 0.9375rem;
          margin-bottom: 1.5rem;
        }

        .rm-footer-phone {
          display: block;
          color: #ffffff;
          text-decoration: none;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .rm-footer-address {
          color: rgba(255,255,255,0.6);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .rm-footer-col h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          color: rgba(255,255,255,0.5);
        }

        .rm-footer-col a {
          display: block;
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-size: 0.9375rem;
          padding: 0.375rem 0;
          transition: color 0.2s;
        }

        .rm-footer-col a:hover {
          color: #ffffff;
        }

        .rm-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .rm-footer-bottom p {
          color: rgba(255,255,255,0.5);
          font-size: 0.875rem;
          margin: 0;
        }

        .rm-footer-legal {
          display: flex;
          gap: 1.5rem;
        }

        .rm-footer-legal a {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .rm-footer-legal a:hover {
          color: #ffffff;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rm-nav {
            display: none;
          }

          .rm-mobile-toggle {
            display: block;
          }

          .rm-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }

          .rm-footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .rm-footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
