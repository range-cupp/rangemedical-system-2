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
        <div className="container">
          <span className="hero-badge">Program Details</span>
          <h1>6-Week Cellular Energy Reset</h1>
          <p className="hero-sub">
            A structured program for people whose main problem is low energy, brain fog, or slow recovery —
            and who want a clear plan to fix it at the cellular level.
          </p>
          <div className="hero-cta">
            <p className="hero-secondary">
              This program is recommended through a <Link href="/range-assessment"><strong>Range Assessment</strong></Link>.
              If you haven&apos;t had your Assessment yet, start there.
            </p>
            <div style={{marginTop: '1rem'}}>
              <Link href="/range-assessment" className="btn-outline">
                Book Range Assessment First — $199
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What This Program Is */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Program</div>
          <h2 className="section-title">What Is the Cellular Energy Reset?</h2>
          <p className="section-subtitle">
            A 6-week protocol designed to restore energy at the cellular level — not by masking symptoms,
            but by supporting your mitochondria to produce real, lasting energy.
          </p>

          <div className="doors-grid">
            <div className="door-card">
              <h3>What Hasn&apos;t Worked</h3>
              <ul className="check-list negative">
                <li>More supplements and vitamins</li>
                <li>Energy drinks and caffeine</li>
                <li>Sleep apps and trackers</li>
                <li>Hoping it&apos;s &quot;just stress&quot;</li>
                <li>Doctors saying labs look &quot;fine&quot;</li>
              </ul>
            </div>
            <div className="door-card featured">
              <h3>What the Reset Does</h3>
              <ul className="check-list positive">
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
          <div className="section-kicker">Is This You?</div>
          <h2 className="section-title">Who This Program Is For</h2>

          <div className="symptom-grid">
            <div className="symptom-card">
              <span className="symptom-icon">😴</span>
              <h4>Afternoon Crashes</h4>
              <p>Exhausted by 2pm despite a full night&apos;s sleep</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">🧠</span>
              <h4>Brain Fog</h4>
              <p>Focusing feels impossible, thoughts feel scattered</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">☕</span>
              <h4>Caffeine Dependent</h4>
              <p>Need coffee just to function at baseline</p>
            </div>
            <div className="symptom-card">
              <span className="symptom-icon">💪</span>
              <h4>Slow Recovery</h4>
              <p>Workouts drain you for days instead of energizing you</p>
            </div>
          </div>

          <p className="section-note">
            Your Range Assessment pointed to cellular energy as a core issue? This program was designed for you.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What You Get</div>
          <h2 className="section-title">What&apos;s Included in the 6-Week Reset</h2>

          <div className="included-grid">
            <div className="included-card">
              <span className="included-icon">💨</span>
              <h4>18 HBOT Sessions</h4>
              <p>60 minutes each at 1.5 ATA. Increased oxygen delivery to support cellular repair and energy production.</p>
            </div>
            <div className="included-card">
              <span className="included-icon">🔴</span>
              <h4>18 Red Light Sessions</h4>
              <p>Full-body treatment (20 min each). Specific wavelengths that stimulate mitochondrial function.</p>
            </div>
            <div className="included-card">
              <span className="included-icon">👨‍⚕️</span>
              <h4>Provider Consultations</h4>
              <p>Initial consultation to build your plan, plus Week 7 results review to measure progress.</p>
            </div>
            <div className="included-card">
              <span className="included-icon">📊</span>
              <h4>Weekly Check-Ins</h4>
              <p>Track energy, sleep, and mental clarity throughout the program so we can adjust as needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Journey</div>
          <h2 className="section-title">The 6-Week Timeline</h2>

          <div className="timeline-list">
            <div className="timeline-row">
              <div className="timeline-num">1</div>
              <div className="timeline-content">
                <span className="timeline-label">Weeks 1-2</span>
                <h4>Foundation Phase</h4>
                <p>3 HBOT + 3 Red Light sessions per week. Your cells begin adapting to increased oxygen and light stimulation.</p>
              </div>
            </div>

            <div className="timeline-row">
              <div className="timeline-num">2</div>
              <div className="timeline-content">
                <span className="timeline-label">Weeks 3-4</span>
                <h4>Optimization Phase</h4>
                <p>Continuing 3x weekly sessions. Most patients report noticeable energy improvements by Week 3.</p>
              </div>
            </div>

            <div className="timeline-row">
              <div className="timeline-num">3</div>
              <div className="timeline-content">
                <span className="timeline-label">Weeks 5-6</span>
                <h4>Integration Phase</h4>
                <p>Final sessions lock in your gains. Your mitochondria are functioning at a higher baseline.</p>
              </div>
            </div>

            <div className="timeline-row">
              <div className="timeline-num complete">✓</div>
              <div className="timeline-content">
                <span className="timeline-label">Week 7</span>
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
          <div className="section-kicker">Investment</div>
          <h2 className="section-title">Program Investment</h2>

          <div className="pricing-center">
            <div className="pricing-card main">
              <h3>6-Week Cellular Energy Reset</h3>
              <div className="pricing-amount">$3,999</div>
              <ul className="pricing-features">
                <li>All 36 sessions (18 HBOT + 18 Red Light)</li>
                <li>Provider consultations included</li>
                <li>Weekly check-ins</li>
                <li><strong>Bonus: 2 extra Red Light sessions</strong></li>
              </ul>
              <p className="pricing-note">
                Financing available at checkout through Affirm, Afterpay, and more.
              </p>
            </div>

            <div className="upgrade-card">
              <h4>⚡ Optional: IV Upgrade</h4>
              <p>Add 6 weekly Energy IVs (B-Complex, Amino Acids, Magnesium) to accelerate results.</p>
              <div className="upgrade-price">+$999</div>
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance Preview */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">After the Reset</div>
          <h2 className="section-title">Maintaining Your Results</h2>
          <p className="section-subtitle">
            At your Week 7 review, we&apos;ll discuss maintenance options to preserve your gains.
          </p>

          <div className="doors-grid" style={{maxWidth: '700px', margin: '0 auto'}}>
            <div className="door-card">
              <h3>Base Maintenance</h3>
              <p>4 HBOT + 4 Red Light sessions every 4 weeks, plus quarterly check-in.</p>
              <div className="door-price">$599<span>/4wk</span></div>
            </div>
            <div className="door-card">
              <h3>Maintenance + IV</h3>
              <p>Everything in Base, plus 1 Energy IV per cycle for maximum support.</p>
              <div className="door-price">$799<span>/4wk</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Common Questions</h2>

          <div className="faq-list">
            <div className="faq-item">
              <h4>Can I start the Reset without a Range Assessment?</h4>
              <p>We recommend starting with a Range Assessment ($199) so your provider can confirm this is the right program for your situation. The Assessment ensures we&apos;re not missing something else that might be causing your symptoms.</p>
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
          <Link href="/range-assessment" className="btn-white">
            Book Range Assessment — $199
          </Link>
          <p className="cta-location">
            Range Medical • 1901 Westcliff Dr, Newport Beach<br />
            <a href="tel:9499973988">(949) 997-3988</a>
          </p>
        </div>
      </section>

      <style jsx>{`
        /* Symptom Grid */
        .symptom-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto 2rem;
        }

        .symptom-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s;
        }

        .symptom-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .symptom-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .symptom-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .symptom-card p {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
          line-height: 1.5;
        }

        .section-note {
          text-align: center;
          font-size: 0.9375rem;
          color: #525252;
          background: #f9fafb;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Check Lists */
        .check-list {
          list-style: none;
          padding: 0;
          margin: 1rem 0 0;
        }

        .check-list li {
          font-size: 0.9375rem;
          padding: 0.5rem 0 0.5rem 1.75rem;
          position: relative;
          color: #404040;
        }

        .check-list.negative li::before {
          content: "✗";
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: 700;
        }

        .check-list.positive li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 700;
        }

        .door-card.featured {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .door-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #000000;
          margin-top: 1rem;
        }

        .door-price span {
          font-size: 0.875rem;
          font-weight: 400;
          color: #525252;
        }

        /* Included Grid */
        .included-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .included-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }

        .included-icon {
          font-size: 1.75rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .included-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .included-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Timeline */
        .timeline-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .timeline-row {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .timeline-row:last-child {
          border-bottom: none;
        }

        .timeline-num {
          width: 48px;
          height: 48px;
          min-width: 48px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .timeline-num.complete {
          background: #22c55e;
        }

        .timeline-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timeline-content h4 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin: 0.25rem 0 0.375rem;
        }

        .timeline-content p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.6;
        }

        /* Pricing */
        .pricing-center {
          max-width: 500px;
          margin: 0 auto;
        }

        .pricing-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }

        .pricing-card.main {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .pricing-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .pricing-amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 1.5rem;
        }

        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
          text-align: left;
        }

        .pricing-features li {
          font-size: 0.9375rem;
          color: #404040;
          padding: 0.5rem 0 0.5rem 1.75rem;
          position: relative;
          border-bottom: 1px solid #f5f5f5;
        }

        .pricing-features li:last-child {
          border-bottom: none;
        }

        .pricing-features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 700;
        }

        .pricing-note {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
          padding-top: 1rem;
          border-top: 1px solid #e5e5e5;
        }

        .upgrade-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          margin-top: 1.5rem;
        }

        .upgrade-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .upgrade-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin-bottom: 0.75rem;
        }

        .upgrade-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
        }

        /* FAQ List */
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .faq-item:first-child {
          padding-top: 0;
        }

        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .faq-item h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.75rem 0;
        }

        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Location Link */
        .cta-location a {
          color: #ffffff;
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .symptom-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .included-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .symptom-grid {
            grid-template-columns: 1fr;
          }

          .timeline-row {
            flex-direction: column;
            text-align: center;
          }

          .timeline-num {
            margin: 0 auto 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}
