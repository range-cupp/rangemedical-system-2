import Layout from '../components/Layout';
import Link from 'next/link';

export default function HormoneOptimization() {
  return (
    <Layout 
      title="Hormone Optimization Newport Beach | HRT | Range Medical"
      description="Hormone optimization and HRT in Newport Beach. Labs-first approach to testosterone, estrogen, and thyroid. For men and women. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Hormone Optimization</span>
          <h1>Tired, Moody, or Just Not Yourself?</h1>
          <p className="hero-sub">Your hormones control more than you think—energy, mood, weight, sleep, drive. When they're off, everything feels harder. We find out what's actually going on and fix it.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      {/* Symptoms */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Sound Familiar?</div>
          <h2 className="section-title">Signs Your Hormones Might Be Off</h2>
          <p className="section-subtitle">These symptoms are common—but they're not "normal." And they're often connected to hormone imbalances.</p>
          
          <div className="symptoms-grid">
            <div className="symptom-col">
              <h4>Men</h4>
              <ul>
                <li>Low energy or constant fatigue</li>
                <li>Trouble building muscle despite training</li>
                <li>Weight gain, especially belly fat</li>
                <li>Brain fog or poor focus</li>
                <li>Low sex drive or performance issues</li>
                <li>Irritability or mood swings</li>
                <li>Poor sleep quality</li>
              </ul>
            </div>
            <div className="symptom-col">
              <h4>Women</h4>
              <ul>
                <li>Exhaustion that sleep doesn't fix</li>
                <li>Stubborn weight that won't budge</li>
                <li>Mood swings, anxiety, or depression</li>
                <li>Brain fog or memory issues</li>
                <li>Low libido</li>
                <li>Hot flashes or night sweats</li>
                <li>Irregular cycles or PMS</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Problem</div>
          <h2 className="section-title">Why You Still Feel Off</h2>
          <p className="section-subtitle">Most doctors check basic labs, say "you're fine," and send you home. That's not good enough.</p>
          
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-icon">📉</div>
              <h4>Hormones Shift Early</h4>
              <p>Testosterone and other hormones start declining in your 30s—not your 60s. By the time symptoms show up, you've been suboptimal for years.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🩺</div>
              <h4>Doctors Miss It</h4>
              <p>"Normal" lab ranges are based on the average population—including unhealthy people. Being in range doesn't mean you're optimized.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🔬</div>
              <h4>We Look Deeper</h4>
              <p>We check free testosterone (not just total), thyroid antibodies, estrogen metabolites, and more—markers most doctors skip.</p>
            </div>
          </div>
          
          <div className="comparison">
            <div className="comparison-col">
              <h4>Typical Doctor</h4>
              <ul>
                <li>Checks total testosterone only</li>
                <li>"You're in range, you're fine"</li>
                <li>Prescribes without knowing your baseline</li>
                <li>No follow-up or monitoring</li>
              </ul>
            </div>
            <div className="comparison-col range">
              <h4>Range Medical</h4>
              <ul>
                <li>Full hormone panel including free T</li>
                <li>Compares to optimal ranges, not just "normal"</li>
                <li>Treatment based on YOUR labs</li>
                <li>Regular monitoring and adjustments</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Toolkit</div>
          <h2 className="section-title">How We Optimize</h2>
          <p className="section-subtitle">We don't guess. We test, then use the right tools for your situation.</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <h4>Hormone Replacement</h4>
              <p>Testosterone, estrogen, progesterone, thyroid—dosed precisely based on your labs and monitored over time.</p>
            </div>
            <div className="benefit-card">
              <h4>Peptide Therapy</h4>
              <p>Growth hormone peptides, BPC-157 for healing, and others that support hormone function naturally.</p>
            </div>
            <div className="benefit-card">
              <h4>IV & NAD+</h4>
              <p>Direct nutrient delivery to support cellular energy and hormone production.</p>
            </div>
            <div className="benefit-card">
              <h4>Lifestyle Guidance</h4>
              <p>Sleep, nutrition, and exercise recommendations that actually move the needle on your labs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Results</div>
          <h2 className="section-title">What Our Patients Say</h2>
          
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"I thought feeling tired all the time was just part of getting older. Six weeks on my protocol and I feel like I'm in my 20s again."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">JM</div>
                <div className="testimonial-info">
                  <strong>J.M.</strong>
                  <span>HRT Patient, 47</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"My primary care doctor said my hormones were 'fine.' Range found my thyroid was completely off. Finally getting answers."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">SK</div>
                <div className="testimonial-info">
                  <strong>S.K.</strong>
                  <span>Thyroid Patient, 38</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"The brain fog is gone. I can focus at work again. I didn't realize how bad it had gotten until I felt normal again."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">ML</div>
                <div className="testimonial-info">
                  <strong>M.L.</strong>
                  <span>HRT Patient, 52</span>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">★★★★★</div>
              <p>"They actually listen. Every visit they check my labs and adjust. Not just a prescription and 'see you in a year.'"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">RT</div>
                <div className="testimonial-info">
                  <strong>R.T.</strong>
                  <span>HRT Patient, 44</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-step">Step 1</div>
          <h2>Get Your Range Assessment</h2>
          <p>Meet with a provider to review your symptoms and goals, then build a clear plan together—including whether labs or treatment make sense for you.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
        </div>
      </section>
    </Layout>
  );
}
