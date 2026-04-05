import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MedicalIntakeForm from '../components/assessment/MedicalIntakeForm';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Cal.com event type ID for Range Assessment appointments
// Set via env var, or hardcode here after creating the event type in Cal.com
const ASSESSMENT_EVENT_TYPE_ID = process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID
  ? parseInt(process.env.NEXT_PUBLIC_ASSESSMENT_EVENT_TYPE_ID)
  : null;

// Inner component for Stripe payment form (must be inside <Elements> wrapper)
function AssessmentPaymentForm({ onSuccess, leadId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPayError(null);

    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/range-assessment?payment_complete=true`;

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on our backend
        await fetch('/api/assessment/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            paymentIntentId: paymentIntent.id,
          }),
        });
        onSuccess();
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1rem', color: '#171717' }}>
          <span>In-Clinic Visit — Injury & Recovery</span>
          <span style={{ fontWeight: 700 }}>$197</span>
        </div>
        <div style={{ borderTop: '2px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: '#171717' }}>
          <span>Total</span>
          <span>$197.00</span>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.875rem 1rem', marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
          This $197 goes directly toward your treatment protocol.
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {payError && (
        <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 0 }}>
          {payError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '1rem',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 0,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: processing ? 'default' : 'pointer',
          opacity: processing ? 0.7 : 1,
          fontFamily: 'inherit',
        }}
      >
        {processing ? 'Processing...' : 'Pay $197'}
      </button>
    </form>
  );
}

// Inner component for Energy Lab Panel Stripe payment form
function EnergyPaymentForm({ onSuccess, leadId, panelLabel, panelPrice, panelPriceCents }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPayError(null);

    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/range-assessment?payment_complete=true`;

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await fetch('/api/assessment/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            paymentIntentId: paymentIntent.id,
          }),
        });
        onSuccess();
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1rem', color: '#171717' }}>
          <span>{panelLabel}</span>
          <span style={{ fontWeight: 700 }}>{panelPrice}</span>
        </div>
        <div style={{ borderTop: '2px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: '#171717' }}>
          <span>Total</span>
          <span>{panelPriceCents}</span>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.875rem 1rem', marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
          Includes your blood draw and a provider review of your results.
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {payError && (
        <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 0 }}>
          {payError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '1rem',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 0,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: processing ? 'default' : 'pointer',
          opacity: processing ? 0.7 : 1,
          fontFamily: 'inherit',
        }}
      >
        {processing ? 'Processing...' : `Pay ${panelPrice}`}
      </button>
    </form>
  );
}

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
  const { path, panel, from } = router.query;
  const fromStartFunnel = from === 'start';

  const [selectedPath, setSelectedPath] = useState(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showInjuryResults, setShowInjuryResults] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [showInjuryIntake, setShowInjuryIntake] = useState(false);
  const [showEnergyIntake, setShowEnergyIntake] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCompletingIntake, setIsCompletingIntake] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [showStartContact, setShowStartContact] = useState(false); // contact step for start funnel
  const [startContactSubmitting, setStartContactSubmitting] = useState(false);

  // Payment & scheduling state (both paths)
  const [clientSecret, setClientSecret] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Energy path specific state
  const [selectedPanel, setSelectedPanel] = useState(null); // 'essential' or 'elite'
  const [showEnergyPayment, setShowEnergyPayment] = useState(false);
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  const [showEnergyScheduling, setShowEnergyScheduling] = useState(false);
  const [showEnergyConfirmation, setShowEnergyConfirmation] = useState(false);
  const [prepChecks, setPrepChecks] = useState({
    fasting: false,
    hydration: false,
    noNSAIDs: false,
    noAlcohol: false,
    cycleAware: false,
    timing: false,
  });

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const [intakeData, setIntakeData] = useState({
    // Personal Details
    dob: '',
    gender: '',
    preferredName: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    howHeardAboutUs: '',
    howHeardOther: '',
    howHeardFriend: '',
    isMinor: 'No',
    guardianName: '',
    guardianRelationship: '',
    // Healthcare Providers
    hasPCP: '',
    pcpName: '',
    recentHospitalization: '',
    hospitalizationReason: '',
    // Medical History
    conditions: {},
    // Medications & Allergies
    onHRT: '',
    hrtDetails: '',
    onMedications: '',
    currentMedications: '',
    hasAllergies: '',
    allergiesList: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    additionalNotes: '',
    photoIdData: null,
    signatureData: null
  });

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
    gender: '',
    symptoms: [],
    symptomDuration: '',
    lastLabWork: '',
    triedHormoneTherapy: '',
    goals: [],
    additionalInfo: ''
  });

  useEffect(() => {
    if (!router.isReady) return;

    if (path === 'injury' || path === 'energy') {
      setSelectedPath(path);
    }
    if (panel === 'essential' || panel === 'elite') {
      setSelectedPanel(panel);
    }

    // Pre-fill contact info from /start funnel
    try {
      const saved = localStorage.getItem('range_start_lead');
      if (saved) {
        const lead = JSON.parse(saved);
        if (lead.firstName && lead.email) {
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || lead.firstName,
            lastName: prev.lastName || lead.lastName,
            email: prev.email || lead.email,
            phone: prev.phone || lead.phone,
          }));
        }
      }
    } catch (e) { /* localStorage not available */ }

    // Skip step 0 (contact info) for start funnel users
    if (from === 'start') {
      setStep(1);
    }
  }, [router.isReady, path, panel, from]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Handle PT preference selection and save to GHL
  const handlePTPreference = async (wantsPT) => {
    // Update local state immediately for UI feedback
    setFormData(prev => ({ ...prev, wantsPTRecommendation: wantsPT }));

    // Save to GHL in background
    try {
      await fetch('/api/assessment/update-pt-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          wantsPTRecommendation: wantsPT
        })
      });
    } catch (err) {
      console.error('Failed to save PT preference:', err);
      // Don't show error to user - preference is saved locally
    }
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
      // For injury start funnel users: skip API submit here (no contact info yet)
      // Their assessment lead will be created when they enter contact info after recommendation
      if (fromStartFunnel && selectedPath === 'injury' && !formData.email) {
        setIsSubmitting(false);
        setShowInjuryResults(true);
        return;
      }

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assessmentPath: selectedPath,
          referralSource: fromStartFunnel ? 'start_funnel' : undefined,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Store leadId for completion endpoint
      if (data.leadId) {
        setLeadId(data.leadId);
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

  // Handle intake form completion (finalIntakeData passed directly from form to avoid stale state)
  const handleIntakeComplete = async (finalIntakeData) => {
    setIsCompletingIntake(true);
    setError('');

    try {
      const response = await fetch('/api/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          assessmentPath: selectedPath,
          formData,
          intakeData: finalIntakeData || intakeData,
          recommendation
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsCompletingIntake(false);
      setShowInjuryIntake(false);
      setShowEnergyIntake(false);
      setShowConfirmation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      setIsCompletingIntake(false);
    }
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

  // Initialize Stripe PaymentIntent for assessment
  const initializePayment = async () => {
    try {
      const response = await fetch('/api/assessment/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          discount: 0,
        }),
      });
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Could not initialize payment. Please call (949) 997-3988.');
      }
    } catch (err) {
      console.error('Payment init error:', err);
      setError('Could not initialize payment. Please call (949) 997-3988.');
    }
  };

  // Initialize Stripe PaymentIntent for energy lab panel
  const initializeEnergyPayment = async (panelType) => {
    try {
      const response = await fetch('/api/assessment/energy-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          panelType,
        }),
      });
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Could not initialize payment. Please call (949) 997-3988.');
      }
    } catch (err) {
      console.error('Energy payment init error:', err);
      setError('Could not initialize payment. Please call (949) 997-3988.');
    }
  };

  // Apply promo code (bypasses Stripe, marks payment as paid)
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');

    try {
      const response = await fetch('/api/assessment/apply-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, promoCode: promoCode.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPromoError(data.error || 'Invalid promo code');
        return;
      }

      setPromoApplied(true);
      // Skip payment, go to prep checklist
      setTimeout(() => {
        setShowEnergyPayment(false);
        setShowPrepChecklist(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    } catch (err) {
      setPromoError('Could not apply promo code. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Book energy assessment blood draw appointment
  const handleEnergyBooking = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    setError('');

    try {
      const response = await fetch('/api/assessment/energy-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          eventTypeId: ASSESSMENT_EVENT_TYPE_ID,
          start: selectedSlot.time,
          patientName: `${formData.firstName} ${formData.lastName}`,
          patientEmail: formData.email,
          patientPhone: formData.phone,
          panelType: selectedPanel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingResult(data.booking);
      setShowEnergyScheduling(false);
      setShowEnergyConfirmation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not book appointment. Please call (949) 997-3988.');
    } finally {
      setIsBooking(false);
    }
  };

  // Check if all required prep items are checked
  const allPrepChecked = prepChecks.fasting && prepChecks.hydration && prepChecks.noNSAIDs && prepChecks.noAlcohol && prepChecks.timing;

  // Generate next 14 days for date picker (skip Sundays, skip today for energy path)
  const getAvailableDatesEnergy = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i < 22 && dates.length < 14; i++) { // Start from i=1 (tomorrow)
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push(d);
      }
    }
    return dates;
  };

  // Fetch available slots for a date
  const fetchSlots = async (date) => {
    if (!ASSESSMENT_EVENT_TYPE_ID) {
      setError('Scheduling is not configured yet. Please call (949) 997-3988 to book.');
      return;
    }
    setSlotsLoading(true);
    try {
      const response = await fetch(`/api/bookings/slots?eventTypeId=${ASSESSMENT_EVENT_TYPE_ID}&date=${date}`);
      const data = await response.json();
      if (data.success && data.slots) {
        // Apply 2-hour buffer — filter out slots within 2 hours of now
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const filtered = {};
        Object.entries(data.slots).forEach(([dateKey, dateSlots]) => {
          const validSlots = dateSlots.filter(slot => new Date(slot.time) >= twoHoursFromNow);
          if (validSlots.length > 0) {
            filtered[dateKey] = validSlots;
          }
        });
        setAvailableSlots(filtered);
      } else {
        setAvailableSlots({});
      }
    } catch (err) {
      console.error('Fetch slots error:', err);
      setAvailableSlots({});
    } finally {
      setSlotsLoading(false);
    }
  };

  // Book assessment appointment
  const handleBooking = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    setError('');

    try {
      const response = await fetch('/api/assessment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          eventTypeId: ASSESSMENT_EVENT_TYPE_ID,
          start: selectedSlot.time,
          patientName: `${formData.firstName} ${formData.lastName}`,
          patientEmail: formData.email,
          patientPhone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingResult(data.booking);
      setShowScheduling(false);
      setShowConfirmation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not book appointment. Please call (949) 997-3988.');
    } finally {
      setIsBooking(false);
    }
  };

  // Generate next 14 days for date picker (skip Sundays)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 21 && dates.length < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push(d);
      }
    }
    return dates;
  };

  // Format time for display (Pacific)
  const formatSlotTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  // Format date for display
  const formatDateShort = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format booking time for confirmation
  const formatBookingTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    }) + ' PT';
  };

  // Energy path confirmation screen (after payment + booking)
  if (showEnergyConfirmation) {
    const panelLabel = selectedPanel === 'elite' ? 'Elite Lab Panel' : 'Essential Lab Panel';
    return (
      <Layout>
        <Head>
          <title>You're All Set | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '4rem 1.5rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: '#22c55e', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>
                You're All Set, {formData.firstName}
              </h1>
              <p style={{ fontSize: '1.0625rem', color: '#525252', lineHeight: 1.7, margin: '0 0 2rem' }}>
                Your {panelLabel} is paid and your blood draw is booked.
              </p>

              {bookingResult && (
                <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 0.75rem' }}>Your Blood Draw Appointment</h3>
                  <p style={{ fontSize: '1rem', color: '#171717', fontWeight: 600, margin: '0 0 0.5rem' }}>
                    {formatBookingTime(bookingResult.start)}
                  </p>
                  <p style={{ fontSize: '0.9375rem', color: '#525252', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                    1901 Westcliff Dr, Suite 10, Newport Beach, CA
                  </p>
                  <p style={{ fontSize: '0.9375rem', color: '#525252', lineHeight: 1.6, margin: '0 0 1rem' }}>
                    We've texted a short medical intake form to your phone — please complete it before your visit so we're ready to go.
                  </p>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.875rem 1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                      Didn't get the text? Check your messages at {formData.phone} or call us at (949) 997-3988.
                    </p>
                  </div>
                </div>
              )}

              {/* Pre-Instructions Reminder */}
              <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>Before Your Appointment</h3>
                <div style={{ display: 'grid', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Fast for 10–12 hours before your draw (water and black coffee are fine)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Drink plenty of water 1–2 hours before</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>No NSAIDs (Advil, ibuprofen) for 48 hours before</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>No alcohol the night before</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Bring a valid ID</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#525252' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>Wear a shirt with sleeves that roll up easily</span>
                  </div>
                </div>
                {formData.gender === 'female' && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 0, padding: '0.875rem 1rem', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                      <strong>Cycle timing:</strong> If cycling, Day 3 of your period gives the most accurate hormone results. If your cycle doesn't line up, call us at (949) 997-3988 and we'll help. Continue estrogen & progesterone as normal. Hold testosterone injections for 3 days.
                    </p>
                  </div>
                )}
                {formData.gender === 'male' && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 0, padding: '0.875rem 1rem', marginTop: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
                      <strong>Reminder:</strong> Hold testosterone injections for 3 days before labs. Avoid heavy workouts and sexual activity for 24 hours before (PSA accuracy).
                    </p>
                  </div>
                )}
                <p style={{ fontSize: '0.875rem', color: '#737373', margin: '1rem 0 0' }}>
                  Full prep details: <a href="/lab-prep" target="_blank" rel="noopener noreferrer" style={{ color: '#171717', fontWeight: 600, textDecoration: 'underline' }}>range-medical.com/lab-prep</a>
                </p>
              </div>

              <p style={{ fontSize: '0.9375rem', color: '#737373', margin: '1.5rem 0 0' }}>
                Questions? Call us at{' '}
                <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600 }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Injury path confirmation screen
  if (showConfirmation) {
    return (
      <Layout>
        <Head>
          <title>You're All Set | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '4rem 1.5rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: '#22c55e', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>
                You're All Set, {formData.firstName}
              </h1>
              <p style={{ fontSize: '1.0625rem', color: '#525252', lineHeight: 1.7, margin: '0 0 2rem' }}>
                We've sent a complete summary to our team.
              </p>

              {bookingResult && (
                <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 0.75rem' }}>Your In-Clinic Visit</h3>
                  <p style={{ fontSize: '1rem', color: '#171717', fontWeight: 600, margin: '0 0 0.5rem' }}>
                    {formatBookingTime(bookingResult.start)}
                  </p>
                  <p style={{ fontSize: '0.9375rem', color: '#525252', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                    We'll go over your treatment options in person based on your assessment answers. Your $197 goes directly toward whichever protocol you choose.
                  </p>
                  <p style={{ fontSize: '0.9375rem', color: '#525252', lineHeight: 1.6, margin: '0 0 1rem' }}>
                    We've texted a short medical intake form to your phone — please complete it before your visit so we're ready to go.
                  </p>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.875rem 1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                      Didn't get the text? Check your messages at {formData.phone} or call us at (949) 997-3988.
                    </p>
                  </div>
                </div>
              )}
              {!bookingResult && (
                <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 0.75rem' }}>What Happens Next</h3>
                  <p style={{ fontSize: '0.9375rem', color: '#525252', lineHeight: 1.6, margin: 0 }}>
                    Our team will review your information and reach out to schedule your consultation. We'll create a personalized peptide protocol based on your assessment and medical history.
                  </p>
                </div>
              )}

              <p style={{ fontSize: '0.9375rem', color: '#737373', margin: '1.5rem 0 0' }}>
                Questions? Call us at{' '}
                <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600 }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Medical Intake Form (both paths)
  if (showInjuryIntake || showEnergyIntake) {
    return (
      <Layout>
        <Head>
          <title>Medical Intake | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <MedicalIntakeForm
          intakeData={intakeData}
          onIntakeChange={setIntakeData}
          onSubmit={handleIntakeComplete}
          onBack={() => {
            if (showInjuryIntake) {
              setShowInjuryIntake(false);
              setShowInjuryResults(true);
            } else {
              setShowEnergyIntake(false);
              setShowResults(true);
            }
          }}
          isSubmitting={isCompletingIntake}
          error={error}
          patientName={formData.firstName}
        />
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Energy path: Payment screen
  if (showEnergyPayment) {
    const panelLabel = selectedPanel === 'elite' ? 'Elite Lab Panel' : 'Essential Lab Panel';
    const panelPrice = selectedPanel === 'elite' ? '$750' : '$350';
    const panelPriceCents = selectedPanel === 'elite' ? '$750.00' : '$350.00';

    return (
      <Layout>
        <Head>
          <title>Payment | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '3rem 1.5rem', minHeight: '60vh' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '0.5rem' }}>Step 1 of 3</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171717', margin: '0 0 0.5rem' }}>Payment</h1>
                <p style={{ fontSize: '0.9375rem', color: '#525252', margin: 0 }}>
                  Pay for your {panelLabel} to continue
                </p>
              </div>

              {stripePromise && clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        borderRadius: 0,
                      },
                    },
                  }}
                >
                  <EnergyPaymentForm
                    leadId={leadId}
                    panelLabel={panelLabel}
                    panelPrice={panelPrice}
                    panelPriceCents={panelPriceCents}
                    onSuccess={() => {
                      setShowEnergyPayment(false);
                      setShowPrepChecklist(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </Elements>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: '48px', marginBottom: 16 }}>⚠️</p>
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>
                  <p style={{ color: '#888', fontSize: '0.8125rem' }}>
                    If this issue persists, please call <strong>(949) 997-3988</strong>.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>Loading payment options...</p>
                </div>
              )}

              {/* Promo Code */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.25rem' }}>
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginBottom: '0.75rem' }}>Have a promo code?</p>
                {promoApplied ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>
                      ✓ Promo code applied — redirecting...
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      placeholder="Enter code"
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.875rem',
                        border: `1px solid ${promoError ? '#fecaca' : '#e5e5e5'}`,
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        outline: 'none',
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); } }}
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: promoCode.trim() ? '#171717' : '#d4d4d4',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: promoCode.trim() ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.5rem', textAlign: 'center' }}>{promoError}</p>
                )}
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '1.5rem' }}>
                Questions? Call <a href="tel:9499973988" style={{ color: '#737373' }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Energy path: Pre-instructions checklist screen (gender-conditional)
  if (showPrepChecklist) {
    const isFemale = formData.gender === 'female';
    const isMale = formData.gender === 'male';
    const prepReady = allPrepChecked && (isFemale ? prepChecks.cycleAware : true);

    return (
      <Layout>
        <Head>
          <title>Blood Draw Preparation | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '3rem 1.5rem', minHeight: '60vh' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '0.5rem' }}>Step 2 of 3</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171717', margin: '0 0 0.5rem' }}>Blood Draw Preparation</h1>
                <p style={{ fontSize: '0.9375rem', color: '#525252', margin: 0 }}>
                  Please review and confirm each item before booking your appointment
                </p>
              </div>

              {/* General Prep — All Patients */}
              <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>General Preparation</h3>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: prepChecks.fasting ? '#f0fdf4' : '#fff', border: `1px solid ${prepChecks.fasting ? '#bbf7d0' : '#e5e5e5'}`, borderRadius: 0, cursor: 'pointer', marginBottom: '0.625rem', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={prepChecks.fasting} onChange={(e) => setPrepChecks(prev => ({ ...prev, fasting: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#22c55e', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#171717' }}>I will fast for 10–12 hours before my blood draw</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#737373' }}>Water and black coffee (no creamer or sugar) are fine</p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: prepChecks.hydration ? '#f0fdf4' : '#fff', border: `1px solid ${prepChecks.hydration ? '#bbf7d0' : '#e5e5e5'}`, borderRadius: 0, cursor: 'pointer', marginBottom: '0.625rem', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={prepChecks.hydration} onChange={(e) => setPrepChecks(prev => ({ ...prev, hydration: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#22c55e', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#171717' }}>I will drink plenty of water 1–2 hours before</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#737373' }}>This makes your veins easier to find for the draw</p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: prepChecks.noNSAIDs ? '#f0fdf4' : '#fff', border: `1px solid ${prepChecks.noNSAIDs ? '#bbf7d0' : '#e5e5e5'}`, borderRadius: 0, cursor: 'pointer', marginBottom: '0.625rem', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={prepChecks.noNSAIDs} onChange={(e) => setPrepChecks(prev => ({ ...prev, noNSAIDs: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#22c55e', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#171717' }}>I will avoid NSAIDs (Advil, ibuprofen) for 48 hours before</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#737373' }}>These can affect certain blood test results</p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: prepChecks.noAlcohol ? '#f0fdf4' : '#fff', border: `1px solid ${prepChecks.noAlcohol ? '#bbf7d0' : '#e5e5e5'}`, borderRadius: 0, cursor: 'pointer', marginBottom: '0.625rem', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={prepChecks.noAlcohol} onChange={(e) => setPrepChecks(prev => ({ ...prev, noAlcohol: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#22c55e', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#171717' }}>I will avoid alcohol the night before</p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: prepChecks.timing ? '#f0fdf4' : '#fff', border: `1px solid ${prepChecks.timing ? '#bbf7d0' : '#e5e5e5'}`, borderRadius: 0, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={prepChecks.timing} onChange={(e) => setPrepChecks(prev => ({ ...prev, timing: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, accentColor: '#22c55e', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#171717' }}>I understand that morning appointments (9:00–10:30 AM) are best for hormone accuracy</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#737373' }}>Especially important for cortisol, testosterone, and prolactin testing</p>
                  </div>
                </label>
              </div>

              {/* Men's Guidelines */}
              {isMale && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 0, padding: '1.25rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0c4a6e', margin: '0 0 0.75rem' }}>For Men</h4>
                  <div style={{ display: 'grid', gap: '0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#0369a1', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>💉</span>
                      <span><strong>Testosterone injections:</strong> Hold for 3 days before your labs. Schedule your draw for the morning of your injection day, before dosing.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#0369a1', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>🔬</span>
                      <span><strong>PSA testing:</strong> Avoid heavy workouts and sexual activity for 24 hours before your draw.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Women's Guidelines */}
              {isFemale && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 0, padding: '1.25rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', margin: '0 0 0.75rem' }}>For Women</h4>
                  <div style={{ display: 'grid', gap: '0.625rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>📅</span>
                      <span><strong>Cycle timing:</strong> If you're still cycling, the best time for labs is <strong>Day 3 of your period</strong>. If your cycle doesn't line up with your appointment, don't cancel — text or call us at <strong>(949) 997-3988</strong> and we'll help.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>💊</span>
                      <span><strong>Estrogen & progesterone:</strong> Continue as normal. <strong>Testosterone injections:</strong> Hold for 3 days before labs.</span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={prepChecks.cycleAware} onChange={(e) => setPrepChecks(prev => ({ ...prev, cycleAware: e.target.checked }))} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#78350f', fontWeight: 500 }}>I understand the cycle timing guidelines (or I'm not currently cycling)</span>
                  </label>
                </div>
              )}

              {/* Medication Quick Reference */}
              <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#171717', margin: '0 0 0.75rem' }}>Medication Quick Reference</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '0.5rem 0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#991b1b' }}>NSAIDs</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#b91c1c' }}>Stop 48hrs before</p>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 0, padding: '0.5rem 0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#92400e' }}>Thyroid Meds</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#a16207' }}>Skip morning of draw</p>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '0.5rem 0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#991b1b' }}>Testosterone Inj.</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#b91c1c' }}>Hold 3 days before</p>
                  </div>
                  {isFemale && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '0.5rem 0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>Estrogen & Prog.</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>Continue as normal</p>
                    </div>
                  )}
                  {isMale && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 0, padding: '0.5rem 0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#92400e' }}>PSA Testing</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#a16207' }}>No heavy workouts 24hrs</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  setShowPrepChecklist(false);
                  setShowEnergyScheduling(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!prepReady}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: prepReady ? '#000' : '#d4d4d4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: prepReady ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s',
                }}
              >
                Continue to Schedule
              </button>
              {!prepReady && (
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '0.75rem' }}>
                  Please confirm all items above to continue
                </p>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '1rem' }}>
                Full prep details: <a href="/lab-prep" target="_blank" rel="noopener noreferrer" style={{ color: '#737373' }}>range-medical.com/lab-prep</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Energy path: Scheduling screen
  if (showEnergyScheduling) {
    const dates = getAvailableDatesEnergy();
    const slotsForDate = selectedDate
      ? availableSlots[selectedDate.toISOString().split('T')[0]] || []
      : [];

    return (
      <Layout>
        <Head>
          <title>Book Your Blood Draw | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '3rem 1.5rem', minHeight: '60vh' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '0.5rem' }}>Step 3 of 3</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171717', margin: '0 0 0.5rem' }}>Pick a Time</h1>
                <p style={{ fontSize: '0.9375rem', color: '#525252', margin: 0 }}>
                  Choose a day and time for your blood draw
                </p>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 0, padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
                  <strong>Tip:</strong> Morning appointments (9:00–10:30 AM) give the most accurate hormone results.
                </p>
              </div>

              {/* Date picker */}
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#525252', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a Date</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {dates.map((d) => {
                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                    const dateStr = d.toISOString().split('T')[0];
                    const isTomorrow = new Date(new Date().getTime() + 86400000).toDateString() === d.toDateString();
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                          setAvailableSlots({});
                          fetchSlots(dateStr);
                        }}
                        style={{
                          padding: '0.625rem 1rem',
                          borderRadius: 0,
                          border: isSelected ? '2px solid #000' : '1px solid #e5e5e5',
                          background: isSelected ? '#000' : '#fff',
                          color: isSelected ? '#fff' : '#171717',
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isTomorrow ? 'Tomorrow' : formatDateShort(d)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#525252', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Times — {formatDateShort(selectedDate)}
                  </p>

                  {slotsLoading ? (
                    <p style={{ color: '#888', fontSize: '0.875rem', padding: '1rem 0' }}>Loading available times...</p>
                  ) : slotsForDate.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                      {slotsForDate.map((slot) => {
                        const isSelected = selectedSlot && selectedSlot.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '0.75rem 0.5rem',
                              borderRadius: 0,
                              border: isSelected ? '2px solid #000' : '1px solid #e5e5e5',
                              background: isSelected ? '#000' : '#fff',
                              color: isSelected ? '#fff' : '#171717',
                              fontSize: '0.9375rem',
                              fontWeight: isSelected ? 600 : 400,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {formatSlotTime(slot.time)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.25rem', textAlign: 'center' }}>
                      <p style={{ color: '#737373', fontSize: '0.875rem', margin: 0 }}>
                        No available times on this date. Please try another day.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Booking confirmation */}
              {selectedSlot && (
                <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#525252', margin: '0 0 0.25rem' }}>Your blood draw:</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>
                    {formatDateShort(selectedDate)} at {formatSlotTime(selectedSlot.time)} PT
                  </p>
                  <button
                    onClick={handleEnergyBooking}
                    disabled={isBooking}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: isBooking ? 'default' : 'pointer',
                      opacity: isBooking ? 0.7 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {isBooking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '1rem' }}>
                Questions? Call <a href="tel:9499973988" style={{ color: '#737373' }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Payment screen (injury path)
  if (showPayment) {
    return (
      <Layout>
        <Head>
          <title>Book Your Visit | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '3rem 1.5rem', minHeight: '60vh' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '0.5rem' }}>Step 2 of 3</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171717', margin: '0 0 0.5rem' }}>Payment</h1>
                <p style={{ fontSize: '0.9375rem', color: '#525252', margin: 0 }}>
                  Book your in-clinic visit to start treatment
                </p>
              </div>

              {stripePromise && clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        borderRadius: 0,
                      },
                    },
                  }}
                >
                  <AssessmentPaymentForm
                    leadId={leadId}
                    onSuccess={() => {
                      setShowPayment(false);
                      setShowScheduling(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </Elements>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: '48px', marginBottom: 16 }}>⚠️</p>
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>
                  <p style={{ color: '#888', fontSize: '0.8125rem' }}>
                    If this issue persists, please call <strong>(949) 997-3988</strong>.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>Loading payment options...</p>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '1.5rem' }}>
                Questions? Call <a href="tel:9499973988" style={{ color: '#737373' }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Scheduling screen (injury path)
  if (showScheduling) {
    const dates = getAvailableDates();
    const slotsForDate = selectedDate
      ? availableSlots[selectedDate.toISOString().split('T')[0]] || []
      : [];

    return (
      <Layout>
        <Head>
          <title>Book Your Visit | Range Medical</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ra-page">
          <section style={{ padding: '3rem 1.5rem', minHeight: '60vh' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '0.5rem' }}>Step 3 of 3</p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171717', margin: '0 0 0.5rem' }}>Pick a Time</h1>
                <p style={{ fontSize: '0.9375rem', color: '#525252', margin: 0 }}>
                  Choose a day and time for your in-clinic visit
                </p>
              </div>

              {/* Date picker */}
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#525252', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a Date</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {dates.map((d) => {
                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                    const dateStr = d.toISOString().split('T')[0];
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                          setAvailableSlots({});
                          fetchSlots(dateStr);
                        }}
                        style={{
                          padding: '0.625rem 1rem',
                          borderRadius: 0,
                          border: isSelected ? '2px solid #000' : '1px solid #e5e5e5',
                          background: isSelected ? '#000' : '#fff',
                          color: isSelected ? '#fff' : '#171717',
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isToday ? 'Today' : formatDateShort(d)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#525252', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Times — {formatDateShort(selectedDate)}
                  </p>

                  {slotsLoading ? (
                    <p style={{ color: '#888', fontSize: '0.875rem', padding: '1rem 0' }}>Loading available times...</p>
                  ) : slotsForDate.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                      {slotsForDate.map((slot) => {
                        const isSelected = selectedSlot && selectedSlot.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '0.75rem 0.5rem',
                              borderRadius: 0,
                              border: isSelected ? '2px solid #000' : '1px solid #e5e5e5',
                              background: isSelected ? '#000' : '#fff',
                              color: isSelected ? '#fff' : '#171717',
                              fontSize: '0.9375rem',
                              fontWeight: isSelected ? 600 : 400,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {formatSlotTime(slot.time)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.25rem', textAlign: 'center' }}>
                      <p style={{ color: '#737373', fontSize: '0.875rem', margin: 0 }}>
                        No available times on this date. Please try another day.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Booking confirmation */}
              {selectedSlot && (
                <div style={{ background: '#fafafa', borderRadius: 0, padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#525252', margin: '0 0 0.25rem' }}>Your appointment:</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#171717', margin: '0 0 1rem' }}>
                    {formatDateShort(selectedDate)} at {formatSlotTime(selectedSlot.time)} PT
                  </p>
                  <button
                    onClick={handleBooking}
                    disabled={isBooking}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 0,
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: isBooking ? 'default' : 'pointer',
                      opacity: isBooking ? 0.7 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {isBooking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#a3a3a3', marginTop: '1rem' }}>
                Questions? Call <a href="tel:9499973988" style={{ color: '#737373' }}>(949) 997-3988</a>
              </p>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </Layout>
    );
  }

  // Injury Results screen
  if (showInjuryResults) {
    // Label mappings for display
    const injuryTypeLabels = {
      'joint_ligament': 'Joint or ligament issue',
      'muscle_tendon': 'Muscle or soft tissue issue',
      'post_surgical': 'Recovering from surgery',
      'chronic_pain': 'Ongoing pain or discomfort',
      'general_recovery': 'General recovery support',
      'other': 'Other'
    };
    const locationLabels = {
      'upper_body': 'Upper body', 'lower_body': 'Lower body',
      'back_spine': 'Back or spine', 'neck': 'Neck',
      'multiple': 'Multiple areas', 'other': 'Other'
    };
    const durationLabels = {
      'less_2_weeks': 'Less than 2 weeks', '2_4_weeks': '2–4 weeks',
      '1_3_months': '1–3 months', '3_6_months': '3–6 months', '6_plus_months': '6+ months'
    };
    const goalLabels = {
      'return_sport': 'Get back to sport or physical activity',
      'daily_activities': 'Move through daily life without pain',
      'avoid_surgery': 'Explore non-surgical options',
      'speed_healing': 'Support and speed up healing',
      'reduce_pain': 'Reduce pain and inflammation',
      'post_surgery': 'Recover better after surgery'
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
            <h1>Thank You, {formData.firstName}</h1>
            <p className="inj-res-intro">
              Based on what you've shared, there are treatment options that may be worth exploring. Book an in-clinic visit below so our provider can evaluate your situation and go over the best approach for you in person.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="inj-res-main">
          <div className="inj-res-container">

            {/* Disclaimer */}
            <div className="inj-res-disclaimer">
              <p>The information below is for educational purposes only and is not medical advice for your specific situation. Treatment options vary by individual. A provider will evaluate your needs in person before recommending any course of treatment.</p>
            </div>

            {/* Treatment Card */}
            <div className="inj-res-treatment-card">
              <h2>Recovery Options We May Explore</h2>
              <p className="inj-res-treatment-desc">
                Depending on your situation, our providers may discuss options like peptide therapy, IV support, or other regenerative approaches. Below is a general overview of two compounds that are commonly considered for recovery support.
              </p>

              <div className="inj-res-peptide-grid">
                <div className="inj-res-peptide-card">
                  <h3>BPC-157</h3>
                  <p className="inj-res-peptide-subtitle">Body Protection Compound</p>
                  <ul>
                    <li>May support the body's natural tissue repair process</li>
                    <li>Has been studied for its potential to promote blood flow to affected areas</li>
                  </ul>
                </div>
                <div className="inj-res-peptide-card">
                  <h3>TB-4</h3>
                  <p className="inj-res-peptide-subtitle">Thymosin Beta-4</p>
                  <ul>
                    <li>Has been researched for its possible role in reducing inflammation</li>
                    <li>May help support the body's healing and recovery response</li>
                  </ul>
                </div>
              </div>

              <div className="inj-res-why">
                <h4>Why These Are Often Considered Together</h4>
                <p>BPC-157 and TB-4 are naturally occurring compounds that have been studied for different aspects of recovery support. Whether these are appropriate for you depends on your medical history and the specifics of your situation — your provider will determine the best approach during your visit.</p>
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
                  You mentioned you're not currently in physical therapy. Many patients find that combining targeted treatment with physical therapy can support better outcomes.
                </p>
                <p className="inj-res-pt-question">
                  Would you like a recommendation from <strong>Range Sports Therapy</strong>? They work closely with us to help patients recover faster.
                </p>
                <div className="inj-res-pt-buttons">
                  <button
                    className={`inj-res-pt-btn ${formData.wantsPTRecommendation === true ? 'selected' : ''}`}
                    onClick={() => handlePTPreference(true)}
                  >
                    Yes, I'm interested
                  </button>
                  <button
                    className={`inj-res-pt-btn inj-res-pt-btn-outline ${formData.wantsPTRecommendation === false ? 'selected' : ''}`}
                    onClick={() => handlePTPreference(false)}
                  >
                    No thanks
                  </button>
                </div>
                {formData.wantsPTRecommendation === true && (
                  <p className="inj-res-pt-confirm">Great! We'll include this in your intake and have Range Sports Therapy reach out.</p>
                )}
              </div>
            )}

            {/* Next Step — contact form for start funnel users */}
            <div className="inj-res-next-card">
              {fromStartFunnel && !formData.email ? (
                <>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Enter your info to book your visit</h3>
                  <p style={{ color: '#737373', fontSize: '0.9375rem', margin: '0 0 1.5rem' }}>We'll text you what to do next — no spam, no runaround.</p>

                  {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 0, fontSize: 14, marginBottom: 16 }}>{error}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 6 }}>First name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="First name"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 6 }}>Last name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Last name"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 6 }}>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="you@email.com"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 6 }}>Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(949) 555-1234"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 6 }}>Who referred you? <span style={{ fontWeight: 400, color: '#a3a3a3' }}>(optional)</span></label>
                    <input
                      type="text"
                      value={formData.referredBy || ''}
                      onChange={(e) => handleInputChange('referredBy', e.target.value)}
                      placeholder="Name of person or provider"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #d4d4d4', borderRadius: 0, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                  </div>

                  <button
                    className="inj-res-cta"
                    disabled={startContactSubmitting}
                    onClick={async () => {
                      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
                        setError('Please fill in all fields.');
                        return;
                      }
                      setError('');
                      setStartContactSubmitting(true);
                      try {
                        const startData = JSON.parse(localStorage.getItem('range_start_lead') || '{}');
                        const startRes = await fetch('/api/start/submit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            firstName: formData.firstName, lastName: formData.lastName,
                            email: formData.email, phone: formData.phone,
                            path: 'injury', mainConcern: startData.mainConcern || '',
                            urgency: startData.urgency || 7, hasRecentLabs: startData.hasRecentLabs || false,
                            consentSms: true,
                          }),
                        });
                        const startResult = await startRes.json();

                        const assessRes = await fetch('/api/assessment/submit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...formData, assessmentPath: 'injury', referralSource: 'start_funnel' }),
                        });
                        const assessResult = await assessRes.json();
                        if (assessResult.leadId) setLeadId(assessResult.leadId);

                        localStorage.setItem('range_start_lead', JSON.stringify({
                          ...startData, firstName: formData.firstName, lastName: formData.lastName,
                          email: formData.email, phone: formData.phone,
                          leadId: assessResult.leadId || startResult.leadId || null,
                        }));

                        setShowInjuryResults(false);
                        setShowPayment(true);
                        const payRes = await fetch('/api/assessment/payment-intent', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            leadId: assessResult.leadId, email: formData.email,
                            firstName: formData.firstName, lastName: formData.lastName,
                            phone: formData.phone,
                          }),
                        });
                        const payData = await payRes.json();
                        if (payData.clientSecret) setClientSecret(payData.clientSecret);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } catch (err) {
                        console.error('Start funnel contact submit error:', err);
                        setError('Something went wrong. Please try again.');
                      } finally {
                        setStartContactSubmitting(false);
                      }
                    }}
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: startContactSubmitting ? 0.6 : 1 }}
                  >
                    {startContactSubmitting ? 'Setting up your visit...' : 'Continue to Payment — $197'}
                  </button>

                  <p style={{ fontSize: 13, color: '#a3a3a3', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
                    Your $197 goes directly toward your treatment protocol.<br />
                    By continuing, you agree to receive texts from Range Medical.
                  </p>
                </>
              ) : (
                <>
                  {/* Standard flow (direct visitors or contact already collected) */}
                  <h3>Next Step: Book Your In-Clinic Visit</h3>
                  <p>
                    Our provider will evaluate your situation in person and walk you through the treatment options that make sense for you. Your <strong>$197</strong> visit fee goes directly toward whichever protocol you choose.
                  </p>
                  <button
                    className="inj-res-cta"
                    onClick={() => {
                      setShowInjuryResults(false);
                      setShowPayment(true);
                      initializePayment();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Book Visit — $197
                  </button>
                  <p style={{ fontSize: '0.85rem', color: '#a3a3a3', marginTop: '0.75rem' }}>
                    This $197 goes directly toward your treatment protocol.
                  </p>
                </>
              )}
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

          .inj-res-disclaimer {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            padding: 1.25rem 1.5rem;
            margin-bottom: 1.5rem;
          }

          .inj-res-disclaimer p {
            margin: 0;
            font-size: 0.85rem;
            color: #737373;
            line-height: 1.6;
            font-style: italic;
          }

          .inj-res-check {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: #22c55e;
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
            border: 1px solid #e5e5e5;
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
            border: 1px solid #e5e5e5;
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

        <section className="res-page">
          <div className="res-wrap">

            {/* Header */}
            <div className="res-header">
              <span className="res-kicker">Your Personalized Recommendation</span>
              <h1>Here's What We Need to Check</h1>
              <p className="res-intro">
                Based on your answers, here's what we recommend testing to find out what's going on.
              </p>
            </div>

            {/* SECTION 1: What You Told Us */}
            <div className="res-section">
              <div className="res-section-label">
                <div className="res-section-num">1</div>
                <span>What You Told Us</span>
              </div>
              <div className="res-told-grid">
                <div className="res-told-col">
                  <h4>Your Symptoms</h4>
                  <div className="res-told-tags">
                    {recommendation.symptoms.map(s => (
                      <span key={s} className="res-told-tag">{symptomLabels[s]}</span>
                    ))}
                  </div>
                </div>
                <div className="res-told-col">
                  <h4>Your Goals</h4>
                  <div className="res-told-tags">
                    {recommendation.goals.map(g => (
                      <span key={g} className="res-told-tag res-told-tag-goal">{goalLabels[g]}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Labs Notice - if they have recent labs */}
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
            </div>

            {/* SECTION 2: What We Recommend */}
            <div className="res-section">
              <div className="res-section-label">
                <div className="res-section-num">2</div>
                <span>What We Recommend</span>
              </div>

              {/* Elite Recommendation Reasons */}
              {recommendation.panel === 'elite' && recommendation.eliteReasons.length > 0 && (
                <div className="res-recommend-why">
                  <p className="res-recommend-intro">Based on your symptoms and goals, we suggest the <strong>Elite Panel</strong> because:</p>
                  <ul>
                    {recommendation.eliteReasons.slice(0, 3).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Why These Matter */}
              <div className="res-reasons-list">
                {recommendation.reasons.slice(0, 4).map((item, i) => (
                  <div key={i} className="res-reason">
                    <h4>{item.type === 'symptom' ? symptomLabels[item.key] : goalLabels[item.key]}</h4>
                    <p>{item.reason}</p>
                  </div>
                ))}
              </div>

              {/* Biomarkers */}
              <div className="res-markers-box">
                <h4>Key Markers We'll Check</h4>
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
                    ? `+ ${Math.max(0, 36 - 16)} more markers included in Elite`
                    : '+ thyroid, cholesterol, and blood sugar tests'
                  }
                </p>
              </div>
            </div>

            {/* SECTION 3: Pick & Pay */}
            <div className="res-section">
              <div className="res-section-label">
                <div className="res-section-num">3</div>
                <span>Choose Your Labs & Pay</span>
              </div>

              <div className="res-panels-grid">
                {/* Elite Panel */}
                <div className={`res-panel-option ${recommendation.panel === 'elite' ? 'res-panel-recommended' : ''}`}>
                  {recommendation.panel === 'elite' && (
                    <div className="res-panel-badge">Recommended</div>
                  )}
                  <h3 className="res-panel-name">Elite Panel</h3>
                  <div className="res-panel-price">$750</div>
                  <p className="res-panel-desc">
                    Our most complete panel — checks your hormones, heart health, inflammation, and more.
                  </p>
                  <p className="res-panel-includes">36+ biomarkers tested</p>
                  <button
                    className="res-panel-cta"
                    onClick={() => {
                      setSelectedPanel('elite');
                      setShowResults(false);
                      setShowEnergyPayment(true);
                      initializeEnergyPayment('elite');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Select & Pay — $750
                  </button>
                </div>

                <div className="res-panels-or">or</div>

                {/* Essential Panel */}
                <div className={`res-panel-option ${recommendation.panel === 'essential' ? 'res-panel-recommended' : ''}`}>
                  {recommendation.panel === 'essential' && (
                    <div className="res-panel-badge">Recommended</div>
                  )}
                  <h3 className="res-panel-name">Essential Panel</h3>
                  <div className="res-panel-price">$350</div>
                  <p className="res-panel-desc">
                    A great starting point — covers your hormones, thyroid, and blood sugar.
                  </p>
                  <p className="res-panel-includes">20+ biomarkers tested</p>
                  <button
                    className="res-panel-cta"
                    onClick={() => {
                      setSelectedPanel('essential');
                      setShowResults(false);
                      setShowEnergyPayment(true);
                      initializeEnergyPayment('essential');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Select & Pay — $350
                  </button>
                </div>
              </div>

              <div className="res-panels-note">
                <p>Both panels include your blood draw and a provider review of your results.</p>
              </div>
            </div>

            {/* What Happens After You Pay */}
            <div className="res-section res-section-last">
              <div className="res-section-label">
                <div className="res-section-num">4</div>
                <span>What Happens Next</span>
              </div>
              <div className="res-steps">
                <div className="res-step">
                  <div className="res-step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  </div>
                  <div>
                    <h4>Review Your Prep Checklist</h4>
                    <p>Fasting, hydration, and a few easy things to know before your draw.</p>
                  </div>
                </div>
                <div className="res-step">
                  <div className="res-step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h4>Book Your Blood Draw</h4>
                    <p>Pick a day and time that works for you — mornings are best.</p>
                  </div>
                </div>
                <div className="res-step">
                  <div className="res-step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div>
                    <h4>Come In for Your Draw</h4>
                    <p>Visit our Newport Beach office fasted. We handle the rest.</p>
                  </div>
                </div>
                <div className="res-step">
                  <div className="res-step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h4>Review Results Together</h4>
                    <p>Your provider goes over everything and builds a plan just for you.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="res-contact">
              <p>Questions? Call us at <a href="tel:9499973988">(949) 997-3988</a></p>
              <p className="res-location">Range Medical · 1901 Westcliff Dr, Newport Beach</p>
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
              <p className="ra-pricing">
                <strong>$197</strong> — applied directly toward your treatment protocol.
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
                  onClick={() => router.push('/range-assessment?path=energy')}
                >
                  <div className="ra-path-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <h3>Energy, Hormones & Weight Loss</h3>
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
      question: "What best describes what you're dealing with?",
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'joint_ligament', label: 'Joint or ligament issue' },
        { value: 'muscle_tendon', label: 'Muscle or soft tissue issue' },
        { value: 'post_surgical', label: 'Recovering from surgery' },
        { value: 'chronic_pain', label: 'Ongoing pain or discomfort' },
        { value: 'general_recovery', label: 'General recovery or healing support' },
        { value: 'other', label: 'Other or not sure' }
      ]
    },
    {
      id: 'injuryLocation',
      question: 'What area of the body is affected?',
      type: 'select',
      options: [
        { value: '', label: 'Select one...' },
        { value: 'upper_body', label: 'Upper body (shoulder, arm, hand)' },
        { value: 'lower_body', label: 'Lower body (hip, knee, ankle, foot)' },
        { value: 'back_spine', label: 'Back or spine' },
        { value: 'neck', label: 'Neck' },
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
      question: 'Are you currently working with a physical therapist or other rehab provider?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'completed', label: 'I did, but I still don\u2019t feel 100%' }
      ]
    },
    {
      id: 'recoveryGoal',
      question: "What are you hoping to accomplish?",
      subtitle: "Select all that apply",
      type: 'multiselect',
      options: [
        { value: 'return_sport', label: 'Get back to sport or physical activity' },
        { value: 'daily_activities', label: 'Move through daily life without pain' },
        { value: 'avoid_surgery', label: 'Explore non-surgical options' },
        { value: 'speed_healing', label: 'Support and speed up the healing process' },
        { value: 'reduce_pain', label: 'Reduce pain and inflammation' },
        { value: 'post_surgery', label: 'Recover better after surgery' }
      ]
    }
  ];

  const energyQuestions = [
    {
      id: 'gender',
      question: 'Which best describes you?',
      type: 'radio',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ]
    },
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
      question: 'Have you tried hormone replacement therapy before?',
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
                    : "This short assessment helps us understand your situation so your provider can evaluate the best options during your visit."
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
                      autoComplete="given-name"
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
                      autoComplete="family-name"
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
                    autoComplete="email"
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
                    autoComplete="tel"
                  />
                  <p className="ra-sms-consent">By providing my phone number, I agree to receive text messages from Range Medical regarding my appointments, lab results, and health updates. Message and data rates may apply. Message frequency varies (up to 10 msg/mo). Reply STOP to cancel, HELP for help. View our <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
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

                <p className="ra-survey-disclaimer">This assessment is for informational purposes only and is not a medical diagnosis. A provider will evaluate your needs in person.</p>
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
    margin: 0 auto 0.75rem;
  }

  .ra-pricing {
    font-size: 1rem;
    color: #171717;
    margin: 0 auto 2.5rem;
  }

  .ra-pricing strong {
    font-weight: 700;
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
    border-radius: 0;
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .ra-progress-bar {
    height: 100%;
    background: #000000;
    border-radius: 0;
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
    border-radius: 0;
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

  .ra-sms-consent {
    font-size: 0.7rem;
    color: #a3a3a3;
    line-height: 1.5;
    margin: 0.5rem 0 0;
  }

  .ra-sms-consent a {
    color: #a3a3a3;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .ra-sms-consent a:hover {
    color: #737373;
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
    border-radius: 0;
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
    border-radius: 0;
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
    border-radius: 0;
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
    border-radius: 0;
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
    border-radius: 0;
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
    border-radius: 0;
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
    border-radius: 0;
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

  .ra-survey-disclaimer {
    font-size: 0.8125rem;
    color: #a3a3a3;
    font-style: italic;
    line-height: 1.6;
    margin-top: 1.25rem;
    text-align: center;
  }
`;

const resultsStyles = `
  /* Results Page — Single-column linear flow */

  .res-page {
    background: #ffffff;
    padding: 3rem 1.5rem 4rem;
  }

  .res-wrap {
    max-width: 640px;
    margin: 0 auto;
  }

  /* Header */
  .res-header {
    text-align: center;
    margin-bottom: 3rem;
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

  .res-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #171717;
    margin: 0 0 0.75rem;
    line-height: 1.2;
  }

  .res-intro {
    font-size: 1rem;
    color: #525252;
    line-height: 1.7;
    margin: 0;
  }

  /* Numbered sections */
  .res-section {
    margin-bottom: 2.5rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .res-section-last {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 2rem;
  }

  .res-section-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .res-section-num {
    width: 28px;
    height: 28px;
    background: #171717;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8125rem;
    flex-shrink: 0;
  }

  .res-section-label span {
    font-size: 1.125rem;
    font-weight: 700;
    color: #171717;
  }

  /* Section 1: What You Told Us */
  .res-told-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 0;
  }

  .res-told-col h4 {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #737373;
    margin: 0 0 0.625rem;
  }

  .res-told-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .res-told-tag {
    display: inline-block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #171717;
    background: #f5f5f5;
    padding: 0.375rem 0.75rem;
    border-radius: 0;
    border: 1px solid #e5e5e5;
  }

  .res-told-tag-goal {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }

  /* Labs Notice */
  .res-labs-notice {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border: 1px solid #fde047;
    border-radius: 0;
    padding: 1.25rem;
    margin-top: 1.25rem;
  }

  .res-labs-notice-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 0.625rem;
  }

  .res-labs-notice-header svg { color: #a16207; }
  .res-labs-notice-header span { font-size: 0.9375rem; font-weight: 700; color: #854d0e; }

  .res-labs-notice-text {
    font-size: 0.875rem;
    color: #a16207;
    line-height: 1.6;
    margin: 0 0 0.875rem;
  }

  .res-labs-notice-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #854d0e;
    color: #ffffff;
    padding: 0.625rem 1rem;
    border-radius: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
  }

  .res-labs-notice-btn:hover { background: #713f12; }
  .res-labs-notice-btn svg { color: #ffffff; }

  /* Section 2: What We Recommend */
  .res-recommend-why {
    background: #f5f5f5;
    border-radius: 0;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .res-recommend-intro {
    font-size: 0.9375rem;
    color: #171717;
    line-height: 1.6;
    margin: 0 0 0.75rem;
  }

  .res-recommend-why ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .res-recommend-why li {
    font-size: 0.875rem;
    color: #525252;
    padding: 0.25rem 0 0.25rem 1.25rem;
    position: relative;
    line-height: 1.5;
  }

  .res-recommend-why li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #22c55e;
    font-weight: 700;
  }

  /* Reasons List */
  .res-reasons-list {
    display: grid;
    gap: 0;
    margin-bottom: 1.5rem;
  }

  .res-reason {
    padding: 0.875rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .res-reason:last-child { border-bottom: none; padding-bottom: 0; }
  .res-reason:first-child { padding-top: 0; }

  .res-reason h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.25rem;
  }

  .res-reason p {
    font-size: 0.875rem;
    color: #525252;
    line-height: 1.6;
    margin: 0;
  }

  /* Biomarkers */
  .res-markers-box {
    background: #fafafa;
    border-radius: 0;
    padding: 1.25rem;
  }

  .res-markers-box h4 {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .res-markers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .res-marker {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #171717;
    background: #ffffff;
    padding: 0.375rem 0.625rem;
    border-radius: 0;
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

  /* Section 3: Pick & Pay */
  .res-panels-grid {
    display: flex;
    gap: 1rem;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .res-panel-option {
    flex: 1;
    background: #ffffff;
    border: 2px solid #e5e5e5;
    border-radius: 0;
    padding: 1.5rem 1.25rem;
    text-align: center;
    position: relative;
  }

  .res-panel-option.res-panel-recommended {
    border-color: #000000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .res-panel-badge {
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #000000;
    color: #ffffff;
    padding: 0.375rem 0.75rem;
    border-radius: 0;
    position: absolute;
    top: -0.625rem;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .res-panel-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #171717;
    margin: 0.5rem 0 0.25rem;
  }

  .res-panel-price {
    font-size: 2rem;
    font-weight: 700;
    color: #000000;
    margin-bottom: 0.625rem;
  }

  .res-panel-desc {
    font-size: 0.8125rem;
    color: #525252;
    line-height: 1.5;
    margin: 0 0 0.5rem;
  }

  .res-panel-includes {
    font-size: 0.75rem;
    font-weight: 600;
    color: #737373;
    margin: 0 0 1rem;
  }

  .res-panel-cta {
    display: block;
    width: 100%;
    background: #000000;
    color: #ffffff;
    padding: 0.875rem 1rem;
    border-radius: 0;
    font-weight: 600;
    font-size: 0.9375rem;
    text-align: center;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
  }

  .res-panel-cta:hover { background: #333333; }

  .res-panels-or {
    display: flex;
    align-items: center;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #a3a3a3;
    text-transform: uppercase;
  }

  .res-panels-note {
    text-align: center;
  }

  .res-panels-note p {
    font-size: 0.8125rem;
    color: #737373;
    margin: 0;
  }

  /* Section 4: What Happens Next */
  .res-steps {
    display: grid;
    gap: 0;
  }

  .res-step {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
    padding: 0.875rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .res-step:last-child { border-bottom: none; padding-bottom: 0; }
  .res-step:first-child { padding-top: 0; }

  .res-step-icon {
    width: 36px;
    height: 36px;
    background: #f5f5f5;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #525252;
  }

  .res-step h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #171717;
    margin: 0 0 0.125rem;
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
    padding: 1.25rem 0 0;
  }

  .res-contact p {
    font-size: 0.875rem;
    color: #737373;
    margin: 0 0 0.25rem;
  }

  .res-contact a {
    color: #171717;
    font-weight: 600;
    text-decoration: none;
  }

  .res-contact a:hover { text-decoration: underline; }

  .res-location {
    font-size: 0.8125rem !important;
    color: #a3a3a3 !important;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .res-page {
      padding: 2rem 1.25rem 3rem;
    }

    .res-header h1 {
      font-size: 1.625rem;
    }

    .res-header {
      margin-bottom: 2rem;
    }

    .res-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
    }

    .res-told-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .res-panels-grid {
      flex-direction: column;
    }

    .res-panels-or {
      justify-content: center;
      padding: 0.25rem 0;
    }

    .res-panel-name {
      font-size: 1.125rem;
    }

    .res-panel-price {
      font-size: 1.75rem;
    }
  }
`;
