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
            <Link href="/range-assessment" className="btn-primary">Book Your Range Assessment</Link>
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
          <p>Book your Range Assessment and get clarity on what's really going on inside.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Range Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text to schedule</a></p>
        </div>
      </section>
    </Layout>
  );
}
