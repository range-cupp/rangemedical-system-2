import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Biomarker mapping - which markers are relevant for each symptom/goal
const biomarkerMapping = {
  symptoms: {
    fatigue: {
      essential: ['TSH', 'T3, Free', 'T4, Total', 'Testosterone (Free & Total)', 'Vitamin D', 'HbA1c', 'CBC'],
      elite: ['Ferritin', 'Iron & TIBC', 'Vitamin B-12', 'Cortisol'],
      reason: 'Feeling tired can come from your thyroid, low hormones, or missing vitamins.'
    },
    brain_fog: {
      essential: ['TSH', 'T3, Free', 'T4, Total', 'Testosterone (Free & Total)', 'Vitamin D'],
      elite: ['Vitamin B-12', 'Homocysteine', 'Cortisol', 'Ferritin'],
      reason: 'Trouble focusing is often caused by thyroid or hormone levels being off.'
    },
    weight_gain: {
      essential: ['TSH', 'T3, Free', 'T4, Total', 'Insulin, Fasting', 'HbA1c', 'Testosterone (Free & Total)', 'Estradiol'],
      elite: ['Cortisol', 'DHEA-S', 'Lipid Panel (Advanced)'],
      reason: 'Gaining weight for no clear reason can point to thyroid or blood sugar issues.'
    },
    poor_sleep: {
      essential: ['TSH', 'Testosterone (Free & Total)', 'Estradiol'],
      elite: ['Cortisol', 'DHEA-S', 'Magnesium'],
      reason: 'Bad sleep is often tied to stress hormones or hormone levels being off.'
    },
    low_libido: {
      essential: ['Testosterone (Free & Total)', 'SHBG', 'Estradiol', 'TSH'],
      elite: ['DHEA-S', 'Cortisol', 'Prolactin'],
      reason: 'Low sex drive is usually linked to testosterone and other key hormones.'
    },
    muscle_loss: {
      essential: ['Testosterone (Free & Total)', 'SHBG'],
      elite: ['IGF-1', 'DHEA-S', 'Cortisol', 'CRP-HS'],
      reason: 'Losing muscle often means testosterone is low or stress hormones are too high.'
    },
    mood_changes: {
      essential: ['TSH', 'T3, Free', 'Testosterone (Free & Total)', 'Vitamin D'],
      elite: ['Vitamin B-12', 'Cortisol', 'DHEA-S', 'Homocysteine'],
      reason: 'Mood swings can be caused by thyroid issues, hormone levels, or low vitamins.'
    },
    recovery: {
      essential: ['Testosterone (Free & Total)', 'CBC'],
      elite: ['IGF-1', 'Cortisol', 'CRP-HS', 'Ferritin', 'Magnesium'],
      reason: 'Slow recovery often means hormones or minerals are out of balance.'
    }
  },
  goals: {
    more_energy: {
      essential: ['TSH', 'T3, Free', 'Testosterone (Free & Total)', 'Vitamin D', 'HbA1c'],
      elite: ['Vitamin B-12', 'Ferritin', 'Iron & TIBC', 'Cortisol'],
      reason: 'Lasting energy needs your thyroid, hormones, and vitamins working well together.'
    },
    better_sleep: {
      essential: ['TSH', 'Testosterone (Free & Total)'],
      elite: ['Cortisol', 'Magnesium', 'DHEA-S'],
      reason: 'Good sleep depends on balanced stress hormones and the right mineral levels.'
    },
    lose_weight: {
      essential: ['TSH', 'T3, Free', 'T4, Total', 'Insulin, Fasting', 'HbA1c', 'Testosterone (Free & Total)', 'Lipid Panel'],
      elite: ['Cortisol', 'CRP-HS', 'Apolipoprotein B'],
      reason: 'Weight loss works best when your thyroid, blood sugar, and hormones are in check.'
    },
    build_muscle: {
      essential: ['Testosterone (Free & Total)', 'SHBG'],
      elite: ['IGF-1', 'DHEA-S', 'Cortisol', 'CRP-HS'],
      reason: 'Building muscle needs good testosterone levels and low inflammation.'
    },
    mental_clarity: {
      essential: ['TSH', 'T3, Free', 'Testosterone (Free & Total)', 'Vitamin D'],
      elite: ['Vitamin B-12', 'Homocysteine', 'Folate', 'Cortisol'],
      reason: 'Clear thinking depends on your thyroid and B-vitamins working together.'
    },
    feel_myself: {
      essential: ['Full Hormone Panel', 'Thyroid Panel', 'Metabolic Markers'],
      elite: ['Comprehensive Testing'],
      reason: 'A full picture helps us find exactly what\'s off so we can fix it.'
    },
    longevity: {
      essential: ['Lipid Panel', 'HbA1c', 'Insulin'],
      elite: ['Apolipoprotein B', 'Lipoprotein(a)', 'Homocysteine', 'CRP-HS', 'IGF-1', 'Uric Acid'],
      reason: 'Living longer and healthier means checking your heart and blood sugar markers closely.'
    },
    performance: {
      essential: ['Testosterone (Free & Total)', 'SHBG', 'Estradiol', 'CBC'],
      elite: ['IGF-1', 'DHEA-S', 'Cortisol', 'Ferritin', 'Iron & TIBC', 'Magnesium'],
      reason: 'Peak performance needs strong hormones, good iron levels, and fast recovery.'
    }
  }
};

