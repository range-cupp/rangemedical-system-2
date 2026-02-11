import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const treatments = [
    { href: '/hyperbaric-oxygen-therapy', label: 'Hyperbaric Oxygen' },
    { href: '/red-light-therapy', label: 'Red Light Therapy' },
    { href: '/peptide-therapy', label: 'Peptide Therapy' },
    { href: '/nad-therapy', label: 'NAD+ Therapy' },
    { href: '/iv-therapy', label: 'IV Therapy' },
    { href: '/hormone-optimization', label: 'Hormone Optimization' },
    { href: '/weight-loss', label: 'Weight Loss' },
  ];

  const isActiveTreatment = treatments.some(t => router.pathname === t.href);

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
          />
        </Link>
        
        <nav className="nav">
          <div className="nav-links">
            <Link 
              href="/range-assessment" 
              className={`nav-start ${router.pathname === '/range-assessment' ? 'active' : ''}`}
            >
              Range Assessment
            </Link>
            
            <div className="nav-dropdown">
              <button className={`nav-dropdown-trigger ${isActiveTreatment ? 'active' : ''}`}>
                How We Treat 
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="nav-dropdown-menu">
                {treatments.map(t => (
                  <Link 
                    key={t.href} 
                    href={t.href}
                    className={router.pathname === t.href ? 'active' : ''}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <Link 
              href="/lab-panels"
              className={router.pathname === '/lab-panels' ? 'active' : ''}
            >
              Labs & Testing
            </Link>
          </div>
          
          <Link href="/range-assessment#book" className="nav-cta">
            Take Assessment
          </Link>
        </nav>

        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <Link href="/range-assessment" className="mobile-start" onClick={() => setMobileOpen(false)}>
          Range Assessment
        </Link>
        <div className="mobile-section-label">How We Treat</div>
        {treatments.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className={router.pathname === t.href ? 'active' : ''}
            onClick={() => setMobileOpen(false)}
          >
            {t.label}
          </Link>
        ))}
        <div className="mobile-divider"></div>
        <Link href="/lab-panels" onClick={() => setMobileOpen(false)}>
          Labs & Testing
        </Link>
        <Link href="/range-assessment#book" className="mobile-cta" onClick={() => setMobileOpen(false)}>
          Take Assessment
        </Link>
      </div>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid #e5e5e5;
          z-index: 100;
        }
        
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .logo img {
          height: 80px;
          width: auto;
        }
        
        .nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }
        
        .nav-links :global(a),
        .nav-dropdown-trigger {
          color: #404040;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: inherit;
        }
        
        .nav-links :global(a:hover),
        .nav-links :global(a.active),
        .nav-dropdown-trigger:hover,
        .nav-dropdown-trigger.active {
          color: #000000;
        }
        
        .nav-start {
          font-weight: 600 !important;
          color: #000000 !important;
        }
        
        .nav-dropdown {
          position: relative;
        }
        
        .nav-dropdown-menu {
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
        
        .nav-dropdown:hover .nav-dropdown-menu {
          opacity: 1;
          visibility: visible;
        }
        
        .nav-dropdown-menu :global(a) {
          display: block;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #404040;
        }
        
        .nav-dropdown-menu :global(a:hover) {
          background: #fafafa;
        }
        
        .nav-dropdown-menu :global(a.active) {
          color: #000000;
          font-weight: 600;
        }
        
        .nav-cta {
          background: #000000;
          color: #ffffff !important;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        
        .nav-cta:hover {
          background: #262626;
        }
        
        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .mobile-toggle svg {
          width: 24px;
          height: 24px;
        }
        
        .mobile-menu {
          display: none;
          background: #ffffff;
          border-bottom: 1px solid #e5e5e5;
          padding: 1rem 1.5rem;
        }
        
        .mobile-menu.open {
          display: block;
        }
        
        .mobile-menu :global(a) {
          display: block;
          padding: 0.75rem 0;
          color: #404040;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .mobile-menu :global(a:last-child) {
          border-bottom: none;
        }
        
        .mobile-start {
          color: #000000 !important;
          font-weight: 600 !important;
        }
        
        .mobile-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #737373;
          padding: 1rem 0 0.5rem;
          border-bottom: none;
        }
        
        .mobile-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 0.5rem 0;
        }
        
        .mobile-cta {
          background: #000000;
          color: #ffffff !important;
          text-align: center;
          border-radius: 6px;
          margin-top: 0.5rem;
          font-weight: 600 !important;
        }
        
        @media (max-width: 900px) {
          .nav-links, .nav-cta, .nav {
            display: none;
          }
          
          .mobile-toggle {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
