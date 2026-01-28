import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function RangeAssessment() {
  return (
    <Layout
      title="Range Assessment for Energy & Optimization | Range Medical | Newport Beach"
      description="If you're tired, foggy, or not like yourself, this is where we start. $199 Range Assessment with a clear plan. Newport Beach."
    >
      <Head>
        <meta name="keywords" content="wellness assessment Newport Beach, fatigue help, brain fog treatment, hormone testing, energy optimization, low energy" />
        <link rel="canonical" href="https://www.range-medical.com/range-assessment" />
        <meta property="og:title" content="Range Assessment for Energy & Optimization | Range Medical" />
        <meta property="og:description" content="If you're tired, foggy, or not like yourself, this is where we start. $199 Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/range-assessment" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">⚡ Energy & Optimization</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Start Here</span>
        <h1>Range Assessment for Energy & Optimization</h1>
        <p className="hero-sub">
          If you're tired, foggy, or just don't feel like yourself, this is where we start.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <Link href="/book?reason=energy" className="btn-primary">
              Book Your Range Assessment — $199
            </Link>
          </div>
          <p className="hero-secondary">
            Most visits last 30–45 minutes.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who This Is For</h2>

          <div className="pain-points">
            <ul>
              <li>You feel tired or foggy even though your regular labs were "normal."</li>
              <li>You rely on coffee or energy drinks just to get through the day.</li>
              <li>Your sleep, mood, or libido is off and you can't figure out why.</li>
              <li>You want a long-term plan for hormones, weight, or longevity — not guesswork.</li>
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
              <p>We review any labs you've had done this year and explain what they actually mean for how you feel.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🎯</span> Recommend Next Steps</h4>
              <p>If deeper lab work would change your plan, we recommend specific panels and timing.</p>
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
          <h2 className="section-title">How Labs Fit Into Your Assessment</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Every person is different. During your Assessment, your provider reviews your symptoms, history, and current treatments.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              If deeper lab work will change your plan, they'll recommend which labs to run and when.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Some patients start with treatments we can do right away and add labs later. Others start with labs first. You and your provider decide together what makes the most sense.
            </p>
            <div style={{background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem'}}>
              <p style={{fontSize: '0.9375rem', color: '#404040', marginBottom: '0', textAlign: 'center'}}>
                <strong>Labs are not automatically included for everyone.</strong><br />
                They are added when they truly help us build a better plan for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Credit Works */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">The Investment</p>
          <h2 className="section-title">How Your $199 Credit Works</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <div style={{background: '#ffffff', border: '2px solid #000000', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem'}}>
              <div style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem'}}>$199</div>
              <p style={{fontSize: '1rem', color: '#525252', marginBottom: '0'}}>Range Assessment</p>
            </div>
            
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Your Range Assessment is $199.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              If you decide to start a program, we apply the full $199 toward the cost — including labs.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '0'}}>
              If you choose not to move forward, you still leave with a clear understanding of your situation 
              and what we recommend.
            </p>
          </div>
        </div>
      </section>

      {/* What Comes Next */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">After Your Assessment</p>
          <h2 className="section-title">Programs Your Provider May Recommend</h2>
          <p className="section-subtitle">
            Based on your goals and results, your provider may recommend one or more of these:
          </p>

          <div className="tools-grid">
            <Link href="/cellular-energy-reset" className="tool-card">
              <h4>Cellular Energy Reset</h4>
              <p>6-week program for low energy, brain fog, and slow recovery.</p>
            </Link>
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>For men and women with symptoms of hormone imbalance who want bioidentical hormone therapy.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>Medical support with weight, appetite, and metabolism.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Recovery, performance, and longevity support using targeted peptide protocols.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV Therapy</h4>
              <p>Vitamins, nutrients, and hydration delivered directly to your bloodstream.</p>
            </Link>
            <Link href="/lab-panels" className="tool-card">
              <h4>Advanced Lab Testing</h4>
              <p>Deeper lab panels when your provider recommends them for your specific situation.</p>
            </Link>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#737373', maxWidth: '500px', margin: '0 auto'}}>
              You're not buying these from this page. Your Assessment helps us figure out which path is right for you.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions</h2>

          <div className="faq-container">
            <div className="faq-item">
              <h4>Do I need to bring labs?</h4>
              <p>If you have labs from the past year, bring them. If not, that's okay — we'll decide together if labs would help.</p>
            </div>

            <div className="faq-item">
              <h4>Will I get treatment at my first visit?</h4>
              <p>Sometimes. Depending on your situation, we may be able to start something right away. Other times we'll need labs first.</p>
            </div>

            <div className="faq-item">
              <h4>How long does the visit take?</h4>
              <p>Plan for 30–45 minutes. This is a real conversation, not a rushed appointment.</p>
            </div>

            <div className="faq-item">
              <h4>What if I also have an injury I'm dealing with?</h4>
              <p>We can talk about that at your Assessment. If injury recovery is your main concern, you might want to start with the <Link href="/injury-recovery"><strong>Injury & Recovery</strong></Link> door instead.</p>
            </div>

            <div className="faq-item">
              <h4>Is this covered by insurance?</h4>
              <p>We're a cash-pay clinic. Many patients use HSA or FSA funds. We provide detailed receipts you can submit for potential reimbursement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Start With One Visit</span>
          <h2>Tired of Guessing?</h2>
          <p>Book your Range Assessment. If you move forward with a program, the $199 is credited toward it.</p>
          <div className="cta-buttons">
            <Link href="/book?reason=energy" className="btn-white">
              Book Your Range Assessment — $199
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
