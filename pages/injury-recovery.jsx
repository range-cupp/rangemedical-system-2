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
        <meta name="keywords" content="injury recovery Newport Beach, recovery assessment, HBOT injury, red light therapy recovery, sports injury treatment" />
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
        <span className="hero-badge">Start Here</span>
        <h1>Injury Recovery Assessment — $199</h1>
        <p className="hero-sub">
          One visit to review your injury, your rehab plan, and design the right recovery protocol for you.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/book-recovery" className="btn-primary">
              Book Injury Recovery Assessment — $199
            </Link>
          </div>
          <p className="hero-secondary">
            Located in the same building as Range Sports Therapy.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who the Injury Recovery Assessment Is For</h2>

          <div className="pain-points">
            <ul>
              <li>You're rehabbing an injury and progress feels slow.</li>
              <li>Pain, swelling, or tightness keep coming back between visits.</li>
              <li>You want to get back to work, life, or sport faster.</li>
              <li>Your therapist or chiropractor thinks extra recovery support could help.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Happens */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Your Visit</p>
          <h2 className="section-title">What Happens During Your Assessment</h2>
          <p className="section-subtitle">
            A focused visit to understand your injury and build the right plan.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>📋</span> Review Your Injury</h4>
              <p>We go over your injury, your current rehab, and your goals for getting back to normal.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔍</span> Check Key Movements</h4>
              <p>We look at how the area responds and what might be slowing your recovery.</p>
            </div>
            <div className="benefit-card">
              <h4><span>💬</span> Talk Through History</h4>
              <p>We discuss what you've already tried and what's helped or not.</p>
            </div>
            <div className="benefit-card">
              <h4><span>📝</span> Outline Your Protocol</h4>
              <p>We recommend whether a 10-day or 30-day recovery protocol makes the most sense for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Credit Works */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Investment</p>
          <h2 className="section-title">How Your $199 Credit Works</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <div style={{background: '#ffffff', border: '2px solid #000000', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem'}}>
              <div style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem'}}>$199</div>
              <p style={{fontSize: '1rem', color: '#525252', marginBottom: '0'}}>Injury Recovery Assessment</p>
            </div>
            
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Your Injury Recovery Assessment is $199.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              If you decide to start a 10-day or 30-day recovery protocol within 7 days of your visit, 
              we apply the full $199 toward the cost of your protocol.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '0'}}>
              If you choose not to move forward, you still leave with a clear understanding of your injury 
              and what we recommend.
            </p>
          </div>
        </div>
      </section>

      {/* What Comes Next */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">After Your Assessment</p>
          <h2 className="section-title">What Might Come After Your Assessment</h2>
          <p className="section-subtitle">
            Based on your injury, your provider will recommend one of these protocols.
          </p>

          <div className="doors-grid" style={{maxWidth: '700px', margin: '0 auto'}}>
            <div className="door-card">
              <div className="door-icon">⚡</div>
              <h3>10-Day Recovery Protocol</h3>
              <p>For smaller flares or when you need a focused boost in recovery over the next 10 days.</p>
              <ul>
                <li>Targeted recovery sessions</li>
                <li>Tools like HBOT, red light, injections</li>
                <li>Quick check-in at day 10</li>
              </ul>
            </div>

            <div className="door-card">
              <div className="door-icon">🔄</div>
              <h3>30-Day Recovery Protocol</h3>
              <p>For bigger injuries or slower-healing issues that need more support across a full month.</p>
              <ul>
                <li>Extended recovery support</li>
                <li>More sessions, more time to heal</li>
                <li>Progress check-ins throughout</li>
              </ul>
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#737373', maxWidth: '500px', margin: '0 auto'}}>
              Your provider will recommend the option that fits your injury best. 
              You're never locked into anything you don't want.
            </p>
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
              <h4>Do I have to be a patient at Range Sports Therapy first?</h4>
              <p>No. Many people are referred from there, but you can also book directly with us.</p>
            </div>

            <div className="faq-item">
              <h4>Does this replace my rehab?</h4>
              <p>No. Our protocols are designed to support and speed up the recovery work you're already doing with your PT, chiro, or trainer.</p>
            </div>

            <div className="faq-item">
              <h4>Will I need labs or blood work?</h4>
              <p>No. Recovery protocols use treatments we can safely do without lab work.</p>
            </div>

            <div className="faq-item">
              <h4>What kinds of injuries does this help with?</h4>
              <p>Most orthopedic injuries — sprains, strains, post-surgical recovery, chronic pain that's slow to heal. We'll confirm it's a good fit at your Assessment.</p>
            </div>

            <div className="faq-item">
              <h4>What if I also want help with energy or hormones?</h4>
              <p>That's a different door. If you're dealing with fatigue, brain fog, or feeling "off," start with a <Link href="/range-assessment"><strong>Range Assessment</strong></Link> instead.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Start With One Visit</span>
          <h2>Ready to Speed Up Your Recovery?</h2>
          <p>Book your Injury Recovery Assessment. If you move forward, the $199 is credited toward your protocol.</p>
          <div className="cta-buttons">
            <Link href="/book-recovery" className="btn-white">
              Book Injury Recovery Assessment — $199
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
