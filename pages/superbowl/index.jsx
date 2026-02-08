// /pages/superbowl/index.jsx
// Range Medical Super Bowl LX Giveaway Landing Page
// Created: 2026-02-08

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function SuperBowlGiveaway() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    teamPick: '',
    healthInterests: [],
    otherInterest: ''
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

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/superbowl/submit-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone_number: phoneDigits,
          team_pick: formData.teamPick,
          health_interests: formData.healthInterests,
          other_interest: formData.otherInterest.trim(),
          utm_source: router.query.utm_source || 'instagram'
        })
      });

      const result = await res.json();

      if (result.success) {
        // Store team pick for thank you page
        sessionStorage.setItem('sbTeamPick', formData.teamPick);
        sessionStorage.setItem('sbFirstName', formData.firstName);
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
        <meta name="description" content="Pick the Super Bowl LX winner and enter to win a FREE Elite Panel Lab Draw valued at $750 from Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sb-page">
        {/* Hero */}
        <header className="sb-hero">
          <div className="sb-logo">RANGE MEDICAL</div>
          <div className="sb-badge">Super Bowl LX</div>
          <h1>Win a FREE Elite Panel Lab Draw</h1>
          <p className="sb-value">Valued at $750</p>
          <p className="sb-subtitle">Pick the Super Bowl winner. If you're right, you could win the most comprehensive blood panel available.</p>
        </header>

        {/* What You Win */}
        <section className="sb-prize">
          <h2>What You Could Win</h2>
          <p className="sb-prize-intro">
            The Elite Panel is our most comprehensive lab panel — <strong>50+ biomarkers</strong> giving you a complete picture of your health.
          </p>

          <div className="sb-categories">
            <div className="sb-category">
              <span className="sb-cat-icon">💉</span>
              <span>Complete Hormone Panel</span>
            </div>
            <div className="sb-category">
              <span className="sb-cat-icon">📊</span>
              <span>Metabolic Health</span>
            </div>
            <div className="sb-category">
              <span className="sb-cat-icon">🔥</span>
              <span>Inflammation Markers</span>
            </div>
            <div className="sb-category">
              <span className="sb-cat-icon">🫀</span>
              <span>Organ Function</span>
            </div>
            <div className="sb-category">
              <span className="sb-cat-icon">💊</span>
              <span>Nutrient Status</span>
            </div>
            <div className="sb-category">
              <span className="sb-cat-icon">🩸</span>
              <span>Blood Health</span>
            </div>
          </div>

          <p className="sb-prize-value">Valued at <strong>$750</strong> — yours FREE if you win.</p>
        </section>

        {/* Entry Form */}
        <section className="sb-form-section">
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
              <label>What health goals are you focused on? <span className="sb-optional">(optional)</span></label>
              <div className="sb-health-grid">
                {healthOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={`sb-health-btn ${formData.healthInterests.includes(option.id) ? 'sb-health-selected' : ''}`}
                    onClick={() => handleHealthToggle(option.id)}
                  >
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
                  className={`sb-team-card sb-patriots ${formData.teamPick === 'patriots' ? 'sb-team-selected' : ''}`}
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
                  className={`sb-team-card sb-seahawks ${formData.teamPick === 'seahawks' ? 'sb-team-selected' : ''}`}
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

            <button
              type="submit"
              className="sb-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entering...' : 'Enter the Giveaway 🏈'}
            </button>
          </form>
        </section>

        {/* Footer */}
        <footer className="sb-footer">
          <p className="sb-footer-brand">Range Medical — Newport Beach, CA</p>
          <p className="sb-footer-phone"><a href="tel:9499973988">(949) 997-3988</a></p>
          <p className="sb-footer-note">Must be able to visit Range Medical in Newport Beach, CA for your blood draw.</p>
        </footer>
      </div>

      <style jsx>{`
        .sb-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sb-hero {
          padding: 3rem 1.5rem 2.5rem;
          text-align: center;
          background: linear-gradient(180deg, rgba(0, 212, 170, 0.1) 0%, transparent 100%);
        }

        .sb-logo {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1.5rem;
        }

        .sb-badge {
          display: inline-block;
          background: linear-gradient(135deg, #00d4aa 0%, #00a88a 100%);
          color: #0f0f1a;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }

        .sb-hero h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 0.5rem;
        }

        .sb-value {
          font-size: 1.25rem;
          color: #00d4aa;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        .sb-subtitle {
          font-size: 1rem;
          color: #a0a0b0;
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        }

        .sb-prize {
          padding: 2.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .sb-prize h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 1rem;
          text-align: center;
        }

        .sb-prize-intro {
          font-size: 0.9375rem;
          color: #c0c0d0;
          line-height: 1.6;
          text-align: center;
          margin: 0 0 1.5rem;
        }

        .sb-categories {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .sb-category {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
          color: #e0e0f0;
        }

        .sb-cat-icon {
          font-size: 1rem;
        }

        .sb-prize-value {
          font-size: 1rem;
          text-align: center;
          color: #ffffff;
          margin: 0;
        }

        .sb-prize-value strong {
          color: #00d4aa;
        }

        .sb-form-section {
          padding: 2rem 1.5rem 3rem;
        }

        .sb-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .sb-form h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          text-align: center;
        }

        .sb-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
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
          color: #c0c0d0;
          margin-bottom: 0.5rem;
        }

        .sb-optional {
          font-weight: 400;
          color: #707080;
        }

        .sb-required {
          color: #00d4aa;
        }

        .sb-field input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          color: #ffffff;
          transition: border-color 0.2s, background 0.2s;
        }

        .sb-field input::placeholder {
          color: #606070;
        }

        .sb-field input:focus {
          outline: none;
          border-color: #00d4aa;
          background: rgba(255, 255, 255, 0.08);
        }

        .sb-health-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .sb-health-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          color: #c0c0d0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sb-health-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sb-health-selected {
          background: rgba(0, 212, 170, 0.2);
          border-color: #00d4aa;
          color: #00d4aa;
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
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 1.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .sb-team-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .sb-team-selected {
          border-color: #00d4aa;
          background: rgba(0, 212, 170, 0.1);
          box-shadow: 0 0 20px rgba(0, 212, 170, 0.2);
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
          color: #ffffff;
        }

        .sb-team-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: #00d4aa;
          color: #0f0f1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .sb-submit {
          width: 100%;
          background: linear-gradient(135deg, #00d4aa 0%, #00a88a 100%);
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f0f1a;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .sb-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 212, 170, 0.3);
        }

        .sb-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .sb-footer {
          padding: 2rem 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sb-footer-brand {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem;
        }

        .sb-footer-phone {
          margin: 0 0 1rem;
        }

        .sb-footer-phone a {
          color: #00d4aa;
          text-decoration: none;
          font-size: 0.9375rem;
        }

        .sb-footer-note {
          font-size: 0.75rem;
          color: #707080;
          margin: 0;
        }

        @media (max-width: 480px) {
          .sb-hero h1 {
            font-size: 1.75rem;
          }

          .sb-categories {
            grid-template-columns: 1fr;
          }

          .sb-field-row {
            grid-template-columns: 1fr;
          }

          .sb-teams {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
