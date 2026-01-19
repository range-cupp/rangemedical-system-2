import React from 'react';

const CellularEnergyAssessment = () => {
  const styles = `
    .cea-page {
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
    }
    
    .cea-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Header */
    .cea-header {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e5e5;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .cea-header-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .cea-logo {
      height: 40px;
      width: auto;
    }
    
    .cea-header-cta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .cea-header-phone {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cea-header-phone a {
      color: #000000;
      font-weight: 600;
      text-decoration: none;
    }
    
    .cea-btn-small {
      background: #0284c7;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    
    .cea-btn-small:hover {
      background: #0369a1;
    }
    
    /* Hero */
    .cea-hero {
      padding: 4rem 1.5rem 3rem;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-bottom: 2px solid #0284c7;
    }
    
    .cea-hero-inner {
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cea-hero-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    
    .cea-hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
    }
    
    .cea-hero-subtitle {
      font-size: 1.125rem;
      color: #525252;
      line-height: 1.7;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cea-hero-price-box {
      background: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    
    .cea-hero-price {
      font-size: 2.5rem;
      font-weight: 700;
      color: #0284c7;
    }
    
    .cea-hero-credit {
      font-size: 1rem;
      color: #0369a1;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    
    .cea-btn-primary {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 1rem 2.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.0625rem;
      transition: all 0.2s;
    }
    
    .cea-btn-primary:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    
    /* Section */
    .cea-section {
      padding: 4rem 1.5rem;
    }
    
    .cea-section-alt {
      background: #fafafa;
    }
    
    .cea-section-kicker {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #0284c7;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .cea-section-title {
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    
    .cea-section-subtitle {
      font-size: 1.0625rem;
      color: #525252;
      text-align: center;
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }
    
    /* Who It's For */
    .cea-who-list {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cea-who-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .cea-who-item:last-child {
      border-bottom: none;
    }
    
    .cea-who-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .cea-who-text {
      font-size: 1rem;
      color: #1a1a1a;
    }
    
    /* What's Included */
    .cea-included-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cea-included-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cea-included-card {
      background: #ffffff;
      border: 2px solid #e5e5e5;
      border-radius: 12px;
      padding: 1.75rem;
      transition: border-color 0.2s;
    }
    
    .cea-included-card:hover {
      border-color: #0284c7;
    }
    
    .cea-included-number {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      font-weight: 700;
      font-size: 0.8125rem;
      margin-bottom: 0.75rem;
    }
    
    .cea-included-title {
      font-size: 1.0625rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cea-included-desc {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* Lab Panel */
    .cea-lab-section {
      background: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cea-lab-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .cea-lab-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cea-lab-subtitle {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cea-lab-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    @media (max-width: 600px) {
      .cea-lab-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cea-lab-category {
      background: #f0f9ff;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .cea-lab-category h4 {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0284c7;
      margin-bottom: 0.5rem;
    }
    
    .cea-lab-category ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cea-lab-category li {
      font-size: 0.875rem;
      color: #1a1a1a;
      padding: 0.125rem 0;
    }
    
    /* How It Works */
    .cea-steps {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cea-step {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .cea-step:last-child {
      border-bottom: none;
    }
    
    .cea-step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: #0284c7;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }
    
    .cea-step-content h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cea-step-content p {
      font-size: 0.9375rem;
      color: #525252;
      margin: 0;
    }
    
    /* Credit Box */
    .cea-credit-box {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cea-credit-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .cea-credit-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #166534;
      margin-bottom: 0.75rem;
    }
    
    .cea-credit-text {
      font-size: 1rem;
      color: #166534;
      line-height: 1.6;
    }
    
    .cea-credit-text strong {
      color: #15803d;
    }
    
    /* Pricing Box */
    .cea-pricing-box {
      background: #ffffff;
      border: 3px solid #0284c7;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cea-pricing-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cea-pricing-subtitle {
      font-size: 0.9375rem;
      color: #525252;
      margin-bottom: 1.5rem;
    }
    
    .cea-pricing-price {
      font-size: 3rem;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 0.5rem;
    }
    
    .cea-pricing-credit {
      font-size: 1rem;
      color: #22c55e;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    
    .cea-pricing-includes {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    
    .cea-pricing-includes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cea-pricing-includes li {
      font-size: 0.9375rem;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .cea-pricing-includes li:last-child {
      border-bottom: none;
    }
    
    .cea-pricing-includes li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #0284c7;
      font-weight: 700;
    }
    
    .cea-pricing-cta {
      margin-bottom: 1rem;
    }
    
    .cea-pricing-cta .cea-btn-primary {
      width: 100%;
    }
    
    .cea-pricing-note {
      font-size: 0.8125rem;
      color: #737373;
    }
    
    /* FAQ */
    .cea-faq-list {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cea-faq-item {
      border-bottom: 1px solid #e5e5e5;
      padding: 1.25rem 0;
    }
    
    .cea-faq-item:last-child {
      border-bottom: none;
    }
    
    .cea-faq-question {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .cea-faq-answer {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* Link to Reset */
    .cea-reset-link {
      background: #000000;
      color: #ffffff;
      padding: 2.5rem;
      border-radius: 16px;
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cea-reset-link h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cea-reset-link p {
      font-size: 1rem;
      color: #a3a3a3;
      margin-bottom: 1.5rem;
    }
    
    .cea-btn-white {
      display: inline-block;
      background: #ffffff;
      color: #000000;
      padding: 0.875rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cea-btn-white:hover {
      background: #f5f5f5;
    }
    
    /* Footer */
    .cea-footer {
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    
    .cea-footer-text {
      font-size: 0.875rem;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cea-footer-links a {
      color: #525252;
      text-decoration: none;
      font-size: 0.875rem;
    }
    
    .cea-footer-links a:hover {
      text-decoration: underline;
    }
    
    /* Mobile */
    @media (max-width: 768px) {
      .cea-hero-title {
        font-size: 2rem;
      }
      
      .cea-header-phone {
        display: none;
      }
      
      .cea-hero-price {
        font-size: 2rem;
      }
      
      .cea-pricing-price {
        font-size: 2.5rem;
      }
    }
  `;

  return (
    <div className="cea-page">
      <style>{styles}</style>
      
      {/* Header */}
      <header className="cea-header">
        <div className="cea-header-inner">
          <a href="https://range-medical.com">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="cea-logo"
            />
          </a>
          <div className="cea-header-cta">
            <span className="cea-header-phone">Questions? <a href="tel:+19499973988">(949) 997-3988</a></span>
            <a href="sms:+19499973988?body=Hi, I'd like to book a Cellular Energy Assessment." className="cea-btn-small">Book Now</a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="cea-hero">
        <div className="cea-hero-inner">
          <div className="cea-hero-badge">Step 1</div>
          <h1 className="cea-hero-title">Cellular Energy Assessment</h1>
          <p className="cea-hero-subtitle">
            Know exactly what's happening at the cellular level before you commit to anything. Labs, analysis, and a clear plan—in one visit.
          </p>
          <div className="cea-hero-price-box">
            <div className="cea-hero-price">$497</div>
            <div className="cea-hero-credit">100% credits toward the 6-Week Reset</div>
          </div>
          <div>
            <a href="sms:+19499973988?body=Hi, I'd like to book a Cellular Energy Assessment." className="cea-btn-primary">Book Your Assessment →</a>
          </div>
        </div>
      </section>
      
      {/* Who It's For */}
      <section className="cea-section">
        <div className="cea-container">
          <p className="cea-section-kicker">Is This You?</p>
          <h2 className="cea-section-title">The Assessment Is Perfect If You...</h2>
          
          <div className="cea-who-list">
            <div className="cea-who-item">
              <span className="cea-who-icon">🤔</span>
              <p className="cea-who-text"><strong>Want data before committing</strong> — You're curious about the 6-Week Reset but want to see your baseline first.</p>
            </div>
            <div className="cea-who-item">
              <span className="cea-who-icon">😩</span>
              <p className="cea-who-text"><strong>Can't explain your fatigue</strong> — You've tried everything and nothing's worked. You want answers, not guesses.</p>
            </div>
            <div className="cea-who-item">
              <span className="cea-who-icon">📊</span>
              <p className="cea-who-text"><strong>Love seeing the numbers</strong> — You're the type who wants to track everything. Labs give you clarity.</p>
            </div>
            <div className="cea-who-item">
              <span className="cea-who-icon">🧪</span>
              <p className="cea-who-text"><strong>Haven't had these specific markers tested</strong> — Most standard panels don't include IGF-1, homocysteine, or fasting insulin.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* What's Included */}
      <section className="cea-section cea-section-alt">
        <div className="cea-container">
          <p className="cea-section-kicker">What You Get</p>
          <h2 className="cea-section-title">Everything Included</h2>
          <p className="cea-section-subtitle">
            A complete diagnostic that tells you exactly what's going on at the cellular level.
          </p>
          
          <div className="cea-included-grid">
            <div className="cea-included-card">
              <div className="cea-included-number">1</div>
              <h3 className="cea-included-title">Cellular Energy Lab Panel</h3>
              <p className="cea-included-desc">12 targeted biomarkers that reveal inflammation, oxygen utilization, growth factors, and metabolic efficiency. Not your typical annual labs.</p>
            </div>
            <div className="cea-included-card">
              <div className="cea-included-number">2</div>
              <h3 className="cea-included-title">Energy & Symptom Questionnaire</h3>
              <p className="cea-included-desc">A comprehensive intake that captures your energy patterns, sleep quality, recovery speed, and daily symptoms.</p>
            </div>
            <div className="cea-included-card">
              <div className="cea-included-number">3</div>
              <h3 className="cea-included-title">1:1 Provider Review</h3>
              <p className="cea-included-desc">Sit down with a provider to review your results, understand what's happening, and discuss what it means for you specifically.</p>
            </div>
            <div className="cea-included-card">
              <div className="cea-included-number">4</div>
              <h3 className="cea-included-title">Written Plan</h3>
              <p className="cea-included-desc">Leave with a clear, personalized plan—whether that's the 6-Week Reset, lifestyle changes, or both.</p>
            </div>
            <div className="cea-included-card">
              <div className="cea-included-number">5</div>
              <h3 className="cea-included-title">Experience Session (Optional)</h3>
              <p className="cea-included-desc">Try a red light therapy OR hyperbaric oxygen session same day so you can feel what the therapies are like.</p>
            </div>
            <div className="cea-included-card">
              <div className="cea-included-number">✓</div>
              <h3 className="cea-included-title">Full Credit Toward Reset</h3>
              <p className="cea-included-desc">If you start the 6-Week Reset within 7 days of your results visit, your entire $497 applies toward the program.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Lab Panel */}
      <section className="cea-section">
        <div className="cea-container">
          <p className="cea-section-kicker">The Data</p>
          <h2 className="cea-section-title">What We Test</h2>
          <p className="cea-section-subtitle">
            12 biomarkers that tell the story of your cellular energy production.
          </p>
          
          <div className="cea-lab-section">
            <div className="cea-lab-header">
              <h3 className="cea-lab-title">Cellular Energy Lab Panel</h3>
              <p className="cea-lab-subtitle">Markers most doctors don't run</p>
            </div>
            
            <div className="cea-lab-grid">
              <div className="cea-lab-category">
                <h4>Inflammation</h4>
                <ul>
                  <li>CRP-HS (high-sensitivity)</li>
                  <li>Homocysteine</li>
                </ul>
              </div>
              <div className="cea-lab-category">
                <h4>Oxygen & Iron</h4>
                <ul>
                  <li>CBC with differential</li>
                  <li>Ferritin</li>
                  <li>Iron / TIBC</li>
                </ul>
              </div>
              <div className="cea-lab-category">
                <h4>Growth Factors</h4>
                <ul>
                  <li>IGF-1</li>
                  <li>DHEA-S</li>
                </ul>
              </div>
              <div className="cea-lab-category">
                <h4>Metabolism</h4>
                <ul>
                  <li>Fasting Insulin</li>
                  <li>HgbA1c</li>
                  <li>Free T3 / TSH</li>
                  <li>Vitamin D 25-OH</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="cea-section cea-section-alt">
        <div className="cea-container">
          <p className="cea-section-kicker">The Process</p>
          <h2 className="cea-section-title">How It Works</h2>
          
          <div className="cea-steps">
            <div className="cea-step">
              <div className="cea-step-number">1</div>
              <div className="cea-step-content">
                <h4>Book Your Assessment</h4>
                <p>Text us or call to schedule. We'll send you the questionnaire to complete before your visit.</p>
              </div>
            </div>
            <div className="cea-step">
              <div className="cea-step-number">2</div>
              <div className="cea-step-content">
                <h4>Lab Draw (Visit 1)</h4>
                <p>Come in fasting for your blood draw. Takes about 15 minutes. Optional: do an experience session same day.</p>
              </div>
            </div>
            <div className="cea-step">
              <div className="cea-step-number">3</div>
              <div className="cea-step-content">
                <h4>Results Review (Visit 2)</h4>
                <p>About 5-7 days later, meet with your provider to review results and get your written plan.</p>
              </div>
            </div>
            <div className="cea-step">
              <div className="cea-step-number">4</div>
              <div className="cea-step-content">
                <h4>Decide Your Next Step</h4>
                <p>If the 6-Week Reset is right for you, your $497 is credited. If not, you still have your data and plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Credit Toward Reset */}
      <section className="cea-section">
        <div className="cea-container">
          <div className="cea-credit-box">
            <div className="cea-credit-icon">💰</div>
            <h3 className="cea-credit-title">100% Credits Toward the 6-Week Reset</h3>
            <p className="cea-credit-text">
              If you decide to move forward with the full <strong>6-Week Cellular Energy Reset</strong> within 7 days of your results visit, your entire <strong>$497</strong> applies toward the $3,997 program price. You're not paying twice—you're just getting the data first.
            </p>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="cea-section cea-section-alt">
        <div className="cea-container">
          <p className="cea-section-kicker">Investment</p>
          <h2 className="cea-section-title">Assessment Pricing</h2>
          
          <div className="cea-pricing-box">
            <h3 className="cea-pricing-title">Cellular Energy Assessment</h3>
            <p className="cea-pricing-subtitle">Complete diagnostic package</p>
            
            <div className="cea-pricing-price">$497</div>
            <div className="cea-pricing-credit">→ 100% credits toward 6-Week Reset</div>
            
            <div className="cea-pricing-includes">
              <ul>
                <li>Cellular Energy Lab Panel (12 biomarkers)</li>
                <li>Energy & symptom questionnaire</li>
                <li>1:1 provider review of results</li>
                <li>Written personalized plan</li>
                <li>Optional experience session (RLT or HBOT)</li>
              </ul>
            </div>
            
            <div className="cea-pricing-cta">
              <a href="sms:+19499973988?body=Hi, I'd like to book a Cellular Energy Assessment." className="cea-btn-primary">Book Your Assessment →</a>
            </div>
            
            <p className="cea-pricing-note">Questions? Call (949) 997-3988</p>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="cea-section">
        <div className="cea-container">
          <p className="cea-section-kicker">Questions</p>
          <h2 className="cea-section-title">FAQ</h2>
          
          <div className="cea-faq-list">
            <div className="cea-faq-item">
              <h3 className="cea-faq-question">Do I need to fast for the blood draw?</h3>
              <p className="cea-faq-answer">Yes, please fast for 10-12 hours before your lab draw. Water and black coffee are fine. We recommend scheduling a morning appointment.</p>
            </div>
            <div className="cea-faq-item">
              <h3 className="cea-faq-question">How long until I get my results?</h3>
              <p className="cea-faq-answer">Most results are back within 5-7 business days. We'll contact you to schedule your results review visit as soon as they're in.</p>
            </div>
            <div className="cea-faq-item">
              <h3 className="cea-faq-question">What if I already know I want the 6-Week Reset?</h3>
              <p className="cea-faq-answer">Great! You can skip the Assessment and go straight to the Reset. The Assessment is designed for people who want to see their data before committing to the full program.</p>
            </div>
            <div className="cea-faq-item">
              <h3 className="cea-faq-question">What's the experience session?</h3>
              <p className="cea-faq-answer">After your lab draw, you can do either a 20-minute red light therapy session or a 60-minute hyperbaric oxygen session—your choice. It's included in the $497 and lets you feel what the therapies are like.</p>
            </div>
            <div className="cea-faq-item">
              <h3 className="cea-faq-question">What if I decide not to do the Reset?</h3>
              <p className="cea-faq-answer">No problem. You still get your lab results, provider review, and written plan—all valuable regardless of what you decide next. There's no obligation to continue.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Link to Full Reset */}
      <section className="cea-section cea-section-alt">
        <div className="cea-container">
          <div className="cea-reset-link">
            <h3>Already Know You Want the Full Protocol?</h3>
            <p>Skip the Assessment and go straight to the 6-Week Cellular Energy Reset.</p>
            <a href="/cellular-energy-reset" className="cea-btn-white">See the 6-Week Reset →</a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="cea-footer">
        <p className="cea-footer-text">© 2026 Range Medical. All rights reserved.</p>
        <p className="cea-footer-links">
          <a href="https://range-medical.com">range-medical.com</a> • 
          <a href="tel:+19499973988">(949) 997-3988</a>
        </p>
      </footer>
    </div>
  );
};

export default CellularEnergyAssessment;
