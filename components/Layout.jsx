import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function Layout({ children, title, description, logoOnly }) {
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
              <nav className="rm-nav">
                <div className="rm-nav-links">
                  <Link href="/" className="rm-nav-link">Start</Link>

                  {/* Treatments Dropdown */}
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
                      <div className="rm-dropdown-divider"></div>
                      <Link href="/services" className="rm-dropdown-all">View All Services →</Link>
                    </div>
                  </div>

                  <a href="#home-testimonials" className="rm-nav-link">Reviews</a>
                </div>

                <a href="#home-hero" className="rm-nav-cta">
                  Book Assessment
                </a>
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
            </>
          )}
        </div>

        {!logoOnly && (
          <div className={`rm-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="/" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Start</a>
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
                <Link href="/services" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: '#1a1a1a', marginTop: '0.25rem' }}>View All Services →</Link>
              </div>
            )}
            <a href="#home-testimonials" className="rm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <a href="#home-hero" className="rm-mobile-cta" onClick={() => setMobileMenuOpen(false)}>Book Assessment</a>
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
          border-bottom: 1px solid #e8e8e8;
          z-index: 1000;
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

        .rm-dropdown-divider {
          height: 1px;
          background: #e8e8e8;
          margin: 0.375rem 0;
        }

        .rm-dropdown-menu :global(.rm-dropdown-all) {
          font-weight: 600;
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
