import React from 'react';

const CellularEnergyMaintenance = () => {
  const styles = `
    .cem-page {
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
    }
    
    .cem-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Header */
    .cem-header {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e5e5;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .cem-header-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .cem-logo {
      height: 40px;
      width: auto;
    }
    
    .cem-header-cta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .cem-header-phone {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cem-header-phone a {
      color: #000000;
      font-weight: 600;
      text-decoration: none;
    }
    
    .cem-btn-small {
      background: #7c3aed;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    
    .cem-btn-small:hover {
      background: #6d28d9;
    }
    
    /* Hero */
    .cem-hero {
      padding: 4rem 1.5rem 3rem;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border-bottom: 2px solid #7c3aed;
    }
    
    .cem-hero-inner {
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cem-hero-badge {
      display: inline-block;
      background: #7c3aed;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    
    .cem-hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
    }
    
    .cem-hero-subtitle {
      font-size: 1.125rem;
      color: #525252;
      line-height: 1.7;
      margin-bottom: 2rem;
      max-width: 550px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cem-hero-price-box {
      background: #ffffff;
      border: 2px solid #7c3aed;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    
    .cem-hero-price {
      font-size: 2.5rem;
      font-weight: 700;
      color: #7c3aed;
    }
    
    .cem-hero-price span {
      font-size: 1.25rem;
      font-weight: 500;
      color: #525252;
    }
    
    .cem-hero-compare {
      font-size: 0.9375rem;
      color: #6d28d9;
      margin-top: 0.25rem;
    }
    
    .cem-btn-primary {
      display: inline-block;
      background: #7c3aed;
      color: #ffffff;
      padding: 1rem 2.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.0625rem;
      transition: all 0.2s;
    }
    
    .cem-btn-primary:hover {
      background: #6d28d9;
      transform: translateY(-1px);
    }
    
    /* Section */
    .cem-section {
      padding: 4rem 1.5rem;
    }
    
    .cem-section-alt {
      background: #fafafa;
    }
    
    .cem-section-kicker {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #7c3aed;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .cem-section-title {
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    
    .cem-section-subtitle {
      font-size: 1.0625rem;
      color: #525252;
      text-align: center;
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.7;
    }
    
    /* For Reset Graduates */
    .cem-graduate-box {
      background: #f5f3ff;
      border: 2px solid #7c3aed;
      border-radius: 16px;
      padding: 2rem;
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cem-graduate-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .cem-graduate-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cem-graduate-text {
      font-size: 1rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* The Problem */
    .cem-problem-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cem-problem-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cem-problem-card {
      background: #fef2f2;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    
    .cem-problem-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    
    .cem-problem-text {
      font-size: 0.9375rem;
      color: #991b1b;
      font-weight: 500;
    }
    
    /* What's Included */
    .cem-included-list {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cem-included-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid #e5e5e5;
      align-items: flex-start;
    }
    
    .cem-included-item:last-child {
      border-bottom: none;
    }
    
    .cem-included-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: #7c3aed;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }
    
    .cem-included-content h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cem-included-content p {
      font-size: 0.9375rem;
      color: #525252;
      margin: 0;
    }
    
    /* Comparison */
    .cem-comparison {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cem-comparison-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .cem-comparison-table th {
      text-align: left;
      padding: 1rem;
      background: #7c3aed;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 700;
    }
    
    .cem-comparison-table th:last-child {
      text-align: right;
    }
    
    .cem-comparison-table td {
      padding: 1rem;
      border-bottom: 1px solid #e5e5e5;
      font-size: 0.9375rem;
    }
    
    .cem-comparison-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    
    .cem-comparison-table .total-row td {
      background: #fafafa;
      font-weight: 700;
      border-bottom: none;
    }
    
    .cem-comparison-table .membership-row td {
      background: #f5f3ff;
      font-weight: 700;
      color: #7c3aed;
      font-size: 1rem;
    }
    
    .cem-comparison-table .savings-row td {
      background: #f0fdf4;
      font-weight: 700;
      color: #22c55e;
    }
    
    /* Schedule */
    .cem-schedule-box {
      background: #ffffff;
      border: 2px solid #e5e5e5;
      border-radius: 16px;
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cem-schedule-title {
      font-size: 1.125rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .cem-schedule-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      text-align: center;
    }
    
    .cem-schedule-week {
      background: #fafafa;
      border-radius: 8px;
      padding: 1rem 0.5rem;
    }
    
    .cem-schedule-week.active {
      background: #7c3aed;
      color: #ffffff;
    }
    
    .cem-schedule-week-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
      margin-bottom: 0.25rem;
    }
    
    .cem-schedule-week-sessions {
      font-size: 0.8125rem;
      font-weight: 600;
    }
    
    .cem-schedule-note {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #525252;
    }
    
    /* Pricing */
    .cem-pricing-box {
      background: #ffffff;
      border: 3px solid #7c3aed;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cem-pricing-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .cem-pricing-subtitle {
      font-size: 0.9375rem;
      color: #525252;
      margin-bottom: 1.5rem;
    }
    
    .cem-pricing-price {
      font-size: 3rem;
      font-weight: 700;
      color: #7c3aed;
      margin-bottom: 0.25rem;
    }
    
    .cem-pricing-price span {
      font-size: 1.25rem;
      font-weight: 500;
      color: #525252;
    }
    
    .cem-pricing-compare {
      font-size: 0.9375rem;
      color: #22c55e;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    
    .cem-pricing-includes {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    
    .cem-pricing-includes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cem-pricing-includes li {
      font-size: 0.9375rem;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .cem-pricing-includes li:last-child {
      border-bottom: none;
    }
    
    .cem-pricing-includes li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #7c3aed;
      font-weight: 700;
    }
    
    .cem-pricing-cta {
      margin-bottom: 1rem;
    }
    
    .cem-pricing-cta .cem-btn-primary {
      width: 100%;
    }
    
    .cem-pricing-note {
      font-size: 0.8125rem;
      color: #737373;
    }
    
    /* FAQ */
    .cem-faq-list {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .cem-faq-item {
      border-bottom: 1px solid #e5e5e5;
      padding: 1.25rem 0;
    }
    
    .cem-faq-item:last-child {
      border-bottom: none;
    }
    
    .cem-faq-question {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .cem-faq-answer {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* Not a Member Yet */
    .cem-cta-box {
      background: #000000;
      color: #ffffff;
      padding: 2.5rem;
      border-radius: 16px;
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cem-cta-box h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cem-cta-box p {
      font-size: 1rem;
      color: #a3a3a3;
      margin-bottom: 1.5rem;
    }
    
    .cem-btn-white {
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
    
    .cem-btn-white:hover {
      background: #f5f5f5;
    }
    
    /* Footer */
    .cem-footer {
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    
    .cem-footer-text {
      font-size: 0.875rem;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cem-footer-links a {
      color: #525252;
      text-decoration: none;
      font-size: 0.875rem;
    }
    
    .cem-footer-links a:hover {
      text-decoration: underline;
    }
    
    /* Mobile */
    @media (max-width: 768px) {
      .cem-hero-title {
        font-size: 2rem;
      }
      
      .cem-header-phone {
        display: none;
      }
      
      .cem-hero-price {
        font-size: 2rem;
      }
      
      .cem-pricing-price {
        font-size: 2.5rem;
      }
      
      .cem-schedule-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  return (
    <div className="cem-page">
      <style>{styles}</style>
      
      {/* Header */}
      <header className="cem-header">
        <div className="cem-header-inner">
          <a href="https://range-medical.com">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="cem-logo"
            />
          </a>
          <div className="cem-header-cta">
            <span className="cem-header-phone">Questions? <a href="tel:+19499973988">(949) 997-3988</a></span>
            <a href="sms:+19499973988?body=Hi, I'm interested in the Cellular Energy Maintenance membership." className="cem-btn-small">Join Now</a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="cem-hero">
        <div className="cem-hero-inner">
          <div className="cem-hero-badge">For Reset Graduates</div>
          <h1 className="cem-hero-title">Cellular Energy Maintenance</h1>
          <p className="cem-hero-subtitle">
            You built something in 6 weeks. Don't lose it. Stay optimized with ongoing HBOT + Red Light at a fraction of the cost.
          </p>
          <div className="cem-hero-price-box">
            <div className="cem-hero-price">$597 <span>/ 4 weeks</span></div>
            <div className="cem-hero-compare">À la carte value: $1,080+</div>
          </div>
          <div>
            <a href="sms:+19499973988?body=Hi, I'm interested in the Cellular Energy Maintenance membership." className="cem-btn-primary">Start Maintenance →</a>
          </div>
        </div>
      </section>
      
      {/* For Reset Graduates */}
      <section className="cem-section">
        <div className="cem-container">
          <div className="cem-graduate-box">
            <div className="cem-graduate-icon">🎓</div>
            <h3 className="cem-graduate-title">Exclusively for 6-Week Reset Graduates</h3>
            <p className="cem-graduate-text">
              The Maintenance membership is designed for people who have completed the 6-Week Cellular Energy Reset. You've already built the foundation—this keeps you there.
            </p>
          </div>
        </div>
      </section>
      
      {/* The Problem */}
      <section className="cem-section cem-section-alt">
        <div className="cem-container">
          <p className="cem-section-kicker">The Challenge</p>
          <h2 className="cem-section-title">Why Results Fade Without Maintenance</h2>
          <p className="cem-section-subtitle">
            Your 6-week transformation was real. But cellular gains need ongoing support.
          </p>
          
          <div className="cem-problem-grid">
            <div className="cem-problem-card">
              <div className="cem-problem-icon">📉</div>
              <p className="cem-problem-text">Mitochondrial function declines without continued stimulation</p>
            </div>
            <div className="cem-problem-card">
              <div className="cem-problem-icon">🔥</div>
              <p className="cem-problem-text">Inflammation creeps back in over time</p>
            </div>
            <div className="cem-problem-card">
              <div className="cem-problem-icon">😴</div>
              <p className="cem-problem-text">Energy and recovery gradually return to baseline</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* What's Included */}
      <section className="cem-section">
        <div className="cem-container">
          <p className="cem-section-kicker">Every 4 Weeks</p>
          <h2 className="cem-section-title">What's Included</h2>
          <p className="cem-section-subtitle">
            Consistent maintenance sessions plus ongoing support to stay optimized.
          </p>
          
          <div className="cem-included-list">
            <div className="cem-included-item">
              <div className="cem-included-icon">4</div>
              <div className="cem-included-content">
                <h4>4 Hyperbaric Oxygen Sessions</h4>
                <p>60 minutes each. Keep oxygen saturation high and stem cells mobilized.</p>
              </div>
            </div>
            <div className="cem-included-item">
              <div className="cem-included-icon">4</div>
              <div className="cem-included-content">
                <h4>4 Red Light Therapy Sessions</h4>
                <p>20 minutes each. Continue stimulating mitochondrial ATP production.</p>
              </div>
            </div>
            <div className="cem-included-item">
              <div className="cem-included-icon">Q</div>
              <div className="cem-included-content">
                <h4>Quarterly Check-In</h4>
                <p>10-15 minute provider check-in every 3 months to track progress and adjust as needed.</p>
              </div>
            </div>
            <div className="cem-included-item">
              <div className="cem-included-icon">🧬</div>
              <div className="cem-included-content">
                <h4>Annual Lab Panel</h4>
                <p>Your Cellular Energy Lab Panel once a year at a preferred member rate to track long-term changes.</p>
              </div>
            </div>
            <div className="cem-included-item">
              <div className="cem-included-icon">⭐</div>
              <div className="cem-included-content">
                <h4>Priority Scheduling</h4>
                <p>Members get first access to appointment slots. Schedule your sessions weeks in advance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Comparison */}
      <section className="cem-section cem-section-alt">
        <div className="cem-container">
          <p className="cem-section-kicker">The Math</p>
          <h2 className="cem-section-title">Membership vs. À La Carte</h2>
          <p className="cem-section-subtitle">
            The membership saves you nearly 50% compared to booking sessions individually.
          </p>
          
          <div className="cem-comparison">
            <table className="cem-comparison-table">
              <thead>
                <tr>
                  <th>Every 4 Weeks</th>
                  <th>À La Carte</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4 HBOT Sessions ($185 each)</td>
                  <td>$740</td>
                </tr>
                <tr>
                  <td>4 Red Light Sessions ($85 each)</td>
                  <td>$340</td>
                </tr>
                <tr className="total-row">
                  <td>Total À La Carte</td>
                  <td>$1,080</td>
                </tr>
                <tr className="membership-row">
                  <td>Maintenance Membership</td>
                  <td>$597</td>
                </tr>
                <tr className="savings-row">
                  <td>You Save</td>
                  <td>$483 (45%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {/* Schedule */}
      <section className="cem-section">
        <div className="cem-container">
          <p className="cem-section-kicker">Your Rhythm</p>
          <h2 className="cem-section-title">A Sustainable Schedule</h2>
          <p className="cem-section-subtitle">
            One session per week instead of three. Fits your life while maintaining results.
          </p>
          
          <div className="cem-schedule-box">
            <h3 className="cem-schedule-title">Sample 4-Week Cycle</h3>
            <div className="cem-schedule-grid">
              <div className="cem-schedule-week active">
                <div className="cem-schedule-week-label">Week 1</div>
                <div className="cem-schedule-week-sessions">HBOT + RLT</div>
              </div>
              <div className="cem-schedule-week active">
                <div className="cem-schedule-week-label">Week 2</div>
                <div className="cem-schedule-week-sessions">HBOT + RLT</div>
              </div>
              <div className="cem-schedule-week active">
                <div className="cem-schedule-week-label">Week 3</div>
                <div className="cem-schedule-week-sessions">HBOT + RLT</div>
              </div>
              <div className="cem-schedule-week active">
                <div className="cem-schedule-week-label">Week 4</div>
                <div className="cem-schedule-week-sessions">HBOT + RLT</div>
              </div>
            </div>
            <p className="cem-schedule-note">
              ~90 minutes per week, once a week. Same day HBOT + Red Light back-to-back.
            </p>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="cem-section cem-section-alt">
        <div className="cem-container">
          <p className="cem-section-kicker">Investment</p>
          <h2 className="cem-section-title">Membership Pricing</h2>
          
          <div className="cem-pricing-box">
            <h3 className="cem-pricing-title">Cellular Energy Maintenance</h3>
            <p className="cem-pricing-subtitle">Ongoing optimization</p>
            
            <div className="cem-pricing-price">$597 <span>/ 4 weeks</span></div>
            <div className="cem-pricing-compare">Save $483 vs. à la carte (45% off)</div>
            
            <div className="cem-pricing-includes">
              <ul>
                <li>4 Hyperbaric Oxygen sessions (60 min each)</li>
                <li>4 Red Light Therapy sessions (20 min each)</li>
                <li>Quarterly provider check-in</li>
                <li>Annual Cellular Energy Lab Panel at preferred rate</li>
                <li>Priority scheduling</li>
              </ul>
            </div>
            
            <div className="cem-pricing-cta">
              <a href="sms:+19499973988?body=Hi, I'm interested in the Cellular Energy Maintenance membership." className="cem-btn-primary">Start Maintenance →</a>
            </div>
            
            <p className="cem-pricing-note">Cancel anytime. No long-term contracts.</p>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="cem-section">
        <div className="cem-container">
          <p className="cem-section-kicker">Questions</p>
          <h2 className="cem-section-title">FAQ</h2>
          
          <div className="cem-faq-list">
            <div className="cem-faq-item">
              <h3 className="cem-faq-question">Do I have to complete the 6-Week Reset first?</h3>
              <p className="cem-faq-answer">Yes, the Maintenance membership is designed for people who have completed the 6-Week Cellular Energy Reset. The Reset builds the foundation; Maintenance keeps you there.</p>
            </div>
            <div className="cem-faq-item">
              <h3 className="cem-faq-question">Can I pause or cancel my membership?</h3>
              <p className="cem-faq-answer">Yes, you can pause or cancel anytime. We just ask for notice before your next billing cycle. No long-term contracts, no cancellation fees.</p>
            </div>
            <div className="cem-faq-item">
              <h3 className="cem-faq-question">What if I want to do more sessions?</h3>
              <p className="cem-faq-answer">Members can add additional sessions at a discounted rate. Talk to us about upgrading your membership or adding sessions as needed.</p>
            </div>
            <div className="cem-faq-item">
              <h3 className="cem-faq-question">Do unused sessions roll over?</h3>
              <p className="cem-faq-answer">Sessions don't roll over to the next cycle. We encourage you to schedule all 4 sessions for each 4-week period. Consistency is what maintains your results.</p>
            </div>
            <div className="cem-faq-item">
              <h3 className="cem-faq-question">What if I take a break and want to restart?</h3>
              <p className="cem-faq-answer">You can rejoin anytime. If it's been more than 3 months, we may recommend a "booster" protocol to get you back to baseline before resuming maintenance.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Not a Member Yet */}
      <section className="cem-section cem-section-alt">
        <div className="cem-container">
          <div className="cem-cta-box">
            <h3>Haven't Done the 6-Week Reset Yet?</h3>
            <p>Start with the full protocol to build your cellular energy foundation, then transition to Maintenance.</p>
            <a href="/cellular-energy-reset" className="cem-btn-white">See the 6-Week Reset →</a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="cem-footer">
        <p className="cem-footer-text">© 2026 Range Medical. All rights reserved.</p>
        <p className="cem-footer-links">
          <a href="https://range-medical.com">range-medical.com</a> • 
          <a href="tel:+19499973988">(949) 997-3988</a>
        </p>
      </footer>
    </div>
  );
};

export default CellularEnergyMaintenance;
