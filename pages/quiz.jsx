import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Quiz() {
  // State
  const [section, setSection] = useState('intro'); // intro, questions, results
  const [gender, setGender] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [leadInfo, setLeadInfo] = useState({ name: '', phone: '', email: '' });
  const [discountUnlocked, setDiscountUnlocked] = useState(false);

  // Quiz Data
  const questions = [
    {
      id: 'energy',
      question: 'How would you rate your daily energy levels?',
      lowLabel: 'Exhausted all day',
      highLabel: 'Energized morning to night',
      insight: 'Chronic fatigue often signals thyroid dysfunction, low testosterone, or nutrient deficiencies.',
      treatments: 'Thyroid optimization, testosterone therapy, B12/iron supplementation, NAD+ IV therapy',
      treatmentIcon: '⚡',
      title: 'Energy Levels'
    },
    {
      id: 'libido',
      question: 'How would you rate your sex drive compared to when you felt your best?',
      lowLabel: 'Nonexistent',
      highLabel: 'Strong and consistent',
      insight: "Low libido is rarely \"just aging.\" It's usually a hormone imbalance that can be identified and corrected.",
      treatments: 'Hormone therapy (TRT/HRT), DHEA supplementation, peptide protocols',
      treatmentIcon: '💪',
      title: 'Libido & Sex Drive'
    },
    {
      id: 'weight',
      question: 'How easily can you lose weight or maintain a healthy weight?',
      lowLabel: 'Impossible despite effort',
      highLabel: 'Easily maintain ideal weight',
      insight: "If you're doing everything right but can't lose weight, your metabolism might be working against you.",
      treatments: 'GLP-1 weight loss program (Tirzepatide, Semaglutide), thyroid optimization, metabolic reset',
      treatmentIcon: '⚖️',
      title: 'Weight & Metabolism'
    },
    {
      id: 'focus',
      question: 'How would you rate your mental sharpness and ability to focus?',
      lowLabel: 'Constant brain fog',
      highLabel: 'Sharp and clear thinking',
      insight: "Brain fog isn't normal at any age. Thyroid, B12, iron, and inflammation directly impact cognitive function.",
      treatments: 'B12 optimization, iron supplementation, NAD+ IV therapy, thyroid support',
      treatmentIcon: '🧠',
      title: 'Mental Clarity & Focus'
    },
    {
      id: 'sleep',
      question: 'How would you rate your sleep quality?',
      lowLabel: 'Barely sleep / wake exhausted',
      highLabel: 'Deep, restorative sleep',
      insight: 'Poor sleep is often driven by cortisol dysregulation, hormone imbalances, or blood sugar instability.',
      treatments: 'Hormone optimization, magnesium supplementation, cortisol management protocols',
      treatmentIcon: '😴',
      title: 'Sleep Quality'
    },
    {
      id: 'muscle',
      question: 'How easily can you build or maintain muscle?',
      lowLabel: 'Losing muscle despite training',
      highLabel: 'Easily build and maintain',
      insight: 'Muscle loss despite training usually points to hormone deficiency or chronic inflammation.',
      treatments: 'Testosterone therapy, growth hormone peptides (Tesamorelin/Ipamorelin), vitamin D optimization',
      treatmentIcon: '🏋️',
      title: 'Muscle & Strength'
    },
    {
      id: 'mood',
      question: 'How stable and positive is your mood day-to-day?',
      lowLabel: 'Depressed / anxious / irritable',
      highLabel: 'Consistently stable and positive',
      insight: "Before assuming it's \"just stress,\" check your hormones. They directly affect mood and emotional stability.",
      treatments: 'Hormone therapy, thyroid optimization, B12 supplementation, vitamin D',
      treatmentIcon: '🌤️',
      title: 'Mood & Emotional Wellbeing'
    },
    {
      id: 'stress',
      question: 'How well do you handle stress?',
      lowLabel: 'Overwhelmed constantly',
      highLabel: 'Handle stress with ease',
      insight: 'Chronic stress depletes hormones and nutrients. Your cortisol-to-DHEA ratio shows exactly how stressed your body is.',
      treatments: 'Adrenal support protocols, IV vitamin therapy, DHEA optimization, lifestyle medicine',
      treatmentIcon: '🧘',
      title: 'Stress Tolerance'
    },
    {
      id: 'heart',
      question: 'How concerned are you about your cardiovascular health?',
      lowLabel: 'Very concerned / family history',
      highLabel: 'No concerns',
      insight: 'Standard cholesterol tests miss critical markers. ApoB, Lp(a), and inflammation give a more accurate picture.',
      treatments: 'Advanced lipid management, metabolic optimization, inflammation reduction protocols',
      treatmentIcon: '❤️',
      title: 'Cardiovascular Health',
      reverseScale: true
    },
    {
      id: 'recovery',
      question: 'How quickly do you recover from workouts, illness, or injury?',
      lowLabel: 'Takes forever',
      highLabel: 'Bounce back quickly',
      insight: "Slow recovery signals that your repair mechanisms aren't optimal—often due to hormones or inflammation.",
      treatments: 'Peptide therapy (BPC-157, Thymosin Beta-4), hyperbaric oxygen therapy, red light therapy, IV therapy',
      treatmentIcon: '🔄',
      title: 'Recovery & Healing'
    }
  ];

  // Handlers
  const selectGender = (g) => {
    setGender(g);
    setSection('questions');
  };

  const selectAnswer = (value) => {
    const q = questions[currentQuestion];
    setAnswers({ ...answers, [q.id]: value });
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSection('results');
    }
  };

  const getProblemAreas = () => {
    return questions.filter(q => {
      const value = answers[q.id];
      if (value === undefined) return false;
      return value <= 4;
    });
  };

  const hasEliteBenefit = () => {
    const problems = getProblemAreas();
    const ids = problems.map(p => p.id);
    return ids.includes('heart') || ids.includes('stress') || ids.includes('recovery') ||
           ids.includes('muscle') || ids.includes('focus') || problems.length >= 3;
  };

  const getEliteBenefitReason = (problems) => {
    const ids = problems.map(p => p.id);
    const reasons = [];
    if (ids.includes('heart')) reasons.push('cardiovascular risk assessment');
    if (ids.includes('stress')) reasons.push('adrenal function');
    if (ids.includes('recovery') || ids.includes('muscle')) reasons.push('recovery and growth markers');
    if (ids.includes('focus')) reasons.push('inflammation and nutrient status');
    if (reasons.length === 0) reasons.push('a comprehensive baseline');
    return reasons.slice(0, 2).join(' and ');
  };

  const unlockDiscount = async () => {
    if (!leadInfo.name || !leadInfo.phone || !leadInfo.email) {
      alert('Please fill in all fields to unlock your discount.');
      return;
    }
    if (!leadInfo.email.includes('@') || !leadInfo.email.includes('.')) {
      alert('Please enter a valid email address.');
      return;
    }
    setDiscountUnlocked(true);
  };

  const getSmsLink = (panel) => {
    const problems = getProblemAreas();
    if (discountUnlocked) {
      const msg = `Hi! I'm ${leadInfo.name} and I just completed the Range Medical quiz. I'd like to book the ${panel.toUpperCase()} PANEL with my $50 discount.\n\nPhone: ${leadInfo.phone}\nEmail: ${leadInfo.email}\n\n[QUIZ50-${panel.toUpperCase()}]`;
      return `sms:+19499973988?body=${encodeURIComponent(msg)}`;
    }
    return `sms:+19499973988?body=${encodeURIComponent(`Hi! I just completed the Range Medical quiz and I'm interested in booking the ${panel === 'elite' ? 'Elite' : 'Essential'} Panel.`)}`;
  };

  // Current question data
  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const problems = getProblemAreas();

  return (
    <>
      <Head>
        <title>What's Your Body Telling You? | Range Medical</title>
        <meta name="description" content="Take our 2-minute symptom quiz. We'll show you which biomarkers explain how you're feeling—and what we can do about it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.range-medical.com/quiz" />

        {/* Open Graph */}
        <meta property="og:title" content="What's Your Body Telling You? | Range Medical" />
        <meta property="og:description" content="Take our 2-minute symptom quiz. We'll show you which biomarkers explain how you're feeling—and what we can do about it." />
        <meta property="og:url" content="https://www.range-medical.com/quiz" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="What's Your Body Telling You? | Range Medical" />
        <meta name="twitter:description" content="Take our 2-minute symptom quiz. We'll show you which biomarkers explain how you're feeling." />
      </Head>

      {/* Trust Bar */}
      <div className="quiz-trust-bar">
        <div className="quiz-trust-inner">
          <span className="quiz-trust-item">
            <span className="quiz-trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="quiz-trust-item">📍 Newport Beach, CA</span>
          <span className="quiz-trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      <div className="quiz-page">
        {/* Header */}
        <div className="quiz-header">
          <Link href="/">
            <img
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png"
              alt="Range Medical"
              className="quiz-logo"
            />
          </Link>
        </div>

        {/* Intro Section */}
        {section === 'intro' && (
          <div className="quiz-section quiz-intro">
            <div className="quiz-kicker">Quiz · Assessment · Results</div>
            <h1>What's Your Body Telling You?</h1>
            <p className="quiz-subtitle">Answer 10 quick questions about how you feel. We'll show you exactly which biomarkers explain your symptoms—and what we can do about it.</p>

            <p className="quiz-gender-label">First, select your biological sex:</p>

            <div className="quiz-gender-buttons">
              <button className="quiz-gender-btn" onClick={() => selectGender('male')}>Male</button>
              <button className="quiz-gender-btn" onClick={() => selectGender('female')}>Female</button>
            </div>

            <div className="quiz-scroll">
              Scroll to explore
              <span>↓</span>
            </div>
          </div>
        )}

        {/* Questions Section */}
        {section === 'questions' && (
          <div className="quiz-section quiz-questions">
            <div className="quiz-progress-container">
              <div className="quiz-progress-info">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="quiz-question-text">{q.question}</div>

            <div className="quiz-scale-labels">
              <span className="quiz-scale-label">{q.lowLabel}</span>
              <span className="quiz-scale-label quiz-scale-right">{q.highLabel}</span>
            </div>

            <div className="quiz-scale-buttons">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <button
                  key={i}
                  className={`quiz-scale-btn ${answers[q.id] === i ? 'quiz-scale-selected' : ''}`}
                  onClick={() => selectAnswer(i)}
                >
                  {i}
                </button>
              ))}
            </div>

            <div className="quiz-nav-buttons">
              <button
                className="quiz-btn-back"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                ← Back
              </button>
              <button
                className="quiz-btn-next"
                onClick={nextQuestion}
                disabled={answers[q.id] === undefined}
              >
                {currentQuestion === questions.length - 1 ? 'See My Results' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {section === 'results' && (
          <div className="quiz-section quiz-results">
            {problems.length === 0 ? (
              <div className="quiz-good-results">
                <div className="quiz-emoji">✨</div>
                <h2>Great News!</h2>
                <p>Based on your answers, you're feeling pretty good across the board. That said, the best time to get baseline labs is when you're feeling healthy—so you know your optimal levels and can track changes over time.</p>
              </div>
            ) : (
              <>
                <div className="quiz-kicker">Your Results</div>
                <h2>Here's What We Found</h2>
                <p className="quiz-subtitle">Based on your answers, you have {problems.length} area{problems.length > 1 ? 's' : ''} we should look into. Here's what your labs would reveal—and how we can help.</p>

                <div className="quiz-results-label">Your Concern Areas</div>

                {problems.map(p => (
                  <div key={p.id} className="quiz-concern-card">
                    <div className="quiz-concern-header">
                      <div className="quiz-concern-title">{p.title}</div>
                      <div className="quiz-concern-score">{answers[p.id]}/10</div>
                    </div>
                    <p className="quiz-concern-insight">{p.insight}</p>
                    <div className="quiz-concern-divider" />
                    <div className="quiz-treatment-section">
                      <div className="quiz-treatment-icon">{p.treatmentIcon}</div>
                      <div className="quiz-treatment-content">
                        <div className="quiz-treatment-label">If biomarkers are off, treatment options include</div>
                        <div className="quiz-treatment-text">{p.treatments}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* What happens next */}
            <div className="quiz-next-steps-box">
              <h3>What Happens Next</h3>
              <ul className="quiz-next-steps-list">
                <li>
                  <span className="quiz-step-num">1</span>
                  <span>Book your blood draw at our Newport Beach clinic (takes 10 minutes)</span>
                </li>
                <li>
                  <span className="quiz-step-num">2</span>
                  <span>Results come back within 3-5 business days</span>
                </li>
                <li>
                  <span className="quiz-step-num">3</span>
                  <span>Meet 1:1 with your provider to review results and discuss treatment options</span>
                </li>
              </ul>
            </div>

            {/* Lead capture */}
            {!discountUnlocked ? (
              <div className="quiz-discount-box">
                <div className="quiz-discount-badge">Limited Time</div>
                <h3>Get $50 Off Your Labs</h3>
                <p>Complete the form below to unlock $50 off either panel. We'll send you booking details.</p>
                <div className="quiz-lead-form">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={leadInfo.name}
                    onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={leadInfo.phone}
                    onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={leadInfo.email}
                    onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                  />
                  <button className="quiz-btn-unlock" onClick={unlockDiscount}>
                    Unlock $50 Off →
                  </button>
                </div>
                <p className="quiz-fine-print">We respect your privacy. No spam, ever.</p>
              </div>
            ) : (
              <div className="quiz-discount-box quiz-unlocked">
                <div className="quiz-discount-badge">Discount Applied</div>
                <div className="quiz-unlocked-message">
                  <span className="quiz-check">✓</span>
                  <span>$50 Off Unlocked!</span>
                </div>
                <p style={{ marginTop: '1rem', marginBottom: 0 }}>
                  Thanks, {leadInfo.name.split(' ')[0]}! Your discount will be applied when you book.
                </p>
              </div>
            )}

            {/* Panel options */}
            <div className="quiz-results-label">Choose Your Panel</div>

            <div className="quiz-panels-grid">
              <div className="quiz-panel-card">
                <div className="quiz-panel-name">Essential Panel</div>
                <div className="quiz-panel-price">
                  {discountUnlocked ? (
                    <><span className="quiz-price-strike">$350</span> $300</>
                  ) : '$350'}
                </div>
                <p className="quiz-panel-description">Complete hormone, thyroid, and metabolic panel. Includes HgbA1c, full lipid panel, and 1:1 provider review.</p>
                <a href={getSmsLink('essential')} className="quiz-btn-book">Book Essential →</a>
              </div>

              <div className="quiz-panel-card quiz-panel-featured">
                <div className="quiz-panel-badge">Recommended</div>
                <div className="quiz-panel-name">Elite Panel</div>
                <div className="quiz-panel-price">
                  {discountUnlocked ? (
                    <><span className="quiz-price-strike">$750</span> $700</>
                  ) : '$750'}
                </div>
                {hasEliteBenefit() && problems.length > 0 && (
                  <div className="quiz-elite-benefit">✓ Recommended for your concerns—includes {getEliteBenefitReason(problems)}</div>
                )}
                <p className="quiz-panel-description">Everything in Essential plus advanced cardiovascular, inflammation, adrenal, and growth markers.</p>
                <a href={getSmsLink('elite')} className="quiz-btn-book quiz-btn-book-featured">Book Elite →</a>
              </div>
            </div>

            <p className="quiz-footer">Range Medical · 1901 Westcliff Dr Suite 10, Newport Beach</p>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ===== QUIZ PAGE SCOPED STYLES ===== */

        /* Trust Bar */
        .quiz-trust-bar {
          background: #000000;
          color: #ffffff;
          padding: 1rem 1.5rem;
        }

        .quiz-trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .quiz-trust-item {
          font-size: 0.8125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quiz-trust-rating {
          color: #fbbf24;
        }

        /* Page Container */
        .quiz-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          min-height: 100vh;
        }

        /* Header */
        .quiz-header {
          padding: 1.5rem;
          text-align: center;
          border-bottom: 1px solid #e5e5e5;
        }

        .quiz-logo {
          height: 60px;
          width: auto;
        }

        /* Sections */
        .quiz-section {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        .quiz-intro {
          text-align: center;
          padding-top: 4rem;
        }

        /* Kicker */
        .quiz-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        /* Headlines */
        .quiz-page h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .quiz-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .quiz-page h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
        }

        .quiz-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        /* Scroll indicator */
        .quiz-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 3rem;
        }

        .quiz-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: quiz-bounce 2s ease-in-out infinite;
        }

        @keyframes quiz-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Gender Selection */
        .quiz-gender-label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #171717;
          margin-bottom: 1rem;
        }

        .quiz-gender-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .quiz-gender-btn {
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          padding: 1rem 3rem;
          background: #ffffff;
          color: #171717;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-gender-btn:hover {
          border-color: #000000;
          background: #fafafa;
        }

        /* Progress Bar */
        .quiz-progress-container {
          margin-bottom: 2.5rem;
        }

        .quiz-progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #737373;
          margin-bottom: 0.5rem;
        }

        .quiz-progress-bar {
          height: 6px;
          background: #e5e5e5;
          border-radius: 100px;
          overflow: hidden;
        }

        .quiz-progress-fill {
          height: 100%;
          background: #000000;
          border-radius: 100px;
          transition: width 0.3s ease;
        }

        /* Question */
        .quiz-question-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #171717;
          line-height: 1.4;
          margin-bottom: 2rem;
          text-align: center;
        }

        /* Scale Labels */
        .quiz-scale-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .quiz-scale-label {
          font-size: 0.8125rem;
          color: #737373;
          max-width: 120px;
        }

        .quiz-scale-right {
          text-align: right;
        }

        /* Scale Buttons */
        .quiz-scale-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .quiz-scale-btn {
          width: 44px;
          height: 44px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          background: #ffffff;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #525252;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-scale-btn:hover {
          border-color: #171717;
          color: #171717;
        }

        .quiz-scale-selected {
          background: #000000;
          border-color: #000000;
          color: #ffffff;
        }

        /* Navigation Buttons */
        .quiz-nav-buttons {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .quiz-btn-back {
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.875rem 1.5rem;
          background: #ffffff;
          color: #525252;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-btn-back:hover:not(:disabled) {
          border-color: #171717;
          color: #171717;
        }

        .quiz-btn-back:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quiz-btn-next {
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #000000;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-btn-next:hover:not(:disabled) {
          background: #262626;
        }

        .quiz-btn-next:disabled {
          background: #a3a3a3;
          cursor: not-allowed;
        }

        /* Results */
        .quiz-results {
          text-align: center;
        }

        .quiz-good-results {
          padding: 2rem;
          background: #fafafa;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .quiz-emoji {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .quiz-good-results p {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          max-width: 500px;
          margin: 0 auto;
        }

        .quiz-results-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin: 2.5rem 0 1rem;
          text-align: left;
        }

        /* Concern Cards */
        .quiz-concern-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          text-align: left;
        }

        .quiz-concern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .quiz-concern-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .quiz-concern-score {
          font-size: 0.875rem;
          font-weight: 700;
          color: #dc2626;
          background: #fef2f2;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
        }

        .quiz-concern-insight {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .quiz-concern-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 1rem 0;
        }

        .quiz-treatment-section {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .quiz-treatment-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .quiz-treatment-content {
          flex: 1;
        }

        .quiz-treatment-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
          margin-bottom: 0.25rem;
        }

        .quiz-treatment-text {
          font-size: 0.875rem;
          color: #171717;
          line-height: 1.6;
        }

        /* Next Steps Box */
        .quiz-next-steps-box {
          background: #fafafa;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: left;
        }

        .quiz-next-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .quiz-next-steps-list li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem 0;
          font-size: 0.9375rem;
          color: #525252;
          border-bottom: 1px solid #e5e5e5;
        }

        .quiz-next-steps-list li:last-child {
          border-bottom: none;
        }

        .quiz-step-num {
          width: 28px;
          height: 28px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Discount Box */
        .quiz-discount-box {
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
          text-align: center;
        }

        .quiz-discount-box h3 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .quiz-discount-box p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9375rem;
          margin-bottom: 1.5rem;
        }

        .quiz-discount-badge {
          display: inline-block;
          background: #16a34a;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .quiz-lead-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 320px;
          margin: 0 auto;
        }

        .quiz-lead-form input {
          font-family: inherit;
          font-size: 0.9375rem;
          padding: 0.875rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .quiz-lead-form input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .quiz-lead-form input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.15);
        }

        .quiz-btn-unlock {
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.875rem 1.5rem;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-btn-unlock:hover {
          background: #e5e5e5;
        }

        .quiz-fine-print {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 1rem;
          margin-bottom: 0;
        }

        .quiz-unlocked {
          background: #16a34a;
        }

        .quiz-unlocked-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .quiz-check {
          font-size: 1.5rem;
        }

        /* Panel Cards */
        .quiz-panels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .quiz-panel-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: left;
          position: relative;
        }

        .quiz-panel-featured {
          border: 2px solid #000000;
        }

        .quiz-panel-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #000000;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
        }

        .quiz-panel-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .quiz-panel-price {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .quiz-price-strike {
          font-size: 1.25rem;
          color: #a3a3a3;
          text-decoration: line-through;
          margin-right: 0.5rem;
        }

        .quiz-elite-benefit {
          font-size: 0.8125rem;
          color: #16a34a;
          background: #f0fdf4;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
        }

        .quiz-panel-description {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .quiz-btn-book {
          display: block;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          background: #ffffff;
          color: #171717;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .quiz-btn-book:hover {
          border-color: #000000;
        }

        .quiz-btn-book-featured {
          background: #000000;
          color: #ffffff;
          border-color: #000000;
        }

        .quiz-btn-book-featured:hover {
          background: #262626;
        }

        /* Footer */
        .quiz-footer {
          font-size: 0.875rem;
          color: #737373;
          text-align: center;
          margin-top: 2rem;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .quiz-trust-inner {
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
          }

          .quiz-page h1 {
            font-size: 1.75rem;
          }

          .quiz-page h2 {
            font-size: 1.5rem;
          }

          .quiz-gender-buttons {
            flex-direction: column;
          }

          .quiz-gender-btn {
            padding: 1rem 2rem;
          }

          .quiz-question-text {
            font-size: 1.25rem;
          }

          .quiz-scale-buttons {
            flex-wrap: wrap;
          }

          .quiz-scale-btn {
            width: 40px;
            height: 40px;
            font-size: 0.875rem;
          }

          .quiz-panels-grid {
            grid-template-columns: 1fr;
          }

          .quiz-panel-featured {
            order: -1;
          }
        }
      `}</style>
    </>
  );
}
