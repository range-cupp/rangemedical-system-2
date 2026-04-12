import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LabPrepPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState({});
  const [ackState, setAckState] = useState('idle'); // idle | confirming | confirmed | already | error
  const [patientName, setPatientName] = useState('');
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    if (t) {
      console.log('[lab-prep] Token found:', t);
      setToken(t);
    }
  }, []);

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

  async function handleAcknowledge() {
    if (!token || ackState === 'confirming' || ackState === 'confirmed') return;
    setAckState('confirming');
    try {
      const res = await fetch('/api/lab-prep/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setAckState(data.alreadyAcknowledged ? 'already' : 'confirmed');
        if (data.name) setPatientName(data.name.split(' ')[0]);
      } else {
        setAckState('error');
      }
    } catch {
      setAckState('error');
    }
  }

  return (
    <>
      <Head>
        <title>How to Prepare for Your Lab Appointment | Range Medical</title>
        <meta name="description" content="Simple instructions to prepare for your lab work at Range Medical in Newport Beach. Fasting guidelines, cycle timing, and what to bring." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="lab work preparation, fasting for labs, hormone labs, Newport Beach, Orange County, Costa Mesa, Irvine" />
        <link rel="canonical" href="https://www.range-medical.com/lab-prep" />
        <meta property="og:title" content="How to Prepare for Your Lab Appointment | Range Medical" />
        <meta property="og:description" content="Simple instructions to prepare for your lab work at Range Medical in Newport Beach. Fasting guidelines, cycle timing, and what to bring." />
        <meta property="og:url" content="https://www.range-medical.com/lab-prep" />
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
          <Link href="/assessment" className="v2-nav-cta">Book Your Range Assessment</Link>
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
            <Link href="/assessment" className="v2-mobile-cta" onClick={() => setMenuOpen(false)}>Book Your Range Assessment</Link>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="v2-hero">
          <div className="v2-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> LAB PREPARATION</div>
            <h1>PREP FOR<br />YOUR BLOOD<br />DRAW.</h1>
            <div className="v2-hero-rule" />
            <p className="v2-hero-body">
              Accurate labs start with a little preparation. These are general guidelines &mdash;
              your provider may give you specific instructions based on your situation.
            </p>
          </div>
        </section>

        {/* ── GENERAL PREP ── */}
        <section id="v2-general" className={`v2-section v2-bg-light v2-reveal ${visible['v2-general'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> ALL PATIENTS</div>
            <h2>GENERAL<br />PREPARATION.</h2>
            <p className="v2-section-body">
              Follow these steps to ensure accurate results.
            </p>

            <div className="v2-prep-grid">
              <div className="v2-prep-card">
                <span className="v2-prep-number">01</span>
                <h3>FASTING</h3>
                <ul>
                  <li><strong>No food for 10 &ndash; 12 hours</strong> before your draw</li>
                  <li>Water is fine (and encouraged)</li>
                  <li>Black coffee or tea is okay &mdash; no creamer or sugar</li>
                </ul>
              </div>

              <div className="v2-prep-card">
                <span className="v2-prep-number">02</span>
                <h3>HYDRATION</h3>
                <ul>
                  <li><strong>Drink plenty of water</strong> 1 &ndash; 2 hours before your draw</li>
                  <li>Makes your veins easier to find</li>
                  <li>Avoid alcohol the night before</li>
                </ul>
              </div>

              <div className="v2-prep-card">
                <span className="v2-prep-number">03</span>
                <h3>AVOID</h3>
                <ul>
                  <li>Heavy or fatty meals the night before</li>
                  <li><strong>NSAIDs (Advil, ibuprofen)</strong> for 48 hours before</li>
                  <li>Alcohol the night before</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR MEN ── */}
        <section id="v2-men" className={`v2-section v2-reveal ${visible['v2-men'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> MEN&apos;S GUIDELINES</div>
            <h2>FOR MEN.</h2>
            <p className="v2-section-body">
              Additional considerations for accurate hormone testing.
            </p>

            <div className="v2-detail-list">
              <div className="v2-detail-row">
                <span className="v2-detail-num">01</span>
                <span className="v2-detail-title">Timing</span>
                <span className="v2-detail-desc">
                  <strong>Cortisol, testosterone, or prolactin:</strong> Schedule between 7:30 &ndash; 9:30 AM
                </span>
              </div>
              <div className="v2-detail-row">
                <span className="v2-detail-num">02</span>
                <span className="v2-detail-title">Testosterone Injections</span>
                <span className="v2-detail-desc">
                  <strong>Hold injections for 3 days</strong> before your labs. Schedule your draw for the morning of your injection day, before dosing. Resume after your lab.
                </span>
              </div>
              <div className="v2-detail-row">
                <span className="v2-detail-num">03</span>
                <span className="v2-detail-title">PSA Testing</span>
                <span className="v2-detail-desc">
                  Avoid heavy workouts for <strong>24 hours</strong> before. Avoid sexual activity for <strong>24 hours</strong> before.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR WOMEN ── */}
        <section id="v2-women" className={`v2-section v2-bg-light v2-reveal ${visible['v2-women'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> WOMEN&apos;S GUIDELINES</div>
            <h2>FOR WOMEN.</h2>
            <p className="v2-section-body">
              Timing matters for accurate hormone results.
            </p>

            <div className="v2-detail-list">
              <div className="v2-detail-row">
                <span className="v2-detail-num">01</span>
                <span className="v2-detail-title">Hormone Medications</span>
                <span className="v2-detail-desc">
                  <strong>Estrogen &amp; progesterone:</strong> Continue as normal. <strong>Testosterone injections:</strong> Hold for 3 days before labs.
                </span>
              </div>
              <div className="v2-detail-row">
                <span className="v2-detail-num">02</span>
                <span className="v2-detail-title">Timing</span>
                <span className="v2-detail-desc">
                  <strong>Cortisol, testosterone, or prolactin:</strong> Schedule between 7:30 &ndash; 9:30 AM. <strong>If cycling:</strong> Schedule on Day 3 of your period. <strong>Not cycling / postmenopausal:</strong> Follow fasting and hydration steps.
                </span>
              </div>
            </div>

            <div className="v2-callout">
              <strong>If your cycle doesn&apos;t line up with your appointment:</strong> Don&apos;t cancel online.
              Text or call us at <strong>(949) 997-3988</strong> and we&apos;ll help you figure out what to do.
            </div>
          </div>
        </section>

        {/* ── MEDICATIONS GUIDE ── */}
        <section id="v2-meds" className={`v2-section v2-reveal ${visible['v2-meds'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> QUICK REFERENCE</div>
            <h2>MEDICATIONS<br />GUIDE.</h2>
            <p className="v2-section-body">
              What to continue, skip, or stop before your labs.
            </p>

            <div className="v2-meds-grid">
              <div className="v2-med-card v2-med-stop">
                <span className="v2-med-status">STOP</span>
                <h4>NSAIDs (Advil, ibuprofen)</h4>
                <p>Stop 48 hours before</p>
              </div>
              <div className="v2-med-card v2-med-skip">
                <span className="v2-med-status">SKIP</span>
                <h4>Thyroid Meds</h4>
                <p>Skip morning of draw, take after</p>
              </div>
              <div className="v2-med-card v2-med-stop">
                <span className="v2-med-status">HOLD</span>
                <h4>Testosterone Injections</h4>
                <p>Hold 3 days before</p>
              </div>
              <div className="v2-med-card v2-med-continue">
                <span className="v2-med-status">CONTINUE</span>
                <h4>Estrogen &amp; Progesterone</h4>
                <p>Continue as normal</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DAY-OF CHECKLIST ── */}
        <section id="v2-checklist" className={`v2-section v2-bg-dark v2-reveal ${visible['v2-checklist'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label v2-label-light"><span className="v2-dot v2-dot-light" /> DAY OF</div>
            <h2 className="v2-h2-light">BEFORE YOU<br />LEAVE.</h2>
            <p className="v2-section-body v2-body-light">
              Run through this checklist the morning of your appointment.
            </p>

            <div className="v2-checklist-grid">
              {[
                'Arrive 5 \u2013 10 minutes early to check in',
                'Bring a valid ID (driver\u2019s license, passport)',
                'Fasted 10 \u2013 12 hours (water / black coffee okay)',
                'Hydrated in the 1 \u2013 2 hours before',
                'Skipped thyroid meds this morning',
                'Wearing a shirt with sleeves that roll up',
                'Packed a snack for after your draw',
              ].map((item, i) => (
                <div key={i} className="v2-check-item">
                  <span className="v2-check-box" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUESTIONS ── */}
        <section id="v2-questions" className={`v2-section v2-bg-light v2-reveal ${visible['v2-questions'] ? 'v2-visible' : ''}`}>
          <div className="v2-container v2-questions-inner">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>NOT SURE<br />ABOUT<br />SOMETHING?</h2>
            <div className="v2-hero-rule" />
            <p className="v2-section-body">
              If anything is unclear or you&apos;re unsure how to prepare, just ask. We&apos;re happy to help.
            </p>
            <a href="tel:+19499973988" className="v2-phone-btn">(949) 997-3988</a>
            <p className="v2-phone-sub">Text or call anytime</p>
          </div>
        </section>

        {/* ── ACKNOWLEDGE ── */}
        {token && (
          <section id="v2-ack" className="v2-section v2-ack-section">
            <div className="v2-container v2-ack-inner">
              {ackState === 'confirmed' ? (
                <>
                  <div className="v2-ack-check">&#10003;</div>
                  <h2>GOT IT{patientName ? `, ${patientName.toUpperCase()}` : ''}.</h2>
                  <p>You&apos;re all set. We&apos;ll see you at your appointment.</p>
                </>
              ) : ackState === 'already' ? (
                <>
                  <div className="v2-ack-check">&#10003;</div>
                  <h2>ALREADY<br />CONFIRMED.</h2>
                  <p>You&apos;ve already acknowledged your prep instructions. See you soon.</p>
                </>
              ) : (
                <>
                  <div className="v2-label"><span className="v2-dot" /> CONFIRMATION</div>
                  <h2>READY FOR<br />YOUR DRAW?</h2>
                  <div className="v2-hero-rule" style={{ margin: '0 0 2rem' }} />
                  <p>By pressing the button below, you confirm that you&apos;ve read and understand the preparation instructions above.</p>
                  <button
                    className="v2-ack-btn"
                    onClick={handleAcknowledge}
                    disabled={ackState === 'confirming'}
                  >
                    {ackState === 'confirming' ? 'CONFIRMING...' : 'I UNDERSTAND'}
                  </button>
                  {ackState === 'error' && (
                    <p className="v2-ack-error">Something went wrong. Please try again or call (949) 997-3988.</p>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* ── FINAL CTA ── */}
        <section className="v2-section v2-cta-section">
          <div className="v2-container v2-cta-inner">
            {token ? (
              <h2>QUESTIONS?<br />WE&apos;RE HERE.</h2>
            ) : (
              <h2>READY TO<br />BOOK YOUR<br />LABS?</h2>
            )}
            <div className="v2-cta-rule" />
            {token ? (
              <p>Call or text anytime if anything is unclear.</p>
            ) : (
              <p>If you found this page but haven&apos;t scheduled yet, start with an assessment.</p>
            )}
            <div className="v2-cta-buttons">
              <Link href="/assessment" className="v2-btn-white">Book Your Range Assessment</Link>
              <a href="tel:+19499973988" className="v2-btn-outline">CALL (949) 997-3988</a>
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
              <Link href="/assessment">Book Your Range Assessment</Link>
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

        .v2-label-light {
          color: #808080;
        }

        .v2-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #808080;
        }

        .v2-dot-light {
          background: #606060;
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

        .v2-bg-dark {
          background: #1a1a1a;
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

        .v2-h2-light {
          color: #ffffff !important;
        }

        .v2-section-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          max-width: 480px;
          margin: 0 0 3.5rem;
        }

        .v2-body-light {
          color: #808080;
        }

        /* ── PREP CARDS ── */
        .v2-prep-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
        }

        .v2-prep-card {
          padding: 2.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }

        .v2-prep-card:last-child {
          border-right: none;
        }

        .v2-prep-number {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .v2-prep-card h3 {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.01em;
          color: #1a1a1a;
          margin: 0 0 1.25rem;
        }

        .v2-prep-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .v2-prep-card li {
          font-size: 0.875rem;
          color: #404040;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f0f0f0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.6;
        }

        .v2-prep-card li::before {
          content: "–";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        .v2-prep-card li:last-child {
          border-bottom: none;
        }

        .v2-prep-card li strong {
          color: #1a1a1a;
        }

        /* ── DETAIL LIST (men/women rows) ── */
        .v2-detail-list {
          border-top: 1px solid #e0e0e0;
        }

        .v2-detail-row {
          display: grid;
          grid-template-columns: 3rem 200px 1fr;
          gap: 2rem;
          align-items: baseline;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .v2-detail-num {
          font-size: 0.75rem;
          font-weight: 600;
          color: #808080;
          letter-spacing: 0.05em;
        }

        .v2-detail-title {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .v2-detail-desc {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        .v2-detail-desc strong {
          color: #404040;
        }

        /* ── CALLOUT ── */
        .v2-callout {
          margin-top: 2.5rem;
          padding: 1.5rem 2rem;
          border-left: 3px solid #1a1a1a;
          background: #ffffff;
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #404040;
        }

        .v2-callout strong {
          color: #1a1a1a;
        }

        /* ── MEDICATIONS GRID ── */
        .v2-meds-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid #e0e0e0;
          border-left: 1px solid #e0e0e0;
        }

        .v2-med-card {
          padding: 2rem 1.5rem;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        .v2-med-status {
          display: inline-block;
          font-size: 0.5625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          padding: 0.25rem 0.625rem;
          margin-bottom: 1rem;
        }

        .v2-med-stop .v2-med-status {
          background: #1a1a1a;
          color: #ffffff;
        }

        .v2-med-skip .v2-med-status {
          background: #f5f5f5;
          color: #737373;
          border: 1px solid #d0d0d0;
        }

        .v2-med-continue .v2-med-status {
          background: #f0f0f0;
          color: #404040;
        }

        .v2-med-card h4 {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }

        .v2-med-card p {
          font-size: 0.8125rem;
          color: #737373;
          margin: 0;
          line-height: 1.5;
        }

        /* ── CHECKLIST ── */
        .v2-checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .v2-check-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.875rem;
          color: #d0d0d0;
          line-height: 1.5;
        }

        .v2-check-box {
          width: 18px;
          height: 18px;
          border: 1.5px solid #606060;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── QUESTIONS ── */
        .v2-questions-inner {
          max-width: 700px;
        }

        .v2-phone-btn {
          display: inline-block;
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.875rem 2.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          transition: background 0.2s;
        }

        .v2-phone-btn:hover {
          background: #404040;
        }

        .v2-phone-sub {
          font-size: 0.8125rem;
          color: #a0a0a0;
          margin: 1rem 0 0;
        }

        /* ── ACKNOWLEDGE ── */
        .v2-ack-section {
          background: #ffffff;
          text-align: center;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        .v2-ack-inner {
          max-width: 600px;
          margin: 0 auto;
        }

        .v2-ack-inner h2 {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          text-align: center;
        }

        .v2-ack-inner p {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #737373;
          margin: 0 0 2.5rem;
          text-align: center;
        }

        .v2-ack-inner .v2-label {
          justify-content: center;
        }

        .v2-ack-btn {
          display: inline-block;
          background: #1a1a1a;
          color: #ffffff;
          padding: 1.125rem 3.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .v2-ack-btn:hover {
          background: #404040;
        }

        .v2-ack-btn:disabled {
          background: #808080;
          cursor: not-allowed;
        }

        .v2-ack-check {
          font-size: 3rem;
          color: #22c55e;
          margin-bottom: 1.5rem;
        }

        .v2-ack-error {
          color: #ef4444 !important;
          font-size: 0.875rem !important;
          margin-top: 1rem !important;
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
          .v2-prep-grid {
            grid-template-columns: 1fr;
          }

          .v2-prep-card {
            border-right: none;
          }

          .v2-detail-row {
            grid-template-columns: 3rem 1fr;
          }

          .v2-detail-desc {
            grid-column: 1 / -1;
            padding-left: 3rem;
            padding-top: 0;
          }

          .v2-meds-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .v2-checklist-grid {
            grid-template-columns: 1fr;
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

          .v2-detail-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .v2-detail-num {
            display: none;
          }

          .v2-detail-desc {
            padding-left: 0;
          }

          .v2-meds-grid {
            grid-template-columns: 1fr;
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
