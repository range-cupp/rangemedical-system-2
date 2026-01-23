import React from 'react';

const CellularEnergyResetSalesScript = () => {
  const styles = `
    .cer-script {
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
      max-width: 850px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    /* Header */
    .cer-script-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      border-bottom: 3px solid #000000;
      margin-bottom: 2rem;
    }
    
    .cer-script-logo {
      height: 32px;
      width: auto;
    }
    
    .cer-script-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    /* Title */
    .cer-script h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    
    .cer-script-subtitle {
      font-size: 1rem;
      color: #525252;
      margin-bottom: 1rem;
    }
    
    /* Money Model Line */
    .cer-script-money-model {
      background: #000000;
      color: #ffffff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 2rem;
      letter-spacing: 0.01em;
    }
    
    .cer-script-money-model span {
      color: #a3a3a3;
    }
    
    /* Section Styling */
    .cer-script-section {
      margin-bottom: 2.5rem;
    }
    
    .cer-script-section-header {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    
    .cer-script h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #000000;
    }
    
    .cer-script h3 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      margin-top: 1.5rem;
      color: #1a1a1a;
    }
    
    /* Script Boxes */
    .cer-script-box {
      background: #fafafa;
      border-left: 4px solid #000000;
      padding: 1.25rem;
      margin-bottom: 1rem;
      border-radius: 0 8px 8px 0;
    }
    
    .cer-script-box.cer-script-question {
      background: #f0f9ff;
      border-left-color: #0284c7;
    }
    
    .cer-script-box.cer-script-transition {
      background: #fef3c7;
      border-left-color: #d97706;
    }
    
    .cer-script-box.cer-script-close {
      background: #f0fdf4;
      border-left-color: #22c55e;
    }
    
    .cer-script-box.cer-script-objection {
      background: #fef2f2;
      border-left-color: #dc2626;
    }
    
    .cer-script-box.cer-script-purple {
      background: #f5f3ff;
      border-left-color: #7c3aed;
    }
    
    .cer-script-box.cer-script-critical {
      background: #fef2f2;
      border: 2px solid #dc2626;
      border-left: 4px solid #dc2626;
    }
    
    .cer-script-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
      color: #000000;
    }
    
    .cer-script-box.cer-script-question .cer-script-label { color: #0284c7; }
    .cer-script-box.cer-script-transition .cer-script-label { color: #d97706; }
    .cer-script-box.cer-script-close .cer-script-label { color: #22c55e; }
    .cer-script-box.cer-script-objection .cer-script-label { color: #dc2626; }
    .cer-script-box.cer-script-purple .cer-script-label { color: #7c3aed; }
    .cer-script-box.cer-script-critical .cer-script-label { color: #dc2626; }
    
    .cer-script-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      margin: 0;
    }
    
    .cer-script-text em {
      color: #525252;
      font-style: italic;
    }
    
    /* Bullet Lists */
    .cer-script ul {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem 0;
    }
    
    .cer-script li {
      font-size: 0.9375rem;
      padding: 0.375rem 0;
      padding-left: 1.5rem;
      position: relative;
    }
    
    .cer-script li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #737373;
    }
    
    /* Quick Reference Card - UPDATED */
    .cer-script-quick-ref {
      border: 2px solid #000000;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    
    .cer-script-quick-ref-header {
      background: #000000;
      color: #ffffff;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 700;
    }
    
    .cer-script-quick-ref-body {
      padding: 1.25rem;
    }
    
    .cer-script-offer-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #e5e5e5;
      align-items: start;
    }
    
    .cer-script-offer-row:last-child {
      border-bottom: none;
    }
    
    .cer-script-offer-name {
      font-weight: 700;
      font-size: 0.875rem;
    }
    
    .cer-script-offer-name.blue { color: #0284c7; }
    .cer-script-offer-name.black { color: #000000; }
    .cer-script-offer-name.purple { color: #7c3aed; }
    
    .cer-script-offer-details {
      font-size: 0.875rem;
      line-height: 1.6;
    }
    
    .cer-script-offer-details strong {
      color: #000000;
    }
    
    /* Value Stack Table */
    .cer-script-value-stack {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    
    .cer-script-value-stack th {
      text-align: left;
      padding: 0.5rem;
      background: #fafafa;
      border-bottom: 2px solid #000000;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .cer-script-value-stack td {
      padding: 0.5rem;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .cer-script-value-stack .value-col {
      text-align: right;
      font-weight: 600;
      color: #525252;
    }
    
    .cer-script-value-stack .total-row td {
      border-top: 2px solid #000000;
      font-weight: 700;
    }
    
    .cer-script-value-stack .price-row td {
      background: #f0fdf4;
      font-weight: 700;
      font-size: 1rem;
    }
    
    /* Persona Cards */
    .cer-script-persona-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .cer-script-persona-card {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .cer-script-persona-title {
      font-size: 0.875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .cer-script-persona-signs {
      font-size: 0.8125rem;
      color: #525252;
      margin: 0;
    }
    
    /* Objection Grid */
    .cer-script-objection-grid {
      display: grid;
      gap: 1rem;
    }
    
    .cer-script-objection-item {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .cer-script-objection-header {
      background: #fef2f2;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #dc2626;
    }
    
    .cer-script-objection-response {
      padding: 1rem;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    
    /* Tips Box */
    .cer-script-tips-box {
      background: #fafafa;
      border: 2px solid #e5e5e5;
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    
    .cer-script-tips-box h4 {
      font-size: 0.8125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    
    .cer-script-tips-box li {
      font-size: 0.8125rem;
      padding: 0.25rem 0;
    }
    
    /* Flow Diagram */
    .cer-script-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #fafafa;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .cer-script-flow-step {
      text-align: center;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .cer-script-flow-step.blue {
      background: #0284c7;
      color: #ffffff;
    }
    
    .cer-script-flow-step.black {
      background: #000000;
      color: #ffffff;
    }
    
    .cer-script-flow-step.purple {
      background: #7c3aed;
      color: #ffffff;
    }
    
    .cer-script-flow-arrow {
      font-size: 1.5rem;
      color: #a3a3a3;
    }
    
    .cer-script-flow-price {
      font-size: 0.75rem;
      font-weight: 500;
      opacity: 0.9;
      margin-top: 0.25rem;
    }
    
    .cer-script-flow-addon {
      font-size: 0.625rem;
      font-weight: 500;
      opacity: 0.75;
      margin-top: 0.125rem;
    }
    
    /* IV Upgrade Box */
    .cer-script-iv-upgrade {
      background: #f0fdf4;
      border: 2px solid #22c55e;
    }
    
    .cer-script-iv-upgrade .cer-script-label {
      color: #166534;
    }
    
    .cer-script-iv-upgrade .cer-script-note {
      font-size: 0.8125rem;
      color: #166534;
      margin-top: 0.75rem;
    }
    
    /* Default Rule Callout */
    .cer-script-default-rule {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .cer-script-default-rule-icon {
      font-size: 1.25rem;
    }
    
    .cer-script-default-rule-text {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }
    
    /* Shut Up Rule */
    .cer-script-shutup-rule {
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-top: 1rem;
      text-align: center;
    }
    
    .cer-script-shutup-rule p {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #991b1b;
      margin: 0;
    }
    
    /* Footer */
    .cer-script-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 0.8125rem;
      color: #737373;
    }
    
    @media (max-width: 768px) {
      .cer-script-offer-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      .cer-script-persona-grid {
        grid-template-columns: 1fr;
      }
      .cer-script-flow {
        flex-direction: column;
      }
      .cer-script-flow-arrow {
        transform: rotate(90deg);
      }
    }
  `;

  return (
    <div className="cer-script">
      <style>{styles}</style>
      
      {/* Header */}
      <header className="cer-script-header">
        <img 
          src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
          alt="Range Medical" 
          className="cer-script-logo"
        />
        <span className="cer-script-badge">Internal Use Only</span>
      </header>
      
      {/* Title */}
      <h1>Cellular Energy Protocol</h1>
      <p className="cer-script-subtitle">Consultation Script: Assessment → Reset → Maintenance</p>
      
      {/* Money Model Line */}
      <div className="cer-script-money-model">
        Assessment ($199, 100% credit) <span>→</span> 6-Week Reset ($3,999 + optional IV $999) <span>→</span> Maintenance ($599 or $799/4wk)
      </div>
      
      {/* Visual Flow */}
      <div className="cer-script-flow">
        <div className="cer-script-flow-step blue">
          Assessment
          <div className="cer-script-flow-price">$199</div>
        </div>
        <div className="cer-script-flow-arrow">→</div>
        <div className="cer-script-flow-step black">
          6-Week Reset
          <div className="cer-script-flow-price">$3,999</div>
          <div className="cer-script-flow-addon">+IV: $999</div>
        </div>
        <div className="cer-script-flow-arrow">→</div>
        <div className="cer-script-flow-step purple">
          Maintenance
          <div className="cer-script-flow-price">$599 or $799</div>
        </div>
      </div>
      
      {/* Quick Reference - UPDATED FOR FAST SCANNING */}
      <div className="cer-script-quick-ref">
        <div className="cer-script-quick-ref-header">Quick Reference — All Offers</div>
        <div className="cer-script-quick-ref-body">
          
          <div className="cer-script-offer-row">
            <div className="cer-script-offer-name blue">Assessment</div>
            <div className="cer-script-offer-details">
              <strong>$199</strong> | <strong>100% credit within 7 days</strong> | Labs + review + RLT & HBOT experience
            </div>
          </div>
          
          <div className="cer-script-offer-row">
            <div className="cer-script-offer-name black">6-Week Reset</div>
            <div className="cer-script-offer-details">
              <strong>$3,999 PIF (+2 RLT)</strong> or <strong>3 × $1,399</strong> | Value $5,760 | 6 weeks, 3x/week, 18 HBOT + 18 RLT, guarantee, 8 spots max<br />
              <em>IV Upgrade: +$999 for 6 weekly IVs (value $1,350)</em>
            </div>
          </div>
          
          <div className="cer-script-offer-row">
            <div className="cer-script-offer-name purple">Maintenance</div>
            <div className="cer-script-offer-details">
              <strong>Base: $599 / 4 weeks</strong> | 4 HBOT + 4 RLT | Quarterly check-in<br />
              <strong>+ IV: $799 / 4 weeks</strong> | Adds 1 Energy IV per cycle
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Ideal Patient */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 1</p>
        <h2>Identify the Right Patient</h2>
        
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}>Before presenting anything, confirm the patient fits one of these profiles:</p>
        
        <div className="cer-script-persona-grid">
          <div className="cer-script-persona-card">
            <h4 className="cer-script-persona-title">⚡ Exhausted High Performer</h4>
            <p className="cer-script-persona-signs">Relies on coffee, crashes mid-afternoon, "doing everything right" but still tired</p>
          </div>
          <div className="cer-script-persona-card">
            <h4 className="cer-script-persona-title">🔄 Post-Illness Rebuilder</h4>
            <p className="cer-script-persona-signs">Recovered from COVID/mono/infection but never bounced back, lingering fatigue</p>
          </div>
          <div className="cer-script-persona-card">
            <h4 className="cer-script-persona-title">🏃 Athlete Seeking Edge</h4>
            <p className="cer-script-persona-signs">Recovery takes longer, wants faster healing, interested in performance optimization</p>
          </div>
          <div className="cer-script-persona-card">
            <h4 className="cer-script-persona-title">🧬 Longevity Optimizer</h4>
            <p className="cer-script-persona-signs">Proactive about health, interested in mitochondrial function, prevention-minded</p>
          </div>
        </div>
        
        <div className="cer-script-tips-box">
          <h4>💡 Qualifying Questions:</h4>
          <ul>
            <li>"On a scale of 1-10, how would you rate your energy most days?"</li>
            <li>"How long does it take you to recover from a hard workout?"</li>
            <li>"Have you noticed your energy declining over the past year or two?"</li>
            <li>"Are you interested in optimizing at the cellular level, not just treating symptoms?"</li>
          </ul>
        </div>
      </section>
      
      {/* Discovery */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 2</p>
        <h2>Discovery — Understand Their Problem</h2>
        
        <div className="cer-script-box cer-script-question">
          <p className="cer-script-label">Ask</p>
          <p className="cer-script-text">"Tell me more about your energy. What does a typical day look like for you?"</p>
        </div>
        
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}><em>Listen for:</em></p>
        <ul>
          <li>Afternoon crashes or reliance on caffeine</li>
          <li>Feeling "wired but tired"</li>
          <li>Brain fog or difficulty focusing</li>
          <li>Slow recovery from exercise or illness</li>
          <li>Sleep issues despite being exhausted</li>
        </ul>
        
        <div className="cer-script-box cer-script-question">
          <p className="cer-script-label">Follow-up</p>
          <p className="cer-script-text">"If your energy was where you wanted it to be, what would be different in your life?"</p>
        </div>
        
        <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}><em>This question helps them articulate the cost of the problem and creates emotional investment in solving it.</em></p>
      </section>
      
      {/* Education */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 3</p>
        <h2>Educate — The Root Cause</h2>
        
        <div className="cer-script-box cer-script-transition">
          <p className="cer-script-label">Transition</p>
          <p className="cer-script-text">"What you're describing is really common, and it usually comes down to one thing: your cells aren't producing enough energy. Let me explain what I mean..."</p>
        </div>
        
        <div className="cer-script-box">
          <p className="cer-script-label">Explain</p>
          <p className="cer-script-text">"You have these tiny power plants inside your cells called mitochondria. They produce ATP, which is basically cellular fuel. When mitochondria get stressed—from inflammation, poor oxygen delivery, or just wear and tear—they produce less energy. That's when you feel it: the fatigue, the brain fog, the slow recovery."</p>
        </div>
        
        <div className="cer-script-box">
          <p className="cer-script-label">Bridge</p>
          <p className="cer-script-text">"The good news is we can measure this and fix it. That's what our Cellular Energy Protocol is designed to do. Let me walk you through how it works."</p>
        </div>
      </section>
      
      {/* Present Assessment */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 4</p>
        <h2>Present the Assessment (Front-End Offer)</h2>
        
        {/* DEFAULT RULE - NEW */}
        <div className="cer-script-default-rule">
          <span className="cer-script-default-rule-icon">⚠️</span>
          <p className="cer-script-default-rule-text">Default: Everyone starts with the Assessment unless they clearly ask for the full Reset.</p>
        </div>
        
        <div className="cer-script-box cer-script-question">
          <p className="cer-script-label">Lead With Data</p>
          <p className="cer-script-text">"The first step is knowing exactly where you stand. We start with a Cellular Energy Assessment—this tells us what's actually going on at the cellular level, not just guessing based on symptoms."</p>
        </div>
        
        <h3>What's Included in the Assessment:</h3>
        <div className="cer-script-box">
          <p className="cer-script-label">Explain</p>
          <p className="cer-script-text">"The Assessment includes a comprehensive lab panel—12 biomarkers that tell us about inflammation, oxygen utilization, growth factors, and metabolism. You'll also complete an energy questionnaire, then meet with me to review everything. I'll give you a written plan with exactly what I'd recommend based on your results. You'll also do both a red light session and an HBOT session so you can feel exactly what the Reset will be like."</p>
        </div>
        
        <h3>Price Presentation:</h3>
        <div className="cer-script-box cer-script-transition">
          <p className="cer-script-label">Price + Credit</p>
          <p className="cer-script-text">"The Assessment is $199. Here's the important part: if you decide to move forward with the full 6-Week Reset within 7 days of your results visit, that entire $199 is credited toward the program. So you're not paying twice—you're just getting the data first."</p>
        </div>
        
        <div className="cer-script-box cer-script-close">
          <p className="cer-script-label">Soft Close</p>
          <p className="cer-script-text">"Does that make sense? Want to start with the Assessment so we can see exactly what's going on?"</p>
        </div>
        
        <div className="cer-script-tips-box">
          <h4>💡 If They Want to Skip the Assessment:</h4>
          <ul>
            <li>"Absolutely—if you already know you want the full protocol, we can go straight to the 6-Week Reset. The Assessment is really for people who want to see their data before committing."</li>
            <li>Then proceed to present the Reset (Step 5)</li>
          </ul>
        </div>
      </section>
      
      {/* Present Reset */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 5</p>
        <h2>Present the 6-Week Reset (Core Offer)</h2>
        
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}><em>Use this if they want to skip the Assessment OR at the Assessment results visit.</em></p>
        
        <div className="cer-script-box">
          <p className="cer-script-label">Overview</p>
          <p className="cer-script-text">"The 6-Week Cellular Energy Reset is our complete protocol. You'll come in three times a week for red light therapy and hyperbaric oxygen—both of which directly support your mitochondria. We do weekly check-ins to track your progress and make sure you're seeing results."</p>
        </div>
        
        <h3>The Value Stack:</h3>
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}><em>Present each line item with its value:</em></p>
        
        <table className="cer-script-value-stack">
          <thead>
            <tr>
              <th>What's Included</th>
              <th style={{ textAlign: 'right' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>18 Hyperbaric Oxygen Sessions (60 min each)</td>
              <td className="value-col">$3,330</td>
            </tr>
            <tr>
              <td>18 Full-Body Red Light Sessions (20 min each)</td>
              <td className="value-col">$1,530</td>
            </tr>
            <tr>
              <td>Orientation & Week-7 Review</td>
              <td className="value-col">$400</td>
            </tr>
            <tr>
              <td>Weekly Progress Check-ins & Energy Tracking</td>
              <td className="value-col">$300</td>
            </tr>
            <tr>
              <td>Priority Scheduling & Concierge Coordination</td>
              <td className="value-col">$200</td>
            </tr>
            <tr className="total-row">
              <td>Total Value</td>
              <td className="value-col">$5,760</td>
            </tr>
            <tr className="price-row">
              <td>Your Price</td>
              <td className="value-col">$3,999</td>
            </tr>
          </tbody>
        </table>
        
        <div className="cer-script-box cer-script-transition">
          <p className="cer-script-label">Anchor + Price</p>
          <p className="cer-script-text">"If you did all of this separately, you're looking at over $5,700. The complete program is $3,999—you're saving over $1,700 and getting the structure and accountability to actually get results."</p>
        </div>
        
        <h3>Payment Options:</h3>
        <div className="cer-script-box cer-script-close">
          <p className="cer-script-label">Present Both</p>
          <p className="cer-script-text">"You can pay in full at $3,999 and we'll add 2 extra red light sessions as a bonus. Or if you'd prefer a payment plan, it's three monthly payments of $1,399."</p>
        </div>
        
        {/* SHUT UP RULE - NEW */}
        <div className="cer-script-shutup-rule">
          <p>⛔ After presenting both options: PAUSE. Shut up. Let them choose.</p>
        </div>
        
        <h3>IV Upgrade (Optional Upsell):</h3>
        <div className="cer-script-box cer-script-iv-upgrade">
          <p className="cer-script-label">After They Commit to Reset</p>
          <p className="cer-script-text">"One more thing—some people want every advantage. We have an IV Upgrade: 6 IV therapy sessions over your 6 weeks, one per week, timed with your protocol. It's basically turbo fuel for what we're already doing. Normally $1,350, but as part of your Reset enrollment it's $999. Want me to add that?"</p>
          <p className="cer-script-note"><strong>Note:</strong> Only offer after they've committed to the Reset. Simple yes/no. Don't oversell.</p>
        </div>
        
        <h3>The Guarantee:</h3>
        <div className="cer-script-box">
          <p className="cer-script-label">Risk Reversal</p>
          <p className="cer-script-text">"Here's how confident we are in this: if your self-rated energy hasn't improved by at least 2 points on a 10-point scale by the end of week 3, we'll add 2 extra weeks of red light—6 sessions—at no charge. We're committed to you seeing results."</p>
        </div>
        
        <h3>Scarcity:</h3>
        <div className="cer-script-box cer-script-objection">
          <p className="cer-script-label">Capacity Constraint</p>
          <p className="cer-script-text">"Just so you know, we can only run 8 of these Resets at a time because of chamber capacity. Each person uses about 24 hours of equipment time over 6 weeks. We're currently enrolling [X] spots for this month."</p>
        </div>
        
        <div className="cer-script-box cer-script-close">
          <p className="cer-script-label">Close</p>
          <p className="cer-script-text">"Does this sound like what you're looking for? If you're ready, we can get your baseline labs scheduled this week and start next Monday."</p>
        </div>
      </section>
      
      {/* Objection Handling */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 6</p>
        <h2>Objection Handling</h2>
        
        <div className="cer-script-objection-grid">
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"That's expensive."</div>
            <div className="cer-script-objection-response">
              "I hear you. Let me ask—how much do you think low energy is costing you right now? In productivity? In quality of life? For most people, this program pays for itself pretty quickly. And we're not masking symptoms—we're fixing the root cause, which means lasting results. Would a payment plan make this more comfortable? It's $1,399 a month for three months."
            </div>
          </div>
          
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"Can I just do a few sessions and see?"</div>
            <div className="cer-script-objection-response">
              "I understand wanting to test it. The challenge is that cellular changes take time—a few sessions won't give you the full picture. It's like going to the gym three times and wondering why you're not in shape yet. That said, if you want to start smaller, the Assessment is a great first step. You get your labs, experience both therapies, and a clear picture of what's going on. Then you can decide."
            </div>
          </div>
          
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"I need to think about it."</div>
            <div className="cer-script-objection-response">
              "Of course. What specifically are you weighing? Is it the time commitment, the investment, or something else?" <em>[Listen, address the specific concern.]</em> "If you're not ready for the full Reset, start with the Assessment—$199, and it all credits toward the program if you move forward within 7 days."
            </div>
          </div>
          
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"Does it actually work?"</div>
            <div className="cer-script-objection-response">
              "That's exactly why we include labs. You'll see your own numbers—before and after. If your CRP drops and your IGF-1 goes up, that's not placebo—that's measurable change. Plus we have the Week-3 guarantee: if you're not seeing improvement, we add 6 extra sessions at no charge."
            </div>
          </div>
          
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"I don't have time for 3x/week."</div>
            <div className="cer-script-objection-response">
              "I get it—that's a real commitment. Here's how most people make it work: we batch both therapies on the same day, so it's about 90 minutes total. Some people do early morning, others over lunch, others after work. We schedule all 18 visits at enrollment so they're locked in. What days and times would realistically work for you?"
            </div>
          </div>
          
          <div className="cer-script-objection-item">
            <div className="cer-script-objection-header">"I'll just try red light (or just HBOT)."</div>
            <div className="cer-script-objection-response">
              "You can do them separately. The reason we combine them is they work through different mechanisms that amplify each other. Red light stimulates your mitochondria, HBOT gives them the oxygen they need. Together, faster and stronger results. But if budget is a concern, the Assessment is a good starting point—$199 and you'll know exactly where you stand."
            </div>
          </div>
        </div>
      </section>
      
      {/* Present Maintenance */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Step 7</p>
        <h2>Present Maintenance (Week 7 Results Visit)</h2>
        
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}><em>This happens at the results review, NOT as a separate conversation. Their next problem is staying optimized—solve it.</em></p>
        
        {/* NO SEND HOME RULE - NEW */}
        <div className="cer-script-box cer-script-critical">
          <p className="cer-script-label">Critical Rule</p>
          <p className="cer-script-text"><strong>If they completed the Reset, do not send them home without a yes/no on Maintenance.</strong></p>
        </div>
        
        <div className="cer-script-box cer-script-purple">
          <p className="cer-script-label">Transition From Results</p>
          <p className="cer-script-text">"These results are great—look at your energy scores, how you're feeling. The question now is: how do we maintain this? You've built something. Let's not lose it."</p>
        </div>
        
        <div className="cer-script-box">
          <p className="cer-script-label">Present Two Tiers</p>
          <p className="cer-script-text">"We have a Maintenance Membership designed exactly for this. Instead of 3x a week, you'd come in once a week—4 sessions each of HBOT and red light every 4 weeks, plus a quarterly check-in."</p>
        </div>
        
        <div className="cer-script-box cer-script-transition">
          <p className="cer-script-label">Price + Options</p>
          <p className="cer-script-text">"There are two options: Base is $599 every 4 weeks. Or if you want to keep the IV support going, the Maintenance + IV tier is $799—that adds one Energy IV per cycle. À la carte, either option would run you over $1,000 a month. Which sounds right for you?"</p>
        </div>
        
        <div className="cer-script-shutup-rule">
          <p>⛔ After presenting both tiers: PAUSE. Let them choose.</p>
        </div>
        
        <div className="cer-script-box cer-script-close">
          <p className="cer-script-label">Close</p>
          <p className="cer-script-text">"Do you want to keep this going? We can start your first maintenance cycle next week."</p>
        </div>
        
        <div className="cer-script-tips-box">
          <h4>💡 If They Decline:</h4>
          <ul>
            <li>"No problem. Just know you can always come back. Many people take a month or two off and then realize they want to maintain. We'll be here."</li>
            <li>Get permission to follow up in 30-60 days</li>
          </ul>
        </div>
      </section>
      
      {/* Key Reminders */}
      <section className="cer-script-section">
        <p className="cer-script-section-header">Key Reminders</p>
        <h2>Consultation Best Practices</h2>
        
        <ul>
          <li><strong>Assessment is the default entry point.</strong> Lead with it unless they clearly want the full Reset.</li>
          <li><strong>Never discount.</strong> Change terms (payment plans) or add bonuses—never lower the price.</li>
          <li><strong>Stack the value.</strong> Always present line-by-line values before the price.</li>
          <li><strong>Use the guarantee.</strong> It removes risk and shows confidence.</li>
          <li><strong>Scarcity is real.</strong> 8 spots max is an actual capacity constraint—use it.</li>
          <li><strong>Maintenance is sold at results review.</strong> Not as a separate conversation weeks later.</li>
          <li><strong>Labs are the differentiator.</strong> Anyone can offer red light or HBOT. The data makes this a protocol.</li>
          <li><strong>Listen more than you talk.</strong> 60-70% them, 30-40% you during discovery.</li>
          <li><strong>After payment options: shut up.</strong> Present both, then wait. Silence closes.</li>
          <li><strong>No one leaves Week 7 without a Maintenance answer.</strong> Yes or no—get the decision.</li>
        </ul>
      </section>
      
      {/* Footer */}
      <footer className="cer-script-footer">
        Range Medical • Newport Beach, CA • (949) 997-3988<br />
        Internal document — not for patient distribution
      </footer>
    </div>
  );
};

export default CellularEnergyResetSalesScript;
