import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function RangeAssessment() {
  const [allChecked, setAllChecked] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false,
    check5: false,
    check6: false,
  });

  const handleCheckboxChange = (id) => {
    const newCheckboxes = { ...checkboxes, [id]: !checkboxes[id] };
    setCheckboxes(newCheckboxes);
    setAllChecked(Object.values(newCheckboxes).every(Boolean));
  };

  const handleShowCalendar = () => {
    if (!allChecked) {
      alert('Please confirm all items before booking.');
      return;
    }
    setShowCalendar(true);
    setTimeout(() => {
      document.getElementById('calendarContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <Layout
      title="Range Assessment | Your First Step | Range Medical | Newport Beach"
      description="One visit with a medical provider to finally connect your symptoms, your labs, and a clear plan. $199 to start. Newport Beach."
    >
      <Head>
        <meta name="keywords" content="wellness assessment Newport Beach, fatigue help, brain fog treatment, hormone testing, energy optimization" />
        <link rel="canonical" href="https://www.range-medical.com/range-assessment" />
        <meta property="og:title" content="Range Assessment | Range Medical | Newport Beach" />
        <meta property="og:description" content="One visit with a medical provider to finally connect your symptoms, your labs, and a clear plan." />
        <meta property="og:url" content="https://www.range-medical.com/range-assessment" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">⚡ Your First Step</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">Optimization Door</span>
        <h1>The Range Assessment: Your First Step to Feeling Like Yourself Again</h1>
        <p className="hero-sub">
          One visit with a medical provider to finally connect your symptoms, your labs, and a clear plan.
        </p>
        <div className="hero-cta">
          <div className="hero-buttons">
            <a href="#book" className="btn-primary">
              Schedule Your Range Assessment — $199
            </a>
          </div>
          <p className="hero-secondary">
            Most visits last 30–45 minutes.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who the Range Assessment Is For</h2>

          <div className="pain-points">
            <ul>
              <li>You feel tired or foggy even though your regular labs were "normal."</li>
              <li>You rely on coffee or energy drinks just to get through the day.</li>
              <li>Your sleep, mood, or libido is off and you can't figure out why.</li>
              <li>You want a long-term plan for hormones, weight, or longevity — not guesswork.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Happens */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Your Visit</p>
          <h2 className="section-title">What Happens During Your Assessment</h2>
          <p className="section-subtitle">
            A real conversation with a provider who listens, not a rushed 10-minute appointment.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4><span>📋</span> Review Your History</h4>
              <p>We go over your symptoms, history, and what you've already tried that hasn't worked.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🔬</span> Explain Your Labs</h4>
              <p>We review any labs you've had done this year and explain what they actually mean for how you feel.</p>
            </div>
            <div className="benefit-card">
              <h4><span>🎯</span> Recommend Next Steps</h4>
              <p>If deeper lab work would change your plan, we recommend specific panels and timing.</p>
            </div>
            <div className="benefit-card">
              <h4><span>📝</span> Leave With a Plan</h4>
              <p>You leave with a written plan and clear next steps — not just "let's wait and see."</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Labs Fit In */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Important</p>
          <h2 className="section-title">How Labs Fit Into the Range Assessment</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Every person is different. During your Assessment, your provider reviews your symptoms, history, and current treatments.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              If deeper lab work will change your plan, they'll recommend which labs to run and when.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Some patients start with treatments we can do right away and add labs later. Others start with labs first. You and your provider decide together what makes the most sense.
            </p>
            <div style={{background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem'}}>
              <p style={{fontSize: '0.9375rem', color: '#404040', marginBottom: '0', textAlign: 'center'}}>
                <strong>This means labs are not automatically included for everyone.</strong><br />
                They are added when they truly help us build a better plan for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Comes Next */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">After Your Assessment</p>
          <h2 className="section-title">What Happens After Your Assessment</h2>
          <p className="section-subtitle">
            Based on your goals and results, your provider may recommend one or more of these programs:
          </p>

          <div className="tools-grid">
            <Link href="/cellular-energy-reset" className="tool-card">
              <h4>Cellular Energy Reset</h4>
              <p>6-week program for low energy, brain fog, and slow recovery. Combines in-clinic treatments with a clear plan.</p>
            </Link>
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>For men and women with symptoms of hormone imbalance who want bioidentical hormone therapy with close follow-up.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>Medical support with weight, appetite, and metabolism — not just another diet.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>Recovery, performance, and longevity support using targeted peptide protocols.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV Therapy</h4>
              <p>Vitamins, nutrients, and hydration delivered directly to your bloodstream for faster results.</p>
            </Link>
            <Link href="/lab-panels" className="tool-card">
              <h4>Advanced Lab Testing</h4>
              <p>Deeper lab panels when your provider recommends them for your specific situation.</p>
            </Link>
          </div>

          <div style={{textAlign: 'center', marginTop: '2rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#737373', maxWidth: '500px', margin: '0 auto'}}>
              You're not buying these from this page. Your Assessment helps us figure out which path is right for you.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="section section-gray" id="book">
        <div className="container">
          <div className="section-kicker">Schedule Now</div>
          <h2 className="section-title">Book Your Range Assessment</h2>
          <p className="section-subtitle">Review the information below, then select a time that works for you.</p>

          {/* Prep Instructions */}
          <div className="booking-checkbox-area">
            <h3>Before Your Visit</h3>
            <p className="checkbox-intro">Please confirm you understand the following:</p>
            
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check1" 
                checked={checkboxes.check1}
                onChange={() => handleCheckboxChange('check1')}
              />
              <label htmlFor="check1"><strong>This is a 30–45 minute visit.</strong> Plan your schedule accordingly and arrive ready to discuss your goals.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check2"
                checked={checkboxes.check2}
                onChange={() => handleCheckboxChange('check2')}
              />
              <label htmlFor="check2"><strong>You'll receive a symptoms form to complete before your visit.</strong> This helps us make the most of your time together.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check3"
                checked={checkboxes.check3}
                onChange={() => handleCheckboxChange('check3')}
              />
              <label htmlFor="check3"><strong>Bring any labs from the past year if you have them.</strong> We'll review them together. If you don't have any, that's okay.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check4"
                checked={checkboxes.check4}
                onChange={() => handleCheckboxChange('check4')}
              />
              <label htmlFor="check4"><strong>This is a consultation to build your plan.</strong> You'll leave with clear next steps, not a "wait and see" answer.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check5"
                checked={checkboxes.check5}
                onChange={() => handleCheckboxChange('check5')}
              />
              <label htmlFor="check5"><strong>Arrive 5–10 minutes early</strong> with a valid ID so we can start on time.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check6"
                checked={checkboxes.check6}
                onChange={() => handleCheckboxChange('check6')}
              />
              <label htmlFor="check6">I understand the <strong>assessment fee is $199</strong>, payable at the clinic. This is credited toward any treatment, including labs.</label>
            </div>
          </div>

          <div className="booking-cta-area">
            <button 
              className={`btn-primary booking-btn ${allChecked ? 'active' : ''}`}
              onClick={handleShowCalendar}
              disabled={!allChecked}
            >
              Continue to Select a Time
            </button>
            <p className="booking-price-note">You'll pay $199 at the clinic when you arrive.</p>
          </div>

          <div className="info-note">
            <p><strong>Looking for injury recovery, PRP, or peptide support?</strong> That doesn't require labs. <Link href="/book-recovery">Book a Recovery Assessment instead →</Link></p>
          </div>

          {/* Calendar Container */}
          <div 
            className={`calendar-container ${showCalendar ? 'visible' : ''}`}
            id="calendarContainer"
          >
            <div className="calendar-embed">
              <iframe 
                src="https://link.range-medical.com/booking/range-medical/sv/69769eed725303dcad0eb2da?heightMode=fixed&showHeader=true" 
                style={{ width: '100%', height: '700px', border: 'none', overflow: 'hidden' }}
                scrolling="no" 
                id="69769eed725303dcad0eb2da_booking"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Start With One Visit</span>
          <h2>Tired of Guessing?</h2>
          <p>If you want a clear plan built around your symptoms and data, the Range Assessment is the first step.</p>
          <div className="cta-buttons">
            <a href="#book" className="btn-white">
              Schedule Your Range Assessment — $199
            </a>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      {/* GHL Form Script */}
      <script src="https://link.range-medical.com/js/form_embed.js" type="text/javascript" async />
    </Layout>
  );
}
