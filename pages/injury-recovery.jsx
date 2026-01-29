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
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🩹 Recovery Door</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <p className="hero-kicker">Start Here</p>
        <h1>Injury Recovery Assessment — $199</h1>
        <p className="hero-sub">
          One visit to review your injury, your rehab plan, and design the right recovery protocol for you.
        </p>
        <div className="hero-cta">
          <Link href="/book?reason=injury" className="btn-primary">
            Book Injury Recovery Assessment — $199
          </Link>
        </div>
        <p className="hero-note">
          Located in the same building as Range Sports Therapy. If you move forward with a program, the $199 is credited toward it.
        </p>
      </section>

      {/* Is This For You */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This For You?</p>
          <h2 className="section-title">This Assessment Is Right For You If...</h2>
          
          <div className="checklist-grid">
            <div className="checklist-card">
              <span className="checklist-icon">✓</span>
              <p>You're rehabbing an injury and progress feels slow.</p>
            </div>
            <div className="checklist-card">
              <span className="checklist-icon">✓</span>
              <p>Pain, swelling, or tightness keep coming back between visits.</p>
            </div>
            <div className="checklist-card">
              <span className="checklist-icon">✓</span>
              <p>You want to get back to work, life, or sport faster.</p>
            </div>
            <div className="checklist-card">
              <span className="checklist-icon">✓</span>
              <p>Your therapist or chiropractor thinks extra recovery support could help.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Your Visit</p>
          <h2 className="section-title">What Happens During Your Assessment</h2>
          <p className="section-subtitle">A focused visit to understand your injury and build the right plan.</p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Review Your Injury</h4>
              <p>We go over your injury, your current rehab, and your goals for getting back to normal.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h4>Check Key Movements</h4>
              <p>We look at how the area responds and what might be slowing your recovery.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Talk Through History</h4>
              <p>We discuss what you've already tried and what's helped or not.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h4>Recommend a Program</h4>
              <p>Your provider recommends the right recovery program based on your injury and timeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recovery Programs */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">What Comes Next</p>
          <h2 className="section-title">Recovery Peptide Programs</h2>
          <p className="section-subtitle">
            Based on your Assessment, your provider may recommend one of our peptide therapy programs designed to support injury recovery.
          </p>
          
          <div className="doors-grid">
            <div className="door-card">
              <h3>10-Day Recovery Jumpstart</h3>
              <p>A focused 10-day plan to help your body start calming things down and see how you respond while you're in therapy.</p>
              <ul>
                <li>Recovery peptide protocol</li>
                <li>Provider-designed plan</li>
                <li>Works alongside your rehab</li>
              </ul>
            </div>

            <div className="door-card featured">
              <span className="door-badge">Most Popular</span>
              <h3>30-Day Recovery Program</h3>
              <p>A full 30-day recovery protocol to calm inflammation, support tissue repair, and help you get back to normal faster.</p>
              <ul>
                <li>Week 1: Calm the fire</li>
                <li>Weeks 2–3: Build back capacity</li>
                <li>Week 4: Lock in the gains</li>
              </ul>
            </div>
          </div>
          
          <p className="section-note">
            Your provider will recommend the right program based on your injury, timeline, and goals. Not everyone needs peptides — your Assessment will determine the best approach for you.
          </p>
        </div>
      </section>

      {/* Other Tools */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Additional Support</p>
          <h2 className="section-title">Other Recovery Tools We Offer</h2>
          <p className="section-subtitle">
            Depending on your injury, your provider may also recommend:
          </p>
          
          <div className="tools-grid">
            <Link href="/hyperbaric-oxygen-therapy" className="tool-card">
              <h4>Hyperbaric Oxygen</h4>
              <p>Pressurized oxygen to support tissue healing and reduce inflammation.</p>
            </Link>
            <Link href="/red-light-therapy" className="tool-card">
              <h4>Red Light Therapy</h4>
              <p>Light-based therapy to support cellular recovery and reduce pain.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV Therapy</h4>
              <p>Direct nutrient delivery to support healing from the inside.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
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
          <h2>Ready to Speed Up Your Recovery?</h2>
          <p>Book your Range Assessment. If you move forward with a program, the $199 is credited toward it.</p>
          <div className="cta-buttons">
            <Link href="/book?reason=injury" className="btn-white">
              Book Your Range Assessment — $199
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      <style jsx>{`
        .hero {
          padding-top: 4rem;
          padding-bottom: 3rem;
        }

        .hero-kicker {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 0.75rem;
        }

        .hero-cta {
          margin-top: 2rem;
        }

        .hero-note {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #666;
        }

        /* Checklist Grid */
        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .checklist-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .checklist-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: #171717;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .checklist-card p {
          margin: 0;
          font-size: 0.9375rem;
          color: #404040;
          line-height: 1.6;
        }

        /* Steps Grid */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step-card {
          text-align: center;
          padding: 1.5rem;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: #171717;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 auto 1rem;
        }

        .step-card h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.5rem 0;
        }

        .step-card p {
          font-size: 0.875rem;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        /* Section Note */
        .section-note {
          text-align: center;
          font-size: 0.875rem;
          color: #666;
          font-style: italic;
          margin-top: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
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
          color: #404040;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Buttons */
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .checklist-grid {
            grid-template-columns: 1fr;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
