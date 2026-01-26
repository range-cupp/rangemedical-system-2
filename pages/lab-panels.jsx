import Layout from '../components/Layout';
import Link from 'next/link';

export default function LabPanels() {
  return (
    <Layout 
      title="Lab Panels | Essential $350 & Elite $750 | Range Medical"
      description="Comprehensive lab panels for hormone, metabolic, and health optimization. Essential Panel $350, Elite Panel $750. Full biomarker breakdown. Newport Beach."
    >
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

      {/* Which Panel Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Choose Your Panel</div>
          <h2 className="section-title">Which Panel Is Right For You?</h2>
          <p className="section-subtitle">Both panels give us valuable information. Here's how to decide.</p>
          
          <div className="panel-choice-grid">
            <div className="panel-choice-card">
              <h4>Essential Panel — $350</h4>
              <p className="panel-choice-tagline">The smart starting point</p>
              <ul className="panel-choice-list">
                <li>Getting labs for the first time with us</li>
                <li>Want a solid baseline of key markers</li>
                <li>No major symptoms or health history</li>
                <li>Cost-conscious but still want quality data</li>
              </ul>
              <p className="panel-choice-covers"><strong>Covers:</strong> Core hormones, basic thyroid, metabolic health, cholesterol, blood sugar, and general wellness markers.</p>
            </div>
            <div className="panel-choice-card featured">
              <h4>Elite Panel — $750</h4>
              <p className="panel-choice-tagline">The complete picture</p>
              <ul className="panel-choice-list">
                <li>Stubborn symptoms that need answers</li>
                <li>Want to catch problems before they start</li>
                <li>Family history of heart disease or diabetes</li>
                <li>Serious about long-term optimization</li>
                <li>Tried treatments before that didn't work</li>
              </ul>
              <p className="panel-choice-covers"><strong>Adds:</strong> Complete thyroid with antibodies, advanced heart markers (ApoB, Lp(a)), insulin resistance testing, inflammation markers, cortisol, and DHEA.</p>
            </div>
          </div>
          
          <p style={{textAlign: 'center', marginTop: '2rem', color: '#525252', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto'}}><strong>Not sure?</strong> Start with Essential. If we find something that needs a closer look, we can always add specific tests. Your provider will help you decide at your Range Assessment.</p>
        </div>
      </section>

      <style jsx>{`
        .panel-choice-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .panel-choice-grid {
            grid-template-columns: 1fr;
          }
        }
        .panel-choice-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }
        .panel-choice-card.featured {
          border: 2px solid #000;
        }
        .panel-choice-card h4 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .panel-choice-tagline {
          color: #525252;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }
        .panel-choice-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }
        .panel-choice-list li {
          padding: 0.5rem 0;
          padding-left: 1.75rem;
          position: relative;
          color: #374151;
        }
        .panel-choice-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000;
          font-weight: 600;
        }
        .panel-choice-covers {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }
      `}</style>

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
          <h2 className="section-title">How to Get Started</h2>
          <p className="section-subtitle">Labs are recommended based on your goals and symptoms—not required for everyone.</p>
          
          <div className="process-steps">
            <div className="step">
              <div className="step-num">1</div>
              <h4>Book Your Range Assessment</h4>
              <p>Meet with a provider to discuss your symptoms and goals. We'll determine if labs will help build a better plan for you.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h4>Get Your Labs (If Recommended)</h4>
              <p>If labs make sense for your situation, we do the blood draw on-site. Quick and easy, about 15 minutes.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h4>Results in 3-4 Days</h4>
              <p>Your provider reviews everything before your follow-up.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h4>1:1 Provider Review</h4>
              <p>We explain what's off, why it matters, and what we recommend for your plan.</p>
            </div>
          </div>
          
          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#525252', maxWidth: '500px', margin: '0 auto'}}>
              Your $199 Range Assessment fee is credited toward any treatment, including labs.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to See the Full Picture?</h2>
          <p>Start with a Range Assessment. Your provider will recommend the right labs for your situation.</p>
          <Link href="/range-assessment" className="btn-white">Book Your Range Assessment</Link>
          <p className="cta-secondary">Already a patient? <a href="tel:+19499973988">Call or text to schedule</a></p>
        </div>
      </section>
    </Layout>
  );
}