// Symptom and goal labels for display
const symptomLabels = {
  fatigue: 'Fatigue or low energy',
  brain_fog: 'Brain fog or poor focus',
  weight_gain: 'Unexplained weight gain',
  poor_sleep: 'Poor sleep or insomnia',
  low_libido: 'Low libido or sexual function',
  muscle_loss: 'Muscle loss or weakness',
  mood_changes: 'Mood changes or irritability',
  recovery: 'Slow recovery from workouts'
};

const goalLabels = {
  more_energy: 'More energy throughout the day',
  better_sleep: 'Better, more restful sleep',
  lose_weight: 'Lose weight',
  build_muscle: 'Build or maintain muscle',
  mental_clarity: 'Mental clarity and focus',
  feel_myself: 'Feel like myself again',
  longevity: 'Optimize for longevity',
  performance: 'Athletic or sexual performance'
};

export default function RangeAssessment() {
  const router = useRouter();
  const { path } = router.query;

  const [selectedPath, setSelectedPath] = useState(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showInjuryResults, setShowInjuryResults] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    injuryType: '',
    injuryTypeOther: '',
    injuryLocation: '',
    injuryLocationOther: '',
    injuryDuration: '',
    inPhysicalTherapy: '',
    recoveryGoal: [],
    wantsPTRecommendation: null,
    symptoms: [],
    symptomDuration: '',
    lastLabWork: '',
    triedHormoneTherapy: '',
    goals: [],
    additionalInfo: ''
  });

  useEffect(() => {
    if (path === 'injury' || path === 'energy') {
      setSelectedPath(path);
    }
  }, [path]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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

  // Calculate lab recommendation based on symptoms and goals
  const calculateRecommendation = () => {
    const { symptoms, goals, lastLabWork } = formData;

    const essentialMarkers = new Set();
    const eliteMarkers = new Set();
    const reasons = [];

    // Collect markers from symptoms
    symptoms.forEach(symptom => {
      const mapping = biomarkerMapping.symptoms[symptom];
      if (mapping) {
        mapping.essential.forEach(m => essentialMarkers.add(m));
        mapping.elite.forEach(m => eliteMarkers.add(m));
        reasons.push({ type: 'symptom', key: symptom, reason: mapping.reason });
      }
    });

    // Collect markers from goals
    goals.forEach(goal => {
      const mapping = biomarkerMapping.goals[goal];
      if (mapping) {
        mapping.essential.forEach(m => essentialMarkers.add(m));
        mapping.elite.forEach(m => eliteMarkers.add(m));
        reasons.push({ type: 'goal', key: goal, reason: mapping.reason });
      }
    });

    // Determine recommendation logic
    const eliteReasons = [];

    // Elite if: hasn't had labs in over a year or never
    if (lastLabWork === 'over_year' || lastLabWork === 'never') {
      eliteReasons.push("It's been a while since your last blood work — we should check everything to see where you stand");
    }
    // Elite if: longevity goal
    if (goals.includes('longevity')) {
      eliteReasons.push('You want to live longer and healthier — we need to check your heart and blood sugar markers closely');
    }
    // Elite if: 3+ symptoms
    if (symptoms.length >= 3) {
      eliteReasons.push('You have several symptoms — we should check more markers to get the full picture');
    }
    // Elite if: performance goal
    if (goals.includes('performance')) {
      eliteReasons.push('Peak performance needs us to check your growth and recovery hormones');
    }
    // Elite if: brain fog + mood/fatigue combo
    if (symptoms.includes('brain_fog') && (symptoms.includes('mood_changes') || symptoms.includes('fatigue'))) {
      eliteReasons.push('Your symptoms together suggest we should check your B-vitamins and brain health markers');
    }
    // Elite if: muscle-related
    if (symptoms.includes('muscle_loss') || goals.includes('build_muscle')) {
      eliteReasons.push('Building or keeping muscle means we need to check your growth hormones');
    }
    // Elite if: slow recovery
    if (symptoms.includes('recovery')) {
      eliteReasons.push('Slow recovery usually means we should check for hidden inflammation');
    }

    const recommendElite = eliteReasons.length > 0;

    return {
      panel: recommendElite ? 'elite' : 'essential',
      essentialMarkers: Array.from(essentialMarkers),
      eliteMarkers: Array.from(eliteMarkers),
      reasons,
      eliteReasons,
      symptoms,
      goals,
      lastLabWork
    };
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

      // For Energy path, show lab results. For Injury path, show peptide results
      if (selectedPath === 'energy') {
        const rec = calculateRecommendation();
        setRecommendation(rec);
        setIsSubmitting(false);
        setShowResults(true);
      } else {
        setIsSubmitting(false);
        setShowInjuryResults(true);
      }
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Payment links
  const PAYMENT_LINKS = {
    elite: 'https://link.range-medical.com/payment-link/698365ba6503ca98c6834212',
    essential: 'https://link.range-medical.com/payment-link/698365fcc80eaf78e79b8ef7'
  };

  // Open payment in centered popup window
  const openPaymentPopup = (panelType) => {
    const url = PAYMENT_LINKS[panelType];
    const width = 500;
    const height = 700;
    const left = (window.innerWidth - width) / 2 + window.screenX;
    const top = (window.innerHeight - height) / 2 + window.screenY;
    window.open(
      url,
      'RangePayment',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // Get peptide benefits based on injury type and goal
  const getPeptideBenefits = () => {
    const { injuryType, injuryLocation, recoveryGoal } = formData;

    const bpcBenefits = [];
    const tb4Benefits = [];

    // BPC-157 benefits based on injury type
    if (injuryType === 'joint_ligament') {
      bpcBenefits.push('May support ligament and joint tissue repair');
    }
    if (injuryType === 'muscle_tendon') {
      bpcBenefits.push('May help repair muscle and tendon damage');
    }
    if (injuryType === 'post_surgical') {
      bpcBenefits.push('Could help speed tissue healing after surgery');
    }
    if (injuryType === 'chronic_pain') {
      bpcBenefits.push('May support healing of damaged tissue causing pain');
    }
    if (injuryType === 'fracture') {
      bpcBenefits.push('Could promote bone and surrounding tissue repair');
    }

    // TB-4 benefits based on recovery goals (now an array)
    const goals = recoveryGoal || [];
    if (goals.includes('reduce_pain')) {
      tb4Benefits.push('May help reduce inflammation and swelling');
    }
    if (goals.includes('speed_healing')) {
      tb4Benefits.push('Could bring more blood flow to the injured area');
    }
    if (goals.includes('return_sport')) {
      tb4Benefits.push('May help rebuild tissue strength for activity');
    }
    if (goals.includes('avoid_surgery')) {
      tb4Benefits.push('Could support natural healing');
    }
    if (goals.includes('post_surgery')) {
      tb4Benefits.push('May promote faster recovery after surgical repair');
    }

    // Add general benefits if lists are short
    if (bpcBenefits.length === 0) {
      bpcBenefits.push('May support tissue repair at the injury site');
    }
    if (tb4Benefits.length === 0) {
      tb4Benefits.push('May help reduce inflammation and improve blood flow');
    }

    // Always add these
    bpcBenefits.push('Could improve blood flow to damaged tissue');
    tb4Benefits.push('May help cells move to where healing is needed');

    return { bpcBenefits, tb4Benefits };
  };

  // Injury Results screen
  if (showInjuryResults) {
    const peptideBenefits = getPeptideBenefits();

    // Label mappings for display
    const injuryTypeLabels = {
      'joint_ligament': 'Joint or ligament injury',
      'muscle_tendon': 'Muscle or tendon injury',
      'post_surgical': 'Post-surgical recovery',
      'concussion': 'Concussion or head injury',
      'chronic_pain': 'Chronic pain condition',
      'fracture': 'Bone fracture',
      'other': 'Other'
    };
    const locationLabels = {
      'shoulder': 'Shoulder', 'knee': 'Knee', 'back': 'Back', 'hip': 'Hip',
      'neck': 'Neck', 'ankle': 'Ankle', 'elbow': 'Elbow', 'wrist_hand': 'Wrist or hand',
      'head': 'Head', 'multiple': 'Multiple areas', 'other': 'Other'
    };
    const durationLabels = {
      'less_2_weeks': 'Less than 2 weeks', '2_4_weeks': '2–4 weeks',
      '1_3_months': '1–3 months', '3_6_months': '3–6 months', '6_plus_months': '6+ months'
    };
    const goalLabels = {
      'return_sport': 'Return to sport or athletic activity',
      'daily_activities': 'Get back to daily activities pain-free',
      'avoid_surgery': 'Avoid surgery if possible',
      'speed_healing': 'Speed up the healing process',
      'reduce_pain': 'Reduce pain and inflammation',
      'post_surgery': 'Recover faster after surgery'
    };

    const injuryLabel = injuryTypeLabels[formData.injuryType] || 'your injury';
    const locationLabel = locationLabels[formData.injuryLocation] || '';

    return (
      <Layout>
        <Head>
          <title>We Can Help | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        {/* Hero */}
        <section className="inj-res-hero">
          <div className="inj-res-container">
            <div className="inj-res-check">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1>Good News, {formData.firstName}</h1>
            <p className="inj-res-intro">
              Based on what you told us about your {locationLabel.toLowerCase()} injury, we have a treatment that may help with your recovery.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="inj-res-main">
          <div className="inj-res-container">

            {/* Treatment Card */}
            <div className="inj-res-treatment-card">
              <h2>Our Recovery Protocol: BPC-157 + TB-4</h2>
              <p className="inj-res-treatment-desc">
                These two peptides may work together to support your body's healing process. They're natural compounds that could help with your recovery.
              </p>

              <div className="inj-res-peptide-grid">
                <div className="inj-res-peptide-card">
                  <h3>BPC-157</h3>
                  <p className="inj-res-peptide-subtitle">Body Protection Compound</p>
                  <ul>
                    {peptideBenefits.bpcBenefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div className="inj-res-peptide-card">
                  <h3>TB-4</h3>
                  <p className="inj-res-peptide-subtitle">Thymosin Beta-4</p>
                  <ul>
                    {peptideBenefits.tb4Benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="inj-res-why">
                <h4>Why These Work Together</h4>
                <p>BPC-157 may help repair damaged tissue directly. TB-4 could reduce swelling and bring more blood to the area. Together, they may support recovery from both angles.</p>
              </div>
            </div>

            {/* What You Told Us */}
            <div className="inj-res-summary-card">
              <h3>What You Told Us</h3>
              <div className="inj-res-summary-grid">
                <div>
                  <span className="inj-res-label">Injury Type</span>
                  <span className="inj-res-value">{injuryLabel}</span>
                </div>
                <div>
                  <span className="inj-res-label">Location</span>
                  <span className="inj-res-value">{locationLabel}</span>
                </div>
                <div>
                  <span className="inj-res-label">Duration</span>
                  <span className="inj-res-value">{durationLabels[formData.injuryDuration] || '-'}</span>
                </div>
                <div>
                  <span className="inj-res-label">Goals</span>
                  <span className="inj-res-value">
                    {(formData.recoveryGoal || []).length > 0
                      ? formData.recoveryGoal.map(g => goalLabels[g]).join(', ')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Therapy Recommendation - only show if not in PT */}
            {formData.inPhysicalTherapy === 'no' && (
              <div className="inj-res-pt-card">
                <h3>Physical Therapy Can Help</h3>
                <p>
                  You mentioned you're not currently in physical therapy. Combining peptide treatment with PT often leads to better results.
                </p>
                <p className="inj-res-pt-question">
                  Would you like a recommendation from <strong>Range Sports Therapy</strong>? They work closely with us to help patients recover faster.
                </p>
                <div className="inj-res-pt-buttons">
                  <button
                    className={`inj-res-pt-btn ${formData.wantsPTRecommendation === true ? 'selected' : ''}`}
                    onClick={() => handleInputChange('wantsPTRecommendation', true)}
                  >
                    Yes, I'm interested
                  </button>
                  <button
                    className={`inj-res-pt-btn inj-res-pt-btn-outline ${formData.wantsPTRecommendation === false ? 'selected' : ''}`}
                    onClick={() => handleInputChange('wantsPTRecommendation', false)}
                  >
                    No thanks
                  </button>
                </div>
                {formData.wantsPTRecommendation === true && (
                  <p className="inj-res-pt-confirm">Great! We'll include this in your intake and have Range Sports Therapy reach out.</p>
                )}
              </div>
            )}

            {/* Next Step */}
            <div className="inj-res-next-card">
              <h3>Next Step: Complete Your Medical Intake</h3>
              <p>
                To get started, we need a bit more medical history. This form takes about 5 minutes and helps our provider create your personalized protocol.
              </p>
              <a href="https://app.range-medical.com/intake" className="inj-res-cta" target="_blank" rel="noopener noreferrer">
                Continue to Medical Intake
              </a>
              <p className="inj-res-contact">
                Questions? Call us at <a href="tel:9499973988">(949) 997-3988</a>
              </p>
            </div>

          </div>
        </section>

        <style jsx>{`
          .inj-res-hero {
            background: #fafafa;
            padding: 4rem 1.5rem;
            text-align: center;
          }

          .inj-res-container {
            max-width: 800px;
            margin: 0 auto;
          }

          .inj-res-check {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: #22c55e;
            border-radius: 50%;
            margin-bottom: 1.5rem;
          }

          .inj-res-check svg {
            stroke: #ffffff;
          }

          .inj-res-hero h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 1rem;
          }

          .inj-res-intro {
            font-size: 1.125rem;
            color: #525252;
            margin: 0;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
          }

          .inj-res-main {
            padding: 3rem 1.5rem 4rem;
            background: #ffffff;
          }

          .inj-res-treatment-card {
            background: #fafafa;
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 1.5rem;
          }

          .inj-res-treatment-card h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.75rem;
          }

          .inj-res-treatment-desc {
            font-size: 1rem;
            color: #525252;
            margin: 0 0 2rem;
            line-height: 1.6;
          }

          .inj-res-peptide-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .inj-res-peptide-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid #e5e5e5;
          }

          .inj-res-peptide-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #171717;
            margin: 0 0 0.25rem;
          }

          .inj-res-peptide-subtitle {
            font-size: 0.875rem;
            color: #737373;
            margin: 0 0 1rem;
          }

          .inj-res-peptide-card ul {
            margin: 0;
            padding: 0 0 0 1.25rem;
          }

          .inj-res-peptide-card li {
            font-size: 0.95rem;
            color: #404040;
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }

          .inj-res-peptide-card li:last-child {
            margin-bottom: 0;
          }

          .inj-res-why {
            background: #000000;
            border-radius: 12px;
            padding: 1.5rem;
            color: #ffffff;
          }

          .inj-res-why h4 {
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 0.5rem;
          }

          .inj-res-why p {
            font-size: 0.95rem;
            margin: 0;
            line-height: 1.6;
            color: #d4d4d4;
          }

          .inj-res-summary-card {
            background: #fafafa;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .inj-res-summary-card h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #737373;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0 0 1rem;
          }

          .inj-res-summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .inj-res-label {
            display: block;
            font-size: 0.8rem;
            color: #737373;
            margin-bottom: 0.25rem;
          }

          .inj-res-value {
            display: block;
            font-size: 0.95rem;
            color: #171717;
            font-weight: 500;
          }

          .inj-res-next-card {
            background: #000000;
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            color: #ffffff;
          }

          .inj-res-next-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 0.75rem;
            color: #ffffff;
          }

          .inj-res-next-card > p {
            font-size: 1rem;
            color: #a3a3a3;
            margin: 0 0 1.5rem;
            line-height: 1.6;
          }

          .inj-res-cta {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            transition: background 0.2s;
          }

          .inj-res-cta:hover {
            background: #f5f5f5;
          }

          .inj-res-contact {
            margin: 1.5rem 0 0;
            font-size: 0.9rem;
            color: #a3a3a3;
          }

          .inj-res-contact a {
            color: #ffffff;
            font-weight: 600;
          }

          /* PT Recommendation Card */
          .inj-res-pt-card {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .inj-res-pt-card h3 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #0c4a6e;
            margin: 0 0 0.75rem;
          }

          .inj-res-pt-card > p {
            font-size: 0.95rem;
            color: #0369a1;
            line-height: 1.6;
            margin: 0 0 1rem;
          }

          .inj-res-pt-question {
            font-size: 1rem;
            color: #0c4a6e;
            margin: 1rem 0;
          }

          .inj-res-pt-buttons {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .inj-res-pt-btn {
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9375rem;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid #0284c7;
            background: #0284c7;
            color: #ffffff;
            font-family: inherit;
          }

          .inj-res-pt-btn:hover {
            background: #0369a1;
            border-color: #0369a1;
          }

          .inj-res-pt-btn.selected {
            background: #0369a1;
            border-color: #0369a1;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
          }

          .inj-res-pt-btn-outline {
            background: transparent;
            color: #0284c7;
          }

          .inj-res-pt-btn-outline:hover {
            background: #e0f2fe;
            border-color: #0284c7;
            color: #0284c7;
          }

          .inj-res-pt-btn-outline.selected {
            background: #e0f2fe;
            border-color: #0284c7;
            color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
          }

          .inj-res-pt-confirm {
            margin-top: 1rem;
            padding: 0.75rem 1rem;
            background: #dcfce7;
            border-radius: 8px;
            font-size: 0.9rem;
            color: #166534;
          }

          @media (max-width: 640px) {
            .inj-res-hero {
              padding: 3rem 1.5rem;
            }

            .inj-res-hero h1 {
              font-size: 1.75rem;
            }

            .inj-res-peptide-grid {
              grid-template-columns: 1fr;
            }

            .inj-res-summary-grid {
              grid-template-columns: 1fr;
            }

            .inj-res-pt-buttons {
              flex-direction: column;
            }

            .inj-res-pt-btn {
              width: 100%;
              text-align: center;
            }
          }
        `}</style>
      </Layout>
    );
  }

  // Results screen for Energy path
  if (showResults && recommendation) {
    return (
      <Layout>
        <Head>
          <title>Your Lab Recommendation | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        {/* Hero */}
        <section className="res-hero">
          <div className="res-container">
            <span className="res-kicker">Your Personalized Recommendation</span>
            <h1>Here's What We Need to Check</h1>
            <p className="res-intro">
              Based on your answers, here's what we recommend testing to find out what's going on.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="res-main">
          <div className="res-container">
            <div className="res-grid">
              {/* Left Column - Recommendation */}
              <div className="res-primary">
                {/* Panel Card */}
                <div className={`res-panel-card ${recommendation.panel === 'elite' ? 'res-panel-elite' : ''}`}>
                  <div className="res-panel-badge">
                    {recommendation.panel === 'elite' ? 'Recommended For You' : 'Recommended For You'}
                  </div>
                  <h2 className="res-panel-name">
                    {recommendation.panel === 'elite' ? 'Elite Panel' : 'Essential Panel'}
                  </h2>
                  <div className="res-panel-price">
                    {recommendation.panel === 'elite' ? '$750' : '$350'}
                  </div>
                  <p className="res-panel-desc">
                    {recommendation.panel === 'elite'
                      ? 'Our most complete panel — checks your hormones, heart health, inflammation, and more.'
                      : 'A great starting point — covers your hormones, thyroid, and blood sugar.'
                    }
                  </p>

                  {recommendation.panel === 'elite' && recommendation.eliteReasons.length > 0 && (
                    <div className="res-panel-reasons">
                      <h4>Why we recommend Elite for you:</h4>
                      <ul>
                        {recommendation.eliteReasons.slice(0, 3).map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {formData.lastLabWork === 'within_60_days' && (
                  <div className="res-labs-notice">
                    <div className="res-labs-notice-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span>Already have labs?</span>
                    </div>
                    <p className="res-labs-notice-text">
                      You mentioned having labs from the last 60 days. Before purchasing a new panel,
                      send them over — we'll review and let you know if additional testing is needed.
                    </p>
                    <a href="mailto:info@range-medical.com" className="res-labs-notice-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email Labs to info@range-medical.com
                    </a>
                  </div>
                )}

                <button
                  onClick={() => openPaymentPopup(recommendation.panel)}
                  className="res-panel-cta"
                >
                  Pay & Book {recommendation.panel === 'elite' ? 'Elite' : 'Essential'} Panel
                </button>

                  {recommendation.panel === 'elite' && (
                  <button onClick={() => openPaymentPopup('essential')} className="res-panel-alt">
                    Or start with Essential — $350
                  </button>
                )}
                </div>

                {/* Biomarkers */}
                <div className="res-card">
                  <h3>What We'll Test</h3>
                  <div className="res-markers">
                    {recommendation.essentialMarkers.slice(0, 10).map((marker, i) => (
                      <span key={i} className="res-marker">{marker}</span>
                    ))}
                    {recommendation.panel === 'elite' && recommendation.eliteMarkers.slice(0, 6).map((marker, i) => (
                      <span key={`elite-${i}`} className="res-marker res-marker-elite">{marker}</span>
                    ))}
                  </div>
                  <p className="res-markers-more">
                    {recommendation.panel === 'elite'
                      ? `+ ${Math.max(0, 36 - 16)} more markers included`
                      : '+ thyroid, cholesterol, and blood sugar tests'
                    }
                  </p>
                </div>

                {/* Why These Matter */}
                <div className="res-card">
                  <h3>Why We're Checking These</h3>
                  <div className="res-reasons-list">
                    {recommendation.reasons.slice(0, 4).map((item, i) => (
                      <div key={i} className="res-reason">
                        <h4>{item.type === 'symptom' ? symptomLabels[item.key] : goalLabels[item.key]}</h4>
                        <p>{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Summary & Next Steps */}
              <div className="res-secondary">
                {/* What You Told Us */}
                <div className="res-card res-summary-card">
                  <h3>What You Told Us</h3>
                  <div className="res-summary-section">
                    <h4>Symptoms</h4>
                    <ul>
                      {recommendation.symptoms.map(s => (
                        <li key={s}>{symptomLabels[s]}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="res-summary-section">
                    <h4>Goals</h4>
                    <ul>
                      {recommendation.goals.map(g => (
                        <li key={g}>{goalLabels[g]}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="res-card res-next-card">
                  <h3>What Happens Next</h3>
                  <div className="res-steps">
                    <div className="res-step">
                      <div className="res-step-num">1</div>
                      <div>
                        <h4>Complete Your Payment</h4>
                        <p>Secure checkout takes less than a minute.</p>
                      </div>
                    </div>
                    <div className="res-step">
                      <div className="res-step-num">2</div>
                      <div>
                        <h4>We'll Schedule Your Visit</h4>
                        <p>Our team will call to book your appointment at Range Medical.</p>
                      </div>
                    </div>
                    <div className="res-step">
                      <div className="res-step-num">3</div>
                      <div>
                        <h4>Blood Draw at Range Medical</h4>
                        <p>Come to our Newport Beach office. Fasting 10-12 hours recommended. Not local? We'll coordinate with a lab near you.</p>
                      </div>
                    </div>
                    <div className="res-step">
                      <div className="res-step-num">4</div>
                      <div>
                        <h4>Review Results Together</h4>
                        <p>Your provider goes over your results and creates a plan just for you.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="res-contact">
                  <p>Questions? Call us</p>
                  <a href="tel:9499973988" className="res-phone">(949) 997-3988</a>
                  <p className="res-location">
                    Range Medical<br />
                    1901 Westcliff Dr, Newport Beach
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{resultsStyles}</style>
      </Layout>
    );
  }

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
      question: "What are your recovery goals?",
      subtitle: "Select all that apply",
      type: 'multiselect',
      options: [
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
      id: 'symptoms',
      question: "What symptoms are you experiencing?",
      subtitle: "Select all that apply",
      type: 'multiselect',
      options: [
        { value: 'fatigue', label: 'Fatigue or low energy' },
        { value: 'brain_fog', label: 'Brain fog or poor focus' },
        { value: 'weight_gain', label: 'Unexplained weight gain' },
        { value: 'poor_sleep', label: 'Poor sleep or insomnia' },
        { value: 'low_libido', label: 'Low libido or sexual function' },
        { value: 'muscle_loss', label: 'Muscle loss or weakness' },
        { value: 'mood_changes', label: 'Mood changes, anxiety, or irritability' },
        { value: 'recovery', label: 'Slow recovery from workouts' }
      ]
    },
    {
      id: 'symptomDuration',
      question: 'When did you first notice something was off?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'less_1_month', label: 'Within the last month' },
        { value: '1_3_months', label: 'A few months ago' },
        { value: '3_6_months', label: '3–6 months ago' },
        { value: '6_12_months', label: '6–12 months ago' },
        { value: '1_plus_years', label: 'Over a year ago' }
      ]
    },
    {
      id: 'lastLabWork',
      question: 'When did you last have blood work done?',
      type: 'radio',
      options: [
        { value: 'within_60_days', label: 'Within the last 60 days' },
        { value: '2_6_months', label: '2–6 months ago' },
        { value: '6_12_months', label: '6–12 months ago' },
        { value: 'over_year', label: 'Over a year ago' },
        { value: 'never', label: "Never or don't remember" }
      ]
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
      id: 'goals',
      question: "What are you hoping to accomplish?",
      subtitle: "Select all that apply",
      type: 'multiselect',
      options: [
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
  const totalSteps = questions.length + 1;
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
                  {selectedPath === 'energy'
                    ? "Answer a few questions and we'll show you exactly which lab markers matter for your situation."
                    : "This short assessment helps us understand your situation. After completing it, you'll continue to our medical intake form."
                  }
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
                    {formData[currentQuestion.id] === 'other' && (
                      <input
                        type="text"
                        className="ra-other-input"
                        placeholder="Please describe..."
                        value={formData[`${currentQuestion.id}Other`] || ''}
                        onChange={(e) => handleInputChange(`${currentQuestion.id}Other`, e.target.value)}
                        autoFocus
                      />
                    )}
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
                  </div>
                )}

                {currentQuestion.type === 'multiselect' && (
                  <div className="ra-multiselect-section">
                    {currentQuestion.subtitle && (
                      <p className="ra-multiselect-hint">{currentQuestion.subtitle}</p>
                    )}
                    <div className="ra-multiselect-grid">
                      {currentQuestion.options.map(opt => {
                        const isSelected = (formData[currentQuestion.id] || []).includes(opt.value);
                        return (
                          <label key={opt.value} className={`ra-multiselect-option ${isSelected ? 'ra-selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const current = formData[currentQuestion.id] || [];
                                const updated = isSelected
                                  ? current.filter(v => v !== opt.value)
                                  : [...current, opt.value];
                                handleInputChange(currentQuestion.id, updated);
                              }}
                            />
                            <span className="ra-multiselect-label">{opt.label}</span>
                            {isSelected && (
                              <svg className="ra-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </label>
                        );
                      })}
                    </div>
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
                        {selectedPath === 'energy' ? 'Analyzing...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        {selectedPath === 'energy' ? 'See My Lab Recommendation' : 'Submit & Continue to Intake'}
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

  .ra-other-input {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    font-size: 1rem;
    border: 1px solid #d4d4d4;
    border-radius: 8px;
    width: 100%;
  }

  .ra-other-input:focus {
    outline: none;
    border-color: #000000;
  }

  .ra-pt-suggestion {
    display: flex;
    gap: 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
  }

  .ra-pt-suggestion-icon {
    flex-shrink: 0;
    color: #0284c7;
  }

  .ra-pt-suggestion-content p {
    margin: 0;
    font-size: 0.95rem;
    color: #0c4a6e;
    line-height: 1.5;
  }

  .ra-pt-suggestion-content p:first-child {
    margin-bottom: 0.25rem;
  }

  .ra-pt-suggestion-content a {
    color: #0284c7;
    font-weight: 600;
    text-decoration: underline;
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

  .ra-multiselect-section {
    margin-bottom: 1.5rem;
  }

  .ra-multiselect-hint {
    font-size: 0.875rem;
    color: #737373;
    margin: 0 0 1rem;
  }

  .ra-multiselect-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.625rem;
  }

  .ra-multiselect-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .ra-multiselect-option:hover {
    border-color: #d4d4d4;
    background: #fafafa;
  }

  .ra-multiselect-option.ra-selected {
    border-color: #171717;
    background: #fafafa;
  }

  .ra-multiselect-option input {
    display: none;
  }

  .ra-multiselect-label {
    font-size: 0.9375rem;
    color: #171717;
    flex: 1;
  }

  .ra-check-icon {
    color: #171717;
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

const resultsStyles = `
  /* Results Page - Matching Site Design */

  /* Hero Section */
  .res-hero {
    padding: 4rem 1.5rem 3rem;
    text-align: center;
    background: #ffffff;
  }

  .res-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .res-kicker {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #737373;
    margin-bottom: 0.75rem;
  }

  .res-hero h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 1rem;
    line-height: 1.15;
  }

  .res-intro {
    font-size: 1.0625rem;
    color: #525252;
    line-height: 1.7;
    max-width: 540px;
    margin: 0 auto;
  }

  /* Main Content */
  .res-main {
    padding: 0 1.5rem 5rem;
    background: #fafafa;
  }

  .res-main .res-container {
    padding-top: 3rem;
  }

  .res-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    align-items: start;
  }

  /* Cards */
  .res-card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
  }

  .res-card h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 1.25rem;
  }

  /* Panel Recommendation Card */
  .res-panel-card {
    background: #ffffff;
    border: 2px solid #e5e5e5;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .res-panel-card.res-panel-elite {
    border-color: #000000;
  }

  .res-panel-badge {
    display: inline-block;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #000000;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 100px;
    margin-bottom: 1.25rem;
  }

  .res-panel-name {
    font-size: 1.75rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 0.5rem;
  }

  .res-panel-price {
    font-size: 2.5rem;
    font-weight: 700;
    color: #000000;
    margin-bottom: 1rem;
  }

  .res-panel-desc {
    font-size: 0.9375rem;
    color: #525252;
    line-height: 1.6;
    margin: 0 0 1.5rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .res-panel-reasons {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .res-panel-reasons h4 {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .res-panel-reasons ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .res-panel-reasons li {
    font-size: 0.9375rem;
    color: #525252;
    padding: 0.375rem 0;
    padding-left: 1.25rem;
    position: relative;
    line-height: 1.5;
  }

  .res-panel-reasons li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #22c55e;
    font-weight: 700;
  }

  /* Labs Notice */
  .res-labs-notice {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border: 1px solid #fde047;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .res-labs-notice-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }

  .res-labs-notice-header svg {
    color: #a16207;
  }

  .res-labs-notice-header span {
    font-size: 1rem;
    font-weight: 700;
    color: #854d0e;
  }

  .res-labs-notice-text {
    font-size: 0.9375rem;
    color: #a16207;
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  .res-labs-notice-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #854d0e;
    color: #ffffff;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
  }

  .res-labs-notice-btn:hover {
    background: #713f12;
  }

  .res-labs-notice-btn svg {
    color: #ffffff;
  }

  .res-panel-cta {
    display: block;
    width: 100%;
    background: #000000;
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    text-align: center;
    transition: background 0.2s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .res-panel-cta:hover {
    background: #333333;
  }

  .res-panel-alt {
    display: inline-block;
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #737373;
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .res-panel-alt:hover {
    color: #171717;
  }

  /* Biomarkers */
  .res-markers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .res-marker {
    display: inline-block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #171717;
    background: #f5f5f5;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    border: 1px solid #e5e5e5;
  }

  .res-marker.res-marker-elite {
    background: #171717;
    color: #ffffff;
    border-color: #171717;
  }

  .res-markers-more {
    font-size: 0.8125rem;
    color: #737373;
    margin: 0;
  }

  /* Reasons List */
  .res-reasons-list {
    display: grid;
    gap: 1rem;
  }

  .res-reason {
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .res-reason:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .res-reason h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.375rem;
  }

  .res-reason p {
    font-size: 0.875rem;
    color: #525252;
    line-height: 1.6;
    margin: 0;
  }

  /* Summary Card */
  .res-summary-card {
    background: #ffffff;
  }

  .res-summary-section {
    margin-bottom: 1.25rem;
  }

  .res-summary-section:last-child {
    margin-bottom: 0;
  }

  .res-summary-section h4 {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #737373;
    margin: 0 0 0.5rem;
  }

  .res-summary-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .res-summary-section li {
    font-size: 0.875rem;
    color: #171717;
    padding: 0.25rem 0;
    padding-left: 1rem;
    position: relative;
  }

  .res-summary-section li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #a3a3a3;
  }

  /* Steps */
  .res-next-card {
    background: #ffffff;
  }

  .res-steps {
    display: grid;
    gap: 0;
  }

  .res-step {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
  }

  .res-step:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .res-step:first-child {
    padding-top: 0;
  }

  .res-step-num {
    width: 32px;
    height: 32px;
    background: #000000;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8125rem;
    flex-shrink: 0;
  }

  .res-step h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.25rem;
  }

  .res-step p {
    font-size: 0.8125rem;
    color: #525252;
    line-height: 1.5;
    margin: 0;
  }

  /* Contact */
  .res-contact {
    text-align: center;
    padding: 1.5rem;
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
  }

  .res-contact p {
    font-size: 0.875rem;
    color: #737373;
    margin: 0;
  }

  .res-phone {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    color: #171717;
    text-decoration: none;
    margin: 0.5rem 0 1rem;
  }

  .res-phone:hover {
    color: #000000;
  }

  .res-location {
    font-size: 0.8125rem !important;
    color: #a3a3a3 !important;
    line-height: 1.5;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .res-grid {
      grid-template-columns: 1fr;
    }

    .res-secondary {
      order: -1;
    }

    .res-summary-card {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .res-hero {
      padding: 3rem 1.5rem 2rem;
    }

    .res-hero h1 {
      font-size: 1.75rem;
    }

    .res-main .res-container {
      padding-top: 2rem;
    }

    .res-panel-card {
      padding: 1.5rem;
    }

    .res-panel-name {
      font-size: 1.5rem;
    }

    .res-panel-price {
      font-size: 2rem;
    }

    .res-card {
      padding: 1.25rem;
    }
  }
`;
