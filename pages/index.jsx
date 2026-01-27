import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <Layout
      title="Range Medical | Newport Beach Wellness & Recovery"
      description="Two ways to feel like yourself again. Start with an Assessment for injury recovery or low energy. $199 to start."
    >
      <Head>
        <meta name="keywords" content="wellness clinic Newport Beach, injury recovery, low energy treatment, brain fog help, hormone optimization, medical weight loss" />
        <link rel="canonical" href="https://www.range-medical.com/" />
        <meta property="og:title" content="Range Medical | Newport Beach Wellness & Recovery" />
        <meta property="og:description" content="Two ways to feel like yourself again. Start with an Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🔬 Evidence-Based Care</span>
        </div>
      </div>

      {/* Hero - Two Doors */}
      <section className="hero">
        <h1>Two Ways We Help You Feel Like Yourself Again</h1>
        <p className="hero-sub">
          Start with an Assessment for your biggest problem: injury recovery or low energy.
        </p>
        <div className="assessment-options">
          <Link href="/injury-recovery" className="assessment-button">
            <span className="button-icon">✎</span>
            <span>Injury Recovery Assessment</span>
            <span className="button-divider"></span>
            <span className="button-price">$199</span>
          </Link>
          <Link href="/range-assessment" className="assessment-button">
            <span className="button-icon">⚡</span>
            <span>Range Assessment</span>
            <span className="button-divider"></span>
            <span className="button-price">$199</span>
          </Link>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">How It Works</p>
          <h2 className="section-title">Two Doors, One Goal: Help You Feel Better</h2>
          <p className="section-subtitle">
            Pick the door that matches your main concern. Both start with a $199 Assessment.
          </p>

          <div className="doors-grid">
            <div className="door-card">
              <div className="door-icon">🩹</div>
              <h3>Injury Recovery</h3>
              <p>You're rehabbing an injury and healing feels slow. You want to speed things up.</p>
              <ul>
                <li>$199 Injury Recovery Assessment</li>
                <li>Review your injury and rehab plan</li>
                <li>Get a clear recovery protocol</li>
                <li>$199 credited toward your protocol</li>
              </ul>
              <Link href="/injury-recovery" className="btn-primary" style={{width: '100%', textAlign: 'center', marginTop: '1rem'}}>
                Learn More
              </Link>
            </div>

            <div className="door-card featured">
              <span className="door-badge">Most Popular</span>
              <div className="door-icon">⚡</div>
              <h3>Energy & Optimization</h3>
              <p>You're tired, foggy, or just don't feel like yourself. You want answers and a plan.</p>
              <ul>
                <li>$199 Range Assessment</li>
                <li>Connect symptoms to a plan</li>
                <li>Labs when they help</li>
                <li>Programs tailored to you</li>
              </ul>
              <Link href="/range-assessment" className="btn-primary" style={{width: '100%', textAlign: 'center', marginTop: '1rem'}}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">What We Offer</p>
          <h2 className="section-title">Tools We Use to Help You Feel Better</h2>
          <p className="section-subtitle">
            Your provider picks the right tools for your situation. You don't have to figure it out yourself.
          </p>

          <div className="tools-grid">
            <Link href="/hyperbaric-oxygen-therapy" className="tool-card">
              <h4>Hyperbaric Oxygen</h4>
              <p>More oxygen to your cells to support healing and energy.</p>
            </Link>
            <Link href="/red-light-therapy" className="tool-card">
              <h4>Red Light Therapy</h4>
              <p>Light wavelengths that help cells recover and function better.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV Therapy</h4>
              <p>Vitamins and nutrients delivered directly to your bloodstream.</p>
            </Link>
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>Balanced hormones for energy, mood, and how you feel every day.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>Medical support for weight, appetite, and metabolism.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Targeted peptides for recovery, performance, and longevity.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Results</p>
          <h2 className="section-title">What Our Patients Say</h2>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "I was skeptical, but after the Assessment I finally understood why I'd been so tired. 
                Six weeks later I feel like myself again."
              </blockquote>
              <cite>— Sarah M., Newport Beach</cite>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "My shoulder was taking forever to heal. The recovery protocol got me back to training 
                weeks faster than I expected."
              </blockquote>
              <cite>— Michael R., Costa Mesa</cite>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <blockquote>
                "Clear communication, no pressure, and a plan that actually made sense. 
                This is what healthcare should be."
              </blockquote>
              <cite>— Jennifer K., Irvine</cite>
            </div>
          </div>

          <div className="testimonials-cta">
            <Link href="/reviews" className="btn-outline">Read More Reviews</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Feel Like Yourself Again?</h2>
          <p>Pick the Assessment that fits your situation. Both are $199.</p>
          <div className="cta-buttons">
            <Link href="/injury-recovery" className="btn-white">
              Injury Recovery Assessment
            </Link>
            <Link href="/range-assessment" className="btn-outline-white">
              Range Assessment
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      <style jsx>{`
        .assessment-options {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }

        .assessment-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          text-decoration: none;
          color: #171717;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .assessment-button:hover {
          background: #171717;
          color: #ffffff;
          border-color: #171717;
        }

        .button-icon {
          font-size: 1rem;
          opacity: 0.7;
        }

        .button-divider {
          width: 1px;
          height: 16px;
          background: #e5e5e5;
          margin: 0 0.25rem;
        }

        .assessment-button:hover .button-divider {
          background: rgba(255, 255, 255, 0.3);
        }

        .button-price {
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .assessment-options {
            flex-direction: column;
            align-items: center;
          }
          
          .assessment-button {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }
        }
      `}</style>
    </Layout>
  );
}
