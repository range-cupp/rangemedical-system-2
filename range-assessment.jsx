import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function RangeAssessment() {
  return (
    <Layout
      title="Range Assessment | Your First Step | Range Medical | Newport Beach"
      description="One visit to connect your symptoms, your history, and a clear plan for your energy, hormones, and long-term health. $199."
    >
      <Head>
        <meta name="keywords" content="wellness assessment Newport Beach, fatigue help, brain fog treatment, hormone testing, energy optimization" />
        <link rel="canonical" href="https://www.range-medical.com/range-assessment" />
        <meta property="og:title" content="Range Assessment | Range Medical | Newport Beach" />
        <meta property="og:description" content="One visit to connect your symptoms, your history, and a clear plan. $199." />
        <meta property="og:url" content="https://www.range-medical.com/range-assessment" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">⚡ Optimization Door</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Start Here</span>
        <h1>Range Assessment — $199</h1>
        <p className="hero-sub">
          One visit to connect your symptoms, your history, and a clear plan for your energy, hormones, and long-term health.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/book" className="btn-primary">
              Schedule Range Assessment — $199
            </Link>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who the Range Assessment Is For</h2>

          <div className="pain-points">
            <ul>
              <li>You feel tired, foggy, or "off" even though your labs were called "normal."</li>
              <li>You rely on caffeine just to get through the day.</li>
              <li>Your sleep, mood, or libido have changed and you don't know why.</li>
              <li>You want a long-term plan for energy, hormones, weight, or longevity.</li>
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
            A real conversation with a provider who listens, not a rushed 10-minute appointment.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>📋</span> Review Your History</h4>
              <p>We go over your symptoms, history, and what you've already tried that hasn't worked.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔬</span> Explain Your Labs</h4>
              <p>We review any labs you already have and explain them in plain language.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🎯</span> Recommend Next Steps</h4>
              <p>If deeper lab work will change your plan, we recommend which labs to run and when.</p>
            </div>
            <div className="benefit-card">
              <h4><span>📝</span> Leave With a Plan</h4>
              <p>You leave with a written plan and clear next steps — not just "let's wait and see."</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Labs Fit In */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Important</p>
          <h2 className="section-title">How Labs Fit In</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Not everyone needs the same labs.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              During your Assessment, your provider reviews your symptoms, history, and current treatments.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              If deeper lab work will change your plan, they'll recommend which labs to run and when.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Some patients start with treatments we can safely do right away and add labs later. 
              Others start with labs first. You and your provider decide together.
            </p>
            <div style={{background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem'}}>
              <p style={{fontSize: '0.9375rem', color: '#404040', marginBottom: '0', textAlign: 'center'}}>
                <strong>Labs are not automatically included for everyone.</strong><br />
                They're added when they truly help us build a better plan for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Comes Next */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">After Your Assessment</p>
          <h2 className="section-title">What Your Assessment Can Lead To</h2>
          <p className="section-subtitle">
            Based on your goals and results, your provider may recommend one of these programs.
          </p>

          <div className="tools-grid">
            <Link href="/cellular-energy-reset" className="tool-card">
              <h4>Cellular Energy Reset</h4>
              <p>6-week program for low energy, brain fog, and slow recovery. Combines in-clinic treatments with a clear plan.</p>
            </Link>
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>For men and women with symptoms of hormone imbalance who want bioidentical hormone therapy with close follow-up.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>Medical support with weight, appetite, and metabolism — not just another diet.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Recovery, performance, and longevity support using targeted peptide protocols.</p>
            </Link>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#737373', maxWidth: '500px', margin: '0 auto'}}>
              These aren't separate entry points. Your Assessment helps us figure out which path is right for you.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Box */}
      <section className="section section-gray">
        <div className="container">
          <div style={{maxWidth: '600px', margin: '0 auto', background: '#ffffff', border: '2px solid #000000', borderRadius: '16px', padding: '2.5rem', textAlign: 'center'}}>
            <span style={{display: 'inline-block', background: '#000', color: '#fff', padding: '0.25rem 1rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1rem'}}>Start Here</span>
            <h3 style={{marginBottom: '0.5rem'}}>Range Assessment</h3>
            <div style={{fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem'}}>$199</div>
            <p style={{fontSize: '0.9375rem', color: '#525252', marginBottom: '1.5rem'}}>60–75 minute visit with a provider</p>
            <ul style={{textAlign: 'left', listStyle: 'none', padding: '0', marginBottom: '1.5rem'}}>
              <li style={{padding: '0.5rem 0', fontSize: '0.9375rem', color: '#525252', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
                <span style={{color: '#000', fontWeight: '600'}}>✓</span> Full review of your symptoms and history
              </li>
              <li style={{padding: '0.5rem 0', fontSize: '0.9375rem', color: '#525252', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
                <span style={{color: '#000', fontWeight: '600'}}>✓</span> Review of any labs you've already done
              </li>
              <li style={{padding: '0.5rem 0', fontSize: '0.9375rem', color: '#525252', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
                <span style={{color: '#000', fontWeight: '600'}}>✓</span> Lab recommendations if they help your plan
              </li>
              <li style={{padding: '0.5rem 0', fontSize: '0.9375rem', color: '#525252', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
                <span style={{color: '#000', fontWeight: '600'}}>✓</span> Written plan with clear next steps
              </li>
            </ul>
            <Link href="/book" className="btn-primary" style={{width: '100%', textAlign: 'center'}}>
              Schedule Your Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Start With One Visit</span>
          <h2>Tired of Guessing?</h2>
          <p>If you want a clear plan built around your symptoms and data, the Range Assessment is the first step.</p>
          <div className="cta-buttons">
            <Link href="/book" className="btn-white">
              Schedule Range Assessment — $199
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
