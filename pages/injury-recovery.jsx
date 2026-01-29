import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function InjuryRecovery() {
  return (
    <Layout
      title="Injury Recovery Assessment | Range Medical | Newport Beach"
      description="One visit to review your injury, your rehab plan, and design the right recovery protocol. $199, credited toward your protocol."
    >
      <Head>
        <meta name="keywords" content="injury recovery Newport Beach, recovery assessment, HBOT injury, red light therapy recovery, sports injury treatment, peptide therapy recovery, BPC-157" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />
        <meta property="og:title" content="Injury Recovery Assessment | Range Medical" />
        <meta property="og:description" content="One visit to review your injury and design the right recovery protocol. $199." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Recovery Door</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Start Here</span>
        <h1>Injury Recovery Assessment — $199</h1>
        <p className="hero-sub">
          One visit to review your injury, your rehab plan, and design the right recovery protocol for you.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/book?reason=injury" className="btn-primary">
              Book Injury Recovery Assessment — $199
            </Link>
          </div>
          <p className="hero-secondary">
            Located in the same building as Range Sports Therapy. If you move forward with a program, the $199 is credited toward it.
          </p>
        </div>
      </section>

      {/* Is This For You */}
      <section className="content-section light-bg">
        <div className="container">
          <span className="section-label">IS THIS FOR YOU?</span>
          <h2>This Assessment Is Right For You If...</h2>
          <div className="checklist-grid">
            <div className="checklist-item">
              <span className="check-icon">✓</span>
              <p>You're rehabbing an injury and progress feels slow.</p>
            </div>
            <div className="checklist-item">
              <span className="check-icon">✓</span>
              <p>Pain, swelling, or tightness keep coming back between visits.</p>
            </div>
            <div className="checklist-item">
              <span className="check-icon">✓</span>
              <p>You want to get back to work, life, or sport faster.</p>
            </div>
            <div className="checklist-item">
              <span className="check-icon">✓</span>
              <p>Your therapist or chiropractor thinks extra recovery support could help.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens */}
      <section className="content-section">
        <div className="container">
          <span className="section-label">YOUR VISIT</span>
          <h2>What Happens During Your Assessment</h2>
          <p className="section-intro">A focused visit to understand your injury and build the right plan.</p>
          
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Review Your Injury</h4>
                <p>We go over your injury, your current rehab, and your goals for getting back to normal.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Check Key Movements</h4>
                <p>We look at how the area responds and what might be slowing your recovery.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Talk Through History</h4>
                <p>We discuss what you've already tried and what's helped or not.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Recommend a Program</h4>
                <p>Your provider recommends the right recovery program based on your injury and timeline.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recovery Programs */}
      <section className="content-section light-bg">
        <div className="container">
          <span className="section-label">WHAT COMES NEXT</span>
          <h2>Recovery Peptide Programs</h2>
          <p className="section-intro">
            Based on your Assessment, your provider may recommend one of our peptide therapy programs designed to support injury recovery.
          </p>
          
          <div className="program-cards">
            <div className="program-card">
              <div className="program-header">
                <h3>10-Day Recovery Jumpstart</h3>
                <span className="program-tag">Quick Start</span>
              </div>
              <p>A focused 10-day plan to help your body start calming things down and see how you respond while you're in therapy.</p>
              <ul className="program-features">
                <li>Recovery peptide protocol</li>
                <li>Provider-designed plan</li>
                <li>Works alongside your rehab</li>
              </ul>
            </div>
            
            <div className="program-card featured">
              <div className="program-header">
                <h3>30-Day Recovery Program</h3>
                <span className="program-tag">Most Popular</span>
              </div>
              <p>A full 30-day recovery protocol to calm inflammation, support tissue repair, and help you get back to normal faster.</p>
              <ul className="program-features">
                <li>Week 1: Calm the fire</li>
                <li>Weeks 2-3: Build back capacity</li>
                <li>Week 4: Lock in the gains</li>
              </ul>
            </div>
          </div>
          
          <p className="program-note">
            Your provider will recommend the right program based on your injury, timeline, and goals. Not everyone needs peptides — your Assessment will determine the best approach for you.
          </p>
        </div>
      </section>

      {/* Other Tools */}
      <section className="content-section">
        <div className="container">
          <span className="section-label">ADDITIONAL SUPPORT</span>
          <h2>Other Recovery Tools We Offer</h2>
          <p className="section-intro">
            Depending on your injury, your provider may also recommend:
          </p>
          
          <div className="tools-grid">
            <div className="tool-item">
              <h4>Hyperbaric Oxygen Therapy</h4>
              <p>Pressurized oxygen to support tissue healing and reduce inflammation.</p>
            </div>
            <div className="tool-item">
              <h4>Red Light Therapy</h4>
              <p>Light-based therapy to support cellular recovery and reduce pain.</p>
            </div>
            <div className="tool-item">
              <h4>IV Therapy</h4>
              <p>Direct nutrient delivery to support healing from the inside.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="content-section light-bg">
        <div className="container">
          <span className="section-label">QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-list">
            <div className="faq-item">
              <h4>Do I need to be a patient at Range Sports Therapy?</h4>
              <p>No. Anyone with an injury can book a Recovery Assessment. Many people are referred from Range Sports Therapy, but you can also book directly with us.</p>
            </div>

            <div className="faq-item">
              <h4>Does this replace my rehab?</h4>
              <p>No. Our programs support and speed up the recovery work you're already doing with your PT, chiro, or trainer.</p>
            </div>

            <div className="faq-item">
              <h4>Will I need labs or blood work?</h4>
              <p>Usually not. Most recovery programs don't require lab work to get started.</p>
            </div>

            <div className="faq-item">
              <h4>What kinds of injuries does this help with?</h4>
              <p>Most orthopedic injuries — sprains, strains, tendon issues, post-surgical recovery, chronic pain that's slow to heal. We'll confirm it's a good fit at your Assessment.</p>
            </div>

            <div className="faq-item">
              <h4>What if I also want help with energy or hormones?</h4>
              <p>We can talk about that at your Assessment. If energy optimization is your main concern, you might want to start with the <Link href="/range-assessment"><strong>Energy &amp; Optimization</strong></Link> pathway instead.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Start With One Visit</span>
          <h2>Ready to Speed Up Your Recovery?</h2>
          <p>Book your Range Assessment. If you move forward with a program, the $199 is credited toward it.</p>
          <div className="cta-buttons">
            <Link href="/book?reason=injury" className="btn-white">
              Book Your Range Assessment — $199
            </Link>
          </div>
          <p className="cta-location">Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      <style jsx>{`
        /* Trust Bar */
        .trust-bar {
          background: #f8f8f8;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .trust-item {
          font-size: 14px;
          color: #666;
        }
        .trust-rating {
          color: #000;
          letter-spacing: 1px;
        }

        /* Hero */
        .hero {
          padding: 80px 24px;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .hero h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 20px 0;
          line-height: 1.2;
        }
        .hero-sub {
          font-size: 20px;
          color: #444;
          margin: 0 0 32px 0;
          line-height: 1.6;
        }
        .hero-buttons {
          margin-bottom: 16px;
        }
        .btn-primary {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #333;
        }
        .hero-secondary {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        /* Content Sections */
        .content-section {
          padding: 80px 24px;
        }
        .light-bg {
          background: #f8f8f8;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .section-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
          text-align: center;
        }
        .content-section h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px 0;
          text-align: center;
        }
        .section-intro {
          font-size: 18px;
          color: #555;
          text-align: center;
          margin: 0 0 48px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Checklist Grid */
        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px;
          background: #fff;
          border: 1px solid #e5e5e5;
        }
        .check-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }
        .checklist-item p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
          color: #333;
        }

        /* Steps List */
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 700px;
          margin: 0 auto;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          padding: 32px;
          background: #f8f8f8;
          border-left: 4px solid #000;
        }
        .step-number {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
        }
        .step-content h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .step-content p {
          margin: 0;
          font-size: 16px;
          color: #555;
          line-height: 1.5;
        }

        /* Program Cards */
        .program-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .program-card {
          padding: 32px;
          background: #fff;
          border: 1px solid #e5e5e5;
        }
        .program-card.featured {
          border: 2px solid #000;
        }
        .program-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .program-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }
        .program-tag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 10px;
          background: #f0f0f0;
          color: #666;
        }
        .program-card.featured .program-tag {
          background: #000;
          color: #fff;
        }
        .program-card > p {
          font-size: 15px;
          color: #555;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }
        .program-features {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .program-features li {
          font-size: 14px;
          color: #333;
          padding: 8px 0;
          border-top: 1px solid #eee;
        }
        .program-features li:last-child {
          padding-bottom: 0;
        }
        .program-note {
          font-size: 14px;
          color: #666;
          text-align: center;
          font-style: italic;
        }

        /* Tools Grid */
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .tool-item {
          text-align: center;
          padding: 32px 24px;
          background: #f8f8f8;
        }
        .tool-item h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .tool-item p {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }

        /* FAQ */
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }
        .faq-item {
          padding: 24px 0;
          border-bottom: 1px solid #ddd;
        }
        .faq-item:first-child {
          padding-top: 0;
        }
        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .faq-item h4 {
          margin: 0 0 12px 0;
          font-size: 17px;
          font-weight: 600;
        }
        .faq-item p {
          margin: 0;
          font-size: 15px;
          color: #555;
          line-height: 1.6;
        }

        /* Final CTA */
        .final-cta {
          background: #000;
          color: #fff;
          padding: 80px 24px;
          text-align: center;
        }
        .cta-step {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: 16px;
        }
        .final-cta h2 {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }
        .final-cta > .container > p {
          font-size: 18px;
          color: rgba(255,255,255,0.8);
          margin: 0 0 32px 0;
        }
        .cta-buttons {
          margin-bottom: 24px;
        }
        .btn-white {
          display: inline-block;
          background: #fff;
          color: #000;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f0f0f0;
        }
        .cta-location {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero {
            padding: 60px 20px;
          }
          .hero h1 {
            font-size: 32px;
          }
          .hero-sub {
            font-size: 18px;
          }
          .content-section {
            padding: 60px 20px;
          }
          .content-section h2 {
            font-size: 26px;
          }
          .checklist-grid {
            grid-template-columns: 1fr;
          }
          .program-cards {
            grid-template-columns: 1fr;
          }
          .tools-grid {
            grid-template-columns: 1fr;
          }
          .step-item {
            padding: 24px;
          }
          .trust-inner {
            gap: 16px;
          }
        }
      `}</style>
    </Layout>
  );
}
