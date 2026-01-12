import Layout from '../components/Layout';
import Link from 'next/link';

export default function RangeAssessment() {
  return (
    <Layout 
      title="Range Assessment | Labs + Provider Consult | Range Medical"
      description="Comprehensive lab panel + 1:1 provider consult. Essential Panel $350, Elite Panel $750. Newport Beach health optimization. (949) 997-3988."
    >
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Your Starting Point</span>
          <h1>The Range Assessment</h1>
          <p className="hero-sub">Comprehensive labs plus a 1:1 provider consult. We'll find out what's actually going on and build a plan that fits your goals.</p>
          
          <div className="hero-cta">
            <a href="#book" className="btn-primary">Book Your Assessment</a>
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

      {/* Offer Cards */}
      <section className="section" id="book">
        <div className="container">
          <div className="section-kicker">Choose Your Panel</div>
          <h2 className="section-title">Two Options, One Goal: Clarity</h2>
          <p className="section-subtitle">Both panels include a symptoms questionnaire, blood draw at our Newport Beach office, and a 1:1 provider review of your results.</p>
          
          <div className="offer-grid">
            <div className="offer-card">
              <h3>Essential Panel</h3>
              <div className="offer-price">$350</div>
              <p className="offer-note">Provider assessment included</p>
              <ul>
                <li>Core hormone markers (testosterone, estrogen, thyroid)</li>
                <li>Metabolic panel + basic inflammation</li>
                <li>Symptoms questionnaire</li>
                <li>1:1 provider review of results</li>
                <li>Written protocol recommendations</li>
              </ul>
              <p className="offer-best">Best for: First-time patients or general health check</p>
              <a href="tel:+19499973988" className="btn-outline">Call to Book</a>
            </div>
            
            <div className="offer-card featured">
              <div className="offer-badge">Most Comprehensive</div>
              <h3>Elite Panel</h3>
              <div className="offer-price">$750</div>
              <p className="offer-note">Provider assessment included</p>
              <ul>
                <li>Everything in Essential, plus:</li>
                <li>Advanced thyroid + adrenal markers</li>
                <li>Insulin sensitivity + metabolic deep-dive</li>
                <li>Full hormone panel (men or women)</li>
                <li>Inflammation + cardiovascular markers</li>
                <li>1:1 provider review of results</li>
                <li>Written protocol recommendations</li>
              </ul>
              <p className="offer-best">Best for: Patients who want the full picture</p>
              <a href="tel:+19499973988" className="btn-primary">Call to Book</a>
            </div>
          </div>
          
          <p className="offer-subtext">Not sure which panel? Call us at <a href="tel:+19499973988">(949) 997-3988</a> and we'll help you decide.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">The Process</div>
          <h2 className="section-title">How the Range Assessment Works</h2>
          <p className="section-subtitle">Simple process, clear results, personalized plan.</p>
          
          <div className="process-timeline">
            <div className="timeline-step">
              <div className="timeline-marker">1</div>
              <div className="timeline-content">
                <div className="timeline-day">Day 1</div>
                <h4>Blood Draw</h4>
                <p>Come to our Newport Beach office. Quick blood draw, no fasting required for most panels. We'll also have you complete a symptoms questionnaire.</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="timeline-marker">2</div>
              <div className="timeline-content">
                <div className="timeline-day">Days 3-4</div>
                <h4>Results Ready</h4>
                <p>Your labs come back. Your provider reviews everything before your consult so they're prepared to explain what they see.</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="timeline-marker">3</div>
              <div className="timeline-content">
                <div className="timeline-day">Days 5-6</div>
                <h4>Provider Consult</h4>
                <p>1:1 review of your results. We explain what's off, why it matters, and what we recommend. No rushing, no pressure.</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="timeline-marker">4</div>
              <div className="timeline-content">
                <div className="timeline-day">Day 7+</div>
                <h4>Start Your Protocol</h4>
                <p>If treatment makes sense, we'll get you started. Could be hormones, peptides, GLP-1s, or other tools—whatever your labs say you need.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">What We Look At</div>
          <h2 className="section-title">More Than Just Numbers</h2>
          <p className="section-subtitle">We check the markers that actually explain why you feel the way you do.</p>
          
          <div className="markers-grid">
            <div className="marker-card">
              <h4>Hormones</h4>
              <p>Testosterone, estrogen, progesterone, DHEA—the signals that drive energy, mood, and body composition.</p>
            </div>
            <div className="marker-card">
              <h4>Thyroid</h4>
              <p>TSH, Free T3, Free T4, and antibodies. Your metabolism's control center.</p>
            </div>
            <div className="marker-card">
              <h4>Metabolic Health</h4>
              <p>Fasting glucose, insulin, HbA1c. How your body processes energy and stores fat.</p>
            </div>
            <div className="marker-card">
              <h4>Inflammation</h4>
              <p>CRP, homocysteine, and other markers that reveal hidden stress on your system.</p>
            </div>
            <div className="marker-card">
              <h4>Nutrients</h4>
              <p>Vitamin D, B12, iron, ferritin. The building blocks your body needs to function.</p>
            </div>
            <div className="marker-card">
              <h4>Cardiovascular</h4>
              <p>Lipid panel, Lp(a), ApoB. Heart health markers that go beyond basic cholesterol.</p>
            </div>
          </div>
          
          <p className="markers-note">Want the full biomarker list? <Link href="/lab-panels">See our detailed lab panels breakdown →</Link></p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-container">
            <div className="faq-item">
              <h4>Do I need to fast before my blood draw?</h4>
              <p>For most panels, no. If fasting is required for your specific panel, we'll let you know when you book.</p>
            </div>
            <div className="faq-item">
              <h4>How long does the blood draw take?</h4>
              <p>About 10-15 minutes. You'll also complete a symptoms questionnaire which takes another 5-10 minutes.</p>
            </div>
            <div className="faq-item">
              <h4>What if my labs are normal but I still feel off?</h4>
              <p>"Normal" ranges are wide. We look at optimal ranges and how your markers relate to each other—not just whether you're technically in range.</p>
            </div>
            <div className="faq-item">
              <h4>Do you accept insurance?</h4>
              <p>We're a cash-pay clinic and don't bill insurance directly. Many patients use HSA or FSA funds. We can provide documentation for potential reimbursement.</p>
            </div>
            <div className="faq-item">
              <h4>What happens after my consult?</h4>
              <p>If treatment is appropriate, we'll discuss options and you can start as soon as you're ready. If you want to think about it, no pressure—your results are yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to See What's Going On Inside?</h2>
          <p>Book your Range Assessment and get the clarity you need to make real changes.</p>
          <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988 to Book</a>
          <p className="cta-location">📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>
    </Layout>
  );
}
