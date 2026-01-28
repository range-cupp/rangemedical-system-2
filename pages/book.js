import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Book() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
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

  // Pre-select reason based on URL parameter
  useEffect(() => {
    if (router.query.reason === 'injury') {
      setSelectedReason('injury');
    } else if (router.query.reason === 'energy') {
      setSelectedReason('energy');
    }
  }, [router.query.reason]);

  const handleCheckboxChange = (id) => {
    const newCheckboxes = { ...checkboxes, [id]: !checkboxes[id] };
    setCheckboxes(newCheckboxes);
    setAllChecked(Object.values(newCheckboxes).every(Boolean));
  };

  const handleShowCalendar = () => {
    if (!selectedReason) {
      alert('Please select what brings you in today.');
      return;
    }
    if (!allChecked) {
      alert('Please confirm all items before booking.');
      return;
    }
    setShowCalendar(true);
    setTimeout(() => {
      document.getElementById('calendarContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const reasonContent = {
    injury: {
      focus: "We'll focus your Range Assessment on your injury and recovery goals.",
      checkLabel: "This is a consultation to build your recovery plan.",
    },
    energy: {
      focus: "We'll focus your Range Assessment on your energy, health, and optimization goals.",
      checkLabel: "This is a consultation to build your plan.",
    }
  };

  return (
    <Layout 
      title="Book Your Range Assessment | Range Medical | Newport Beach"
      description="Schedule your Range Assessment at Range Medical in Newport Beach. One visit to understand your situation and build a clear plan. $199."
    >
      <Head>
        <meta name="keywords" content="book assessment Newport Beach, wellness consultation, injury recovery, energy optimization, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/book" />
        <meta property="og:title" content="Book Your Range Assessment | Range Medical" />
        <meta property="og:description" content="Schedule your Range Assessment at Range Medical in Newport Beach. $199." />
        <meta property="og:url" content="https://www.range-medical.com/book" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ 30-45 Minute Visit</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">One Product, One Price</span>
          <h1>Book Your Range Assessment</h1>
          <p className="hero-sub">One visit to understand your situation and build a clear plan. $199, credited toward any program.</p>
        </div>
      </section>

      {/* What Brings You In */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Step 1</div>
          <h2 className="section-title">What Brings You In?</h2>
          <p className="section-subtitle">This helps us focus your visit on what matters most to you.</p>

          <div className="reason-selector">
            <button 
              className={`reason-option ${selectedReason === 'injury' ? 'selected' : ''}`}
              onClick={() => setSelectedReason('injury')}
            >
              <span className="reason-icon">✎</span>
              <div className="reason-content">
                <h4>Injury & Recovery</h4>
                <p>I'm rehabbing an injury and healing feels slow. I want to speed things up.</p>
              </div>
              <span className="reason-check">{selectedReason === 'injury' ? '✓' : ''}</span>
            </button>

            <button 
              className={`reason-option ${selectedReason === 'energy' ? 'selected' : ''}`}
              onClick={() => setSelectedReason('energy')}
            >
              <span className="reason-icon">⚡</span>
              <div className="reason-content">
                <h4>Energy & Optimization</h4>
                <p>I'm tired, foggy, or just don't feel like myself. I want answers and a plan.</p>
              </div>
              <span className="reason-check">{selectedReason === 'energy' ? '✓' : ''}</span>
            </button>
          </div>

          {selectedReason && (
            <div className="reason-confirmation">
              <p>✓ {reasonContent[selectedReason].focus}</p>
            </div>
          )}
        </div>
      </section>

      {/* What's Included */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What You Get</div>
          <h2 className="section-title">Your Range Assessment Includes</h2>

          <div className="included-box">
            <div className="included-left">
              <div className="included-price">$199</div>
              <div className="included-duration">30–45 minute visit</div>
              <span className="included-credit">✓ Credited toward any program</span>
            </div>
            <div className="included-right">
              <ul className="included-list">
                <li>Review of your symptoms and history</li>
                <li>Discussion of your goals</li>
                <li>Explanation of any labs you bring</li>
                <li>Clear program recommendation</li>
                <li>Written plan and next steps</li>
                <li>No pressure to buy anything</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="section" id="book">
        <div className="container">
          <div className="section-kicker">Step 2</div>
          <h2 className="section-title">Confirm & Select a Time</h2>
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
              <label htmlFor="check3"><strong>Bring any labs or records from the past year if you have them.</strong> We'll review them together. If you don't have any, that's okay.</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="check4"
                checked={checkboxes.check4}
                onChange={() => handleCheckboxChange('check4')}
              />
              <label htmlFor="check4"><strong>{selectedReason ? reasonContent[selectedReason].checkLabel : "This is a consultation to build your plan."}</strong> You'll leave with clear next steps, not a "wait and see" answer.</label>
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
              <label htmlFor="check6">I understand the <strong>assessment fee is $199</strong>, payable at the clinic. This is credited toward any program, including labs.</label>
            </div>
          </div>

          <div className="booking-cta-area">
            <button 
              className={`btn-primary booking-btn ${(allChecked && selectedReason) ? 'active' : ''}`}
              onClick={handleShowCalendar}
              disabled={!allChecked || !selectedReason}
            >
              Continue to Select a Time
            </button>
            <p className="booking-price-note">You'll pay $199 at the clinic when you arrive.</p>
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
          <h2>Questions?</h2>
          <p>Call or text us anytime. We're happy to help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">
              (949) 997-3988
            </a>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      {/* GHL Form Script */}
      <script src="https://link.range-medical.com/js/form_embed.js" type="text/javascript" async />

      <style jsx>{`
        .reason-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 600px;
          margin: 2rem auto 0;
        }

        .reason-option {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: #ffffff;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .reason-option:hover {
          border-color: #a3a3a3;
        }

        .reason-option.selected {
          border-color: #000000;
          background: #fafafa;
        }

        .reason-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .reason-option.selected .reason-icon {
          background: #000000;
          color: #ffffff;
        }

        .reason-content {
          flex: 1;
        }

        .reason-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: #171717;
        }

        .reason-content p {
          font-size: 0.9375rem;
          color: #525252;
          margin: 0;
          line-height: 1.5;
        }

        .reason-check {
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
          width: 24px;
          text-align: center;
        }

        .reason-confirmation {
          max-width: 600px;
          margin: 1.5rem auto 0;
          padding: 1rem 1.5rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          text-align: center;
        }

        .reason-confirmation p {
          margin: 0;
          color: #166534;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        .included-box {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 16px;
          padding: 2rem;
          max-width: 800px;
          margin: 2rem auto 0;
        }

        .included-left {
          text-align: center;
          padding: 1rem;
          border-right: 1px solid #e5e5e5;
        }

        .included-price {
          font-size: 3rem;
          font-weight: 700;
          color: #171717;
          line-height: 1;
        }

        .included-duration {
          font-size: 1rem;
          color: #525252;
          margin: 0.5rem 0 1rem;
        }

        .included-credit {
          display: inline-block;
          background: #f5f5f5;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #404040;
        }

        .included-right h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .included-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .included-list li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          font-size: 0.9375rem;
          color: #404040;
        }

        .included-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000000;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .included-box {
            grid-template-columns: 1fr;
          }

          .included-left {
            border-right: none;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
