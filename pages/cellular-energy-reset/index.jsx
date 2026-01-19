import React from 'react';

const CellularEnergyResetLanding = () => {
  const styles = `
    .cer-page {
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
    }
    
    .cer-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Header */
    .cer-header {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e5e5;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .cer-header-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .cer-logo {
      height: 40px;
      width: auto;
    }
    
    .cer-header-cta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .cer-header-phone {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cer-header-phone a {
      color: #000000;
      font-weight: 600;
      text-decoration: none;
    }
    
    .cer-btn-small {
      background: #000000;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    
    .cer-btn-small:hover {
      background: #262626;
    }
    
    /* Hero Section */
    .cer-hero {
      padding: 5rem 1.5rem;
      background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
      border-bottom: 2px solid #000000;
    }
    
    .cer-hero-inner {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cer-hero-badge {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    
    .cer-hero-title {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.5rem;
    }
    
    .cer-hero-title span {
      display: block;
      color: #525252;
      font-weight: 500;
    }
    
    .cer-hero-subtitle {
      font-size: 1.25rem;
      color: #525252;
      line-height: 1.7;
      margin-bottom: 2.5rem;
      max-width: 650px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cer-hero-cta {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .cer-btn-primary {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cer-btn-primary:hover {
      background: #262626;
      transform: translateY(-1px);
    }
    
    .cer-btn-outline {
      display: inline-block;
      background: transparent;
      color: #000000;
      padding: 1rem 2rem;
      border-radius: 8px;
      border: 2px solid #000000;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .cer-btn-outline:hover {
      background: #000000;
      color: #ffffff;
    }
    
    /* Trust Bar */
    .cer-trust-bar {
      background: #000000;
      color: #ffffff;
      padding: 1.25rem 1.5rem;
    }
    
    .cer-trust-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      gap: 3rem;
      flex-wrap: wrap;
    }
    
    .cer-trust-item {
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* Section Styling */
    .cer-section {
      padding: 5rem 1.5rem;
    }
    
    .cer-section-alt {
      background: #fafafa;
    }
    
    .cer-section-dark {
      background: #000000;
      color: #ffffff;
    }
    
    .cer-section-kicker {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #737373;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .cer-section-dark .cer-section-kicker {
      color: #a3a3a3;
    }
    
    .cer-section-title {
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    
    .cer-section-subtitle {
      font-size: 1.125rem;
      color: #525252;
      text-align: center;
      max-width: 650px;
      margin: 0 auto 3rem;
      line-height: 1.7;
    }
    
    .cer-section-dark .cer-section-subtitle {
      color: #a3a3a3;
    }
    
    /* Who Is This For */
    .cer-persona-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .cer-persona-card {
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-persona-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .cer-persona-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cer-persona-desc {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
    }
    
    /* The Problem */
    .cer-problem-list {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-problem-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .cer-problem-item:last-child {
      border-bottom: none;
    }
    
    .cer-problem-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    
    .cer-problem-text {
      font-size: 1.0625rem;
      color: #1a1a1a;
    }
    
    /* What's Included */
    .cer-included-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-included-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-included-card {
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-included-number {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      text-align: center;
      line-height: 32px;
      font-weight: 700;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .cer-included-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-included-detail {
      font-size: 0.9375rem;
      color: #525252;
      margin-bottom: 1rem;
    }
    
    .cer-included-features {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-included-features li {
      font-size: 0.9375rem;
      color: #525252;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
    }
    
    .cer-included-features li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #000000;
      font-weight: 700;
    }
    
    /* How It Works - FIXED TIMELINE */
    .cer-timeline {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .cer-timeline-item {
      display: flex;
      gap: 2rem;
      padding: 2rem 0;
      border-bottom: 1px solid #333333;
      align-items: flex-start;
    }
    
    .cer-timeline-item:last-child {
      border-bottom: none;
    }
    
    .cer-timeline-week {
      flex-shrink: 0;
      width: 90px;
    }
    
    .cer-timeline-badge {
      background: #ffffff;
      color: #000000;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
      display: inline-block;
      text-align: center;
    }
    
    .cer-timeline-content h4 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      margin-top: 0;
    }
    
    .cer-timeline-content p {
      font-size: 0.9375rem;
      color: #a3a3a3;
      line-height: 1.6;
      margin: 0;
    }
    
    /* Science Section */
    .cer-science-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-science-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-science-card {
      background: #fafafa;
      border-radius: 12px;
      padding: 2rem;
    }
    
    .cer-science-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .cer-science-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cer-science-desc {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .cer-science-benefits {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-science-benefits li {
      font-size: 0.875rem;
      color: #737373;
      padding: 0.25rem 0;
      padding-left: 1.25rem;
      position: relative;
    }
    
    .cer-science-benefits li::before {
      content: "→";
      position: absolute;
      left: 0;
    }
    
    /* Lab Tracking */
    .cer-lab-section {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 16px;
      padding: 3rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .cer-lab-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .cer-lab-badge {
      display: inline-block;
      background: #22c55e;
      color: #ffffff;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-lab-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-lab-subtitle {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-lab-markers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .cer-marker-category {
      background: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
    }
    
    .cer-marker-category h4 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #22c55e;
      margin-bottom: 0.75rem;
    }
    
    .cer-marker-category ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-marker-category li {
      font-size: 0.875rem;
      color: #1a1a1a;
      padding: 0.25rem 0;
    }
    
    /* Weekly Checkins */
    .cer-checkin-features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .cer-checkin-features {
        grid-template-columns: 1fr;
      }
    }
    
    .cer-checkin-feature {
      text-align: center;
      padding: 1.5rem;
    }
    
    .cer-checkin-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .cer-checkin-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-checkin-desc {
      font-size: 0.875rem;
      color: #525252;
    }
    
    /* Pricing Section */
    .cer-pricing-card {
      background: #ffffff;
      border: 3px solid #000000;
      border-radius: 16px;
      padding: 3rem;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    
    .cer-pricing-header {
      margin-bottom: 2rem;
    }
    
    .cer-pricing-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-pricing-duration {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-pricing-price {
      margin-bottom: 1.5rem;
    }
    
    .cer-price-amount {
      font-size: 3.5rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    
    .cer-price-note {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cer-pricing-value {
      background: #fafafa;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    
    .cer-value-comparison {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .cer-value-label {
      font-size: 0.9375rem;
      color: #525252;
    }
    
    .cer-value-original {
      font-size: 1rem;
      color: #737373;
      text-decoration: line-through;
    }
    
    .cer-value-savings {
      font-size: 1rem;
      font-weight: 700;
      color: #22c55e;
      text-align: right;
    }
    
    .cer-pricing-includes {
      text-align: left;
      margin-bottom: 2rem;
    }
    
    .cer-pricing-includes h4 {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    
    .cer-pricing-includes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .cer-pricing-includes li {
      font-size: 0.9375rem;
      padding: 0.5rem 0;
      padding-left: 1.75rem;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .cer-pricing-includes li:last-child {
      border-bottom: none;
    }
    
    .cer-pricing-includes li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #22c55e;
      font-weight: 700;
    }
    
    .cer-pricing-cta {
      margin-bottom: 1rem;
    }
    
    .cer-pricing-cta .cer-btn-primary {
      width: 100%;
      padding: 1.125rem 2rem;
      font-size: 1.0625rem;
    }
    
    .cer-pricing-guarantee {
      font-size: 0.875rem;
      color: #737373;
    }
    
    /* FAQ */
    .cer-faq-list {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .cer-faq-item {
      border-bottom: 1px solid #e5e5e5;
      padding: 1.5rem 0;
    }
    
    .cer-faq-item:last-child {
      border-bottom: none;
    }
    
    .cer-faq-question {
      font-size: 1.0625rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    
    .cer-faq-answer {
      font-size: 0.9375rem;
      color: #525252;
      line-height: 1.7;
    }
    
    /* Final CTA */
    .cer-final-cta {
      text-align: center;
    }
    
    .cer-final-cta .cer-section-title {
      margin-bottom: 1.5rem;
    }
    
    .cer-cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    
    .cer-cta-phone {
      font-size: 1rem;
      color: #525252;
    }
    
    .cer-cta-phone a {
      color: #000000;
      font-weight: 600;
    }
    
    /* Footer */
    .cer-footer {
      background: #fafafa;
      border-top: 1px solid #e5e5e5;
      padding: 2rem 1.5rem;
      text-align: center;
    }
    
    .cer-footer-text {
      font-size: 0.875rem;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cer-footer-links {
      font-size: 0.875rem;
    }
    
    .cer-footer-links a {
      color: #525252;
      text-decoration: none;
    }
    
    .cer-footer-links a:hover {
      text-decoration: underline;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .cer-hero-title {
        font-size: 2.25rem;
      }
      
      .cer-section-title {
        font-size: 1.75rem;
      }
      
      .cer-header-phone {
        display: none;
      }
      
      .cer-trust-inner {
        gap: 1.5rem;
      }
      
      .cer-timeline-item {
        flex-direction: column;
        gap: 1rem;
      }
      
      .cer-timeline-week {
        width: auto;
      }
      
      .cer-price-amount {
        font-size: 2.75rem;
      }
    }
  `;

  return (
    <div className="cer-page">
      <style>{styles}</style>
      
      {/* Header */}
      <header className="cer-header">
        <div className="cer-header-inner">
          <a href="https://range-medical.com">
            <img 
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
              alt="Range Medical" 
              className="cer-logo"
            />
          </a>
          <div className="cer-header-cta">
            <span className="cer-header-phone">Questions? <a href="tel:+19499973988">(949) 997-3988</a></span>
            <a href="sms:+19499973988?body=Hi, I'm interested in the 6-Week Cellular Energy Reset program." className="cer-btn-small">Get Started</a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="cer-hero">
        <div className="cer-hero-inner">
          <div className="cer-hero-badge">Lab-Tracked Protocol</div>
          <h1 className="cer-hero-title">
            6-Week Cellular Energy Reset
            <span>Restore your energy at the cellular level</span>
          </h1>
          <p className="cer-hero-subtitle">
            Combine the power of red light therapy and hyperbaric oxygen to optimize mitochondrial function, reduce inflammation, and restore your body's natural energy production—with lab work to prove it.
          </p>
          <div className="cer-hero-cta">
            <a href="sms:+19499973988?body=Hi, I'm interested in the 6-Week Cellular Energy Reset program." className="cer-btn-primary">Start Your Reset →</a>
            <a href="#how-it-works" className="cer-btn-outline">See How It Works</a>
          </div>
        </div>
      </section>
      
      {/* Trust Bar */}
      <div className="cer-trust-bar">
        <div className="cer-trust-inner">
          <div className="cer-trust-item">📍 Newport Beach, CA</div>
          <div className="cer-trust-item">🔬 Lab-Tracked Results</div>
          <div className="cer-trust-item">⏱️ 36 Sessions Over 6 Weeks</div>
          <div className="cer-trust-item">📋 Weekly Check-Ins</div>
        </div>
      </div>
      
      {/* Who Is This For */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Is This You?</p>
          <h2 className="cer-section-title">Who This Program Is For</h2>
          <p className="cer-section-subtitle">
            This isn't a quick fix. It's a structured protocol for people ready to invest in real, measurable change.
          </p>
          
          <div className="cer-persona-grid">
            <div className="cer-persona-card">
              <div className="cer-persona-icon">⚡</div>
              <h3 className="cer-persona-title">The Exhausted High Performer</h3>
              <p className="cer-persona-desc">You're doing everything "right" but still feel drained. Coffee barely works anymore. You need energy that doesn't come from stimulants.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🔄</div>
              <h3 className="cer-persona-title">The Post-Illness Rebuilder</h3>
              <p className="cer-persona-desc">You recovered from COVID, mono, or another illness but never bounced back. Your body needs help resetting at the cellular level.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🏃</div>
              <h3 className="cer-persona-title">The Athlete Who Wants More</h3>
              <p className="cer-persona-desc">Recovery takes longer than it used to. You want to accelerate healing, reduce inflammation, and perform at a higher level.</p>
            </div>
            <div className="cer-persona-card">
              <div className="cer-persona-icon">🧬</div>
              <h3 className="cer-persona-title">The Longevity Optimizer</h3>
              <p className="cer-persona-desc">You're proactive about health and want to support mitochondrial function before problems start. Prevention over intervention.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* The Problem */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">The Problem</p>
          <h2 className="cer-section-title">Your Cells Aren't Making Enough Energy</h2>
          <p className="cer-section-subtitle">
            Chronic fatigue, slow recovery, and brain fog often come down to one thing: your mitochondria aren't functioning optimally.
          </p>
          
          <div className="cer-problem-list">
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Mitochondrial dysfunction</strong> — Your cellular powerhouses produce less ATP (energy) as stress, age, and inflammation take their toll</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Chronic low-grade inflammation</strong> — Silent inflammation damages tissues and diverts energy away from repair and recovery</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Oxygen delivery issues</strong> — Your cells may not be getting enough oxygen to produce energy efficiently</p>
            </div>
            <div className="cer-problem-item">
              <div className="cer-problem-icon">✕</div>
              <p className="cer-problem-text"><strong>Impaired cellular repair</strong> — Without adequate energy, your body can't heal, regenerate, or detoxify properly</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* What's Included */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">The Protocol</p>
          <h2 className="cer-section-title">What's Included</h2>
          <p className="cer-section-subtitle">
            A complete system designed to restore cellular energy over 6 weeks—not a one-time session.
          </p>
          
          <div className="cer-included-grid">
            <div className="cer-included-card">
              <div className="cer-included-number">1</div>
              <h3 className="cer-included-title">18 Red Light Therapy Sessions</h3>
              <p className="cer-included-detail">20 minutes each • 3x per week • Full-body LED bed</p>
              <ul className="cer-included-features">
                <li>Stimulates mitochondrial ATP production</li>
                <li>Reduces inflammation at the cellular level</li>
                <li>Supports collagen and tissue repair</li>
                <li>Customizable Nogier frequencies</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">2</div>
              <h3 className="cer-included-title">18 Hyperbaric Oxygen Sessions</h3>
              <p className="cer-included-detail">60 minutes each • 3x per week • Pressurized chamber</p>
              <ul className="cer-included-features">
                <li>Floods tissues with 10-15x normal oxygen</li>
                <li>Stimulates stem cell release</li>
                <li>Promotes new blood vessel formation</li>
                <li>Accelerates healing and recovery</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">3</div>
              <h3 className="cer-included-title">2 Cellular Energy Lab Panels</h3>
              <p className="cer-included-detail">Baseline + 6-week follow-up • 12 targeted biomarkers</p>
              <ul className="cer-included-features">
                <li>Inflammation markers (CRP-HS, Homocysteine)</li>
                <li>Oxygen utilization (CBC, Ferritin, Iron)</li>
                <li>Growth factors (IGF-1, DHEA-S)</li>
                <li>Metabolic efficiency (Insulin, HgbA1c, Thyroid)</li>
              </ul>
            </div>
            
            <div className="cer-included-card">
              <div className="cer-included-number">4</div>
              <h3 className="cer-included-title">6 Weekly Check-Ins</h3>
              <p className="cer-included-detail">Progress tracking • Symptom assessment • Protocol adjustments</p>
              <ul className="cer-included-features">
                <li>Energy level tracking (1-10 scale)</li>
                <li>Sleep quality assessment</li>
                <li>Recovery and soreness monitoring</li>
                <li>Provider support throughout</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works (Timeline) - FIXED */}
      <section id="how-it-works" className="cer-section cer-section-dark">
        <div className="cer-container">
          <p className="cer-section-kicker">Your Journey</p>
          <h2 className="cer-section-title">How The 6 Weeks Work</h2>
          <p className="cer-section-subtitle">
            A structured protocol with clear milestones so you know exactly what to expect.
          </p>
          
          <div className="cer-timeline">
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 0</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Baseline Assessment</h4>
                <p>Complete your Cellular Energy Lab Panel to establish baseline markers. Meet with your provider to review results and set goals. Get oriented to the red light bed and hyperbaric chamber.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 1-2</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Activation Phase</h4>
                <p>Your body begins responding to the increased oxygen and light exposure. Many people notice improved sleep and slight energy increases. Inflammation markers begin to shift. 6 red light + 6 HBOT sessions.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 3-4</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Adaptation Phase</h4>
                <p>Mitochondrial biogenesis accelerates—your cells are literally building more powerhouses. Energy levels typically show noticeable improvement. Recovery from workouts speeds up. 6 red light + 6 HBOT sessions.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 5-6</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Optimization Phase</h4>
                <p>Peak benefits achieved. Cumulative effects are fully realized. Final 6 red light + 6 HBOT sessions completed. Follow-up labs drawn to measure and document your improvements.</p>
              </div>
            </div>
            
            <div className="cer-timeline-item">
              <div className="cer-timeline-week">
                <span className="cer-timeline-badge">Week 7</span>
              </div>
              <div className="cer-timeline-content">
                <h4>Results Review</h4>
                <p>Meet with your provider to compare baseline and follow-up labs. Review your weekly tracking data. Discuss maintenance protocol options to preserve your gains.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* The Science */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">The Science</p>
          <h2 className="cer-section-title">Why This Combination Works</h2>
          <p className="cer-section-subtitle">
            Red light and hyperbaric oxygen work through different but complementary mechanisms—together, they amplify each other's effects.
          </p>
          
          <div className="cer-science-grid">
            <div className="cer-science-card">
              <div className="cer-science-icon">🔴</div>
              <h3 className="cer-science-title">Red Light Therapy (Photobiomodulation)</h3>
              <p className="cer-science-desc">Red and near-infrared light penetrates tissue and is absorbed by cytochrome c oxidase in your mitochondria, directly stimulating ATP production.</p>
              <ul className="cer-science-benefits">
                <li>Increases ATP synthesis by 40-50%</li>
                <li>Reduces oxidative stress</li>
                <li>Decreases inflammatory cytokines</li>
                <li>Enhances collagen production</li>
              </ul>
            </div>
            
            <div className="cer-science-card">
              <div className="cer-science-icon">💨</div>
              <h3 className="cer-science-title">Hyperbaric Oxygen Therapy</h3>
              <p className="cer-science-desc">Breathing pure oxygen under pressure dissolves 10-15x more oxygen into your blood plasma, reaching tissues that red blood cells can't access.</p>
              <ul className="cer-science-benefits">
                <li>Stimulates stem cell mobilization</li>
                <li>Promotes angiogenesis (new blood vessels)</li>
                <li>Reduces inflammation systemically</li>
                <li>Accelerates wound and tissue healing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Lab Tracking */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Measurable Results</p>
          <h2 className="cer-section-title">Lab-Tracked Progress</h2>
          <p className="cer-section-subtitle">
            This isn't guesswork. We measure specific biomarkers before and after so you can see exactly what changed.
          </p>
          
          <div className="cer-lab-section">
            <div className="cer-lab-header">
              <span className="cer-lab-badge">Cellular Energy Panel</span>
              <h3 className="cer-lab-title">12 Targeted Biomarkers</h3>
              <p className="cer-lab-subtitle">Drawn at baseline and week 6 to track your transformation</p>
            </div>
            
            <div className="cer-lab-markers">
              <div className="cer-marker-category">
                <h4>Inflammation</h4>
                <ul>
                  <li>CRP-HS</li>
                  <li>Homocysteine</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Oxygen & Iron</h4>
                <ul>
                  <li>CBC (complete)</li>
                  <li>Ferritin</li>
                  <li>Iron/TIBC</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Growth Factors</h4>
                <ul>
                  <li>IGF-1</li>
                  <li>DHEA-S</li>
                </ul>
              </div>
              <div className="cer-marker-category">
                <h4>Metabolism</h4>
                <ul>
                  <li>Fasting Insulin</li>
                  <li>HgbA1c</li>
                  <li>Free T3</li>
                  <li>TSH</li>
                  <li>Vitamin D</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Weekly Check-Ins */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">Accountability</p>
          <h2 className="cer-section-title">Weekly Check-Ins Keep You On Track</h2>
          <p className="cer-section-subtitle">
            Beyond labs, we track subjective markers weekly so you can see progress in real-time.
          </p>
          
          <div className="cer-checkin-features">
            <div className="cer-checkin-feature">
              <div className="cer-checkin-icon">📊</div>
              <h3 className="cer-checkin-title">Energy Tracking</h3>
              <p className="cer-checkin-desc">Rate your daily energy 1-10 and watch the trend improve over 6 weeks</p>
            </div>
            <div className="cer-checkin-feature">
              <div className="cer-checkin-icon">😴</div>
              <h3 className="cer-checkin-title">Sleep Quality</h3>
              <p className="cer-checkin-desc">Track sleep duration and quality—often the first thing to improve</p>
            </div>
            <div className="cer-checkin-feature">
              <div className="cer-checkin-icon">💪</div>
              <h3 className="cer-checkin-title">Recovery Speed</h3>
              <p className="cer-checkin-desc">Monitor how quickly you bounce back from workouts and stress</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="cer-section cer-section-alt">
        <div className="cer-container">
          <p className="cer-section-kicker">Investment</p>
          <h2 className="cer-section-title">Program Pricing</h2>
          <p className="cer-section-subtitle">
            One price. Everything included. No hidden costs.
          </p>
          
          <div className="cer-pricing-card">
            <div className="cer-pricing-header">
              <h3 className="cer-pricing-title">6-Week Cellular Energy Reset</h3>
              <p className="cer-pricing-duration">Complete Protocol</p>
            </div>
            
            <div className="cer-pricing-price">
              <div className="cer-price-amount">$3,997</div>
              <p className="cer-price-note">Payment plans available</p>
            </div>
            
            <div className="cer-pricing-value">
              <div className="cer-value-comparison">
                <span className="cer-value-label">À la carte value</span>
                <span className="cer-value-original">$5,560</span>
              </div>
              <div className="cer-value-savings">You save $1,563 (28% off)</div>
            </div>
            
            <div className="cer-pricing-includes">
              <h4>Everything Included:</h4>
              <ul>
                <li>18 Red Light Therapy sessions ($1,530 value)</li>
                <li>18 Hyperbaric Oxygen sessions ($3,330 value)</li>
                <li>2 Cellular Energy Lab Panels ($700 value)</li>
                <li>6 Weekly check-ins with tracking</li>
                <li>Provider consultations at baseline + completion</li>
                <li>Personalized protocol adjustments</li>
              </ul>
            </div>
            
            <div className="cer-pricing-cta">
              <a href="sms:+19499973988?body=Hi, I'm interested in the 6-Week Cellular Energy Reset program. Can we schedule a consultation?" className="cer-btn-primary">Reserve Your Spot →</a>
            </div>
            
            <p className="cer-pricing-guarantee">Questions first? Text us or call (949) 997-3988</p>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="cer-section">
        <div className="cer-container">
          <p className="cer-section-kicker">Questions</p>
          <h2 className="cer-section-title">Frequently Asked Questions</h2>
          
          <div className="cer-faq-list">
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">How long does each session take?</h3>
              <p className="cer-faq-answer">Red light therapy sessions are 20 minutes (10 minutes on each side). Hyperbaric oxygen sessions are 60 minutes. Plan for about 90 minutes total when doing both on the same day.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">Can I do red light and HBOT on the same day?</h3>
              <p className="cer-faq-answer">Yes, and we recommend it for convenience. Most people do both therapies back-to-back, 3 times per week. The order doesn't matter—do whichever feels better for you.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">When will I start feeling results?</h3>
              <p className="cer-faq-answer">Most people notice improved sleep quality within the first 1-2 weeks. Energy improvements typically become noticeable around weeks 2-3. The full benefits continue building through week 6 and beyond.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">What if I miss a session?</h3>
              <p className="cer-faq-answer">Life happens. If you miss a session, we'll work with you to reschedule. Consistency matters, but the protocol is flexible enough to accommodate occasional schedule changes.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">Are there any contraindications?</h3>
              <p className="cer-faq-answer">Hyperbaric oxygen therapy isn't recommended for people with certain lung conditions, recent ear surgery, or claustrophobia. We'll review your health history before starting to ensure this protocol is right for you.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">What happens after the 6 weeks?</h3>
              <p className="cer-faq-answer">After reviewing your results, we'll discuss maintenance options. Many people continue with 1-2 sessions per week of each therapy to maintain their gains. We'll recommend what makes sense for your goals.</p>
            </div>
            
            <div className="cer-faq-item">
              <h3 className="cer-faq-question">Is financing available?</h3>
              <p className="cer-faq-answer">Yes, we offer payment plans. Text or call us to discuss options that work for your budget.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="cer-section cer-section-alt cer-final-cta">
        <div className="cer-container">
          <h2 className="cer-section-title">Ready to Reset Your Energy?</h2>
          <p className="cer-section-subtitle">
            Text us to schedule a consultation and see if the 6-Week Cellular Energy Reset is right for you.
          </p>
          
          <div className="cer-cta-buttons">
            <a href="sms:+19499973988?body=Hi, I'm interested in the 6-Week Cellular Energy Reset program." className="cer-btn-primary">Text Us to Get Started →</a>
            <a href="tel:+19499973988" className="cer-btn-outline">Call (949) 997-3988</a>
          </div>
          
          <p className="cer-cta-phone">Range Medical • Newport Beach, CA</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="cer-footer">
        <p className="cer-footer-text">© 2026 Range Medical. All rights reserved.</p>
        <p className="cer-footer-links">
          <a href="https://range-medical.com">range-medical.com</a> • 
          <a href="tel:+19499973988">(949) 997-3988</a>
        </p>
      </footer>
    </div>
  );
};

export default CellularEnergyResetLanding;
