import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const QUIZ = {
  pathQuestion: {
    text: 'What are you here for today?',
    options: [
      { value: 'energy', label: 'Low energy, brain fog, or not feeling like myself' },
      { value: 'injury', label: 'Slow recovery from an injury or pain that will not calm down' },
      { value: 'both', label: 'Both' }
    ]
  },
  energy: [
    {
      key: 'main_issue',
      text: 'What is bothering you most right now?',
      type: 'choice',
      options: [
        { value: 'low_energy', label: 'Low energy or afternoon crashes', resultLabel: 'low energy or afternoon crashes' },
        { value: 'brain_fog', label: 'Brain fog or trouble focusing', resultLabel: 'brain fog or trouble focusing' },
        { value: 'weight', label: 'Hard time losing weight', resultLabel: 'a hard time losing weight' },
        { value: 'mood', label: 'Mood, sleep, or stress', resultLabel: 'mood, sleep, or stress' },
        { value: 'mix', label: 'A mix of all of these', resultLabel: 'a mix of energy, focus, weight, and mood issues' }
      ]
    },
    {
      key: 'duration',
      text: 'How long has this been going on?',
      type: 'choice',
      options: [
        { value: 'lt3mo', label: 'Less than 3 months', resultLabel: 'less than 3 months' },
        { value: '3to12mo', label: '3–12 months', resultLabel: '3 to 12 months' },
        { value: 'gt1yr', label: 'More than a year', resultLabel: 'more than a year' }
      ]
    },
    {
      key: 'energy_score',
      text: 'On most days, how would you rate your energy from 1–10?',
      type: 'scale',
      min: 1,
      max: 10,
      lowLabel: 'Low',
      highLabel: 'High'
    },
    {
      key: 'has_labs',
      text: 'Have you had blood work or labs checked in the last 12 months?',
      type: 'choice',
      options: [
        { value: 'fine', label: 'Yes, and I was told things were “fine”', resultLabel: 'told your labs are fine' },
        { value: 'off', label: 'Yes, and I was told some things were off', resultLabel: 'told some things were off' },
        { value: 'no', label: 'No, or I am not sure', resultLabel: "haven't had recent labs" }
      ]
    },
    {
      key: 'urgency_score',
      text: 'How important is it to fix this in the next 90 days?',
      type: 'scale',
      min: 1,
      max: 10,
      lowLabel: 'Not urgent',
      highLabel: 'Very important'
    }
  ],
  injury: [
    {
      key: 'body_area',
      text: 'Where do you hurt the most right now?',
      type: 'choice',
      options: [
        { value: 'shoulder_arm', label: 'Shoulder or arm', resultLabel: 'shoulder or arm' },
        { value: 'back_neck', label: 'Back or neck', resultLabel: 'back or neck' },
        { value: 'hip_knee', label: 'Hip or knee', resultLabel: 'hip or knee' },
        { value: 'foot_ankle', label: 'Foot or ankle', resultLabel: 'foot or ankle' },
        { value: 'other', label: 'Other', resultLabel: 'body' }
      ]
    },
    {
      key: 'chronicity',
      text: 'How long has this injury or pain been going on?',
      type: 'choice',
      options: [
        { value: 'lt6wk', label: 'Less than 6 weeks', resultLabel: 'less than 6 weeks' },
        { value: '6to12wk', label: '6–12 weeks', resultLabel: '6 to 12 weeks' },
        { value: 'gt3mo', label: 'More than 3 months', resultLabel: 'more than 3 months' }
      ]
    },
    {
      key: 'pain_type',
      text: 'What best describes how it feels?',
      type: 'choice',
      options: [
        { value: 'sharp', label: 'Sharp or stabbing' },
        { value: 'dull', label: 'Dull or aching' },
        { value: 'tight', label: 'Tight or stiff' },
        { value: 'burning', label: 'Burning or tingling' }
      ]
    },
    {
      key: 'current_provider',
      text: 'Are you currently working with a chiropractor or physical therapist?',
      type: 'choice',
      options: [
        { value: 'range_st', label: 'Yes, at Range Sports Therapy' },
        { value: 'elsewhere', label: 'Yes, somewhere else' },
        { value: 'no', label: 'No, not right now' }
      ]
    },
    {
      key: 'recovery_feeling',
      text: 'How does your recovery feel so far?',
      type: 'choice',
      options: [
        { value: 'faster', label: 'Faster than I expected', resultLabel: 'faster than expected' },
        { value: 'expected', label: 'About what I expected', resultLabel: 'about what you expected' },
        { value: 'slower', label: 'Slower than I hoped', resultLabel: 'slower than you hoped' }
      ]
    },
    {
      key: 'urgency_score',
      text: 'How important is it to speed up your recovery in the next 60 days?',
      type: 'scale',
      min: 1,
      max: 10,
      lowLabel: 'Not urgent',
      highLabel: 'Very important'
    }
  ]
};

