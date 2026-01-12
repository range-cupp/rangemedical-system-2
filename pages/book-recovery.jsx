import Head from 'next/head';
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
    <>
      <Head>
        <title>Book Recovery Assessment | Range Medical</title>
        <meta name="description" content="Schedule your Recovery Assessment at Range Medical in Newport Beach. Consultation for peptide therapy, PRP, and IV support. No labs required." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Simple Header */}
      <header className="book-header">
        <div className="container">
          <div className="book-header-inner">
            <Link href="/" className="book-logo">
              <img 
                src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" 
                alt="Range Medical" 
              />
            </Link>
            <div className="book-header-contact">
              Questions? <a href="tel:+19499973988">(949) 997-3988</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="book-hero">
        <div className="container">
          <span className="hero-badge">No Labs Required</span>
          <h1>Book Your Recovery Assessment</h1>
          <p>A consultation to evaluate whether peptide therapy, PRP, IVs, or other tools can support your recovery.</p>
        </div>
      </section>

      {/* What's Included */}
      <section className="section">
        <div className="container">
          <div className="book-section-center">
            <div className="section-kicker">Your Visit</div>
            <h2 className="section-title">What's Included</h2>
            <p className="section-subtitle">Everything you need to get started with recovery support.</p>

            <div className="included-box">
              <div className="included-left">
                <div className="included-price">$197</div>
                <div className="included-duration">One-on-one consultation</div>
                <span className="included-credit">✓ Credited toward any program</span>
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

            {/* What Happens Next */}
            <div className="next-steps-box">
              <div className="next-steps-kicker">If We Can Help</div>
              <h3>Your Treatment Options</h3>
              <p className="next-steps-intro">Based on your assessment, your provider may recommend one or more of these recovery tools:</p>
              
              <div className="treatment-paths">
                <div className="treatment-path">
                  <span className="path-icon">🧬</span>
                  <span className="path-name">Peptide Protocols</span>
                </div>
                <div className="treatment-path">
                  <span className="path-icon">💉</span>
                  <span className="path-name">PRP Therapy</span>
                </div>
                <div className="treatment-path">
                  <span className="path-icon">💧</span>
                  <span className="path-name">IV Support</span>
                </div>
                <div className="treatment-path">
                  <span className="path-icon">🫁</span>
                  <span className="path-name">HBOT</span>
                </div>
              </div>

              <p className="next-steps-note">Your $197 assessment fee is credited toward any recovery program you start within 7 days. No pressure, no upsells—just an honest evaluation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="booking-section" id="book">
        <div className="container">
          <div className="booking-content">
            <div className="section-kicker">Schedule Now</div>
            <h2 className="section-title">Book Your Assessment</h2>
            <p className="book-subtitle">Review the information below, then select a time that works for you.</p>

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
                <label htmlFor="check6">I understand the <strong>assessment fee is $197</strong>, payable at the clinic. This is credited toward any program I start within 7 days.</label>
              </div>
            </div>

            <button 
              className={`booking-btn ${allChecked ? 'active' : ''}`}
              onClick={handleShowCalendar}
              disabled={!allChecked}
            >
              Continue to Select a Time
            </button>
            <p className="booking-price-note">You'll pay $197 at the clinic when you arrive.</p>

            <div className="info-note">
              <p><strong>Looking for hormone therapy, weight loss, or longevity services?</strong> Those require labs first. <Link href="/book">Book a lab appointment instead →</Link></p>
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
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="book-footer">
        <div className="container">
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" 
            alt="Range Medical" 
          />
          <p className="footer-contact">
            <a href="tel:+19499973988">(949) 997-3988</a>
          </p>
          <p className="footer-address">1901 Westcliff Dr Suite 10, Newport Beach, CA 92660</p>
        </div>
      </footer>

      {/* GHL Form Script */}
      <script src="https://link.range-medical.com/js/form_embed.js" type="text/javascript" async />
    </>
  );
}
