import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function PRPInjections() {
  return (
    <Layout
      title="PRP Injections | Range Medical | Newport Beach"
      description="Platelet-Rich Plasma (PRP) injections use your body's own healing factors to support tissue repair, reduce pain, and speed recovery."
    >
      <Head>
        <meta name="keywords" content="PRP injections Newport Beach, platelet rich plasma, PRP therapy, regenerative medicine, joint pain treatment" />
        <link rel="canonical" href="https://www.range-medical.com/prp-injections" />
        <meta property="og:title" content="PRP Injections | Range Medical | Newport Beach" />
        <meta property="og:description" content="Platelet-Rich Plasma injections use your body's own healing factors to support tissue repair and speed recovery." />
        <meta property="og:url" content="https://www.range-medical.com/prp-injections" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">💉 Regenerative Medicine</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Regenerative</span>
        <h1>PRP Injections</h1>
        <p className="hero-sub">
          Platelet-Rich Plasma uses your body's own healing factors to support tissue repair, 
          reduce pain, and speed up recovery — without surgery or synthetic drugs.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/range-assessment" className="btn-primary">
              Book Assessment
            </Link>
          </div>
          <p className="hero-secondary">
            Your provider will determine if PRP is right for your situation.
          </p>
        </div>
      </section>

      {/* What is PRP */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Science</p>
          <h2 className="section-title">What Is PRP?</h2>
          <p className="section-subtitle">
            PRP stands for Platelet-Rich Plasma. It's a concentration of your own blood platelets 
            that contain growth factors your body uses to heal.
          </p>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              We draw a small amount of your blood, spin it in a centrifuge to concentrate the platelets, 
              then inject that concentration directly into the area that needs healing.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '0'}}>
              Because it comes from your own body, there's no risk of rejection or allergic reaction. 
              You're simply giving your body more of what it already uses to repair itself.
            </p>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who PRP Injections Help</h2>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>🦵</span> Joint Pain</h4>
              <p>Knees, shoulders, hips, and other joints that hurt and haven't responded to rest or PT alone.</p>
            </div>
            <div className="benefit-card">
              <h4><span>💪</span> Tendon Issues</h4>
              <p>Tennis elbow, Achilles tendinitis, rotator cuff problems, and other tendon injuries.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🏃</span> Sports Injuries</h4>
              <p>Strains, sprains, and overuse injuries that are slow to heal on their own.</p>
            </div>
            <div className="benefit-card">
              <h4><span>⏰</span> Chronic Pain</h4>
              <p>Ongoing pain that hasn't improved with standard treatments and you want to avoid surgery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Process</p>
          <h2 className="section-title">How PRP Treatment Works</h2>

          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Blood Draw</h4>
              <p>We draw a small amount of blood from your arm, just like a regular lab draw.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Processing</h4>
              <p>Your blood is spun in a centrifuge to separate and concentrate the platelets.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Injection</h4>
              <p>The concentrated PRP is injected directly into the treatment area.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Healing</h4>
              <p>Over the next weeks, the growth factors support your body's natural repair process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Recovery</p>
          <h2 className="section-title">What to Expect After PRP</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <div className="faq-item" style={{marginBottom: '1rem'}}>
              <h4>Day of Treatment</h4>
              <p>The procedure takes about 30-45 minutes. You may have some soreness at the injection site. Most people drive themselves home.</p>
            </div>
            <div className="faq-item" style={{marginBottom: '1rem'}}>
              <h4>First Week</h4>
              <p>Mild swelling or discomfort is normal — it means the healing response is working. Avoid anti-inflammatory medications (they can interfere with the process).</p>
            </div>
            <div className="faq-item" style={{marginBottom: '1rem'}}>
              <h4>Weeks 2-6</h4>
              <p>Gradual improvement as new tissue forms. Some people feel better quickly; others take longer.</p>
            </div>
            <div className="faq-item">
              <h4>Full Results</h4>
              <p>Most patients see maximum benefit at 3-6 months. Some conditions benefit from a series of injections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions About PRP</h2>

          <div className="faq-container">
            <div className="faq-item">
              <h4>Is PRP painful?</h4>
              <p>There's some discomfort during the injection, but we use local anesthesia to minimize it. Most patients tolerate it well.</p>
            </div>

            <div className="faq-item">
              <h4>How many treatments do I need?</h4>
              <p>It depends on your condition. Some people improve with one treatment; others benefit from 2-3 sessions spaced a few weeks apart.</p>
            </div>

            <div className="faq-item">
              <h4>Is PRP covered by insurance?</h4>
              <p>Most insurance plans don't cover PRP. We can provide documentation for HSA/FSA reimbursement.</p>
            </div>

            <div className="faq-item">
              <h4>Can PRP be combined with other treatments?</h4>
              <p>Yes. PRP often works well alongside physical therapy, HBOT, and other recovery treatments. Your provider will recommend the best combination.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Get Started</span>
          <h2>Find Out If PRP Is Right for You</h2>
          <p>Book a Range Assessment. Your provider will review your condition and recommend the best treatment plan.</p>
          <div className="cta-buttons">
            <Link href="/range-assessment" className="btn-white">
              Book Assessment
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
