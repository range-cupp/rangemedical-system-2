// /pages/book.js
// Range Assessment Booking Page - Fixed Version
// Range Medical - 2026-01-28

import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Book() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false,
    check5: false,
    check6: false,
  });

  // Check if all boxes are checked
  const allChecked = Object.values(checkboxes).every(Boolean);
  const canProceed = allChecked && selectedReason;

  useEffect(() => {
    if (router.query.reason === 'injury') {
      setSelectedReason('injury');
    } else if (router.query.reason === 'energy') {
      setSelectedReason('energy');
    }
  }, [router.query.reason]);

  // Reset checkboxes when switching between Injury & Energy options
  useEffect(() => {
    if (selectedReason) {
      setCheckboxes({
        check1: false,
        check2: false,
        check3: false,
        check4: false,
        check5: false,
        check6: false,
      });
      setShowCalendar(false);
    }
  }, [selectedReason]);

  const handleCheckboxChange = (id) => {
    setCheckboxes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShowCalendar = () => {
    if (!selectedReason) {
      document.getElementById('reasonSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!allChecked) {
      return;
    }
    setShowCalendar(true);
    setTimeout(() => {
      document.getElementById('calendarSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Injury & Recovery checklist
  const injuryChecklistItems = [
    {
      id: 'check1',
      bold: 'Bring any imaging or medical records related to your injury.',
      text: "MRI, X-ray, or doctor's notes — whatever you have. If you don't have any, that's okay."
    },
    {
      id: 'check2',
      bold: 'Know your injury timeline.',
      text: "When it happened, what you've tried, and how it's affecting you today."
    },
    {
      id: 'check3',
      bold: "We'll discuss recovery options tailored to your situation.",
      text: 'This may include peptide therapy, PRP, exosome therapy, hyperbaric oxygen, IV support, or other modalities — depending on what fits.'
    },
    {
      id: 'check4',
      bold: 'This is a consultation to build your plan.',
      text: 'You\'ll leave with clear next steps, not a "wait and see" answer.'
    },
    {
      id: 'check5',
      bold: "If you're coming to the clinic,",
      text: 'arrive 5 minutes early with a valid ID.'
    },
    {
      id: 'check6',
      bold: 'The assessment fee is $199,',
      text: 'payable at the clinic. This is credited toward any program.'
    }
  ];

  // Energy & Optimization checklist
  const energyChecklistItems = [
    {
      id: 'check1',
      bold: 'Bring any lab work from the past year if you have it.',
      text: "We'll review it together. If you don't have any, that's okay — we can order what's needed."
    },
    {
      id: 'check2',
      bold: 'Think about your main symptoms.',
      text: "Fatigue, brain fog, weight changes, low motivation, poor sleep, low drive — anything that doesn't feel right."
    },
    {
      id: 'check3',
      bold: "We'll explore options based on your symptoms and labs.",
      text: 'This may include hormone optimization, medical weight loss, peptide therapy, IV therapy, or other programs — depending on what your body needs.'
    },
    {
      id: 'check4',
      bold: 'This is a consultation to build your plan.',
      text: 'You\'ll leave with clear next steps, not a "wait and see" answer.'
    },
    {
      id: 'check5',
      bold: "If you're coming to the clinic,",
      text: 'arrive 5 minutes early with a valid ID.'
    },
    {
      id: 'check6',
      bold: 'The assessment fee is $199,',
      text: 'payable at the clinic. This is credited toward any program, including labs.'
    }
  ];

  // Get the appropriate checklist based on selected reason
  const checklistItems = selectedReason === 'injury' ? injuryChecklistItems : energyChecklistItems;

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

      <div className="book-page">
        {/* Hero */}
        <section className="book-hero">
          <div className="book-container">
            <div className="hero-badge">One Product, One Price</div>
            <h1>Book Your Range Assessment</h1>
            <p>One visit to understand your situation and build a clear plan.</p>
            <div className="hero-price">
              <span className="price">$199</span>
              <span className="price-note">Credited toward any program</span>
            </div>
          </div>
        </section>

        {/* Step 1: Reason */}
        <section className="book-section" id="reasonSection">
          <div className="book-container">
            <div className="step-header">
              <span className={`step-number ${selectedReason ? 'complete' : ''}`}>
                {selectedReason ? '✓' : '1'}
              </span>
              <div>
                <h2>What Brings You In?</h2>
                <p>This helps us focus your visit on what matters most.</p>
              </div>
            </div>

            <div className="reason-cards">
              <button 
                className={`reason-card ${selectedReason === 'injury' ? 'selected' : ''}`}
                onClick={() => setSelectedReason('injury')}
              >
                <div className="reason-icon">🩹</div>
                <div className="reason-text">
                  <h3>Injury & Recovery</h3>
                  <p>I'm rehabbing an injury and healing feels slow. I want to speed things up.</p>
                </div>
                <div className={`reason-indicator ${selectedReason === 'injury' ? 'checked' : ''}`}>
                  {selectedReason === 'injury' && <span className="check">✓</span>}
                </div>
              </button>

              <button 
                className={`reason-card ${selectedReason === 'energy' ? 'selected' : ''}`}
                onClick={() => setSelectedReason('energy')}
              >
                <div className="reason-icon">⚡</div>
                <div className="reason-text">
                  <h3>Energy & Optimization</h3>
                  <p>I'm tired, foggy, or just don't feel like myself. I want answers and a plan.</p>
                </div>
                <div className={`reason-indicator ${selectedReason === 'energy' ? 'checked' : ''}`}>
                  {selectedReason === 'energy' && <span className="check">✓</span>}
                </div>
              </button>
            </div>

            {selectedReason && (
              <div className="reason-confirmed">
                ✓ {selectedReason === 'injury' 
                  ? "We'll focus your Range Assessment on your injury and recovery goals."
                  : "We'll focus your Range Assessment on your energy, health, and optimization goals."}
              </div>
            )}
          </div>
        </section>

        {/* What's Included */}
        <section className="book-section section-dark">
          <div className="book-container">
            <div className="included-grid">
              <div className="included-price-box">
                <div className="price-amount">$199</div>
                <div className="price-duration">20–30 minute visit</div>
                <div className="price-credit">✓ Credited toward any program</div>
              </div>
              <div className="included-features">
                <h3>Your Assessment Includes</h3>
                <ul>
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

        {/* Step 2: Confirm */}
        <section className="book-section">
          <div className="book-container">
            <div className="step-header">
              <span className={`step-number ${allChecked ? 'complete' : ''}`}>
                {allChecked ? '✓' : '2'}
              </span>
              <div>
                <h2>Before Your Visit</h2>
                <p>Please confirm you understand the following:</p>
              </div>
            </div>

            <div className="checklist">
              {checklistItems.map((item) => (
                <label key={item.id} className={`checklist-item ${checkboxes[item.id] ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checkboxes[item.id]}
                    onChange={() => handleCheckboxChange(item.id)}
                  />
                  <span className="checkbox-visual">
                    {checkboxes[item.id] && <span>✓</span>}
                  </span>
                  <span className="checkbox-text">
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </label>
              ))}
            </div>

            {/* Status Message */}
            {!canProceed && (
              <div className="status-message">
                {!selectedReason && <span>↑ Please select what brings you in (Step 1)</span>}
                {selectedReason && !allChecked && <span>Please check all boxes above to continue</span>}
              </div>
            )}

            <div className="book-cta">
              <button
                className={`book-button ${canProceed ? 'ready' : ''}`}
                onClick={handleShowCalendar}
                disabled={!canProceed}
              >
                {canProceed ? 'Continue to Select a Time' : 'Complete the steps above to continue'}
              </button>
              <p className="cta-note">You'll pay $199 at the clinic when you arrive.</p>
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        {showCalendar && (
          <section className="book-section calendar-section" id="calendarSection">
            <div className="book-container">
              <div className="step-header">
                <span className="step-number complete">3</span>
                <div>
                  <h2>Select a Time</h2>
                  <p>Choose a time that works best for you.</p>
                </div>
              </div>

              <div className="calendar-wrapper">
                <iframe
                  src="https://link.range-medical.com/booking/range-medical/sv/69769eed725303dcad0eb2da?heightMode=fixed&showHeader=true"
                  style={{ width: '100%', border: 'none', overflow: 'hidden' }}
                  scrolling="yes"
                  id="69769eed725303dcad0eb2da_1769970263180"
                  title="Book your Range Assessment"
                />
                <Script
                  src="https://link.range-medical.com/js/form_embed.js"
                  strategy="afterInteractive"
                />
              </div>
            </div>
          </section>
        )}

        {/* Questions */}
        <section className="book-section section-cta">
          <div className="book-container">
            <h2>Questions?</h2>
            <p>Call or text us anytime. We're happy to help.</p>
            <a href="tel:+19499973988" className="phone-button">
              (949) 997-3988
            </a>
            <p className="location">📍 1901 Westcliff Dr, Newport Beach</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .book-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .book-container {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero */
        .book-hero {
          background: #000;
          color: #fff;
          padding: 80px 24px;
          text-align: center;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
        }

        .book-hero h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 16px;
          letter-spacing: -1px;
          color: #fff;
        }

        .book-hero p {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 32px;
        }

        .hero-price {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.1);
          padding: 16px 32px;
          border-radius: 12px;
        }

        .hero-price .price {
          font-size: 32px;
          font-weight: 700;
        }

        .hero-price .price-note {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
        }

        /* Sections */
        .book-section {
          padding: 64px 24px;
        }

        .section-dark {
          background: #f8f9fa;
        }

        .section-cta {
          background: #000;
          color: #fff;
          text-align: center;
        }

        /* Step Header */
        .step-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 32px;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .step-number.complete {
          background: #22c55e;
        }

        .step-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #111;
        }

        .step-header p {
          font-size: 16px;
          color: #666;
          margin: 0;
        }

        /* Reason Cards */
        .reason-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reason-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px;
          background: #fff;
          border: 2px solid #e5e5e5;
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          width: 100%;
        }

        .reason-card:hover {
          border-color: #999;
        }

        .reason-card.selected {
          border-color: #000;
          background: #fafafa;
        }

        .reason-icon {
          width: 48px;
          height: 48px;
          background: #f5f5f5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .reason-card.selected .reason-icon {
          background: #000;
        }

        .reason-text {
          flex: 1;
        }

        .reason-text h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px;
          color: #111;
        }

        .reason-text p {
          font-size: 15px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        .reason-indicator {
          width: 28px;
          height: 28px;
          border: 2px solid #e5e5e5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .reason-indicator.checked {
          background: #22c55e;
          border-color: #22c55e;
        }

        .reason-indicator .check {
          color: #fff;
          font-weight: 700;
          font-size: 14px;
        }

        .reason-confirmed {
          margin-top: 24px;
          padding: 16px 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          color: #166534;
          font-weight: 500;
          font-size: 15px;
        }

        /* Included Grid */
        .included-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 32px;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .included-price-box {
          background: #000;
          color: #fff;
          padding: 40px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .price-amount {
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
        }

        .price-duration {
          font-size: 16px;
          color: rgba(255,255,255,0.6);
          margin: 8px 0 20px;
        }

        .price-credit {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
        }

        .included-features {
          padding: 40px 32px;
        }

        .included-features h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
          color: #111;
        }

        .included-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .included-features li {
          padding: 10px 0;
          padding-left: 28px;
          position: relative;
          font-size: 15px;
          color: #444;
          border-bottom: 1px solid #f0f0f0;
        }

        .included-features li:last-child {
          border-bottom: none;
        }

        .included-features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000;
          font-weight: 700;
        }

        /* Checklist */
        .checklist {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: #fff;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checklist-item:hover {
          border-color: #ccc;
        }

        .checklist-item.checked {
          border-color: #22c55e;
          background: #f0fdf4;
        }

        .checklist-item input {
          display: none;
        }

        .checkbox-visual {
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        .checklist-item.checked .checkbox-visual {
          background: #22c55e;
          border-color: #22c55e;
        }

        .checkbox-text {
          font-size: 15px;
          color: #333;
          line-height: 1.5;
        }

        .checkbox-text strong {
          color: #111;
        }

        /* Status Message */
        .status-message {
          margin-top: 24px;
          padding: 16px 20px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          color: #92400e;
          font-weight: 500;
          font-size: 15px;
          text-align: center;
        }

        /* Book CTA */
        .book-cta {
          margin-top: 32px;
          text-align: center;
        }

        .book-button {
          width: 100%;
          max-width: 400px;
          padding: 18px 32px;
          font-size: 17px;
          font-weight: 600;
          background: #d1d5db;
          color: #6b7280;
          border: none;
          border-radius: 12px;
          cursor: not-allowed;
          transition: all 0.2s;
        }

        .book-button.ready {
          background: #000;
          color: #fff;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .book-button.ready:hover {
          background: #222;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .cta-note {
          margin-top: 16px;
          font-size: 14px;
          color: #666;
        }

        /* Calendar Section */
        .calendar-section {
          background: #f8f9fa;
        }

        .calendar-wrapper {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .calendar-wrapper iframe {
          display: block;
          min-height: 600px;
        }

        /* Final CTA */
        .section-cta h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #fff;
        }

        .section-cta > .book-container > p {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 24px;
        }

        .phone-button {
          display: inline-block;
          padding: 16px 40px;
          background: #fff;
          color: #000;
          font-size: 18px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .phone-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        }

        .location {
          margin-top: 24px;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
        }

        /* Mobile */
        @media (max-width: 640px) {
          .book-hero {
            padding: 60px 24px;
          }

          .book-hero h1 {
            font-size: 32px;
          }

          .hero-price {
            flex-direction: column;
            gap: 8px;
            padding: 20px 32px;
          }

          .step-header {
            flex-direction: column;
            gap: 12px;
          }

          .step-header h2 {
            font-size: 24px;
          }

          .included-grid {
            grid-template-columns: 1fr;
          }

          .included-price-box {
            padding: 32px 24px;
          }

          .included-features {
            padding: 32px 24px;
          }

          .price-amount {
            font-size: 40px;
          }

          .checklist-item {
            padding: 16px;
          }

          .checkbox-text {
            font-size: 14px;
          }
        }
      `}</style>
    </Layout>
  );
}
