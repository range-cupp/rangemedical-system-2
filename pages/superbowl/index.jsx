// /pages/superbowl/index.jsx
// Range Medical Super Bowl LX Giveaway Landing Page
// Created: 2026-02-08

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SuperBowlGiveaway() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    referredBy: '',
    teamPick: '',
    healthInterests: [],
    otherInterest: '',
    smsConsent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const healthOptions = [
    { id: 'energy', label: 'Low energy / fatigue' },
    { id: 'weight', label: 'Weight management' },
    { id: 'hormones', label: 'Hormone optimization' },
    { id: 'sleep', label: 'Better sleep' },
    { id: 'recovery', label: 'Muscle recovery / performance' },
    { id: 'general', label: 'General health check-up' },
    { id: 'brain', label: 'Brain fog / mental clarity' },
    { id: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHealthToggle = (id) => {
    setFormData(prev => {
      const interests = prev.healthInterests.includes(id)
        ? prev.healthInterests.filter(i => i !== id)
        : [...prev.healthInterests, id];
      return { ...prev, healthInterests: interests };
    });
  };

  const handleTeamSelect = (team) => {
    setFormData(prev => ({ ...prev, teamPick: team }));
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Please enter your last name');
      return;
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.teamPick) {
      setError('Please pick a team to win');
      return;
    }
    if (!formData.smsConsent) {
      setError('Please agree to receive text messages to enter');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/superbowl/submit-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone_number: phoneDigits,
          referred_by: formData.referredBy.trim(),
          team_pick: formData.teamPick,
          health_interests: formData.healthInterests,
          other_interest: formData.otherInterest.trim(),
          utm_source: router.query.utm_source || 'instagram',
          sms_consent: formData.smsConsent
        })
      });

      const result = await res.json();

      if (result.success) {
        // Store team pick for thank you page
        sessionStorage.setItem('sbTeamPick', formData.teamPick);
        sessionStorage.setItem('sbFirstName', formData.firstName);
        sessionStorage.setItem('sbReferredBy', formData.referredBy);
        router.push('/superbowl/thanks');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Super Bowl LX Giveaway | Range Medical</title>
        <meta name="description" content="Pick the Super Bowl LX winner and enter to win a FREE Elite Panel Lab Draw valued at $750 from Range Medical. Your referrer wins too!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sb-page">
        {/* Trust Bar */}
        <div className="sb-trust-bar">
          <div className="sb-trust-inner">
            <span className="sb-trust-item">
              <span className="sb-trust-rating">★★★★★</span> 5.0 on Google
            </span>
            <span className="sb-trust-item">Newport Beach, CA</span>
          </div>
        </div>

        {/* Header */}
        <header className="sb-header">
          <Link href="/" className="sb-logo">RANGE MEDICAL</Link>
        </header>

        {/* Hero */}
        <section className="sb-hero">
          <span className="sb-badge">Super Bowl LX Giveaway</span>
          <h1>Win a FREE Elite Panel Lab Draw</h1>
          <p className="sb-value">Valued at $750</p>
          <p className="sb-subtitle">
            Pick the Super Bowl winner. If you're right, you could win our most comprehensive blood panel —
            <strong> and so does the person who referred you!</strong>
          </p>
        </section>

        {/* What You Win */}
        <section className="sb-prize">
          <div className="sb-container">
            <span className="sb-section-label">The Prize</span>
            <h2>Two Winners, One Pick</h2>
            <p className="sb-prize-intro">
              Pick the winning team. If you win, <strong>both you AND your referrer</strong> get a FREE Elite Panel —
              our most comprehensive lab panel.
            </p>

            <div className="sb-biomarkers">
              <div className="sb-biomarker-section">
                <h4>Hormones</h4>
                <ul>
                  <li>Testosterone, Total & Free</li>
                  <li>Estradiol</li>
                  <li>DHEA-S</li>
                  <li>Cortisol</li>
                  <li>SHBG</li>
                  <li>FSH & LH</li>
                  <li>IGF-1</li>
                </ul>
              </div>
              <div className="sb-biomarker-section">
                <h4>Thyroid</h4>
                <ul>
                  <li>TSH</li>
                  <li>T3, Free</li>
                  <li>T4, Total & Free</li>
                  <li>TPO Antibodies</li>
                  <li>Thyroglobulin Antibodies</li>
                </ul>
              </div>
              <div className="sb-biomarker-section">
                <h4>Metabolic</h4>
                <ul>
                  <li>Complete Metabolic Panel</li>
                  <li>HbA1c</li>
                  <li>Insulin, Fasting</li>
                  <li>Lipid Panel</li>
                  <li>Uric Acid</li>
                  <li>GGT</li>
                </ul>
              </div>
              <div className="sb-biomarker-section">
                <h4>Cardiovascular</h4>
                <ul>
                  <li>Apolipoprotein A-1 & B</li>
                  <li>Lipoprotein(a)</li>
                  <li>CRP-HS (Inflammation)</li>
                  <li>Homocysteine</li>
                </ul>
              </div>
              <div className="sb-biomarker-section">
                <h4>Blood & Nutrients</h4>
                <ul>
                  <li>CBC with Differential</li>
                  <li>Iron & TIBC</li>
                  <li>Ferritin</li>
                  <li>Vitamin D, 25-OH</li>
                  <li>Vitamin B-12</li>
                  <li>Folate</li>
                  <li>Magnesium</li>
                </ul>
              </div>
              <div className="sb-biomarker-section">
                <h4>Other</h4>
                <ul>
                  <li>PSA (Men)</li>
                  <li>Progesterone (Women)</li>
                  <li>Sed Rate</li>
                </ul>
              </div>
            </div>

            <div className="sb-prize-highlight">
              <span className="sb-prize-amount">$750</span>
              <span className="sb-prize-each">value each — $1,500 total if you win!</span>
            </div>
          </div>
        </section>

        {/* Entry Form */}
        <section className="sb-form-section">
          <div className="sb-container">
            <form onSubmit={handleSubmit} className="sb-form">
              <h2>Enter the Giveaway</h2>

              {error && <div className="sb-error">{error}</div>}

              <div className="sb-field-row">
                <div className="sb-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>
                <div className="sb-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="sb-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                />
              </div>

              <div className="sb-field">
                <label htmlFor="referredBy">Who referred you? <span className="sb-optional">(optional)</span></label>
                <input
                  type="text"
                  id="referredBy"
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleInputChange}
                  placeholder="Enter their full name"
                  autoComplete="off"
                />
                <p className="sb-field-hint">If you win, they win too! Enter their full name so we can notify them.</p>
              </div>

              <div className="sb-field">
                <label>What health goals are you focused on? <span className="sb-optional">(optional)</span></label>
                <div className="sb-health-grid">
                  {healthOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sb-health-btn ${formData.healthInterests.includes(option.id) ? 'sb-health-selected' : ''}`}
                      onClick={() => handleHealthToggle(option.id)}
                    >
                      {formData.healthInterests.includes(option.id) && <span className="sb-health-check">✓</span>}
                      {option.label}
                    </button>
                  ))}
                </div>
                {formData.healthInterests.includes('other') && (
                  <input
                    type="text"
                    name="otherInterest"
                    value={formData.otherInterest}
                    onChange={handleInputChange}
                    placeholder="Tell us more..."
                    className="sb-other-input"
                  />
                )}
              </div>

              <div className="sb-field">
                <label>Who wins Super Bowl LX? <span className="sb-required">*</span></label>
                <div className="sb-teams">
                  <button
                    type="button"
                    className={`sb-team-card ${formData.teamPick === 'patriots' ? 'sb-team-selected' : ''}`}
                    onClick={() => handleTeamSelect('patriots')}
                  >
                    <div className="sb-team-colors">
                      <span className="sb-team-dot sb-red"></span>
                      <span className="sb-team-dot sb-blue"></span>
                    </div>
                    <span className="sb-team-name">New England Patriots</span>
                    {formData.teamPick === 'patriots' && <span className="sb-team-check">✓</span>}
                  </button>

                  <button
                    type="button"
                    className={`sb-team-card ${formData.teamPick === 'seahawks' ? 'sb-team-selected' : ''}`}
                    onClick={() => handleTeamSelect('seahawks')}
                  >
                    <div className="sb-team-colors">
                      <span className="sb-team-dot sb-green"></span>
                      <span className="sb-team-dot sb-navy"></span>
                    </div>
                    <span className="sb-team-name">Seattle Seahawks</span>
                    {formData.teamPick === 'seahawks' && <span className="sb-team-check">✓</span>}
                  </button>
                </div>
              </div>

              <div className="sb-consent">
                <label className="sb-consent-label">
                  <input
                    type="checkbox"
                    checked={formData.smsConsent}
                    onChange={(e) => setFormData(prev => ({ ...prev, smsConsent: e.target.checked }))}
                    className="sb-consent-checkbox"
                  />
                  <span className="sb-consent-text">
                    I agree to receive text messages from Range Medical about this giveaway and future health tips.
                    Message frequency varies. Reply STOP to opt out. Message & data rates may apply.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="sb-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entering...' : 'Enter the Giveaway'}
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="sb-footer">
          <div className="sb-container">
            <p className="sb-footer-brand">Range Medical</p>
            <p className="sb-footer-address">1901 Westcliff Dr, Suite 10 · Newport Beach, CA</p>
            <a href="tel:9499973988" className="sb-footer-phone">(949) 997-3988</a>
            <p className="sb-footer-note">Must be able to visit Range Medical in Newport Beach, CA for your blood draw.</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .sb-page {
          min-height: 100vh;
          background: #ffffff;
          color: #171717;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sb-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Trust Bar */
        .sb-trust-bar {
          background: #fafafa;
          border-bottom: 1px solid #e5e5e5;
          padding: 0.625rem 1rem;
        }

        .sb-trust-inner {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: #525252;
        }

        .sb-trust-rating {
          color: #171717;
          letter-spacing: -0.02em;
        }

        /* Header */
        .sb-header {
          padding: 1.25rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
        }

        .sb-logo {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #171717;
          text-decoration: none;
        }

        /* Hero */
        .sb-hero {
          padding: 3rem 1.5rem 2.5rem;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .sb-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          margin-bottom: 1.25rem;
        }

        .sb-hero h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.15;
          margin: 0 0 0.5rem;
          color: #171717;
        }

        .sb-value {
          font-size: 1.125rem;
          color: #22c55e;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        .sb-subtitle {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .sb-subtitle strong {
          color: #171717;
        }

        /* Prize Section */
        .sb-prize {
          padding: 3rem 0;
          background: #fafafa;
        }

        .sb-section-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .sb-prize h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          color: #171717;
        }

        .sb-prize-intro {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .sb-prize-intro strong {
          color: #171717;
        }

        .sb-biomarkers {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .sb-biomarker-section {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          padding: 1.25rem;
        }

        .sb-biomarker-section h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #171717;
          margin: 0 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .sb-biomarker-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sb-biomarker-section li {
          font-size: 0.8125rem;
          color: #525252;
          padding: 0.25rem 0;
          padding-left: 1rem;
          position: relative;
          line-height: 1.4;
        }

        .sb-biomarker-section li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 700;
          font-size: 0.6875rem;
        }

        .sb-prize-highlight {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.5rem;
          background: #171717;
          color: #ffffff;
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
        }

        .sb-prize-amount {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .sb-prize-each {
          font-size: 0.9375rem;
          color: #a3a3a3;
        }

        /* Form Section */
        .sb-form-section {
          padding: 3rem 0;
        }

        .sb-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .sb-form h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          text-align: center;
          color: #171717;
        }

        .sb-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .sb-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .sb-field {
          margin-bottom: 1.25rem;
        }

        .sb-field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .sb-optional {
          font-weight: 400;
          color: #737373;
        }

        .sb-required {
          color: #dc2626;
        }

        .sb-field input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          color: #171717;
          transition: border-color 0.2s;
        }

        .sb-field input::placeholder {
          color: #a3a3a3;
        }

        .sb-field input:focus {
          outline: none;
          border-color: #171717;
        }

        .sb-field-hint {
          font-size: 0.8125rem;
          color: #737373;
          margin: 0.5rem 0 0;
          line-height: 1.5;
        }

        .sb-health-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .sb-health-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 100px;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          color: #525252;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sb-health-btn:hover {
          border-color: #171717;
        }

        .sb-health-selected {
          background: #171717;
          border-color: #171717;
          color: #ffffff;
        }

        .sb-health-check {
          color: #22c55e;
          font-weight: 700;
        }

        .sb-other-input {
          margin-top: 0.75rem;
        }

        .sb-teams {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .sb-team-card {
          position: relative;
          background: #ffffff;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .sb-team-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        .sb-team-selected {
          border-color: #171717;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .sb-team-colors {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .sb-team-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .sb-red { background: #c8102e; }
        .sb-blue { background: #002244; }
        .sb-green { background: #69be28; }
        .sb-navy { background: #002244; }

        .sb-team-name {
          display: block;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #171717;
        }

        .sb-team-check {
          position: absolute;
          top: 0.625rem;
          right: 0.625rem;
          width: 24px;
          height: 24px;
          background: #22c55e;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .sb-consent {
          margin-bottom: 1.5rem;
        }

        .sb-consent-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .sb-consent-checkbox {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: #22c55e;
          cursor: pointer;
        }

        .sb-consent-text {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.5;
        }

        .sb-submit {
          width: 100%;
          background: #000000;
          border: none;
          border-radius: 8px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .sb-submit:hover:not(:disabled) {
          background: #333333;
        }

        .sb-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Footer */
        .sb-footer {
          padding: 3rem 1.5rem;
          text-align: center;
          background: #fafafa;
          border-top: 1px solid #e5e5e5;
        }

        .sb-footer-brand {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          margin: 0 0 0.25rem;
        }

        .sb-footer-address {
          font-size: 0.875rem;
          color: #737373;
          margin: 0 0 0.75rem;
        }

        .sb-footer-phone {
          display: inline-block;
          color: #171717;
          font-weight: 500;
          text-decoration: none;
          font-size: 1rem;
          margin-bottom: 1.25rem;
        }

        .sb-footer-phone:hover {
          color: #525252;
        }

        .sb-footer-note {
          font-size: 0.75rem;
          color: #a3a3a3;
          margin: 0;
        }

        @media (max-width: 900px) {
          .sb-biomarkers {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .sb-trust-inner {
            gap: 1rem;
          }

          .sb-hero h1 {
            font-size: 1.875rem;
          }

          .sb-biomarkers {
            grid-template-columns: 1fr;
          }

          .sb-field-row {
            grid-template-columns: 1fr;
          }

          .sb-teams {
            grid-template-columns: 1fr;
          }

          .sb-prize-highlight {
            flex-direction: column;
            gap: 0.25rem;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
