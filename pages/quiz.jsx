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
      treatments: 'GLP-1 weight loss program (Retatrutide, Semaglutide), thyroid optimization, metabolic reset',
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
    
    // Could add Supabase/GHL integration here
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
      </Head>

      <div className="quiz-page">
        {/* Intro Section */}
        {section === 'intro' && (
          <div className="quiz-section">
            <div className="quiz-header">
              <Link href="/">
                <img 
                  src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" 
                  alt="Range Medical" 
                  className="quiz-logo"
                />
              </Link>
            </div>
            <div className="quiz-kicker">2-Minute Assessment</div>
            <h1>What's Your Body Telling You?</h1>
            <p className="quiz-subtitle">Answer 10 quick questions about how you feel. We'll show you exactly which biomarkers explain your symptoms—and what we can do about it.</p>
            
            <p className="gender-label">First, select your biological sex:</p>
            
            <div className="gender-buttons">
              <button className="gender-btn" onClick={() => selectGender('male')}>Male</button>
              <button className="gender-btn" onClick={() => selectGender('female')}>Female</button>
            </div>
          </div>
        )}

        {/* Questions Section */}
        {section === 'questions' && (
          <div className="quiz-section">
            <div className="progress-container">
              <div className="progress-info">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            
            <div className="question-text">{q.question}</div>
            
            <div className="scale-labels">
              <span className="scale-label">{q.lowLabel}</span>
              <span className="scale-label right">{q.highLabel}</span>
            </div>
            
            <div className="scale-buttons">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <button 
                  key={i}
                  className={`scale-btn ${answers[q.id] === i ? 'selected' : ''}`}
                  onClick={() => selectAnswer(i)}
                >
                  {i}
                </button>
              ))}
            </div>
            
            <div className="nav-buttons">
              <button 
                className="btn-back" 
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                ← Back
              </button>
              <button 
                className="btn-next"
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
          <div className="quiz-section">
            {problems.length === 0 ? (
              <>
                <div className="good-results">
                  <div className="emoji">✨</div>
                  <h2>Great News!</h2>
                  <p>Based on your answers, you're feeling pretty good across the board. That said, the best time to get baseline labs is when you're feeling healthy—so you know your optimal levels and can track changes over time.</p>
                </div>
              </>
            ) : (
              <>
                <div className="quiz-kicker">Your Results</div>
                <h2>Here's What We Found</h2>
                <p className="quiz-subtitle">Based on your answers, you have {problems.length} area{problems.length > 1 ? 's' : ''} we should look into. Here's what your labs would reveal—and how we can help.</p>
                
                <div className="results-label">Your Concern Areas</div>
                
                {problems.map(p => (
                  <div key={p.id} className="concern-card">
                    <div className="concern-header">
                      <div className="concern-title">{p.title}</div>
                      <div className="concern-score">{answers[p.id]}/10</div>
                    </div>
                    <p className="concern-insight">{p.insight}</p>
                    <div className="concern-divider" />
                    <div className="treatment-section">
                      <div className="treatment-icon">{p.treatmentIcon}</div>
                      <div className="treatment-content">
                        <div className="treatment-label">If biomarkers are off, treatment options include</div>
                        <div className="treatment-text">{p.treatments}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* What happens next */}
            <div className="next-steps-box">
              <h3>What Happens Next</h3>
              <ul className="next-steps-list">
                <li>
                  <span className="step-num">1</span>
                  <span>Book your blood draw at our Newport Beach clinic (takes 10 minutes)</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span>Results come back within 3-5 business days</span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span>Meet 1:1 with your provider to review results and discuss treatment options</span>
                </li>
              </ul>
            </div>

            {/* Lead capture */}
            {!discountUnlocked ? (
              <div className="discount-box">
                <div className="discount-badge">Limited Time</div>
                <h3>Get $50 Off Your Labs</h3>
                <p>Complete the form below to unlock $50 off either panel. We'll send you booking details.</p>
                <div className="lead-form">
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
                  <button className="btn-unlock" onClick={unlockDiscount}>
                    Unlock $50 Off →
                  </button>
                </div>
                <p className="fine-print">We respect your privacy. No spam, ever.</p>
              </div>
            ) : (
              <div className="discount-box unlocked">
                <div className="discount-badge">Discount Applied</div>
                <div className="unlocked-message">
                  <span className="check">✓</span>
                  <span>$50 Off Unlocked!</span>
                </div>
                <p style={{ marginTop: '1rem', marginBottom: 0 }}>
                  Thanks, {leadInfo.name.split(' ')[0]}! Your discount will be applied when you book.
                </p>
              </div>
            )}

            {/* Panel options */}
            <div className="results-label">Choose Your Panel</div>
            
            <div className="panels-grid">
              <div className="panel-card essential">
                <div className="panel-name">Essential Panel</div>
                <div className="panel-price">
                  {discountUnlocked ? (
                    <><span className="price-strike">$350</span> $300</>
                  ) : '$350'}
                </div>
                <p className="panel-description">Complete hormone, thyroid, and metabolic panel. Includes HgbA1c, full lipid panel, and 1:1 provider review.</p>
                <a href={getSmsLink('essential')} className="btn-book">Book Essential →</a>
              </div>
              
              <div className="panel-card elite">
                <div className="panel-name">Elite Panel</div>
                <div className="panel-price">
                  {discountUnlocked ? (
                    <><span className="price-strike">$750</span> $700</>
                  ) : '$750'}
                </div>
                {hasEliteBenefit() && problems.length > 0 && (
                  <div className="elite-benefit">✓ Recommended for your concerns—includes {getEliteBenefitReason(problems)}</div>
                )}
                <p className="panel-description">Everything in Essential plus advanced cardiovascular, inflammation, adrenal, and growth markers.</p>
                <a href={getSmsLink('elite')} className="btn-book">Book Elite →</a>
              </div>
            </div>
            
            <p className="quiz-footer">Range Medical · 1901 Westcliff Dr Suite 10, Newport Beach</p>
          </div>
        )}
      </div>
    </>
  );
}
