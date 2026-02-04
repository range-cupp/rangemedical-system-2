import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const treatments = [
    { href: '/hormone-optimization', label: 'Hormone Optimization' },
    { href: '/weight-loss', label: 'Weight Loss' },
    { href: '/cellular-energy-reset', label: 'Cellular Energy Reset' },
    { href: '/iv-therapy', label: 'IV Therapy' },
    { href: '/peptide-therapy', label: 'Peptide Therapy' },
    { href: '/nad-therapy', label: 'NAD+ Therapy' },
    { href: '/hyperbaric-oxygen-therapy', label: 'Hyperbaric Oxygen' },
    { href: '/red-light-therapy', label: 'Red Light Therapy' },
    { href: '/prp-injections', label: 'PRP Injections' },
    { href: '/exosome-therapy', label: 'Exosome Therapy' },
  ];

  const isActiveTreatment = treatments.some(t => router.pathname === t.href);

  return (
    <header className="rm-header">
      <div className="rm-header-inner">
        <Link href="/" className="rm-logo">
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
            alt="Range Medical" 
          />
        </Link>
        
        <nav className="rm-nav">
          <div className="rm-nav-links">
            <Link
              href="/injury-recovery"
              className={`rm-nav-link ${router.pathname === '/injury-recovery' ? 'active' : ''}`}
            >
              Injury Recovery
            </Link>

            <div className="rm-nav-dropdown">
              <button className={`rm-nav-dropdown-trigger ${isActiveTreatment ? 'active' : ''}`}>
                How We Treat 
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="rm-nav-dropdown-menu">
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
          
          <Link href="/range-assessment#book" className="rm-nav-cta">
            Take Assessment
          </Link>
        </nav>
        
        <button className="rm-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
      
      {mobileOpen && (
        <div className="rm-mobile-menu">
          <Link href="/injury-recovery" onClick={() => setMobileOpen(false)}>
            Injury Recovery
          </Link>
          <div className="rm-mobile-section-label">How We Treat</div>
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
          <div className="rm-mobile-divider"></div>
          <Link href="/lab-panels" onClick={() => setMobileOpen(false)}>
            Labs & Testing
          </Link>
          <Link href="/range-assessment#book" className="rm-mobile-cta" onClick={() => setMobileOpen(false)}>
            Take Assessment
          </Link>
        </div>
      )}
    </header>
  );
}
