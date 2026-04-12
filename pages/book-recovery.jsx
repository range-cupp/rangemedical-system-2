import Layout from '../components/Layout';
import Link from 'next/link';
import { useState } from 'react';

export default function BookRecovery() {
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
      title="Recovery Consultation | Range Medical"
      description="Schedule your Recovery Assessment at Range Medical in Newport Beach. Consultation for peptide therapy, PRP, and IV support. No labs required."
    >
      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ 20-30 Minute Visit</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">No Labs Required</span>
          <h1>Book Your Recovery Consultation</h1>
          <p className="hero-sub">A consultation to evaluate whether peptide therapy, PRP, IVs, or other tools can support your recovery.</p>
        </div>
      </section>

      {/* What's Included */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Visit</div>
          <h2 className="section-title">What's Included</h2>
          <p className="section-subtitle">Everything you need to get started with recovery support.</p>

          <div className="included-box">
            <div className="included-left">
              <div className="included-price">free</div>
              <div className="included-duration">One-on-one consultation</div>
              <span className="included-credit">✓ Credited toward any treatment</span>
            </div>
            <div className="included-right">
              <h3>Your assessment includes:</h3>
              <ul className="included-list">
                <li>Review of your injury history</li>
                <li>Discussion of current treatment & providers</li>
                <li>Evaluation of recovery goals</li>
                <li>Honest assessment of how we can help</li>
                <li>Clear explanation of treatment options</li>
                <li>No labs required to start</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Options */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">If We Can Help</div>
          <h2 className="section-title">Treatment Options We Offer</h2>
          <p className="section-subtitle">Depending on your evaluation, your provider may discuss one or more of these recovery tools.</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🧬</span>Peptide Protocols</h4>
                <p>BPC-157, Thymosin Beta-4, and other peptides to support tissue repair and reduce inflammation.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">💉</span>PRP Therapy</h4>
                <p>Your own concentrated platelets reinjected to support healing in joints, tendons, and soft tissue.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">💧</span>IV Support</h4>
                <p>Vitamins, minerals, and amino acids delivered directly to support recovery.</p>
              </div>
            </div>
            <div className="condition-card">
              <div>
                <h4><span className="condition-icon">🫁</span>Hyperbaric Oxygen</h4>
                <p>Pressurized oxygen therapy that may help support healing and reduce inflammation.</p>
              </div>
            </div>
          </div>
          
          <p className="credit-note-text">Your assessment is free. Treatment pricing is discussed during your visit.</p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="section" id="book">
        <div className="container">
          <div className="section-kicker">Schedule Now</div>
          <h2 className="section-title">Book Your Visit</h2>
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
              <label htmlFor="check1"><strong>This is a consultation, not treatment.</strong> We'll evaluate your situation and discuss options. Treatment begins after if appropriate.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check2"
                checked={checkboxes.check2}
                onChange={() => handleCheckboxChange('check2')}
              />
              <label htmlFor="check2"><strong>Bring any relevant records</strong> — imaging, surgical notes, or recent labs if you have them (not required).</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check3"
                checked={checkboxes.check3}
                onChange={() => handleCheckboxChange('check3')}
              />
              <label htmlFor="check3"><strong>Know your injury history</strong> — when it started, what you've tried, who else you're working with.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check4"
                checked={checkboxes.check4}
                onChange={() => handleCheckboxChange('check4')}
              />
              <label htmlFor="check4"><strong>We work alongside your current providers</strong> — PT, chiro, surgeon. We're not replacing them.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check5"
                checked={checkboxes.check5}
                onChange={() => handleCheckboxChange('check5')}
              />
              <label htmlFor="check5"><strong>Plan for 20-30 minutes</strong> for your visit, and arrive 5-10 minutes early with a valid ID.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check6"
                checked={checkboxes.check6}
                onChange={() => handleCheckboxChange('check6')}
              />
              <label htmlFor="check6">I understand the <strong>assessment is free</strong> and I'll pay at the clinic only if I begin treatment.</label>
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
            <p className="booking-price-note">Your assessment is free. No payment required at check-in.</p>
          </div>

          <div className="info-note">
            <p><strong>Looking for hormone therapy, weight loss, or longevity services?</strong> <Link href="/assessment">Start here instead →</Link></p>
          </div>

          {/* Calendar Container */}
          <div 
            className={`calendar-container ${showCalendar ? 'visible' : ''}`}
            id="calendarContainer"
          >
            <div className="calendar-embed">
              <iframe 
                src="https://link.range-medical.com/booking/range-medical/sv/694fe861bf5193111f00b525?heightMode=fixed&showHeader=true" 
                style={{ width: '100%', height: '700px', border: 'none', overflow: 'hidden' }}
                scrolling="no" 
                id="694fe861bf5193111f00b525_booking"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="section" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
        <div className="container">
          <p style={{ fontSize: '0.8125rem', color: '#a3a3a3', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 700 }}>
            The information on this page is for educational purposes only and does not constitute medical advice for any specific condition or individual. All treatment decisions are made by a licensed provider after an in-person evaluation. Results vary by individual.
          </p>
        </div>
      </section>

      {/* GHL Form Script */}
      <script src="https://link.range-medical.com/js/form_embed.js" type="text/javascript" async />
    </Layout>
  );
}
