import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function Layout({ children, title, description, logoOnly }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileTreatmentsOpen, setMobileTreatmentsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>{title || 'Range Medical | Newport Beach'}</title>
        <meta name="description" content={description || 'Range Medical in Newport Beach. Two ways to feel like yourself again.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {/* Header */}
      <header className={`rm-header${scrolled ? ' rm-header-scrolled' : ''}`}>
        <div className="rm-header-inner">
          {logoOnly ? (
            <span className="rm-wordmark" style={{ cursor: 'default' }}>
              <img
                src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
                alt="Range Medical"
                style={{ height: '56px' }}
              />
            </span>
          ) : (
            <Link href="/" className="rm-wordmark">
              <img
                src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
                alt="Range Medical"
                style={{ height: '56px' }}
              />
            </Link>
          )}

          {!logoOnly && (
            <>
              {/* Desktop Navigation */}
              <nav className="rm-nav" aria-label="Main navigation">
                <div className="rm-nav-links">
                  <div
                    className="rm-mega-wrap"
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                  >
                    <button
                      className="rm-nav-link rm-mega-trigger"
                      aria-expanded={megaOpen}
                      aria-haspopup="true"
                    >
                      Treatments
                      <svg width="8" height="5" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <div className={`rm-mega${megaOpen ? ' open' : ''}`} role="menu" aria-label="Treatments menu">
                      <div className="rm-mega-inner">
                        <div className="rm-mega-col" role="group" aria-label="Recovery treatments">
                          <span className="rm-mega-label">Recovery</span>
                          <Link href="/hyperbaric-oxygen-therapy" role="menuitem">Hyperbaric Oxygen</Link>
                          <Link href="/red-light-therapy" role="menuitem">Red Light Therapy</Link>
                          <Link href="/cellular-energy-reset" role="menuitem">Cellular Reset</Link>
                          <Link href="/prp-therapy" role="menuitem">PRP Therapy</Link>
                          <Link href="/exosome-therapy" role="menuitem">Exosome Therapy</Link>
                          <Link href="/injection-therapy" role="menuitem">Injection Therapy</Link>
                          <Link href="/peptide-therapy" role="menuitem">Peptide Therapy</Link>
                        </div>
                        <div className="rm-mega-col" role="group" aria-label="Optimization treatments">
                          <span className="rm-mega-label">Optimization</span>
                          <Link href="/hormone-optimization" role="menuitem">Hormone Optimization</Link>
                          <Link href="/weight-loss" role="menuitem">Weight Loss</Link>
                          <Link href="/nad-therapy" role="menuitem">NAD+ Therapy</Link>
                          <Link href="/iv-therapy" role="menuitem">IV Therapy</Link>
                          <Link href="/peptide-therapy" role="menuitem">Peptide Therapy</Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href="/how-it-works" className="rm-nav-link">How It Works</Link>
                  <Link href="/reviews" className="rm-nav-link">Reviews</Link>
                </div>

                <Link href="/assessment" className="rm-nav-cta">
                  Book Assessment
                </Link>
              </nav>

              {/* Mobile Menu Toggle */}
              <button
                className="rm-mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span></span>
                <span></span>
              </button>
            </>
          )}
        </div>

        {!logoOnly && (
          <div className={`rm-mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="navigation" aria-label="Mobile navigation">
            <button
              className="rm-mobile-accordion"
              onClick={() => setMobileTreatmentsOpen(!mobileTreatmentsOpen)}
              aria-expanded={mobileTreatmentsOpen}
            >
              <span>Treatments</span>
              <svg
                width="10" height="6" viewBox="0 0 12 7" fill="none" aria-hidden="true"
                style={{ transform: mobileTreatmentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileTreatmentsOpen && (
              <div className="rm-mobile-sub">
                <span className="rm-mobile-cat">Recovery</span>
                <Link href="/hyperbaric-oxygen-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hyperbaric Oxygen</Link>
                <Link href="/red-light-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Red Light Therapy</Link>
                <Link href="/cellular-energy-reset" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Cellular Reset</Link>
                <Link href="/prp-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>PRP Therapy</Link>
                <Link href="/exosome-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Exosome Therapy</Link>
                <Link href="/injection-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Injection Therapy</Link>
                <Link href="/peptide-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Peptide Therapy</Link>
                <span className="rm-mobile-cat" style={{ marginTop: '0.75rem' }}>Optimization</span>
                <Link href="/hormone-optimization" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Hormone Optimization</Link>
                <Link href="/weight-loss" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Weight Loss</Link>
                <Link href="/nad-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>NAD+ Therapy</Link>
                <Link href="/iv-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>IV Therapy</Link>
                <Link href="/peptide-therapy" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Peptide Therapy</Link>
              </div>
            )}
            <Link href="/how-it-works" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/reviews" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Reviews</Link>
            <Link href="/assessment" className="rm-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Book Assessment</Link>
            <div className="rm-mobile-contact">
              <a href="tel:9499973988">(949) 997-3988</a>
              <span>1901 Westcliff Dr, Suite 10, Newport Beach, CA</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {!logoOnly && (
      <footer className="rm-footer">
        <div className="rm-footer-inner">
          <div className="rm-footer-brand">
            <img
              src="https://www.range-medical.com/brand/range_logo_transparent_black.png"
              alt="Range Medical"
              className="rm-footer-wordmark"
              style={{ height: '24px' }}
            />
            <p className="rm-footer-tagline">Feel like yourself again.</p>
            <a href="tel:9499973988" className="rm-footer-contact">(949) 997-3988</a>
            <p className="rm-footer-address">
              1901 Westcliff Dr. Suite 10<br />
              Newport Beach, CA 92660
            </p>
            <p className="rm-footer-hours">Mon – Fri: 7:00 AM – 6:00 PM<br />Saturday: 9:00 AM – 2:00 PM<br />Sunday: Closed</p>
          </div>
          <div className="rm-footer-links">
            <div className="rm-footer-col">
              <h4>START</h4>
              <ul>
                <li><Link href="/assessment">Book Your Range Assessment</Link></li>
                <li><Link href="/injury-recovery">Injury & Recovery</Link></li>
                <li><Link href="/energy-optimization">Energy & Optimization</Link></li>
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
      )}

      <style jsx>{`
        /* ── HEADER ── */
        .rm-header {
          position: sticky;
          top: 0;
          background: #ffffff;
          border-bottom: 1px solid var(--color-border);
          z-index: 1000;
          transition: background var(--transition), box-shadow var(--transition), backdrop-filter var(--transition);
        }

        .rm-header-scrolled {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
        }

        .rm-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2.5rem;
          height: 64px;
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
          gap: 2.5rem;
        }

        .rm-nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .rm-nav-links :global(a),
        .rm-nav-links :global(button) {
          color: var(--color-text);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
          transition: color var(--transition);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: inherit;
          line-height: 1;
          padding: 0;
          position: relative;
        }

        .rm-nav-links :global(a:hover),
        .rm-nav-links :global(button:hover) {
          color: var(--color-text);
        }

        .rm-nav-links :global(a)::after,
        .rm-nav-links :global(button)::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--color-text);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform var(--transition);
        }

        .rm-nav-links :global(a:hover)::after,
        .rm-nav-links :global(button:hover)::after {
          transform: scaleX(1);
        }

        .rm-nav-links :global(.rm-mega-trigger)::after {
          display: none;
        }

        :global(.rm-nav-cta) {
          background: var(--color-accent);
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 999px;
          font-weight: 500;
          font-size: 15px;
          text-decoration: none;
          transition: background var(--transition);
          line-height: 1;
          white-space: nowrap;
        }

        :global(.rm-nav-cta:hover) {
          background: var(--color-accent-hover);
        }

        /* Mega-Menu */
        .rm-mega-wrap {
          position: static;
        }

        .rm-mega-trigger {
          font-family: inherit;
        }

        .rm-mega {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border-bottom: 1px solid var(--color-border);
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease-out, visibility 0.15s ease-out;
        }

        .rm-mega.open {
          opacity: 1;
          visibility: visible;
        }

        .rm-mega-inner {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 5rem 3.25rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        .rm-mega-col {
          display: flex;
          flex-direction: column;
        }

        .rm-mega-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
        }

        .rm-mega-col :global(a) {
          display: block;
          padding: 0.375rem 0 0.375rem 14px;
          font-size: 17px;
          font-weight: 400;
          color: var(--color-text);
          text-decoration: none;
          transition: color var(--transition);
          line-height: 1.4;
          position: relative;
        }

        .rm-mega-col :global(a)::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--color-accent);
          opacity: 0;
          transition: opacity var(--transition);
        }

        .rm-mega-col :global(a:hover)::before {
          opacity: 1;
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
          border-bottom: 1px solid var(--color-border);
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
          font-size: 15px;
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
          font-size: 15px;
          font-weight: 500;
          color: #404040;
          cursor: pointer;
          font-family: inherit;
        }

        .rm-mobile-sub {
          padding-left: 1rem;
        }

        .rm-mobile-sub :global(a) {
          font-size: 14px;
          color: var(--color-text-muted);
        }

        :global(.rm-mobile-cat) {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          padding: 0.625rem 0 0.25rem;
        }

        :global(.rm-mobile-cta) {
          display: block;
          background: var(--color-accent);
          color: #ffffff !important;
          text-align: center;
          padding: 0.875rem 1rem !important;
          margin-top: 1rem;
          font-weight: 500 !important;
          font-size: 15px !important;
          text-decoration: none;
          border: none !important;
          border-radius: 999px;
        }

        .rm-mobile-contact {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
          text-align: center;
        }

        .rm-mobile-contact a {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
          text-decoration: none;
          margin-bottom: 0.375rem;
        }

        .rm-mobile-contact span {
          display: block;
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.4;
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

        .rm-footer-hours {
          font-size: 13px;
          color: #a0a0a0;
          margin: 0.5rem 0 0;
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
        @media (max-width: 1024px) {
          .rm-nav {
            display: none;
          }

          .rm-mobile-toggle {
            display: flex;
          }
        }

        @media (max-width: 768px) {
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

      {/* Retell.ai Voice Assistant Widget */}
      <RetellVoiceWidget />
    </>
  );
}

function RetellVoiceWidget() {
  const [active, setActive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [liveAgent, setLiveAgent] = useState('');
  const [liveUser, setLiveUser] = useState('');
  const messagesEndRef = { current: null };

  useEffect(() => {
    return () => {
      if (client) {
        try { client.stopCall(); } catch (e) { /* ignore */ }
      }
    };
  }, [client]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, liveAgent, liveUser]);

  async function startCall() {
    const { RetellWebClient } = await import('retell-client-js-sdk');
    const rc = new RetellWebClient();

    rc.on('call_started', () => setActive(true));
    rc.on('call_ended', () => {
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    });
    rc.on('error', () => {
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    });

    rc.on('update', (update) => {
      if (!update.transcript) return;
      const turns = update.transcript;
      const finalized = [];
      let pendingAgent = '';
      let pendingUser = '';

      for (const turn of turns) {
        if (turn.role === 'agent') {
          if (turn.status === 'complete' || turn.status === 'final') {
            finalized.push({ role: 'agent', text: turn.content });
          } else {
            pendingAgent = turn.content || '';
          }
        } else {
          if (turn.status === 'complete' || turn.status === 'final') {
            finalized.push({ role: 'user', text: turn.content });
          } else {
            pendingUser = turn.content || '';
          }
        }
      }

      setMessages(finalized);
      setLiveAgent(pendingAgent);
      setLiveUser(pendingUser);
    });

    try {
      await rc.startCall({
        accessToken: await fetchAccessToken(),
      });
      setClient(rc);
    } catch (err) {
      console.error('Retell call error:', err);
      setActive(false);
    }
  }

  function endCall() {
    if (client) {
      client.stopCall();
      setActive(false);
      setLiveAgent('');
      setLiveUser('');
    }
  }

  function handleMicClick() {
    if (!panelOpen) {
      setPanelOpen(true);
      if (!active) {
        setMessages([]);
        startCall();
      }
    } else if (active) {
      endCall();
    } else {
      setPanelOpen(false);
    }
  }

  async function fetchAccessToken() {
    const res = await fetch('/api/voice-agent/token');
    const data = await res.json();
    return data.access_token;
  }

  return (
    <>
      {/* Chat panel */}
      {panelOpen && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 48px)',
          height: '500px',
          maxHeight: 'calc(100vh - 140px)',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: '#0a0a0a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: active ? '#22c55e' : '#6b7280',
                boxShadow: active ? '0 0 6px #22c55e' : 'none',
              }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Range Medical Assistant</span>
            </div>
            <button
              onClick={() => { endCall(); setPanelOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.length === 0 && !liveAgent && !liveUser && (
              <div style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '13px',
                marginTop: '40px',
              }}>
                {active ? 'Listening...' : 'Click the mic button to start talking'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? '#0a0a0a' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : '#1f2937',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {liveUser && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  background: '#0a0a0a',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  opacity: 0.7,
                }}>
                  {liveUser}
                </div>
              </div>
            )}
            {liveAgent && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 4px',
                  background: '#f3f4f6',
                  color: '#1f2937',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  opacity: 0.7,
                }}>
                  {liveAgent}
                </div>
              </div>
            )}
            <div ref={(el) => { messagesEndRef.current = el; }} />
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            {active ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#22c55e',
                  fontSize: '13px',
                  fontWeight: 500,
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  Listening
                </div>
                <button
                  onClick={endCall}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  End call
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMessages([]); startCall(); }}
                style={{
                  background: '#0a0a0a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                Start new call
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating mic button */}
      <button
        onClick={handleMicClick}
        aria-label={active ? 'End voice assistant call' : 'Talk to Range Medical AI assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: active ? '#ef4444' : '#0a0a0a',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'background 0.2s, transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {active ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>
      {!panelOpen && !active && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '24px',
          background: '#fff',
          color: '#0a0a0a',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          Talk to us
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
