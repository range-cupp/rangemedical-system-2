import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RangeAssessment() {
  const router = useRouter();
  const { path } = router.query;

  const [selectedPath, setSelectedPath] = useState(null);
  const [step, setStep] = useState(0); // 0 = contact info, 1+ = questions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Injury path
    injuryType: '',
    injuryLocation: '',
    injuryDuration: '',
    inPhysicalTherapy: '',
    recoveryGoal: '',
    // Energy path
    primarySymptom: '',
    symptomDuration: '',
    hasRecentLabs: '',
    triedHormoneTherapy: '',
    energyGoal: '',
    // Additional
    additionalInfo: ''
  });

  // Set path from URL query parameter
  useEffect(() => {
    if (path === 'injury' || path === 'energy') {
      setSelectedPath(path);
    }
  }, [path]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateContactInfo = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (!formData.phone.trim()) return 'Phone number is required';
    return null;
  };

  const handleNext = () => {
    if (step === 0) {
      const validationError = validateContactInfo();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assessmentPath: selectedPath
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to intake form
      router.push('/intake');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Path selection screen
  if (!selectedPath) {
    return (
      <Layout>
        <Head>
          <title>Range Assessment | Newport Beach | Range Medical</title>
          <meta name="description" content="Start your personalized health journey with a Range Assessment. Choose your path: Injury Recovery or Energy Optimization." />
          <link rel="canonical" href="https://www.range-medical.com/range-assessment" />
        </Head>
        <div className="ra-page">
          <section className="ra-hero">
            <div className="ra-container">
              <span className="ra-kicker">Get Started</span>
              <h1>What Brings You to Range?</h1>
              <p className="ra-intro">
                Select the option that best describes your situation. This helps us understand your needs before your visit.
              </p>

              <div className="ra-path-grid">
                <button
                  className="ra-path-card"
                  onClick={() => setSelectedPath('injury')}
                >
                  <div className="ra-path-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <h3>Injury & Recovery</h3>
                  <p>You're rehabbing an injury and healing feels slow. You want to speed things up.</p>
                  <span className="ra-path-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </button>

                <button
                  className="ra-path-card"
                  onClick={() => setSelectedPath('energy')}
                >
                  <div className="ra-path-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <h3>Energy & Optimization</h3>
                  <p>You're tired, foggy, or just don't feel like yourself. You want answers and a plan.</p>
                  <span className="ra-path-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Question sets for each path
  const injuryQuestions = [
    {
      id: 'injuryType',
      question: 'What type of injury are you recovering from?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'joint_ligament', label: 'Joint or ligament injury (ACL, meniscus, rotator cuff)' },
        { value: 'muscle_tendon', label: 'Muscle or tendon injury (strain, tear, tendinitis)' },
        { value: 'post_surgical', label: 'Post-surgical recovery' },
        { value: 'concussion', label: 'Concussion or head injury' },
        { value: 'chronic_pain', label: 'Chronic pain condition' },
        { value: 'fracture', label: 'Bone fracture' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'injuryLocation',
      question: 'Where is the injury located?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'shoulder', label: 'Shoulder' },
        { value: 'knee', label: 'Knee' },
        { value: 'back', label: 'Back' },
        { value: 'hip', label: 'Hip' },
        { value: 'neck', label: 'Neck' },
        { value: 'ankle', label: 'Ankle' },
        { value: 'elbow', label: 'Elbow' },
        { value: 'wrist_hand', label: 'Wrist or hand' },
        { value: 'head', label: 'Head' },
        { value: 'multiple', label: 'Multiple areas' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'injuryDuration',
      question: 'How long have you been dealing with this?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'less_2_weeks', label: 'Less than 2 weeks' },
        { value: '2_4_weeks', label: '2–4 weeks' },
        { value: '1_3_months', label: '1–3 months' },
        { value: '3_6_months', label: '3–6 months' },
        { value: '6_plus_months', label: '6+ months' }
      ]
    },
    {
      id: 'inPhysicalTherapy',
      question: 'Are you currently in physical therapy or rehab?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'completed', label: 'Completed PT but still not 100%' }
      ]
    },
    {
      id: 'recoveryGoal',
      question: "What's your main recovery goal?",
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'return_sport', label: 'Return to sport or athletic activity' },
        { value: 'daily_activities', label: 'Get back to daily activities pain-free' },
        { value: 'avoid_surgery', label: 'Avoid surgery if possible' },
        { value: 'speed_healing', label: 'Speed up the healing process' },
        { value: 'reduce_pain', label: 'Reduce pain and inflammation' },
        { value: 'post_surgery', label: 'Recover faster after surgery' }
      ]
    }
  ];

  const energyQuestions = [
    {
      id: 'primarySymptom',
      question: "What's your #1 symptom right now?",
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'fatigue', label: 'Fatigue or low energy' },
        { value: 'brain_fog', label: 'Brain fog or poor focus' },
        { value: 'weight_gain', label: 'Unexplained weight gain' },
        { value: 'poor_sleep', label: 'Poor sleep or insomnia' },
        { value: 'low_libido', label: 'Low libido or sexual function' },
        { value: 'muscle_loss', label: 'Muscle loss or weakness' },
        { value: 'mood_changes', label: 'Mood changes, anxiety, or irritability' },
        { value: 'recovery', label: 'Slow recovery from workouts' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'symptomDuration',
      question: 'How long have you been experiencing this?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'less_1_month', label: 'Less than 1 month' },
        { value: '1_3_months', label: '1–3 months' },
        { value: '3_6_months', label: '3–6 months' },
        { value: '6_12_months', label: '6–12 months' },
        { value: '1_plus_years', label: '1+ years' }
      ]
    },
    {
      id: 'hasRecentLabs',
      question: 'Do you have lab work from the last 60 days?',
      type: 'checkbox',
      checkboxLabel: 'Yes, I have recent labs',
      followUp: 'Please send your lab results to info@range-medical.com so we can review them before your visit.'
    },
    {
      id: 'triedHormoneTherapy',
      question: 'Have you tried hormone therapy before?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'not_sure', label: "Not sure what this is" }
      ]
    },
    {
      id: 'energyGoal',
      question: "What's your main goal?",
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'more_energy', label: 'More energy throughout the day' },
        { value: 'better_sleep', label: 'Better, more restful sleep' },
        { value: 'lose_weight', label: 'Lose weight' },
        { value: 'build_muscle', label: 'Build or maintain muscle' },
        { value: 'mental_clarity', label: 'Mental clarity and focus' },
        { value: 'feel_myself', label: 'Feel like myself again' },
        { value: 'longevity', label: 'Optimize for longevity' },
        { value: 'performance', label: 'Athletic or sexual performance' }
      ]
    }
  ];

  const questions = selectedPath === 'injury' ? injuryQuestions : energyQuestions;
  const totalSteps = questions.length + 1; // +1 for contact info
  const currentQuestion = questions[step - 1];
  const progress = ((step) / totalSteps) * 100;

  return (
    <Layout>
      <Head>
        <title>Range Assessment | Newport Beach | Range Medical</title>
        <meta name="description" content="Complete your Range Assessment to help us understand your health goals." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="ra-page">
        <section className="ra-form-section">
          <div className="ra-form-container">
            {/* Progress bar */}
            <div className="ra-progress">
              <div className="ra-progress-bar" style={{ width: `${progress}%` }} />
            </div>

            {/* Path indicator */}
            <div className="ra-path-indicator">
              <span className="ra-path-label">
                {selectedPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization'}
              </span>
              <button
                className="ra-change-path"
                onClick={() => {
                  setSelectedPath(null);
                  setStep(0);
                }}
              >
                Change
              </button>
            </div>

            {/* Step 0: Contact Info */}
            {step === 0 && (
              <div className="ra-step">
                <h2>Let's start with your contact info</h2>
                <p className="ra-step-desc">
                  This helps us reach you to schedule your visit.
                </p>

                <div className="ra-form-grid">
                  <div className="ra-field">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      autoFocus
                    />
                  </div>
                  <div className="ra-field">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="ra-field">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="ra-field">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(949) 555-1234"
                  />
                </div>

                {error && <div className="ra-error">{error}</div>}

                <div className="ra-actions">
                  <button className="ra-btn-primary" onClick={handleNext}>
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Questions */}
            {step > 0 && step <= questions.length && (
              <div className="ra-step">
                <div className="ra-step-count">Question {step} of {questions.length}</div>
                <h2>{currentQuestion.question}</h2>

                {currentQuestion.type === 'select' && (
                  <div className="ra-field ra-field-large">
                    <select
                      value={formData[currentQuestion.id]}
                      onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                    >
                      {currentQuestion.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {currentQuestion.type === 'radio' && (
                  <div className="ra-radio-group">
                    {currentQuestion.options.map(opt => (
                      <label key={opt.value} className="ra-radio-option">
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={opt.value}
                          checked={formData[currentQuestion.id] === opt.value}
                          onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                        />
                        <span className="ra-radio-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'checkbox' && (
                  <div className="ra-checkbox-section">
                    <label className="ra-checkbox-option">
                      <input
                        type="checkbox"
                        checked={formData[currentQuestion.id] === 'yes'}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.checked ? 'yes' : 'no')}
                      />
                      <span className="ra-checkbox-label">{currentQuestion.checkboxLabel}</span>
                    </label>
                    {formData[currentQuestion.id] === 'yes' && currentQuestion.followUp && (
                      <div className="ra-followup-message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {currentQuestion.followUp}
                      </div>
                    )}
                  </div>
                )}

                {error && <div className="ra-error">{error}</div>}

                <div className="ra-actions ra-actions-split">
                  <button className="ra-btn-secondary" onClick={handleBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                  </button>
                  <button
                    className="ra-btn-primary"
                    onClick={step === questions.length ? () => setStep(step + 1) : handleNext}
                  >
                    {step === questions.length ? 'Review' : 'Continue'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Final step: Additional info + Submit */}
            {step > questions.length && (
              <div className="ra-step">
                <h2>Anything else we should know?</h2>
                <p className="ra-step-desc">
                  Optional: Share any additional context that might help us prepare for your visit.
                </p>

                <div className="ra-field">
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Previous treatments, specific concerns, questions you have..."
                    rows={4}
                  />
                </div>

                {error && <div className="ra-error">{error}</div>}

                <div className="ra-actions ra-actions-split">
                  <button className="ra-btn-secondary" onClick={handleBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                  </button>
                  <button
                    className="ra-btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="ra-spinner" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit & Continue to Intake
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                <p className="ra-privacy-note">
                  Your information is secure and will only be used to prepare for your visit.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <style jsx>{styles}</style>
    </Layout>
  );
}

const styles = `
  .ra-page {
    min-height: 100vh;
    background: #ffffff;
  }

  /* Hero / Path Selection */
  .ra-hero {
    padding: 4rem 1.5rem 5rem;
    text-align: center;
  }

  .ra-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .ra-kicker {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #737373;
    margin-bottom: 0.75rem;
  }

  .ra-hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 1rem;
    line-height: 1.2;
  }

  .ra-intro {
    font-size: 1.0625rem;
    color: #525252;
    line-height: 1.7;
    max-width: 540px;
    margin: 0 auto 2.5rem;
  }

  .ra-path-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    max-width: 700px;
    margin: 0 auto;
  }

  .ra-path-card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 2rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .ra-path-card:hover {
    border-color: #171717;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .ra-path-featured {
    border-color: #000000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .ra-path-badge {
    position: absolute;
    top: -0.75rem;
    left: 1.5rem;
    background: #000000;
    color: #ffffff;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.375rem 0.75rem;
    border-radius: 100px;
  }

  .ra-path-icon {
    width: 56px;
    height: 56px;
    background: #f5f5f5;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    color: #171717;
    transition: all 0.2s;
  }

  .ra-path-featured .ra-path-icon {
    background: #000000;
    color: #ffffff;
  }

  .ra-path-card:hover .ra-path-icon {
    background: #000000;
    color: #ffffff;
  }

  .ra-path-card h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 0.5rem;
  }

  .ra-path-card p {
    font-size: 0.9375rem;
    color: #525252;
    line-height: 1.6;
    margin: 0;
  }

  .ra-path-arrow {
    position: absolute;
    top: 2rem;
    right: 1.5rem;
    color: #d4d4d4;
    transition: all 0.2s;
  }

  .ra-path-card:hover .ra-path-arrow {
    color: #171717;
    transform: translateX(4px);
  }

  /* Form Section */
  .ra-form-section {
    padding: 2rem 1.5rem 4rem;
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .ra-form-container {
    width: 100%;
    max-width: 540px;
  }

  .ra-progress {
    height: 4px;
    background: #e5e5e5;
    border-radius: 2px;
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .ra-progress-bar {
    height: 100%;
    background: #000000;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .ra-path-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .ra-path-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #171717;
  }

  .ra-change-path {
    font-size: 0.8125rem;
    color: #737373;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .ra-change-path:hover {
    color: #171717;
  }

  .ra-step {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ra-step-count {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #737373;
    margin-bottom: 0.5rem;
  }

  .ra-step h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 0.75rem;
    line-height: 1.3;
  }

  .ra-step-desc {
    font-size: 0.9375rem;
    color: #525252;
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .ra-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .ra-field {
    margin-bottom: 1rem;
  }

  .ra-field-large {
    margin-bottom: 1.5rem;
  }

  .ra-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #171717;
    margin-bottom: 0.5rem;
  }

  .ra-field input,
  .ra-field select,
  .ra-field textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background: #ffffff;
    color: #171717;
    transition: border-color 0.2s;
    font-family: inherit;
  }

  .ra-field input:focus,
  .ra-field select:focus,
  .ra-field textarea:focus {
    outline: none;
    border-color: #171717;
  }

  .ra-field input::placeholder,
  .ra-field textarea::placeholder {
    color: #a3a3a3;
  }

  .ra-field select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 2.5rem;
  }

  .ra-field-large select {
    padding: 1rem 1.25rem;
    font-size: 1.0625rem;
  }

  .ra-radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .ra-radio-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ra-radio-option:hover {
    border-color: #d4d4d4;
    background: #fafafa;
  }

  .ra-radio-option:has(input:checked) {
    border-color: #171717;
    background: #fafafa;
  }

  .ra-radio-option input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #171717;
  }

  .ra-radio-label {
    font-size: 0.9375rem;
    color: #171717;
  }

  .ra-checkbox-section {
    margin-bottom: 1.5rem;
  }

  .ra-checkbox-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ra-checkbox-option:hover {
    border-color: #d4d4d4;
    background: #fafafa;
  }

  .ra-checkbox-option:has(input:checked) {
    border-color: #171717;
    background: #fafafa;
  }

  .ra-checkbox-option input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #171717;
  }

  .ra-checkbox-label {
    font-size: 0.9375rem;
    color: #171717;
  }

  .ra-followup-message {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #166534;
    line-height: 1.5;
  }

  .ra-followup-message svg {
    flex-shrink: 0;
    margin-top: 2px;
    stroke: #16a34a;
  }

  .ra-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .ra-actions {
    margin-top: 1.5rem;
  }

  .ra-actions-split {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .ra-btn-primary,
  .ra-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: inherit;
  }

  .ra-btn-primary {
    background: #000000;
    color: #ffffff;
  }

  .ra-btn-primary:hover:not(:disabled) {
    background: #333333;
  }

  .ra-btn-primary:disabled {
    background: #737373;
    cursor: not-allowed;
  }

  .ra-btn-secondary {
    background: #ffffff;
    color: #171717;
    border: 1px solid #e5e5e5;
  }

  .ra-btn-secondary:hover {
    border-color: #171717;
  }

  .ra-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ra-privacy-note {
    font-size: 0.8125rem;
    color: #737373;
    text-align: center;
    margin-top: 1.5rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .ra-hero {
      padding: 3rem 1.5rem;
    }

    .ra-hero h1 {
      font-size: 1.75rem;
    }

    .ra-path-grid {
      grid-template-columns: 1fr;
    }

    .ra-form-grid {
      grid-template-columns: 1fr;
    }

    .ra-actions-split {
      flex-direction: column-reverse;
    }

    .ra-btn-primary,
    .ra-btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
`;
