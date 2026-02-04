import Layout from '../components/Layout';
import Head from 'next/head';
import Script from 'next/script';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Book() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [checkboxes, setCheckboxes] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false,
    check5: false,
    check6: false,
  });

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );

    const sections = document.querySelectorAll('.book-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  // Check if all boxes are checked
  const allChecked = Object.values(checkboxes).every(Boolean);
  const canProceed = allChecked && selectedReason;

  useEffect(() => {
    if (router.query.reason === 'injury') {
      setSelectedReason('injury');
    } else if (router.query.reason === 'energy') {
      setSelectedReason('energy');
    } else if (router.query.reason === 'both') {
      setSelectedReason('both');
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
      bold: 'This assessment is to build your plan.',
      text: 'You\'ll leave with clear next steps, not a "wait and see" answer.'
    },
    {
      id: 'check5',
      bold: "If you're coming to the clinic,",
      text: 'arrive 5 minutes early with a valid ID.'
    },
    {
      id: 'check6',
      bold: 'The assessment fee is free,',
      text: 'payable at the clinic. This is credited toward any program.'
    }
  ];

  // Energy & Optimization checklist
  const energyChecklistItems = [
    {
      id: 'check1',
      bold: 'Email any lab work from the past year to info@range-medical.com.',
      text: "We'll review it before your assessment. If you don't have any, that's okay — we can order what's needed."
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
      bold: 'This assessment is to build your plan.',
      text: 'You\'ll leave with clear next steps, not a "wait and see" answer.'
    },
    {
      id: 'check5',
      bold: "If you're coming to the clinic,",
      text: 'arrive 5 minutes early with a valid ID.'
    },
    {
      id: 'check6',
      bold: 'The assessment fee is free,',
      text: 'payable at the clinic. This is credited toward any program, including labs.'
    }
  ];

  // Both checklist (consolidated)
  const bothChecklistItems = [
    {
      id: 'check1',
      bold: 'Bring any labs, imaging, or medical records from the past year.',
      text: "Blood work, MRI, X-rays, doctor's notes — whatever you have. If you don't have any, that's okay."
    },
    {
      id: 'check2',
      bold: "Think about what's bothering you most.",
      text: "Your injury, your energy levels, weight changes, sleep, motivation — we'll cover all of it."
    },
    {
      id: 'check3',
      bold: "We'll discuss the full range of options available to you.",
      text: 'From PRP and peptide therapy for recovery, to hormone optimization and weight loss programs — whatever fits your situation.'
    },
    {
      id: 'check4',
      bold: 'This assessment is to build your plan.',
      text: 'You\'ll leave with clear next steps, not a "wait and see" answer.'
    },
    {
      id: 'check5',
      bold: "If you're coming to the clinic,",
      text: 'arrive 5 minutes early with a valid ID.'
    },
    {
      id: 'check6',
      bold: 'The assessment fee is free,',
      text: 'payable at the clinic. This is credited toward any program, including labs.'
    }
  ];

  // Get the appropriate checklist based on selected reason
  const checklistItems = selectedReason === 'injury'
    ? injuryChecklistItems
    : selectedReason === 'both'
      ? bothChecklistItems
      : energyChecklistItems;

  return (
    <>
      <Head>
        <title>Book Your Range Assessment | Range Medical | Newport Beach</title>
        <meta name="description" content="Schedule your Range Assessment at Range Medical in Newport Beach. One visit to understand your situation and build a clear plan. free, credited toward any program." />
        <meta name="keywords" content="book assessment Newport Beach, wellness consultation, injury recovery consultation, energy optimization, hormone consultation, Range Medical appointment" />
        <link rel="canonical" href="https://www.range-medical.com/book" />

        <meta property="og:title" content="Book Your Range Assessment | Range Medical" />
        <meta property="og:description" content="Schedule your Range Assessment at Range Medical in Newport Beach. One visit to understand your situation and build a clear plan. free." />
        <meta property="og:url" content="https://www.range-medical.com/book" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-book.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book Your Range Assessment | Range Medical" />
        <meta name="twitter:description" content="Schedule your Range Assessment. One visit to understand your situation and build a clear plan. free." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-book.jpg" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "description": "Medical wellness clinic specializing in injury recovery and health optimization.",
              "url": "https://www.range-medical.com",
              "telephone": "+1-949-997-3988",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr, Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 33.6189,
                "longitude": -117.9298
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              },
              "priceRange": "$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "50"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Medical Consultation",
              "name": "Range Assessment",
              "description": "A comprehensive 20-30 minute consultation to review symptoms, discuss goals, and create a personalized treatment plan.",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical"
              },
              "offers": {
                "@type": "Offer",
                "price": "199",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "areaServed": {
                "@type": "City",
                "name": "Newport Beach"
              }
            })
          }}
        />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="book-hero">
          <div className="book-hero-inner">
            <span className="book-category">Start Here</span>
            <h1>Book Your Range Assessment</h1>
            <p className="book-hero-sub">
              One visit to understand your situation and build a clear plan.
            </p>
            <div className="book-hero-stats">
              <div className="book-stat">
                <span className="book-stat-value">free</span>
                <span className="book-stat-label">Assessment Fee</span>
              </div>
              <div className="book-stat">
                <span className="book-stat-value">20-30</span>
                <span className="book-stat-label">Minute Visit</span>
              </div>
              <div className="book-stat">
                <span className="book-stat-value">100%</span>
                <span className="book-stat-label">Credited to Treatment</span>
              </div>
            </div>
          </div>
        </section>

        {/* Step 1: Reason */}
        <section id="book-reason" className={`book-section book-animate ${isVisible['book-reason'] ? 'book-visible' : ''}`}>
          <div className="book-container" id="reasonSection">
            <div className="book-step-header">
              <span className={`book-step-number ${selectedReason ? 'complete' : ''}`}>
                {selectedReason ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : '1'}
              </span>
              <div>
                <h2>What Brings You In?</h2>
                <p>This helps us focus your visit on what matters most.</p>
              </div>
            </div>

            <div className="book-reason-cards">
              <button
                className={`book-reason-card ${selectedReason === 'injury' ? 'selected' : ''}`}
                onClick={() => setSelectedReason('injury')}
              >
                <div className="book-reason-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="book-reason-text">
                  <h3>Injury & Recovery</h3>
                  <p>I'm rehabbing an injury and healing feels slow. I want to speed things up.</p>
                </div>
                <div className={`book-reason-indicator ${selectedReason === 'injury' ? 'checked' : ''}`}>
                  {selectedReason === 'injury' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>

              <button
                className={`book-reason-card ${selectedReason === 'energy' ? 'selected' : ''}`}
                onClick={() => setSelectedReason('energy')}
              >
                <div className="book-reason-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div className="book-reason-text">
                  <h3>Energy & Optimization</h3>
                  <p>I'm tired, foggy, or just don't feel like myself. I want answers and a plan.</p>
                </div>
                <div className={`book-reason-indicator ${selectedReason === 'energy' ? 'checked' : ''}`}>
                  {selectedReason === 'energy' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            </div>

            <div className="book-reason-both-section">
              <p className="book-both-label">Dealing with both?</p>
              <button
                className={`book-reason-card book-reason-card-both ${selectedReason === 'both' ? 'selected' : ''}`}
                onClick={() => setSelectedReason('both')}
              >
                <div className="book-reason-icon book-reason-icon-both">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div className="book-reason-text">
                  <h3>Both</h3>
                  <p>I have an injury AND I want to optimize my energy, hormones, or weight.</p>
                </div>
                <div className={`book-reason-indicator ${selectedReason === 'both' ? 'checked' : ''}`}>
                  {selectedReason === 'both' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {selectedReason && (
              <div className="book-reason-confirmed">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>
                  {selectedReason === 'injury'
                    ? "We'll focus your Range Assessment on your injury and recovery goals."
                    : selectedReason === 'both'
                      ? "We'll cover both your injury recovery AND your energy, health, and optimization goals."
                      : "We'll focus your Range Assessment on your energy, health, and optimization goals."}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* What's Included */}
        <section id="book-included" className={`book-section-alt book-animate ${isVisible['book-included'] ? 'book-visible' : ''}`}>
          <div className="book-container">
            <div className="book-included-grid">
              <div className="book-included-price-box">
                <div className="book-price-amount">free</div>
                <div className="book-price-duration">20–30 minute visit</div>
                <div className="book-price-credit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Credited toward any program
                </div>
              </div>
              <div className="book-included-features">
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

        {/* Step 2: Checklist */}
        <section id="book-checklist" className={`book-section book-animate ${isVisible['book-checklist'] ? 'book-visible' : ''}`}>
          <div className="book-container">
            <div className="book-step-header">
              <span className={`book-step-number ${allChecked ? 'complete' : ''}`}>
                {allChecked ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : '2'}
              </span>
              <div>
                <h2>Before Your Visit</h2>
                <p>Please confirm you understand the following:</p>
              </div>
            </div>

            <div className="book-checklist">
              {checklistItems.map((item) => (
                <label key={item.id} className={`book-checklist-item ${checkboxes[item.id] ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checkboxes[item.id]}
                    onChange={() => handleCheckboxChange(item.id)}
                  />
                  <span className="book-checkbox-visual">
                    {checkboxes[item.id] && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  <span className="book-checkbox-text">
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </label>
              ))}
            </div>

            {/* Status Message */}
            {!canProceed && (
              <div className="book-status-message">
                {!selectedReason && (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    <span>Please select what brings you in (Step 1)</span>
                  </>
                )}
                {selectedReason && !allChecked && (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>Please check all boxes above to continue</span>
                  </>
                )}
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
              <p className="book-cta-note">You'll pay free at the clinic when you arrive.</p>
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        {showCalendar && (
          <section className="book-section-alt book-calendar-section" id="calendarSection">
            <div className="book-container">
              <div className="book-step-header">
                <span className="book-step-number complete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <h2>Select a Time</h2>
                  <p>Choose a time that works best for you.</p>
                </div>
              </div>

              <div className="book-calendar-wrapper">
                <iframe
                  src={`https://link.range-medical.com/booking/range-medical/sv/69769eed725303dcad0eb2da?heightMode=fixed&showHeader=true&reason=${selectedReason === 'injury' ? 'injury-recovery' : selectedReason === 'both' ? 'both' : 'energy-optimization'}`}
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

        {/* Questions Section */}
        <section className="book-section-inverted">
          <div className="book-container">
            <span className="book-section-label-light">Need Help?</span>
            <h2>Questions?</h2>
            <p className="book-cta-text">Call or text us anytime. We're happy to help.</p>
            <a href="tel:+19499973988" className="book-btn-white">
              (949) 997-3988
            </a>
            <p className="book-cta-location">
              Range Medical • 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>

        <style jsx>{`
          /* Hero Section */
          .book-hero {
            background: linear-gradient(135deg, #000000 0%, #171717 100%);
            padding: 5rem 1.5rem;
          }

          .book-hero-inner {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }

          .book-category {
            display: inline-block;
            background: rgba(255,255,255,0.1);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 0.375rem 0.875rem;
            border-radius: 100px;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(255,255,255,0.2);
          }

          .book-hero h1 {
            font-size: 2.75rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.15;
            margin: 0 0 1rem;
          }

          .book-hero-sub {
            font-size: 1.125rem;
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
            margin: 0 0 2.5rem;
          }

          .book-hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
          }

          .book-stat {
            text-align: center;
          }

          .book-stat-value {
            display: block;
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1;
          }

          .book-stat-label {
            font-size: 0.8125rem;
            color: rgba(255,255,255,0.5);
            margin-top: 0.375rem;
            display: block;
          }

          /* Section Styles */
          .book-section {
            padding: 5rem 1.5rem;
            background: #ffffff;
          }

          .book-section-alt {
            padding: 5rem 1.5rem;
            background: #fafafa;
          }

          .book-section-inverted {
            padding: 5rem 1.5rem;
            background: #000000;
            text-align: center;
          }

          .book-section-inverted h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 0.75rem;
          }

          .book-container {
            max-width: 720px;
            margin: 0 auto;
          }

          .book-section-label-light {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #a3a3a3;
            margin-bottom: 0.75rem;
          }

          /* Animation */
          .book-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
          }

          .book-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Step Header */
          .book-step-header {
            display: flex;
            align-items: flex-start;
            gap: 1.25rem;
            margin-bottom: 2rem;
          }

          .book-step-number {
            width: 44px;
            height: 44px;
            min-width: 44px;
            background: #000000;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.125rem;
            transition: all 0.3s;
          }

          .book-step-number.complete {
            background: #22c55e;
          }

          .book-step-header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.25rem;
          }

          .book-step-header p {
            font-size: 1rem;
            color: #525252;
            margin: 0;
          }

          /* Reason Cards */
          .book-reason-cards {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .book-reason-card {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            background: #ffffff;
            border: 2px solid #e5e5e5;
            border-radius: 12px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            width: 100%;
            font-family: inherit;
          }

          .book-reason-card:hover {
            border-color: #d4d4d4;
          }

          .book-reason-card.selected {
            border-color: #000000;
            background: #fafafa;
          }

          .book-reason-icon {
            width: 52px;
            height: 52px;
            background: #f5f5f5;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #525252;
            transition: all 0.2s;
          }

          .book-reason-icon-both {
            gap: 0.25rem;
          }

          .book-reason-icon-both svg {
            width: 20px;
            height: 20px;
          }

          .book-reason-card.selected .book-reason-icon {
            background: #000000;
            color: #ffffff;
          }

          .book-reason-text {
            flex: 1;
          }

          .book-reason-text h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #171717;
            margin: 0 0 0.25rem;
          }

          .book-reason-text p {
            font-size: 0.9375rem;
            color: #525252;
            margin: 0;
            line-height: 1.5;
          }

          .book-reason-indicator {
            width: 28px;
            height: 28px;
            border: 2px solid #e5e5e5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
            color: #ffffff;
          }

          .book-reason-indicator.checked {
            background: #22c55e;
            border-color: #22c55e;
          }

          .book-reason-both-section {
            margin-top: 1.5rem;
            text-align: center;
          }

          .book-both-label {
            font-size: 0.875rem;
            color: #737373;
            margin-bottom: 0.75rem;
          }

          .book-reason-card-both {
            max-width: 100%;
          }

          .book-reason-confirmed {
            margin-top: 1.5rem;
            padding: 1rem 1.25rem;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            color: #166534;
            font-weight: 500;
            font-size: 0.9375rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          /* Included Grid */
          .book-included-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          }

          .book-included-price-box {
            background: #000000;
            color: #ffffff;
            padding: 2.5rem 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 200px;
          }

          .book-price-amount {
            font-size: 3rem;
            font-weight: 700;
            line-height: 1;
          }

          .book-price-duration {
            font-size: 0.9375rem;
            color: rgba(255,255,255,0.6);
            margin: 0.5rem 0 1.25rem;
          }

          .book-price-credit {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.15);
            padding: 0.5rem 1rem;
            border-radius: 100px;
            font-size: 0.8125rem;
            font-weight: 500;
          }

          .book-included-features {
            padding: 2.5rem 2rem;
          }

          .book-included-features h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1.25rem;
          }

          .book-included-features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .book-included-features li {
            padding: 0.625rem 0 0.625rem 1.75rem;
            position: relative;
            font-size: 0.9375rem;
            color: #404040;
            border-bottom: 1px solid #f5f5f5;
          }

          .book-included-features li:last-child {
            border-bottom: none;
          }

          .book-included-features li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #22c55e;
            font-weight: 700;
          }

          /* Checklist */
          .book-checklist {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .book-checklist-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
            background: #ffffff;
            border: 2px solid #e5e5e5;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .book-checklist-item:hover {
            border-color: #d4d4d4;
          }

          .book-checklist-item.checked {
            border-color: #22c55e;
            background: #f0fdf4;
          }

          .book-checklist-item input {
            display: none;
          }

          .book-checkbox-visual {
            width: 24px;
            height: 24px;
            min-width: 24px;
            border: 2px solid #d4d4d4;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: #ffffff;
          }

          .book-checklist-item.checked .book-checkbox-visual {
            background: #22c55e;
            border-color: #22c55e;
          }

          .book-checkbox-text {
            font-size: 0.9375rem;
            color: #404040;
            line-height: 1.5;
          }

          .book-checkbox-text strong {
            color: #171717;
          }

          /* Status Message */
          .book-status-message {
            margin-top: 1.5rem;
            padding: 1rem 1.25rem;
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 12px;
            color: #92400e;
            font-weight: 500;
            font-size: 0.9375rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.625rem;
          }

          /* Book CTA */
          .book-cta {
            margin-top: 2rem;
            text-align: center;
          }

          .book-button {
            width: 100%;
            max-width: 400px;
            padding: 1.125rem 2rem;
            font-size: 1.0625rem;
            font-weight: 600;
            background: #d4d4d4;
            color: #737373;
            border: none;
            border-radius: 8px;
            cursor: not-allowed;
            transition: all 0.2s;
            font-family: inherit;
          }

          .book-button.ready {
            background: #000000;
            color: #ffffff;
            cursor: pointer;
          }

          .book-button.ready:hover {
            background: #333333;
          }

          .book-cta-note {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #737373;
          }

          /* Calendar Section */
          .book-calendar-section {
            background: #fafafa;
          }

          .book-calendar-wrapper {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            overflow: hidden;
          }

          .book-calendar-wrapper iframe {
            display: block;
            min-height: 600px;
          }

          /* CTA Section */
          .book-cta-text {
            font-size: 1.0625rem;
            color: #a3a3a3;
            margin: 0 0 1.5rem;
          }

          .book-btn-white {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            padding: 1rem 2.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.125rem;
            text-decoration: none;
            transition: all 0.2s;
          }

          .book-btn-white:hover {
            background: #f5f5f5;
          }

          .book-cta-location {
            margin-top: 1.5rem;
            font-size: 0.9375rem;
            color: #737373;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .book-hero h1 {
              font-size: 2rem;
            }

            .book-hero-stats {
              flex-direction: column;
              gap: 1.5rem;
            }

            .book-step-header {
              flex-direction: column;
              gap: 0.75rem;
            }

            .book-step-header h2 {
              font-size: 1.5rem;
            }

            .book-included-grid {
              grid-template-columns: 1fr;
            }

            .book-included-price-box {
              padding: 2rem;
            }

            .book-price-amount {
              font-size: 2.5rem;
            }

            .book-included-features {
              padding: 2rem;
            }

            .book-reason-card {
              padding: 1.25rem;
            }

            .book-checklist-item {
              padding: 1rem;
            }

            .book-checkbox-text {
              font-size: 0.875rem;
            }
          }

          @media (max-width: 480px) {
            .book-hero {
              padding: 3.5rem 1.5rem;
            }

            .book-section,
            .book-section-alt,
            .book-section-inverted {
              padding: 3.5rem 1.5rem;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
