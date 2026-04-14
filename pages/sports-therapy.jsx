import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function SportsTherapy() {
  const [visible, setVisible] = useState({});

  const smsLink = 'sms:9499973988?&body=' + encodeURIComponent("Hi, I'm at Range Sports Therapy and I'd like to get some information about Range Medical.");

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
    <Layout
      title="Range Medical | Upstairs from Range Sports Therapy"
      description="Recover faster with peptide therapy, PRP, exosomes, red light therapy, and more. Range Medical is upstairs from Range Sports Therapy in Newport Beach."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* ── HERO ── */}
        <section className="v2-hero">
          <div className="v2-hero-inner">
            <div className="v2-label"><span className="v2-dot" /> RANGE SPORTS THERAPY PATIENTS</div>
            <h1>RECOVER FASTER.<br />WE&rsquo;RE RIGHT<br />UPSTAIRS.</h1>
            <div className="v2-hero-rule" />
            <p className="v2-hero-body">
              Range Medical is in the same building as Range Sports Therapy. We offer regenerative treatments that work alongside your PT and rehab to help you heal faster and get back to what you love.
            </p>
            <a href={smsLink} className="svc-btn-book" style={{ display: 'inline-block', width: 'auto', padding: '0.875rem 2rem', marginTop: '2rem' }}>
              Text Us to Learn More
            </a>
            <p className="st-cta-sub">Pre-filled message &mdash; just hit send</p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            INJURY & RECOVERY
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="st-recovery" className={`v2-section v2-reveal ${visible['st-recovery'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> INJURY &amp; RECOVERY</div>

            {/* Peptide Therapy — Featured */}
            <h2 className="svc-section-title">PEPTIDE THERAPY</h2>
            <p className="svc-section-sub">BPC-157 / TB4 &mdash; the most requested recovery treatment from Sports Therapy patients.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-featured svc-price-card-wide">
                <div className="svc-card-badge">MOST REQUESTED</div>
                <h3>BPC-157 / TB4 Protocol</h3>
                <div className="svc-card-detail">Targeted recovery peptides</div>
                <ul className="svc-card-list">
                  <li>Supports tissue repair and reduces inflammation</li>
                  <li>Accelerates healing from injuries, surgery, and chronic pain</li>
                  <li>Simple at-home subcutaneous injections</li>
                  <li>Most patients see improvement within 2&ndash;4 weeks</li>
                  <li>Prescribed by our provider based on your situation</li>
                </ul>
                <a href={smsLink} className="svc-btn-book">Text Us About Peptides</a>
              </div>
            </div>

            {/* Toradol */}
            <h2 className="svc-section-title svc-mt">PAIN RELIEF</h2>
            <p className="svc-section-sub">Fast-acting options for acute pain and inflammation.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>Toradol Injection</h3>
                <div className="svc-card-detail">Prescription-strength anti-inflammatory</div>
                <ul className="svc-card-list">
                  <li>Works fast to reduce inflammation and pain</li>
                  <li>Great for acute injuries, flare-ups, and post-workout soreness</li>
                  <li>In and out in minutes &mdash; no downtime</li>
                </ul>
                <a href={smsLink} className="svc-btn-book">Text Us About Pain Relief</a>
              </div>
            </div>

            {/* PRP & Exosomes */}
            <h2 className="svc-section-title svc-mt">REGENERATIVE TREATMENTS</h2>
            <p className="svc-section-sub">Advanced therapies that support your body&rsquo;s natural repair process.</p>

            <div className="svc-price-grid svc-price-grid-2">
              <div className="svc-price-card">
                <h3>PRP Therapy</h3>
                <div className="svc-card-detail">Platelet-Rich Plasma</div>
                <ul className="svc-card-list">
                  <li>Your own platelets concentrated and injected</li>
                  <li>Growth factors support natural repair</li>
                  <li>Ideal for tendons, joints, and ligaments</li>
                </ul>
                <a href={smsLink} className="svc-btn-book">Text Us About PRP</a>
              </div>

              <div className="svc-price-card">
                <h3>Exosome Therapy</h3>
                <div className="svc-card-detail">Cell-Signaling IV Infusion</div>
                <ul className="svc-card-list">
                  <li>Cell-signaling molecules that ramp up repair</li>
                  <li>Delivered via standard IV (30&ndash;60 min)</li>
                  <li>Benefits develop over 2&ndash;3 months</li>
                </ul>
                <a href={smsLink} className="svc-btn-book">Text Us About Exosomes</a>
              </div>
            </div>

            {/* Red Light */}
            <h2 className="svc-section-title svc-mt">FULL BODY RED LIGHT THERAPY</h2>
            <p className="svc-section-sub">Medical-grade 660&ndash;850nm wavelengths for cellular recovery and tissue repair.</p>

            <div className="svc-price-grid svc-price-grid-1">
              <div className="svc-price-card svc-price-card-wide">
                <h3>Red Light Therapy Session</h3>
                <div className="svc-card-detail">10&ndash;20 minutes, no downtime</div>
                <ul className="svc-card-list">
                  <li>Stimulates cellular repair and collagen production</li>
                  <li>Reduces inflammation and supports recovery</li>
                  <li>Can be combined with other treatments</li>
                </ul>
                <a href={smsLink} className="svc-btn-book">Text Us About Red Light</a>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            ENERGY & OPTIMIZATION
        ════════════════════════════════════════════════════════════════════════ */}
        <section id="st-optimization" className={`v2-section v2-bg-light v2-reveal ${visible['st-optimization'] ? 'v2-visible' : ''}`}>
          <div className="v2-container">
            <div className="v2-label"><span className="v2-dot" /> ENERGY &amp; OPTIMIZATION</div>

            <h2 className="svc-section-title">MORE THAN RECOVERY</h2>
            <p className="svc-section-sub">Beyond injury care, Range Medical helps you optimize how your body performs. All under one roof, right upstairs.</p>

            <div className="svc-price-grid svc-price-grid-3">
              <div className="svc-price-card">
                <h3>Lab Panels</h3>
                <div className="svc-card-detail">Comprehensive testing</div>
                <ul className="svc-card-list">
                  <li>Hormone, metabolic, and thyroid panels</li>
                  <li>Goes beyond standard bloodwork</li>
                  <li>Results in 3&ndash;5 days</li>
                </ul>
                <Link href="/lab-panels" className="svc-btn-start">Learn More</Link>
              </div>

              <div className="svc-price-card">
                <h3>Hormone Optimization</h3>
                <div className="svc-card-detail">$250/month membership</div>
                <ul className="svc-card-list">
                  <li>Medications, labs, and monthly IV</li>
                  <li>Energy, mood, sleep, performance</li>
                  <li>Provider check-ins</li>
                </ul>
                <Link href="/hormone-optimization" className="svc-btn-start">Learn More</Link>
              </div>

              <div className="svc-price-card">
                <h3>Medical Weight Loss</h3>
                <div className="svc-card-detail">GLP-1 programs</div>
                <ul className="svc-card-list">
                  <li>Tirzepatide, Semaglutide, Retatrutide</li>
                  <li>Physician-supervised</li>
                  <li>Weekly check-ins and dose adjustments</li>
                </ul>
                <Link href="/weight-loss" className="svc-btn-start">Learn More</Link>
              </div>

              <div className="svc-price-card">
                <h3>IV Therapy</h3>
                <div className="svc-card-detail">Custom infusions</div>
                <ul className="svc-card-list">
                  <li>NAD+, Vitamin C, glutathione</li>
                  <li>Energy, immune, and recovery</li>
                  <li>Walk-ins welcome</li>
                </ul>
                <Link href="/iv-therapy" className="svc-btn-start">Learn More</Link>
              </div>

              <div className="svc-price-card">
                <h3>Hyperbaric Oxygen</h3>
                <div className="svc-card-detail">60&ndash;90 min pressurized oxygen</div>
                <ul className="svc-card-list">
                  <li>Floods tissues with healing oxygen</li>
                  <li>Reduces inflammation</li>
                  <li>Used by pro athletes</li>
                </ul>
                <Link href="/hyperbaric-oxygen-therapy" className="svc-btn-start">Learn More</Link>
              </div>

              <div className="svc-price-card svc-price-card-featured">
                <h3>View Full Menu</h3>
                <div className="svc-card-detail">All services and pricing</div>
                <ul className="svc-card-list">
                  <li>Complete pricing for every service</li>
                  <li>Book and pay online</li>
                  <li>Memberships and packages</li>
                </ul>
                <Link href="/services" className="svc-btn-start">View All Services &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="v2-section v2-cta-section">
          <div className="v2-cta-inner" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="v2-label" style={{ justifyContent: 'center', color: '#525252' }}><span className="v2-dot" style={{ background: '#525252' }} /> GET STARTED</div>
            <h2>INTERESTED?<br />TEXT US.</h2>
            <div className="v2-cta-rule" />
            <p>We&rsquo;re right upstairs. Send a quick text and we&rsquo;ll get back to you with information, pricing, or help you set up a visit.</p>
            <div className="v2-cta-buttons">
              <a href={smsLink} className="v2-btn-white">Text (949) 997-3988</a>
              <a href="tel:9499973988" className="v2-btn-outline">Call Us</a>
            </div>
            <p className="v2-cta-location">Range Medical &bull; 1901 Westcliff Dr, Suite 10 &bull; Upstairs</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        :global(body) { margin: 0; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #1a1a1a; }

        /* ── HERO ── */
        .v2-hero { padding: 6rem 2rem 5rem; max-width: 1200px; margin: 0 auto; }
        .v2-hero-inner { max-width: 800px; }
        .v2-label { display: flex; align-items: center; gap: 0.625rem; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.14em; color: #737373; text-transform: uppercase; margin-bottom: 2rem; }
        .v2-dot { display: inline-block; width: 8px; height: 8px; background: #808080; }
        .v2-hero h1 { font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.03em; color: #1a1a1a; margin: 0 0 2.5rem; }
        .v2-hero-rule { width: 100%; max-width: 700px; height: 1px; background: #e0e0e0; margin-bottom: 2rem; }
        .v2-hero-body { font-size: 1.0625rem; line-height: 1.75; color: #737373; max-width: 520px; margin: 0; }

        .st-cta-sub { font-size: 0.8125rem; color: #a3a3a3; margin-top: 0.75rem; }

        /* ── SECTIONS ── */
        .v2-section { padding: 5rem 2rem; }
        .v2-bg-light { background: #fafafa; }
        .v2-container { max-width: 1200px; margin: 0 auto; }

        /* ── SECTION TITLES ── */
        .svc-section-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 0.5rem; text-transform: uppercase; }
        .svc-section-sub { font-size: 0.9375rem; line-height: 1.6; color: #737373; margin: 0 0 2rem; max-width: 600px; }
        .svc-mt { margin-top: 4rem; }

        /* ── PRICE GRID ── */
        .svc-price-grid { display: grid; gap: 1.25rem; }
        .svc-price-grid-1 { grid-template-columns: 1fr; max-width: 600px; }
        .svc-price-grid-2 { grid-template-columns: 1fr 1fr; }
        .svc-price-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

        /* ── PRICE CARD ── */
        .svc-price-card { position: relative; padding: 1.75rem; border: 1px solid #e0e0e0; background: #ffffff; display: flex; flex-direction: column; transition: border-color 0.2s, box-shadow 0.2s; }
        .svc-price-card:hover { border-color: #c0c0c0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .svc-price-card-featured { border: 2px solid #1a1a1a; }
        .svc-price-card-featured:hover { border-color: #1a1a1a; }
        .svc-price-card-wide { max-width: 600px; }

        .svc-card-badge { position: absolute; top: -10px; left: 1.25rem; font-size: 0.5625rem; font-weight: 800; letter-spacing: 0.14em; color: #ffffff; background: #1a1a1a; padding: 0.25rem 0.625rem; }
        .svc-price-card h3 { font-size: 1rem; font-weight: 800; color: #1a1a1a; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
        .svc-card-detail { font-size: 0.8125rem; color: #737373; margin-bottom: 0.75rem; }
        .svc-card-list { list-style: none; padding: 0; margin: 0 0 1.25rem; flex: 1; }
        .svc-card-list li { font-size: 0.8125rem; color: #525252; line-height: 1.6; padding: 0.1875rem 0 0.1875rem 1.125rem; position: relative; }
        .svc-card-list li::before { content: '–'; position: absolute; left: 0; color: #808080; font-weight: 600; }

        /* ── BUTTONS ── */
        .svc-btn-book { display: block; width: 100%; padding: 0.75rem 1rem; background: #1a1a1a; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; transition: background 0.2s; margin-top: auto; text-decoration: none; text-align: center; box-sizing: border-box; }
        .svc-btn-book:hover { background: #404040; }

        :global(.svc-btn-start) { display: block; width: 100%; padding: 0.75rem 1rem; background: transparent; color: #1a1a1a; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; border: 1.5px solid #1a1a1a; text-decoration: none; text-align: center; transition: all 0.2s; margin-top: auto; box-sizing: border-box; }
        :global(.svc-btn-start:hover) { background: #1a1a1a; color: #ffffff; }

        /* ── CTA ── */
        .v2-cta-section { background: #1a1a1a; text-align: center; }
        .v2-cta-inner h2 { font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; color: #ffffff; margin: 0 0 1.5rem; }
        .v2-cta-rule { width: 60px; height: 1px; background: #404040; margin: 0 auto 2rem; }
        .v2-cta-inner p { font-size: 1rem; color: #737373; margin: 0 0 2.5rem; }
        .v2-cta-buttons { display: flex; justify-content: center; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap; }
        :global(.v2-btn-white) { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2rem; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.12em; text-decoration: none; transition: all 0.2s; }
        :global(.v2-btn-white:hover) { background: #f0f0f0; }
        :global(.v2-btn-outline) { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 2rem; font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.12em; text-decoration: none; border: 1px solid #404040; transition: all 0.2s; }
        :global(.v2-btn-outline:hover) { border-color: #ffffff; }
        .v2-cta-location { font-size: 0.8125rem; color: #525252; letter-spacing: 0.03em; }

        /* ── ANIMATIONS ── */
        .v2-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .v2-visible { opacity: 1; transform: translateY(0); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .v2-hero { padding: 4rem 1.5rem 3rem; }
          .v2-hero h1 { font-size: clamp(2.25rem, 10vw, 3.5rem); }
          .v2-section { padding: 3.5rem 1.5rem; }
          .svc-price-grid-2, .svc-price-grid-3 { grid-template-columns: 1fr 1fr; }
          .svc-mt { margin-top: 3rem; }
          .v2-cta-inner h2 { font-size: clamp(2rem, 8vw, 3rem); }
        }

        @media (max-width: 600px) {
          .svc-price-grid-2, .svc-price-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}
