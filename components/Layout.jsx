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
                  <Link href="/hormone-optimization">Hormone Optimization</Link>
                  <Link href="/weight-loss">Weight Loss</Link>
                  <Link href="/peptide-therapy">Peptide Therapy</Link>
                  <Link href="/nad-therapy">NAD+ Therapy</Link>
                  <Link href="/iv-therapy">IV Therapy</Link>
                  <Link href="/cellular-energy-reset">Cellular Reset</Link>
                  <Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link>
                  <Link href="/red-light-therapy">Red Light Therapy</Link>
                  <Link href="/prp-therapy">PRP Therapy</Link>
                  <Link href="/exosome-therapy">Exosome Therapy</Link>
                </div>
              </div>

              <Link href="/lab-panels" className="rm-nav-link">Labs & Testing</Link>
            </div>

            <Link href="/range-assessment" className="rm-nav-cta">
              Take Assessment
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
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`rm-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link href="/injury-recovery" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Injury Recovery</Link>
          <Link href="/range-assessment" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Range Assessment</Link>
          <div className="rm-mobile-divider"></div>
          <div className="rm-mobile-label">How We Treat</div>
          <Link href="/hormone-optimization" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hormone Optimization</Link>
          <Link href="/weight-loss" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Weight Loss</Link>
          <Link href="/peptide-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Peptide Therapy</Link>
          <Link href="/nad-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>NAD+ Therapy</Link>
          <Link href="/iv-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>IV Therapy</Link>
          <Link href="/cellular-energy-reset" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Cellular Reset</Link>
          <Link href="/hyperbaric-oxygen-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hyperbaric Oxygen</Link>
          <Link href="/red-light-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Red Light Therapy</Link>
          <Link href="/prp-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>PRP Therapy</Link>
          <Link href="/exosome-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Exosome Therapy</Link>
          <div className="rm-mobile-divider"></div>
          <Link href="/lab-panels" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Labs & Testing</Link>
          <Link href="/range-assessment" className="rm-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Take Assessment</Link>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="rm-footer">
        <div className="rm-footer-inner">
          <div className="rm-footer-brand">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
            />
            <p>Feel like yourself again.</p>
            <a href="tel:9499973988" className="rm-footer-contact">(949) 997-3988</a>
            <p>
              1901 Westcliff Dr. Suite 10<br />
              Newport Beach, CA 92660
            </p>
          </div>
          <div className="rm-footer-col">
            <h4>Start Here</h4>
            <ul>
              <li><Link href="/injury-recovery">Injury Recovery</Link></li>
              <li><Link href="/range-assessment">Range Assessment</Link></li>
              <li><Link href="/lab-panels">Labs & Testing</Link></li>
            </ul>
          </div>
          <div className="rm-footer-col">
            <h4>How We Treat</h4>
            <ul>
              <li><Link href="/hormone-optimization">Hormone Optimization</Link></li>
              <li><Link href="/weight-loss">Weight Loss</Link></li>
              <li><Link href="/peptide-therapy">Peptide Therapy</Link></li>
              <li><Link href="/nad-therapy">NAD+ Therapy</Link></li>
              <li><Link href="/iv-therapy">IV Therapy</Link></li>
              <li><Link href="/cellular-energy-reset">Cellular Reset</Link></li>
            </ul>
          </div>
          <div className="rm-footer-col">
            <h4>More</h4>
            <ul>
              <li><Link href="/hyperbaric-oxygen-therapy">Hyperbaric Oxygen</Link></li>
              <li><Link href="/red-light-therapy">Red Light Therapy</Link></li>
              <li><Link href="/prp-therapy">PRP Therapy</Link></li>
              <li><Link href="/exosome-therapy">Exosome Therapy</Link></li>
              <li><Link href="/reviews">Reviews</Link></li>
              <li><Link href="/gift-cards">Gift Cards</Link></li>
            </ul>
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
      </footer>

      <style jsx>{`
        /* Header - RESTORED TO ORIGINAL SIZE */
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
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rm-logo {
          display: flex;
          align-items: center;
        }

        .rm-logo img {
          height: 80px;
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
          gap: 1.75rem;
        }

        .rm-nav-link {
          color: #404040;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: inherit;
        }

        .rm-nav-link:hover {
          color: #000000;
        }

        .rm-nav-cta {
          background: #000000;
          color: #ffffff;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: background 0.2s;
        }

        .rm-nav-cta:hover {
          background: #333333;
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

        .rm-dropdown-menu :global(a) {
          display: block;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #404040;
          text-decoration: none;
          transition: all 0.15s;
        }

        .rm-dropdown-menu :global(a:hover) {
          background: #f5f5f5;
          color: #000000;
        }

        /* Mobile Toggle */
        .rm-mobile-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .rm-mobile-toggle span {
          display: block;
          width: 24px;
          height: 2px;
          background: #000000;
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
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .rm-mobile-menu.open {
          display: block;
        }

        .rm-mobile-link {
          display: block;
          padding: 0.75rem 0;
          color: #404040;
          text-decoration: none;
          font-size: 0.9375rem;
        }

        .rm-mobile-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          padding: 0.5rem 0 0.25rem;
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
          text-decoration: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rm-nav {
            display: none;
          }

          .rm-mobile-toggle {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
