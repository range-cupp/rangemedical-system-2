// /pages/symptom-questionnaire.js
// Symptom Questionnaire - Saves to patient profile

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const QUESTIONS = [
  { id: 'goals', section: 'About You Today', text: 'What are the top 1-3 things you want to feel better about?', type: 'text' },
  { id: 'overall_health', section: 'About You Today', text: 'In the last 4 weeks, how has your overall health felt?', type: 'slider', min: 1, max: 10, minLabel: 'Terrible', maxLabel: 'Best it has ever been' },
  { id: 'energy', section: 'Energy and Brain', text: 'How is your daytime energy?', type: 'slider', min: 1, max: 10, minLabel: 'No energy', maxLabel: 'Great all day' },
  { id: 'fatigue', section: 'Energy and Brain', text: 'How often do you feel tired or worn out during the day?', type: 'slider', min: 1, max: 10, minLabel: 'Never', maxLabel: 'All the time' },
  { id: 'focus', section: 'Energy and Brain', text: 'How clear is your thinking and focus?', type: 'slider', min: 1, max: 10, minLabel: 'Very foggy', maxLabel: 'Very sharp' },
  { id: 'memory', section: 'Energy and Brain', text: 'How is your memory for simple things day to day?', type: 'slider', min: 1, max: 10, minLabel: 'Very poor', maxLabel: 'Very good' },
  { id: 'sleep_onset', section: 'Sleep', text: 'How easy is it to fall asleep at night?', type: 'slider', min: 1, max: 10, minLabel: 'Very hard', maxLabel: 'Very easy' },
  { id: 'sleep_quality', section: 'Sleep', text: 'How rested do you feel when you wake up?', type: 'slider', min: 1, max: 10, minLabel: 'Not rested at all', maxLabel: 'Very rested' },
  { id: 'mood', section: 'Mood and Stress', text: 'How is your mood most days?', type: 'slider', min: 1, max: 10, minLabel: 'Very low', maxLabel: 'Very good' },
  { id: 'stress', section: 'Mood and Stress', text: 'How stressed or on edge do you feel most days?', type: 'slider', min: 1, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely' },
  { id: 'anxiety', section: 'Mood and Stress', text: 'How often do you feel anxious or worried?', type: 'slider', min: 1, max: 10, minLabel: 'Never', maxLabel: 'Almost all the time' },
  { id: 'weight_satisfaction', section: 'Weight and Metabolism', text: 'How happy are you with your weight and body shape right now?', type: 'slider', min: 1, max: 10, minLabel: 'Very unhappy', maxLabel: 'Very happy' },
  { id: 'weight_loss_ease', section: 'Weight and Metabolism', text: 'How easy is it for you to lose weight when you try?', type: 'slider', min: 1, max: 10, minLabel: 'Very hard', maxLabel: 'Very easy' },
  { id: 'cravings', section: 'Weight and Metabolism', text: 'Do you have strong food or sugar cravings?', type: 'slider', min: 1, max: 10, minLabel: 'Never', maxLabel: 'Very strong every day' },
  { id: 'recovery', section: 'Recovery and Pain', text: 'How fast do you feel you recover from workouts, work, or injury?', type: 'slider', min: 1, max: 10, minLabel: 'Very slow', maxLabel: 'Very fast' },
  { id: 'pain', section: 'Recovery and Pain', text: 'How much pain or soreness do you feel most days?', type: 'slider', min: 1, max: 10, minLabel: 'None', maxLabel: 'Severe' },
  { id: 'strength', section: 'Recovery and Pain', text: 'How strong do you feel overall?', type: 'slider', min: 1, max: 10, minLabel: 'Very weak', maxLabel: 'Very strong' },
  { id: 'libido', section: 'Hormones and Sexual Health', text: 'How is your sex drive (interest in sex)?', type: 'slider', min: 1, max: 10, minLabel: 'None', maxLabel: 'Very strong' },
  { id: 'sexual_performance', section: 'Hormones and Sexual Health', text: 'How is your sexual performance or satisfaction?', type: 'slider', min: 1, max: 10, minLabel: 'Very poor', maxLabel: 'Very good' }
];

export default function SymptomQuestionnaire() {
  const router = useRouter();
  const { email, name, phone } = router.query;
  
  const [patientInfo, setPatientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [responses, setResponses] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (email) setPatientInfo(prev => ({ ...prev, email }));
    if (phone) setPatientInfo(prev => ({ ...prev, phone }));
    if (name) {
      const parts = name.split(' ');
      setPatientInfo(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      }));
    }
  }, [email, name, phone]);

  // Initialize slider values
  useEffect(() => {
    const initialResponses = {};
    QUESTIONS.forEach(q => {
      if (q.type === 'slider') {
        initialResponses[q.id] = 5;
      }
    });
    setResponses(initialResponses);
  }, []);

  const sections = [...new Set(QUESTIONS.map(q => q.section))];
  const sectionQuestions = QUESTIONS.filter(q => q.section === sections[currentSection]);

  async function handleSubmit() {
    if (!patientInfo.email && !patientInfo.phone) {
      alert('Please provide your email or phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/symptoms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientInfo.email,
          phone: patientInfo.phone,
          firstName: patientInfo.firstName,
          lastName: patientInfo.lastName,
          responses,
          questionnaireName: 'core',
          responseType: 'baseline'
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        alert('Error submitting: ' + (data.error || 'Please try again'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Head>
          <title>Thank You | Range Medical</title>
        </Head>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.successIcon}>✓</div>
            <h1 style={styles.successTitle}>Thank You!</h1>
            <p style={styles.successText}>
              Your questionnaire has been submitted successfully. Your provider will review your responses and follow up with you.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Symptom Questionnaire | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <img 
            src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" 
            alt="Range Medical" 
            style={styles.logo}
          />
          <h1 style={styles.title}>Core Symptom Questionnaire</h1>
          <p style={styles.subtitle}>
            Please complete this questionnaire so we can better understand how you're feeling and tailor your care.
          </p>
        </div>

        {/* Patient Info Section */}
        {currentSection === 0 && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Patient Information</h2>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  value={patientInfo.firstName}
                  onChange={e => setPatientInfo({...patientInfo, firstName: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  type="text"
                  value={patientInfo.lastName}
                  onChange={e => setPatientInfo({...patientInfo, lastName: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={patientInfo.email}
                onChange={e => setPatientInfo({...patientInfo, email: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                value={patientInfo.phone}
                onChange={e => setPatientInfo({...patientInfo, phone: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={styles.progress}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${((currentSection + 1) / (sections.length + 1)) * 100}%`
              }}
            />
          </div>
          <span style={styles.progressText}>
            Section {currentSection + 1} of {sections.length + 1}
          </span>
        </div>

        {/* Questions */}
        {currentSection > 0 && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>{sections[currentSection - 1]}</h2>
            {QUESTIONS.filter(q => q.section === sections[currentSection - 1]).map(question => (
              <div key={question.id} style={styles.question}>
                <label style={styles.questionText}>{question.text}</label>
                
                {question.type === 'text' && (
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={e => setResponses({...responses, [question.id]: e.target.value})}
                    style={styles.textarea}
                    rows={3}
                  />
                )}
                
                {question.type === 'slider' && (
                  <div style={styles.sliderContainer}>
                    <div style={styles.sliderLabels}>
                      <span>{question.minLabel}</span>
                      <span>{question.maxLabel}</span>
                    </div>
                    <input
                      type="range"
                      min={question.min}
                      max={question.max}
                      value={responses[question.id] || 5}
                      onChange={e => setResponses({...responses, [question.id]: parseInt(e.target.value)})}
                      style={styles.slider}
                    />
                    <div style={styles.sliderValue}>{responses[question.id] || 5}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navigation}>
          {currentSection > 0 && (
            <button 
              onClick={() => setCurrentSection(currentSection - 1)}
              style={styles.backButton}
            >
              ← Back
            </button>
          )}
          
          {currentSection < sections.length ? (
            <button 
              onClick={() => setCurrentSection(currentSection + 1)}
              style={styles.nextButton}
              disabled={currentSection === 0 && (!patientInfo.firstName || !patientInfo.email)}
            >
              Next →
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              style={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Questionnaire'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    height: '40px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#666',
    margin: 0
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '20px'
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  formGroup: {
    flex: 1,
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  question: {
    marginBottom: '24px'
  },
  questionText: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '12px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  sliderContainer: {
    padding: '8px 0'
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px'
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    appearance: 'none',
    background: '#e5e7eb',
    outline: 'none'
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '8px',
    color: '#000'
  },
  progress: {
    marginBottom: '20px'
  },
  progressBar: {
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: '2px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '13px',
    color: '#666'
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  backButton: {
    padding: '14px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  nextButton: {
    padding: '14px 24px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  submitButton: {
    padding: '14px 32px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: '#fff',
    margin: '0 auto 24px'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '12px'
  },
  successText: {
    textAlign: 'center',
    color: '#666'
  }
};