function getResultLabel(questions, questionKey, answerValue) {
  for (const q of questions) {
    if (q.key === questionKey && q.options) {
      const opt = q.options.find(o => o.value === answerValue);
      if (opt) return opt.resultLabel || opt.label;
    }
  }
  return answerValue;
}

function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return '(' + digits;
  if (digits.length <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
  return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
}

function phoneDigits(val) { return val.replace(/\D/g, ''); }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function aOrAn(n) { return (n === 8 || n === 11 || n === 18) ? 'an' : 'a'; }

export default function ClarityFinder() {
  const [screen, setScreen] = useState('landing');
  const [path, setPath] = useState(null);
  const [pathChoice, setPathChoice] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lead, setLead] = useState({ firstName: '', email: '', mobile: '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, qIndex]);

  const questions = path ? QUIZ[path] : [];
  const totalQ = questions.length;

  function handlePathSelect(val) {
    setPathChoice(val);
    setPath(val === 'injury' ? 'injury' : 'energy');
    setQIndex(0);
    setAnswers({});
    setScreen('question');
  }

  function handleAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (qIndex < totalQ - 1) {
      setQIndex(qIndex + 1);
    } else {
      setScreen('lead');
    }
  }

  function handleBack() {
    if (screen === 'lead') {
      setQIndex(totalQ - 1);
      setScreen('question');
    } else if (screen === 'question' && qIndex > 0) {
      setQIndex(qIndex - 1);
    } else {
      setScreen('path');
    }
  }

  function handleSubmitLead() {
    const newErrors = {};
    if (!lead.firstName.trim()) newErrors.firstName = true;
    if (!validEmail(lead.email)) newErrors.email = true;
    if (phoneDigits(lead.mobile).length !== 10) newErrors.mobile = true;
    if (!consent) newErrors.consent = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: lead.firstName.trim(),
        email: lead.email.trim(),
        phone: phoneDigits(lead.mobile),
        path,
        answers: { pathChoice, responses: answers }
      })
    }).catch(err => console.error('Lead submit error:', err));

    setScreen('results');
  }

  function handleRestart() {
    setScreen('landing');
    setPath(null);
    setPathChoice(null);
    setQIndex(0);
    setAnswers({});
    setLead({ firstName: '', email: '', mobile: '' });
    setConsent(false);
    setErrors({});
  }

  const bookingUrl = '/book-assessment'
    + '?firstName=' + encodeURIComponent(lead.firstName)
    + '&email=' + encodeURIComponent(lead.email)
    + '&phone=' + encodeURIComponent(phoneDigits(lead.mobile));

  return (
    <Layout
      title="Clarity Finder | Range Medical"
      description="Take the 3-minute Clarity Finder quiz. Find out what's behind your symptoms and get a clear next step from Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="health quiz, symptom quiz, energy quiz, injury quiz, Newport Beach, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/clarity-finder" />
        <meta property="og:title" content="Clarity Finder | Range Medical" />
        <meta property="og:description" content="3-minute quiz to find out what's behind your symptoms." />
        <meta property="og:url" content="https://www.range-medical.com/clarity-finder" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
      </Head>

      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item"><span className="trust-rating">5.0</span> on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="tx-page">

        {/* ── Landing ── */}
        {screen === 'landing' && (
          <section className="tx-hero">
            <div className="tx-container">
              <div className="tx-label">3-MINUTE QUIZ</div>
              <h1>Why don&apos;t you feel like <em>yourself?</em></h1>
              <div className="tx-rule" />
              <p className="tx-hero-sub">
                Answer a few simple questions. We&apos;ll show you which path fits you best and what to do next.
              </p>
              <button className="tx-btn" onClick={() => setScreen('path')}>Take the Quiz</button>
            </div>
          </section>
        )}

        {/* ── Path Question ── */}
        {screen === 'path' && (
          <section className="tx-section">
            <div className="tx-container">
              <div className="quiz-card">
                <p className="quiz-question">{QUIZ.pathQuestion.text}</p>
                <div className="quiz-options">
                  {QUIZ.pathQuestion.options.map(o => (
                    <button key={o.value} className="quiz-option" onClick={() => handlePathSelect(o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Questions ── */}
        {screen === 'question' && questions[qIndex] && (
          <section className="tx-section">
            <div className="tx-container">
              <div className="quiz-card">
                <div className="quiz-progress">
                  <span className="quiz-progress-label">Question {qIndex + 1} of {totalQ}</span>
                  <div className="quiz-progress-track">
                    <div className="quiz-progress-fill" style={{ width: `${Math.round((qIndex / totalQ) * 100)}%` }} />
                  </div>
                </div>
                <button className="quiz-back" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <p className="quiz-question">{questions[qIndex].text}</p>
                {questions[qIndex].type === 'choice' && (
                  <div className="quiz-options">
                    {questions[qIndex].options.map(o => (
                      <button key={o.value} className="quiz-option" onClick={() => handleAnswer(questions[qIndex].key, o.value)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                {questions[qIndex].type === 'scale' && (
                  <>
                    <div className="quiz-scale-labels">
                      <span>{questions[qIndex].lowLabel}</span>
                      <span>{questions[qIndex].highLabel}</span>
                    </div>
                    <div className="quiz-scale-row">
                      {Array.from({ length: questions[qIndex].max - questions[qIndex].min + 1 }, (_, i) => questions[qIndex].min + i).map(n => (
                        <button key={n} className="quiz-scale-btn" onClick={() => handleAnswer(questions[qIndex].key, n)}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Lead Capture ── */}
        {screen === 'lead' && (
          <section className="tx-section">
            <div className="tx-container">
              <div className="quiz-card">
                <button className="quiz-back" onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <p className="quiz-question">Almost done</p>
                <p className="quiz-subtitle">Enter your info below so we can send you a copy of your results.</p>

                <div className="quiz-form-group">
                  <label className="quiz-form-label">First name</label>
                  <input
                    className={`quiz-form-input ${errors.firstName ? 'quiz-input-error' : ''}`}
                    type="text"
                    autoComplete="given-name"
                    value={lead.firstName}
                    onChange={e => { setLead(p => ({ ...p, firstName: e.target.value })); setErrors(p => ({ ...p, firstName: false })); }}
                  />
                  {errors.firstName && <div className="quiz-error">Please enter your first name.</div>}
                </div>

                <div className="quiz-form-group">
                  <label className="quiz-form-label">Email</label>
                  <input
                    className={`quiz-form-input ${errors.email ? 'quiz-input-error' : ''}`}
                    type="email"
                    autoComplete="email"
                    value={lead.email}
                    onChange={e => { setLead(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: false })); }}
                  />
                  {errors.email && <div className="quiz-error">Please enter a valid email address.</div>}
                </div>

                <div className="quiz-form-group">
                  <label className="quiz-form-label">Mobile number</label>
                  <input
                    className={`quiz-form-input ${errors.mobile ? 'quiz-input-error' : ''}`}
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                    value={lead.mobile}
                    onChange={e => { setLead(p => ({ ...p, mobile: formatPhone(e.target.value) })); setErrors(p => ({ ...p, mobile: false })); }}
                  />
                  {errors.mobile && <div className="quiz-error">Please enter a 10-digit mobile number.</div>}
                </div>

                <div className="quiz-consent">
                  <input
                    type="checkbox"
                    id="quiz-consent"
                    checked={consent}
                    onChange={e => { setConsent(e.target.checked); setErrors(p => ({ ...p, consent: false })); }}
                  />
                  <label htmlFor="quiz-consent">I understand this quiz is for education only and is not medical advice.</label>
                </div>
                {errors.consent && <div className="quiz-error" style={{ marginTop: '-8px', marginBottom: '16px' }}>Please check the box above to continue.</div>}

                <button className="tx-btn quiz-submit-btn" onClick={handleSubmitLead}>See My Results</button>
              </div>
            </div>
          </section>
        )}

        {/* ── Results ── */}
        {screen === 'results' && path === 'energy' && (
          <>
            <section className="tx-section">
              <div className="tx-container">
                <div className="quiz-results-header">
                  <div className="tx-label">YOUR RESULTS</div>
                  <h1>You are an Energy &amp; Optimization <em>case.</em></h1>
                  <div className="tx-rule" />
                </div>
                <div className="quiz-results-body">
                  <p>
                    {lead.firstName}, from what you shared, your biggest struggle right now is {getResultLabel(questions, 'main_issue', answers.main_issue)} and
                    it has been going on for {getResultLabel(questions, 'duration', answers.duration)}. You rated your daily energy
                    at {answers.energy_score} out of 10, which tells us this is starting to impact your days.
                  </p>
                  <p>
                    Many people we see have been told their basic labs are &ldquo;fine,&rdquo; but they still feel tired, foggy, or not
                    like themselves. At Range Medical, we match how you feel with more detailed labs, then build a simple
                    step-by-step plan instead of guessing.
                  </p>
                  <p>
                    The next step is a Range Assessment. In one visit, we review focused labs and your symptoms together and
                    give you a written plan you can follow.
                  </p>
                  <p>
                    <strong>Tip:</strong> Come fasted (no food for 12 hours, water is fine). If your provider recommends labs,
                    we can draw blood during the same visit so you do not need a second trip.
                  </p>
                  <div className="quiz-urgency">
                    We reserve a limited number of Range Assessment spots each week so we can spend real time with each person.
                    Since you rated fixing this as {aOrAn(answers.urgency_score)} {answers.urgency_score} out of 10, it makes sense
                    to grab a time while this is fresh in your mind.
                  </div>

                  {pathChoice === 'both' && (
                    <div className="quiz-both-note">
                      You also mentioned dealing with an injury or pain. During your Range Assessment, we can discuss your
                      recovery goals and whether one of our Recovery Programs is a good fit alongside your optimization plan.
                    </div>
                  )}

                  <div className="quiz-cta-box">
                    <Link href={bookingUrl} className="tx-btn">Schedule Your Range Assessment</Link>
                    <p className="quiz-secondary-note">Not ready to book right now? We&apos;ll email your quiz answers so you can review them later.</p>
                  </div>
                </div>
              </div>
            </section>
            <div style={{ textAlign: 'center', padding: '0 0 3rem' }}>
              <button className="quiz-restart" onClick={handleRestart}>Start over</button>
            </div>
          </>
        )}

        {screen === 'results' && path === 'injury' && (
          <>
            <section className="tx-section">
              <div className="tx-container">
                <div className="quiz-results-header">
                  <div className="tx-label">YOUR RESULTS</div>
                  <h1>You are an Injury &amp; Recovery <em>case.</em></h1>
                  <div className="tx-rule" />
                </div>
                <div className="quiz-results-body">
                  <p>
                    {lead.firstName}, you told us your main pain is in your {getResultLabel(questions, 'body_area', answers.body_area)} and
                    it has been going on for {getResultLabel(questions, 'chronicity', answers.chronicity)}. That kind of pain can wear you
                    down over time, especially when it makes simple movements harder.
                  </p>
                  <p>
                    Many patients feel like their recovery is {getResultLabel(questions, 'recovery_feeling', answers.recovery_feeling)} and
                    wish things would calm down faster. In our clinic, people often get the best results when they pair hands-on care with
                    recovery support tools like red light therapy, oxygen, peptide therapy, and targeted treatments to help tissues heal and settle.
                  </p>
                  <p>
                    The next step is a Range Assessment with our team. We listen to what has been tried so far, look at
                    your goals, and map out a recovery plan tailored to you.
                  </p>
                  <p>
                    <strong>Tip:</strong> Come fasted (no food for 12 hours, water is fine). If your provider recommends labs,
                    we can draw blood during the same visit so you do not need a second trip.
                  </p>
                  <div className="quiz-urgency">
                    You rated speeding this up as {aOrAn(answers.urgency_score)} {answers.urgency_score} out of 10. The sooner we see you,
                    the sooner we can map out a plan so this does not keep dragging on.
                  </div>

                  {answers.current_provider === 'range_st' && (
                    <div className="quiz-range-st-note">
                      Show this screen to your therapist and ask about a Range Assessment. We&apos;re in the same building and work
                      together often on recovery cases like yours.
                    </div>
                  )}

                  <div className="quiz-cta-box">
                    {answers.current_provider === 'range_st' ? (
                      <span className="tx-btn" style={{ cursor: 'default' }}>Show this screen to your therapist</span>
                    ) : (
                      <Link href={bookingUrl} className="tx-btn">Schedule Your Range Assessment</Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <div style={{ textAlign: 'center', padding: '0 0 3rem' }}>
              <button className="quiz-restart" onClick={handleRestart}>Start over</button>
            </div>
          </>
        )}

      </div>

      <style jsx>{`
        .quiz-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          padding: 40px 36px;
          max-width: 640px;
          margin: 0 auto;
        }
        .quiz-progress { margin-bottom: 28px; }
        .quiz-progress-label {
          font-size: 13px;
          color: #888;
          margin-bottom: 8px;
          display: block;
        }
        .quiz-progress-track {
          height: 4px;
          background: #e8ecee;
          border-radius: 2px;
          overflow: hidden;
        }
        .quiz-progress-fill {
          height: 100%;
          background: var(--color-accent);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .quiz-back {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          font-family: inherit;
        }
        .quiz-back:hover { color: #555; }
        .quiz-question {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.35;
          margin-bottom: 24px;
          color: var(--text-primary);
        }
        .quiz-subtitle {
          font-size: 15px;
          color: #777;
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .quiz-options { display: flex; flex-direction: column; gap: 10px; }
        .quiz-option {
          display: block;
          width: 100%;
          text-align: left;
          background: #fff;
          border: 1.5px solid #dde1e4;
          border-radius: 10px;
          padding: 16px 18px;
          font-size: 16px;
          line-height: 1.4;
          color: var(--text-primary);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: inherit;
        }
        .quiz-option:hover {
          border-color: var(--color-accent);
          background: #f5fbf9;
        }
        .quiz-scale-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #999;
          margin-bottom: 10px;
          padding: 0 2px;
        }
        .quiz-scale-row {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 6px;
        }
        .quiz-scale-btn {
          height: 48px;
          border: 1.5px solid #dde1e4;
          border-radius: 10px;
          background: #fff;
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }
        .quiz-scale-btn:hover {
          border-color: var(--color-accent);
          background: #f5fbf9;
        }
        .quiz-form-group { margin-bottom: 16px; }
        .quiz-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #333;
        }
        .quiz-form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #dde1e4;
          border-radius: 8px;
          font-size: 16px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .quiz-form-input:focus { border-color: var(--color-accent); }
        .quiz-input-error { border-color: #d32f2f; }
        .quiz-error {
          font-size: 13px;
          color: #d32f2f;
          margin-top: 4px;
        }
        .quiz-consent {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 24px 0 28px;
        }
        .quiz-consent input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: var(--color-accent);
        }
        .quiz-consent label {
          font-size: 14px;
          line-height: 1.45;
          color: #555;
          cursor: pointer;
        }
        .quiz-submit-btn {
          width: 100%;
          text-align: center;
        }
        .quiz-results-header {
          max-width: 640px;
          margin: 0 auto 2rem;
        }
        .quiz-results-header h1 {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 700;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .quiz-results-body {
          max-width: 640px;
          margin: 0 auto;
        }
        .quiz-results-body p {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }
        .quiz-urgency {
          background: #fffbf0;
          border-left: 3px solid #d4a017;
          padding: 18px 20px;
          border-radius: 0 8px 8px 0;
          font-size: 15px;
          line-height: 1.6;
          color: #5a4600;
          margin: 28px 0;
        }
        .quiz-range-st-note {
          background: #f0f7ff;
          border-left: 3px solid #3b7dd8;
          padding: 18px 20px;
          border-radius: 0 8px 8px 0;
          font-size: 15px;
          line-height: 1.6;
          color: #1a3a5c;
          margin-top: 20px;
        }
        .quiz-both-note {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 18px 20px;
          font-size: 14px;
          line-height: 1.6;
          color: #555;
          margin-top: 24px;
        }
        .quiz-cta-box {
          margin-top: 2.5rem;
          padding-top: 2.5rem;
          border-top: 1px solid #e5e5e5;
          text-align: center;
        }
        .quiz-secondary-note {
          font-size: 14px;
          color: #999;
          margin-top: 16px;
          line-height: 1.5;
        }
        .quiz-restart {
          display: block;
          margin: 28px auto 0;
          font-size: 14px;
          color: #999;
          cursor: pointer;
          background: none;
          border: none;
          text-decoration: underline;
          font-family: inherit;
        }
        .quiz-restart:hover { color: #666; }
        @media (max-width: 600px) {
          .quiz-card { padding: 28px 20px; }
          .quiz-question { font-size: 19px; }
          .quiz-scale-btn { height: 42px; font-size: 15px; }
          .quiz-scale-row { gap: 4px; }
        }
      `}</style>
    </Layout>
  );
}
