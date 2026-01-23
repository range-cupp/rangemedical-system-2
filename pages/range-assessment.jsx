import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function InjuryRecovery() {
  return (
    <Layout
      title="10-Day Recovery Jumpstart | Range Medical | Newport Beach"
      description="Speed up injury recovery with our 10-Day Recovery Jumpstart. No labs required. $250 to start. Located in the same building as Range Sports Therapy."
    >
      <Head>
        <meta name="keywords" content="injury recovery Newport Beach, speed up healing, recovery jumpstart, HBOT injury, red light therapy recovery" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />
        <meta property="og:title" content="10-Day Recovery Jumpstart | Range Medical" />
        <meta property="og:description" content="If you're already doing rehab and feel like healing is taking too long, this is for you." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🩹 No Labs Required</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Recovery Door</span>
        <h1>10-Day Recovery Jumpstart for Injuries</h1>
        <p className="hero-sub">
          If you're already doing rehab and feel like healing is taking too long, this is for you.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/book-recovery" className="btn-primary">
              Book Recovery Jumpstart — $250
            </Link>
          </div>
          <p className="hero-secondary">
            Located in the same building as Range Sports Therapy. No labs required to start.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who the Recovery Jumpstart Is For</h2>

          <div className="pain-points">
            <ul>
              <li>You're rehabbing an injury and progress feels slow.</li>
              <li>Pain and swelling keep coming back between visits.</li>
              <li>You want to get back to work, training, or daily life faster.</li>
              <li>Your therapist or chiropractor thinks extra recovery support could help.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">The Program</p>
          <h2 className="section-title">What You Get in 10 Days</h2>
          <p className="section-subtitle">
            A structured plan to support your healing — not a menu of random treatments.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>📋</span> Custom 10-Day Plan</h4>
              <p>A recovery plan built by our medical team based on your injury and goals.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🏥</span> In-Clinic Sessions</h4>
              <p>Recovery sessions using tools like red light therapy, hyperbaric oxygen, and targeted injections when appropriate.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔥</span> Inflammation Support</h4>
              <p>Help calm inflammation, support circulation, and give your body what it needs to repair.</p>
            </div>
            <div className="benefit-card">
              <h4><span>✅</span> Progress Check-In</h4>
              <p>A quick check-in at the end of the 10 days to talk about how you're doing and what comes next.</p>
            </div>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#525252', maxWidth: '600px', margin: '0 auto'}}>
              We're selling you a <strong>10-day program and outcome</strong>, not individual treatments as separate line items.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Process</p>
          <h2 className="section-title">How the 10-Day Jumpstart Works</h2>

          <div className="process-timeline">
            <div className="timeline-step">
              <div className="timeline-marker">1</div>
              <div className="timeline-content">
                <h4>Book Your Recovery Jumpstart</h4>
                <p>Choose a time that works for you using our online booking.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">2</div>
              <div className="timeline-content">
                <h4>Come In for Your First Visit</h4>
                <p>We review your injury, your current rehab plan, and make sure this is a safe fit.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">3</div>
              <div className="timeline-content">
                <h4>Follow Your 10-Day Protocol</h4>
                <p>You come in for your scheduled recovery sessions and follow the simple at-home steps we give you.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-marker">4</div>
              <div className="timeline-content">
                <h4>Review Your Progress</h4>
                <p>At the end of the 10 days, we check in on pain, swelling, and function and decide together what the best next step is.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price & FAQ */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Details</p>
          <h2 className="section-title">Price and Common Questions</h2>

          <div style={{maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center', background: '#fafafa', borderRadius: '12px', padding: '2rem'}}>
            <div style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem'}}>$250</div>
            <p style={{fontSize: '1rem', color: '#525252', marginBottom: '0'}}>10-Day Recovery Jumpstart</p>
            <p style={{fontSize: '0.875rem', color: '#737373', marginTop: '0.5rem'}}>No lab work required for this program.</p>
          </div>

          <div className="faq-container">
            <div className="faq-item">
              <h4>Do I have to be a patient at Range Sports Therapy first?</h4>
              <p>No. Many people are referred from there, but you can also book directly with us.</p>
            </div>

            <div className="faq-item">
              <h4>Does this replace my rehab?</h4>
              <p>No. This is designed to support and speed up the recovery work you're already doing.</p>
            </div>

            <div className="faq-item">
              <h4>Will I need labs or blood work?</h4>
              <p>No. This program uses treatments we can safely do without lab work.</p>
            </div>

            <div className="faq-item">
              <h4>What kinds of injuries does this help with?</h4>
              <p>Most orthopedic injuries — sprains, strains, post-surgical recovery, chronic pain that's slow to heal. We'll confirm it's a good fit at your first visit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bridge to Optimization */}
      <section className="section section-gray">
        <div className="container">
          <div style={{maxWidth: '700px', margin: '0 auto', textAlign: 'center'}}>
            <p className="section-kicker">What's Next?</p>
            <h2 className="section-title">What Happens After the 10 Days?</h2>
            <p style={{fontSize: '1rem', color: '#525252', lineHeight: '1.7', marginBottom: '1.5rem'}}>
              If your only goal is to get this injury calmed down, the Jumpstart may be all you need.
            </p>
            <p style={{fontSize: '1rem', color: '#525252', lineHeight: '1.7', marginBottom: '2rem'}}>
              If you also want to work on bigger things like energy, sleep, hormones, or weight, 
              your provider may recommend a separate visit called the Range Assessment.
            </p>
            <Link href="/range-assessment" className="btn-outline">
              Learn About the Range Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Get Started</span>
          <h2>Ready to Speed Up Your Recovery?</h2>
          <p>Book your 10-Day Recovery Jumpstart and give your body the support it needs to heal faster.</p>
          <div className="cta-buttons">
            <Link href="/book-recovery" className="btn-white">
              Book Recovery Jumpstart — $250
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
