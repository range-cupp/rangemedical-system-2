import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function CellularEnergyReset() {
  return (
    <Layout
      title="6-Week Cellular Energy Reset | Range Medical | Newport Beach"
      description="A structured 6-week program for low energy, brain fog, and slow recovery. Combines HBOT, Red Light Therapy, and provider guidance."
    >
      <Head>
        <meta name="keywords" content="cellular energy reset, low energy treatment, brain fog help, HBOT Newport Beach, red light therapy program" />
        <link rel="canonical" href="https://www.range-medical.com/cellular-energy-reset" />
        <meta property="og:title" content="6-Week Cellular Energy Reset | Range Medical" />
        <meta property="og:description" content="A structured 6-week program for low energy, brain fog, and slow recovery." />
        <meta property="og:url" content="https://www.range-medical.com/cellular-energy-reset" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">⚡ 6-Week Program</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Program Details</span>
        <h1>6-Week Cellular Energy Reset</h1>
        <p className="hero-sub">
          A structured program for people whose main problem is low energy, brain fog, or slow recovery — 
          and who want a clear plan to fix it at the cellular level.
        </p>
        <div className="hero-cta">
          <p className="hero-secondary">
            This program is recommended through a <Link href="/range-assessment"><strong>Range Assessment</strong></Link>. 
            If you haven't had your Assessment yet, start there.
          </p>
          <div className="hero-buttons" style={{marginTop: '1rem'}}>
            <Link href="/range-assessment" className="btn-outline">
              Book Range Assessment First — $199
            </Link>
          </div>
        </div>
      </section>

      {/* What This Program Is */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Program</p>
          <h2 className="section-title">What Is the Cellular Energy Reset?</h2>
          <p className="section-subtitle">
            A 6-week protocol designed to restore energy at the cellular level — not by masking symptoms, 
            but by supporting your mitochondria to produce real, lasting energy.
          </p>

          <div className="comparison">
            <div className="comparison-col">
              <h4>What Hasn't Worked</h4>
              <ul>
                <li>More supplements and vitamins</li>
                <li>Energy drinks and caffeine</li>
                <li>Sleep apps and trackers</li>
                <li>Hoping it's "just stress"</li>
                <li>Doctors saying labs look "fine"</li>
              </ul>
            </div>
            <div className="comparison-col range">
              <h4>What the Reset Does</h4>
              <ul>
                <li>Increases oxygen delivery to cells (HBOT)</li>
                <li>Stimulates mitochondrial function (Red Light)</li>
                <li>Reduces cellular inflammation</li>
                <li>Supports natural ATP production</li>
                <li>Tracks progress with weekly check-ins</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who This Program Is For</h2>

          <div className="pain-points">
            <ul>
              <li>Exhausted by 2pm despite a full night's sleep</li>
              <li>Brain fog that makes focusing feel impossible</li>
              <li>Needing caffeine just to function at baseline</li>
              <li>Workouts that drain you for days instead of energizing you</li>
              <li>Your Range Assessment pointed to cellular energy as a core issue</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">What You Get</p>
          <h2 className="section-title">What's Included in the 6-Week Reset</h2>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>💨</span> 18 HBOT Sessions</h4>
              <p>60 minutes each at 1.5 ATA. Increased oxygen delivery to support cellular repair and energy production.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔴</span> 18 Red Light Sessions</h4>
              <p>Full-body treatment (20 min each). Specific wavelengths that stimulate mitochondrial function.</p>
            </div>
            <div className="benefit-card">
              <h4><span>👨‍⚕️</span> Provider Consultations</h4>
              <p>Initial consultation to build your plan, plus Week 7 results review to measure progress.</p>
            </div>
            <div className="benefit-card">
              <h4><span>📊</span> Weekly Check-Ins</h4>
              <p>Track energy, sleep, and mental clarity throughout the program so we can adjust as needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Your Journey</p>
          <h2 className="section-title">The 6-Week Timeline</h2>

          <div className="process-timeline">
            <div className="timeline-step">
              <div className="timeline-marker">1</div>
              <div className="timeline-content">
                <span className="timeline-day">Weeks 1-2</span>
                <h4>Foundation Phase</h4>
                <p>3 HBOT + 3 Red Light sessions per week. Your cells begin adapting to increased oxygen and light stimulation.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">2</div>
              <div className="timeline-content">
                <span className="timeline-day">Weeks 3-4</span>
                <h4>Optimization Phase</h4>
                <p>Continuing 3x weekly sessions. Most patients report noticeable energy improvements by Week 3.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">3</div>
              <div className="timeline-content">
                <span className="timeline-day">Weeks 5-6</span>
                <h4>Integration Phase</h4>
                <p>Final sessions lock in your gains. Your mitochondria are functioning at a higher baseline.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">✓</div>
              <div className="timeline-content">
                <span className="timeline-day">Week 7</span>
                <h4>Results Review</h4>
                <p>Final consultation to measure progress and discuss maintenance options to keep your results.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Investment</p>
          <h2 className="section-title">Program Investment</h2>

          <div style={{maxWidth: '500px', margin: '0 auto'}}>
            <div className="offer-card" style={{textAlign: 'center'}}>
              <h3>6-Week Cellular Energy Reset</h3>
              <div className="offer-price">$3,999</div>
              <ul style={{textAlign: 'left'}}>
                <li>All 36 sessions (18 HBOT + 18 Red Light)</li>
                <li>Provider consultations included</li>
                <li>Weekly check-ins</li>
                <li><strong>Bonus: 2 extra Red Light sessions</strong></li>
              </ul>
              <p style={{fontSize: '0.875rem', color: '#525252', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e5'}}>
                Financing available at checkout through Affirm, Afterpay, and more.
              </p>
            </div>
          </div>

          {/* IV Upgrade */}
          <div style={{maxWidth: '600px', margin: '2rem auto 0', background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', textAlign: 'center'}}>
            <h4 style={{marginBottom: '0.5rem'}}>⚡ Optional: IV Upgrade</h4>
            <p style={{fontSize: '0.9375rem', color: '#525252', marginBottom: '0.75rem'}}>
              Add 6 weekly Energy IVs (B-Complex, Amino Acids, Magnesium) to accelerate results.
            </p>
            <div style={{fontSize: '1.25rem', fontWeight: '700'}}>+$999</div>
          </div>
        </div>
      </section>

      {/* Maintenance Preview */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">After the Reset</p>
          <h2 className="section-title">Maintaining Your Results</h2>
          <p className="section-subtitle">
            At your Week 7 review, we'll discuss maintenance options to preserve your gains.
          </p>

          <div className="doors-grid" style={{maxWidth: '700px', margin: '0 auto'}}>
            <div className="door-card">
              <h3>Base Maintenance</h3>
              <p>4 HBOT + 4 Red Light sessions every 4 weeks, plus quarterly check-in.</p>
              <div style={{fontSize: '1.5rem', fontWeight: '700', marginTop: '1rem'}}>$599<span style={{fontSize: '0.875rem', fontWeight: '400'}}>/4wk</span></div>
            </div>
            <div className="door-card">
              <h3>Maintenance + IV</h3>
              <p>Everything in Base, plus 1 Energy IV per cycle for maximum support.</p>
              <div style={{fontSize: '1.5rem', fontWeight: '700', marginTop: '1rem'}}>$799<span style={{fontSize: '0.875rem', fontWeight: '400'}}>/4wk</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions</h2>

          <div className="faq-container">
            <div className="faq-item">
              <h4>Can I start the Reset without a Range Assessment?</h4>
              <p>We recommend starting with a Range Assessment ($199) so your provider can confirm this is the right program for your situation. The Assessment ensures we're not missing something else that might be causing your symptoms.</p>
            </div>

            <div className="faq-item">
              <h4>How long does each session take?</h4>
              <p>Plan for about 90 minutes door-to-door when doing HBOT + Red Light together. Red Light is 20 minutes, HBOT is 60 minutes. Most patients do both in the same visit.</p>
            </div>

            <div className="faq-item">
              <h4>When will I feel results?</h4>
              <p>Most patients notice improvements by Week 3 — less fatigue, better sleep, improved mental clarity. The full benefits compound through Week 6 and beyond with maintenance.</p>
            </div>

            <div className="faq-item">
              <h4>Is this covered by insurance?</h4>
              <p>HBOT and Red Light Therapy for optimization are typically not covered by insurance. We can provide superbills for HSA/FSA reimbursement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">First Step</span>
          <h2>Ready to Restore Your Energy?</h2>
          <p>Start with a Range Assessment. Your provider will confirm if the Cellular Energy Reset is right for you.</p>
          <div className="cta-buttons">
            <Link href="/range-assessment" className="btn-white">
              Book Range Assessment — $199
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
