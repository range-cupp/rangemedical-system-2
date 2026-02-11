import Layout from '../components/Layout';
import Link from 'next/link';

export default function LabPanels() {
  return (
    <Layout 
      title="Lab Panels | Essential $350 & Elite $750 | Range Medical"
      description="Comprehensive lab panels for hormone, metabolic, and health optimization. Essential Panel $350, Elite Panel $750. Full biomarker breakdown. Newport Beach."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Detailed Lab Breakdown</span>
          <h1>What We Test & Why It Matters</h1>
          <p className="hero-sub">A complete look at every biomarker in our Essential and Elite panels—and what each one tells us about your health.</p>
          
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Take Your Range Assessment</Link>
            <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a></p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ Blood Draw On-Site</span>
          <span className="trust-item">✓ Results in 3-4 Days</span>
          <span className="trust-item">✓ HSA & FSA Welcome</span>
        </div>
      </div>

      {/* Men's Panels */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Men's Panels</div>
          <h2 className="section-title">Men's Lab Panels</h2>
          <p className="section-subtitle">Comprehensive hormone and metabolic testing designed for men's health optimization.</p>
          
          <div className="panel-grid">
            <div className="panel-card">
              <h3>Essential Panel — $350</h3>
              <p className="panel-desc">Core markers for energy, hormones, and metabolism. Great starting point.</p>
              
              <div className="marker-section">
                <h4>Hormones</h4>
                <ul>
                  <li>Total Testosterone</li>
                  <li>Free Testosterone</li>
                  <li>Estradiol (E2)</li>
                  <li>SHBG</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Thyroid</h4>
                <ul>
                  <li>TSH</li>
                  <li>Free T4</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Metabolic</h4>
                <ul>
                  <li>Comprehensive Metabolic Panel</li>
                  <li>Lipid Panel</li>
                  <li>HbA1c</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>General Health</h4>
                <ul>
                  <li>CBC with Differential</li>
                  <li>Vitamin D</li>
                  <li>PSA (Prostate)</li>
                </ul>
              </div>
            </div>
            
            <div className="panel-card featured">
              <div className="panel-badge">Most Comprehensive</div>
              <h3>Elite Panel — $750</h3>
              <p className="panel-desc">Everything in Essential plus advanced markers for the full picture.</p>
              
              <div className="marker-section">
                <h4>Hormones (Expanded)</h4>
                <ul>
                  <li>Total & Free Testosterone</li>
                  <li>Estradiol (E2)</li>
                  <li>SHBG</li>
                  <li>DHEA-S</li>
                  <li>DHT</li>
                  <li>LH & FSH</li>
                  <li>Prolactin</li>
                  <li>Cortisol</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Thyroid (Complete)</h4>
                <ul>
                  <li>TSH</li>
                  <li>Free T4</li>
                  <li>Free T3</li>
                  <li>Reverse T3</li>
                  <li>Thyroid Antibodies</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Metabolic (Deep Dive)</h4>
                <ul>
                  <li>Comprehensive Metabolic Panel</li>
                  <li>Advanced Lipid Panel</li>
                  <li>HbA1c</li>
                  <li>Fasting Insulin</li>
                  <li>HOMA-IR</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Inflammation & Cardiovascular</h4>
                <ul>
                  <li>hs-CRP</li>
                  <li>Homocysteine</li>
                  <li>Lp(a)</li>
                  <li>ApoB</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>General Health</h4>
                <ul>
                  <li>CBC with Differential</li>
                  <li>Vitamin D</li>
                  <li>B12</li>
                  <li>Ferritin</li>
                  <li>Iron Panel</li>
                  <li>PSA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Women's Panels */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Women's Panels</div>
          <h2 className="section-title">Women's Lab Panels</h2>
          <p className="section-subtitle">Hormone and metabolic testing designed for women's unique physiology.</p>
          
          <div className="panel-grid">
            <div className="panel-card">
              <h3>Essential Panel — $350</h3>
              <p className="panel-desc">Core markers for energy, hormones, and metabolism. Great starting point.</p>
              
              <div className="marker-section">
                <h4>Hormones</h4>
                <ul>
                  <li>Estradiol (E2)</li>
                  <li>Progesterone</li>
                  <li>Total Testosterone</li>
                  <li>Free Testosterone</li>
                  <li>SHBG</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Thyroid</h4>
                <ul>
                  <li>TSH</li>
                  <li>Free T4</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Metabolic</h4>
                <ul>
                  <li>Comprehensive Metabolic Panel</li>
                  <li>Lipid Panel</li>
                  <li>HbA1c</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>General Health</h4>
                <ul>
                  <li>CBC with Differential</li>
                  <li>Vitamin D</li>
                  <li>Ferritin</li>
                </ul>
              </div>
            </div>
            
            <div className="panel-card featured">
              <div className="panel-badge">Most Comprehensive</div>
              <h3>Elite Panel — $750</h3>
              <p className="panel-desc">Everything in Essential plus advanced markers for the full picture.</p>
              
              <div className="marker-section">
                <h4>Hormones (Expanded)</h4>
                <ul>
                  <li>Estradiol (E2)</li>
                  <li>Progesterone</li>
                  <li>Total & Free Testosterone</li>
                  <li>SHBG</li>
                  <li>DHEA-S</li>
                  <li>LH & FSH</li>
                  <li>Prolactin</li>
                  <li>Cortisol</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Thyroid (Complete)</h4>
                <ul>
                  <li>TSH</li>
                  <li>Free T4</li>
                  <li>Free T3</li>
                  <li>Reverse T3</li>
                  <li>Thyroid Antibodies</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Metabolic (Deep Dive)</h4>
                <ul>
                  <li>Comprehensive Metabolic Panel</li>
                  <li>Advanced Lipid Panel</li>
                  <li>HbA1c</li>
                  <li>Fasting Insulin</li>
                  <li>HOMA-IR</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>Inflammation & Cardiovascular</h4>
                <ul>
                  <li>hs-CRP</li>
                  <li>Homocysteine</li>
                  <li>Lp(a)</li>
                  <li>ApoB</li>
                </ul>
              </div>
              
              <div className="marker-section">
                <h4>General Health</h4>
                <ul>
                  <li>CBC with Differential</li>
                  <li>Vitamin D</li>
                  <li>B12</li>
                  <li>Ferritin</li>
                  <li>Iron Panel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Process</div>
          <h2 className="section-title">How the Range Assessment Works</h2>
          <p className="section-subtitle">Simple process, clear results.</p>
          
          <div className="process-steps">
            <div className="step">
              <div className="step-num">1</div>
              <h4>Book & Complete Questionnaire</h4>
              <p>Schedule your blood draw. We'll send a symptoms questionnaire beforehand.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h4>Blood Draw at Our Office</h4>
              <p>Come to our Newport Beach location. Quick and easy, about 15 minutes.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h4>Results in 3-4 Days</h4>
              <p>Your provider reviews everything before your consult.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h4>1:1 Provider Review</h4>
              <p>We explain what's off, why it matters, and what we recommend.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to See the Full Picture?</h2>
          <p>Take your Range Assessment and get clarity on what's really going on inside.</p>
          <Link href="/range-assessment" className="btn-white">Take Your Range Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text to schedule</a></p>
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
        }
        
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 600px;
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
        
        .panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .panel-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 2rem;
          position: relative;
        }
        
        .panel-card.featured {
          border: 2px solid #000000;
        }
        
        .panel-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #000000;
          color: #ffffff;
          padding: 0.25rem 1rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .panel-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        .panel-desc {
          font-size: 0.9375rem;
          color: #525252;
          margin-bottom: 1.5rem;
        }
        
        .marker-section {
          margin-bottom: 1.25rem;
        }
        
        .marker-section h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        
        .marker-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .marker-section ul li {
          padding: 0.25rem 0;
          font-size: 0.875rem;
          color: #404040;
        }
        
        .process-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .step {
          text-align: center;
        }
        
        .step-num {
          width: 48px;
          height: 48px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          margin: 0 auto 1rem;
        }
        
        .step h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .step p {
          font-size: 0.875rem;
          color: #525252;
        }
        
        .final-cta {
          background: #000000;
          padding: 4rem 1.5rem;
          text-align: center;
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
          .panel-grid {
            grid-template-columns: 1fr;
          }
          
          .process-steps {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .hero {
            padding: 3rem 1.5rem 2rem;
          }
          
          .process-steps {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
