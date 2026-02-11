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
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ Labs Before Treatment</span>
          <span className="trust-item">✓ Male & Female Protocols</span>
          <span className="trust-item">✓ Ongoing Monitoring</span>
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
          
          <div className="tools-grid">
            <div className="tool-card">
              <h4>Hormone Replacement</h4>
              <p>Testosterone, estrogen, progesterone, thyroid—dosed precisely based on your labs and monitored over time.</p>
            </div>
            <div className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Growth hormone peptides, BPC-157 for healing, and others that support hormone function naturally.</p>
            </div>
            <div className="tool-card">
              <h4>IV & NAD+</h4>
              <p>Direct nutrient delivery to support cellular energy and hormone production.</p>
            </div>
            <div className="tool-card">
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
          <p>We'll check your hormones, thyroid, metabolism, and more—then build a protocol that fits your body.</p>
          <Link href="/range-assessment" className="btn-white">Take Your Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
        </div>
      </section>

      <style jsx>{`
        .hero {
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }
        
        .hero-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        
        .hero h1 {
          margin-bottom: 1rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 650px;
          margin: 0 auto 2rem;
        }
        
        .hero-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .hero-secondary {
          font-size: 0.9375rem;
          color: #737373;
        }
        
        .hero-secondary a {
          color: #171717;
          font-weight: 600;
        }
        
        .symptoms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .symptom-col {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .symptom-col h4 {
          font-size: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .symptom-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .symptom-col ul li {
          padding: 0.5rem 0;
          font-size: 0.9375rem;
          color: #525252;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .symptom-col ul li::before {
          content: "→";
          color: #737373;
          flex-shrink: 0;
        }
        
        .problem-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto 2.5rem;
        }
        
        .problem-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        
        .problem-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }
        
        .problem-card h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .problem-card p {
          font-size: 0.875rem;
          color: #525252;
          margin: 0;
        }
        
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .comparison-col {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e5e5e5;
        }
        
        .comparison-col.range {
          border: 2px solid #000000;
        }
        
        .comparison-col h4 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        
        .comparison-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .comparison-col ul li {
          padding: 0.5rem 0;
          font-size: 0.9375rem;
          color: #525252;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .comparison-col ul li::before {
          content: "✕";
          color: #dc2626;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .comparison-col.range ul li::before {
          content: "✓";
          color: #000000;
        }
        
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .tool-card {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .tool-card h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .tool-card p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .testimonial {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.75rem;
          border: 1px solid #e5e5e5;
        }
        
        .testimonial-stars {
          color: #000000;
          font-size: 1rem;
          letter-spacing: 2px;
          margin-bottom: 0.75rem;
        }
        
        .testimonial p {
          font-size: 0.9375rem;
          color: #404040;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .testimonial-avatar {
          width: 40px;
          height: 40px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
        }
        
        .testimonial-info {
          font-size: 0.875rem;
        }
        
        .testimonial-info strong {
          color: #171717;
          display: block;
        }
        
        .testimonial-info span {
          color: #737373;
        }
        
        .final-cta {
          background: #000000;
          padding: 4rem 1.5rem;
          text-align: center;
        }
        
        .cta-step {
          display: inline-block;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          padding: 0.375rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }
        
        .final-cta h2 {
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        
        .final-cta > .container > p {
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
        }
        
        .cta-secondary {
          margin-top: 1.5rem;
          color: rgba(255,255,255,0.6) !important;
          font-size: 0.9375rem;
        }
        
        .cta-secondary a {
          color: #ffffff;
          font-weight: 600;
        }
        
        @media (max-width: 900px) {
          .symptoms-grid,
          .comparison,
          .tools-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
          
          .problem-cards {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .hero {
            padding: 3rem 1.5rem 2rem;
          }
        }
      `}</style>
    </Layout>
  );
}
