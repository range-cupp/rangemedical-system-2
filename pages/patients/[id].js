// /pages/patients/[id].js
// Unified Patient Profile Page - Range Medical
// Single source of truth for all patient data

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { formatPhone } from '../../lib/format-utils';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout, { overlayClickProps } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import EnergyPackBalance from '../../components/EnergyPackBalance';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Import unified protocol configuration
import {
  CATEGORY_COLORS,
  INJECTION_MEDICATIONS,
  NAD_INJECTION_DOSAGES,
  PEPTIDE_OPTIONS,
  WEIGHT_LOSS_MEDICATIONS,
  WEIGHT_LOSS_DOSAGES,
  HRT_MEDICATIONS,
  TESTOSTERONE_DOSES,
  HRT_SUPPLY_TYPES,
  HRT_SECONDARY_MEDICATIONS,
  HRT_SECONDARY_DOSAGES,
  INJECTION_METHODS,
  FREQUENCY_OPTIONS,
  VISIT_FREQUENCY_OPTIONS,
  PROTOCOL_STATUS_OPTIONS,
  DELIVERY_METHODS,
  IV_THERAPY_TYPES,
  findPeptideInfo,
  findMatchingPeptide,
  getDoseOptions,
  getPeptideVialSupply,
  PEPTIDE_SUPPLY_FORMATS
} from '../../lib/protocol-config';
import { getHRTLabSchedule, matchDrawsToLogs, buildAdaptiveHRTSchedule, isHRTProtocol, getLabStatusSummary } from '../../lib/hrt-lab-schedule';
import { isRecoveryPeptide, isGHPeptide } from '../../lib/protocol-config';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import CycleProgressCard from '../../components/CycleProgressCard';

// Lazy-load heavy components that aren't needed on initial render
const CalendarView = dynamic(() => import('../../components/CalendarView'), { ssr: false });
const LabDashboard = dynamic(() => import('../../components/labs/LabDashboard'), { ssr: false });
const ConversationView = dynamic(() => import('../../components/ConversationView'), { ssr: false });
const EncounterModal = dynamic(() => import('../../components/EncounterModal'), { ssr: false });
const StandaloneEncounterModal = dynamic(() => import('../../components/StandaloneEncounterModal'), { ssr: false });
const EncounterQuickView = dynamic(() => import('../../components/EncounterQuickView'), { ssr: false });
const ServiceLogContent = dynamic(() => import('../../components/ServiceLogContent'), { ssr: false });
const EmailComposeModal = dynamic(() => import('../../components/EmailComposeModal'), { ssr: false });
const SMSComposeModal = dynamic(() => import('../../components/SMSComposeModal'), { ssr: false });
import { PROTOCOL_TYPES, getHRTMedication, getHRTConcentration } from '../../lib/protocol-types';

// ─── Dispense helpers (mirrored from medications.js) ─────────────────────────

const SUPPLY_LABELS = {
  prefilled_1week: '1-Week Prefilled',
  prefilled_1: '1-Week Prefilled',
  prefilled_2week: '2-Week Prefilled',
  prefilled_4week: '4-Week Prefilled',
  vial_5ml: '5ml Vial',
  vial_10ml: '10ml Vial',
  vial: 'Vial',
  pellet: 'Pellets',
  oral_30day: '30-Day Oral',
  in_clinic: 'In-Clinic',
};

function formatIntervalLabel(days) {
  if (!days) return '';
  if (days === 7) return '7d (weekly)';
  if (days === 14) return '14d (biweekly)';
  if (days === 28) return '28d (4 weeks)';
  if (days === 30) return '30d (monthly)';
  if (days === 120) return '120d (4 months)';
  const weeks = Math.round(days / 7);
  if (weeks >= 4 && days % 7 === 0) return `${days}d (~${weeks} weeks)`;
  return `${days}d`;
}

function getDispenseDoseOptions(med) {
  const pt = (med.program_type || med.category || '').toLowerCase();
  const programName = (med.program_name || med.medication || '').toLowerCase();
  if (pt.includes('hrt')) {
    const allFields = `${med.program_name || ''} ${med.medication || ''} ${med.program_type || ''} ${med.hrt_type || ''}`.toLowerCase();
    const isFemale = allFields.includes('female') || allFields.includes('women');
    const doses = isFemale ? TESTOSTERONE_DOSES.female : TESTOSTERONE_DOSES.male;
    return doses.map(d => ({ value: d.value, label: d.label }));
  }
  if (pt.includes('weight_loss')) {
    const medName = med.medication || '';
    const doses = WEIGHT_LOSS_DOSAGES[medName];
    if (doses) return doses.map(d => ({ value: d, label: d }));
  }
  if (pt === 'peptide') {
    const doses = getDoseOptions('peptide', med.medication);
    if (doses) return doses.map(d => ({ value: d, label: d }));
  }
  return null;
}

function getDispenseSupplyOptions(med) {
  const pt = (med.program_type || med.category || '').toLowerCase();
  if (pt.includes('hrt')) {
    return [
      { value: 'prefilled_1week', label: '1-Week Prefilled', days: 7 },
      { value: 'prefilled_2week', label: '2-Week Prefilled', days: 14 },
      { value: 'prefilled_4week', label: '4-Week Prefilled', days: 28 },
      { value: 'vial_5ml', label: '5ml Vial', days: null },
      { value: 'vial_10ml', label: '10ml Vial', days: null },
    ];
  }
  if (pt.includes('weight_loss')) {
    return [
      { value: 'wl_1', label: '1 Injection (1 week)', days: 7 },
      { value: 'wl_2', label: '2 Injections (2 weeks)', days: 14 },
      { value: 'wl_3', label: '3 Injections (3 weeks)', days: 21 },
      { value: 'wl_4', label: '4 Injections (4 weeks)', days: 28 },
    ];
  }
  if (pt === 'peptide') {
    const vialSupply = getPeptideVialSupply(med.medication || med.program_name || '');
    if (vialSupply) return vialSupply.options;
  }
  return null;
}

function parseDoseMl(selectedDose) {
  if (!selectedDose) return null;
  const weeksMatch = selectedDose.match(/\((\d+)\s*weeks?\)/i);
  if (weeksMatch) return { weeks: parseInt(weeksMatch[1]) };
  if (/vial\s*\(\d+ml/i.test(selectedDose)) return null;
  const atMlMatch = selectedDose.match(/@\s*(\d+\.?\d*)\s*ml/i);
  if (atMlMatch) return { ml: parseFloat(atMlMatch[1]) };
  const mlMatch = selectedDose.match(/(\d+\.?\d*)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    if (ml < 2) return { ml };
  }
  return null;
}

function getIntervalForSupply(supplyValue, med) {
  const pt = (med.program_type || med.category || '').toLowerCase();
  const prefillDays = { prefilled_1week: 7, prefilled_1: 7, prefilled_2week: 14, prefilled_4week: 28 };
  if (prefillDays[supplyValue]) return prefillDays[supplyValue];
  if (supplyValue === 'wl_1' || supplyValue === 'weekly') return 7;
  if (supplyValue === 'wl_2' || supplyValue === 'every_2_weeks') return 14;
  if (supplyValue === 'wl_3') return 21;
  if (supplyValue === 'wl_4' || supplyValue === 'monthly') return 28;
  if (supplyValue && supplyValue.startsWith('peptide_')) {
    const days = parseInt(supplyValue.replace('peptide_', '').replace('d', ''));
    if (!isNaN(days)) return days;
  }
  if (supplyValue === 'vial_5ml' || supplyValue === 'vial_10ml') {
    const vialMl = supplyValue === 'vial_5ml' ? 5 : 10;
    const parsed = parseDoseMl(med.selected_dose || med.dosage);
    if (parsed?.weeks) return parsed.weeks * 7;
    if (parsed?.ml) {
      const isSubQ = (med.injection_method || '').toLowerCase() === 'subq';
      const injectionsPerWeek = isSubQ ? 7 : 2;
      const mlPerWeek = parsed.ml * injectionsPerWeek;
      const weeks = vialMl / mlPerWeek;
      return Math.round(weeks * 7);
    }
    return supplyValue === 'vial_5ml' ? 42 : 84;
  }
  return med.refill_interval_days || 28;
}

// Parse **bold** markdown into React elements
function renderFormattedText(text) {
  if (!text) return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Drip email info
const WL_DRIP_EMAILS = [
  { num: 1, subject: 'Welcome' },
  { num: 2, subject: 'Nutrition' },
  { num: 3, subject: 'Nausea Tips' },
  { num: 4, subject: 'Exercise' },
];

// Send Forms — form definitions & quick-select presets
const SEND_FORMS_LIST = [
  { id: 'intake', name: 'Medical Intake', icon: '📋', time: '10 min', required: true },
  { id: 'hipaa', name: 'HIPAA Privacy Notice', icon: '🔒', time: '3 min', required: true },
  { id: 'blood-draw', name: 'Blood Draw Consent', icon: '🩸', time: '2 min' },
  { id: 'hrt', name: 'HRT Consent', icon: '💊', time: '5 min' },
  { id: 'peptide', name: 'Peptide Consent', icon: '🧬', time: '5 min' },
  { id: 'iv', name: 'IV/Injection Consent', icon: '💧', time: '5 min' },
  { id: 'hbot', name: 'HBOT Consent', icon: '🫁', time: '5 min' },
  { id: 'weight-loss', name: 'Weight Loss Consent', icon: '⚖️', time: '5 min' },
  { id: 'red-light', name: 'Red Light Therapy', icon: '🔴', time: '5 min' },
  { id: 'prp', name: 'PRP Consent', icon: '🩸', time: '5 min' },
  { id: 'exosome-iv', name: 'Exosome IV Consent', icon: '🧬', time: '5 min' },
  { id: 'questionnaire', name: 'Baseline Questionnaire', icon: '📊', time: '10 min', gender: true },
];
const FORM_QUICK_SELECTS = [
  { label: 'New Patient', forms: ['intake', 'hipaa'] },
  { label: 'HRT', forms: ['intake', 'hipaa', 'hrt', 'blood-draw', 'questionnaire'] },
  { label: 'Weight Loss', forms: ['intake', 'hipaa', 'weight-loss', 'blood-draw', 'questionnaire'] },
  { label: 'IV Therapy', forms: ['intake', 'hipaa', 'iv'] },
  { label: 'Peptides', forms: ['intake', 'hipaa', 'peptide'] },
  { label: 'HBOT', forms: ['intake', 'hipaa', 'hbot'] },
  { label: 'Red Light', forms: ['intake', 'hipaa', 'red-light'] },
  { label: 'PRP', forms: ['intake', 'hipaa', 'prp', 'blood-draw'] },
  { label: 'Exosome IV', forms: ['intake', 'hipaa', 'exosome-iv'] },
  { label: 'Labs + Questionnaire', forms: ['intake', 'hipaa', 'blood-draw', 'questionnaire'] },
];

// Guides available to send from patient profile
const AVAILABLE_GUIDES = [
  { id: 'hrt-guide', name: 'HRT Guide', icon: '💊', category: 'hrt' },
  { id: 'tirzepatide-guide', name: 'Tirzepatide Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'retatrutide-guide', name: 'Retatrutide Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'weight-loss-medication-guide-page', name: 'WL Medication Guide', icon: '⚖️', category: 'weight_loss' },
  { id: 'bpc-tb4-guide', name: 'BPC/TB4 Guide', icon: '🧬', category: 'peptide' },
  { id: 'recovery-blend-guide', name: 'Recovery Blend Guide', icon: '🧬', category: 'peptide' },
  { id: 'glow-guide', name: 'GLOW Guide', icon: '✨', category: 'peptide' },
  { id: 'ghk-cu-guide', name: 'GHK-Cu Guide', icon: '🧬', category: 'peptide' },
  { id: '3x-blend-guide', name: '3x Blend Guide', icon: '🧬', category: 'peptide' },
  { id: 'tesamorelin-ipamorelin-guide', name: '2X Tesa/Ipa Guide', icon: '🧬', category: 'peptide' },
  { id: 'nad-guide', name: 'NAD+ Guide', icon: '💧', category: 'iv' },
  { id: 'methylene-blue-iv-guide', name: 'Methylene Blue Guide', icon: '💧', category: 'iv' },
  { id: 'methylene-blue-combo-iv-guide', name: 'MB+VitC Combo Guide', icon: '💧', category: 'iv' },
  { id: 'glutathione-iv-guide', name: 'Glutathione Guide', icon: '💧', category: 'iv' },
  { id: 'vitamin-c-iv-guide', name: 'Vitamin C Guide', icon: '💧', category: 'iv' },
  { id: 'range-iv-guide', name: 'Range IV Guide', icon: '💧', category: 'iv' },
  { id: 'cellular-reset-guide', name: 'Cellular Reset Guide', icon: '💧', category: 'iv' },
  { id: 'hbot-guide', name: 'HBOT Guide', icon: '🫁', category: 'hbot' },
  { id: 'red-light-guide', name: 'Red Light Guide', icon: '🔴', category: 'rlt' },
  { id: 'combo-membership-guide', name: 'Combo Membership', icon: '🏷️', category: 'membership' },
  { id: 'hbot-membership-guide', name: 'HBOT Membership', icon: '🏷️', category: 'membership' },
  { id: 'rlt-membership-guide', name: 'RLT Membership', icon: '🏷️', category: 'membership' },
  { id: 'essential-panel-male-guide', name: 'Essential Male Panel', icon: '🧪', category: 'labs' },
  { id: 'essential-panel-female-guide', name: 'Essential Female Panel', icon: '🧪', category: 'labs' },
  { id: 'elite-panel-male-guide', name: 'Elite Male Panel', icon: '🧪', category: 'labs' },
  { id: 'elite-panel-female-guide', name: 'Elite Female Panel', icon: '🧪', category: 'labs' },
  { id: 'the-blu-guide', name: 'The Blu', icon: '💎', category: 'other' },
];
const GUIDE_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hrt', label: 'HRT' },
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'peptide', label: 'Peptides' },
  { id: 'iv', label: 'IV' },
  { id: 'hbot', label: 'HBOT' },
  { id: 'rlt', label: 'Red Light' },
  { id: 'membership', label: 'Memberships' },
  { id: 'labs', label: 'Labs' },
];

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': { color: '#a0a0a0' },
    },
    invalid: { color: '#dc2626' },
  },
};

function AddCardForm({ patientId, onCardSaved }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSaveCard = async () => {
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Create SetupIntent on server
      const setupRes = await fetch('/api/stripe/saved-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });
      const setupData = await setupRes.json();
      if (!setupRes.ok) throw new Error(setupData.error || 'Failed to create setup');

      // 2. Confirm card setup with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError } = await stripe.confirmCardSetup(setupData.client_secret, {
        payment_method: { card: cardElement },
      });
      if (stripeError) throw new Error(stripeError.message);

      // 3. Success
      setSuccess(true);
      setShowForm(false);
      if (onCardSaved) onCardSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600,
            background: '#1e40af', color: '#fff', border: 'none',
            borderRadius: 0, cursor: 'pointer',
          }}
        >
          + Add Card
        </button>
        {success && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 500 }}>Card saved successfully!</span>}
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 8, padding: 16, background: '#f9fafb',
      borderRadius: 0, border: '1px solid #e5e7eb',
    }}>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#374151' }}>
        Add New Card
      </div>
      <div style={{
        padding: '12px', background: '#fff', border: '1px solid #d1d5db',
        borderRadius: 0, marginBottom: 12,
      }}>
        <CardElement options={CARD_ELEMENT_STYLE} />
      </div>
      {error && (
        <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSaveCard}
          disabled={saving || !stripe}
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600,
            background: saving ? '#9ca3af' : '#16a34a', color: '#fff',
            border: 'none', borderRadius: 0,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Card'}
        </button>
        <button
          onClick={() => { setShowForm(false); setError(null); }}
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 500,
            background: '#fff', color: '#374151', border: '1px solid #d1d5db',
            borderRadius: 0, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query || {};
  const { session, employee } = useAuth();

  // Staff email → display name mapping
  const STAFF_DISPLAY_NAMES = {
    'burgess@range-medical.com': 'Dr. Damien Burgess',
    'lily@range-medical.com': 'Lily Diaz RN',
    'evan@range-medical.com': 'Evan',
    'chris@range-medical.com': 'Chris Cupp',
    'damon@range-medical.com': 'Damon Durante',
  };
  const getStaffDisplayName = (val) => {
    if (!val) return '';
    const lower = val.toLowerCase();
    return STAFF_DISPLAY_NAMES[lower] || val;
  };

  // Check if current user can delete a specific note (author or admin)
  const NOTE_AUTHOR_ALIASES = {
    'burgess@range-medical.com': ['burgess@range-medical.com', 'dr. damien burgess', 'dr. burgess', 'damien burgess'],
    'lily@range-medical.com': ['lily@range-medical.com', 'lily', 'lily diaz rn'],
    'evan@range-medical.com': ['evan@range-medical.com', 'evan'],
    'chris@range-medical.com': ['chris@range-medical.com', 'chris', 'chris cupp'],
    'damon@range-medical.com': ['damon@range-medical.com', 'damon', 'damon durante'],
  };
  const currentUserEmail = session?.user?.email?.toLowerCase() || '';
  const isAdminUser = currentUserEmail === 'chris@range-medical.com';
  const canDeleteNote = (note) => {
    if (isAdminUser) return true;
    if (!note.created_by) return false;
    const aliases = NOTE_AUTHOR_ALIASES[currentUserEmail] || [];
    return note.created_by.toLowerCase() === currentUserEmail || aliases.some(a => a === note.created_by.toLowerCase());
  };

  // Email & SMS compose modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);

  // Core data state
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [intakeDemographics, setIntakeDemographics] = useState(null);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [labs, setLabs] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [consents, setConsents] = useState([]);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [patientTasks, setPatientTasks] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskEmployees, setTaskEmployees] = useState([]);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [taskListening, setTaskListening] = useState(false);
  const [taskDictationTarget, setTaskDictationTarget] = useState('title');
  const [taskFormatting, setTaskFormatting] = useState(false);
  const taskRecognitionRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [symptomResponses, setSymptomResponses] = useState([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [selectedQuestionnaireIdx, setSelectedQuestionnaireIdx] = useState(0);
  const [baselineQuestionnaires, setBaselineQuestionnaires] = useState([]);
  const [selectedBaselineIdx, setSelectedBaselineIdx] = useState(0);
  const [labProtocols, setLabProtocols] = useState([]);
  const [labDocuments, setLabDocuments] = useState([]);
  const [sendingLabId, setSendingLabId] = useState(null);
  const [sentLabIds, setSentLabIds] = useState({});
  const [deletingLabId, setDeletingLabId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [weightLossLogs, setWeightLossLogs] = useState([]);
  const [allProtocolLogs, setAllProtocolLogs] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [vitalsDisplayCount, setVitalsDisplayCount] = useState(5);
  const [commsLog, setCommsLog] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [expandedTransactions, setExpandedTransactions] = useState({});
  const [stripeCharges, setStripeCharges] = useState([]);
  const [loadingStripeCharges, setLoadingStripeCharges] = useState(false);
  const [stripeChargesFetched, setStripeChargesFetched] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [hrtLabSchedules, setHrtLabSchedules] = useState({});
  const [cycleInfo, setCycleInfo] = useState(null);

  // Dispense modal state
  const [dispensingProtocol, setDispensingProtocol] = useState(null);
  const [dispenseDate, setDispenseDate] = useState('');
  const [selectedSupplyType, setSelectedSupplyType] = useState('');
  const [dispenseDosage, setDispenseDosage] = useState('');
  const [customDoseMode, setCustomDoseMode] = useState(false);
  const [customDoseValue, setCustomDoseValue] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('in_clinic');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dosingNotes, setDosingNotes] = useState('');
  const [splitDoseMode, setSplitDoseMode] = useState(false);
  const [splitDoses, setSplitDoses] = useState([]);
  const [refillOverride, setRefillOverride] = useState('');
  const [dispensing, setDispensing] = useState(false);
  const [dispenseResult, setDispenseResult] = useState(null);

  // Timeline state
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('all');

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedProtocols, setExpandedProtocols] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Send Forms modal
  const [showSendFormsModal, setShowSendFormsModal] = useState(false);
  const [sendFormsSelected, setSendFormsSelected] = useState(new Set());
  const [sendFormsMethod, setSendFormsMethod] = useState('sms');
  const [sendFormsLoading, setSendFormsLoading] = useState(false);
  const [sendFormsResult, setSendFormsResult] = useState(null);
  const [sendFormsTab, setSendFormsTab] = useState('forms'); // 'forms' | 'guides'
  const [sendGuidesSelected, setSendGuidesSelected] = useState(new Set());
  const [sendGuidesCategory, setSendGuidesCategory] = useState('all');
  const [pinnedNoteExpanded, setPinnedNoteExpanded] = useState(false);
  const [pinnedNoteOverflows, setPinnedNoteOverflows] = useState(false);
  const pinnedNoteRef = useRef(null);
  const pinnedNoteCallbackRef = (node) => {
    pinnedNoteRef.current = node;
    if (node && !pinnedNoteExpanded) {
      // Use requestAnimationFrame to ensure layout is complete before measuring
      requestAnimationFrame(() => {
        if (pinnedNoteRef.current) {
          setPinnedNoteOverflows(pinnedNoteRef.current.scrollHeight > pinnedNoteRef.current.clientHeight);
        }
      });
    }
  };

  // AI Patient Synopsis
  const [aiSynopsis, setAiSynopsis] = useState(null);
  const [aiSynopsisLoading, setAiSynopsisLoading] = useState(false);
  const [aiSynopsisExpanded, setAiSynopsisExpanded] = useState(true);

  // Quick staff note from top section
  const [quickNoteInput, setQuickNoteInput] = useState('');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);
  const [staffNotesExpanded, setStaffNotesExpanded] = useState(true);
  const [expandedNoteIds, setExpandedNoteIds] = useState({});

  // Protocol PDF modal
  const [showProtocolPdfModal, setShowProtocolPdfModal] = useState(false);
  const [protocolPdfSelections, setProtocolPdfSelections] = useState({});
  const [protocolPdfCombine, setProtocolPdfCombine] = useState(true);
  const [protocolPdfPlanDate, setProtocolPdfPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [protocolPdfGenerating, setProtocolPdfGenerating] = useState(false);
  const [protocolPdfSaving, setProtocolPdfSaving] = useState(false);
  const [sendingWlLink, setSendingWlLink] = useState(null); // protocol id being sent

  // Send Document modal state
  const [sendDocModal, setSendDocModal] = useState({ open: false, url: '', name: '', type: '' });
  const [sendDocMethod, setSendDocMethod] = useState('both'); // 'email', 'sms', 'both'
  const [sendDocLoading, setSendDocLoading] = useState(false);
  const [sendDocResult, setSendDocResult] = useState(null);

  // Session log modal (for inline session grids — HBOT, RLT, IV, Injection)
  const [sessionLogModal, setSessionLogModal] = useState(null);
  const [sessionLogDate, setSessionLogDate] = useState('');
  const [sessionLogSaving, setSessionLogSaving] = useState(false);

  // Slide-out PDF viewer state
  const [pdfSlideOut, setPdfSlideOut] = useState({ open: false, url: '', title: '', sendable: false, docName: '' });
  const [slideoutWidth, setSlideoutWidth] = useState(70); // percentage

  // Template/peptide data for protocol assignment
  const [templates, setTemplates] = useState({ grouped: {} });
  const [peptides, setPeptides] = useState([]);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLabsModal, setShowLabsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [generatingChart, setGeneratingChart] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [referralInviteSending, setReferralInviteSending] = useState(false);
  const [referralInviteSent, setReferralInviteSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePreview, setDeletePreview] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bloodDrawModal, setBloodDrawModal] = useState(null);
  const [bloodDrawDate, setBloodDrawDate] = useState('');
  const [bloodDrawSaving, setBloodDrawSaving] = useState(false);
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editPurchaseForm, setEditPurchaseForm] = useState({ product_name: '', amount_paid: '', stripe_subscription_id: '', notes: '' });
  const [confirmDeletePurchase, setConfirmDeletePurchase] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState(false);

  // Add Credit modal state
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [addCreditAmount, setAddCreditAmount] = useState('');
  const [addCreditReason, setAddCreditReason] = useState('manual');
  const [addCreditNote, setAddCreditNote] = useState('');
  const [addCreditSaving, setAddCreditSaving] = useState(false);
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [creditBalanceLoaded, setCreditBalanceLoaded] = useState(false);
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);
  const [deletingCreditId, setDeletingCreditId] = useState(null);

  // Edit injection modal state
  const [editInjectionModal, setEditInjectionModal] = useState(null);
  const [editInjectionForm, setEditInjectionForm] = useState({ entry_date: '', dosage: '', weight: '', notes: '', fulfillment_method: 'in_clinic', tracking_number: '' });
  const [editInjectionSaving, setEditInjectionSaving] = useState(false);
  const [confirmDeleteInjection, setConfirmDeleteInjection] = useState(false);

  // Log Entry modal state
  const [showServiceLog, setShowServiceLog] = useState(false);
  const [serviceLogKey, setServiceLogKey] = useState(0);

  // Quick weight log modal state (for missed WL sessions)
  const [quickWeightModal, setQuickWeightModal] = useState(null); // { protocol, slotDate }
  const [quickWeightForm, setQuickWeightForm] = useState({ weight: '', notes: '' });
  const [quickWeightSaving, setQuickWeightSaving] = useState(false);

  // Shipment reminder modal state (auto-prompt after partial fulfillment)
  const [shipmentReminderModal, setShipmentReminderModal] = useState(null); // { patientName, medication, pending, protocolId }
  const [shipmentReminderForm, setShipmentReminderForm] = useState({ dueDate: '', notes: '', assignedTo: '' });
  const [shipmentReminderSaving, setShipmentReminderSaving] = useState(false);

  // WL drip email + check-in state
  const [dripLogs, setDripLogs] = useState({});
  const [startingDrip, setStartingDrip] = useState(null);
  const [wlCheckinDay, setWlCheckinDay] = useState('Monday');
  const [enablingCheckin, setEnablingCheckin] = useState(null);

  // Appointment edit modal state
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [aptEditStatus, setAptEditStatus] = useState('');
  const [aptEditNotes, setAptEditNotes] = useState('');
  const [aptEditCategory, setAptEditCategory] = useState('');
  const [savingApt, setSavingApt] = useState(false);
  const [statusDropdownAptId, setStatusDropdownAptId] = useState(null);
  const [updatingAptStatus, setUpdatingAptStatus] = useState(null);

  // Send Progress modal state
  const [showSendProgressModal, setShowSendProgressModal] = useState(false);
  const [sendProgressProtocol, setSendProgressProtocol] = useState(null);
  const [sendProgressMethod, setSendProgressMethod] = useState('both');
  const [sendingProgress, setSendingProgress] = useState(false);
  const [sendProgressResult, setSendProgressResult] = useState(null);

  // Merge Protocol modal state
  const [mergeSource, setMergeSource] = useState(null);   // protocol being merged away
  const [mergeTarget, setMergeTarget] = useState(null);   // protocol that survives
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [redeemingPerkId, setRedeemingPerkId] = useState(null);
  const [hrtRangeIVStatus, setHrtRangeIVStatus] = useState(null); // { protocolId, used, service_date, cycle_start, cycle_end }

  // Extend WL Protocol modal state
  const [showExtendWLModal, setShowExtendWLModal] = useState(false);
  const [extendWLProtocol, setExtendWLProtocol] = useState(null);
  const [extendWLDays, setExtendWLDays] = useState(28);
  const [extendWLDose, setExtendWLDose] = useState('');
  const [extendWLPurchaseId, setExtendWLPurchaseId] = useState('');
  const [extendWLNotes, setExtendWLNotes] = useState('');
  const [extendingWL, setExtendingWL] = useState(false);
  const [extendWLError, setExtendWLError] = useState('');

  // Payments sub-tab state
  const [paymentsSubTab, setPaymentsSubTab] = useState('subscriptions');

  // Saved cards state
  const [savedCards, setSavedCards] = useState([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);

  // Stripe subscription management state
  const [stripeSubscriptions, setStripeSubscriptions] = useState([]);
  const [loadingStripeSubs, setLoadingStripeSubs] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(null);
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [newSubForm, setNewSubForm] = useState({ amount: '', interval: 'month', description: '', service_category: 'hrt' });
  const [creatingSub, setCreatingSub] = useState(false);
  const [subPlans, setSubPlans] = useState([]);
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);

  // Form states
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [existingPacks, setExistingPacks] = useState([]);
  const [addToPackMode, setAddToPackMode] = useState(false);
  const [linkToProtocolMode, setLinkToProtocolMode] = useState(false);
  const [selectedLinkProtocolId, setSelectedLinkProtocolId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');

  const [assignForm, setAssignForm] = useState({
    templateId: '', peptideId: '', selectedDose: '', frequency: '',
    startDate: new Date().toISOString().split('T')[0], notes: '',
    injectionMedication: '', injectionDose: '', vialDuration: '',
    medication: '', deliveryMethod: '', injectionDay: '', pickupFrequencyDays: '',
    // HRT-specific fields
    hrtGender: '', injectionMethod: '', supplyType: '', dosePerInjection: '',
    injectionsPerWeek: '', vialSize: '', hrtInitialQuantity: ''
  });

  const [editForm, setEditForm] = useState({
    medication: '', selectedDose: '', frequency: '', startDate: '',
    endDate: '', status: '', notes: '', sessionsUsed: 0, totalSessions: null,
    // Peptide vial fields
    numVials: '', dosesPerVial: '',
    // HRT vial-specific fields
    dosePerInjection: '', injectionsPerWeek: 2, vialSize: '', supplyType: '', lastRefillDate: '', lastPaymentDate: '',
    // HRT injection method (IM or SubQ)
    injectionMethod: '',
    // In-clinic scheduling fields
    deliveryMethod: '', visitFrequency: '', scheduledDays: [], lastVisitDate: '', nextExpectedDate: ''
  });

  const [labForm, setLabForm] = useState({
    labType: 'Baseline', labPanel: 'Elite',
    completedDate: new Date().toISOString().split('T')[0], notes: ''
  });

  const [uploadForm, setUploadForm] = useState({
    file: null, labType: 'Baseline', panelType: 'Elite',
    collectionDate: new Date().toISOString().split('T')[0], notes: ''
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Document upload state (Docs tab)
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docUploadForm, setDocUploadForm] = useState({
    file: null, documentName: '', documentType: 'MRI Report', notes: ''
  });
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState(null);

  const [sendingSymptoms, setSendingSymptoms] = useState(false);
  const [symptomsSent, setSymptomsSent] = useState(false);
  const fileInputRef = useRef(null);

  // Notes state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showStandaloneEncounterModal, setShowStandaloneEncounterModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteFormatted, setNoteFormatted] = useState('');
  const [noteFormatting, setNoteFormatting] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteBody, setEditNoteBody] = useState('');
  const [editNoteSaving, setEditNoteSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [noteFilter, setNoteFilter] = useState('clinical');
  const [addNoteCategory, setAddNoteCategory] = useState('internal');
  const recognitionRef = useRef(null);

  // Blooio opt-in status
  const [blooioOptIn, setBlooioOptIn] = useState(null); // null=loading, true=opted in, false=pending
  const [showDemographics, setShowDemographics] = useState(false);

  // Patient edit mode
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState({});
  const [savingPatient, setSavingPatient] = useState(false);

  // Condition tag management
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [savingConditions, setSavingConditions] = useState(false);

  // Load data
  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchTemplates();
      fetchPeptides();
      fetchLabDocuments();
      fetchCreditBalance();
    }
  }, [id]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdownAptId) return;
    const handler = () => setStatusDropdownAptId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [statusDropdownAptId]);

  // Fetch 90-day cycle info when we have a patient with recovery peptide protocols
  useEffect(() => {
    if (!id || !activeProtocols.length) return;
    const hasRecoveryPeptide = activeProtocols.some(p => {
      const med = p.medication || '';
      const pt = (p.program_type || '').toLowerCase();
      const pn = (p.program_name || '').toLowerCase();
      return isRecoveryPeptide(med) || pt.includes('recovery') || pt.includes('peptide') ||
             pn.includes('recovery') || pn.includes('bpc') || pn.includes('thymosin');
    });
    if (hasRecoveryPeptide) {
      fetch(`/api/protocols/cycle-info?patientId=${id}&cycleType=recovery`)
        .then(r => r.json())
        .then(data => { if (data.success) setCycleInfo(data); })
        .catch(() => {});
    }
  }, [id, activeProtocols]);

  // Check Blooio opt-in status when patient phone is available
  useEffect(() => {
    if (!patient?.phone) return;
    fetch(`/api/blooio/check-optin?phone=${encodeURIComponent(patient.phone)}`)
      .then(r => r.json())
      .then(data => {
        if (data.provider === 'twilio') {
          setBlooioOptIn(null); // Not using Blooio, hide badge
        } else {
          setBlooioOptIn(data.optedIn);
        }
      })
      .catch(() => setBlooioOptIn(null));
  }, [patient?.phone]);

  // Close PDF viewer on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && pdfSlideOut.open) {
        setPdfSlideOut({ open: false, url: '', title: '' });
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pdfSlideOut.open]);

  const pinnedNote = notes.find(n => n.pinned);
  // Re-check overflow when pinned note content or expanded state changes
  useEffect(() => {
    if (pinnedNoteRef.current && pinnedNote && !pinnedNoteExpanded) {
      requestAnimationFrame(() => {
        if (pinnedNoteRef.current) {
          setPinnedNoteOverflows(pinnedNoteRef.current.scrollHeight > pinnedNoteRef.current.clientHeight);
        }
      });
    }
  }, [pinnedNote?.id, pinnedNote?.body, pinnedNoteExpanded]);

  const VALID_TRANSITIONS = {
    scheduled: ['confirmed', 'checked_in', 'showed', 'completed', 'cancelled', 'no_show'],
    confirmed: ['checked_in', 'showed', 'completed', 'cancelled', 'no_show'],
    checked_in: ['in_progress', 'showed', 'completed', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    showed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
    rescheduled: [],
  };

  const handleQuickStatusChange = async (apt, newStatus) => {
    setStatusDropdownAptId(null);
    setUpdatingAptStatus(apt.id);
    try {
      const res = await fetch(`/api/appointments/${apt.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
        return;
      }
      // Update local state immediately
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update status');
    } finally {
      setUpdatingAptStatus(null);
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();

      if (data.patient) {
        setPatient(data.patient);
        setIntakeDemographics(data.intakeDemographics || null);
        setActiveProtocols(data.activeProtocols || []);
        // Fetch drip logs for weight loss protocols
        (data.activeProtocols || []).filter(p => p.category === 'weight_loss').forEach(p => fetchDripLogs(p.id));
        setCompletedProtocols(data.completedProtocols || []);
        setPendingNotifications(data.pendingNotifications || []);
        setLabProtocols(data.labProtocols || []);
        setLabs(data.labs || []);
        setIntakes(data.intakes || []);
        setConsents(data.consents || []);
        setMedicalDocuments(data.medicalDocuments || []);
        setAssessments(data.assessments || []);
        setPatientTasks(data.patientTasks || []);
        setSessions(data.sessions || []);
        setSymptomResponses(data.symptomResponses || []);
        setQuestionnaireResponses(data.questionnaireResponses || []);
        setBaselineQuestionnaires(data.baselineQuestionnaires || []);
        setAppointments(data.appointments || []);
        setNotes(data.notes || []);
        setWeightLossLogs(data.weightLossLogs || []);
        setAllProtocolLogs(data.protocolLogs || []);
        setServiceLogs(data.serviceLogs || []);
        setCommsLog(data.commsLog || []);
        setAllPurchases(data.allPurchases || []);
        setInvoices(data.invoices || []);
        setSubscriptions(data.subscriptions || []);
        setMedications(data.medications || []);
        setPrescriptions(data.prescriptions || []);
        setStats(data.stats || {});

        // Fetch saved cards (non-blocking)
        fetch(`/api/stripe/saved-cards?patient_id=${id}`)
          .then(r => r.json())
          .then(d => setSavedCards(d.cards || []))
          .catch(() => {});

        // Fetch vitals history (non-blocking)
        fetch(`/api/vitals/history?patient_id=${id}`)
          .then(r => r.json())
          .then(d => setVitalsHistory(d.vitals || []))
          .catch(() => {});

        // Compute ADAPTIVE HRT lab schedules for HRT protocols
        // Each draw's target date is calculated from the actual previous lab date,
        // not a fixed schedule — so if someone gets labs late, the next draw shifts forward.
        const allProtos = [...(data.activeProtocols || []), ...(data.completedProtocols || [])];
        const hrtProtos = allProtos.filter(p => isHRTProtocol(p.program_type) && p.start_date);
        if (hrtProtos.length > 0) {
          const schedules = {};
          // Fetch all HRT protocol data in parallel (not sequential)
          const results = await Promise.allSettled(
            hrtProtos.map(async (p) => {
              const protoRes = await fetch(`/api/protocols/${p.id}`);
              const protoData = await protoRes.json();
              return { proto: p, protoData };
            })
          );
          for (const result of results) {
            if (result.status === 'fulfilled') {
              const { proto: p, protoData } = result.value;
              const bloodDrawLogs = (protoData.activityLogs || []).filter(l => l.log_type === 'blood_draw');
              const firstFollowup = protoData.protocol?.first_followup_weeks || p.first_followup_weeks || 8;
              schedules[p.id] = buildAdaptiveHRTSchedule(p.start_date, firstFollowup, bloodDrawLogs, data.labs || [], data.labProtocols || []);
            } else {
              const p = hrtProtos[results.indexOf(result)];
              const firstFollowup = p.first_followup_weeks || 8;
              const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
              schedules[p.id] = schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null, logId: null }));
            }
          }
          setHrtLabSchedules(schedules);
        }

        // Fetch Range IV perk status for the active HRT protocol
        const activeHrt = (data.activeProtocols || []).find(p => isHRTProtocol(p.program_type) && p.status === 'active');
        if (activeHrt) {
          fetch(`/api/protocols/${activeHrt.id}/range-iv-status`)
            .then(r => r.json())
            .then(d => setHrtRangeIVStatus({ protocolId: activeHrt.id, ...d }))
            .catch(() => {});
        }

        // Fetch AI synopsis (non-blocking)
        if (!aiSynopsis) {
          setAiSynopsisLoading(true);
          fetch('/api/patients/synopsis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: id }),
          })
            .then(r => r.json())
            .then(d => { if (d.synopsis) setAiSynopsis(d.synopsis); })
            .catch(() => {})
            .finally(() => setAiSynopsisLoading(false));
        }
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeCharges = async () => {
    if (!id || stripeChargesFetched) return;
    try {
      setLoadingStripeCharges(true);
      const res = await fetch(`/api/patients/${id}/stripe-charges`);
      const data = await res.json();
      setStripeCharges(data.charges || []);
      setHasStripeCustomer(data.hasStripeCustomer || false);
      setStripeChargesFetched(true);
    } catch (err) {
      console.error('Error fetching Stripe charges:', err);
    } finally {
      setLoadingStripeCharges(false);
    }
  };

  const fetchSavedCards = async () => {
    if (!id) return;
    try {
      setLoadingSavedCards(true);
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${id}`);
      const data = await res.json();
      setSavedCards(data.cards || []);
    } catch (err) {
      console.error('Error fetching saved cards:', err);
    } finally {
      setLoadingSavedCards(false);
    }
  };

  const fetchStripeSubscriptions = async () => {
    if (!id) return;
    try {
      setLoadingStripeSubs(true);
      const res = await fetch(`/api/stripe/subscription?patient_id=${id}`);
      const data = await res.json();
      setStripeSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching stripe subscriptions:', err);
    } finally {
      setLoadingStripeSubs(false);
    }
  };

  const handleSubAction = async (subscriptionId, action, paymentMethodId) => {
    setSubActionLoading(subscriptionId + '_' + action);
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, action, payment_method_id: paymentMethodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      alert(data.message || 'Success');
      fetchStripeSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubActionLoading(null);
    }
  };

  const handleCancelSubscription = async (subscriptionId, immediate) => {
    const msg = immediate
      ? 'Cancel this subscription immediately? This cannot be undone.'
      : 'Cancel this subscription at the end of the current billing period?';
    if (!confirm(msg)) return;
    setSubActionLoading(subscriptionId + '_cancel');
    try {
      if (immediate) {
        const res = await fetch('/api/stripe/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subscriptionId }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Cancel failed');
        alert('Subscription cancelled');
      } else {
        await handleSubAction(subscriptionId, 'cancel_at_period_end');
        return;
      }
      fetchStripeSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubActionLoading(null);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSubForm.amount || parseFloat(newSubForm.amount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    if (savedCards.length === 0) {
      alert('Patient needs a card on file first. Add one under Payment Methods.');
      return;
    }
    setCreatingSub(true);
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id,
          price_amount: Math.round(parseFloat(newSubForm.amount) * 100),
          interval: newSubForm.interval,
          description: newSubForm.description || `${newSubForm.service_category?.toUpperCase() || ''} Subscription`.trim(),
          service_category: newSubForm.service_category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');
      alert(`Subscription created! Status: ${data.status}`);
      setShowNewSubForm(false);
      setNewSubForm({ amount: '', interval: 'month', description: '', service_category: 'hrt' });
      fetchStripeSubscriptions();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCreatingSub(false);
    }
  };

  // Fetch recurring POS services as subscription plan presets
  const fetchSubPlans = async () => {
    if (subPlans.length > 0) return;
    setLoadingSubPlans(true);
    try {
      const res = await fetch('/api/pos/services?active=true');
      const data = await res.json();
      const recurring = (data.services || [])
        .filter(s => s.recurring && s.price > 0)
        .map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          category: s.category,
          interval: s.interval || 'month',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setSubPlans(recurring);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
    setLoadingSubPlans(false);
  };

  // Auto-load stripe subscriptions when switching to subscriptions sub-tab
  useEffect(() => {
    if (activeTab === 'payments' && paymentsSubTab === 'subscriptions' && stripeSubscriptions.length === 0 && !loadingStripeSubs) {
      fetchStripeSubscriptions();
    }
    if (activeTab === 'payments' && paymentsSubTab === 'subscriptions') {
      fetchSubPlans();
    }
  }, [activeTab, paymentsSubTab]);

  const fetchCreditBalance = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/credits/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCreditBalanceCents(data.balance_cents || 0);
        setCreditBalanceLoaded(true);
        setCreditHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching credit balance:', err);
    }
  };

  const handleDeleteCreditEntry = async (entryId) => {
    if (!confirm('Remove this credit entry? The balance will be recalculated.')) return;
    setDeletingCreditId(entryId);
    try {
      const res = await fetch(`/api/credits/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete credit entry');
      setCreditBalanceCents(data.new_balance_cents);
      setCreditBalanceLoaded(true);
      setCreditHistory(prev => prev.filter(e => e.id !== entryId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingCreditId(null);
    }
  };

  const handleRemoveCard = async (paymentMethodId) => {
    if (!confirm('Remove this card from file?')) return;
    try {
      const res = await fetch('/api/stripe/saved-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      if (res.ok) {
        setSavedCards(prev => prev.filter(c => c.id !== paymentMethodId));
      }
    } catch (err) {
      console.error('Error removing card:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/protocols/templates');
      const data = await res.json();
      if (data.grouped) setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchPeptides = async () => {
    try {
      const res = await fetch('/api/peptides');
      const data = await res.json();
      if (data.peptides) setPeptides(data.peptides);
    } catch (error) {
      console.error('Error fetching peptides:', error);
    }
  };

  const fetchLabDocuments = async () => {
    if (!id) return;
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/patients/${id}/lab-documents`);
      const data = await res.json();
      if (data.documents) setLabDocuments(data.documents);
    } catch (error) {
      console.error('Error fetching lab documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchTimeline = async (filter = 'all') => {
    if (!id) return;
    try {
      setTimelineLoading(true);
      const res = await fetch(`/api/patients/${id}/timeline?filter=${filter}&limit=100`);
      const data = await res.json();
      setTimeline(data.events || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Blood draw handlers
  const handleBloodDrawClick = (draw, protocolId) => {
    setBloodDrawDate(draw.completedDate || new Date().toISOString().split('T')[0]);
    setBloodDrawModal({ ...draw, protocolId });
  };

  const handleBloodDrawSave = async (action = 'complete') => {
    if (!bloodDrawModal) return;
    setBloodDrawSaving(true);
    try {
      const res = await fetch(`/api/protocols/${bloodDrawModal.protocolId}/log-blood-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawLabel: bloodDrawModal.label,
          completedDate: action === 'undo' ? null : bloodDrawDate,
          action: action === 'undo' ? 'undo' : 'complete'
        })
      });
      const data = await res.json();
      if (data.success) {
        setBloodDrawModal(null);
        // Refresh patient data to update the schedule
        fetchPatient();
      }
    } catch (err) {
      console.error('Blood draw save error:', err);
    } finally {
      setBloodDrawSaving(false);
    }
  };

  const handleToggleFollowupWeeks = async (protocolId) => {
    // Find the protocol to get current value
    const proto = [...activeProtocols, ...completedProtocols].find(p => p.id === protocolId);
    const currentWeeks = proto?.first_followup_weeks || 8;
    const newWeeks = currentWeeks === 8 ? 12 : 8;

    // Update local state immediately — recompute schedule with new interval
    const updateProtoList = (list) => list.map(p =>
      p.id === protocolId ? { ...p, first_followup_weeks: newWeeks } : p
    );
    setActiveProtocols(prev => updateProtoList(prev));
    setCompletedProtocols(prev => updateProtoList(prev));

    // Recompute the adaptive lab schedule locally
    const updatedProto = { ...proto, first_followup_weeks: newWeeks };
    try {
      const protoRes = await fetch(`/api/protocols/${protocolId}`);
      const protoData = await protoRes.json();
      const bloodDrawLogs = (protoData.activityLogs || []).filter(l => l.log_type === 'blood_draw');
      const adaptive = buildAdaptiveHRTSchedule(updatedProto.start_date, newWeeks, bloodDrawLogs, labs || [], labProtocols || []);
      setHrtLabSchedules(prev => ({ ...prev, [protocolId]: adaptive }));
    } catch {
      const schedule = getHRTLabSchedule(updatedProto.start_date, newWeeks);
      setHrtLabSchedules(prev => ({ ...prev, [protocolId]: schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null, logId: null })) }));
    }

    // Persist to database (may fail if column doesn't exist yet — that's OK)
    try {
      await fetch(`/api/protocols/${protocolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_followup_weeks: newWeeks })
      });
    } catch (err) {
      console.error('Could not persist first_followup_weeks:', err);
    }
  };

  // ===== Protocol inline tracker helpers =====

  const getPacificToday = () => {
    const now = new Date();
    const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    pacific.setHours(0, 0, 0, 0);
    return pacific;
  };

  const getDateForDay = (startDate, dayNum) => {
    if (!startDate) return null;
    const parts = startDate.split('-');
    const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    start.setDate(start.getDate() + dayNum - 1);
    return start;
  };

  const calculateCurrentDay = (startDate) => {
    if (!startDate) return null;
    const parts = startDate.split('-');
    const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    start.setHours(0, 0, 0, 0);
    const today = getPacificToday();
    const diffTime = today - start;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getProtocolLogsForId = (protocolId) => {
    return allProtocolLogs.filter(l => l.protocol_id === protocolId);
  };

  const handleSessionLog = async () => {
    if (!sessionLogModal) return;
    setSessionLogSaving(true);
    try {
      const res = await fetch(`/api/protocols/${sessionLogModal.protocolId}/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: sessionLogDate,
          log_type: 'session',
          notes: `Session #${sessionLogModal.sessionNum}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSessionLogModal(null);
        fetchPatient();
      } else {
        alert('Error: ' + (data.error || 'Failed to log session'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSessionLogSaving(false);
  };

  const formatDayDate = (date) => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDOB = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    const opts = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== new Date().getFullYear()) {
      opts.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', opts);
  };

  // --- Task creation helpers ---
  const fetchTaskEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees?basic=true', {
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTaskEmployees(Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.assigned_to) return;
    setCreatingTask(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description?.trim() || null,
          assigned_to: taskForm.assigned_to,
          patient_id: id,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : null,
          priority: taskForm.priority,
          due_date: taskForm.due_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateTask(false);
        setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
        fetchPatient();
      }
    } catch {}
    setCreatingTask(false);
  };

  const startTaskListening = (target = 'title') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser'); return; }
    stopTaskListening();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    const startText = taskForm[target] || '';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTaskForm(prev => ({ ...prev, [target]: startText ? startText + ' ' + transcript : transcript }));
    };
    recognition.onerror = () => { setTaskListening(false); };
    recognition.onend = () => { setTaskListening(false); taskRecognitionRef.current = null; };
    recognition.start();
    taskRecognitionRef.current = recognition;
    setTaskListening(true);
    setTaskDictationTarget(target);
  };

  const stopTaskListening = () => {
    if (taskRecognitionRef.current) {
      taskRecognitionRef.current.stop();
      taskRecognitionRef.current = null;
    }
    setTaskListening(false);
  };

  const handleTaskFormat = async () => {
    const raw = (taskForm.title + ' ' + (taskForm.description || '')).trim();
    if (!raw) return;
    setTaskFormatting(true);
    try {
      const res = await fetch('/api/tasks/format', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: raw }),
      });
      const data = await res.json();
      if (data.formatted) {
        setTaskForm(prev => ({ ...prev, title: data.formatted, description: '' }));
      }
    } catch {}
    setTaskFormatting(false);
  };

  // Get session dates for a protocol from service logs
  // Returns an array where index 0 = session 1 date, index 1 = session 2 date, etc.
  const getSessionDates = (protocol) => {
    if (!serviceLogs || !protocol) return [];
    const category = protocol.category || protocol.program_type;
    // Match logs: prefer protocol_id match, fall back to category + date range
    const matchingLogs = serviceLogs
      .filter(log => {
        // Must be a session or injection entry
        if (!['session', 'injection'].includes(log.entry_type)) return false;
        // Exact protocol_id match
        if (log.protocol_id && log.protocol_id === protocol.id) return true;
        // Fallback: match by category (map program_type to category)
        const catMap = { hbot: 'hbot', rlt: 'red_light', red_light: 'red_light', iv: 'iv_therapy', iv_therapy: 'iv_therapy', injection: 'injection', vitamin: 'vitamin' };
        const logCat = catMap[log.category] || log.category;
        const protoCat = catMap[category] || category;
        if (logCat !== protoCat) return false;
        // If no protocol_id, only match if log falls within protocol date range
        if (protocol.start_date && log.entry_date < protocol.start_date) return false;
        if (protocol.end_date && log.entry_date > protocol.end_date) return false;
        return true;
      })
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
    return matchingLogs.map(log => log.entry_date);
  };

  // Compact date format for session boxes: "1/12", "2/23", "3/11"
  const formatBoxDate = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('T')[0].split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Send Forms handler
  const handleSendForms = async () => {
    if (sendFormsSelected.size === 0) return;
    setSendFormsLoading(true);
    setSendFormsResult(null);
    try {
      const sortedForms = [...sendFormsSelected].sort((a, b) => {
        const order = ['intake', 'hipaa'];
        const ai = order.indexOf(a), bi = order.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return 0;
      });
      const firstName = patient?.first_name || patient?.name?.split(' ')[0] || '';
      const patientName = (patient?.first_name && patient?.last_name) ? `${patient.first_name} ${patient.last_name}` : patient?.name || '';

      // Include gender metadata if questionnaire is selected
      const metadata = sortedForms.includes('questionnaire') ? { gender: patient?.gender || null } : undefined;

      if (sendFormsMethod === 'email') {
        const res = await fetch('/api/admin/send-forms-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: patient.email,
            firstName,
            formIds: sortedForms,
            patientId: id,
            patientName,
            ghlContactId: patient.ghl_contact_id || null,
            patientPhone: patient.phone || null,
            metadata,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send email');
        setSendFormsResult({ success: true, message: `${sortedForms.length} form${sortedForms.length > 1 ? 's' : ''} sent via email` });
      } else {
        const phone = (patient.phone || '').replace(/\D/g, '');
        const cleanPhone = phone.length === 11 && phone.startsWith('1') ? phone.slice(1) : phone;
        const res = await fetch('/api/send-forms-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            firstName,
            formIds: sortedForms,
            patientId: id,
            patientName,
            ghlContactId: patient.ghl_contact_id || null,
            patientEmail: patient.email || null,
            metadata,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
        setSendFormsResult({ success: true, message: data.twoStep ? 'Opt-in request sent — forms will deliver after patient replies' : `${sortedForms.length} form${sortedForms.length > 1 ? 's' : ''} sent via SMS` });
      }
    } catch (err) {
      setSendFormsResult({ success: false, message: err.message });
    } finally {
      setSendFormsLoading(false);
      setTimeout(() => setSendFormsResult(null), 4000);
    }
  };

  const handleSendGuides = async () => {
    if (sendGuidesSelected.size === 0) return;
    setSendFormsLoading(true);
    setSendFormsResult(null);
    try {
      const guideIds = [...sendGuidesSelected];
      const firstName = patient?.first_name || patient?.name?.split(' ')[0] || '';
      const patientName = (patient?.first_name && patient?.last_name) ? `${patient.first_name} ${patient.last_name}` : patient?.name || '';

      if (sendFormsMethod === 'email') {
        const res = await fetch('/api/admin/send-guides-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: patient.email,
            firstName,
            guideIds,
            patientId: id,
            patientName,
            ghlContactId: patient.ghl_contact_id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send email');
        setSendFormsResult({ success: true, message: `${guideIds.length} guide${guideIds.length > 1 ? 's' : ''} sent via email` });
      } else {
        const phone = (patient.phone || '').replace(/\D/g, '');
        const cleanPhone = phone.length === 11 && phone.startsWith('1') ? phone.slice(1) : phone;
        const res = await fetch('/api/send-guide-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            firstName,
            guideIds,
            patientId: id,
            patientName,
            ghlContactId: patient.ghl_contact_id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
        setSendFormsResult({ success: true, message: data.twoStep ? 'Opt-in request sent — guides will deliver after patient replies' : `${guideIds.length} guide${guideIds.length > 1 ? 's' : ''} sent via SMS` });
      }
    } catch (err) {
      setSendFormsResult({ success: false, message: err.message });
    } finally {
      setSendFormsLoading(false);
      setTimeout(() => setSendFormsResult(null), 4000);
    }
  };

  const getGhlLink = () => {
    if (!patient?.ghl_contact_id) return null;
    return `https://app.gohighlevel.com/v2/location/your-location-id/contacts/detail/${patient.ghl_contact_id}`;
  };

  const getPatientDisplayName = () => {
    const fullName = (patient?.first_name && patient?.last_name)
      ? `${patient.first_name} ${patient.last_name}`
      : patient?.name || 'Unknown Patient';
    if (patient?.preferred_name && patient.preferred_name !== patient.first_name) {
      return `${fullName} ("${patient.preferred_name}")`;
    }
    return fullName;
  };

  const getCategoryStyle = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

  // For peptide protocols, show the actual peptide name (medication) instead of the Stripe product name (program_name)
  const getProtocolDisplayName = (p) => {
    if (p.category === 'peptide' && p.medication) return p.medication;
    return p.program_name || p.medication || p.program_type || '';
  };

  // Compute last activity date per active protocol from service logs + sessions
  const getProtocolLastActivity = () => {
    if (!activeProtocols.length) return [];
    const result = activeProtocols.map(protocol => {
      // Find latest service log for this protocol (sorted desc by entry_date already)
      const protoLogs = serviceLogs.filter(l => l.protocol_id === protocol.id);
      const latestLog = protoLogs.length > 0 ? protoLogs.reduce((best, l) => {
        return new Date(l.entry_date) > new Date(best.entry_date) ? l : best;
      }) : null;

      // Find latest session for this protocol
      const protoSessions = sessions.filter(s => s.protocol_id === protocol.id);
      const latestSession = protoSessions.length > 0 ? protoSessions.reduce((best, s) => {
        return new Date(s.session_date) > new Date(best.session_date) ? s : best;
      }) : null;

      // Pick whichever is more recent
      let lastDate = null;
      let lastType = null;
      let lastMed = null;
      if (latestLog && latestSession) {
        if (new Date(latestLog.entry_date) >= new Date(latestSession.session_date)) {
          lastDate = new Date(latestLog.entry_date);
          lastType = latestLog.entry_type;
          lastMed = latestLog.medication;
        } else {
          lastDate = new Date(latestSession.session_date);
          lastType = 'session';
          lastMed = null;
        }
      } else if (latestLog) {
        lastDate = new Date(latestLog.entry_date);
        lastType = latestLog.entry_type;
        lastMed = latestLog.medication;
      } else if (latestSession) {
        lastDate = new Date(latestSession.session_date);
        lastType = 'session';
        lastMed = null;
      }

      // Build descriptive label
      const typeLabel = lastType === 'pickup' ? 'Pickup' : lastType === 'injection' ? 'Range Injection' : lastType === 'session' ? 'Session' : null;

      // Renewal / supply status — driven by days_remaining (date-based) and sessions_remaining
      let renewalTag = null;
      const daysLeft = protocol.days_remaining;
      const sessLeft = protocol.sessions_remaining;
      const totalSess = protocol.total_sessions;
      if (daysLeft !== null && daysLeft !== undefined) {
        if (daysLeft <= 0) renewalTag = { label: 'Refill overdue', urgent: true };
        else if (daysLeft <= 7) renewalTag = { label: `Refill in ${daysLeft}d`, urgent: true };
        else if (daysLeft <= 14) renewalTag = { label: `Refill in ${daysLeft}d`, urgent: false };
      }
      if (!renewalTag && sessLeft !== null && sessLeft !== undefined && totalSess > 0) {
        if (sessLeft <= 0) renewalTag = { label: 'Renewal needed', urgent: true };
        else if (sessLeft <= 2) renewalTag = { label: `${sessLeft} session${sessLeft === 1 ? '' : 's'} left`, urgent: true };
        else if (sessLeft <= 4) renewalTag = { label: `${sessLeft} sessions left`, urgent: false };
      }
      // End-date based protocols without days_remaining (fallback)
      if (!renewalTag && protocol.end_date && !daysLeft) {
        const endDate = new Date(protocol.end_date + 'T00:00:00');
        const daysToEnd = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysToEnd <= 0) renewalTag = { label: 'Expired', urgent: true };
        else if (daysToEnd <= 14) renewalTag = { label: `Ends in ${daysToEnd}d`, urgent: daysToEnd <= 7 };
      }

      const catStyle = getCategoryStyle(protocol.category);
      return {
        id: protocol.id,
        name: getProtocolDisplayName(protocol),
        category: protocol.category,
        catStyle,
        lastDate,
        lastType: typeLabel,
        lastMed,
        renewalTag,
      };
    });
    return result;
  };

  // Protocol handlers
  const openAssignModal = async (notification = null) => {
    setSelectedNotification(notification);
    setAssignForm({
      templateId: '', peptideId: '', selectedDose: '', frequency: '',
      startDate: new Date().toISOString().split('T')[0], notes: '',
      injectionMedication: '', injectionDose: '', vialDuration: ''
    });
    setAddToPackMode(false);
    setLinkToProtocolMode(false);
    setSelectedLinkProtocolId('');
    setSelectedPackId('');
    setExistingPacks([]);

    const isInjection = notification?.category === 'Injection' ||
                        notification?.product_name?.toLowerCase().includes('injection');

    if (isInjection && (id || patient?.ghl_contact_id)) {
      try {
        const params = new URLSearchParams();
        if (id) params.set('patient_id', id);
        if (patient?.ghl_contact_id) params.set('ghl_contact_id', patient.ghl_contact_id);

        const res = await fetch(`/api/protocols/active-packs?${params}`);
        const data = await res.json();
        if (data.packs?.length > 0) setExistingPacks(data.packs);
      } catch (err) {
        console.error('Error fetching packs:', err);
      }
    }

    setShowAssignModal(true);
  };

  const handleAssignProtocol = async () => {
    try {
      const template = getSelectedTemplate();
      const isInjection = template?.name?.toLowerCase().includes('injection');
      const isPeptide = template?.name?.toLowerCase().includes('peptide');
      const isWeightLoss = template?.name?.toLowerCase().includes('weight');
      const isHRT = isHRTTemplate();

      // For peptide vial templates, pass the vial duration
      const isVialTemplate = template?.name?.toLowerCase().includes('vial');
      const peptideDurationDays = (isPeptide && isVialTemplate && assignForm.vialDuration)
        ? parseInt(assignForm.vialDuration)
        : undefined;

      // Determine medication based on template type
      let finalMedication = null;
      if (isHRT) {
        finalMedication = getHRTMedication(assignForm.hrtGender);
      } else if (isInjection) {
        finalMedication = assignForm.injectionMedication;
      } else if (isPeptide) {
        finalMedication = assignForm.peptideId;
      } else if (isWeightLoss) {
        finalMedication = assignForm.medication;
      }

      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: isInjection ? assignForm.injectionDose : assignForm.selectedDose,
          medication: finalMedication,
          frequency: isHRT ? assignForm.frequency : assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          purchaseId: selectedNotification?.id,
          peptideDurationDays,
          deliveryMethod: (isWeightLoss || isHRT) ? assignForm.deliveryMethod : undefined,
          injectionDay: isWeightLoss ? assignForm.injectionDay : undefined,
          pickupFrequencyDays: isWeightLoss && assignForm.pickupFrequencyDays ? parseInt(assignForm.pickupFrequencyDays) : undefined,
          isWeightLoss: isWeightLoss || undefined,
          // HRT-specific fields
          hrtType: isHRT ? (assignForm.hrtGender === 'female' ? 'hrt_female' : 'hrt_male') : undefined,
          injectionMethod: isHRT ? assignForm.injectionMethod : undefined,
          dosePerInjection: isHRT && assignForm.selectedDose !== 'custom' ? assignForm.selectedDose : (isHRT ? assignForm.dosePerInjection : undefined),
          injectionsPerWeek: isHRT ? parseInt(assignForm.injectionsPerWeek || (assignForm.injectionMethod === 'subq' ? '7' : '2')) : undefined,
          supplyType: isHRT ? assignForm.supplyType : undefined,
          hrtInitialQuantity: isHRT && assignForm.supplyType ? (() => {
            const match = assignForm.supplyType.match(/(\d+)/);
            if (!match) return undefined;
            const perWeek = assignForm.injectionMethod === 'subq' ? 7 : 2;
            return parseInt(match[1]) * perWeek;
          })() : undefined,
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchPatient();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to assign protocol');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
    }
  };

  const handleAddToPack = async () => {
    if (!selectedPackId) return alert('Please select a pack');

    try {
      const res = await fetch(`/api/protocols/${selectedPackId}/add-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: selectedNotification?.id, sessionCount: 1 })
      });

      const data = await res.json();

      if (res.ok) {
        setShowAssignModal(false);
        fetchPatient();
        alert(data.message || 'Session added to pack');
      } else {
        alert(data.error || 'Failed to add session');
      }
    } catch (error) {
      console.error('Error adding to pack:', error);
    }
  };

  const handleLinkToProtocol = async () => {
    if (!selectedLinkProtocolId) return alert('Please select a protocol');
    if (!selectedNotification?.id) return alert('No purchase selected');

    try {
      const res = await fetch('/api/protocols/link-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: selectedLinkProtocolId,
          purchaseId: selectedNotification.id
        })
      });

      const data = await res.json();

      if (res.ok) {
        setShowAssignModal(false);
        fetchPatient();
        alert(data.message || 'Purchase linked to protocol');
      } else {
        alert(data.error || 'Failed to link purchase');
      }
    } catch (error) {
      console.error('Error linking purchase to protocol:', error);
    }
  };

  const handleDismissNotification = async (notificationId) => {
    try {
      await fetch(`/api/purchases/${notificationId}/dismiss`, { method: 'POST' });
      setPendingNotifications(pendingNotifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const openEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setEditPurchaseForm({
      product_name: purchase.product_name || purchase.item_name || '',
      amount_paid: purchase.amount_paid || purchase.amount || '',
      stripe_subscription_id: purchase.stripe_subscription_id || '',
      notes: purchase.notes || '',
    });
    setConfirmDeletePurchase(false);
    setShowEditPurchaseModal(true);
  };

  const handleEditPurchase = async () => {
    try {
      const amount = editPurchaseForm.amount_paid ? parseFloat(editPurchaseForm.amount_paid) : 0;
      const res = await fetch(`/api/purchases/${editingPurchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: editPurchaseForm.product_name || null,
          item_name: editPurchaseForm.product_name || null,
          amount_paid: amount,
          amount: amount,
          stripe_subscription_id: editPurchaseForm.stripe_subscription_id || null,
          notes: editPurchaseForm.notes || null,
        }),
      });
      if (res.ok) {
        setShowEditPurchaseModal(false);
        fetchPatient();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update purchase');
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
    }
  };

  const handleDeletePurchase = async () => {
    if (!editingPurchase?.id) return;
    setDeletingPurchase(true);
    try {
      const res = await fetch(`/api/purchases/${editingPurchase.id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowEditPurchaseModal(false);
        setConfirmDeletePurchase(false);
        fetchPatient();
      } else {
        alert('Failed to delete purchase');
      }
    } catch (err) {
      console.error('Error deleting purchase:', err);
    } finally {
      setDeletingPurchase(false);
    }
  };

  const openEditInjection = (log) => {
    setEditInjectionModal(log);
    setEditInjectionForm({
      entry_date: log.entry_date || '',
      dosage: log.dosage || '',
      weight: log.weight || '',
      quantity: log.quantity || 1,
      notes: log.notes || '',
      fulfillment_method: log.fulfillment_method || 'in_clinic',
      tracking_number: log.tracking_number || '',
    });
    setConfirmDeleteInjection(false);
  };

  const handleEditInjection = async () => {
    if (!editInjectionModal?.id) return;
    setEditInjectionSaving(true);
    try {
      const res = await fetch(`/api/service-log?id=${editInjectionModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: editInjectionModal.entry_type || 'injection',
          entry_date: editInjectionForm.entry_date,
          dosage: editInjectionForm.dosage,
          weight: editInjectionForm.weight || null,
          quantity: editInjectionForm.quantity ? parseInt(editInjectionForm.quantity) : null,
          medication: editInjectionModal.medication,
          notes: editInjectionForm.notes || null,
          fulfillment_method: editInjectionForm.fulfillment_method || null,
          tracking_number: editInjectionForm.fulfillment_method === 'overnight' ? (editInjectionForm.tracking_number || null) : null,
        }),
      });
      if (res.ok) {
        setEditInjectionModal(null);
        fetchPatient();
      }
    } catch (err) {
      console.error('Error updating injection:', err);
    } finally {
      setEditInjectionSaving(false);
    }
  };

  const handleDeleteInjection = async () => {
    if (!editInjectionModal?.id) return;
    setEditInjectionSaving(true);
    try {
      const res = await fetch(`/api/service-log?id=${editInjectionModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditInjectionModal(null);
        setConfirmDeleteInjection(false);
        fetchPatient();
      }
    } catch (err) {
      console.error('Error deleting injection:', err);
    } finally {
      setEditInjectionSaving(false);
    }
  };

  // Open Log Entry modal for a protocol (uses shared ServiceLogContent)
  // Force clean unmount/remount to avoid stale state preventing reopen
  const openLogEntryModal = (protocol, e) => {
    if (e) e.stopPropagation();
    setShowServiceLog(false);
    setTimeout(() => {
      setServiceLogKey(prev => prev + 1);
      setShowServiceLog(true);
    }, 0);
  };

  // After a log entry is saved, check if there are pending sessions to ship
  const handleLogComplete = (loggedItems) => {
    if (!loggedItems || loggedItems.length === 0) return;
    // Check if any logged item was a pickup (partial fulfillment)
    const pickupItems = loggedItems.filter(i => i.entryType === 'pickup' || i.entryType === 'med_pickup');
    if (pickupItems.length === 0) return;

    // Wait for data refresh, then check for remaining sessions
    setTimeout(() => {
      // Find the protocol for the pickup
      const allProtos = [...(activeProtocols || []), ...(completedProtocols || [])];
      for (const item of pickupItems) {
        const proto = item.protocolId
          ? allProtos.find(p => p.id === item.protocolId)
          : allProtos.find(p => p.category === item.serviceType && p.status === 'active');
        if (!proto || !proto.total_sessions) continue;

        // Count total dispensed from service logs
        const protoLogs = serviceLogs.filter(l => l.protocol_id === proto.id);
        const pickupLogs = protoLogs.filter(l => l.entry_type === 'pickup' || l.fulfillment_method === 'overnight');
        const inClinicLogs = protoLogs.filter(l => l.entry_type === 'injection' || (l.entry_type === 'session' && l.fulfillment_method !== 'overnight'));
        const totalDispensed = inClinicLogs.length + pickupLogs.reduce((sum, l) => sum + (l.quantity || 1), 0);
        const pending = Math.max(proto.total_sessions - totalDispensed, 0);

        if (pending > 0) {
          const patientName = patient?.first_name || patient?.name || 'Patient';
          const medication = item.medication || proto.medication || proto.program_name || '';
          // Default due date: 1 week from today
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const defaultDate = nextWeek.toISOString().split('T')[0];

          setShipmentReminderModal({ patientName, medication, pending, protocolId: proto.id });
          // Default assign to Damon Durante for shipment tasks
          const DAMON_ID = '8a62c77f-5c18-4b59-9e1e-70113ab4954e';
          setShipmentReminderForm({ dueDate: defaultDate, notes: '', assignedTo: DAMON_ID });
          break; // only show one prompt
        }
      }
    }, 1500); // wait for fetchPatient to complete
  };

  const handleCreateShipmentReminder = async () => {
    if (!shipmentReminderModal) return;
    setShipmentReminderSaving(true);
    try {
      const { patientName, medication, pending } = shipmentReminderModal;
      const title = `Ship ${pending} ${medication || 'injection'}${pending > 1 ? 's' : ''} to ${patientName}`;
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: shipmentReminderForm.notes || `${pending} injection${pending > 1 ? 's' : ''} still need to be shipped. Patient: ${patientName}.`,
          assigned_to: shipmentReminderForm.assignedTo || employee?.id,
          patient_id: patient?.id,
          patient_name: patientName,
          priority: 'high',
          due_date: shipmentReminderForm.dueDate || null,
        }),
      });
      if (res.ok) {
        setShipmentReminderModal(null);
      } else {
        const err = await res.json();
        alert('Failed to create reminder: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to create reminder: ' + err.message);
    }
    setShipmentReminderSaving(false);
  };

  // Quick weight log for missed WL sessions (patient called/texted weight)
  const openQuickWeightModal = (protocol, slotDate) => {
    setQuickWeightModal({ protocol, slotDate });
    setQuickWeightForm({ weight: '', dosage: protocol.selected_dose || '', notes: '' });
    setQuickWeightSaving(false);
  };

  const handleQuickWeightSave = async () => {
    if (!quickWeightModal) return;
    // Allow saving with just dose (no weight required for backfilling)
    if (!quickWeightForm.weight && !quickWeightForm.dosage) return;
    setQuickWeightSaving(true);
    try {
      const { protocol, slotDate } = quickWeightModal;
      // If dose is provided, treat as an injection entry; otherwise weight_check
      const hasWeight = !!quickWeightForm.weight;
      const hasDose = !!quickWeightForm.dosage;
      const entryType = hasDose ? 'injection' : 'weight_check';
      const res = await fetch('/api/service-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          category: 'weight_loss',
          entry_type: entryType,
          entry_date: slotDate,
          medication: protocol.medication || protocol.selected_medication || null,
          dosage: quickWeightForm.dosage || protocol.selected_dose || null,
          weight: hasWeight ? quickWeightForm.weight : null,
          notes: quickWeightForm.notes || null,
          protocol_id: protocol.id,
          force: true,
        }),
      });
      if (res.ok) {
        setQuickWeightModal(null);
        fetchPatient();
      }
    } catch (err) {
      console.error('Error saving quick weight:', err);
    } finally {
      setQuickWeightSaving(false);
    }
  };


  // Fetch drip email logs for a weight loss protocol
  const fetchDripLogs = async (protocolId) => {
    try {
      const res = await fetch(`/api/protocols/${protocolId}`);
      if (res.ok) {
        const data = await res.json();
        const logs = (data.activityLogs || []).filter(l => l.log_type === 'drip_email');
        setDripLogs(prev => ({ ...prev, [protocolId]: logs }));
      }
    } catch { /* ignore */ }
  };

  const handleSendWlLink = async (protocolId) => {
    setSendingWlLink(protocolId);
    try {
      const res = await fetch('/api/protocols/send-wl-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolId })
      });
      const data = await res.json();
      if (res.ok) {
        alert('WL page link sent successfully!');
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch {
      alert('Failed to send WL link');
    }
    setSendingWlLink(null);
  };

  // ─── Dispense from protocol card ───────────────────────────────────────────
  const openDispenseModal = (protocol) => {
    setDispensingProtocol(protocol);
    setDispenseDate(new Date().toISOString().split('T')[0]);
    const pt = (protocol.program_type || protocol.category || '').toLowerCase();
    if (pt.includes('weight_loss')) {
      setSelectedSupplyType('wl_1');
    } else if (pt === 'peptide') {
      const vialSupply = getPeptideVialSupply(protocol.medication || protocol.program_name || '');
      setSelectedSupplyType(vialSupply ? vialSupply.options[0].value : '');
    } else if (pt.includes('hrt')) {
      const currentSupply = (protocol.supply_type || '').toLowerCase();
      if (currentSupply.includes('vial')) {
        setSelectedSupplyType(currentSupply.includes('5') ? 'vial_5ml' : 'vial_10ml');
      } else if (currentSupply.startsWith('prefilled')) {
        setSelectedSupplyType(currentSupply);
      } else {
        setSelectedSupplyType('prefilled_2week');
      }
    } else {
      setSelectedSupplyType(protocol.supply_type || '');
    }
    setDispenseDosage(protocol.selected_dose || protocol.dosage || '');
    setCustomDoseMode(false);
    setCustomDoseValue('');
    setFulfillmentMethod('in_clinic');
    setTrackingNumber('');
    setDosingNotes('');
    setSplitDoseMode(false);
    setSplitDoses([]);
    setRefillOverride('');
    setDispenseResult(null);
  };

  const handleDispense = async () => {
    if (!dispensingProtocol || !dispenseDate) return;
    setDispensing(true);
    setDispenseResult(null);
    try {
      const currentInterval = refillOverride ? parseInt(refillOverride) : getIntervalForSupply(selectedSupplyType, dispensingProtocol);
      const res = await fetch('/api/admin/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: dispensingProtocol.id,
          patient_id: patient.id,
          patient_name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          dispense_date: dispenseDate,
          refill_interval_days: currentInterval,
          dosage_override: dispenseDosage !== (dispensingProtocol.selected_dose || dispensingProtocol.dosage) ? dispenseDosage : null,
          quantity: selectedSupplyType.startsWith('wl_') ? parseInt(selectedSupplyType.split('_')[1]) : 1,
          supply_type_override: selectedSupplyType !== dispensingProtocol.supply_type ? selectedSupplyType : null,
          fulfillment_method: fulfillmentMethod,
          tracking_number: fulfillmentMethod === 'overnight' ? trackingNumber : null,
          dosing_notes: dosingNotes || null,
        }),
      });
      if (res.status === 409) {
        setDispenseResult({ success: false, message: 'Already dispensed for this date' });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispense');
      setDispenseResult({
        success: true,
        message: `Dispensed — next refill ${formatShortDate(data.next_expected_date)} (+${data.interval_days}d)`,
      });
      setTimeout(() => {
        fetchPatient();
        setDispensingProtocol(null);
        setDispenseResult(null);
      }, 2000);
    } catch (err) {
      setDispenseResult({ success: false, message: err.message });
    } finally {
      setDispensing(false);
    }
  };

  const getDispenseActiveInterval = () => {
    if (!dispensingProtocol) return null;
    if (refillOverride) return parseInt(refillOverride);
    return getIntervalForSupply(selectedSupplyType, dispensingProtocol);
  };

  const dispensePreviewNextRefill = () => {
    if (!dispensingProtocol || !dispenseDate) return null;
    const interval = getDispenseActiveInterval();
    if (!interval) return null;
    const next = new Date(dispenseDate + 'T12:00:00');
    next.setDate(next.getDate() + interval);
    return next.toISOString().split('T')[0];
  };

  const openEditModal = (protocol) => {
    setSelectedProtocol(protocol);

    // Normalize delivery method (at_home → take_home for consistency)
    let deliveryMethod = protocol.delivery_method || '';
    if (deliveryMethod === 'at_home') deliveryMethod = 'take_home';

    // Normalize supply type (prefill_ → prefilled_ for consistency)
    let supplyType = protocol.supply_type || '';
    if (supplyType === 'prefill_2week') supplyType = 'prefilled_2week';
    if (supplyType === 'prefill_4week') supplyType = 'prefilled_4week';

    // For peptides, try to match medication to the full peptide name
    let medication = protocol.medication || '';
    if (protocol.category === 'peptide' && medication) {
      const matched = findMatchingPeptide(medication);
      if (matched) medication = matched;
    }

    setEditForm({
      medication: medication,
      selectedDose: protocol.selected_dose || '',
      frequency: protocol.frequency || '',
      startDate: protocol.start_date || '',
      endDate: protocol.end_date || '',
      status: protocol.status || 'active',
      notes: protocol.notes || '',
      sessionsUsed: protocol.sessions_used || 0,
      totalSessions: protocol.total_sessions || null,
      // Peptide vial fields
      numVials: protocol.num_vials || '',
      dosesPerVial: protocol.doses_per_vial || '',
      // HRT vial-specific fields
      dosePerInjection: protocol.dose_per_injection || '',
      injectionsPerWeek: protocol.injections_per_week || 2,
      vialSize: protocol.vial_size || '',
      supplyType: supplyType,
      lastRefillDate: protocol.last_refill_date || '',
      lastPaymentDate: protocol.last_payment_date || '',
      // HRT injection method
      injectionMethod: protocol.injection_method || '',
      // In-clinic scheduling fields
      deliveryMethod: deliveryMethod,
      visitFrequency: protocol.visit_frequency || '',
      scheduledDays: protocol.scheduled_days || [],
      lastVisitDate: protocol.last_visit_date || '',
      nextExpectedDate: protocol.next_expected_date || '',
      // Secondary medications + their dosage/frequency details
      secondaryMedications: protocol.secondary_medications
        ? (typeof protocol.secondary_medications === 'string'
          ? JSON.parse(protocol.secondary_medications)
          : protocol.secondary_medications)
        : [],
      secondaryMedDetails: (() => {
        const details = protocol.secondary_medication_details
          ? (typeof protocol.secondary_medication_details === 'string'
            ? JSON.parse(protocol.secondary_medication_details)
            : protocol.secondary_medication_details)
          : [];
        // Build a map: { HCG: { dosage: '500 IU', frequency: '2x/week' }, ... }
        const map = {};
        details.forEach(d => { map[d.medication] = { dosage: d.dosage || '', frequency: d.frequency || '' }; });
        return map;
      })()
    });
    setShowEditModal(true);
  };

  const handleEditProtocol = async () => {
    try {
      // Helper to convert empty strings to null for dates
      const dateOrNull = (val) => val && val.trim() !== '' ? val : null;

      // For HRT: auto-derive frequency from injections_per_week (single source of truth)
      let derivedFrequency = editForm.frequency || null;
      let derivedDosePerInjection = editForm.dosePerInjection ? parseFloat(editForm.dosePerInjection) : null;

      if (selectedProtocol.category === 'hrt') {
        const ipw = parseInt(editForm.injectionsPerWeek);
        if (ipw === 1) derivedFrequency = 'Weekly';
        else if (ipw === 2) derivedFrequency = '2x per week';
        else if (ipw === 3) derivedFrequency = '3x per week';
        else if (ipw === 7) derivedFrequency = 'Daily';

        // Auto-derive dose_per_injection from selected_dose (e.g., "0.4ml/80mg" → 0.4)
        if (editForm.selectedDose) {
          const mlMatch = editForm.selectedDose.match(/^(\d+\.?\d*)ml/i);
          if (mlMatch) derivedDosePerInjection = parseFloat(mlMatch[1]);
        }
      }

      // For peptide vials: auto-derive total_sessions and end_date from vials × doses + frequency
      let peptideTotalSessions = editForm.totalSessions ? parseInt(editForm.totalSessions) : null;
      let peptideEndDate = dateOrNull(editForm.endDate);
      if (selectedProtocol.category === 'peptide') {
        const isVial = editForm.supplyType === 'vial';
        const isPrefilled = (editForm.supplyType || '').startsWith('prefilled_');
        if (isVial && editForm.numVials && editForm.dosesPerVial) {
          peptideTotalSessions = parseInt(editForm.numVials) * parseInt(editForm.dosesPerVial);
        }
        // Auto-calc end date from frequency
        const freq = (derivedFrequency || '').toLowerCase();
        let dpw = null;
        if (freq.includes('5 on')) dpw = 5;
        else if (freq === 'daily' || freq.includes('1x daily')) dpw = 7;
        else if (freq === '2x daily') dpw = 14;
        else if (freq === 'every other day') dpw = 3.5;
        else if (freq === 'every 5 days') dpw = 1.4;
        else if (freq === '2x per week') dpw = 2;
        else if (freq === '3x per week') dpw = 3;
        else if (freq === 'weekly') dpw = 1;
        if (editForm.startDate && dpw) {
          let durationDays = null;
          if (isPrefilled) {
            durationDays = parseInt((editForm.supplyType || '').replace('prefilled_', '').replace('d', ''));
            if (!peptideTotalSessions) peptideTotalSessions = Math.round(durationDays * dpw / 7);
          } else if (peptideTotalSessions) {
            durationDays = Math.round((peptideTotalSessions / dpw) * 7);
          }
          if (durationDays) {
            const d = new Date(editForm.startDate + 'T12:00:00');
            d.setDate(d.getDate() + durationDays);
            peptideEndDate = d.toISOString().split('T')[0];
          }
        }
      }

      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication: editForm.medication || null,
          selected_dose: editForm.selectedDose || null,
          frequency: derivedFrequency,
          start_date: dateOrNull(editForm.startDate),
          end_date: peptideEndDate || dateOrNull(editForm.endDate),
          status: editForm.status,
          notes: editForm.notes || null,
          sessions_used: editForm.sessionsUsed,
          total_sessions: peptideTotalSessions,
          // Peptide vial fields
          num_vials: editForm.numVials ? parseInt(editForm.numVials) : null,
          doses_per_vial: editForm.dosesPerVial ? parseInt(editForm.dosesPerVial) : null,
          // HRT vial-specific fields (dose_per_injection auto-derived from selected_dose for HRT)
          dose_per_injection: derivedDosePerInjection,
          injections_per_week: editForm.injectionsPerWeek ? parseInt(editForm.injectionsPerWeek) : null,
          vial_size: editForm.vialSize ? parseFloat(editForm.vialSize) : null,
          supply_type: editForm.supplyType || null,
          last_refill_date: dateOrNull(editForm.lastRefillDate),
          last_payment_date: dateOrNull(editForm.lastPaymentDate),
          // HRT injection method
          injection_method: editForm.injectionMethod || null,
          // HRT secondary medications + dosage/frequency details
          secondary_medications: editForm.secondaryMedications && editForm.secondaryMedications.length > 0
            ? JSON.stringify(editForm.secondaryMedications) : '[]',
          secondary_medication_details: (() => {
            if (!editForm.secondaryMedications || editForm.secondaryMedications.length === 0) return '[]';
            // Merge form edits with existing supply tracking data (preserve pickup dates/vial counts)
            const existingDetails = selectedProtocol.secondary_medication_details
              ? (typeof selectedProtocol.secondary_medication_details === 'string'
                ? JSON.parse(selectedProtocol.secondary_medication_details)
                : selectedProtocol.secondary_medication_details)
              : [];
            const details = editForm.secondaryMedications.map(med => {
              const existing = existingDetails.find(d => d.medication === med) || {};
              const formInfo = editForm.secondaryMedDetails?.[med] || {};
              return {
                ...existing,
                medication: med,
                dosage: formInfo.dosage || existing.dosage || null,
                frequency: formInfo.frequency || existing.frequency || null,
              };
            });
            return JSON.stringify(details);
          })(),
          // Delivery & scheduling
          delivery_method: editForm.deliveryMethod || null,
          visit_frequency: editForm.visitFrequency || null,
          scheduled_days: editForm.scheduledDays?.length > 0 ? editForm.scheduledDays : null,
          last_visit_date: dateOrNull(editForm.lastVisitDate),
          next_expected_date: dateOrNull(editForm.nextExpectedDate)
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchPatient();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update protocol');
      }
    } catch (error) {
      console.error('Error updating protocol:', error);
    }
  };

  const handleDeleteProtocol = async (protocolId) => {
    if (!confirm('Are you sure you want to delete this protocol? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/protocols/${protocolId}`, { method: 'DELETE' });
      if (res.ok) {
        setShowEditModal(false);
        fetchPatient();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete protocol');
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
    }
  };

  // Redeem HRT Membership free Range IV perk — creates service log entry
  const handleRedeemRangeIV = async (hrtProtocolId) => {
    if (redeemingPerkId) return;
    setRedeemingPerkId(hrtProtocolId);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    try {
      const res = await fetch(`/api/protocols/${hrtProtocolId}/redeem-range-iv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_date: today })
      });
      if (res.ok) {
        fetchPatient();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to redeem perk'));
      }
    } catch (err) {
      alert('Error redeeming perk');
    } finally {
      setRedeemingPerkId(null);
    }
  };

  // Merge Protocol handler
  const handleMergeProtocol = async () => {
    if (!mergeSource || !mergeTarget) return;
    setMerging(true);
    setMergeError('');
    try {
      const res = await fetch('/api/protocols/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: mergeSource.id, targetId: mergeTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Merge failed');
      setShowMergeModal(false);
      setMergeSource(null);
      setMergeTarget(null);
      fetchPatient(); // reload all protocols
    } catch (err) {
      setMergeError(err.message);
    } finally {
      setMerging(false);
    }
  };

  // Lab handlers
  const handleAddLabs = async () => {
    try {
      const res = await fetch(`/api/patients/${id}/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labForm)
      });

      if (res.ok) {
        setShowLabsModal(false);
        fetchPatient();
      }
    } catch (error) {
      console.error('Error adding labs:', error);
    }
  };

  // Lab pipeline stage advancement
  const LAB_STAGES = [
    { id: 'awaiting_results', label: 'Awaiting Results', color: '#f59e0b', icon: '🩸' },
    { id: 'uploaded', label: 'Uploaded', color: '#8b5cf6', icon: '📋' },
    { id: 'under_review', label: 'Under Review', color: '#3b82f6', icon: '👨‍⚕️' },
    { id: 'ready_to_schedule', label: 'Ready to Schedule', color: '#f97316', icon: '📅' },
    { id: 'consult_scheduled', label: 'Consult Booked', color: '#6366f1', icon: '🗓️' },
    { id: 'in_treatment', label: 'In Treatment', color: '#10b981', icon: '✅' }
  ];

  const handleLabStageAdvance = async (protocolId, newStage) => {
    try {
      const res = await fetch('/api/admin/labs-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: protocolId, newStage })
      });
      if (res.ok) {
        fetchPatient();
      }
    } catch (err) {
      console.error('Error advancing lab stage:', err);
    }
  };

  // Send lab results link to patient via SMS
  const handleSendLabResults = async (labProtocol) => {
    // Find matching lab record by draw date + patient
    const drawDate = labProtocol.start_date;
    const matchedLab = labs.find(l => l.test_date === drawDate || l.completed_date === drawDate);
    if (!matchedLab) {
      alert('No lab results record found for this draw date. Make sure the results have been imported first.');
      return;
    }

    setSendingLabId(labProtocol.id);
    try {
      const res = await fetch('/api/labs/send-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab_id: matchedLab.id, patient_id: patient.id })
      });
      const data = await res.json();
      if (res.ok) {
        setSentLabIds(prev => ({ ...prev, [labProtocol.id]: true }));
        alert(`Lab results sent to ${data.sent_to}`);
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (err) {
      alert('Error sending results: ' + err.message);
    } finally {
      setSendingLabId(null);
    }
  };

  // Delete a lab pipeline entry (protocol with program_type = 'labs')
  const handleDeleteLabProtocol = async (protocolId) => {
    if (!confirm('Delete this lab order? This cannot be undone.')) return;
    setDeletingLabId(protocolId);
    try {
      const res = await fetch(`/api/admin/protocols/${protocolId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPatient();
      } else {
        alert('Failed to delete lab order.');
      }
    } catch (err) {
      alert('Error deleting lab order: ' + err.message);
    } finally {
      setDeletingLabId(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadForm({ ...uploadForm, file });
      setUploadError(null);
    } else {
      setUploadError('Please select a PDF file');
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadForm.file) return setUploadError('Please select a file');

    setUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadForm.file);
      });

      const res = await fetch(`/api/patients/${id}/upload-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: uploadForm.file.name,
          labType: uploadForm.labType,
          panelType: uploadForm.panelType,
          collectionDate: uploadForm.collectionDate,
          notes: uploadForm.notes
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      await fetchLabDocuments();
      setUploadForm({ file: null, labType: 'Baseline', panelType: 'Elite', collectionDate: new Date().toISOString().split('T')[0], notes: '' });
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return;

    try {
      const res = await fetch(`/api/patients/${id}/lab-documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      if (res.ok) setLabDocuments(labDocuments.filter(d => d.id !== documentId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // --- Document upload handlers (Docs tab) ---
  const handleDocFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.type)) {
      setDocUploadForm({ ...docUploadForm, file, documentName: docUploadForm.documentName || file.name.replace(/\.[^.]+$/, '') });
      setDocUploadError(null);
    } else {
      setDocUploadError('Please select a PDF, JPG, or PNG file');
    }
  };

  const handleDocUpload = async () => {
    if (!docUploadForm.file) return setDocUploadError('Please select a file');
    if (!docUploadForm.documentName.trim()) return setDocUploadError('Please enter a document name');

    setDocUploading(true);
    setDocUploadError(null);

    try {
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(docUploadForm.file);
      });

      const res = await fetch(`/api/patients/${id}/upload-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: docUploadForm.file.name,
          fileType: docUploadForm.file.type,
          documentName: docUploadForm.documentName.trim(),
          documentType: docUploadForm.documentType,
          notes: docUploadForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Refresh patient data to get new document with signed URL
      await fetchPatient();
      setDocUploadForm({ file: null, documentName: '', documentType: 'MRI Report', notes: '' });
      setShowDocUploadModal(false);
    } catch (err) {
      setDocUploadError(err.message);
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteMedicalDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`/api/medical-documents?id=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setMedicalDocuments(medicalDocuments.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Symptoms handlers
  const handleSendSymptoms = async () => {
    setSendingSymptoms(true);
    try {
      const res = await fetch('/api/symptoms/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, phone: patient?.phone, name: getPatientDisplayName() })
      });

      if (res.ok) {
        setSymptomsSent(true);
        setTimeout(() => { setShowSymptomsModal(false); setSymptomsSent(false); }, 2000);
      }
    } catch (error) {
      console.error('Error sending symptoms:', error);
    } finally {
      setSendingSymptoms(false);
    }
  };

  const copySymptomLink = () => {
    const link = `https://app.range-medical.com/symptom-questionnaire?patient=${id}&name=${encodeURIComponent(getPatientDisplayName())}`;
    navigator.clipboard.writeText(link);
    alert('Link copied!');
  };

  // Template helpers
  const getSelectedTemplate = () => {
    if (!assignForm.templateId) return null;
    for (const category of Object.values(templates.grouped || {})) {
      const found = category.find(t => t.id === assignForm.templateId);
      if (found) return found;
    }
    return null;
  };

  const getSelectedPeptide = () => peptides.find(p => p.id === assignForm.peptideId) || null;
  const isPeptideTemplate = () => getSelectedTemplate()?.name?.toLowerCase().includes('peptide');
  const isInjectionTemplate = () => getSelectedTemplate()?.name?.toLowerCase().includes('injection');
  const isWeightLossTemplate = () => getSelectedTemplate()?.name?.toLowerCase().includes('weight');
  const isHRTTemplate = () => {
    const name = getSelectedTemplate()?.name?.toLowerCase() || '';
    return name.includes('hrt') || name.includes('hormone') || name.includes('testosterone');
  };

  // Delete patient handler
  const handleDeletePatient = async () => {
    // First call: get preview (count of related records)
    if (!deletePreview) {
      try {
        const res = await fetch('/api/patients/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: id }),
        });
        const data = await res.json();
        if (data.preview) {
          setDeletePreview(data);
          setShowDeleteConfirm(true);
        }
      } catch (err) {
        alert('Error loading delete preview: ' + err.message);
      }
      return;
    }

    // Second call: confirmed delete
    setDeleting(true);
    try {
      const res = await fetch('/api/patients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: id, confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/patients');
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting patient: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Patient edit handlers
  const startEditingPatient = () => {
    setPatientEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      preferred_name: patient.preferred_name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zip_code: patient.zip_code || '',
      referral_source: patient.referral_source || intakeDemographics?.how_heard || '',
    });
    setEditingPatient(true);
  };

  const cancelEditingPatient = () => {
    setEditingPatient(false);
    setPatientEditForm({});
  };

  const savePatientEdits = async () => {
    setSavingPatient(true);
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientEditForm),
      });
      if (res.ok) {
        const { patient: updated } = await res.json();
        setPatient(updated);
        setEditingPatient(false);
      } else {
        console.error('Failed to save patient');
      }
    } catch (err) {
      console.error('Save patient error:', err);
    } finally {
      setSavingPatient(false);
    }
  };

  // ===== Condition tag management =====
  const CONDITION_TAG_OPTIONS = [
    { key: 'hypertension', label: 'High Blood Pressure' },
    { key: 'highCholesterol', label: 'High Cholesterol' },
    { key: 'heartDisease', label: 'Heart Disease' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'thyroid', label: 'Thyroid Disorder' },
    { key: 'depression', label: 'Depression/Anxiety' },
    { key: 'eatingDisorder', label: 'Eating Disorder' },
    { key: 'kidney', label: 'Kidney Disease' },
    { key: 'liver', label: 'Liver Disease' },
    { key: 'autoimmune', label: 'Autoimmune' },
    { key: 'cancer', label: 'Cancer' },
  ];

  const getPatientConditionTags = () => {
    return (patient?.tags || [])
      .filter(t => t && t.startsWith('condition:'))
      .map(t => t.replace('condition:', ''));
  };

  const toggleConditionTag = async (conditionKey) => {
    if (!patient) return;
    setSavingConditions(true);
    const existing = patient.tags || [];
    const tag = `condition:${conditionKey}`;
    const hasTag = existing.includes(tag);
    const newTags = hasTag
      ? existing.filter(t => t !== tag)
      : [...existing, tag];

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        const { patient: updated } = await res.json();
        setPatient(updated);
      }
    } catch (err) {
      console.error('Condition tag update error:', err);
    } finally {
      setSavingConditions(false);
    }
  };

  // ===== Notes handlers =====
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setNoteInput(prev => prev + finalTranscript);
      }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleDictation = () => {
    if (isRecording) stopDictation();
    else startDictation();
  };

  const handleFormatNote = async () => {
    if (!noteInput.trim()) return;
    setNoteFormatting(true);
    try {
      const res = await fetch('/api/notes/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: noteInput }),
      });
      const data = await res.json();
      if (data.formatted) {
        setNoteInput(data.formatted);
      } else if (data.error) {
        console.error('Format error:', data.error);
      }
    } catch (error) {
      console.error('Format error:', error);
    } finally {
      setNoteFormatting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id,
          raw_input: noteInput,
          body: noteInput,
          created_by: employee?.name || 'Staff',
          note_category: addNoteCategory,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes(prev => [data.note, ...prev]);
        setShowAddNoteModal(false);
        setNoteInput('');
        setNoteFormatted('');
        stopDictation();
      }
    } catch (error) {
      console.error('Save note error:', error);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleQuickNote = async () => {
    if (!quickNoteInput.trim()) return;
    setQuickNoteSaving(true);
    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id,
          raw_input: quickNoteInput,
          body: quickNoteInput,
          created_by: employee?.name || 'Staff',
          note_category: 'internal',
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes(prev => [data.note, ...prev]);
        setQuickNoteInput('');
      }
    } catch (error) {
      console.error('Quick note save error:', error);
    } finally {
      setQuickNoteSaving(false);
    }
  };

  const handleRefreshSynopsis = async () => {
    setAiSynopsisLoading(true);
    try {
      const res = await fetch('/api/patients/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: id, force: true }),
      });
      const data = await res.json();
      if (data.synopsis) setAiSynopsis(data.synopsis);
    } catch (error) {
      console.error('Synopsis refresh error:', error);
    } finally {
      setAiSynopsisLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesting_user: session?.user?.email || employee?.name || 'Staff' }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const handleTogglePin = async (noteId, currentlyPinned) => {
    const newPinned = !currentlyPinned;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: newPinned }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(prev => prev.map(n => ({
          ...n,
          pinned: n.id === noteId ? newPinned : false,
        })));
      }
    } catch (error) {
      console.error('Pin toggle error:', error);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !editNoteBody.trim()) return;
    setEditNoteSaving(true);
    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editNoteBody }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, body: editNoteBody } : n));
        setEditingNote(null);
        setEditNoteBody('');
      }
    } catch (error) {
      console.error('Edit note error:', error);
    } finally {
      setEditNoteSaving(false);
    }
  };

  // Loading states
  if (!router.isReady) return <div className="loading">Loading...</div>;
  if (loading) return <div className="loading">Loading patient...</div>;
  if (!patient) return <div className="error">Patient not found</div>;

  const ghlLink = getGhlLink();
  const latestLabs = labs?.[0];
  const latestLabDoc = labDocuments?.[0];
  const hasBaselineLabs = latestLabs || latestLabDoc;
  const baselineSymptoms = symptomResponses?.[0];

  // Helper to open PDF in slide-out viewer
  const openPdfViewer = (url, title = 'Document') => {
    setSlideoutWidth(70);
    setPdfSlideOut({ open: true, url, title });
  };

  const closePdfViewer = () => {
    setPdfSlideOut({ open: false, url: '', title: '', sendable: false, docName: '' });
  };

  // Open Protocol PDF modal — pre-select active peptide protocols
  const openProtocolPdfModal = () => {
    const peptideProtos = activeProtocols.filter(p => p.category === 'peptide');
    const selections = {};
    for (const p of peptideProtos) {
      selections[p.id] = {
        selected: true,
        medication: p.medication || p.program_name || '',
        dose: p.selected_dose || '',
        frequency: p.frequency || '5 on / 2 off',
        duration: p.end_date
          ? `${Math.ceil((new Date(p.end_date) - new Date(p.start_date)) / (1000 * 60 * 60 * 24 * 30))} months`
          : '3 months',
        route: 'SubQ',
        pricePerMonth: '',
        phases: [],
      };
    }
    setProtocolPdfSelections(selections);
    setProtocolPdfCombine(peptideProtos.length > 1);
    setProtocolPdfPlanDate(new Date().toISOString().split('T')[0]);
    setShowProtocolPdfModal(true);
  };

  // Generate Protocol PDF
  const handleGenerateProtocolPdf = async () => {
    const selected = Object.entries(protocolPdfSelections).filter(([, v]) => v.selected);
    if (selected.length === 0) return;
    setProtocolPdfGenerating(true);
    try {
      const protocols = selected.map(([, v]) => ({
        medication: v.medication,
        dose: v.dose,
        frequency: v.frequency,
        duration: v.duration,
        route: v.route,
        pricePerMonth: v.pricePerMonth || '',
        phases: v.phases || [],
      }));
      const res = await fetch('/api/protocols/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          protocols,
          combine: protocolPdfCombine,
          store: false,
          plan_date: protocolPdfPlanDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setShowProtocolPdfModal(false);
      openPdfViewer(url, selected.length > 1 ? 'Protocol Plan' : `${selected[0][1].medication} Protocol`);
    } catch (err) {
      console.error('Protocol PDF error:', err);
      alert('Failed to generate protocol PDF: ' + err.message);
    } finally {
      setProtocolPdfGenerating(false);
    }
  };

  // Save Protocol PDF to chart
  const handleSaveProtocolPdfToChart = async () => {
    const selected = Object.entries(protocolPdfSelections).filter(([, v]) => v.selected);
    if (selected.length === 0) return;
    setProtocolPdfSaving(true);
    try {
      const protocols = selected.map(([, v]) => ({
        medication: v.medication,
        dose: v.dose,
        frequency: v.frequency,
        duration: v.duration,
        route: v.route,
        pricePerMonth: v.pricePerMonth || '',
        phases: v.phases || [],
      }));
      const res = await fetch('/api/protocols/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          protocols,
          combine: protocolPdfCombine,
          store: true,
          plan_date: protocolPdfPlanDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to save PDF');
      const data = await res.json();
      alert('Protocol PDF saved to patient chart!');
      // Refresh documents
      if (typeof fetchDocuments === 'function') fetchDocuments();
    } catch (err) {
      console.error('Save protocol PDF error:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setProtocolPdfSaving(false);
    }
  };

  // Save Protocol PDF to chart, then preview before sending
  const handleSaveAndSendProtocolPdf = async () => {
    const selected = Object.entries(protocolPdfSelections).filter(([, v]) => v.selected);
    if (selected.length === 0) return;
    setProtocolPdfSaving(true);
    try {
      const protocols = selected.map(([, v]) => ({
        medication: v.medication,
        dose: v.dose,
        frequency: v.frequency,
        duration: v.duration,
        route: v.route,
        pricePerMonth: v.pricePerMonth || '',
        phases: v.phases || [],
      }));
      const res = await fetch('/api/protocols/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          protocols,
          combine: protocolPdfCombine,
          store: true,
          plan_date: protocolPdfPlanDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to save PDF');
      const data = await res.json();
      // Refresh documents
      if (typeof fetchDocuments === 'function') fetchDocuments();
      // Close PDF modal and open slide-out viewer with send button
      setShowProtocolPdfModal(false);
      const docName = data.document_name || (selected.length > 1 ? 'Protocol Plan' : `${selected[0][1].medication} Protocol`);
      setSlideoutWidth(70);
      setPdfSlideOut({ open: true, url: data.pdf_url, title: docName, sendable: true, docName });
    } catch (err) {
      console.error('Save & send protocol PDF error:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setProtocolPdfSaving(false);
    }
  };

  // Send a document to patient via email, SMS, or both
  const handleSendDocument = async () => {
    if (!sendDocModal.url || !sendDocModal.name) return;
    setSendDocLoading(true);
    setSendDocResult(null);
    const patientFullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const results = [];

    try {
      if (sendDocMethod === 'email' || sendDocMethod === 'both') {
        if (!patient.email) {
          results.push({ type: 'email', success: false, message: 'No email on file' });
        } else {
          const res = await fetch('/api/admin/send-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'email',
              documentUrl: sendDocModal.url,
              documentName: sendDocModal.name,
              patientEmail: patient.email,
              patientName: patientFullName,
              patientId: patient.id,
              ghlContactId: patient.ghl_contact_id || null,
            }),
          });
          const data = await res.json();
          results.push({ type: 'email', success: res.ok, message: data.message || data.error });
        }
      }

      if (sendDocMethod === 'sms' || sendDocMethod === 'both') {
        if (!patient.phone) {
          results.push({ type: 'sms', success: false, message: 'No phone on file' });
        } else {
          const res = await fetch('/api/admin/send-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'sms',
              documentUrl: sendDocModal.url,
              documentName: sendDocModal.name,
              patientPhone: patient.phone,
              patientName: patientFullName,
              patientId: patient.id,
              ghlContactId: patient.ghl_contact_id || null,
            }),
          });
          const data = await res.json();
          results.push({ type: 'sms', success: res.ok, message: data.message || data.error });
        }
      }

      setSendDocResult(results);
    } catch (err) {
      setSendDocResult([{ type: sendDocMethod, success: false, message: err.message }]);
    } finally {
      setSendDocLoading(false);
    }
  };

  // Chart capture: SVG -> Canvas -> PNG base64
  const captureChartAsBase64 = async (protocolId) => {
    const chartEl = document.getElementById(`wl-chart-${protocolId}`);
    if (!chartEl) return null;
    const svgElement = chartEl.querySelector('svg');
    if (!svgElement) return null;
    try {
      const clone = svgElement.cloneNode(true);
      const { width, height } = svgElement.getBoundingClientRect();
      clone.setAttribute('width', width);
      clone.setAttribute('height', height);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const svgString = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/png').split(',')[1]); };
        img.onerror = () => resolve(null);
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      });
    } catch (err) {
      console.error('Chart capture error:', err);
      return null;
    }
  };

  // Send Progress handler
  const handleSendProgress = async () => {
    if (!sendProgressProtocol || !patient) return;
    setSendingProgress(true);
    try {
      const chartBase64 = await captureChartAsBase64(sendProgressProtocol.id);
      const wlLogsAll = (allProtocolLogs || []).filter(l => l.protocol_id === sendProgressProtocol.id);
      // Build weight array using vitals fallback
      const wlWeights = wlLogsAll.map(l => {
        if (l.weight) return parseFloat(l.weight);
        // Fall back to vitals
        if (vitalsHistory && vitalsHistory.length > 0 && l.entry_date) {
          const target = new Date(l.entry_date + 'T12:00:00');
          let best = null, bestDist = Infinity;
          for (const v of vitalsHistory) {
            if (!v.weight_lbs) continue;
            const dist = Math.abs(target - new Date(v.recorded_at)) / (1000 * 60 * 60 * 24);
            if (dist < bestDist && dist <= 3) { bestDist = dist; best = v; }
          }
          return best ? parseFloat(best.weight_lbs) : null;
        }
        return null;
      }).filter(Boolean);
      const sWeight = wlWeights.length > 0 ? wlWeights[0] : null;
      const cWeight = wlWeights.length > 0 ? wlWeights[wlWeights.length - 1] : null;
      const tLoss = sWeight && cWeight ? (sWeight - cWeight).toFixed(1) : null;

      const res = await fetch('/api/protocols/send-progress', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          protocolId: sendProgressProtocol.id,
          method: sendProgressMethod,
          chartImage: chartBase64,
          stats: { startingWeight: sWeight, currentWeight: cWeight, totalLoss: tLoss, sessions: wlLogs.length }
        }),
      });
      const data = await res.json();
      setSendProgressResult({ success: data.success !== false, message: data.message || (data.success !== false ? 'Progress sent!' : 'Failed to send') });
    } catch (err) {
      setSendProgressResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setSendingProgress(false);
    }
  };

  return (
    <AdminLayout title="Patient Profile" hideHeader>
      <Head>
        <title>{getPatientDisplayName()} | Range Medical</title>
      </Head>

      <div className="patient-profile">
        {/* Header */}
        <header className="profile-header">
          <div className="header-top">
            <div className="header-left">
              <button onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/admin/patients');
                }
              }} className="back-btn"><span className="back-arrow">←</span><span className="back-text">Back</span></button>
              {/* Photo ID Badge */}
              {intakes.find(i => i.photo_id_url) ? (
                <button className="photo-id-badge" onClick={() => {
                  const photoIdUrl = intakes.find(i => i.photo_id_url)?.photo_id_url;
                  if (photoIdUrl) openPdfViewer(photoIdUrl, 'Photo ID');
                }} title="View Photo ID">
                  <span className="photo-id-icon">🪪</span>
                  <span className="photo-id-label">Photo ID</span>
                </button>
              ) : (
                <div className="photo-id-badge photo-id-empty">
                  <span className="photo-id-initials">{(patient?.first_name?.[0] || patient?.name?.[0] || '?').toUpperCase()}</span>
                </div>
              )}
              <div className="header-identity">
                <h1>{getPatientDisplayName()}</h1>
                <div className="contact-row">
                  {patient.email && <span>{patient.email}</span>}
                  {patient.phone && <span>{formatPhone(patient.phone)}</span>}
                  {patient.phone && blooioOptIn !== null && (
                    <span className="blooio-badge" style={{
                      backgroundColor: blooioOptIn ? '#dcfce7' : '#fef3c7',
                      color: blooioOptIn ? '#166534' : '#92400e',
                    }}>
                      {blooioOptIn ? 'Blooio: Active' : 'Blooio: Pending'}
                    </span>
                  )}
                  {savedCards.length > 0 && (
                    <span className="blooio-badge" style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      cursor: 'pointer',
                    }} onClick={() => { setActiveTab('payments'); setPaymentsSubTab('cards'); }}>
                      💳 {savedCards[0].brand.toUpperCase()} ····{savedCards[0].last4}
                    </span>
                  )}
                  {creditBalanceLoaded && creditBalanceCents > 0 && (
                    <span className="blooio-badge" style={{
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      cursor: 'pointer',
                    }} onClick={() => setShowAddCreditModal(true)} title="Account credit balance">
                      🎁 ${(creditBalanceCents / 100).toFixed(2)} credit
                    </span>
                  )}
                </div>
                {/* Active Protocol Last Activity Badges */}
                {activeProtocols.length > 0 && (
                  <div className="protocol-activity-row">
                    {getProtocolLastActivity().map(p => {
                      const daysSince = p.lastDate ? Math.floor((new Date() - p.lastDate) / (1000 * 60 * 60 * 24)) : null;
                      const dateStr = p.lastDate ? `${p.lastDate.getMonth() + 1}/${p.lastDate.getDate()}` : null;
                      // Build detail line: "Pickup — BPC-157 — 3/22" or "Injection — 3/20" or "No activity"
                      const detailParts = [];
                      if (p.lastType) detailParts.push(p.lastType);
                      if (p.lastMed) detailParts.push(p.lastMed);
                      if (dateStr) detailParts.push(dateStr);
                      const detailLine = detailParts.length > 0 ? detailParts.join(' \u2022 ') : 'No activity yet';
                      const timeAgo = p.lastDate
                        ? (daysSince === 0 ? 'today' : daysSince === 1 ? '1 day ago' : `${daysSince}d ago`)
                        : null;
                      return (
                        <span key={p.id} className="protocol-activity-badge" style={{
                          backgroundColor: p.catStyle.bg,
                          color: p.catStyle.text,
                          borderLeft: `3px solid ${p.catStyle.text}`,
                        }} onClick={() => setActiveTab('protocols')} title={p.lastDate ? `Last: ${p.lastType || 'Activity'} on ${p.lastDate.toLocaleDateString()}` : 'No injections or pickups logged yet'}>
                          <span className="protocol-activity-name">{p.name}</span>
                          <span className="protocol-activity-detail" style={{
                            color: !p.lastDate ? '#9ca3af' : daysSince > 14 ? '#dc2626' : p.catStyle.text,
                          }}>{detailLine}{timeAgo ? ` (${timeAgo})` : ''}</span>
                          {p.renewalTag && (
                            <span className="protocol-renewal-tag" style={{
                              backgroundColor: p.renewalTag.urgent ? '#fef2f2' : '#fffbeb',
                              color: p.renewalTag.urgent ? '#dc2626' : '#92400e',
                              border: `1px solid ${p.renewalTag.urgent ? '#fecaca' : '#fde68a'}`,
                            }}>{p.renewalTag.urgent ? '⚠' : '🔔'} {p.renewalTag.label}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Action Toolbar */}
          <div className="header-toolbar">
            <div className="toolbar-group">
              {patient.phone && <button onClick={() => setSmsModalOpen(true)} className="toolbar-btn" title="Send text message">💬 <span className="toolbar-label">SMS</span></button>}
              {patient.phone && <a href={`tel:${patient.phone}`} className="toolbar-btn" title="Call patient">📞 <span className="toolbar-label">Call</span></a>}
              {patient.email && <button onClick={() => setEmailModalOpen(true)} className="toolbar-btn" title="Send email">✉️ <span className="toolbar-label">Email</span></button>}
              <button onClick={() => { setShowSendFormsModal(true); setSendFormsSelected(new Set()); setSendGuidesSelected(new Set()); setSendFormsResult(null); setSendFormsTab('forms'); setSendGuidesCategory('all'); }} className="toolbar-btn" title="Send forms">📋 <span className="toolbar-label">Forms</span></button>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
<button onClick={() => setShowBookingModal(true)} className="toolbar-btn toolbar-btn-blue" title="Book appointment">📅 <span className="toolbar-label">Book</span></button>
              <button onClick={() => router.push(`/admin/checkout?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.name || `${patient.first_name} ${patient.last_name}`)}`)} className="toolbar-btn toolbar-btn-green" title="Checkout / Dispense / Charge">💳 <span className="toolbar-label">Checkout</span></button>
              <button onClick={() => setShowAddCreditModal(true)} className="toolbar-btn toolbar-btn-credit" title="Add account credit">🎁 <span className="toolbar-label">Credit</span></button>
              <button
                onClick={async () => {
                  setGeneratingChart(true);
                  try {
                    const res = await fetch(`/api/patients/${patient.id}/chart-pdf`);
                    if (!res.ok) throw new Error('Failed to generate chart');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch (err) {
                    console.error('Chart PDF error:', err);
                    alert('Failed to generate chart PDF');
                  } finally {
                    setGeneratingChart(false);
                  }
                }}
                disabled={generatingChart}
                className="toolbar-btn toolbar-btn-dark"
                title="Print full patient chart"
              >
                🖨️ <span className="toolbar-label">{generatingChart ? 'Generating...' : 'Print'}</span>
              </button>
              <button
                onClick={async () => {
                  if (!patient?.phone) { alert('No phone number on file for this patient.'); return; }
                  setReferralInviteSending(true);
                  try {
                    const firstName = patient.first_name || patient.name?.split(' ')[0] || '';
                    await fetch('/api/twilio/send-sms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patient_id: patient.id,
                        to: patient.phone,
                        message: `Hey ${firstName} — we set up a way for you to refer people to Range Medical. Tap the link below, enter your info, and you'll get your own personal referral link you can text to anyone:\n\nhttps://range-medical.com/refer/join\n\nTakes about 15 seconds. After that, we'll text you your link so you always have it.`,
                        message_type: 'referral_invite',
                      }),
                    });
                    setReferralInviteSent(true);
                    setTimeout(() => setReferralInviteSent(false), 3000);
                  } catch (err) {
                    console.error('Referral invite error:', err);
                    alert('Failed to send. Try again.');
                  }
                  setReferralInviteSending(false);
                }}
                disabled={referralInviteSending}
                className="toolbar-btn toolbar-btn-orange"
                title="Send referral invite text"
              >
                🤝 <span className="toolbar-label">{referralInviteSent ? '✓ Sent' : referralInviteSending ? 'Sending...' : 'Referral'}</span>
              </button>
            </div>
            {(() => {
              const encounterCount = (appointments || []).filter(a => new Date(a.start_time) < new Date() && (a.encounter_note_count || 0) > 0).length;
              return encounterCount > 0 ? (
                <>
                  <div className="toolbar-divider" />
                  <div className="toolbar-group">
                    <button onClick={() => setShowQuickView(true)} className="toolbar-btn toolbar-btn-purple" title="Quick view of encounters & protocols">
                      ⚡ <span className="toolbar-label">Quick View</span> <span className="toolbar-count">{encounterCount}</span>
                    </button>
                  </div>
                </>
              ) : null;
            })()}
            <div className="toolbar-divider" />
            <div className="toolbar-group" style={{ position: 'relative' }}>
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="toolbar-btn toolbar-btn-more" title="More actions">⋯</button>
              {showMoreMenu && (
                <>
                  <div className="toolbar-dropdown-overlay" onClick={() => setShowMoreMenu(false)} />
                  <div className="toolbar-dropdown">
                    {ghlLink && <a href={ghlLink} target="_blank" rel="noopener noreferrer" className="toolbar-dropdown-item" onClick={() => setShowMoreMenu(false)}>🔗 Open in GoHighLevel</a>}
                    <button className="toolbar-dropdown-item toolbar-dropdown-danger" onClick={() => { setShowMoreMenu(false); handleDeletePatient(); }}>🗑️ Delete Patient</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Demographics Toggle */}
          <div className="demographics-toggle-row">
            <button className="demographics-toggle" onClick={() => { if (editingPatient) return; setShowDemographics(!showDemographics); }}>
              <span className="demographics-preview">
                {(patient.date_of_birth || intakeDemographics?.date_of_birth) && <span>{formatDOB(patient.date_of_birth || intakeDemographics?.date_of_birth)}</span>}
                {(patient.gender || intakeDemographics?.gender) && <span>{patient.gender || intakeDemographics?.gender}</span>}
                {patient.phone && <span>{patient.phone}</span>}
                {patient.email && <span>{patient.email}</span>}
                {patient.created_at && <span>Since {formatDate(patient.created_at)}</span>}
              </span>
              <span className="demographics-toggle-icon">{showDemographics ? '▲ Hide Details' : '▼ Details'}</span>
            </button>
          </div>

          {/* Medical Alerts */}
          {(() => {
            // Pull medical data from the most recent intake
            const intake = intakes && intakes.length > 0 ? intakes[0] : null;

            // Resolve allergies from whichever field is populated
            let allergyText = null;
            let noKnownAllergies = false;
            if (intake) {
              noKnownAllergies = intake.has_allergies === false;
              if (!noKnownAllergies) {
                allergyText = (typeof intake.allergies === 'string' ? intake.allergies : null) ||
                  (intake.allergies && typeof intake.allergies === 'object' ? intake.allergies.text : null) ||
                  (intake.allergy_reactions ? `Allergies noted` : null) ||
                  null;
              }
            }

            // Medications
            const medsText = intake ? (intake.current_medications || intake.medication_notes || null) : null;

            // Medical conditions — from patient tags (condition:xxx)
            const conditionKeys = getPatientConditionTags();
            const conditionLabels = conditionKeys.map(k => {
              const opt = CONDITION_TAG_OPTIONS.find(o => o.key === k);
              return opt ? opt.label : k;
            });

            // HRT status
            const hrtText = intake && intake.on_hrt ? (intake.hrt_details || 'On HRT') : null;

            const hasAlerts = allergyText || medsText || conditionLabels.length > 0 || hrtText || noKnownAllergies;

            const chipStyle = {
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: 0, fontSize: '12px',
              fontWeight: 500, whiteSpace: 'nowrap', maxWidth: '100%',
              overflow: 'hidden', textOverflow: 'ellipsis',
            };

            return (
              <div style={{
                padding: '8px 16px 10px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
              }}>
                {allergyText && (
                  <span style={{ ...chipStyle, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: '13px' }}>⚠️</span>
                    <strong>Allergies:</strong> {allergyText}
                  </span>
                )}
                {noKnownAllergies && !allergyText && (
                  <span style={{ ...chipStyle, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '13px' }}>✓</span> No Known Allergies
                  </span>
                )}
                {medsText && (
                  <span style={{ ...chipStyle, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '13px' }}>💊</span>
                    <strong>Meds:</strong> {medsText}
                  </span>
                )}
                {conditionLabels.length > 0 && conditionLabels.map((label, i) => (
                  <span key={conditionKeys[i]} style={{ ...chipStyle, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {label}
                  </span>
                ))}
                {hrtText && (
                  <span style={{ ...chipStyle, background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
                    <span style={{ fontSize: '13px' }}>💉</span>
                    <strong>HRT:</strong> {hrtText}
                  </span>
                )}
                <button
                  onClick={() => setShowConditionModal(true)}
                  style={{
                    ...chipStyle, background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb',
                    cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  + Conditions
                </button>
              </div>
            );
          })()}

          {/* Condition Tag Modal */}
          {showConditionModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000,
            }}>
              <div style={{
                background: '#fff', borderRadius: 0, width: '400px', maxWidth: '95vw',
                padding: '20px', maxHeight: '80vh', overflow: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Medical Conditions</h3>
                  <button onClick={() => setShowConditionModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                  Toggle conditions for this patient. Changes save immediately.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CONDITION_TAG_OPTIONS.map(opt => {
                    const isActive = getPatientConditionTags().includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => toggleConditionTag(opt.key)}
                        disabled={savingConditions}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 0, fontSize: '14px',
                          border: isActive ? '2px solid #991b1b' : '1px solid #e5e7eb',
                          background: isActive ? '#fef2f2' : '#fff',
                          color: isActive ? '#991b1b' : '#374151',
                          cursor: 'pointer', fontWeight: isActive ? '600' : '400',
                          opacity: savingConditions ? 0.6 : 1,
                        }}
                      >
                        <span>{opt.label}</span>
                        {isActive && <span style={{ fontSize: '16px' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowConditionModal(false)}
                  style={{
                    marginTop: '16px', width: '100%', padding: '10px',
                    background: '#111', color: '#fff', border: 'none',
                    borderRadius: 0, fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Demographics */}
          {(showDemographics || editingPatient) && (
            <div className="demographics-section">
              <div className="demographics-header">
                {!editingPatient ? (
                  <button onClick={startEditingPatient} className="edit-demographics-btn">Edit</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={savePatientEdits} disabled={savingPatient} className="save-demographics-btn">{savingPatient ? 'Saving...' : 'Save'}</button>
                    <button onClick={cancelEditingPatient} className="cancel-demographics-btn">Cancel</button>
                  </div>
                )}
              </div>
              {!editingPatient ? (
                <div className="demographics-grid">
                  <div className="demo-item">
                    <label>Date of Birth</label>
                    {patient.date_of_birth ? (
                      <span>{formatDOB(patient.date_of_birth)}</span>
                    ) : intakeDemographics?.date_of_birth ? (
                      <span>{formatDOB(intakeDemographics.date_of_birth)} <span className="from-intake">(from intake)</span></span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="demo-item">
                    <label>Gender</label>
                    {patient.gender ? (
                      <span>{patient.gender}</span>
                    ) : intakeDemographics?.gender ? (
                      <span>{intakeDemographics.gender} <span className="from-intake">(from intake)</span></span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="demo-item">
                    <label>Preferred Name</label>
                    {patient.preferred_name ? (
                      <span>{patient.preferred_name}</span>
                    ) : intakeDemographics?.preferred_name ? (
                      <span>{intakeDemographics.preferred_name} <span className="from-intake">(from intake)</span></span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="demo-item">
                    <label>Referred By / How Heard</label>
                    {patient.referral_source ? (
                      <span>{patient.referral_source}</span>
                    ) : intakeDemographics?.how_heard ? (
                      <span>{intakeDemographics.how_heard} <span className="from-intake">(from intake)</span></span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="demo-item">
                    <label>Phone</label>
                    <span>{patient.phone ? formatPhone(patient.phone) : '—'}</span>
                  </div>
                  <div className="demo-item">
                    <label>Address</label>
                    <span>{patient.address || '—'}</span>
                  </div>
                  <div className="demo-item">
                    <label>City, State, Zip</label>
                    <span>{[patient.city, patient.state, patient.zip_code].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <div className="demo-item">
                    <label>Patient Since</label>
                    <span>{patient.created_at ? formatDate(patient.created_at) : '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="demographics-edit-grid">
                  <div className="edit-field">
                    <label>First Name</label>
                    <input type="text" value={patientEditForm.first_name} onChange={e => setPatientEditForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Last Name</label>
                    <input type="text" value={patientEditForm.last_name} onChange={e => setPatientEditForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Preferred Name</label>
                    <input type="text" value={patientEditForm.preferred_name} onChange={e => setPatientEditForm(f => ({ ...f, preferred_name: e.target.value }))} placeholder="What they like to be called" />
                  </div>
                  <div className="edit-field">
                    <label>Email</label>
                    <input type="email" value={patientEditForm.email} onChange={e => setPatientEditForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Phone</label>
                    <input type="tel" value={patientEditForm.phone} onChange={e => setPatientEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Date of Birth</label>
                    <input type="date" value={patientEditForm.date_of_birth} onChange={e => setPatientEditForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Gender</label>
                    <select value={patientEditForm.gender} onChange={e => setPatientEditForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="edit-field edit-field-full">
                    <label>Address</label>
                    <input type="text" value={patientEditForm.address} onChange={e => setPatientEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
                  </div>
                  <div className="edit-field">
                    <label>City</label>
                    <input type="text" value={patientEditForm.city} onChange={e => setPatientEditForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>State</label>
                    <input type="text" value={patientEditForm.state} onChange={e => setPatientEditForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div className="edit-field">
                    <label>Zip</label>
                    <input type="text" value={patientEditForm.zip_code} onChange={e => setPatientEditForm(f => ({ ...f, zip_code: e.target.value }))} />
                  </div>
                  <div className="edit-field edit-field-full">
                    <label>Referred By / How Heard</label>
                    <input type="text" value={patientEditForm.referral_source} onChange={e => setPatientEditForm(f => ({ ...f, referral_source: e.target.value }))} placeholder="e.g., Friend or Family Member: Jane Smith, Instagram" />
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Pinned Note */}
        {pinnedNote && (
          <section style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 0,
            padding: '12px 16px',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📌</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>
                  PINNED NOTE
                  <span style={{ fontWeight: 400, marginLeft: 8 }}>
                    {formatDate(pinnedNote.note_date || pinnedNote.created_at)}
                    {pinnedNote.created_by && ` · ${getStaffDisplayName(pinnedNote.created_by)}`}
                  </span>
                </div>
                <div ref={pinnedNoteCallbackRef} style={{
                  fontSize: 14,
                  color: '#374151',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  maxHeight: pinnedNoteExpanded ? 'none' : 80,
                  overflow: 'hidden',
                }}>
                  {pinnedNote.body}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => { setEditingNote(pinnedNote); setEditNoteBody(pinnedNote.body || ''); }}
                  style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: 13, padding: '2px 6px' }}
                  title="Edit note"
                >✏️</button>
                <button
                  onClick={() => handleTogglePin(pinnedNote.id, true)}
                  style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
                  title="Unpin note"
                >✕</button>
              </div>
            </div>
            {(pinnedNoteOverflows || pinnedNoteExpanded) && (
              <button
                onClick={() => setPinnedNoteExpanded(!pinnedNoteExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#92400e',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 0 0 26px',
                  display: 'block',
                }}
              >
                {pinnedNoteExpanded ? '▲ Show less' : '▼ Show more'}
              </button>
            )}
          </section>
        )}

        {/* Staff Notes Bar */}
        {!loading && patient && (
          <div className="staff-briefing-bar">
            {/* Staff Internal Notes */}
            <div className="briefing-section">
              <button
                className="briefing-header"
                onClick={() => setStaffNotesExpanded(!staffNotesExpanded)}
              >
                <span className="briefing-header-left">
                  <span style={{ fontSize: 15 }}>📝</span>
                  <span className="briefing-title">STAFF NOTES</span>
                  <span className="briefing-count">
                    {notes.filter(n => n.note_category === 'internal' || (!n.note_category && !['encounter', 'addendum', 'protocol'].includes(n.source))).length}
                  </span>
                </span>
                <span className="briefing-header-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddNoteCategory('internal'); setShowAddNoteModal(true); }}
                    className="briefing-add-btn"
                    title="Add staff note"
                  >+ Add Note</button>
                  <span className="briefing-chevron">{staffNotesExpanded ? '▲' : '▼'}</span>
                </span>
              </button>
              {staffNotesExpanded && (
                <div className="briefing-body">
                  {/* Quick note input */}
                  <div className="quick-note-row">
                    <input
                      type="text"
                      value={quickNoteInput}
                      onChange={e => setQuickNoteInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && quickNoteInput.trim()) handleQuickNote(); }}
                      placeholder="Quick note... (press Enter to save)"
                      className="quick-note-input"
                    />
                    <button
                      onClick={handleQuickNote}
                      disabled={!quickNoteInput.trim() || quickNoteSaving}
                      className="quick-note-save-btn"
                    >
                      {quickNoteSaving ? '...' : 'Save'}
                    </button>
                  </div>

                  {/* Recent internal notes */}
                  {(() => {
                    const internalNotes = notes.filter(n =>
                      n.note_category === 'internal' || (!n.note_category && !['encounter', 'addendum', 'protocol'].includes(n.source))
                    );
                    if (internalNotes.length === 0) {
                      return <div className="briefing-placeholder">No staff notes yet — add one above</div>;
                    }
                    return (
                      <div className="briefing-notes-list">
                        {internalNotes.slice(0, 5).map(note => (
                          <div
                            key={note.id}
                            className="briefing-note-item"
                            onClick={() => setExpandedNoteIds(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                            style={{ cursor: 'pointer' }}
                            title="Click to expand/collapse"
                          >
                            <div className="briefing-note-meta">
                              {formatDate(note.note_date || note.created_at)}
                              {note.created_by && ` · ${getStaffDisplayName(note.created_by)}`}
                              {note.pinned && <span className="briefing-note-pin">📌</span>}
                            </div>
                            <div className={expandedNoteIds[note.id] ? 'briefing-note-body briefing-note-body-expanded' : 'briefing-note-body'}>{note.body}</div>
                          </div>
                        ))}
                        {internalNotes.length > 5 && (
                          <button
                            onClick={() => { setActiveTab('notes'); setNoteFilter('internal'); }}
                            className="briefing-view-all"
                          >
                            View all {internalNotes.length} staff notes →
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient Synopsis Card */}
        {!loading && patient && (
          <section className="synopsis-card">
            {/* Blood Draw / HRT Status */}
            {(() => {
              const alerts = [];
              // Check all HRT protocols for blood draw status
              const allProtos = [...activeProtocols, ...completedProtocols];
              for (const proto of allProtos) {
                if (!isHRTProtocol(proto.program_type)) continue;
                const isActive = proto.status === 'active';
                const protoName = getProtocolDisplayName(proto);
                const schedule = hrtLabSchedules[proto.id];
                const summary = schedule?.length ? getLabStatusSummary(schedule) : null;
                if (summary?.nextDraw) {
                  const targetDate = new Date(summary.nextDraw.targetDate + 'T00:00:00');
                  const today = new Date(); today.setHours(0,0,0,0);
                  const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                  if (summary.nextDraw.status === 'overdue') {
                    alerts.push({ type: 'urgent', label: `Blood draw overdue: ${summary.nextDraw.label} for ${protoName} (was due ${summary.nextDraw.weekLabel})` });
                  } else if (daysUntil <= 14) {
                    alerts.push({ type: 'soon', label: `Blood draw coming up: ${summary.nextDraw.label} for ${protoName} — ${summary.nextDraw.weekLabel}` });
                  } else {
                    alerts.push({ type: 'scheduled', label: `Next blood draw: ${summary.nextDraw.label} — ${summary.nextDraw.weekLabel}` });
                  }
                  if (isActive && summary.completedCount > 0) {
                    alerts.push({ type: 'hrt', label: `${protoName} — ${summary.completedCount}/${summary.totalCount} draws complete` });
                  }
                } else if (isActive) {
                  // Active HRT but no schedule yet or all draws complete
                  const allComplete = summary?.completedCount === summary?.totalCount && summary?.totalCount > 0;
                  alerts.push({ type: 'hrt', label: `${protoName}${allComplete ? ' — all blood draws complete' : ''}` });
                }
              }
              // Check for labs with pending/awaiting status
              const pendingLabs = labs.filter(l => l.status === 'pending' || l.status === 'awaiting_results');
              if (pendingLabs.length > 0) {
                alerts.push({ type: 'pending', label: `${pendingLabs.length} lab result${pendingLabs.length > 1 ? 's' : ''} pending` });
              }
              if (alerts.length === 0) return null;
              return (
                <div className="synopsis-alerts">
                  {alerts.map((a, i) => (
                    <div key={i} className={`synopsis-alert ${
                      a.type === 'urgent' ? 'synopsis-alert-urgent' :
                      a.type === 'soon' ? 'synopsis-alert-soon' :
                      a.type === 'hrt' ? 'synopsis-alert-hrt' :
                      'synopsis-alert-info'
                    }`}
                      onClick={() => setActiveTab('labs')}>
                      <span className="synopsis-alert-icon">{
                        a.type === 'urgent' ? '🩸' :
                        a.type === 'soon' ? '🩸' :
                        a.type === 'hrt' ? '💉' :
                        a.type === 'scheduled' ? '📅' : '🧪'
                      }</span>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="synopsis-grid">
              {/* Active Protocols */}
              <div className="synopsis-section">
                <div className="synopsis-section-label">ACTIVE PROTOCOLS</div>
                {activeProtocols.length === 0 ? (
                  <div className="synopsis-empty">No active protocols</div>
                ) : (
                  <div className="synopsis-protocols">
                    {activeProtocols.map(proto => {
                      const cat = getCategoryStyle(proto.category);
                      const name = getProtocolDisplayName(proto);
                      const dose = proto.selected_dose || proto.current_dose || '';
                      const statusText = proto.status_text || '';
                      const daysLeft = proto.days_remaining;
                      const sessLeft = proto.sessions_remaining;
                      const totalSess = proto.total_sessions;
                      let supplyInfo = statusText;
                      if (!supplyInfo) {
                        if (daysLeft !== null && daysLeft !== undefined) {
                          supplyInfo = daysLeft <= 0 ? 'Refill overdue' : `${daysLeft}d until refill`;
                        } else if (sessLeft !== null && sessLeft !== undefined && totalSess > 0) {
                          supplyInfo = `${totalSess - sessLeft}/${totalSess} sessions`;
                        }
                      }
                      return (
                        <div key={proto.id} className="synopsis-protocol-row" onClick={() => setActiveTab('protocols')}>
                          <span className="synopsis-protocol-dot" style={{ background: cat.text }} />
                          <span className="synopsis-protocol-name">{name}</span>
                          {dose && <span className="synopsis-protocol-dose">{dose}</span>}
                          {supplyInfo && (
                            <span className="synopsis-protocol-supply" style={{
                              color: (daysLeft !== null && daysLeft <= 0) || (sessLeft !== null && sessLeft <= 0) ? '#dc2626' : '#6b7280'
                            }}>{supplyInfo}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Payments */}
              <div className="synopsis-section">
                <div className="synopsis-section-label">RECENT PAYMENTS</div>
                {allPurchases.length === 0 && subscriptions.length === 0 ? (
                  <div className="synopsis-empty">No payments on file</div>
                ) : (
                  <div className="synopsis-payments">
                    {/* Active subscriptions first */}
                    {subscriptions.filter(s => s.status === 'active').map(sub => (
                      <div key={sub.id} className="synopsis-payment-row" onClick={() => { setActiveTab('payments'); }}>
                        <span className="synopsis-payment-icon">🔄</span>
                        <span className="synopsis-payment-desc">{sub.description || 'Subscription'}</span>
                        <span className="synopsis-payment-amount">${((sub.amount_cents || 0) / 100).toFixed(0)}/{sub.interval || 'mo'}</span>
                        <span className="synopsis-payment-badge synopsis-payment-active">Active</span>
                      </div>
                    ))}
                    {/* Last 3 purchases */}
                    {allPurchases.slice(0, 3).map(p => {
                      const date = p.purchase_date || p.created_at;
                      const dateStr = date ? new Date(date + (date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                      const amount = p.amount_paid ? `$${Number(p.amount_paid).toFixed(0)}` : '';
                      const itemName = p.service_name || p.description || 'Payment';
                      return (
                        <div key={p.id} className="synopsis-payment-row" onClick={() => { setActiveTab('payments'); }}>
                          <span className="synopsis-payment-icon">💳</span>
                          <span className="synopsis-payment-desc">{itemName}</span>
                          {amount && <span className="synopsis-payment-amount">{amount}</span>}
                          <span className="synopsis-payment-date">{dateStr}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <nav className="px-tabs">
          {[
            { key: 'overview', label: 'Overview', icon: '📋' },
            { key: 'communications', label: 'Comms', icon: '💬', count: commsLog.filter(c => c.direction === 'inbound' && c.status !== 'read').length || 0 },
            { key: 'protocols', label: 'Protocols', icon: '💊', count: stats.activeCount || 0 },
            { key: 'medications', label: 'Medications', icon: '💉', count: (medications.length + prescriptions.length) || 0 },
            { key: 'labs', label: 'Labs', icon: '🔬' },
            { key: 'appointments', label: 'Visits', icon: '📅', count: (appointments.length + serviceLogs.length) || 0 },
            { key: 'timeline', label: 'Timeline', icon: '📊' },
            { key: 'notes', label: 'Notes', icon: '📝', count: notes.length || 0 },
            { key: 'intakes', label: 'Docs', icon: '📄', count: (intakes.length + consents.length + medicalDocuments.length + assessments.length) || 0 },
            { key: 'tasks', label: 'Tasks', icon: '✅', count: patientTasks.filter(t => t.status === 'pending').length || 0 },
            { key: 'symptoms', label: 'Assessments', icon: '📊', count: baselineQuestionnaires.length || 0 },
            { key: 'payments', label: 'Payments', icon: '💳' },
          ].map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'timeline' && timeline.length === 0) fetchTimeline();
              }}
            >
              <span className="px-tab-icon">{tab.icon}</span>
              <span className="px-tab-label">{tab.label}</span>
              {tab.count > 0 && <span className="px-tab-count">{tab.count}</span>}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Current Medications Snapshot */}
              {activeProtocols.filter(p => ['hrt', 'weight_loss', 'peptide'].includes(p.category)).length > 0 && (
                <section className="card" style={{ marginBottom: '16px' }}>
                  <div className="card-header">
                    <h3>Current Medications</h3>
                    <button onClick={() => setActiveTab('protocols')} className="btn-text">View Protocols →</button>
                  </div>
                  <div style={{ padding: '4px 16px 12px' }}>
                    {activeProtocols
                      .filter(p => ['hrt', 'weight_loss', 'peptide'].includes(p.category))
                      .map(protocol => {
                        const cat = getCategoryStyle(protocol.category);
                        // Build dose/frequency string
                        const parts = [];
                        if (protocol.selected_dose) parts.push(protocol.selected_dose);
                        if (protocol.category === 'hrt') {
                          if (protocol.injections_per_week) parts.push(`${protocol.injections_per_week}x/week`);
                          if (protocol.injection_method) parts.push(protocol.injection_method);
                        } else if (protocol.frequency) {
                          parts.push(protocol.frequency);
                        }
                        const deliveryLabel = protocol.delivery_method === 'in_clinic' ? 'In-Clinic' :
                          protocol.delivery_method === 'take_home' || protocol.delivery_method === 'at_home' ? 'Take-Home' :
                          protocol.delivery_method === 'overnight' ? 'Overnight' : null;
                        return (
                          <div key={protocol.id} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', marginBottom: '4px',
                            background: '#f8fafc', borderRadius: 0,
                            border: '1px solid #f1f5f9',
                          }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 0,
                              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                              background: cat.bg, color: cat.text, flexShrink: 0,
                            }}>
                              {cat.label}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                {getProtocolDisplayName(protocol)}
                              </span>
                              {parts.length > 0 && (
                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                                  {parts.join(' · ')}
                                </span>
                              )}
                            </div>
                            {deliveryLabel && (
                              <span style={{
                                fontSize: '10px', fontWeight: 600, color: '#64748b',
                                background: '#e2e8f0', padding: '2px 6px', borderRadius: 0,
                                flexShrink: 0,
                              }}>
                                {deliveryLabel}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

              {/* Active Subscriptions */}
              {subscriptions.length > 0 && (
                <section className="card" style={{ marginBottom: '16px' }}>
                  <div className="card-header">
                    <h3>Subscriptions</h3>
                  </div>
                  <div style={{ padding: '0 16px 16px' }}>
                    {subscriptions.filter(s => s.status === 'active' || s.status === 'past_due' || s.status === 'trialing').map(sub => (
                      <div key={sub.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', marginBottom: '8px',
                        background: '#f8fafc', borderRadius: 0,
                        border: sub.status === 'past_due' ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 0,
                            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            background: sub.service_category === 'hrt' ? '#dbeafe' :
                              sub.service_category === 'weight_loss' ? '#fef3c7' :
                              sub.service_category === 'rlt' ? '#fce7f3' :
                              sub.service_category === 'hbot' ? '#d1fae5' : '#e2e8f0',
                            color: sub.service_category === 'hrt' ? '#1e40af' :
                              sub.service_category === 'weight_loss' ? '#92400e' :
                              sub.service_category === 'rlt' ? '#9d174d' :
                              sub.service_category === 'hbot' ? '#065f46' : '#475569'
                          }}>
                            {sub.service_category || 'Subscription'}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{sub.description || 'Monthly Subscription'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Since {new Date(sub.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {sub.cancel_at_period_end && <span style={{ color: '#ef4444', marginLeft: '8px' }}>• Cancels at period end</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
                            ${(sub.amount_cents / 100).toFixed(0)}<span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>/{sub.interval}</span>
                          </div>
                          <div style={{
                            fontSize: '11px', fontWeight: 600, marginTop: '2px',
                            color: sub.status === 'active' ? '#16a34a' : sub.status === 'past_due' ? '#ef4444' : '#64748b'
                          }}>
                            {sub.status === 'active' ? '● Active' : sub.status === 'past_due' ? '● Past Due' : sub.status}
                          </div>
                          {sub.current_period_end && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                              Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {subscriptions.filter(s => s.status === 'canceled').length > 0 && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {subscriptions.filter(s => s.status === 'canceled').length} canceled subscription{subscriptions.filter(s => s.status === 'canceled').length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Energy & Recovery Balance */}
              <EnergyPackBalance patientId={patient?.id} />

              {/* Recent Messages Preview */}
              <section className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                  <h3>Recent Messages</h3>
                  <button onClick={() => setActiveTab('communications')} className="btn-text">View All →</button>
                </div>
                {commsLog.length === 0 ? (
                  <div className="empty" style={{ padding: '20px 16px', textAlign: 'center' }}>No messages yet</div>
                ) : (
                  <div style={{ padding: '0 16px 12px' }}>
                    {commsLog.slice(0, 5).map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => setActiveTab('communications')}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '10px 12px', marginBottom: '6px',
                          background: msg.direction === 'inbound' ? '#f0f9ff' : '#f8fafc',
                          borderRadius: 0, border: '1px solid #e2e8f0',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#eef2ff'}
                        onMouseOut={e => e.currentTarget.style.background = msg.direction === 'inbound' ? '#f0f9ff' : '#f8fafc'}
                      >
                        <span style={{ fontSize: '16px', marginTop: '2px', flexShrink: 0 }}>
                          {msg.channel === 'sms' ? '💬' : msg.channel === 'email' ? '📧' : msg.channel === 'call' ? '📞' : '💬'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{
                              fontSize: '12px', fontWeight: 600,
                              color: msg.direction === 'inbound' ? '#0369a1' : '#64748b',
                            }}>
                              {msg.direction === 'inbound' ? 'Patient' : 'Range Medical'}
                              {msg.channel === 'email' && msg.subject ? ` — ${msg.subject}` : ''}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                              {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {' '}
                              {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '13px', color: '#374151', lineHeight: '1.4',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {(msg.message || msg.subject || '(no content)').replace(/<[^>]*>/g, '').substring(0, 200)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Vitals Flowsheet + Weight Chart (Practice Fusion style) */}
              {vitalsHistory.length > 0 && (() => {
                const fmtHt = (inches) => {
                  if (!inches) return null;
                  const ft = Math.floor(inches / 12);
                  const inn = Math.round(inches % 12);
                  return `${ft}'${inn}"`;
                };
                const displayVitals = vitalsHistory.slice(0, vitalsDisplayCount).reverse();
                const vitalRows = [
                  { label: 'Height', key: 'height_inches', fmt: (v) => fmtHt(v) },
                  { label: 'Weight', key: 'weight_lbs', fmt: (v) => v ? `${v} lb` : null },
                  { label: 'BMI', key: 'bmi', fmt: (v) => v ? `${v}` : null },
                  { label: 'BP', key: 'bp_systolic', fmt: (v, row) => (row.bp_systolic && row.bp_diastolic) ? `${row.bp_systolic}/${row.bp_diastolic}` : null },
                  { label: 'Temperature', key: 'temperature', fmt: (v) => v ? `${v}°F` : null },
                  { label: 'Pulse', key: 'pulse', fmt: (v) => v ? `${v}` : null },
                  { label: 'Respiratory Rate', key: 'respiratory_rate', fmt: (v) => v ? `${v}` : null },
                  { label: 'O2 Saturation', key: 'o2_saturation', fmt: (v) => v ? `${v}%` : null },
                ];
                // Weight chart data (all history, chronological)
                const weightData = vitalsHistory
                  .filter(v => v.weight_lbs)
                  .map(v => ({
                    date: new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    weight: parseFloat(v.weight_lbs),
                    fullDate: new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  }))
                  .reverse();

                return (
                  <section className="card" style={{ marginBottom: '16px' }}>
                    <div className="card-header">
                      <h3>Vitals</h3>
                      <select
                        value={vitalsDisplayCount}
                        onChange={(e) => setVitalsDisplayCount(parseInt(e.target.value))}
                        style={{
                          fontSize: '12px', color: '#64748b', background: '#f8fafc',
                          border: '1px solid #e2e8f0', borderRadius: 0, padding: '4px 24px 4px 10px',
                          fontWeight: 500, cursor: 'pointer', appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                        }}
                      >
                        <option value={1}>Last encounter</option>
                        <option value={5}>Last 5 encounters</option>
                        <option value={10}>Last 10 encounters</option>
                      </select>
                    </div>

                    {/* PF-style Flowsheet: dates as columns, vitals as rows */}
                    <div style={{ overflowX: 'auto', padding: '0 0 8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: vitalsDisplayCount <= 1 ? '280px' : '500px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '11px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, minWidth: '120px' }}></th>
                            {displayVitals.map((v, i) => {
                              const d = new Date(v.recorded_at);
                              const isLatest = i === displayVitals.length - 1;
                              return (
                                <th key={v.id || i} style={{
                                  padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                                  color: isLatest ? '#1e40af' : '#64748b',
                                  borderBottom: isLatest ? '2px solid #3b82f6' : undefined,
                                  minWidth: '80px',
                                }}>
                                  <div>{d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</div>
                                  <div style={{ fontSize: '10px', fontWeight: 400, color: '#94a3b8', marginTop: '1px' }}>
                                    {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {vitalRows.map((vr, ri) => (
                            <tr key={vr.label} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fafbfc' : '#fff' }}>
                              <td style={{
                                padding: '7px 12px', fontWeight: 600, fontSize: '12px', color: '#475569',
                                position: 'sticky', left: 0, background: ri % 2 === 0 ? '#fafbfc' : '#fff', zIndex: 1,
                              }}>
                                {vr.label}
                              </td>
                              {displayVitals.map((v, ci) => {
                                const val = vr.fmt(v[vr.key], v);
                                const isLatest = ci === displayVitals.length - 1;
                                return (
                                  <td key={v.id || ci} style={{
                                    padding: '7px 10px', textAlign: 'center', fontSize: '13px',
                                    color: val ? (isLatest ? '#1e40af' : '#334155') : '#d4d4d8',
                                    fontWeight: val && isLatest ? 600 : 400,
                                  }}>
                                    {val || '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Weight Trend Chart */}
                    {weightData.length >= 2 && (
                      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Weight Trend
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={weightData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} unit=" lb" width={55} />
                            <Tooltip
                              contentStyle={{ fontSize: '13px', borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                              formatter={(value) => [`${value} lb`, 'Weight']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                            />
                            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* Active Protocols Summary */}
              <section className="card">
                <div className="card-header">
                  <h3>Active Protocols</h3>
                  <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add</button>
                </div>

                {/* Recovery Peptide Cycle Tracker — uses actual protocol duration as source of truth */}
                {cycleInfo?.hasCycle && (() => {
                  const planned = cycleInfo.maxDays;
                  const used = cycleInfo.cycleDaysUsed;
                  const remaining = Math.max(0, planned - used);
                  const approachingMax = used > 60;
                  const isWarning = remaining <= 5 && remaining > 0;
                  const isComplete = remaining === 0 || cycleInfo.cycleExhausted;
                  return (
                  <div style={{
                    margin: '0 16px 12px',
                    padding: '12px 16px',
                    borderRadius: 0,
                    background: isComplete ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${isComplete ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>
                        Recovery Peptide Cycle
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: isComplete ? '#dc2626' : isWarning ? '#d97706' : '#16a34a'
                      }}>
                        {used} / {planned} days
                      </span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 0, height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 0,
                        width: `${Math.min(100, planned > 0 ? Math.round((used / planned) * 100) : 0)}%`,
                        background: isComplete ? '#dc2626' : isWarning ? '#f59e0b' : '#22c55e',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      {cycleInfo.cycleExhausted ? (
                        <span style={{ color: '#dc2626', fontWeight: '600' }}>
                          Cycle complete — 2-week off period recommended
                          {cycleInfo.offPeriodEnds && ` (ends ${new Date(cycleInfo.offPeriodEnds + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                        </span>
                      ) : (
                        <span><strong>{remaining}</strong> days remaining on protocol</span>
                      )}
                    </div>
                    {approachingMax && !cycleInfo.cycleExhausted && (
                      <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>
                        ⚠️ {cycleInfo.cycleDaysRemaining} of {cycleInfo.maxDays}-day max cycle remaining — mandatory off period after
                      </div>
                    )}
                    {cycleInfo.subProtocols?.length > 1 && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                        {cycleInfo.subProtocols.length} protocols in this cycle
                      </div>
                    )}
                  </div>
                  );
                })()}

                {activeProtocols.length === 0 ? (
                  <div className="empty">No active protocols</div>
                ) : (
                  <div className="protocol-list">
                    {activeProtocols.slice(0, 5).map(protocol => {
                      const cat = getCategoryStyle(protocol.category);
                      return (
                        <div key={protocol.id} className="protocol-row">
                          <div className="protocol-main">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">
                              {getProtocolDisplayName(protocol)}
                              {protocol.category === 'hrt' && protocol.hrt_type && (
                                <span style={{ fontSize: 12, color: '#7C3AED', marginLeft: 4 }}>({protocol.hrt_type === 'female' ? 'F' : 'M'})</span>
                              )}
                            </span>
                            {protocol.selected_dose && <span className="protocol-dose">{protocol.selected_dose}</span>}
                          </div>
                          <div className="protocol-status">
                            <span className="status-text">{protocol.status_text}</span>
                            {protocol.status === 'active' && (
                              <button
                                onClick={(e) => openLogEntryModal(protocol, e)}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 0, padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >+ Log</button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(protocol); }} className="btn-text">Edit</button>
                          </div>
                        </div>
                      );
                    })}
                    {activeProtocols.length > 5 && (
                      <button onClick={() => setActiveTab('protocols')} className="view-all">View all {activeProtocols.length} protocols →</button>
                    )}
                  </div>
                )}
              </section>

              {/* Lab Pipeline Status — compact banner */}
              {labProtocols.filter(lp => lp.status !== 'consult_complete').length > 0 && (() => {
                const activeLab = labProtocols.find(lp => lp.status !== 'consult_complete');
                const stage = LAB_STAGES.find(s => s.id === activeLab.status) || LAB_STAGES[0];
                const panelType = activeLab.medication || 'Essential';
                const drawDateObj = activeLab.start_date ? new Date(activeLab.start_date + 'T12:00:00') : null;
                const drawDate = drawDateObj ? drawDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(drawDateObj.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '';
                return (
                  <div
                    onClick={() => setActiveTab('labs')}
                    style={{
                      margin: '0 0 12px', padding: '12px 16px', borderRadius: 0, cursor: 'pointer',
                      background: `${stage.color}15`, border: `1px solid ${stage.color}40`,
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🧪</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Labs:</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: 0,
                      backgroundColor: stage.color, color: '#fff',
                      fontSize: '11px', fontWeight: '600'
                    }}>
                      {stage.icon} {stage.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{activeLab.program_name || panelType}</span>
                    {drawDate && <span style={{ fontSize: '12px', color: '#6b7280' }}>• Draw: {drawDate}</span>}
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>View →</span>
                  </div>
                );
              })()}

              {/* HRT Blood Draw Schedule — Overview (show only the most recent active HRT protocol) */}
              {Object.keys(hrtLabSchedules).length > 0 && (() => {
                // Pick the most recent active HRT protocol (prefer active over completed)
                const hrtProtos = [...activeProtocols, ...completedProtocols].filter(
                  p => isHRTProtocol(p.program_type) && hrtLabSchedules[p.id]?.length > 0
                );
                if (hrtProtos.length === 0) return null;
                // Sort: active first, then by most recent start_date
                hrtProtos.sort((a, b) => {
                  if (a.status === 'active' && b.status !== 'active') return -1;
                  if (b.status === 'active' && a.status !== 'active') return 1;
                  return new Date(b.start_date || 0) - new Date(a.start_date || 0);
                });
                const protocol = hrtProtos[0];
                const schedule = hrtLabSchedules[protocol.id];
                const completedCount = schedule.filter(d => d.status === 'completed').length;
                const total = schedule.length;
                const nextDraw = schedule.find(d => d.status === 'overdue' || d.status === 'upcoming');
                const currentFollowup = protocol.first_followup_weeks || 8;
                return (
                  <section className="card">
                    <div className="card-header">
                      <h3>🩸 Blood Draw Schedule</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>1st follow-up:</span>
                        <button
                          onClick={() => handleToggleFollowupWeeks(protocol.id)}
                          style={{
                            fontSize: '12px', fontWeight: 600, padding: '3px 10px',
                            borderRadius: 0, cursor: 'pointer',
                            border: '1px solid #d1d5db', background: '#fff', color: '#374151'
                          }}
                        >
                          {currentFollowup} wks ⇄
                        </button>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{completedCount} of {total} complete</span>
                      </div>
                    </div>
                    {nextDraw && (
                      <div style={{ padding: '0 16px 8px', fontSize: '13px', color: nextDraw.status === 'overdue' ? '#dc2626' : '#6b7280', fontWeight: nextDraw.status === 'overdue' ? 600 : 400 }}>
                        {nextDraw.status === 'overdue' ? '⚠️ Overdue: ' : 'Next: '}{nextDraw.label} — {nextDraw.weekLabel}
                      </div>
                    )}
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {schedule.map(draw => {
                        const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : draw.status === 'skipped' ? '#d1d5db' : '#9ca3af';
                        return (
                          <div
                            key={draw.label}
                            onClick={() => handleBloodDrawClick(draw, protocol.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
                              cursor: 'pointer', padding: '6px 8px', borderRadius: 0, transition: 'background 0.15s',
                              opacity: draw.status === 'skipped' ? 0.5 : 1
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{
                              width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0,
                              border: draw.status === 'completed' ? 'none' : `2px solid ${color}`,
                              boxSizing: 'border-box'
                            }} />
                            <span style={{ fontWeight: '500', color: draw.status === 'skipped' ? '#9ca3af' : '#374151', minWidth: '110px' }}>{draw.label}</span>
                            <span style={{ color: '#6b7280', flex: 1 }}>{draw.weekLabel}</span>
                            {draw.completedDate && (
                              <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 500 }}>✓ {formatShortDate(draw.completedDate)}</span>
                            )}
                            {draw.status === 'overdue' && !draw.completedDate && (
                              <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 500 }}>Overdue</span>
                            )}
                            {draw.status === 'skipped' && !draw.completedDate && (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>Skipped</span>
                            )}
                            {draw.status === 'upcoming' && !draw.completedDate && (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>Upcoming</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* Recent Documents (Intakes + Consents) */}
              {(intakes.length > 0 || consents.length > 0) && (
                <section className="card">
                  <div className="card-header">
                    <h3>Recent Documents</h3>
                    <button onClick={() => setActiveTab('intakes')} className="btn-text">View All →</button>
                  </div>
                  <div className="intake-list">
                    {consents.slice(0, 2).map(consent => (
                      <div key={consent.id} className="intake-row">
                        <span className="intake-icon">
                          {consent.consent_type === 'hipaa' ? '🔒' :
                           consent.consent_type === 'hrt' ? '💉' :
                           consent.consent_type === 'peptide' ? '🧬' : '📝'}
                        </span>
                        <div className="intake-info">
                          <strong>{consent.consent_type ? consent.consent_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/Hipaa/g, 'HIPAA') : 'Consent'}</strong>
                          <span>{formatDate(consent.submitted_at)} {consent.consent_given ? '• Signed' : '• Pending'}</span>
                        </div>
                        {consent.pdf_url && <button className="btn-text" onClick={e => { e.stopPropagation(); openPdfViewer(consent.pdf_url, `${consent.consent_type || 'Consent'} Form`); }}>View</button>}
                      </div>
                    ))}
                    {intakes.slice(0, 2).map(intake => (
                      <div key={intake.id} className="intake-row" onClick={() => { setSelectedIntake(intake); setShowIntakeModal(true); }}>
                        <span className="intake-icon">📋</span>
                        <div className="intake-info">
                          <strong>Medical Intake</strong>
                          <span>{formatDate(intake.submitted_at)}</span>
                        </div>
                        <span className="intake-arrow">→</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <>
              {/* Active Medications */}
              <section className="card">
                <div className="card-header">
                  <h3>Active Medications ({medications.filter(m => m.is_active).length})</h3>
                </div>
                {medications.filter(m => m.is_active).length === 0 ? (
                  <div className="empty">No active medications</div>
                ) : (
                  <div style={{ padding: '0 16px 12px' }}>
                    {medications.filter(m => m.is_active).map(med => (
                      <div key={med.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '12px 14px', marginBottom: '8px',
                        background: '#f8fafc', borderRadius: 0, border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                            {med.medication_name || med.trade_name || med.generic_name}
                          </div>
                          {med.strength && (
                            <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{med.strength}{med.form ? ` · ${med.form}` : ''}</div>
                          )}
                          {med.sig && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>Sig: {med.sig}</div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {med.start_date && (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Started {new Date(med.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {med.source && (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Source: {med.source}</span>
                            )}
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 0, fontSize: '11px', fontWeight: 600,
                          background: '#dcfce7', color: '#166534', whiteSpace: 'nowrap',
                        }}>Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Prescriptions */}
              <section className="card">
                <div className="card-header">
                  <h3>Prescriptions ({prescriptions.length})</h3>
                </div>
                {prescriptions.length === 0 ? (
                  <div className="empty">No prescriptions on file</div>
                ) : (
                  <div style={{ padding: '0 16px 12px' }}>
                    {prescriptions.map(rx => (
                      <div key={rx.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '12px 14px', marginBottom: '8px',
                        background: '#f8fafc', borderRadius: 0, border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                            {rx.medication_name}
                            {rx.strength && <span style={{ fontWeight: 400, color: '#475569' }}> {rx.strength}</span>}
                          </div>
                          {rx.sig && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>Sig: {rx.sig}</div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {rx.quantity && <span style={{ fontSize: '11px', color: '#64748b' }}>Qty: {rx.quantity}</span>}
                            {rx.refills > 0 && <span style={{ fontSize: '11px', color: '#64748b' }}>Refills: {rx.refills}</span>}
                            {rx.days_supply && <span style={{ fontSize: '11px', color: '#64748b' }}>{rx.days_supply}-day supply</span>}
                            {rx.created_by && <span style={{ fontSize: '11px', color: '#94a3b8' }}>by {rx.created_by.split('@')[0]}</span>}
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {new Date(rx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          {rx.is_controlled && (
                            <div style={{ marginTop: '6px', padding: '3px 8px', display: 'inline-block', borderRadius: 0, background: '#fef2f2', border: '1px solid #fecaca', fontSize: '11px', fontWeight: 600, color: '#dc2626' }}>
                              ⚠ Controlled{rx.schedule ? ` (${rx.schedule})` : ''}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 0, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                          background: rx.status === 'signed' ? '#dcfce7' : rx.status === 'sent' ? '#dbeafe' : '#f3f4f6',
                          color: rx.status === 'signed' ? '#166534' : rx.status === 'sent' ? '#1e40af' : '#6b7280',
                        }}>{rx.status || 'draft'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Discontinued Medications */}
              {medications.filter(m => !m.is_active).length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h3 style={{ color: '#94a3b8' }}>Discontinued ({medications.filter(m => !m.is_active).length})</h3>
                  </div>
                  <div style={{ padding: '0 16px 12px' }}>
                    {medications.filter(m => !m.is_active).map(med => (
                      <div key={med.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '10px 14px', marginBottom: '6px',
                        background: '#fafafa', borderRadius: 0, border: '1px solid #f1f5f9', opacity: 0.7,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', textDecoration: 'line-through' }}>
                            {med.medication_name || med.trade_name || med.generic_name}
                            {med.strength && <span> {med.strength}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {med.stop_date && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Stopped {new Date(med.stop_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                            {med.discontinued_reason && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{med.discontinued_reason}</span>}
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 0, fontSize: '11px', fontWeight: 600, background: '#f3f4f6', color: '#94a3b8', whiteSpace: 'nowrap' }}>Discontinued</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Protocols Tab */}
          {activeTab === 'protocols' && (
            <>
              <section className="card">
                <div className="card-header">
                  <h3>Protocols ({activeProtocols.length + completedProtocols.filter(p => p.status !== 'merged').length})</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeProtocols.some(p => p.category === 'peptide') && (
                      <button onClick={openProtocolPdfModal} style={{
                        padding: '6px 14px', fontSize: 12, fontWeight: 600,
                        background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0',
                        borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        📄 Generate PDF
                      </button>
                    )}
                    <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add Protocol</button>
                  </div>
                </div>
                {/* Free Range IV perk banner — shown when HRT patient has an unused IV this billing cycle */}
                {hrtRangeIVStatus && !hrtRangeIVStatus.used && (
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac', borderRadius: 0, padding: '14px 18px', margin: '0 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>💧</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>Free Range IV Ready</div>
                        <div style={{ fontSize: 12, color: '#15803d' }}>HRT Membership Perk — redeemable this month</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeemRangeIV(hrtRangeIVStatus.protocolId)}
                      disabled={redeemingPerkId === hrtRangeIVStatus.protocolId}
                      style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', opacity: redeemingPerkId === hrtRangeIVStatus.protocolId ? 0.6 : 1 }}
                    >
                      {redeemingPerkId === hrtRangeIVStatus.protocolId ? 'Redeeming...' : '✓ Use Today'}
                    </button>
                  </div>
                )}

                {activeProtocols.length === 0 && completedProtocols.filter(p => p.status !== 'merged').length === 0 ? (
                  <div className="empty">No protocols</div>
                ) : (
                  <div className="protocol-list">
                    {[...activeProtocols, ...completedProtocols].filter(p => p.status !== 'merged').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(protocol => {
                      const cat = getCategoryStyle(protocol.category);
                      const isExpanded = expandedProtocols[protocol.id];
                      const isWeightLoss = protocol.category === 'weight_loss';
                      // Separate injection check-ins from medication deliveries/pickups
                      const allWlLogs = isWeightLoss
                        ? weightLossLogs
                            .filter(l => l.protocol_id === protocol.id || (!l.protocol_id && l.category === 'weight_loss'))
                            .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
                        : [];
                      // Injection schedule only shows actual injections (self-reported check-ins or in-clinic)
                      const wlLogs = allWlLogs.filter(l => l.entry_type !== 'pickup');
                      // Delivery logs = pickups & shipments (fulfillment events)
                      const wlDeliveryLogs = allWlLogs.filter(l => l.entry_type === 'pickup');
                      // Helper: find nearest vitals weight for a date (within ±3 days)
                      const findVitalsWeight = (dateStr) => {
                        if (!vitalsHistory || vitalsHistory.length === 0 || !dateStr) return null;
                        const target = new Date(dateStr + 'T12:00:00');
                        let best = null;
                        let bestDist = Infinity;
                        for (const v of vitalsHistory) {
                          if (!v.weight_lbs) continue;
                          const vDate = new Date(v.recorded_at);
                          const dist = Math.abs(target - vDate) / (1000 * 60 * 60 * 24);
                          if (dist < bestDist && dist <= 3) {
                            bestDist = dist;
                            best = v;
                          }
                        }
                        return best ? parseFloat(best.weight_lbs) : null;
                      };
                      // Build chart data: use service_log weight first, fall back to vitals
                      const chartData = wlLogs
                        .map(l => {
                          const logWeight = l.weight ? parseFloat(l.weight) : null;
                          const vitalsWeight = !logWeight ? findVitalsWeight(l.entry_date) : null;
                          const weight = logWeight || vitalsWeight;
                          if (!weight) return null;
                          return {
                            date: new Date(l.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            weight,
                            dose: l.dosage || '',
                            fromVitals: !logWeight && !!vitalsWeight,
                          };
                        })
                        .filter(Boolean);
                      const startingWeight = chartData.length > 0 ? chartData[0].weight : null;
                      const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;
                      const totalLoss = startingWeight && currentWeight ? (startingWeight - currentWeight).toFixed(1) : null;
                      // Parse dose: prefer protocol selected_dose, otherwise extract from dosage like "4 week supply @ 2mg" → "2mg"
                      const parseDose = (dosageStr) => {
                        if (!dosageStr) return null;
                        const atMatch = dosageStr.match(/@\s*(.+)/);
                        if (atMatch) return atMatch[1].trim();
                        return dosageStr;
                      };
                      // Parse side effects from service log notes field
                      const parseSideEffects = (notes) => {
                        if (!notes) return null;
                        const match = notes.match(/Side effects:\s*([^|]+)/);
                        if (!match) return null;
                        const effects = match[1].trim();
                        if (!effects || effects.toLowerCase() === 'none') return null;
                        return effects;
                      };
                      const startingDose = protocol.starting_dose || protocol.selected_dose || (wlLogs.length > 0 ? parseDose(wlLogs[0].dosage) : null);
                      const currentDose = protocol.dose || protocol.selected_dose || (wlLogs.length > 0 ? parseDose(wlLogs[wlLogs.length - 1].dosage) : null);
                      const pLogs = getProtocolLogsForId(protocol.id);

                      // Activity summary: get ALL service logs for this protocol (any category)
                      const protoServiceLogs = serviceLogs
                        .filter(l => l.protocol_id === protocol.id)
                        .sort((a, b) => b.entry_date.localeCompare(a.entry_date)); // newest first
                      const lastInjection = protoServiceLogs.find(l => l.entry_type === 'injection');
                      const lastSession = protoServiceLogs.find(l => l.entry_type === 'session');
                      const lastPickup = protoServiceLogs.find(l => l.entry_type === 'pickup');
                      const lastActivity = protoServiceLogs[0]; // most recent of any type
                      const lastInClinic = protoServiceLogs.find(l => l.fulfillment_method === 'in_clinic' || l.entry_type === 'session' || (l.entry_type === 'injection' && l.fulfillment_method !== 'overnight'));
                      const lastTakeHome = protoServiceLogs.find(l => l.entry_type === 'pickup' || l.fulfillment_method === 'overnight');
                      // Session count: DB counter is source of truth (maintained by log-session and extend-wl APIs)
                      // Service log count is fallback only — many historical injections were never individually logged
                      const sessionsCompleted = isWeightLoss
                        ? (protocol.sessions_used || wlLogs.length)
                        : (protocol.sessions_used || protocol.sessions_completed || protoServiceLogs.filter(l => ['injection', 'session'].includes(l.entry_type)).length);
                      const sessionsTotal = protocol.total_sessions || protocol.sessions_total;
                      // Aggregate side effects from all service logs
                      const logsWithSideEffects = protoServiceLogs
                        .filter(l => parseSideEffects(l.notes))
                        .map(l => ({ date: l.entry_date, effects: parseSideEffects(l.notes) }));
                      const recentSideEffects = logsWithSideEffects.length > 0 ? logsWithSideEffects[0] : null;

                      return (
                        <div key={protocol.id} className="protocol-card" style={{
                          ...(protocol.status === 'completed' ? { opacity: 0.7 } : {}),
                        }}>
                          <div className="protocol-card-header">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">
                              {getProtocolDisplayName(protocol)}
                              {protocol.category === 'hrt' && protocol.hrt_type && (
                                <span style={{ fontSize: 12, color: '#7C3AED', marginLeft: 6 }}>({protocol.hrt_type === 'female' ? 'Female' : 'Male'})</span>
                              )}
                            </span>
                            {protocol.status === 'completed' && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 0 }}>✓ Completed</span>}
                            {protocol.category === 'peptide' && protocol.supply_type && (() => {
                              const fmt = PEPTIDE_SUPPLY_FORMATS.find(f => f.value === protocol.supply_type);
                              if (!fmt) return null;
                              const isVial = protocol.supply_type === 'vial';
                              return (
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isVial ? '#92400e' : '#065f46', background: isVial ? '#fef3c7' : '#d1fae5', padding: '2px 8px', borderRadius: 0, marginLeft: 4 }}>
                                  {isVial ? 'Vial' : fmt.label}
                                </span>
                              );
                            })()}
                            {protocol.delivery_method === 'in_clinic' && <span className="clinic-badge">In-Clinic</span>}
                            {isWeightLoss && protocol.status === 'active' && sessionsTotal > 0 && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#9333ea', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '2px 8px', borderRadius: 0, marginLeft: 4 }}>
                                {sessionsCompleted}/{sessionsTotal} sessions
                              </span>
                            )}
                          </div>
                          <div className="protocol-details">
                            {protocol.medication && protocol.program_name && protocol.medication !== protocol.program_name && protocol.category !== 'peptide' && (
                              <span style={{ fontWeight: 500 }}>{protocol.medication}</span>
                            )}
                            {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                            {protocol.frequency && <span>{protocol.frequency}</span>}
                            {protocol.category === 'hrt' && (() => {
                              try {
                                const sec = typeof protocol.secondary_medications === 'string'
                                  ? JSON.parse(protocol.secondary_medications)
                                  : protocol.secondary_medications;
                                const secDetails = protocol.secondary_medication_details
                                  ? (typeof protocol.secondary_medication_details === 'string'
                                    ? JSON.parse(protocol.secondary_medication_details)
                                    : protocol.secondary_medication_details)
                                  : [];
                                if (sec && sec.length > 0) {
                                  const labels = sec.map(m => {
                                    const detail = secDetails.find(d => d.medication === m);
                                    if (detail?.num_vials) {
                                      return `${m} (${detail.num_vials}v)`;
                                    }
                                    return m;
                                  });
                                  return <span style={{ color: '#7C3AED' }}>+ {labels.join(', ')}</span>;
                                }
                              } catch {}
                              return null;
                            })()}
                          </div>
                          {protocol.num_vials > 0 && (
                            <div style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
                              {protocol.num_vials} vial{protocol.num_vials > 1 ? 's' : ''}
                              {protocol.doses_per_vial > 0 && ` × ${protocol.doses_per_vial} doses`}
                              {protocol.doses_per_vial > 0 && protocol.sessions_used > 0 && (() => {
                                const dpv = protocol.doses_per_vial;
                                const numV = protocol.num_vials;
                                const used = protocol.sessions_used || 0;
                                const currentVial = Math.min(Math.floor(used / dpv) + 1, numV);
                                const dosesInVial = used - ((currentVial - 1) * dpv);
                                return ` — Vial ${currentVial} of ${numV} (${dosesInVial}/${dpv} used)`;
                              })()}
                            </div>
                          )}
                          {protocol.delivery_method === 'in_clinic' && protocol.scheduled_days?.length > 0 && (
                            <div className="protocol-schedule">
                              Schedule: {protocol.scheduled_days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}
                              {protocol.next_expected_date && ` • Next: ${formatShortDate(protocol.next_expected_date)}`}
                            </div>
                          )}
                          <div className="protocol-dates">Started {formatShortDate(protocol.start_date)}{protocol.end_date && ` → ${formatShortDate(protocol.end_date)}`}</div>


                          {/* ===== Weight Loss: Section 1 — Status Strip ===== */}
                          {isWeightLoss && protocol.status === 'active' && (() => {
                            const protoPurchases = allPurchases
                              .filter(p => p.protocol_id === protocol.id && p.purchase_date)
                              .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
                            const lastPurchase = protoPurchases.length > 0 ? protoPurchases[0] : null;
                            const lastPurchaseDate = lastPurchase ? new Date(lastPurchase.purchase_date + 'T12:00:00') : null;
                            const nextChargeDate = lastPurchaseDate ? new Date(lastPurchaseDate.getTime() + 28 * 86400000) : null;
                            const today = new Date();
                            const daysUntilCharge = nextChargeDate ? Math.ceil((nextChargeDate - today) / 86400000) : null;
                            const chargeOverdue = daysUntilCharge !== null && daysUntilCharge < 0;
                            const chargeSoon = daysUntilCharge !== null && daysUntilCharge >= 0 && daysUntilCharge <= 5;

                            const isInClinicWL = protocol.delivery_method === 'in_clinic';
                            // In-clinic protocols don't have pickups/refills — only show payment info
                            const lastPickupLog = !isInClinicWL && wlDeliveryLogs.length > 0 ? wlDeliveryLogs[wlDeliveryLogs.length - 1] : null;
                            const lastPickupDate = lastPickupLog ? new Date(lastPickupLog.entry_date + 'T12:00:00') : null;
                            const pickupSupplyDays = lastPickupLog && lastPickupLog.quantity ? lastPickupLog.quantity * 7 : 28;
                            const nextRefillDate = lastPickupDate ? new Date(lastPickupDate.getTime() + pickupSupplyDays * 86400000) : null;
                            const daysUntilRefill = nextRefillDate ? Math.ceil((nextRefillDate - today) / 86400000) : null;
                            const refillOverdue = daysUntilRefill !== null && daysUntilRefill < 0;
                            const refillSoon = daysUntilRefill !== null && daysUntilRefill >= 0 && daysUntilRefill <= 5;

                            if (!lastPickupLog && !lastPurchase) return null;

                            return (
                              <div style={{ margin: '6px 0 2px', padding: '7px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
                                {lastPickupLog && (
                                  <span>
                                    <span style={{ color: '#6b7280' }}>Last pickup: </span>
                                    <strong>{formatShortDate(lastPickupLog.entry_date)}</strong>
                                    {(lastPickupLog.quantity || lastPickupLog.medication || lastPickupLog.dosage) && (
                                      <span style={{ color: '#6b7280' }}>
                                        {' '}({lastPickupLog.quantity && lastPickupLog.quantity > 1 ? `${lastPickupLog.quantity}x ` : ''}{lastPickupLog.medication || protocol.medication}{lastPickupLog.dosage ? ` ${lastPickupLog.dosage}` : ''}{lastPickupLog.notes ? ` — ${lastPickupLog.notes}` : ''})
                                      </span>
                                    )}
                                  </span>
                                )}
                                {nextRefillDate && (
                                  <span>
                                    <span style={{ color: '#6b7280' }}>Next refill: </span>
                                    <strong style={{ color: refillOverdue ? '#dc2626' : refillSoon ? '#d97706' : '#111' }}>
                                      {formatShortDate(nextRefillDate.toISOString().split('T')[0])}
                                      {refillOverdue ? ` (${Math.abs(daysUntilRefill)}d overdue)` : ` (${daysUntilRefill}d)`}
                                    </strong>
                                  </span>
                                )}
                                {lastPickupLog && lastPurchase && <span style={{ color: '#d1d5db' }}>|</span>}
                                {lastPurchase && (
                                  <span>
                                    <span style={{ color: '#6b7280' }}>Last charge: </span>
                                    <strong>{formatShortDate(lastPurchase.purchase_date)}</strong>
                                    <span style={{ color: '#6b7280' }}> — ${lastPurchase.amount}{lastPurchase.item_name ? ` (${lastPurchase.item_name})` : lastPurchase.description ? ` (${lastPurchase.description})` : ''}</span>
                                  </span>
                                )}
                                {nextChargeDate && (
                                  <span>
                                    <span style={{ color: '#6b7280' }}>Next: </span>
                                    <strong style={{ color: chargeOverdue ? '#dc2626' : chargeSoon ? '#d97706' : '#16a34a' }}>
                                      ~{formatShortDate(nextChargeDate.toISOString().split('T')[0])}
                                      {chargeOverdue ? ` (${Math.abs(daysUntilCharge)}d overdue)` : ` (${daysUntilCharge}d)`}
                                    </strong>
                                  </span>
                                )}
                                {recentSideEffects && (
                                  <>
                                    <span style={{ color: '#d1d5db' }}>|</span>
                                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                      {'\u26A0'} {recentSideEffects.effects} ({formatShortDate(recentSideEffects.date)})
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}

                          {/* ===== Weight Loss: Section 2 — Progress Summary ===== */}
                          {isWeightLoss && protocol.status === 'active' && wlLogs.length > 0 && (
                            <div style={{ margin: '4px 0 2px', padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                              {startingWeight && currentWeight ? (
                                <span>
                                  <strong>{startingWeight} lbs</strong>
                                  <span style={{ color: '#9ca3af', margin: '0 4px' }}>{'\u2192'}</span>
                                  <strong>{currentWeight} lbs</strong>
                                  {totalLoss && (
                                    <span style={{ color: parseFloat(totalLoss) > 0 ? '#16a34a' : '#dc2626', fontWeight: 600, marginLeft: 4 }}>
                                      ({'\u2193'}{totalLoss})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span style={{ color: '#9ca3af' }}>No weight data yet</span>
                              )}
                              {protocol.goal_weight && (
                                <>
                                  <span style={{ color: '#d1d5db' }}>|</span>
                                  <span>
                                    <span style={{ color: '#6b7280' }}>Goal: </span>
                                    <strong style={{ color: '#3b82f6' }}>{protocol.goal_weight} lbs</strong>
                                    {currentWeight && (
                                      <span style={{ color: currentWeight <= protocol.goal_weight ? '#16a34a' : '#6b7280', fontWeight: 600, marginLeft: 4 }}>
                                        {currentWeight <= protocol.goal_weight ? '(reached!)' : `(${(currentWeight - protocol.goal_weight).toFixed(1)} to go)`}
                                      </span>
                                    )}
                                  </span>
                                </>
                              )}
                              {(startingDose || currentDose) && (
                                <>
                                  <span style={{ color: '#d1d5db' }}>|</span>
                                  <span>
                                    {startingDose && <strong>{startingDose}</strong>}
                                    {startingDose && currentDose && startingDose !== currentDose && (
                                      <><span style={{ color: '#9ca3af', margin: '0 4px' }}>{'\u2192'}</span><strong>{currentDose}</strong></>
                                    )}
                                    {!startingDose && currentDose && <strong>{currentDose}</strong>}
                                  </span>
                                </>
                              )}
                              <span style={{ color: '#d1d5db' }}>|</span>
                              <span>
                                <strong>{sessionsCompleted}</strong>
                                {protocol.total_sessions ? <span style={{ color: '#6b7280' }}> of {protocol.total_sessions}</span> : ''}
                                <span style={{ color: '#6b7280' }}> injections</span>
                              </span>
                            </div>
                          )}


                          {/* Range IV perk status on HRT protocol cards */}
                          {isHRTProtocol(protocol.program_type) && hrtRangeIVStatus && hrtRangeIVStatus.protocolId === protocol.id && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: hrtRangeIVStatus.used ? '#f9fafb' : '#f0fdf4', border: `1px solid ${hrtRangeIVStatus.used ? '#e5e7eb' : '#86efac'}`, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14 }}>💧</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: hrtRangeIVStatus.used ? '#6b7280' : '#166534' }}>
                                  {hrtRangeIVStatus.used ? `Range IV used ${new Date(hrtRangeIVStatus.service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Range IV available'}
                                </span>
                              </div>
                              {!hrtRangeIVStatus.used && (
                                <button
                                  onClick={() => handleRedeemRangeIV(hrtRangeIVStatus.protocolId)}
                                  disabled={redeemingPerkId === hrtRangeIVStatus.protocolId}
                                  style={{ padding: '5px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 0, fontWeight: 600, fontSize: 11, cursor: 'pointer', opacity: redeemingPerkId === hrtRangeIVStatus.protocolId ? 0.6 : 1 }}
                                >
                                  {redeemingPerkId === hrtRangeIVStatus.protocolId ? 'Redeeming...' : 'Use Today'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="protocol-footer">
                            <span className="status-badge">{protocol.status_text}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {protocol.status === 'active' && (
                                <button
                                  onClick={(e) => openLogEntryModal(protocol, e)}
                                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >+ Log Entry</button>
                              )}
                              {/* Dispense button removed — use Checkout (📦) instead */}
                              {protocol.status === 'active' && (
                                <button
                                  onClick={() => setExpandedProtocols(prev => ({ ...prev, [protocol.id]: !prev[protocol.id] }))}
                                  className="btn-secondary-sm"
                                >{isExpanded ? 'Hide Details' : 'View Details'}</button>
                              )}
                              <button onClick={() => openEditModal(protocol)} className="btn-secondary-sm">Edit</button>
                              {protocol.category === 'weight_loss' && protocol.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setExtendWLProtocol(protocol);
                                      setExtendWLDays(28);
                                      setExtendWLDose(protocol.selected_dose || '');
                                      setExtendWLPurchaseId('');
                                      setExtendWLNotes('');
                                      setExtendWLError('');
                                      setShowExtendWLModal(true);
                                    }}
                                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                  >Extend</button>
                                  <button
                                    onClick={() => handleSendWlLink(protocol.id)}
                                    disabled={sendingWlLink === protocol.id}
                                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: sendingWlLink === protocol.id ? 0.6 : 1 }}
                                  >{sendingWlLink === protocol.id ? 'Sending...' : 'Send WL Link'}</button>
                                </>
                              )}
                              {/* Merge button — only show when there are other protocols of the same category */}
                              {protocol.status === 'active' && (() => {
                                const allProtos = [...activeProtocols, ...completedProtocols];
                                const mergeTargets = allProtos.filter(p =>
                                  p.id !== protocol.id &&
                                  p.category === protocol.category &&
                                  p.status !== 'merged' &&
                                  p.status !== 'cancelled'
                                );
                                if (mergeTargets.length === 0) return null;
                                return (
                                  <button
                                    onClick={() => {
                                      setMergeSource(protocol);
                                      setMergeTarget(mergeTargets[0]);
                                      setMergeError('');
                                      setShowMergeModal(true);
                                    }}
                                    style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                    title="Merge this protocol into another"
                                  >Merge</button>
                                );
                              })()}
                            </div>
                          </div>

                          {/* HRT Onboarding Status + Portal Link */}
                          {isHRTProtocol(protocol.program_type) && protocol.status === 'active' && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {protocol.onboarding_start_date ? (
                                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                                  ✓ Onboarding started {formatShortDate(protocol.onboarding_start_date)}
                                </span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    if (protocol.delivery_method === 'take_home' && !protocol.injection_method) {
                                      alert('Please set the injection method (IM or SubQ) via Edit before starting onboarding.');
                                      return;
                                    }
                                    if (!confirm('Start the HRT onboarding email + SMS sequence? A welcome email will be sent immediately.')) return;
                                    try {
                                      const resp = await fetch('/api/protocols/start-hrt-onboarding', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ protocolId: protocol.id })
                                      });
                                      const data = await resp.json();
                                      if (data.success) {
                                        alert(`Welcome email sent to ${data.email}. Onboarding sequence started!`);
                                        fetchPatient();
                                      } else {
                                        alert('Error: ' + (data.error || 'Failed to start onboarding'));
                                      }
                                    } catch (err) {
                                      alert('Error: ' + err.message);
                                    }
                                  }}
                                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer' }}
                                >
                                  Start Onboarding
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm('Send the HRT portal link to this patient via SMS?')) return;
                                  try {
                                    const resp = await fetch('/api/protocols/send-portal-link', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ protocolId: protocol.id })
                                    });
                                    const data = await resp.json();
                                    if (data.success) {
                                      alert(`Portal link sent! URL: ${data.portalUrl}`);
                                      fetchPatient();
                                    } else {
                                      if (data.portalUrl) {
                                        prompt('SMS failed, but here is the portal link to share manually:', data.portalUrl);
                                      } else {
                                        alert('Error: ' + (data.error || 'Failed to send portal link'));
                                      }
                                    }
                                  } catch (err) {
                                    alert('Error: ' + err.message);
                                  }
                                }}
                                style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer' }}
                              >
                                Send Portal Link
                              </button>
                              {protocol.access_token && (
                                <button
                                  onClick={() => {
                                    const url = `https://www.range-medical.com/hrt/${protocol.access_token}`;
                                    navigator.clipboard.writeText(url).then(() => alert('Portal link copied!')).catch(() => prompt('Copy this link:', url));
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: 0, cursor: 'pointer' }}
                                  title="Copy portal link"
                                >
                                  📋
                                </button>
                              )}
                            </div>
                          )}

                          {/* HRT Lab Schedule */}
                          {isHRTProtocol(protocol.program_type) && hrtLabSchedules[protocol.id]?.length > 0 && (() => {
                            const schedule = hrtLabSchedules[protocol.id];
                            const completed = schedule.filter(d => d.status === 'completed').length;
                            const total = schedule.length;
                            const nextDraw = schedule.find(d => d.status === 'upcoming' || d.status === 'overdue');
                            const isLabExpanded = expandedProtocols['lab_' + protocol.id];
                            return (
                              <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: 0, border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                    🩸 Lab Schedule: {completed} of {total} draws completed
                                  </div>
                                  <button
                                    onClick={() => setExpandedProtocols(prev => ({ ...prev, ['lab_' + protocol.id]: !prev['lab_' + protocol.id] }))}
                                    style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                                  >
                                    {isLabExpanded ? 'Hide' : 'Details'}
                                  </button>
                                </div>
                                {nextDraw && (
                                  <div style={{ fontSize: '12px', color: nextDraw.status === 'overdue' ? '#dc2626' : '#6b7280', marginTop: '4px' }}>
                                    {nextDraw.status === 'overdue' ? 'Overdue: ' : 'Next: '}{nextDraw.label} — {nextDraw.weekLabel}
                                  </div>
                                )}
                                {isLabExpanded && (
                                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {schedule.map(draw => {
                                      const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : draw.status === 'skipped' ? '#d1d5db' : '#9ca3af';
                                      return (
                                        <div
                                          key={draw.label}
                                          onClick={() => handleBloodDrawClick(draw, protocol.id)}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                                            cursor: 'pointer', padding: '4px 6px', borderRadius: 0, transition: 'background 0.15s',
                                            opacity: draw.status === 'skipped' ? 0.5 : 1
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                          <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0
                                          }} />
                                          <span style={{ fontWeight: '500', color: draw.status === 'skipped' ? '#9ca3af' : '#374151', minWidth: '100px' }}>{draw.label}</span>
                                          <span style={{ color: '#6b7280' }}>{draw.weekLabel}</span>
                                          {draw.completedDate && (
                                            <span style={{ color: '#22c55e', marginLeft: 'auto', fontSize: '12px' }}>✓ {formatShortDate(draw.completedDate)}</span>
                                          )}
                                          {draw.status === 'overdue' && !draw.completedDate && (
                                            <span style={{ color: '#dc2626', marginLeft: 'auto', fontSize: '12px' }}>Overdue</span>
                                          )}
                                          {draw.status === 'skipped' && !draw.completedDate && (
                                            <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: '12px' }}>Skipped</span>
                                          )}
                                          {draw.status === 'upcoming' && !draw.completedDate && (
                                            <span style={{ color: '#3b82f6', marginLeft: 'auto', fontSize: '11px' }}>Mark complete</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* ===== Weight Loss: Section 3 — Expanded Details ===== */}
                          {isWeightLoss && isExpanded && (wlLogs.length > 0 || (protocol.total_sessions > 0 && protocol.start_date)) && (
                            <div className="wl-progress">
                              {/* Weight Chart */}
                              {chartData.length >= 2 && (() => {
                                let paymentMarkers = wlDeliveryLogs.map(log => ({
                                  date: new Date(log.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                  qty: log.quantity || 1,
                                  method: log.fulfillment_method === 'overnight' ? 'Shipped' : 'Pickup',
                                }));
                                if (paymentMarkers.length === 0) {
                                  const protoPurchases = allPurchases.filter(p => p.protocol_id === protocol.id && p.purchase_date);
                                  paymentMarkers = protoPurchases.map(p => {
                                    const qtyMatch = (p.service_name || '').match(/x(\d+)/i);
                                    const isMonthly = (p.service_name || '').toLowerCase().includes('monthly');
                                    const qty = qtyMatch ? parseInt(qtyMatch[1]) : (isMonthly ? 4 : 1);
                                    return {
                                      date: new Date(p.purchase_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                      qty,
                                      method: 'Payment',
                                    };
                                  });
                                }
                                return (
                                  <div className="wl-chart" id={`wl-chart-${protocol.id}`}>
                                    <ResponsiveContainer width="100%" height={200}>
                                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} unit=" lbs" width={65} />
                                        <Tooltip
                                          formatter={(value) => [`${value} lbs`, 'Weight']}
                                          labelFormatter={(label) => label}
                                          contentStyle={{ fontSize: 13, borderRadius: 0 }}
                                        />
                                        {paymentMarkers.map((pm, idx) => (
                                          <ReferenceLine
                                            key={`payment-${idx}`}
                                            x={pm.date}
                                            stroke="#16a34a"
                                            strokeDasharray="4 4"
                                            strokeWidth={1.5}
                                            label={{ value: `💰 ${pm.qty}x`, position: 'top', fontSize: 10, fill: '#16a34a', fontWeight: 700 }}
                                          />
                                        ))}
                                        <Line type="monotone" dataKey="weight" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} activeDot={{ r: 6 }} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                    {paymentMarkers.length > 0 && (
                                      <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ borderLeft: '2px dashed #16a34a', height: 10, display: 'inline-block' }} />
                                        = Payment / delivery
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Send Progress buttons */}
                              {chartData.length >= 2 && (
                                <div style={{ display: 'flex', gap: '6px', marginBottom: 8 }}>
                                  <button
                                    onClick={() => window.open(`/portal/${protocol.access_token || protocol.id}`, '_blank')}
                                    style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                  >
                                    👁 View Portal
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSendProgressProtocol(protocol);
                                      setSendProgressMethod('both');
                                      setSendProgressResult(null);
                                      setShowSendProgressModal(true);
                                    }}
                                    style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#1e40af', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                  >
                                    📤 Send Progress
                                  </button>
                                </div>
                              )}

                              {/* Injection Schedule Table */}
                              <div className="wl-history">
                                <table className="wl-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: 28, color: '#9ca3af' }}>#</th>
                                      <th>Date</th>
                                      <th>Dose</th>
                                      <th>Weight</th>
                                      <th>Weekly</th>
                                      <th>Total</th>
                                      <th style={{ width: 40 }}></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const totalSlots = protocol.total_sessions;
                                      const startStr = protocol.start_date;
                                      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                                      const todayDate = new Date(todayStr + 'T12:00:00');
                                      const isTakeHome = protocol.delivery_method === 'take_home';

                                      // Ongoing protocols (no total_sessions) — just show actual logs
                                      if (!totalSlots || !startStr) {
                                        // Get first weight for "Total" column
                                      const firstOngoingWeight = (() => {
                                        for (const l of wlLogs) {
                                          const w = l.weight ? parseFloat(l.weight) : findVitalsWeight(l.entry_date);
                                          if (w) return w;
                                        }
                                        return null;
                                      })();
                                      return wlLogs.flatMap((log, i) => {
                                          const logW = log.weight ? parseFloat(log.weight) : null;
                                          const vitW = !logW ? findVitalsWeight(log.entry_date) : null;
                                          const curWeight = logW || vitW;
                                          // Find previous weight (checking vitals too)
                                          let prevWeight = null;
                                          for (let j = i - 1; j >= 0; j--) {
                                            const pw = wlLogs[j].weight ? parseFloat(wlLogs[j].weight) : findVitalsWeight(wlLogs[j].entry_date);
                                            if (pw) { prevWeight = pw; break; }
                                          }
                                          const delta = prevWeight && curWeight ? (curWeight - prevWeight).toFixed(1) : null;
                                          const totalDelta = firstOngoingWeight && curWeight && i > 0 ? (curWeight - firstOngoingWeight).toFixed(1) : null;
                                          const isFirstRow = i === 0;
                                          const logSideEffects = parseSideEffects(log.notes);
                                          const elements = [
                                            <tr key={log.id} className="wl-editable-row" onClick={() => openEditInjection(log)} title="Click to edit" style={isFirstRow ? { background: '#f0f9ff', borderLeft: '3px solid #3b82f6' } : {}}>
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                                              <td>{formatShortDate(log.entry_date)}</td>
                                              <td>{log.dosage || '\u2014'}</td>
                                              <td style={isFirstRow ? { fontWeight: 700 } : {}}>{curWeight ? <>{curWeight} lbs{isFirstRow && <span style={{ fontSize: 9, color: '#3b82f6', marginLeft: 4, fontWeight: 600 }}>START</span>}{vitW && <span style={{ color: '#3b82f6', fontSize: 9, marginLeft: 4 }} title="From vitals flowsheet">V</span>}</> : '\u2014'}</td>
                                              <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>
                                                {delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '\u2014'}
                                                {logSideEffects && <span style={{ marginLeft: 6, color: '#dc2626', fontSize: 11 }}>{'\u26A0\uFE0F'}</span>}
                                              </td>
                                              <td style={{ color: totalDelta && parseFloat(totalDelta) < 0 ? '#16a34a' : totalDelta && parseFloat(totalDelta) > 0 ? '#dc2626' : '#666', fontWeight: totalDelta ? 600 : 400 }}>
                                                {isFirstRow ? '\u2014' : totalDelta ? (parseFloat(totalDelta) > 0 ? `+${totalDelta}` : totalDelta) + ' lbs' : '\u2014'}
                                              </td>
                                              <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                            </tr>
                                          ];
                                          if (logSideEffects) {
                                            elements.push(
                                              <tr key={log.id + '-se'} style={{ background: '#fef2f2' }}>
                                                <td></td>
                                                <td colSpan={6} style={{ color: '#dc2626', fontSize: 11, padding: '2px 8px 6px', fontStyle: 'italic' }}>
                                                  Side effects: {logSideEffects}
                                                </td>
                                              </tr>
                                            );
                                          }
                                          return elements;
                                        });
                                      }

                                      // Check if all injections were dispensed at once (bulk shipment)
                                      // In-clinic protocols are never "all dispensed" — each injection is logged per visit
                                      const bulkPickup = !isTakeHome ? null : allWlLogs.find(l => l.quantity && l.quantity >= totalSlots);
                                      const allDispensed = !!bulkPickup;

                                      // Build full slot schedule
                                      const freqLower = (protocol.frequency || '').toLowerCase();
                                      const intervalDays = freqLower.includes('bi') ? 14 : 7;
                                      const startDate = new Date(startStr + 'T12:00:00');

                                      const slotsRaw = Array.from({ length: totalSlots }, (_, i) => {
                                        const expDate = new Date(startDate);
                                        expDate.setDate(expDate.getDate() + i * intervalDays);
                                        const expStr = expDate.toISOString().split('T')[0];
                                        return { num: i + 1, expDate, expStr, log: null, isFuture: expDate > todayDate };
                                      });

                                      // Match logs to nearest slot by date (within ±4 days)
                                      const sortedLogs = [...wlLogs].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
                                      const usedIds = new Set();
                                      const usedSlots = new Set();
                                      // First pass: match each log to its closest unmatched slot
                                      sortedLogs.forEach(log => {
                                        const logDate = new Date(log.entry_date + 'T12:00:00');
                                        let bestIdx = -1;
                                        let bestDist = Infinity;
                                        slotsRaw.forEach((slot, idx) => {
                                          if (usedSlots.has(idx)) return;
                                          const dist = Math.abs(logDate - slot.expDate) / (1000 * 60 * 60 * 24);
                                          if (dist < bestDist) {
                                            bestDist = dist;
                                            bestIdx = idx;
                                          }
                                        });
                                        // Match if within 4 days of expected date, or if it's the closest available slot
                                        if (bestIdx >= 0 && (bestDist <= 4 || sortedLogs.length <= slotsRaw.length)) {
                                          slotsRaw[bestIdx].log = log;
                                          usedIds.add(log.id);
                                          usedSlots.add(bestIdx);
                                        }
                                      });
                                      const slots = slotsRaw;

                                      // Get starting weight for "Total" column
                                      const firstSlotWeight = (() => {
                                        for (const s of slots) {
                                          if (!s.log) continue;
                                          const w = s.log.weight ? parseFloat(s.log.weight) : findVitalsWeight(s.log.entry_date);
                                          if (w) return w;
                                        }
                                        return null;
                                      })();

                                      const rows = slots.flatMap(slot => {
                                        // Bulk dispensed slot without a log
                                        if (allDispensed && !slot.log) {
                                          const shipLog = bulkPickup || allWlLogs[0];
                                          const shipDate = shipLog ? formatShortDate(shipLog.entry_date) : formatShortDate(slot.expStr);
                                          const doseLabel = parseDose(shipLog?.dosage) || protocol.selected_dose || '\u2014';
                                          const fulfillment = shipLog?.fulfillment_method;
                                          return (
                                            <tr key={'dispensed-' + slot.num} style={{ background: '#f0fdf4' }}>
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                              <td>{formatShortDate(slot.expStr)}</td>
                                              <td>{doseLabel}</td>
                                              <td colSpan={3} style={{ color: '#16a34a', fontSize: 12 }}>
                                                {'\u2713'} Dispensed {shipDate}{fulfillment === 'overnight' ? ' \u00B7 📦 Shipped' : fulfillment === 'in_clinic' ? ' \u00B7 🏥 Pickup' : ''}
                                              </td>
                                              <td></td>
                                            </tr>
                                          );
                                        }
                                        // Slot with a log
                                        if (slot.log) {
                                          // Use vitals weight when service_log weight is missing
                                          const logWeight = slot.log.weight ? parseFloat(slot.log.weight) : null;
                                          const vitalsWeight = !logWeight ? findVitalsWeight(slot.log.entry_date) : null;
                                          const effectiveWeight = logWeight || vitalsWeight;
                                          const isFirstSlot = slot.num === 1;
                                          // Find previous effective weight for change calculation
                                          const prevSlot = slots.slice(0, slot.num - 1).reverse().find(s => {
                                            if (!s.log) return false;
                                            return s.log.weight || findVitalsWeight(s.log.entry_date);
                                          });
                                          const prevWeight = prevSlot?.log?.weight
                                            ? parseFloat(prevSlot.log.weight)
                                            : (prevSlot?.log ? findVitalsWeight(prevSlot.log.entry_date) : null);
                                          const delta = prevWeight && effectiveWeight ? (effectiveWeight - prevWeight).toFixed(1) : null;
                                          const totalDelta = firstSlotWeight && effectiveWeight && !isFirstSlot ? (effectiveWeight - firstSlotWeight).toFixed(1) : null;
                                          const fulfillment = slot.log.fulfillment_method;
                                          const slotSideEffects = parseSideEffects(slot.log.notes);
                                          const rowElements = [
                                            <tr key={slot.log.id} className="wl-editable-row" onClick={() => openEditInjection(slot.log)} title="Click to edit or delete" style={isFirstSlot ? { background: '#f0f9ff', borderLeft: '3px solid #3b82f6' } : {}}>
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                              <td>{formatShortDate(slot.log.entry_date)}{fulfillment === 'overnight' ? <span style={{ marginLeft: 4, fontSize: 11 }}>📦</span> : fulfillment === 'in_clinic' ? <span style={{ marginLeft: 4, fontSize: 11 }}>🏥</span> : ''}</td>
                                              <td>{parseDose(slot.log.dosage) || slot.log.dosage || '\u2014'}</td>
                                              <td style={isFirstSlot ? { fontWeight: 700 } : {}}>{effectiveWeight ? <>{effectiveWeight} lbs{isFirstSlot && <span style={{ fontSize: 9, color: '#3b82f6', marginLeft: 4, fontWeight: 600 }}>START</span>}{vitalsWeight && <span style={{ color: '#3b82f6', fontSize: 9, marginLeft: 4 }} title="From vitals flowsheet">V</span>}</> : '\u2014'}</td>
                                              <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>
                                                {delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '\u2014'}
                                                {slotSideEffects && <span style={{ marginLeft: 6, color: '#dc2626', fontSize: 11 }}>{'\u26A0\uFE0F'}</span>}
                                              </td>
                                              <td style={{ color: totalDelta && parseFloat(totalDelta) < 0 ? '#16a34a' : totalDelta && parseFloat(totalDelta) > 0 ? '#dc2626' : '#666', fontWeight: totalDelta ? 600 : 400 }}>
                                                {isFirstSlot ? '\u2014' : totalDelta ? (parseFloat(totalDelta) > 0 ? `+${totalDelta}` : totalDelta) + ' lbs' : '\u2014'}
                                              </td>
                                              <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                            </tr>
                                          ];
                                          if (slotSideEffects) {
                                            rowElements.push(
                                              <tr key={slot.log.id + '-se'} style={{ background: '#fef2f2' }}>
                                                <td></td>
                                                <td colSpan={6} style={{ color: '#dc2626', fontSize: 11, padding: '2px 8px 6px', fontStyle: 'italic' }}>
                                                  Side effects: {slotSideEffects}
                                                </td>
                                              </tr>
                                            );
                                          }
                                          return rowElements;
                                        }
                                        // Past slot without log
                                        if (!slot.isFuture) {
                                          const emptyVitalsWeight = findVitalsWeight(slot.expStr);
                                          if (isTakeHome) {
                                            // Take-home: neutral "click to add weight" style
                                            return (
                                              <tr key={'empty-' + slot.num} style={{ background: '#f9fafb', cursor: 'pointer' }}
                                                onClick={() => openQuickWeightModal(protocol, slot.expStr)}
                                                title="Click to log weight for this session">
                                                <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                                <td style={{ color: '#6b7280' }}>{formatShortDate(slot.expStr)}</td>
                                                <td style={{ color: '#9ca3af' }}>{currentDose || '\u2014'}</td>
                                                <td>{emptyVitalsWeight ? <span style={{ color: '#3b82f6' }}>{emptyVitalsWeight} lbs <span style={{ fontSize: 9 }} title="From vitals flowsheet">V</span></span> : <span style={{ color: '#9ca3af' }}>{'\u2014'}</span>}</td>
                                                <td style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 11 }}>Click to add weight</td>
                                                <td></td>
                                                <td style={{ textAlign: 'center', color: '#9ca3af', fontWeight: 700, fontSize: 14 }}>+</td>
                                              </tr>
                                            );
                                          } else {
                                            // In-clinic: clickable "Log injection" row
                                            return (
                                              <tr key={'noshow-' + slot.num} style={{ background: '#f0f9ff', cursor: 'pointer' }}
                                                onClick={() => openQuickWeightModal(protocol, slot.expStr)}
                                                title="Click to log injection for this session">
                                                <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                                <td style={{ color: '#1e40af' }}>{formatShortDate(slot.expStr)}</td>
                                                <td style={{ color: '#1e40af' }}>{currentDose || '\u2014'}</td>
                                                <td>{emptyVitalsWeight ? <span style={{ color: '#3b82f6' }}>{emptyVitalsWeight} lbs <span style={{ fontSize: 9 }} title="From vitals flowsheet">V</span></span> : <span style={{ color: '#6b7280' }}>{'\u2014'}</span>}</td>
                                                <td style={{ color: '#3b82f6', fontStyle: 'italic', fontSize: 11 }}>Log injection</td>
                                                <td></td>
                                                <td style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 700, fontSize: 14 }}>+</td>
                                              </tr>
                                            );
                                          }
                                        }
                                        // Future slot
                                        return (
                                          <tr key={'future-' + slot.num} style={{ opacity: 0.35 }}>
                                            <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                            <td style={{ color: '#9ca3af' }}>{formatShortDate(slot.expStr)}</td>
                                            <td colSpan={4} style={{ color: '#9ca3af', fontStyle: 'italic' }}>Upcoming</td>
                                            <td></td>
                                          </tr>
                                        );
                                      });

                                      // Append any unmatched logs
                                      wlLogs.filter(l => !usedIds.has(l.id)).forEach((log, i) => {
                                        const prevSlot = slots.filter(s => s.log).reverse()[0];
                                        const pW = prevSlot?.log?.weight ? parseFloat(prevSlot.log.weight) : (prevSlot?.log ? findVitalsWeight(prevSlot.log.entry_date) : null);
                                        const logW = log.weight ? parseFloat(log.weight) : null;
                                        const vitW = !logW ? findVitalsWeight(log.entry_date) : null;
                                        const curWeight = logW || vitW;
                                        const delta = pW && curWeight ? (curWeight - pW).toFixed(1) : null;
                                        const extraTotalDelta = firstSlotWeight && curWeight ? (curWeight - firstSlotWeight).toFixed(1) : null;
                                        rows.push(
                                          <tr key={'extra-' + log.id} className="wl-editable-row" onClick={() => openEditInjection(log)} title="Click to edit or delete">
                                            <td style={{ color: '#9ca3af', fontSize: 12 }}>+</td>
                                            <td>{formatShortDate(log.entry_date)}</td>
                                            <td>{log.dosage || '\u2014'}</td>
                                            <td>{curWeight ? <>{curWeight} lbs{vitW && <span style={{ color: '#3b82f6', fontSize: 9, marginLeft: 4 }} title="From vitals flowsheet">V</span>}</> : '\u2014'}</td>
                                            <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>{delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '\u2014'}</td>
                                            <td style={{ color: extraTotalDelta && parseFloat(extraTotalDelta) < 0 ? '#16a34a' : extraTotalDelta && parseFloat(extraTotalDelta) > 0 ? '#dc2626' : '#666', fontWeight: extraTotalDelta ? 600 : 400 }}>{extraTotalDelta ? (parseFloat(extraTotalDelta) > 0 ? `+${extraTotalDelta}` : extraTotalDelta) + ' lbs' : '\u2014'}</td>
                                            <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                          </tr>
                                        );
                                      });

                                      return rows;
                                    })()}
                                  </tbody>
                                </table>
                              </div>

                              {/* Medication Deliveries — only for take-home protocols */}
                              {wlDeliveryLogs.length > 0 && protocol.delivery_method !== 'in_clinic' && (
                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                    Medication Deliveries
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {wlDeliveryLogs.slice().reverse().map(log => (
                                      <div
                                        key={log.id}
                                        onClick={() => openEditInjection(log)}
                                        title="Click to edit delivery"
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f0f9ff', border: '1px solid #bfdbfe', fontSize: 12, cursor: 'pointer', borderRadius: 0, transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
                                      >
                                        <span style={{ fontSize: 14 }}>{log.fulfillment_method === 'overnight' ? '📦' : '🏥'}</span>
                                        <span style={{ fontWeight: 600 }}>{formatShortDate(log.entry_date)}</span>
                                        <span style={{ color: '#1e40af' }}>
                                          {log.quantity || 1} {(log.quantity || 1) === 1 ? 'injection' : 'injections'}
                                          {log.fulfillment_method === 'overnight' ? ' shipped' : ' picked up'}
                                        </span>
                                        {log.medication && <span style={{ color: '#6b7280' }}>{'\u2014'} {log.medication}</span>}
                                        {log.dosage && <span style={{ color: '#6b7280' }}>{parseDose(log.dosage) || log.dosage}</span>}
                                        {log.tracking_number && (
                                          <span style={{ color: '#3b82f6', marginLeft: 'auto' }}>Tracking: {log.tracking_number}</span>
                                        )}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Weekly Check-in Settings */}
                              {protocol.delivery_method !== 'in_clinic' && (() => {
                                const enabled = protocol.checkin_reminder_enabled === true;
                                const injDay = protocol.injection_day;
                                if (enabled) {
                                  return (
                                    <div style={{ marginTop: 10, padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: 11, color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>{'\u2705'} Weekly check-ins ({injDay || 'Monday'})</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <select value={injDay || 'Monday'} onChange={async e => { try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ injection_day: e.target.value }) }); fetchPatient(); } catch {} }} style={{ padding: '2px 4px', border: '1px solid #BBF7D0', borderRadius: 0, fontSize: 10, color: '#15803D', background: '#F0FDF4' }}>
                                          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <button onClick={async () => { try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkin_reminder_enabled: false }) }); fetchPatient(); } catch {} }} style={{ fontSize: 10, color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Disable</button>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div style={{ marginTop: 10, padding: '6px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                    <span style={{ color: '#666' }}>Check-in day:</span>
                                    <select value={wlCheckinDay} onChange={e => setWlCheckinDay(e.target.value)} style={{ padding: '2px 6px', border: '1px solid #e5e5e5', borderRadius: 0, fontSize: 11 }}>
                                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <button
                                      onClick={async () => { setEnablingCheckin(protocol.id); try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkin_reminder_enabled: true, injection_day: wlCheckinDay }) }); fetchPatient(); } catch { alert('Failed'); } setEnablingCheckin(null); }}
                                      disabled={enablingCheckin === protocol.id}
                                      style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', background: '#000', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer', marginLeft: 'auto' }}
                                    >{enablingCheckin === protocol.id ? 'Enabling...' : 'Enable Check-ins'}</button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}


                          {/* ===== Session-Based Expanded (HBOT, RLT, IV) ===== */}
                          {['hbot', 'rlt', 'iv'].includes(protocol.category) && isExpanded && (() => {
                            const totalSessions = protocol.total_sessions || 0;
                            const sessionsUsed = protocol.sessions_used || protocol.sessions_completed || 0;
                            const sessionsRemaining = Math.max(0, totalSessions - sessionsUsed);
                            const sessionDates = getSessionDates(protocol);
                            return (
                              <div className="protocol-expand">
                                <div className="px-stats-row">
                                  <div className="px-stat">
                                    <span className="px-stat-label">Sessions Used</span>
                                    <span className="px-stat-value">{sessionsUsed} / {totalSessions}</span>
                                  </div>
                                  <div className="px-stat">
                                    <span className="px-stat-label">Remaining</span>
                                    <span className="px-stat-value">{sessionsRemaining}</span>
                                  </div>
                                  {protocol.start_date && (
                                    <div className="px-stat">
                                      <span className="px-stat-label">Started</span>
                                      <span className="px-stat-value">{formatShortDate(protocol.start_date)}</span>
                                    </div>
                                  )}
                                </div>
                                {totalSessions > 0 && (
                                  <div className="px-session-grid has-dates">
                                    {Array.from({ length: totalSessions }, (_, i) => {
                                      const num = i + 1;
                                      const isUsed = num <= sessionsUsed;
                                      const isNext = num === sessionsUsed + 1 && protocol.status === 'active';
                                      const sessionDate = sessionDates[i] || null;
                                      return (
                                        <div
                                          key={num}
                                          className={`px-session-box ${isUsed ? 'used' : isNext ? 'next' : 'future'}`}
                                          onClick={isNext ? () => {
                                            setSessionLogModal({ protocolId: protocol.id, sessionNum: num });
                                            setSessionLogDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
                                          } : undefined}
                                          style={{ cursor: isNext ? 'pointer' : 'default' }}
                                        >
                                          <span className="px-session-num">{num}</span>
                                          {isUsed && sessionDate && <span className="px-session-date">{formatBoxDate(sessionDate)}</span>}
                                          {isUsed && !sessionDate && <span className="px-session-check">✓</span>}
                                          {isNext && <span className="px-session-label">NEXT</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="px-legend">
                                  <span><span className="px-legend-dot used" /> Used</span>
                                  <span><span className="px-legend-dot next" /> Next</span>
                                  <span><span className="px-legend-dot future" /> Available</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* ===== Injection/NAD Expanded ===== */}
                          {protocol.category === 'injection' && isExpanded && (() => {
                            const totalSessions = protocol.total_sessions || protocol.total_units || 0;
                            const sessionsUsed = protocol.sessions_used || protocol.sessions_completed || 0;
                            const sessionsRemaining = Math.max(0, totalSessions - sessionsUsed);
                            const sessionDates = getSessionDates(protocol);
                            return (
                              <div className="protocol-expand">
                                <div className="px-stats-row">
                                  <div className="px-stat">
                                    <span className="px-stat-label">Injections Used</span>
                                    <span className="px-stat-value">{sessionsUsed} / {totalSessions}</span>
                                  </div>
                                  <div className="px-stat">
                                    <span className="px-stat-label">Remaining</span>
                                    <span className="px-stat-value">{sessionsRemaining}</span>
                                  </div>
                                </div>
                                {totalSessions > 0 && (
                                  <div className="px-session-grid has-dates">
                                    {Array.from({ length: totalSessions }, (_, i) => {
                                      const num = i + 1;
                                      const isUsed = num <= sessionsUsed;
                                      const isNext = num === sessionsUsed + 1 && protocol.status === 'active';
                                      const sessionDate = sessionDates[i] || null;
                                      return (
                                        <div
                                          key={num}
                                          className={`px-session-box ${isUsed ? 'used' : isNext ? 'next' : 'future'}`}
                                          onClick={isNext ? () => {
                                            setSessionLogModal({ protocolId: protocol.id, sessionNum: num });
                                            setSessionLogDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
                                          } : undefined}
                                          style={{ cursor: isNext ? 'pointer' : 'default' }}
                                        >
                                          <span className="px-session-num">{num}</span>
                                          {isUsed && sessionDate && <span className="px-session-date">{formatBoxDate(sessionDate)}</span>}
                                          {isUsed && !sessionDate && <span className="px-session-check">✓</span>}
                                          {isNext && <span className="px-session-label">NEXT</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="px-legend">
                                  <span><span className="px-legend-dot used" /> Used</span>
                                  <span><span className="px-legend-dot next" /> Next</span>
                                  <span><span className="px-legend-dot future" /> Available</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* ===== Peptide Expanded ===== */}
                          {protocol.category === 'peptide' && isExpanded && (() => {
                            // Calculate total days from start_date → end_date (handles extensions/renewals)
                            // Fallback to name parsing or total_sessions for legacy protocols
                            let totalDays = 30;
                            if (protocol.start_date && protocol.end_date) {
                              const sp = protocol.start_date.split('-');
                              const ep = protocol.end_date.split('-');
                              const startD = new Date(parseInt(sp[0]), parseInt(sp[1]) - 1, parseInt(sp[2]));
                              const endD = new Date(parseInt(ep[0]), parseInt(ep[1]) - 1, parseInt(ep[2]));
                              totalDays = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)));
                            } else {
                              const nameMatch = (protocol.program_name || '').match(/(\d+)[\s-]*day/i);
                              if (nameMatch) totalDays = parseInt(nameMatch[1]);
                              else if (protocol.total_sessions) totalDays = protocol.total_sessions;
                            }
                            const currentDay = calculateCurrentDay(protocol.start_date);
                            const daysRemaining = currentDay ? Math.max(0, totalDays - currentDay) : totalDays;
                            const medication = protocol.medication || protocol.primary_peptide || '';
                            const isRecovery = isRecoveryPeptide(medication);
                            const completedDays = pLogs.filter(l => l.log_type === 'injection_completed').map(l => {
                              if (!protocol.start_date || !l.log_date) return null;
                              const parts = protocol.start_date.split('-');
                              const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                              const logParts = l.log_date.split('-');
                              const logDate = new Date(parseInt(logParts[0]), parseInt(logParts[1]) - 1, parseInt(logParts[2]));
                              return Math.floor((logDate - start) / (1000 * 60 * 60 * 24)) + 1;
                            }).filter(Boolean);
                            return (
                              <div className="protocol-expand">
                                <div className="px-stats-row">
                                  <div className="px-stat">
                                    <span className="px-stat-label">Current Day</span>
                                    <span className="px-stat-value">{currentDay && currentDay > 0 ? Math.min(currentDay, totalDays) : '—'} / {totalDays}</span>
                                  </div>
                                  <div className="px-stat">
                                    <span className="px-stat-label">Remaining</span>
                                    <span className="px-stat-value">{daysRemaining} days</span>
                                  </div>
                                  {protocol.selected_dose && (
                                    <div className="px-stat">
                                      <span className="px-stat-label">Dose</span>
                                      <span className="px-stat-value">{protocol.selected_dose}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Day grid */}
                                <div className="px-session-grid">
                                  {Array.from({ length: totalDays }, (_, i) => {
                                    const dayNum = i + 1;
                                    const dayDate = getDateForDay(protocol.start_date, dayNum);
                                    const isCompleted = completedDays.includes(dayNum);
                                    const isPast = currentDay && dayNum < currentDay;
                                    const isToday = currentDay && dayNum === currentDay;
                                    return (
                                      <div
                                        key={dayNum}
                                        className={`px-session-box ${isCompleted ? 'used' : isToday ? 'next' : isPast ? 'used' : 'future'}`}
                                        style={{ cursor: 'default' }}
                                      >
                                        <span className="px-session-num">{dayNum}</span>
                                        {dayDate && <span style={{ fontSize: '9px', opacity: 0.7 }}>{formatDayDate(dayDate)}</span>}
                                        {isToday && <span className="px-session-label">TODAY</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="px-legend">
                                  <span><span className="px-legend-dot used" /> Past</span>
                                  <span><span className="px-legend-dot next" /> Today</span>
                                  <span><span className="px-legend-dot future" /> Future</span>
                                </div>
                                {/* Action buttons for peptide protocols */}
                                {protocol.status === 'active' && (
                                  <div className="px-actions">
                                    {!protocol.peptide_guide_sent && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/admin/protocols/${protocol.id}/send-guide`, { method: 'POST' });
                                            const data = await res.json();
                                            if (res.ok) { alert(data.twoStep ? 'Guide will deliver when patient replies.' : 'Peptide guide sent!'); fetchPatient(); }
                                            else { alert(data.error || 'Failed to send'); }
                                          } catch (e) { alert('Failed to send'); }
                                        }}
                                        className="btn-secondary-sm"
                                      >📖 Send Peptide Guide</button>
                                    )}
                                    {protocol.peptide_guide_sent && (
                                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Guide Sent</span>
                                    )}
                                  </div>
                                )}
                                {/* 90-Day Cycle Progress */}
                                <CycleProgressCard protocol={protocol} />
                              </div>
                            );
                          })()}

                          {/* ===== HRT Expanded ===== */}
                          {protocol.category === 'hrt' && isExpanded && (() => {
                            const monthsOn = protocol.start_date
                              ? Math.max(0, Math.floor((new Date() - new Date(protocol.start_date + 'T00:00:00')) / (1000 * 60 * 60 * 24 * 30.44)))
                              : 0;
                            return (
                              <div className="protocol-expand">
                                <div className="px-stats-row">
                                  <div className="px-stat">
                                    <span className="px-stat-label">Membership</span>
                                    <span className="px-stat-value">{monthsOn} month{monthsOn !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="px-stat">
                                    <span className="px-stat-label">Supply</span>
                                    <span className="px-stat-value">{protocol.status_text || '—'}</span>
                                  </div>
                                  {protocol.selected_dose && (
                                    <div className="px-stat">
                                      <span className="px-stat-label">Dose</span>
                                      <span className="px-stat-value">{protocol.selected_dose}</span>
                                    </div>
                                  )}
                                  {protocol.frequency && (
                                    <div className="px-stat">
                                      <span className="px-stat-label">Frequency</span>
                                      <span className="px-stat-value">{protocol.frequency}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Injection reminders status */}
                                {protocol.delivery_method === 'take_home' && (
                                  <div style={{ padding: '8px 12px', background: protocol.hrt_reminders_enabled ? '#F0FDF4' : '#f9fafb', border: `1px solid ${protocol.hrt_reminders_enabled ? '#BBF7D0' : '#e5e7eb'}`, borderRadius: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {protocol.hrt_reminders_enabled ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Injection Reminders ON ({protocol.hrt_reminder_schedule === 'tue_fri' ? 'Tue & Fri' : protocol.hrt_reminder_schedule === 'daily' ? 'Daily' : 'Mon & Thu'})</span>
                                    ) : (
                                      <>
                                        <span style={{ color: '#666' }}>Injection Reminders: Off</span>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hrt_reminders_enabled: true, hrt_reminder_schedule: 'mon_thu' }) });
                                              fetchPatient();
                                            } catch {}
                                          }}
                                          style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer' }}
                                        >Enable Reminders</button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Labs Tab — Redesigned */}
          {activeTab === 'labs' && (
            <>
              {/* Lab Pipeline — Progress Tracker */}
              {labProtocols.filter(lp => lp.status !== 'consult_complete').map(lp => {
                const stageIdx = LAB_STAGES.findIndex(s => s.id === lp.status);
                const nextStage = stageIdx < LAB_STAGES.length - 1 ? LAB_STAGES[stageIdx + 1] : null;
                const panelType = lp.medication || 'Essential';
                const isElite = panelType.toLowerCase() === 'elite';
                const labType = lp.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
                const drawDateObj = lp.start_date ? new Date(lp.start_date + 'T12:00:00') : null;
                const drawDate = drawDateObj ? drawDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(drawDateObj.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '-';
                const daysInStage = lp.updated_at ? Math.floor((new Date() - new Date(lp.updated_at)) / (1000 * 60 * 60 * 24)) : 0;

                return (
                  <div key={lp.id} style={{
                    background: '#fff', borderRadius: 0, border: '1px solid #e5e5e5',
                    padding: '20px 24px', marginBottom: 16,
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>Lab Order</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 0, fontSize: 11, fontWeight: 600,
                          background: isElite ? '#f0fdf4' : '#f5f5f5',
                          color: isElite ? '#15803d' : '#525252',
                        }}>{panelType}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 0, fontSize: 11, fontWeight: 500,
                          background: '#f5f5f5', color: '#525252',
                        }}>{labType}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#737373' }}>Draw: {drawDate}</span>
                        <button
                          onClick={() => handleDeleteLabProtocol(lp.id)}
                          disabled={deletingLabId === lp.id}
                          title="Delete this lab order"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#d1d5db', fontSize: 16, padding: '2px 4px',
                            lineHeight: 1, opacity: deletingLabId === lp.id ? 0.4 : 1,
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Step tracker */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                      {LAB_STAGES.map((stage, i) => {
                        const isComplete = i < stageIdx;
                        const isCurrent = i === stageIdx;
                        const isFuture = i > stageIdx;
                        return (
                          <div key={stage.id} style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
                          }}>
                            {/* Connector line */}
                            {i > 0 && (
                              <div style={{
                                position: 'absolute', top: 10, right: '50%', width: '100%', height: 2,
                                background: isComplete || isCurrent ? '#000' : '#e5e5e5',
                                zIndex: 0,
                              }} />
                            )}
                            {/* Dot */}
                            <div style={{
                              width: isCurrent ? 22 : 20, height: isCurrent ? 22 : 20,
                              borderRadius: '50%', zIndex: 1,
                              background: isComplete ? '#000' : isCurrent ? '#000' : '#e5e5e5',
                              border: isCurrent ? '3px solid #000' : 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {isComplete && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {isCurrent && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                              )}
                            </div>
                            {/* Label */}
                            <span style={{
                              fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                              color: isFuture ? '#a3a3a3' : '#000',
                              marginTop: 6, textAlign: 'center',
                              textTransform: 'uppercase', letterSpacing: '0.02em',
                            }}>{stage.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current stage info + actions */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#fafafa', borderRadius: 0, padding: '10px 14px',
                    }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#000' }}>
                          {LAB_STAGES[stageIdx]?.label || 'Unknown'}
                        </span>
                        {daysInStage > 0 && (
                          <span style={{
                            fontSize: 11, marginLeft: 8,
                            color: daysInStage >= 7 ? '#dc2626' : daysInStage >= 3 ? '#d97706' : '#737373',
                            fontWeight: 600,
                          }}>{daysInStage} day{daysInStage !== 1 ? 's' : ''}</span>
                        )}
                        {lp.notes && (
                          <div style={{ fontSize: 11, color: '#737373', marginTop: 2 }}>{lp.notes}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Send Results button — shown when results are available */}
                        {['uploaded', 'under_review', 'ready_to_schedule', 'consult_scheduled', 'in_treatment'].includes(lp.status) && (
                          <button
                            onClick={() => handleSendLabResults(lp)}
                            disabled={sendingLabId === lp.id}
                            style={{
                              padding: '7px 14px', border: '1px solid #8b5cf6', borderRadius: 0,
                              background: sentLabIds[lp.id] ? '#f0fdf4' : '#faf5ff',
                              color: sentLabIds[lp.id] ? '#15803d' : '#7c3aed',
                              cursor: 'pointer', fontWeight: 600, fontSize: 12,
                              opacity: sendingLabId === lp.id ? 0.6 : 1,
                            }}
                          >
                            {sendingLabId === lp.id ? 'Sending...' : sentLabIds[lp.id] ? '✓ Sent to Patient' : '📤 Send to Patient'}
                          </button>
                        )}
                        {nextStage && (
                          <button
                            onClick={() => handleLabStageAdvance(lp.id, nextStage.id)}
                            style={{
                              padding: '7px 16px', border: 'none', borderRadius: 0,
                              background: '#000', color: '#fff', cursor: 'pointer',
                              fontWeight: 600, fontSize: 12,
                            }}
                          >
                            Advance to {nextStage.label}
                          </button>
                        )}
                        <select
                          onChange={(e) => { if (e.target.value) { handleLabStageAdvance(lp.id, e.target.value); e.target.value = ''; } }}
                          defaultValue=""
                          style={{
                            padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: 0,
                            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#737373',
                          }}
                        >
                          <option value="" disabled>Move to...</option>
                          {LAB_STAGES.filter(s => s.id !== lp.status).map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Completed lab orders — collapsed */}
              {labProtocols.filter(lp => lp.status === 'consult_complete').length > 0 && (
                <div style={{
                  background: '#fff', borderRadius: 0, border: '1px solid #e5e5e5',
                  padding: '14px 20px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
                    Completed ({labProtocols.filter(lp => lp.status === 'consult_complete').length})
                  </div>
                  {labProtocols.filter(lp => lp.status === 'consult_complete').map(lp => {
                    const panelType = lp.medication || 'Essential';
                    const labType = lp.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
                    const drawDateObj = lp.start_date ? new Date(lp.start_date + 'T12:00:00') : null;
                    const drawDate = drawDateObj ? drawDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(drawDateObj.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '-';
                    return (
                      <div key={lp.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: '1px solid #f5f5f5',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#525252' }}>{panelType} Panel</span>
                          <span style={{ fontSize: 11, color: '#a3a3a3' }}>{labType}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: '#a3a3a3' }}>{drawDate}</span>
                          <button
                            onClick={() => handleDeleteLabProtocol(lp.id)}
                            disabled={deletingLabId === lp.id}
                            title="Delete this lab order"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#d1d5db', fontSize: 14, padding: '1px 3px',
                              lineHeight: 1, opacity: deletingLabId === lp.id ? 0.4 : 1,
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No active labs message */}
              {labProtocols.length === 0 && (
                <div style={{
                  background: '#fff', borderRadius: 0, border: '1px solid #e5e5e5',
                  padding: '32px 24px', textAlign: 'center', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, color: '#a3a3a3' }}>No lab orders yet</div>
                </div>
              )}

              {/* Lab Documents — Card Grid */}
              <div style={{
                background: '#fff', borderRadius: 0, border: '1px solid #e5e5e5',
                padding: '20px 24px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>Lab Documents</span>
                  <button onClick={() => setShowUploadModal(true)} style={{
                    padding: '6px 14px', background: '#000', color: '#fff', border: 'none',
                    borderRadius: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>Upload PDF</button>
                </div>
                {loadingDocs ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#a3a3a3', fontSize: 13 }}>Loading...</div>
                ) : labDocuments.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#a3a3a3', fontSize: 13 }}>No lab documents uploaded yet</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {labDocuments.map(doc => (
                      <div key={doc.id} style={{
                        border: '1px solid #e5e5e5', borderRadius: 0, padding: '12px 14px',
                        background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#000', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.file_name}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#737373' }}>
                          {doc.lab_type || 'Lab'} {doc.panel_type ? `· ${doc.panel_type}` : ''} {doc.collection_date ? `· ${formatShortDate(doc.collection_date)}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {doc.url && (
                            <button onClick={() => openPdfViewer(doc.url, doc.file_name || 'Lab Document')} style={{
                              flex: 1, padding: '5px 0', background: '#fff', border: '1px solid #e5e5e5',
                              borderRadius: 0, fontSize: 11, fontWeight: 500, cursor: 'pointer', color: '#000',
                            }}>View</button>
                          )}
                          {doc.source !== 'labs' && (
                            <button onClick={() => handleDeleteDocument(doc.id)} style={{
                              padding: '5px 10px', background: '#fff', border: '1px solid #e5e5e5',
                              borderRadius: 0, fontSize: 11, color: '#dc2626', cursor: 'pointer',
                            }}>×</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Results Viewer */}
              <LabDashboard
                patientId={patient.id}
                patientGender={patient.gender || intakeDemographics?.gender}
                embedded={true}
              />
            </>
          )}

          {/* Documents Tab (Intakes + Consents + Assessments) */}
          {activeTab === 'intakes' && (
            <>
              {/* Assessments Section */}
              {assessments.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h3>Assessments ({assessments.length})</h3>
                  </div>
                  <div className="document-list">
                    {assessments.map(a => {
                      const pathLabel = a.assessment_path === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
                      const pathIcon = a.assessment_path === 'injury' ? '🏥' : '⚡';
                      const pathColor = a.assessment_path === 'injury' ? '#dc2626' : '#16a34a';
                      // Build summary from fields
                      const details = [];
                      if (a.assessment_path === 'injury') {
                        if (a.injury_type) details.push(`Type: ${a.injury_type.replace(/_/g, ' ')}`);
                        if (a.injury_location) details.push(`Location: ${a.injury_location.replace(/_/g, ' ')}`);
                        if (a.injury_duration) details.push(`Duration: ${a.injury_duration.replace(/_/g, ' ')}`);
                        if (a.recovery_goal) details.push(`Goal: ${a.recovery_goal.replace(/_/g, ' ')}`);
                      } else {
                        if (a.primary_symptom) details.push(`Symptoms: ${a.primary_symptom.replace(/_/g, ' ')}`);
                        if (a.energy_goal) details.push(`Goals: ${a.energy_goal.replace(/_/g, ' ')}`);
                        if (a.tried_hormone_therapy) details.push(`Previous HRT: ${a.tried_hormone_therapy}`);
                      }
                      if (a.additional_info) details.push(`Notes: ${a.additional_info}`);

                      return (
                        <div key={a.id} className="document-card" onClick={() => a.pdf_url && openPdfViewer(a.pdf_url, `${a.first_name} ${a.last_name} — ${pathLabel} Assessment`)} style={{ cursor: a.pdf_url ? 'pointer' : 'default' }}>
                          <div className="document-header">
                            <span className="document-icon">{pathIcon}</span>
                            <div>
                              <strong>{pathLabel} Assessment</strong>
                              <span className="document-type" style={{ color: pathColor }}>{a.first_name} {a.last_name}</span>
                            </div>
                          </div>
                          <div style={{ padding: '8px 12px', fontSize: 13, color: '#525252', lineHeight: '1.5' }}>
                            {details.map((d, i) => (
                              <div key={i}>{d}</div>
                            ))}
                          </div>
                          <div className="document-details">
                            <span>{formatDate(a.created_at)}</span>
                            {a.medical_history && <span style={{ color: '#16a34a', fontWeight: 500 }}>✓ Intake completed</span>}
                            {!a.medical_history && <span style={{ color: '#d97706' }}>Pending intake</span>}
                          </div>
                          <div className="document-actions">
                            {a.pdf_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(a.pdf_url, `${a.first_name} ${a.last_name} — ${pathLabel} Assessment`); }} className="btn-secondary-sm">View PDF</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Consent Forms Section */}
              <section className="card">
                <div className="card-header">
                  <h3>Consent Forms ({consents.length})</h3>
                </div>
                {consents.length === 0 ? (
                  <div className="empty">No consent forms found</div>
                ) : (
                  <div className="consent-list">
                    {consents.map(consent => {
                      const ct = (consent.consent_type || '').toLowerCase();
                      const icon = ct.includes('hipaa') ? '🔒' :
                        ct.includes('hrt') ? '💉' :
                        ct.includes('peptide') ? '🧬' :
                        ct.includes('weight') ? '⚖️' :
                        ct.includes('iv') ? '💧' :
                        ct.includes('hbot') ? '🫁' :
                        ct.includes('blood') ? '🩸' :
                        ct.includes('prp') ? '💉' :
                        ct.includes('red-light') || ct.includes('red_light') ? '🔴' : '📝';
                      const typeName = consent.consent_type
                        ? consent.consent_type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/Hipaa/g, 'HIPAA')
                        : 'General';
                      return (
                        <div key={consent.id} className="consent-card" onClick={() => consent.pdf_url && openPdfViewer(consent.pdf_url, `${typeName} Consent`)}>
                          <div className="consent-header">
                            <span className="consent-icon">{icon}</span>
                            <div className="consent-title-group">
                              <strong>{typeName}</strong>
                              <span className={`consent-status ${consent.consent_given ? 'signed' : 'pending'}`}>
                                {consent.consent_given ? '✓ Signed' : '○ Pending'}
                              </span>
                            </div>
                          </div>
                          <div className="consent-meta">
                            <span>{consent.first_name} {consent.last_name}</span>
                            <span className="consent-date">{formatDate(consent.consent_date || consent.submitted_at)}</span>
                          </div>
                          <div className="consent-actions">
                            {consent.pdf_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(consent.pdf_url, `${typeName} Consent`); }} className="btn-secondary-sm">View PDF</button>}
                            {consent.signature_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(consent.signature_url, 'Signature'); }} className="btn-text">Signature</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Intake Forms Section */}
              <section className="card">
                <div className="card-header">
                  <h3>Intake Forms ({intakes.length})</h3>
                </div>
                {intakes.length === 0 ? (
                  <div className="empty">No intake forms found</div>
                ) : (
                  <div className="intake-list full">
                    {intakes.map(intake => (
                      <div key={intake.id} className="intake-card" onClick={() => intake.pdf_url && openPdfViewer(intake.pdf_url, `${intake.first_name} ${intake.last_name} — Medical Intake`)}>
                        <div className="intake-header">
                          <span className="intake-icon">📋</span>
                          <div>
                            <strong>{intake.first_name} {intake.last_name}</strong>
                            <span>{formatDate(intake.submitted_at)}</span>
                          </div>
                        </div>
                        <div className="intake-details">
                          <span>{intake.email}</span>
                          <span>{formatPhone(intake.phone)}</span>
                          {intake.date_of_birth && <span>DOB: {formatDate(intake.date_of_birth)}</span>}
                        </div>
                        <div className="intake-actions">
                          {intake.pdf_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(intake.pdf_url, `${intake.first_name} ${intake.last_name} — Medical Intake`); }} className="btn-secondary-sm">View PDF</button>}
                          {intake.photo_id_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(intake.photo_id_url, 'Photo ID'); }} className="btn-text">Photo ID</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Medical Documents Section */}
              <section className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Uploaded Documents ({medicalDocuments.length})</h3>
                  <button className="btn-primary-sm" onClick={() => { setDocUploadForm({ file: null, documentName: '', documentType: 'MRI Report', notes: '' }); setDocUploadError(null); setShowDocUploadModal(true); }}>
                    + Upload Document
                  </button>
                </div>
                {medicalDocuments.length === 0 ? (
                  <div className="empty">No documents uploaded yet. Click "Upload Document" to add MRI reports, imaging, referrals, and more.</div>
                ) : (
                  <div className="document-list">
                    {medicalDocuments.map(doc => (
                      <div key={doc.id} className="document-card">
                        <div className="document-header">
                          <span className="document-icon">{
                            (doc.document_type || '').toLowerCase().includes('mri') ? '🧠' :
                            (doc.document_type || '').toLowerCase().includes('imaging') ? '📷' :
                            (doc.document_type || '').toLowerCase().includes('referral') ? '📨' :
                            (doc.document_type || '').toLowerCase().includes('insurance') ? '🏥' :
                            (doc.document_type || '').toLowerCase().includes('lab') ? '🔬' : '📄'
                          }</span>
                          <div>
                            <strong>{doc.document_name || 'Document'}</strong>
                            <span className="document-type">{doc.document_type || 'General'}</span>
                          </div>
                        </div>
                        {doc.notes && <div style={{ padding: '4px 12px 0', fontSize: 12, color: '#666' }}>{doc.notes}</div>}
                        <div className="document-details">
                          <span>{formatDate(doc.uploaded_at)}</span>
                          {doc.uploaded_by && <span>by {doc.uploaded_by}</span>}
                          {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                        </div>
                        <div className="document-actions" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {doc.document_url && <button onClick={() => openPdfViewer(doc.document_url, doc.document_name || 'Document')} className="btn-secondary-sm">View</button>}
                          {doc.document_url && (
                            <button onClick={() => { setSendDocModal({ open: true, url: doc.document_url, name: doc.document_name || 'Document', type: doc.document_type || 'document' }); setSendDocMethod('both'); setSendDocResult(null); }}
                              className="btn-secondary-sm" style={{ fontSize: 11, padding: '3px 8px' }}>
                              Send
                            </button>
                          )}
                          <button onClick={() => handleDeleteMedicalDoc(doc.id)} className="btn-secondary-sm" style={{ fontSize: 11, padding: '3px 8px', color: '#dc2626' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <>
              <div className="timeline-filters">
                {['all', 'services', 'protocols', 'documents', 'appointments', 'communications'].map(f => (
                  <button
                    key={f}
                    className={timelineFilter === f ? 'filter-chip active' : 'filter-chip'}
                    onClick={() => { setTimelineFilter(f); fetchTimeline(f); }}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <section className="card">
                {timelineLoading ? (
                  <div className="empty">Loading timeline...</div>
                ) : timeline.length === 0 ? (
                  <div className="empty">No events found</div>
                ) : (
                  <div className="timeline-list">
                    {timeline.map((event, idx) => {
                      const typeIcons = {
                        service: { icon: '💊', color: '#7c3aed' },
                        protocol_created: { icon: '📋', color: '#2563eb' },
                        consent_signed: { icon: '✍️', color: '#059669' },
                        intake_submitted: { icon: '📝', color: '#d97706' },
                        appointment: { icon: '📅', color: '#0891b2' },
                        communication: { icon: '💬', color: '#6366f1' },
                        note: { icon: '📌', color: '#64748b' }
                      };
                      const style = typeIcons[event.type] || { icon: '•', color: '#6b7280' };

                      return (
                        <div key={`${event.type}-${event.metadata?.id || idx}`} className="timeline-event">
                          <div className="timeline-dot" style={{ background: style.color }}>{style.icon}</div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-title">{event.title}</span>
                              <span className="timeline-date">{formatDate(event.date)}</span>
                            </div>
                            {event.detail && <div className="timeline-detail">{event.detail}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Visits Tab (Appointments + Sessions) */}
          {activeTab === 'appointments' && (
            <>
              {/* Vitals Flowsheet (PF-style: dates as columns) */}
              {vitalsHistory.length > 0 && (() => {
                const fmtHt = (inches) => {
                  if (!inches) return null;
                  const ft = Math.floor(inches / 12);
                  const inn = Math.round(inches % 12);
                  return `${ft}'${inn}"`;
                };
                // Show all vitals history (up to 10 columns)
                const displayVitals = vitalsHistory.slice(0, 10).reverse();
                const vitalRows = [
                  { label: 'Height', key: 'height_inches', fmt: (v) => fmtHt(v) },
                  { label: 'Weight', key: 'weight_lbs', fmt: (v) => v ? `${v} lb` : null },
                  { label: 'BMI', key: 'bmi', fmt: (v) => v ? `${v}` : null },
                  { label: 'BP', key: 'bp_systolic', fmt: (v, row) => (row.bp_systolic && row.bp_diastolic) ? `${row.bp_systolic}/${row.bp_diastolic}` : null },
                  { label: 'Temperature', key: 'temperature', fmt: (v) => v ? `${v}°F` : null },
                  { label: 'Pulse', key: 'pulse', fmt: (v) => v ? `${v}` : null },
                  { label: 'Resp. Rate', key: 'respiratory_rate', fmt: (v) => v ? `${v}` : null },
                  { label: 'O2 Sat', key: 'o2_saturation', fmt: (v) => v ? `${v}%` : null },
                ];
                return (
                  <section className="card" style={{ marginBottom: '16px' }}>
                    <div className="card-header">
                      <h3>Vitals Flowsheet</h3>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{vitalsHistory.length} record{vitalsHistory.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '0 0 12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '11px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, minWidth: '100px' }}></th>
                            {displayVitals.map((v, i) => {
                              const d = new Date(v.recorded_at);
                              return (
                                <th key={v.id || i} style={{ padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600, color: '#64748b', minWidth: '75px' }}>
                                  <div>{d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</div>
                                  <div style={{ fontSize: '10px', fontWeight: 400, color: '#94a3b8', marginTop: '1px' }}>
                                    {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {vitalRows.map((vr, ri) => (
                            <tr key={vr.label} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fafbfc' : '#fff' }}>
                              <td style={{ padding: '7px 12px', fontWeight: 600, fontSize: '12px', color: '#475569', position: 'sticky', left: 0, background: ri % 2 === 0 ? '#fafbfc' : '#fff', zIndex: 1 }}>
                                {vr.label}
                              </td>
                              {displayVitals.map((v, ci) => {
                                const val = vr.fmt(v[vr.key], v);
                                return (
                                  <td key={v.id || ci} style={{ padding: '7px 10px', textAlign: 'center', fontSize: '13px', color: val ? '#334155' : '#d4d4d8' }}>
                                    {val || '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })()}

              {/* Appointments Section */}
              <section className="card">
                <div className="card-header">
                  <h3>Appointments ({appointments.length})</h3>
                </div>
                {appointments.length === 0 ? (
                  <div className="empty">No appointments found</div>
                ) : (
                  <div className="appointments-list">
                    {appointments.map(apt => {
                      const aptDate = new Date(apt.start_time);
                      const isPast = aptDate < new Date();
                      const isUpcoming = !isPast;
                      const cutoffDate = new Date('2026-03-07T00:00:00-08:00');
                      let displayStatus = (apt.status || 'scheduled').toLowerCase();
                      // Past appointments before March 7 show as "completed"
                      if (aptDate < cutoffDate && ['scheduled', 'confirmed', 'showed'].includes(displayStatus)) {
                        displayStatus = 'completed';
                      }
                      const statusColors = {
                        scheduled: { bg: '#fef3c7', text: '#92400e' },
                        confirmed: { bg: '#dbeafe', text: '#1e40af' },
                        checked_in: { bg: '#fef9c3', text: '#854d0e' },
                        in_progress: { bg: '#e0e7ff', text: '#3730a3' },
                        showed: { bg: '#dcfce7', text: '#166534' },
                        completed: { bg: '#dcfce7', text: '#166534' },
                        no_show: { bg: '#fee2e2', text: '#dc2626' },
                        cancelled: { bg: '#f3f4f6', text: '#6b7280' }
                      };
                      const statusStyle = statusColors[displayStatus] || statusColors.scheduled;

                      return (
                        <div key={apt.id || `${apt.start_time}-${apt.calendar_name}`} className={`appointment-row ${isUpcoming ? 'upcoming' : 'past'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setEditingAppointment(apt);
                            setAptEditStatus(displayStatus);
                            setAptEditNotes(apt.notes || '');
                            setAptEditCategory(apt.appointment_title || apt.service_category || '');
                          }}
                        >
                          <div className="apt-date">
                            <div className="apt-day">{aptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}</div>
                            <div className="apt-time">{aptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })}</div>
                          </div>
                          <div className="apt-details">
                            <strong>{apt.calendar_name || 'Appointment'}</strong>
                            {apt.appointment_title && apt.appointment_title !== apt.calendar_name && (
                              <span className="apt-title">{apt.appointment_title}</span>
                            )}
                            {apt.provider && (
                              <span className="apt-title" style={{ color: '#6366f1', fontSize: '12px' }}>
                                {apt.provider}
                              </span>
                            )}
                            {apt.duration_minutes && (
                              <span className="apt-title" style={{ color: '#6b7280', fontSize: '12px' }}>
                                {apt.duration_minutes} min
                              </span>
                            )}
                            {apt.notes && (
                              <span className="apt-title" style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
                                {apt.notes}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {apt.encounter_note_count > 0 && (
                              <span style={{ padding: '2px 6px', borderRadius: 0, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#5b21b6' }}>
                                📝 {apt.encounter_note_count}
                              </span>
                            )}
                            <div style={{ position: 'relative' }}>
                              <span
                                className="apt-status"
                                style={{
                                  background: statusStyle.bg,
                                  color: statusStyle.text,
                                  cursor: (VALID_TRANSITIONS[apt.status || 'scheduled'] || []).length > 0 ? 'pointer' : 'default',
                                  userSelect: 'none',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const realStatus = apt.status || 'scheduled';
                                  if ((VALID_TRANSITIONS[realStatus] || []).length > 0) {
                                    setStatusDropdownAptId(statusDropdownAptId === apt.id ? null : apt.id);
                                  }
                                }}
                              >
                                {updatingAptStatus === apt.id ? '...' : displayStatus.replace('_', ' ')}
                                {(VALID_TRANSITIONS[apt.status || 'scheduled'] || []).length > 0 && ' ▾'}
                              </span>
                              {statusDropdownAptId === apt.id && (
                                <div style={{
                                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 0,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50,
                                  minWidth: 150, overflow: 'hidden',
                                }}>
                                  {(VALID_TRANSITIONS[apt.status || 'scheduled'] || []).map(s => {
                                    const sc = statusColors[s] || statusColors.scheduled;
                                    return (
                                      <div
                                        key={s}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(apt, s); }}
                                        style={{
                                          padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                                          display: 'flex', alignItems: 'center', gap: 8,
                                          borderBottom: '1px solid #f3f4f6',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <span style={{
                                          width: 8, height: 8, borderRadius: '50%',
                                          background: sc.text, flexShrink: 0,
                                        }} />
                                        {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Session History Section */}
              <section className="card" style={{ marginTop: '16px' }}>
                <div className="card-header">
                  <h3>Session History ({serviceLogs.length})</h3>
                </div>
                {serviceLogs.length === 0 ? (
                  <div className="empty">No sessions logged yet</div>
                ) : (
                  <div className="appointments-list">
                    {[...serviceLogs]
                      .sort((a, b) => new Date(b.entry_date || b.created_at) - new Date(a.entry_date || a.created_at))
                      .map(log => {
                        // Parse date-only strings timezone-safe (avoid UTC midnight shift)
                        const rawDate = log.entry_date || log.created_at;
                        const logDate = rawDate && rawDate.length === 10
                          ? new Date(rawDate + 'T12:00:00')
                          : new Date(rawDate);
                        const categoryLabels = {
                          hbot: 'HBOT', red_light: 'Red Light', iv_therapy: 'IV Therapy',
                          vitamin: 'Range Injection', testosterone: 'HRT', weight_loss: 'Weight Loss',
                          peptide: 'Peptide', supplement: 'Supplement'
                        };
                        const categoryColors = {
                          hbot: { bg: '#e0e7ff', text: '#3730a3' },
                          red_light: { bg: '#fee2e2', text: '#dc2626' },
                          iv_therapy: { bg: '#ffedd5', text: '#c2410c' },
                          vitamin: { bg: '#fef9c3', text: '#854d0e' },
                          testosterone: { bg: '#f3e8ff', text: '#7c3aed' },
                          weight_loss: { bg: '#dbeafe', text: '#1e40af' },
                          peptide: { bg: '#dcfce7', text: '#166534' }
                        };
                        const cat = log.category || '';
                        const catLabel = categoryLabels[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Session';
                        const catStyle = categoryColors[cat] || { bg: '#f3f4f6', text: '#374151' };
                        const entryType = log.entry_type || 'session';

                        return (
                          <div key={log.id} className="appointment-row past">
                            <div className="apt-date">
                              <div className="apt-day">{logDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                              <div className="apt-time" style={{ textTransform: 'capitalize' }}>{entryType}</div>
                            </div>
                            <div className="apt-details">
                              <strong>{log.medication || catLabel}</strong>
                              {log.dosage && <span className="apt-title">{log.dosage}</span>}
                              {log.fulfillment_method === 'overnight' && (
                                <span className="apt-title" style={{ color: '#1e40af', fontSize: '12px', fontWeight: 600 }}>
                                  📦 Overnighted{log.tracking_number ? ` · Tracking: ${log.tracking_number}` : ''}
                                </span>
                              )}
                              {log.fulfillment_method === 'in_clinic' && (
                                <span className="apt-title" style={{ color: '#166534', fontSize: '12px', fontWeight: 600 }}>🏥 Picked up in clinic</span>
                              )}
                              {log.notes && <span className="apt-title" style={{ color: '#6b7280', fontSize: '12px' }}>{log.notes}</span>}
                            </div>
                            <span className="apt-status" style={{ background: catStyle.bg, color: catStyle.text }}>
                              {catLabel}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (() => {
            // Categorize notes — use note_category if available, fall back to source-based logic
            const getCat = (n) => n.note_category || (
              ['encounter', 'addendum', 'protocol'].includes(n.source) ? 'clinical' : 'internal'
            );
            const clinicalNotes = notes.filter(n => getCat(n) === 'clinical');
            const internalNotes = notes.filter(n => getCat(n) === 'internal');
            const filteredNotes = noteFilter === 'clinical' ? clinicalNotes : internalNotes;

            return (
            <>
              {/* Log Encounter — always visible, primary action */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', marginBottom: 16, borderRadius: 0,
                background: '#111827', color: '#fff',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  📋 Need to document a patient encounter?
                </div>
                <button
                  onClick={() => setShowStandaloneEncounterModal(true)}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 0,
                    background: '#fff', color: '#111827', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  Log Encounter
                </button>
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setNoteFilter('clinical')}
                  style={{
                    padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 0,
                    border: noteFilter === 'clinical' ? '2px solid #059669' : '1.5px solid #d1d5db',
                    background: noteFilter === 'clinical' ? '#ecfdf5' : '#fff',
                    color: noteFilter === 'clinical' ? '#059669' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  🩺 Clinical Notes ({clinicalNotes.length})
                </button>
                <button
                  onClick={() => setNoteFilter('internal')}
                  style={{
                    padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 0,
                    border: noteFilter === 'internal' ? '2px solid #2563eb' : '1.5px solid #d1d5db',
                    background: noteFilter === 'internal' ? '#eff6ff' : '#fff',
                    color: noteFilter === 'internal' ? '#2563eb' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  📝 Staff Notes ({internalNotes.length})
                </button>
              </div>

              {/* Description banner */}
              <div style={{
                padding: '10px 14px', marginBottom: 16, borderRadius: 0, fontSize: 12, lineHeight: 1.5,
                background: noteFilter === 'clinical' ? '#f0fdf4' : '#eff6ff',
                color: noteFilter === 'clinical' ? '#166534' : '#1e40af',
                border: `1px solid ${noteFilter === 'clinical' ? '#bbf7d0' : '#bfdbfe'}`,
              }}>
                {noteFilter === 'clinical'
                  ? '🩺 Clinical notes are part of the patient\'s medical chart — encounter notes, signed notes, and protocol notes. These are included when printing or exporting the chart. To add a clinical note, use "Log Encounter" above.'
                  : '📝 Staff notes are for internal use only — patient experience, operational notes, reminders. These are NOT included in the patient\'s medical chart. Do NOT log encounter notes here.'}
              </div>

              <section className="card">
                <div className="card-header">
                  <h3>{noteFilter === 'clinical' ? 'Clinical Notes' : 'Staff Notes'} ({filteredNotes.length})</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {noteFilter === 'internal' && (
                      <button className="btn-primary-sm" onClick={() => { setAddNoteCategory('internal'); setShowAddNoteModal(true); }}>
                        + Add Staff Note
                      </button>
                    )}
                  </div>
                </div>
                {filteredNotes.length === 0 ? (
                  <div className="empty">No {noteFilter === 'clinical' ? 'clinical' : 'staff'} notes yet</div>
                ) : (
                  <div className="notes-list">
                    {filteredNotes.map(note => (
                      <div key={note.id} className="note-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="note-date">
                            {formatDate(note.note_date || note.created_at)}
                            {note.created_by && <span style={{ fontWeight: 400, marginLeft: 8 }}>by {getStaffDisplayName(note.created_by)}</span>}
                            <span style={{
                              marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 0, fontWeight: 500,
                              background: note.source === 'encounter' ? '#fef3c7' : note.source === 'addendum' ? '#fef3c7' : note.source === 'protocol' ? '#f3e8ff' : note.source === 'manual' ? '#dbeafe' : '#f3f4f6',
                              color: note.source === 'encounter' ? '#92400e' : note.source === 'addendum' ? '#92400e' : note.source === 'protocol' ? '#7c3aed' : note.source === 'manual' ? '#1e40af' : '#6b7280',
                            }}>
                              {note.source === 'encounter' ? 'Encounter' : note.source === 'addendum' ? 'Addendum' : note.source === 'protocol' ? 'Protocol Note' : note.source === 'manual' ? 'Staff Note' : 'GHL Import'}
                            </span>
                            {note.encounter_service && (
                              <span style={{
                                marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 0, fontWeight: 500,
                                background: '#ede9fe', color: '#5b21b6',
                              }}>
                                {note.encounter_service.replace(/\b\w/g, l => l.toUpperCase())} Note
                              </span>
                            )}
                            {note.status && (
                              <span style={{
                                marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 0, fontWeight: 500,
                                background: note.status === 'signed' ? '#d1fae5' : '#f3f4f6',
                                color: note.status === 'signed' ? '#065f46' : '#6b7280',
                              }}>
                                {note.status === 'signed' ? '✓ Signed' : 'Draft'}
                              </span>
                            )}
                            {note.protocol_name && (
                              <span
                                style={{
                                  marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 0, fontWeight: 500,
                                  background: '#f0f9ff', color: '#0369a1',
                                }}
                              >
                                {note.protocol_name}
                              </span>
                            )}
                            {note.pinned && (
                              <span style={{
                                marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 0, fontWeight: 500,
                                background: '#fef3c7', color: '#92400e',
                              }}>
                                📌 Pinned
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                              onClick={() => { setEditingNote(note); setEditNoteBody(note.body || ''); }}
                              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1 }}
                              title="Edit note"
                            >✏️</button>
                            <button
                              onClick={() => handleTogglePin(note.id, note.pinned)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: note.pinned ? '#d97706' : '#999',
                                cursor: 'pointer',
                                fontSize: 16,
                                padding: '0 4px',
                                lineHeight: 1,
                              }}
                              title={note.pinned ? 'Unpin note' : 'Pin note'}
                            >📌</button>
                            {note.status !== 'signed' && canDeleteNote(note) && (
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
                                title="Delete note"
                              >×</button>
                            )}
                          </div>
                        </div>
                        <div
                          className="note-body"
                          style={{
                            maxHeight: expandedNotes[note.id] ? 'none' : '120px',
                            overflow: 'hidden',
                            cursor: note.body && note.body.length > 200 ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (note.body && note.body.length > 200) {
                              setExpandedNotes(prev => ({ ...prev, [note.id]: !prev[note.id] }));
                            }
                          }}
                        >
                          {renderFormattedText(note.body)}
                        </div>
                        {note.body && note.body.length > 200 && !expandedNotes[note.id] && (
                          <button
                            onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: true }))}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: '4px 0' }}
                          >
                            Show more ↓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
            );
          })()}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              <section className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Tasks ({patientTasks.length})</h3>
                  <button
                    onClick={() => { setShowCreateTask(true); if (taskEmployees.length === 0) fetchTaskEmployees(); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                      color: '#fff', background: '#111', border: 'none', borderRadius: 0,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Task
                  </button>
                </div>
                {patientTasks.length === 0 ? (
                  <div className="empty">No tasks linked to this patient</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Pending tasks first, then completed */}
                    {[...patientTasks].sort((a, b) => {
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (a.status !== 'pending' && b.status === 'pending') return 1;
                      return new Date(b.created_at) - new Date(a.created_at);
                    }).map(task => {
                      const isExpanded = expandedTaskId === task.id;
                      const isCompleted = task.status === 'completed';
                      const isOverdue = !isCompleted && task.due_date && new Date(task.due_date + 'T23:59:59') < new Date();
                      const priorityColors = {
                        urgent: { bg: '#fef2f2', color: '#dc2626', label: 'Urgent' },
                        high: { bg: '#fff7ed', color: '#ea580c', label: 'High' },
                        medium: { bg: '#eff6ff', color: '#2563eb', label: 'Medium' },
                        low: { bg: '#f0fdf4', color: '#16a34a', label: 'Low' },
                      };
                      const pri = priorityColors[task.priority] || priorityColors.medium;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            background: isExpanded ? '#fafbff' : (isCompleted ? '#fafafa' : '#fff'),
                            borderLeft: isExpanded ? '3px solid #3b82f6' : '3px solid transparent',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Collapsed row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              fontSize: 11,
                              transition: 'transform 0.15s ease',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              color: '#999',
                            }}>▶</span>
                            <span style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: isCompleted ? '#16a34a' : (isOverdue ? '#dc2626' : '#d97706'),
                              flexShrink: 0,
                            }} />
                            <span style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: 500,
                              color: isCompleted ? '#9ca3af' : '#1f2937',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              overflow: isExpanded ? 'visible' : 'hidden',
                              textOverflow: isExpanded ? 'unset' : 'ellipsis',
                              whiteSpace: isExpanded ? 'normal' : 'nowrap',
                            }}>
                              {task.title}
                            </span>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 0,
                              background: pri.bg,
                              color: pri.color,
                              flexShrink: 0,
                            }}>{pri.label}</span>
                            {isOverdue && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', flexShrink: 0 }}>OVERDUE</span>
                            )}
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div style={{ marginTop: 12, marginLeft: 24 }}>
                              {task.description && (
                                <div style={{
                                  background: '#f3f4f6',
                                  borderRadius: 0,
                                  padding: '10px 14px',
                                  fontSize: 13,
                                  color: '#374151',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  marginBottom: 12,
                                }}>
                                  {task.description}
                                </div>
                              )}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 13, color: '#6b7280' }}>
                                <span><strong>Assigned to:</strong> {task.assigned_to_name}</span>
                                <span><strong>Created by:</strong> {task.assigned_by_name}</span>
                                <span><strong>Status:</strong> {isCompleted ? '✓ Completed' : '○ Pending'}</span>
                                {task.due_date && <span><strong>Due:</strong> {formatDate(task.due_date)}</span>}
                                <span><strong>Created:</strong> {formatDate(task.created_at)}</span>
                                {task.completed_at && <span><strong>Completed:</strong> {formatDate(task.completed_at)}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Create Task Modal */}
              {showCreateTask && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => { setShowCreateTask(false); stopTaskListening(); }}>
                  <div style={{
                    background: '#fff', borderRadius: 0, width: '100%', maxWidth: '520px',
                    maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }} onClick={e => e.stopPropagation()}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
                    }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>New Task</h2>
                      <button onClick={() => { setShowCreateTask(false); stopTaskListening(); }} style={{
                        background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999',
                      }}>&#10005;</button>
                    </div>
                    <form onSubmit={handleCreateTask}>
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Title with Voice + AI Format */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Task</label>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <button
                                type="button"
                                onClick={() => taskListening && taskDictationTarget === 'title' ? stopTaskListening() : startTaskListening('title')}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                  color: taskListening && taskDictationTarget === 'title' ? '#fff' : '#dc2626',
                                  background: taskListening && taskDictationTarget === 'title' ? '#dc2626' : '#fef2f2',
                                  border: '1px solid', borderColor: taskListening && taskDictationTarget === 'title' ? '#dc2626' : '#fecaca',
                                  borderRadius: 0, cursor: 'pointer',
                                  animation: taskListening && taskDictationTarget === 'title' ? 'pulse 1.5s infinite' : 'none',
                                }}
                              >
                                {taskListening && taskDictationTarget === 'title' ? '⏹ Stop' : '🎙 Dictate'}
                              </button>
                              <button
                                type="button"
                                onClick={handleTaskFormat}
                                disabled={taskFormatting || (!taskForm.title.trim() && !taskForm.description.trim())}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                  color: taskFormatting ? '#9ca3af' : '#7c3aed',
                                  background: taskFormatting ? '#f3f4f6' : '#f5f3ff',
                                  border: '1px solid', borderColor: taskFormatting ? '#e5e7eb' : '#ddd6fe',
                                  borderRadius: 0,
                                  cursor: taskFormatting || (!taskForm.title.trim() && !taskForm.description.trim()) ? 'not-allowed' : 'pointer',
                                  opacity: (!taskForm.title.trim() && !taskForm.description.trim()) ? 0.5 : 1,
                                }}
                              >
                                ✨ {taskFormatting ? 'Formatting...' : 'AI Format'}
                              </button>
                            </div>
                          </div>
                          {taskListening && taskDictationTarget === 'title' && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 10px', marginBottom: '6px',
                              background: '#fef2f2', borderRadius: 0,
                              fontSize: '12px', color: '#dc2626', fontWeight: 500,
                            }}>
                              <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#dc2626', animation: 'pulse 1s infinite',
                              }} />
                              Listening... speak now
                            </div>
                          )}
                          <input
                            type="text"
                            value={taskForm.title}
                            onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Type or tap Dictate to speak your task..."
                            style={{
                              width: '100%', padding: '10px 12px', fontSize: '14px',
                              border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                              boxSizing: 'border-box',
                              ...(taskListening && taskDictationTarget === 'title' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                            }}
                            autoFocus
                            required
                          />
                        </div>

                        {/* Description with Voice */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Details (optional)</label>
                            <button
                              type="button"
                              onClick={() => taskListening && taskDictationTarget === 'description' ? stopTaskListening() : startTaskListening('description')}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                                color: taskListening && taskDictationTarget === 'description' ? '#fff' : '#dc2626',
                                background: taskListening && taskDictationTarget === 'description' ? '#dc2626' : '#fef2f2',
                                border: '1px solid', borderColor: taskListening && taskDictationTarget === 'description' ? '#dc2626' : '#fecaca',
                                borderRadius: 0, cursor: 'pointer', marginBottom: '6px',
                              }}
                            >
                              {taskListening && taskDictationTarget === 'description' ? '⏹ Stop' : '🎙 Dictate'}
                            </button>
                          </div>
                          {taskListening && taskDictationTarget === 'description' && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 10px', marginBottom: '6px',
                              background: '#fef2f2', borderRadius: 0,
                              fontSize: '12px', color: '#dc2626', fontWeight: 500,
                            }}>
                              <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#dc2626', animation: 'pulse 1s infinite',
                              }} />
                              Listening... speak now
                            </div>
                          )}
                          <textarea
                            value={taskForm.description}
                            onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional details..."
                            style={{
                              width: '100%', padding: '10px 12px', fontSize: '14px',
                              border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                              resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                              minHeight: '80px', boxSizing: 'border-box',
                              ...(taskListening && taskDictationTarget === 'description' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                            }}
                          />
                        </div>

                        {/* Assign to */}
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Assign to</label>
                          <select
                            value={taskForm.assigned_to}
                            onChange={e => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                            style={{
                              width: '100%', padding: '10px 12px', fontSize: '14px',
                              border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                              boxSizing: 'border-box', background: '#fff',
                            }}
                            required
                          >
                            <option value="">Select team member...</option>
                            {taskEmployees
                              .filter(e => e.is_active !== false)
                              .map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.name}{e.id === employee?.id ? ' (Me)' : ''}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Priority + Due Date row */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Priority</label>
                            <select
                              value={taskForm.priority}
                              onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                              style={{
                                width: '100%', padding: '10px 12px', fontSize: '14px',
                                border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                                boxSizing: 'border-box', background: '#fff',
                              }}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Due Date (optional)</label>
                            <input
                              type="date"
                              value={taskForm.due_date}
                              onChange={e => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                              style={{
                                width: '100%', padding: '10px 12px', fontSize: '14px',
                                border: '1px solid #d1d5db', borderRadius: 0, outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        {/* Patient pre-linked */}
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Linked Patient</label>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px', background: '#f0f9ff', borderRadius: 0,
                            border: '1px solid #bae6fd',
                          }}>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>
                              {patient ? `${patient.first_name} ${patient.last_name}` : 'This patient'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: '10px',
                        padding: '14px 20px', borderTop: '1px solid #e5e7eb',
                      }}>
                        <button type="button" onClick={() => { setShowCreateTask(false); stopTaskListening(); }} style={{
                          padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                          color: '#374151', background: '#fff', border: '1px solid #d1d5db',
                          borderRadius: 0, cursor: 'pointer',
                        }}>
                          Cancel
                        </button>
                        <button type="submit" disabled={creatingTask} style={{
                          padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                          color: '#fff', background: '#111', border: 'none', borderRadius: 0,
                          cursor: creatingTask ? 'not-allowed' : 'pointer',
                          opacity: creatingTask ? 0.6 : 1,
                        }}>
                          {creatingTask ? 'Creating...' : 'Create Task'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Symptoms Tab */}
          {activeTab === 'symptoms' && (() => {
            // Instrument definitions for display
            const INSTRUMENTS = {
              phq9: { label: 'PHQ-9', subtitle: 'Depression', maxScore: 27, levels: [
                { max: 4, label: 'Minimal', color: '#22c55e' },
                { max: 9, label: 'Mild', color: '#84cc16' },
                { max: 14, label: 'Moderate', color: '#eab308' },
                { max: 19, label: 'Moderately Severe', color: '#f97316' },
                { max: 27, label: 'Severe', color: '#ef4444' },
              ]},
              gad7: { label: 'GAD-7', subtitle: 'Anxiety', maxScore: 21, levels: [
                { max: 4, label: 'Minimal', color: '#22c55e' },
                { max: 9, label: 'Mild', color: '#84cc16' },
                { max: 14, label: 'Moderate', color: '#eab308' },
                { max: 21, label: 'Severe', color: '#ef4444' },
              ]},
              ams: { label: 'AMS', subtitle: 'Androgen Deficiency', maxScore: 85, levels: [
                { max: 26, label: 'None', color: '#22c55e' },
                { max: 36, label: 'Mild', color: '#84cc16' },
                { max: 49, label: 'Moderate', color: '#eab308' },
                { max: 85, label: 'Severe', color: '#ef4444' },
              ]},
              iief5: { label: 'IIEF-5', subtitle: 'Erectile Function', maxScore: 25, invert: true, levels: [
                { max: 7, label: 'Severe ED', color: '#ef4444' },
                { max: 11, label: 'Moderate ED', color: '#f97316' },
                { max: 16, label: 'Mild-Moderate ED', color: '#eab308' },
                { max: 21, label: 'Mild ED', color: '#84cc16' },
                { max: 25, label: 'Normal', color: '#22c55e' },
              ]},
              psqi: { label: 'Sleep Quality', subtitle: 'PSQI Simplified', maxScore: 9, levels: [
                { max: 3, label: 'Good', color: '#22c55e' },
                { max: 5, label: 'Fair', color: '#eab308' },
                { max: 9, label: 'Poor', color: '#ef4444' },
              ]},
              tfeq_r18: { label: 'TFEQ-R18', subtitle: 'Eating Behavior', maxScore: 72, levels: [
                { max: 30, label: 'Low', color: '#22c55e' },
                { max: 50, label: 'Moderate', color: '#eab308' },
                { max: 72, label: 'High', color: '#ef4444' },
              ]},
            };

            const getSeverity = (instrument, score) => {
              const inst = INSTRUMENTS[instrument];
              if (!inst) return { label: '—', color: '#888' };
              for (const level of inst.levels) {
                if (score <= level.max) return level;
              }
              return inst.levels[inst.levels.length - 1];
            };

            const selected = baselineQuestionnaires[selectedBaselineIdx] || baselineQuestionnaires[0];

            return (
            <>
              {baselineQuestionnaires.length === 0 ? (
                <section className="card">
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>No Baseline Assessments</h3>
                    <p style={{ color: '#888', fontSize: '14px', margin: '0 0 20px' }}>
                      This patient hasn&apos;t completed a baseline questionnaire yet. It&apos;s sent automatically after intake submission.
                    </p>
                  </div>
                </section>
              ) : (() => {
                const scores = selected?.scored_totals || {};
                const responses = selected?.responses || {};
                const door = selected?.door;
                const submittedDate = selected?.submitted_at ? new Date(selected.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending';
                const doorLabel = door === 1 ? 'Injury Baseline' : door === 2 ? 'Optimization Baseline' : door === 3 ? 'Combined Baseline' : 'Baseline';

                return (
                  <>
                    {/* History selector */}
                    {baselineQuestionnaires.length > 1 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {baselineQuestionnaires.map((bq, idx) => {
                          const d = bq.submitted_at ? new Date(bq.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `#${idx + 1}`;
                          const typeLabel = bq.door === 1 ? 'Injury' : bq.door === 2 ? 'Optimization' : 'Combined';
                          return (
                            <button
                              key={bq.id || idx}
                              onClick={() => setSelectedBaselineIdx(idx)}
                              style={{
                                padding: '6px 14px', borderRadius: 0, border: '1px solid',
                                borderColor: idx === selectedBaselineIdx ? '#000' : '#ddd',
                                background: idx === selectedBaselineIdx ? '#000' : '#fff',
                                color: idx === selectedBaselineIdx ? '#fff' : '#666',
                                fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >{d} — {typeLabel}</button>
                          );
                        })}
                      </div>
                    )}

                    {/* Header */}
                    <section className="card">
                      <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{doorLabel}</h3>
                          <span style={{ fontSize: '13px', color: '#888' }}>Submitted {submittedDate}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {selected?.status === 'completed' ? '✅ Completed' : '⏳ In Progress'} · Sections: {(selected?.sections_completed || []).length}
                        </div>
                        {responses.primary_goal && (
                          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f9fafb', borderRadius: 0, border: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Patient Goal</div>
                            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>{responses.primary_goal}</div>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Injury Baseline (Door 1 or 3) */}
                    {(door === 1 || door === 3) && (
                      <section className="card" style={{ marginTop: '12px' }}>
                        <div className="card-header"><h3>Injury Baseline</h3></div>
                        <div style={{ padding: '4px 20px 16px' }}>
                          {[
                            { label: 'Pain Severity', value: responses.pain_severity, max: 10, invertColor: true },
                            { label: 'Functional Limitation', value: responses.functional_limitation, max: 10, invertColor: true },
                          ].map(item => {
                            if (item.value == null) return null;
                            const pct = (item.value / item.max) * 100;
                            const barColor = item.invertColor
                              ? (item.value <= 3 ? '#22c55e' : item.value <= 6 ? '#eab308' : '#ef4444')
                              : (item.value >= 7 ? '#22c55e' : item.value >= 4 ? '#eab308' : '#ef4444');
                            return (
                              <div key={item.label} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>{item.label}</span>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: barColor }}>{item.value}/{item.max}</span>
                                </div>
                                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: 0, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 0 }} />
                                </div>
                              </div>
                            );
                          })}
                          {responses.trajectory && (
                            <div style={{ padding: '10px 0' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>Trajectory: </span>
                              <span style={{
                                fontSize: '13px', fontWeight: '600',
                                color: responses.trajectory === 'getting_better' ? '#22c55e' : responses.trajectory === 'getting_worse' ? '#ef4444' : '#eab308',
                              }}>
                                {responses.trajectory === 'getting_better' ? '↗ Getting Better' : responses.trajectory === 'getting_worse' ? '↘ Getting Worse' : '→ Staying the Same'}
                              </span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Scored Instruments (Door 2 or 3) */}
                    {(door === 2 || door === 3) && (
                      <>
                        {/* Score summary cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                          {Object.entries(scores).map(([key, data]) => {
                            const inst = INSTRUMENTS[key];
                            if (!inst || !data || data.score == null) return null;
                            const severity = getSeverity(key, data.score);
                            const pct = (data.score / inst.maxScore) * 100;
                            return (
                              <section key={key} className="card">
                                <div style={{ padding: '16px 20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{inst.label}</div>
                                      <div style={{ fontSize: '11px', color: '#888' }}>{inst.subtitle}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '20px', fontWeight: '700', color: severity.color, lineHeight: 1 }}>{data.score}</div>
                                      <div style={{ fontSize: '10px', color: '#aaa' }}>/{inst.maxScore}</div>
                                    </div>
                                  </div>
                                  <div style={{ height: '6px', background: '#f0f0f0', borderRadius: 0, overflow: 'hidden', marginBottom: '8px' }}>
                                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: severity.color, borderRadius: 0 }} />
                                  </div>
                                  <div style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: 0, fontSize: '11px', fontWeight: '600',
                                    background: severity.color + '18', color: severity.color,
                                  }}>{severity.label}</div>
                                </div>
                              </section>
                            );
                          })}
                        </div>

                        {/* Energy / Fatigue VAS */}
                        {responses.fatigue_vas != null && (
                          <section className="card" style={{ marginTop: '12px' }}>
                            <div style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Energy Level</span>
                                  <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>Fatigue VAS</span>
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: responses.fatigue_vas >= 7 ? '#22c55e' : responses.fatigue_vas >= 4 ? '#eab308' : '#ef4444' }}>{responses.fatigue_vas}/10</span>
                              </div>
                              <div style={{ height: '6px', background: '#f0f0f0', borderRadius: 0, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${responses.fatigue_vas * 10}%`, background: responses.fatigue_vas >= 7 ? '#22c55e' : responses.fatigue_vas >= 4 ? '#eab308' : '#ef4444', borderRadius: 0 }} />
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Sleep Details */}
                        {(responses.psqi_bedtime || responses.psqi_hours != null) && (
                          <section className="card" style={{ marginTop: '12px' }}>
                            <div className="card-header"><h3>Sleep Details</h3></div>
                            <div style={{ padding: '4px 20px 16px' }}>
                              {[
                                { label: 'Usual Bedtime', value: responses.psqi_bedtime },
                                { label: 'Hours of Sleep', value: responses.psqi_hours != null ? `${responses.psqi_hours} hours` : null },
                                { label: 'Sleep Quality', value: responses.psqi_quality != null ? ['Very Good', 'Fairly Good', 'Fairly Bad', 'Very Bad'][responses.psqi_quality] : null },
                                { label: 'Sleep Disturbance', value: responses.psqi_disturbance != null ? ['None', 'Less than 1x/week', '1-2x/week', '3+ times/week'][responses.psqi_disturbance] : null },
                                { label: 'Daytime Dysfunction', value: responses.psqi_dysfunction != null ? ['None', 'Slight', 'Moderate', 'Severe'][responses.psqi_dysfunction] : null },
                              ].filter(r => r.value != null).map(r => (
                                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                                  <span style={{ fontSize: '13px', color: '#666' }}>{r.label}</span>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{r.value}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </>
            );
          })()}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              {/* Payments Sub-tabs */}
              <div className="pay-tabs">
                {[
                  { key: 'subscriptions', label: `Subscriptions${subscriptions.length > 0 ? ` (${subscriptions.filter(s => s.status === 'active' || s.status === 'past_due').length})` : ''}` },
                  { key: 'invoices', label: 'Invoices' },
                  { key: 'purchases', label: 'Purchases' },
                  { key: 'cards', label: `Cards${savedCards.length > 0 ? ` (${savedCards.length})` : ''}` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setPaymentsSubTab(tab.key); if (tab.key === 'purchases') fetchStripeCharges(); }}
                    className={`pay-tab ${paymentsSubTab === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subscriptions Sub-tab */}
              {paymentsSubTab === 'subscriptions' && (
                <div className="pay-section">
                  <div className="pay-section-header">
                    <h3>Subscriptions</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setShowNewSubForm(prev => !prev)} className="pay-btn-primary">
                        + New
                      </button>
                      <button
                        onClick={() => { if (!loadingStripeSubs) fetchStripeSubscriptions(); }}
                        className="pay-btn-secondary"
                      >
                        {loadingStripeSubs ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  {/* Create Subscription Form */}
                  {showNewSubForm && (
                    <div className="pay-new-sub-form">
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#166534' }}>New Subscription</div>

                      {/* Plan dropdown */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Subscription Plan</label>
                        <select
                          value=""
                          onChange={e => {
                            const plan = subPlans.find(p => p.id === e.target.value);
                            if (plan) {
                              setNewSubForm({
                                amount: (plan.price / 100).toString(),
                                interval: plan.interval || 'month',
                                description: plan.name,
                                service_category: plan.category || 'other',
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                        >
                          <option value="">{loadingSubPlans ? 'Loading plans...' : '-- Select a plan --'}</option>
                          {subPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} — ${(plan.price / 100).toFixed(0)}/{plan.interval === 'year' ? 'yr' : plan.interval === 'week' ? 'wk' : 'mo'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Editable fields (auto-filled from plan, but adjustable) */}
                      {newSubForm.description && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Amount ($)</label>
                            <input
                              type="number" step="0.01" min="0" placeholder="250"
                              value={newSubForm.amount}
                              onChange={e => setNewSubForm(f => ({ ...f, amount: e.target.value }))}
                              style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Interval</label>
                            <select
                              value={newSubForm.interval}
                              onChange={e => setNewSubForm(f => ({ ...f, interval: e.target.value }))}
                              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                            >
                              <option value="month">Monthly</option>
                              <option value="year">Yearly</option>
                              <option value="week">Weekly</option>
                            </select>
                          </div>
                          <div style={{ flex: 1, minWidth: 150 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Description</label>
                            <input
                              type="text" placeholder="e.g. Male HRT Membership"
                              value={newSubForm.description}
                              onChange={e => setNewSubForm(f => ({ ...f, description: e.target.value }))}
                              style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}

                      {savedCards.length === 0 && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                          No card on file — add one under Cards first
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleCreateSubscription} disabled={creatingSub || savedCards.length === 0 || !newSubForm.description} className="pay-btn-primary" style={{ padding: '8px 20px', fontSize: 13, opacity: (creatingSub || savedCards.length === 0 || !newSubForm.description) ? 0.5 : 1 }}>
                          {creatingSub ? 'Creating...' : 'Start Subscription'}
                        </button>
                        <button onClick={() => { setShowNewSubForm(false); setNewSubForm({ amount: '', interval: 'month', description: '', service_category: 'hrt' }); }} className="pay-btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {stripeSubscriptions.length === 0 && !loadingStripeSubs ? (
                    <div className="pay-empty">
                      No subscriptions found
                      <div style={{ marginTop: 8 }}>
                        <button onClick={fetchStripeSubscriptions} className="pay-btn-secondary">Load from Stripe</button>
                      </div>
                    </div>
                  ) : (
                    <div className="pay-list">
                      {stripeSubscriptions.map(sub => {
                        const isPastDue = sub.status === 'past_due';
                        const isPaused = !!sub.pause_collection;
                        const isCanceled = sub.status === 'canceled';
                        const isCancelingAtEnd = sub.cancel_at_period_end;
                        const isActive = sub.status === 'active' && !isPaused && !isCancelingAtEnd;
                        const pm = sub.payment_method;
                        const inv = sub.latest_invoice;

                        const badgeClass = isPastDue ? 'pay-badge-red' : isPaused ? 'pay-badge-yellow' : isCanceled ? 'pay-badge-gray' : isCancelingAtEnd ? 'pay-badge-yellow' : 'pay-badge-green';
                        const statusLabel = isPastDue ? 'Past Due' : isPaused ? 'Paused' : isCanceled ? 'Canceled' : isCancelingAtEnd ? 'Canceling' : 'Active';

                        return (
                          <div key={sub.id} className={`pay-sub-card ${isPastDue ? 'past-due' : ''}`}>
                            <div className="pay-sub-header">
                              <div>
                                <div className="pay-sub-name">{sub.description || 'Subscription'}</div>
                                <div className="pay-sub-since">
                                  {sub.service_category && (
                                    <span className={`pay-badge ${sub.service_category === 'hrt' ? 'pay-badge-blue' : sub.service_category === 'weight_loss' ? 'pay-badge-yellow' : 'pay-badge-gray'}`} style={{ marginRight: 6 }}>
                                      {sub.service_category}
                                    </span>
                                  )}
                                  Since {new Date(sub.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                              <div>
                                <div className="pay-sub-price">
                                  ${(sub.amount_cents / 100).toFixed(0)}<span>/{sub.interval}</span>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 4 }}>
                                  <span className={`pay-badge ${badgeClass}`}>{statusLabel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pay-sub-details">
                              {pm && (
                                <div><strong>Card: </strong>{pm.brand.toUpperCase()} ···· {pm.last4} <span style={{ color: '#94a3b8' }}>({String(pm.exp_month).padStart(2, '0')}/{pm.exp_year})</span></div>
                              )}
                              {sub.current_period_end && !isCanceled && (
                                <div><strong>{isCancelingAtEnd ? 'Ends: ' : 'Renews: '}</strong>{new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              )}
                              {isCanceled && sub.canceled_at && (
                                <div><strong>Canceled: </strong>{new Date(sub.canceled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              )}
                            </div>

                            {isPastDue && inv && (
                              <div className="pay-sub-alert">
                                Payment failed — ${(inv.amount_due / 100).toFixed(2)} due
                                {inv.attempt_count > 1 && ` (${inv.attempt_count} attempts)`}
                                {inv.next_payment_attempt && (
                                  <span style={{ marginLeft: 8, fontSize: 11 }}>
                                    Next retry: {new Date(inv.next_payment_attempt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            )}

                            {!isCanceled && (
                              <div className="pay-sub-actions">
                                {savedCards.length > 0 && (
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const action = isPastDue ? 'retry_payment' : 'update_payment_method';
                                        handleSubAction(sub.id, action, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={!!subActionLoading}
                                    style={{
                                      border: '1px solid #e2e8f0', background: isPastDue ? '#16a34a' : '#fff',
                                      color: isPastDue ? '#fff' : '#475569', fontWeight: isPastDue ? 600 : 400,
                                    }}
                                  >
                                    <option value="">{isPastDue ? 'Retry with card...' : 'Change card...'}</option>
                                    {savedCards.map(card => (
                                      <option key={card.id} value={card.id}>
                                        {card.brand.toUpperCase()} ···· {card.last4} ({String(card.exp_month).padStart(2, '0')}/{card.exp_year})
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {isPastDue && (
                                  <button onClick={() => handleSubAction(sub.id, 'retry_payment')} disabled={!!subActionLoading}
                                    style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 600 }}>
                                    {subActionLoading === sub.id + '_retry_payment' ? 'Retrying...' : 'Retry Payment'}
                                  </button>
                                )}
                                {isActive && (
                                  <button onClick={() => handleSubAction(sub.id, 'pause')} disabled={!!subActionLoading}
                                    style={{ background: '#fff', color: '#f59e0b', border: '1px solid #fcd34d' }}>
                                    {subActionLoading === sub.id + '_pause' ? 'Pausing...' : 'Pause'}
                                  </button>
                                )}
                                {isPaused && (
                                  <button onClick={() => handleSubAction(sub.id, 'resume')} disabled={!!subActionLoading}
                                    style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 600 }}>
                                    {subActionLoading === sub.id + '_resume' ? 'Resuming...' : 'Resume'}
                                  </button>
                                )}
                                {isCancelingAtEnd && (
                                  <button onClick={() => handleSubAction(sub.id, 'undo_cancel')} disabled={!!subActionLoading}
                                    style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 600 }}>
                                    {subActionLoading === sub.id + '_undo_cancel' ? 'Undoing...' : 'Undo Cancel'}
                                  </button>
                                )}
                                {!isCancelingAtEnd && !isPaused && (
                                  <>
                                    <button onClick={() => handleCancelSubscription(sub.id, false)} disabled={!!subActionLoading}
                                      style={{ background: '#fff', color: '#6b7280', border: '1px solid #e2e8f0' }}>
                                      Cancel at Period End
                                    </button>
                                    <button onClick={() => handleCancelSubscription(sub.id, true)} disabled={!!subActionLoading}
                                      style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                      Cancel Now
                                    </button>
                                  </>
                                )}
                                {inv?.hosted_invoice_url && (
                                  <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer"
                                    style={{ background: '#fff', color: '#3b82f6', border: '1px solid #93c5fd', textDecoration: 'none', display: 'inline-block' }}>
                                    View Invoice
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Invoices Sub-tab */}
              {paymentsSubTab === 'invoices' && (
                <div className="pay-section">
                  <div className="pay-section-header">
                    <h3>Invoices ({invoices.length})</h3>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="pay-empty">No invoices found</div>
                  ) : (
                    <div className="pay-list">
                      {invoices.map(inv => {
                        const invStatus = (inv.status || 'pending').toLowerCase();
                        const badgeClass = invStatus === 'paid' ? 'pay-badge-green' : invStatus === 'overdue' ? 'pay-badge-red' : invStatus === 'pending' || invStatus === 'sent' ? 'pay-badge-yellow' : 'pay-badge-gray';
                        return (
                          <div key={inv.id} className="pay-item">
                            <div className="pay-item-info">
                              <div className="pay-item-title">{inv.description || inv.line_items?.[0]?.description || 'Invoice'}</div>
                              <div className="pay-item-sub">{formatDate(inv.created_at)}</div>
                            </div>
                            <div className="pay-item-amount">${(inv.total_amount || inv.amount || 0).toFixed(2)}</div>
                            <span className={`pay-badge ${badgeClass}`}>{invStatus}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Purchases Sub-tab — Stripe-powered payment history */}
              {paymentsSubTab === 'purchases' && (() => {
                // Build charge rows from Stripe data (actual amounts)
                const chargeRows = stripeCharges
                  .filter(c => c.status === 'succeeded')
                  .map(charge => ({
                    key: charge.id,
                    amount: charge.amount / 100,
                    amountRefunded: charge.amount_refunded / 100,
                    refunded: charge.refunded,
                    date: new Date(charge.created * 1000),
                    card_brand: charge.card_brand,
                    card_last4: charge.card_last4,
                    description: charge.description,
                    receipt_url: charge.receipt_url,
                  }));

                return (
                <div>
                  <div className="pay-section">
                    <div className="pay-section-header">
                      <h3>Payments ({chargeRows.length})</h3>
                      <button onClick={() => { setStripeChargesFetched(false); fetchStripeCharges(); }} className="pay-btn-secondary" style={{ fontSize: 11 }}>
                        {loadingStripeCharges ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    {loadingStripeCharges && chargeRows.length === 0 ? (
                      <div className="pay-empty">Loading payments from Stripe...</div>
                    ) : chargeRows.length === 0 ? (
                      <div className="pay-empty">No payments found</div>
                    ) : (
                      <div className="pay-list">
                        {chargeRows.map(charge => {
                          const dateStr = charge.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                          <div key={charge.key} className="pay-item">
                            <div className="pay-item-info">
                              <div className="pay-item-title">{charge.description || 'Payment'}</div>
                              <div className="pay-item-sub">
                                {dateStr}
                                {charge.card_last4 && (
                                  <span style={{ marginLeft: 8, color: '#888' }}>
                                    {charge.card_brand ? charge.card_brand.charAt(0).toUpperCase() + charge.card_brand.slice(1) : ''} ····{charge.card_last4}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="pay-item-amount" style={charge.refunded ? { textDecoration: 'line-through', color: '#94a3b8' } : {}}>
                              ${charge.amount.toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {charge.refunded && <span className="pay-badge pay-badge-red">refunded</span>}
                              {charge.receipt_url && (
                                <a href={charge.receipt_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 10, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                                  Receipt
                                </a>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}

              {/* Payment Methods (Cards) Sub-tab */}
              {paymentsSubTab === 'cards' && (
                <div className="pay-section">
                  <div className="pay-section-header">
                    <h3>Payment Methods</h3>
                  </div>
                  {savedCards.length > 0 ? (
                    <div className="pay-list">
                      {savedCards.map(card => (
                        <div key={card.id} className="pay-card-row">
                          <span className="pay-card-icon">💳</span>
                          <div className="pay-card-info">
                            <div className="pay-card-brand">{card.brand.toUpperCase()} ···· {card.last4}</div>
                            <div className="pay-card-exp">Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}</div>
                          </div>
                          <button onClick={() => handleRemoveCard(card.id)} className="pay-btn-secondary" style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pay-empty">No cards on file</div>
                  )}
                  {stripePromise && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <Elements stripe={stripePromise}>
                        <AddCardForm patientId={id} onCardSaved={() => fetchSavedCards()} />
                      </Elements>
                    </div>
                  )}
                </div>
              )}

            </>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div style={{ height: 'calc(100vh - 220px)', minHeight: '400px', maxHeight: '800px' }}>
              <ConversationView
                patientId={id}
                patientName={patient?.name || patient?.full_name}
                patientPhone={patient?.phone}
                ghlContactId={patient?.ghl_contact_id}
              />
            </div>
          )}
        </div>

        {/* ========== MODALS ========== */}

        {/* Edit Purchase Modal */}
        {showEditPurchaseModal && editingPurchase && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowEditPurchaseModal(false))}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3>Edit Purchase</h3>
                <button onClick={() => setShowEditPurchaseModal(false)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={editPurchaseForm.product_name}
                    onChange={e => setEditPurchaseForm({ ...editPurchaseForm, product_name: e.target.value })}
                    placeholder="e.g. HRT Monthly Membership"
                  />
                </div>
                <div className="form-group">
                  <label>Amount Paid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPurchaseForm.amount_paid}
                    onChange={e => setEditPurchaseForm({ ...editPurchaseForm, amount_paid: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Stripe Subscription ID</label>
                  <input
                    type="text"
                    value={editPurchaseForm.stripe_subscription_id}
                    onChange={e => setEditPurchaseForm({ ...editPurchaseForm, stripe_subscription_id: e.target.value })}
                    placeholder="sub_..."
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={editPurchaseForm.notes}
                    onChange={e => setEditPurchaseForm({ ...editPurchaseForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {!confirmDeletePurchase ? (
                    <button onClick={() => setConfirmDeletePurchase(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 0, background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      Delete
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Delete this purchase?</span>
                      <button onClick={handleDeletePurchase} disabled={deletingPurchase} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: 0, background: '#dc2626', color: '#fff', cursor: 'pointer' }}>
                        {deletingPurchase ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDeletePurchase(false)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', color: '#374151', cursor: 'pointer' }}>
                        No
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowEditPurchaseModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleEditPurchase} className="btn-primary">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Injection Modal */}
        {editInjectionModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setEditInjectionModal(null))}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <h3>{editInjectionModal?.entry_type === 'pickup' ? 'Edit Delivery' : 'Edit Injection'}</h3>
                <button onClick={() => setEditInjectionModal(null)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={editInjectionForm.entry_date} onChange={e => setEditInjectionForm({ ...editInjectionForm, entry_date: e.target.value })} />
                </div>
                {editInjectionModal?.entry_type === 'pickup' && (
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" min="1" value={editInjectionForm.quantity} onChange={e => setEditInjectionForm({ ...editInjectionForm, quantity: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label>Dose</label>
                  <input type="text" value={editInjectionForm.dosage} onChange={e => setEditInjectionForm({ ...editInjectionForm, dosage: e.target.value })} placeholder="e.g. 4mg" />
                </div>
                {editInjectionModal?.entry_type !== 'pickup' && (
                  <div className="form-group">
                    <label>Weight (lbs)</label>
                    <input type="number" step="0.1" value={editInjectionForm.weight} onChange={e => setEditInjectionForm({ ...editInjectionForm, weight: e.target.value })} placeholder="Optional" />
                  </div>
                )}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={editInjectionForm.notes} onChange={e => setEditInjectionForm({ ...editInjectionForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
                </div>
                {/* Fulfillment Method */}
                {(editInjectionModal.entry_type === 'pickup' || editInjectionModal.category === 'peptide' || editInjectionModal.category === 'weight_loss') && (
                  <div className="form-group">
                    <label>Fulfillment</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setEditInjectionForm({ ...editInjectionForm, fulfillment_method: 'in_clinic' })}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 0, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                          border: editInjectionForm.fulfillment_method === 'in_clinic' ? '2px solid #2E75B6' : '1px solid #ddd',
                          background: editInjectionForm.fulfillment_method === 'in_clinic' ? '#EBF3FB' : '#fff',
                          color: editInjectionForm.fulfillment_method === 'in_clinic' ? '#2E75B6' : '#666',
                        }}
                      >
                        🏥 In Clinic
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditInjectionForm({ ...editInjectionForm, fulfillment_method: 'overnight' })}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 0, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                          border: editInjectionForm.fulfillment_method === 'overnight' ? '2px solid #e67e22' : '1px solid #ddd',
                          background: editInjectionForm.fulfillment_method === 'overnight' ? '#FFF5EB' : '#fff',
                          color: editInjectionForm.fulfillment_method === 'overnight' ? '#e67e22' : '#666',
                        }}
                      >
                        📦 Overnighted
                      </button>
                    </div>
                    {editInjectionForm.fulfillment_method === 'overnight' && (
                      <input
                        type="text"
                        placeholder="Tracking number (optional)"
                        value={editInjectionForm.tracking_number}
                        onChange={e => setEditInjectionForm({ ...editInjectionForm, tracking_number: e.target.value })}
                        style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {!confirmDeleteInjection ? (
                    <button onClick={() => setConfirmDeleteInjection(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 0, background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      Delete
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Delete?</span>
                      <button onClick={handleDeleteInjection} disabled={editInjectionSaving} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: 0, background: '#dc2626', color: '#fff', cursor: 'pointer' }}>
                        {editInjectionSaving ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDeleteInjection(false)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', color: '#374151', cursor: 'pointer' }}>
                        No
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditInjectionModal(null)} className="btn-secondary">Cancel</button>
                  <button onClick={handleEditInjection} disabled={editInjectionSaving} className="btn-primary">{editInjectionSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNoteModal && (
          <div className="modal-overlay" {...overlayClickProps(() => { setShowAddNoteModal(false); stopDictation(); })}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h3>Add Staff Note</h3>
                <button onClick={() => { setShowAddNoteModal(false); stopDictation(); setNoteInput(''); setNoteFormatted(''); }} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                {/* Category indicator — always internal/staff */}
                <div style={{
                  padding: '10px 14px', marginBottom: 16, borderRadius: 0, fontSize: 13, fontWeight: 600, textAlign: 'center',
                  border: '2px solid #2563eb',
                  background: '#eff6ff',
                  color: '#2563eb',
                }}>
                  📝 Staff Note — Internal only, NOT in patient chart
                </div>
                <div style={{
                  padding: '8px 12px', marginBottom: 16, borderRadius: 0, fontSize: 12, lineHeight: 1.5,
                  background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                }}>
                  ⚠️ This is for internal staff notes only (reminders, patient experience, operational notes). To document a clinical encounter, close this and use <strong>Log Encounter</strong> instead.
                </div>

                <div className="form-group">
                  <label>Note (type or dictate)</label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      rows={6}
                      placeholder="Type your staff note here (internal only — not for encounter notes)..."
                      style={{ width: '100%', resize: 'vertical', paddingRight: 50, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
                    />
                    <button
                      onClick={toggleDictation}
                      type="button"
                      style={{
                        position: 'absolute', right: 10, top: 10,
                        background: isRecording ? '#dc2626' : '#f3f4f6',
                        color: isRecording ? '#fff' : '#374151',
                        border: 'none', borderRadius: '50%',
                        width: 36, height: 36, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                        transition: 'background 0.2s',
                      }}
                      title={isRecording ? 'Stop dictation' : 'Start dictation'}
                    >
                      🎤
                    </button>
                  </div>
                  {isRecording && (
                    <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>
                      ● Recording... Click microphone to stop
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={handleFormatNote}
                    disabled={!noteInput.trim() || noteFormatting}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: (!noteInput.trim() || noteFormatting) ? 0.5 : 1 }}
                  >
                    {noteFormatting ? 'Formatting...' : '✨ Format with AI'}
                  </button>
                </div>

              </div>
              <div className="modal-footer">
                <button onClick={() => { setShowAddNoteModal(false); setNoteInput(''); setNoteFormatted(''); stopDictation(); }} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteInput.trim() || noteSaving}
                  className="btn-primary"
                  style={{ opacity: (!noteInput.trim() || noteSaving) ? 0.5 : 1 }}
                >
                  {noteSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <div className="modal-overlay" {...overlayClickProps(() => { setEditingNote(null); setEditNoteBody(''); })}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h3>Edit Note</h3>
                <button onClick={() => { setEditingNote(null); setEditNoteBody(''); }} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                  {formatDate(editingNote.note_date || editingNote.created_at)}
                  {editingNote.created_by && ` — by ${getStaffDisplayName(editingNote.created_by)}`}
                </div>
                <div className="form-group">
                  <label>Note Content</label>
                  <textarea
                    value={editNoteBody}
                    onChange={e => setEditNoteBody(e.target.value)}
                    rows={10}
                    style={{ fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => { setEditingNote(null); setEditNoteBody(''); }} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleEditNote}
                  disabled={!editNoteBody.trim() || editNoteSaving}
                  className="btn-primary"
                  style={{ opacity: (!editNoteBody.trim() || editNoteSaving) ? 0.5 : 1 }}
                >
                  {editNoteSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Protocol Modal */}
        {showAssignModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowAssignModal(false))}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Assign Protocol</h3>
                <button onClick={() => setShowAssignModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                {selectedNotification && (
                  <div className="modal-preview">{selectedNotification.product_name} • ${selectedNotification.amount_paid?.toFixed(2)}</div>
                )}

                {/* Active protocol warning — shown when patient already has protocols and no purchase was selected */}
                {activeProtocols.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 0, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 6, fontSize: 13 }}>
                      ⚠️ This patient already has {activeProtocols.length} active protocol{activeProtocols.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {activeProtocols.map(p => (
                        <div key={p.id} style={{ fontSize: 12, color: '#78350f' }}>
                          • <strong>{getProtocolDisplayName(p)}</strong>
                          <span style={{ color: '#a16207' }}> (started {new Date(p.start_date).toLocaleDateString()})</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#92400e' }}>
                      A new purchase may have already extended or created these automatically. Only proceed if this is a genuinely new protocol.
                    </div>
                  </div>
                )}

                {/* Mode toggle: New Protocol / Add to Pack / Link to Protocol */}
                {(existingPacks.length > 0 || (selectedNotification && activeProtocols.length > 0)) && (
                  <div className="pack-toggle">
                    <button className={!addToPackMode && !linkToProtocolMode ? 'active' : ''} onClick={() => { setAddToPackMode(false); setLinkToProtocolMode(false); }}>New Protocol</button>
                    {existingPacks.length > 0 && (
                      <button className={addToPackMode ? 'active' : ''} onClick={() => { setAddToPackMode(true); setLinkToProtocolMode(false); }}>Add to Pack</button>
                    )}
                    {selectedNotification && activeProtocols.length > 0 && (
                      <button className={linkToProtocolMode ? 'active' : ''} onClick={() => { setLinkToProtocolMode(true); setAddToPackMode(false); }}>Link to Protocol</button>
                    )}
                  </div>
                )}

                {linkToProtocolMode ? (
                  <div className="form-group">
                    <label>Select Active Protocol</label>
                    <select value={selectedLinkProtocolId} onChange={e => setSelectedLinkProtocolId(e.target.value)}>
                      <option value="">Choose protocol...</option>
                      {activeProtocols.map(p => (
                        <option key={p.id} value={p.id}>
                          {getProtocolDisplayName(p)} (started {new Date(p.start_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    {selectedLinkProtocolId && (() => {
                      const linked = activeProtocols.find(p => p.id === selectedLinkProtocolId);
                      if (!linked) return null;
                      return (
                        <div style={{ marginTop: 8, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, fontSize: 13 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{linked.program_name}</div>
                          {linked.medication && <div>Medication: {linked.medication}</div>}
                          {linked.selected_dose && <div>Dose: {linked.selected_dose}</div>}
                          <div>Started: {new Date(linked.start_date).toLocaleDateString()}{linked.end_date && ` → ${new Date(linked.end_date).toLocaleDateString()}`}</div>
                          {linked.amount_paid > 0 && <div>Paid so far: ${parseFloat(linked.amount_paid).toFixed(2)}</div>}
                          <div style={{ marginTop: 6, color: '#16a34a', fontWeight: 500 }}>
                            + ${(selectedNotification?.amount_paid || selectedNotification?.amount || 0).toFixed(2)} will be added
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : addToPackMode ? (
                  <div className="form-group">
                    <label>Select Pack</label>
                    <select value={selectedPackId} onChange={e => setSelectedPackId(e.target.value)}>
                      <option value="">Choose pack...</option>
                      {existingPacks.map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.program_name} - {pack.sessions_used || 0}/{pack.total_sessions}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Protocol Template *</label>
                      <select value={assignForm.templateId} onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: '', medication: '', hrtGender: '', injectionMethod: '', supplyType: '', dosePerInjection: '', injectionsPerWeek: '', vialSize: '', hrtInitialQuantity: ''})}>
                        <option value="">Select template...</option>
                        {Object.entries(templates.grouped || {}).map(([category, temps]) => (
                          <optgroup key={category} label={category}>
                            {temps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {isWeightLossTemplate() && (
                      <>
                        <div className="form-group">
                          <label>Medication *</label>
                          <select value={assignForm.medication || ''} onChange={e => setAssignForm({...assignForm, medication: e.target.value, selectedDose: ''})}>
                            <option value="">Select medication...</option>
                            {WEIGHT_LOSS_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        {assignForm.medication && WEIGHT_LOSS_DOSAGES[assignForm.medication] && (
                          <div className="form-group">
                            <label>Dose</label>
                            <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                              <option value="">Select dose...</option>
                              {WEIGHT_LOSS_DOSAGES[assignForm.medication].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        )}
                        <div className="form-group">
                          <label>Injection Frequency</label>
                          <select value={assignForm.frequency} onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}>
                            <option value="">Select frequency...</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Every 10 days">Every 10 days</option>
                            <option value="Every 14 days">Every 14 days</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Injection Day</label>
                          <select value={assignForm.injectionDay} onChange={e => setAssignForm({...assignForm, injectionDay: e.target.value})}>
                            <option value="">Select day...</option>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Delivery Method *</label>
                          <select value={assignForm.deliveryMethod} onChange={e => setAssignForm({...assignForm, deliveryMethod: e.target.value})}>
                            <option value="">Select delivery...</option>
                            <option value="in_clinic">In-Clinic (all injections)</option>
                            <option value="take_home">Take-Home (all injections)</option>
                            <option value="hybrid">1st Injection In-Clinic + Take-Home Remaining</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Supply Duration</label>
                          <select value={assignForm.pickupFrequencyDays} onChange={e => setAssignForm({...assignForm, pickupFrequencyDays: e.target.value})}>
                            <option value="">Select duration...</option>
                            <option value="7">1 Week (1 injection)</option>
                            <option value="14">2 Weeks (2 injections)</option>
                            <option value="28">4 Weeks (4 injections)</option>
                            <option value="56">8 Weeks (8 injections)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {isPeptideTemplate() && (
                      <>
                        <div className="form-group">
                          <label>Select Peptide *</label>
                          <select value={assignForm.peptideId} onChange={e => {
                            const peptideName = e.target.value;
                            const peptideInfo = PEPTIDE_OPTIONS.flatMap(g => g.options).find(o => o.value === peptideName);
                            const vialSupply = getPeptideVialSupply(peptideName);
                            setAssignForm({
                              ...assignForm,
                              peptideId: peptideName,
                              selectedDose: peptideInfo?.startingDose || '',
                              frequency: peptideInfo?.frequency || assignForm.frequency,
                              vialDuration: vialSupply?.options?.[0]?.days?.toString() || ''
                            });
                          }}>
                            <option value="">Select peptide...</option>
                            {PEPTIDE_OPTIONS.map(group => (
                              <optgroup key={group.group} label={group.group}>
                                {group.options.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        {assignForm.peptideId && (() => {
                          const peptideInfo = PEPTIDE_OPTIONS.flatMap(g => g.options).find(o => o.value === assignForm.peptideId);
                          if (!peptideInfo) return null;
                          const hasDoseList = peptideInfo.doses?.length > 0;

                          // Generate titration steps between startingDose and maxDose
                          const generateDoseSteps = (startStr, maxStr) => {
                            const parseD = (s) => {
                              if (!s) return null;
                              const m = s.match(/([\d.]+)\s*(mg|mcg|iu|ml)/i);
                              if (!m) return null;
                              return { value: parseFloat(m[1]), unit: m[2].toLowerCase() };
                            };
                            const start = parseD(startStr);
                            const max = parseD(maxStr);
                            if (!start || !max || start.unit !== max.unit || start.value >= max.value) return null;

                            // Determine step size based on the range
                            const range = max.value - start.value;
                            let step;
                            if (start.unit === 'mcg') {
                              step = range <= 500 ? 50 : range <= 1000 ? 100 : 250;
                            } else if (start.unit === 'mg') {
                              if (range <= 1) step = 0.25;
                              else if (range <= 5) step = start.value < 1 ? 0.5 : 1;
                              else step = range <= 20 ? 2.5 : 5;
                            } else if (start.unit === 'iu') {
                              step = range <= 500 ? 100 : 250;
                            } else {
                              step = range <= 1 ? 0.1 : 0.5;
                            }

                            const steps = [];
                            for (let v = start.value; v <= max.value + 0.001; v += step) {
                              const rounded = Math.round(v * 100) / 100;
                              const label = rounded === start.value ? `${rounded}${start.unit} (starting)`
                                : rounded === max.value ? `${rounded}${start.unit} (max)`
                                : `${rounded}${start.unit}`;
                              steps.push({ value: `${rounded}${start.unit}`, label });
                            }
                            // Ensure max is always included
                            if (steps.length > 0 && !steps.find(s => s.value === `${max.value}${max.unit}`)) {
                              steps.push({ value: `${max.value}${max.unit}`, label: `${max.value}${max.unit} (max)` });
                            }
                            return steps;
                          };

                          const hasExplicitDoseOptions = peptideInfo.doseOptions?.length > 0;
                          const titrationSteps = !hasDoseList && !hasExplicitDoseOptions ? generateDoseSteps(peptideInfo.startingDose, peptideInfo.maxDose) : null;

                          return (
                            <>
                              <div className="form-group">
                                <label>Dose</label>
                                {hasDoseList ? (
                                  <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                                    <option value="">Select dose...</option>
                                    {peptideInfo.doses.map(dose => <option key={dose} value={dose}>{dose}</option>)}
                                  </select>
                                ) : hasExplicitDoseOptions ? (
                                  <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                                    <option value="">Select dose...</option>
                                    {peptideInfo.doseOptions.map(d => {
                                      const label = d === peptideInfo.startingDose ? `${d} (starting)` : d === peptideInfo.maxDose ? `${d} (max)` : d;
                                      return <option key={d} value={d}>{label}</option>;
                                    })}
                                  </select>
                                ) : titrationSteps ? (
                                  <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                                    <option value="">Select dose...</option>
                                    {titrationSteps.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                  </select>
                                ) : (
                                  <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                                    <option value="">Select dose...</option>
                                    <option value={peptideInfo.startingDose}>{peptideInfo.startingDose}</option>
                                    {peptideInfo.maxDose !== peptideInfo.startingDose && (
                                      <option value={peptideInfo.maxDose}>{peptideInfo.maxDose}</option>
                                    )}
                                  </select>
                                )}
                              </div>
                              <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, fontSize: 12, color: '#475569', marginBottom: 12 }}>
                                <strong>Dosing:</strong> {peptideInfo.startingDose} → {peptideInfo.maxDose} &nbsp;|&nbsp;
                                <strong>Frequency:</strong> {peptideInfo.frequency}
                                {peptideInfo.notes && <> &nbsp;|&nbsp; {peptideInfo.notes}</>}
                              </div>
                              {/* Vial duration selector — only for Vial templates */}
                              {getSelectedTemplate()?.name?.toLowerCase().includes('vial') && (() => {
                                const vialSupply = getPeptideVialSupply(assignForm.peptideId);
                                if (!vialSupply) return null;
                                return (
                                  <div className="form-group">
                                    <label>Vial Duration ({vialSupply.vialSize})</label>
                                    {vialSupply.options.length === 1 ? (
                                      <div style={{ padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                                        {vialSupply.options[0].label}
                                      </div>
                                    ) : (
                                      <select value={assignForm.vialDuration} onChange={e => setAssignForm({...assignForm, vialDuration: e.target.value})}>
                                        {vialSupply.options.map(opt => (
                                          <option key={opt.value} value={opt.days}>{opt.label}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          );
                        })()}
                      </>
                    )}

                    {isInjectionTemplate() && (
                      <>
                        <div className="form-group">
                          <label>Medication</label>
                          <select value={assignForm.injectionMedication} onChange={e => setAssignForm({...assignForm, injectionMedication: e.target.value})}>
                            <option value="">Select medication...</option>
                            {INJECTION_MEDICATIONS.map(med => <option key={med} value={med}>{med}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Dose</label>
                          <input type="text" value={assignForm.injectionDose} onChange={e => setAssignForm({...assignForm, injectionDose: e.target.value})} placeholder="e.g. 100mg" />
                        </div>
                      </>
                    )}

                    {isHRTTemplate() && (
                      <>
                        {/* Gender selection — determines testosterone concentration and dosages */}
                        <div className="form-group">
                          <label>Patient Sex *</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {['Male', 'Female'].map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setAssignForm({...assignForm, hrtGender: g.toLowerCase(), selectedDose: '', dosePerInjection: ''})}
                                style={{
                                  flex: 1, padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 0,
                                  background: assignForm.hrtGender === g.toLowerCase() ? '#0a0a0a' : '#fff',
                                  color: assignForm.hrtGender === g.toLowerCase() ? '#fff' : '#374151',
                                  fontWeight: 600, fontSize: 14, cursor: 'pointer'
                                }}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                          {assignForm.hrtGender && (
                            <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                              Testosterone Cypionate ({getHRTConcentration(assignForm.hrtGender)})
                            </div>
                          )}
                        </div>

                        {/* Dose selection — based on gender */}
                        {assignForm.hrtGender && (
                          <div className="form-group">
                            <label>Dose *</label>
                            <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                              <option value="">Select dose...</option>
                              {TESTOSTERONE_DOSES[assignForm.hrtGender]?.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                              <option value="custom">Custom dose</option>
                            </select>
                            {assignForm.selectedDose === 'custom' && (
                              <input
                                type="text"
                                value={assignForm.dosePerInjection}
                                onChange={e => setAssignForm({...assignForm, dosePerInjection: e.target.value})}
                                placeholder="e.g. 0.35ml/70mg"
                                style={{ marginTop: 6 }}
                              />
                            )}
                          </div>
                        )}

                        {/* Injection Method — IM or SubQ */}
                        {assignForm.hrtGender && (
                          <div className="form-group">
                            <label>Injection Method *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {INJECTION_METHODS.map(m => (
                                <button
                                  key={m.value}
                                  type="button"
                                  onClick={() => setAssignForm({
                                    ...assignForm,
                                    injectionMethod: m.value,
                                    frequency: m.value === 'subq' ? 'Daily' : '2x per week',
                                    injectionsPerWeek: m.value === 'subq' ? '7' : '2'
                                  })}
                                  style={{
                                    flex: 1, padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 0,
                                    background: assignForm.injectionMethod === m.value ? '#0a0a0a' : '#fff',
                                    color: assignForm.injectionMethod === m.value ? '#fff' : '#374151',
                                    fontWeight: 600, fontSize: 14, cursor: 'pointer'
                                  }}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                            {assignForm.injectionMethod && (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                                {assignForm.injectionMethod === 'im' ? '2x per week (IM)' : 'Daily (SubQ)'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delivery method */}
                        {assignForm.injectionMethod && (
                          <div className="form-group">
                            <label>Delivery Method *</label>
                            <select value={assignForm.deliveryMethod} onChange={e => setAssignForm({...assignForm, deliveryMethod: e.target.value})}>
                              <option value="">Select delivery...</option>
                              <option value="in_clinic">In Clinic</option>
                              <option value="take_home">Take Home</option>
                            </select>
                          </div>
                        )}

                        {/* Supply type — only for take-home */}
                        {assignForm.deliveryMethod === 'take_home' && (
                          <div className="form-group">
                            <label>Supply Type</label>
                            <select value={assignForm.supplyType} onChange={e => setAssignForm({...assignForm, supplyType: e.target.value})}>
                              <option value="">Select supply...</option>
                              {HRT_SUPPLY_TYPES.map(st => (
                                <option key={st.value} value={st.value}>{st.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {!isWeightLossTemplate() && !isHRTTemplate() && (
                      <div className="form-group">
                        <label>Frequency</label>
                        <select value={assignForm.frequency} onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}>
                          <option value="">Select frequency...</option>
                          {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={assignForm.startDate} onChange={e => setAssignForm({...assignForm, startDate: e.target.value})} />
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const start = new Date(assignForm.startDate + 'T00:00:00');
                        const diffDays = Math.round((today - start) / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                          return (
                            <div style={{ marginTop: 4, padding: '6px 10px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 0, fontSize: 12, color: '#92400e' }}>
                              Backdated: {diffDays} day{diffDays !== 1 ? 's' : ''} ago
                              {getSelectedTemplate()?.duration_days > 0 && (
                                <span> — {Math.max(0, getSelectedTemplate().duration_days - diffDays)} day{Math.max(0, getSelectedTemplate().duration_days - diffDays) !== 1 ? 's' : ''} remaining</span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="form-group">
                      <label>Notes</label>
                      <textarea value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes: e.target.value})} rows={2} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
                {linkToProtocolMode ? (
                  <button onClick={handleLinkToProtocol} disabled={!selectedLinkProtocolId} className="btn-primary">Link Purchase</button>
                ) : addToPackMode ? (
                  <button onClick={handleAddToPack} disabled={!selectedPackId} className="btn-primary">Add to Pack</button>
                ) : (
                  <button onClick={handleAssignProtocol} disabled={!assignForm.templateId} className="btn-primary">Assign</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Protocol Modal — clean version using same fields as service log + protocol detail */}
        {showEditModal && selectedProtocol && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowEditModal(false))}>
            <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Protocol</h3>
                <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="modal-preview">{selectedProtocol.program_name}</div>

                {/* ── MEDICATION & DOSING ── */}
                {/* ── Medication ── */}
                <div className="form-group">
                  <label>Medication</label>
                  {selectedProtocol.category === 'weight_loss' ? (
                    <select value={editForm.medication} onChange={e => setEditForm({...editForm, medication: e.target.value, selectedDose: ''})}>
                      <option value="">Select medication...</option>
                      {WEIGHT_LOSS_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : selectedProtocol.category === 'peptide' ? (
                    <select value={editForm.medication} onChange={e => setEditForm({...editForm, medication: e.target.value})}>
                      <option value="">Select peptide...</option>
                      {PEPTIDE_OPTIONS.flatMap(g => g.options).map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                    </select>
                  ) : selectedProtocol.category === 'hrt' ? (
                    <select value={editForm.medication} onChange={e => setEditForm({...editForm, medication: e.target.value, selectedDose: ''})}>
                      <option value="">Select medication...</option>
                      {selectedProtocol.hrt_type === 'female' ? (
                        <>
                          <optgroup label="Female HRT">
                            <option value={getHRTMedication('female')}>{getHRTMedication('female')}</option>
                            <option value="Estradiol">Estradiol</option>
                            <option value="Progesterone">Progesterone</option>
                            <option value="Thyroid (T3/T4/Armour)">Thyroid (T3/T4/Armour)</option>
                            <option value="DHEA">DHEA</option>
                            <option value="Pregnenolone">Pregnenolone</option>
                          </optgroup>
                          <optgroup label="Other">
                            {HRT_MEDICATIONS.filter(m => !['Estradiol','Progesterone','Thyroid (T3/T4/Armour)','DHEA','Pregnenolone'].includes(m)).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label="Male HRT">
                            <option value={getHRTMedication('male')}>{getHRTMedication('male')}</option>
                            <option value="Testosterone Enanthate">Testosterone Enanthate</option>
                            <option value="Nandrolone">Nandrolone</option>
                            <option value="HCG">HCG</option>
                            <option value="Testosterone Booster (Oral)">Testosterone Booster (Oral)</option>
                          </optgroup>
                          <optgroup label="Other">
                            {['Estradiol','Progesterone','Thyroid (T3/T4/Armour)','DHEA','Pregnenolone'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  ) : selectedProtocol.category === 'injection' ? (
                    <select value={editForm.medication} onChange={e => setEditForm({...editForm, medication: e.target.value, selectedDose: ''})}>
                      <option value="">Select injection...</option>
                      {INJECTION_MEDICATIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={editForm.medication} onChange={e => setEditForm({...editForm, medication: e.target.value})} placeholder="Medication name" />
                  )}
                </div>

                {/* ── Dose ── */}
                <div className="form-group">
                  <label>Dose</label>
                  {selectedProtocol.category === 'weight_loss' && editForm.medication && WEIGHT_LOSS_DOSAGES[editForm.medication] ? (
                    <select value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}>
                      <option value="">Select dose...</option>
                      {WEIGHT_LOSS_DOSAGES[editForm.medication].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : selectedProtocol.category === 'peptide' && editForm.medication ? (() => {
                    const peptide = PEPTIDE_OPTIONS.flatMap(g => g.options).find(o => o.value === editForm.medication);
                    if (!peptide) return <input type="text" value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})} placeholder="Dose" />;
                    // Build dose options: use explicit doseOptions/doses array, or generate range from startingDose → maxDose
                    let doseOptions;
                    if (peptide.doseOptions) {
                      doseOptions = peptide.doseOptions;
                    } else if (peptide.doses) {
                      doseOptions = peptide.doses;
                    } else if (peptide.startingDose === peptide.maxDose) {
                      doseOptions = [peptide.startingDose];
                    } else if (peptide.startingDose.includes('/') || peptide.maxDose.includes('/')) {
                      // Blend doses (e.g., "500mcg/500mcg") — just show start and max
                      doseOptions = [peptide.startingDose, peptide.maxDose];
                    } else {
                      // Generate range: parse values, step by 1 for mg ≥ 1, else by starting value
                      const parseD = (d) => { const m = d.match(/^([\d.]+)\s*(mg|mcg|IU)/i); return m ? { v: parseFloat(m[1]), u: m[2].toLowerCase() } : null; };
                      const s = parseD(peptide.startingDose), mx = parseD(peptide.maxDose);
                      if (s && mx && s.u === mx.u) {
                        const step = (s.u === 'mg' && s.v >= 1 && s.v === Math.floor(s.v)) ? 1 : s.v;
                        doseOptions = [];
                        for (let v = s.v; v <= mx.v + 0.001; v += step) {
                          const r = Math.round(v * 1000) / 1000;
                          doseOptions.push(`${r}${s.u}`);
                          if (doseOptions.length >= 20) break;
                        }
                      } else if (s && mx && s.u === 'mcg' && mx.u === 'mg') {
                        // Mixed units: convert max to mcg, generate range, format back
                        const maxMcg = mx.v * 1000;
                        const step = s.v;
                        doseOptions = [];
                        for (let v = s.v; v <= maxMcg + 0.001; v += step) {
                          const r = Math.round(v);
                          doseOptions.push(r >= 1000 ? `${r / 1000}mg` : `${r}mcg`);
                          if (doseOptions.length >= 20) break;
                        }
                      } else {
                        doseOptions = [peptide.startingDose, peptide.maxDose];
                      }
                    }
                    return (
                      <select value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}>
                        <option value="">Select dose...</option>
                        {doseOptions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    );
                  })() : selectedProtocol.category === 'hrt' ? (
                    <select value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}>
                      <option value="">Select dose...</option>
                      {(TESTOSTERONE_DOSES[selectedProtocol.hrt_type === 'female' ? 'female' : 'male'] || TESTOSTERONE_DOSES.male).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  ) : selectedProtocol.category === 'injection' && editForm.medication === 'NAD+' ? (
                    <select value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}>
                      <option value="">Select dose...</option>
                      {NAD_INJECTION_DOSAGES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})} placeholder="Dose" />
                  )}
                </div>

                {/* ── Weight Loss: Start Date, Total Sessions, Frequency ── */}
                {selectedProtocol.category === 'weight_loss' && (
                  <>
                    <div className="form-section-label" style={{ marginTop: '12px' }}>Timeline</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={editForm.startDate} onChange={e => {
                          const newStart = e.target.value;
                          const interval = (editForm.frequency || '').toLowerCase().includes('bi') ? 14 : 7;
                          const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) + 'T12:00:00');
                          const start = new Date(newStart + 'T12:00:00');
                          const autoWeeks = start <= today ? Math.floor((today - start) / (1000 * 60 * 60 * 24 * interval)) + 1 : 1;
                          setEditForm({...editForm, startDate: newStart, totalSessions: autoWeeks});
                        }} />
                      </div>
                      <div className="form-group">
                        <label>Total Sessions (weeks)</label>
                        <input type="number" min="1" value={editForm.totalSessions || ''} onChange={e => setEditForm({...editForm, totalSessions: e.target.value ? parseInt(e.target.value) : null})} placeholder="e.g. 8" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Sessions Used</label>
                        <input type="number" min="0" max={editForm.totalSessions || 999} value={editForm.sessionsUsed ?? 0} onChange={e => setEditForm({...editForm, sessionsUsed: e.target.value ? parseInt(e.target.value) : 0})} />
                        {editForm.totalSessions && (
                          <div style={{ fontSize: 11, color: editForm.sessionsUsed >= editForm.totalSessions ? '#dc2626' : '#6b7280', marginTop: 2 }}>
                            {editForm.sessionsUsed ?? 0} of {editForm.totalSessions} — {Math.max(0, (editForm.totalSessions || 0) - (editForm.sessionsUsed || 0))} remaining
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Frequency</label>
                        <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                          <option value="">Select frequency...</option>
                          {FREQUENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Method</label>
                        <select value={editForm.deliveryMethod} onChange={e => setEditForm({...editForm, deliveryMethod: e.target.value})}>
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In-Clinic</option>
                        </select>
                      </div>
                    </div>
                    {editForm.startDate && editForm.totalSessions && (
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: 0, fontSize: 12, color: '#0369a1', marginBottom: 12 }}>
                        Timeline: {editForm.startDate} → {(() => {
                          const interval = (editForm.frequency || '').toLowerCase().includes('bi') ? 14 : 7;
                          const end = new Date(editForm.startDate + 'T12:00:00');
                          end.setDate(end.getDate() + (editForm.totalSessions - 1) * interval);
                          return end.toISOString().split('T')[0];
                        })()} ({editForm.totalSessions} {(editForm.frequency || '').toLowerCase().includes('bi') ? 'bi-weekly' : 'weekly'} slots)
                      </div>
                    )}
                  </>
                )}

                {/* ── Peptide: Supply format drives everything ── */}
                {selectedProtocol.category === 'peptide' && (() => {
                  // Auto-calc helper: frequency → doses per week
                  const getDosesPerWeek = (freq) => {
                    if (!freq) return null;
                    const f = freq.toLowerCase();
                    if (f.includes('5 on')) return 5;
                    if (f === 'daily' || f.includes('1x daily')) return 7;
                    if (f === '2x daily') return 14;
                    if (f === '3x daily') return 21;
                    if (f === 'every other day') return 3.5;
                    if (f === 'every 5 days') return 1.4;
                    if (f === '2x per week') return 2;
                    if (f === '3x per week') return 3;
                    if (f === 'weekly' || f === '1x per week') return 1;
                    return null;
                  };
                  const isVial = editForm.supplyType === 'vial';
                  const isPrefilled = (editForm.supplyType || '').startsWith('prefilled_');
                  const prefillDays = isPrefilled ? parseInt((editForm.supplyType || '').replace('prefilled_', '').replace('d', '')) : null;
                  const dpw = getDosesPerWeek(editForm.frequency);
                  // Vial: total = vials × doses_per_vial; duration from frequency
                  const vialTotal = isVial && editForm.numVials && editForm.dosesPerVial
                    ? parseInt(editForm.numVials) * parseInt(editForm.dosesPerVial) : null;
                  const calcDurationDays = (() => {
                    if (isPrefilled && prefillDays) return prefillDays;
                    const total = vialTotal || editForm.totalSessions;
                    if (total && dpw) return Math.round((total / dpw) * 7);
                    return null;
                  })();
                  const calcEndDate = (() => {
                    if (!editForm.startDate || !calcDurationDays) return null;
                    const d = new Date(editForm.startDate + 'T12:00:00');
                    d.setDate(d.getDate() + calcDurationDays);
                    return d.toISOString().split('T')[0];
                  })();
                  const totalInjections = vialTotal || (isPrefilled && prefillDays && dpw ? Math.round(prefillDays * dpw / 7) : null) || editForm.totalSessions;

                  return (
                  <>
                    <div className="form-section-label" style={{ marginTop: '12px' }}>Supply</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Supply Format</label>
                        <select value={editForm.supplyType} onChange={e => {
                          const val = e.target.value;
                          const updates = { supplyType: val };
                          // Pre-filled: auto-set delivery method
                          if (val.startsWith('prefilled_')) updates.deliveryMethod = 'take_home';
                          setEditForm({...editForm, ...updates});
                        }}>
                          <option value="">Select format...</option>
                          {PEPTIDE_SUPPLY_FORMATS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Method</label>
                        <select value={editForm.deliveryMethod} onChange={e => setEditForm({...editForm, deliveryMethod: e.target.value})}>
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In-Clinic</option>
                        </select>
                      </div>
                    </div>

                    {/* Vial-specific: num vials + doses per vial */}
                    {isVial && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label>Vials Dispensed</label>
                          <input type="number" min="1" value={editForm.numVials || ''} onChange={e => setEditForm({...editForm, numVials: e.target.value ? parseInt(e.target.value) : ''})} placeholder="e.g. 2" />
                        </div>
                        <div className="form-group">
                          <label>Doses per Vial</label>
                          <input type="number" min="1" value={editForm.dosesPerVial || ''} onChange={e => setEditForm({...editForm, dosesPerVial: e.target.value ? parseInt(e.target.value) : ''})} placeholder="e.g. 10" />
                        </div>
                      </div>
                    )}

                    <div className="form-section-label" style={{ marginTop: '12px' }}>Schedule</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Frequency</label>
                        <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                          <option value="">Select frequency...</option>
                          {FREQUENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                      </div>
                    </div>

                    {/* Auto-calculated summary */}
                    {(vialTotal || (isPrefilled && prefillDays)) && (
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 12px', borderRadius: 0, fontSize: 12, color: '#0369a1', marginBottom: 12 }}>
                        {isVial && <div><strong>{editForm.numVials} vials × {editForm.dosesPerVial} doses = {vialTotal} total injections</strong></div>}
                        {isPrefilled && <div><strong>{prefillDays}-day program</strong>{dpw ? ` — ${Math.round(prefillDays * dpw / 7)} injections` : ''}</div>}
                        {calcDurationDays && <div>Duration: {calcDurationDays} days ({Math.round(calcDurationDays / 7)} weeks)</div>}
                        {editForm.startDate && calcEndDate && <div>End date: {new Date(calcEndDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                      </div>
                    )}

                    {/* Progress: time-based for take-home, session-based for in-clinic */}
                    {editForm.deliveryMethod === 'in_clinic' && (
                      <>
                        <div className="form-section-label" style={{ marginTop: '12px' }}>Progress</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label>Sessions Used</label>
                            <input type="number" min="0" max={totalInjections || 999} value={editForm.sessionsUsed ?? 0} onChange={e => setEditForm({...editForm, sessionsUsed: e.target.value ? parseInt(e.target.value) : 0})} />
                            {totalInjections && (
                              <div style={{ fontSize: 11, color: editForm.sessionsUsed >= totalInjections ? '#dc2626' : '#6b7280', marginTop: 2 }}>
                                {editForm.sessionsUsed ?? 0} of {totalInjections} — {Math.max(0, totalInjections - (editForm.sessionsUsed || 0))} remaining
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label>End Date {calcEndDate ? '(auto)' : ''}</label>
                            <input type="date" value={calcEndDate || editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} style={calcEndDate ? { background: '#f9fafb', color: '#6b7280' } : {}} />
                          </div>
                        </div>
                      </>
                    )}
                    {editForm.deliveryMethod !== 'in_clinic' && calcDurationDays && editForm.startDate && (
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '10px 12px', borderRadius: 0, fontSize: 12, color: '#374151', marginTop: 4 }}>
                        {(() => {
                          const today = new Date();
                          const start = new Date(editForm.startDate + 'T12:00:00');
                          const dayNum = Math.floor((today - start) / 86400000) + 1;
                          const daysLeft = Math.max(0, calcDurationDays - dayNum);
                          const pct = Math.min(100, Math.round((dayNum / calcDurationDays) * 100));
                          if (dayNum < 1) return <span>Starts {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
                          if (daysLeft <= 0) return <span style={{ color: '#dc2626', fontWeight: 600 }}>Supply ended — refill needed</span>;
                          return (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span><strong>Day {dayNum}</strong> of {calcDurationDays}</span>
                                <span>{daysLeft} days remaining</span>
                              </div>
                              <div style={{ background: '#e5e7eb', height: 6, width: '100%' }}>
                                <div style={{ background: pct > 85 ? '#dc2626' : '#0369a1', height: 6, width: `${pct}%` }} />
                              </div>
                              {calcEndDate && <div style={{ marginTop: 4, color: '#6b7280' }}>Refill by: {new Date(calcEndDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </>
                  );
                })()}

                {/* ── Injection Package: Medication, Dose, Schedule, Timeline ── */}
                {selectedProtocol.category === 'injection' && (
                  <>
                    <div className="form-section-label" style={{ marginTop: '12px' }}>Protocol Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Frequency</label>
                        <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                          <option value="">Select frequency...</option>
                          {FREQUENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Method</label>
                        <select value={editForm.deliveryMethod} onChange={e => setEditForm({...editForm, deliveryMethod: e.target.value})}>
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In-Clinic</option>
                        </select>
                      </div>
                    </div>

                    {/* Scheduled Days */}
                    <div className="form-group">
                      <label>Scheduled Days</label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                          const selected = (editForm.scheduledDays || []).includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const current = editForm.scheduledDays || [];
                                const updated = selected
                                  ? current.filter(d => d !== day)
                                  : [...current, day];
                                setEditForm({...editForm, scheduledDays: updated});
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: selected ? 700 : 400,
                                background: selected ? '#0a0a0a' : '#f4f4f4',
                                color: selected ? '#fff' : '#666',
                                border: '1px solid ' + (selected ? '#0a0a0a' : '#ddd'),
                                borderRadius: 0,
                                cursor: 'pointer',
                              }}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input type="date" value={editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Total Sessions</label>
                        <input type="number" min="1" value={editForm.totalSessions || ''} onChange={e => setEditForm({...editForm, totalSessions: e.target.value ? parseInt(e.target.value) : null})} placeholder="e.g. 12" />
                      </div>
                      <div className="form-group">
                        <label>Sessions Used</label>
                        <input type="number" min="0" max={editForm.totalSessions || 999} value={editForm.sessionsUsed ?? 0} onChange={e => setEditForm({...editForm, sessionsUsed: e.target.value ? parseInt(e.target.value) : 0})} />
                        {editForm.totalSessions && (
                          <div style={{ fontSize: 11, color: editForm.sessionsUsed >= editForm.totalSessions ? '#dc2626' : '#6b7280', marginTop: 2 }}>
                            {editForm.sessionsUsed ?? 0} of {editForm.totalSessions} — {Math.max(0, (editForm.totalSessions || 0) - (editForm.sessionsUsed || 0))} remaining
                          </div>
                        )}
                      </div>
                    </div>
                    {editForm.startDate && editForm.endDate && (
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: 0, fontSize: 12, color: '#0369a1', marginBottom: 12 }}>
                        Duration: {Math.round((new Date(editForm.endDate + 'T12:00:00') - new Date(editForm.startDate + 'T12:00:00')) / 86400000)} days
                        {editForm.totalSessions ? ` — ${editForm.totalSessions} sessions` : ''}
                        {(editForm.scheduledDays || []).length > 0 ? ` (${editForm.scheduledDays.map(d => d.slice(0, 3)).join(', ')})` : ''}
                      </div>
                    )}
                  </>
                )}

                {/* ── HRT-specific fields ── */}
                {selectedProtocol.category === 'hrt' && (
                  <>
                    <div className="form-section-label" style={{ marginTop: '12px' }}>HRT Details</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Injection Method</label>
                        <select value={editForm.injectionMethod} onChange={e => setEditForm({...editForm, injectionMethod: e.target.value})}>
                          <option value="">Select...</option>
                          {INJECTION_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Injections/Week</label>
                        <select value={editForm.injectionsPerWeek} onChange={e => setEditForm({...editForm, injectionsPerWeek: parseInt(e.target.value)})}>
                          <option value={1}>1x per week</option>
                          <option value={2}>2x per week</option>
                          <option value={3}>3x per week</option>
                          <option value={7}>Daily</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label>Supply Type</label>
                        <select value={editForm.supplyType} onChange={e => setEditForm({...editForm, supplyType: e.target.value})}>
                          <option value="">Select...</option>
                          {HRT_SUPPLY_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Method</label>
                        <select value={editForm.deliveryMethod} onChange={e => setEditForm({...editForm, deliveryMethod: e.target.value})}>
                          <option value="take_home">Take Home</option>
                          <option value="in_clinic">In-Clinic</option>
                        </select>
                      </div>
                    </div>

                    {/* Secondary Medications — add/remove + dosage/frequency per med */}
                    <div className="form-group">
                      <label>Add Secondary Medication</label>
                      <select
                        value=""
                        onChange={e => {
                          const med = e.target.value;
                          if (!med) return;
                          const current = editForm.secondaryMedications || [];
                          if (current.includes(med)) return;
                          const config = HRT_SECONDARY_DOSAGES[med] || {};
                          setEditForm({
                            ...editForm,
                            secondaryMedications: [...current, med],
                            secondaryMedDetails: {
                              ...editForm.secondaryMedDetails,
                              [med]: { dosage: config.doses?.[0] || '', frequency: config.defaultFrequency || '' }
                            }
                          });
                        }}
                        style={{ width: '100%' }}
                      >
                        <option value="">+ Add medication...</option>
                        {HRT_SECONDARY_MEDICATIONS
                          .filter(m => !(editForm.secondaryMedications || []).includes(m))
                          .map(m => <option key={m} value={m}>{m}</option>)
                        }
                      </select>
                    </div>

                    {/* Active secondary medications with dose + frequency */}
                    {(editForm.secondaryMedications || []).map(med => {
                      const config = HRT_SECONDARY_DOSAGES[med] || {};
                      const details = editForm.secondaryMedDetails?.[med] || {};
                      return (
                        <div key={med} style={{
                          padding: '12px', marginBottom: '8px',
                          background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 0,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed' }}>{med}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editForm.secondaryMedications || []).filter(x => x !== med);
                                const updatedDetails = { ...editForm.secondaryMedDetails };
                                delete updatedDetails[med];
                                setEditForm({ ...editForm, secondaryMedications: updated, secondaryMedDetails: updatedDetails });
                              }}
                              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                            >×</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Dosage</label>
                              <select
                                value={details.dosage || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  secondaryMedDetails: { ...editForm.secondaryMedDetails, [med]: { ...details, dosage: e.target.value } }
                                })}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px' }}
                              >
                                <option value="">Select dose...</option>
                                {(config.doses || []).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Frequency</label>
                              <select
                                value={details.frequency || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  secondaryMedDetails: { ...editForm.secondaryMedDetails, [med]: { ...details, frequency: e.target.value } }
                                })}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: '13px' }}
                              >
                                <option value="">Select frequency...</option>
                                {(config.frequencies || []).map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ── Status ── */}
                <div className="form-section-label" style={{ marginTop: '12px' }}>Status</div>
                <div className="form-group">
                  <label>Protocol Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                    {PROTOCOL_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* ── Notes ── */}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2} />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => handleDeleteProtocol(selectedProtocol.id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '13px', cursor: 'pointer', padding: '8px 0' }}
                >Delete Protocol</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleEditProtocol} className="btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Labs Modal */}
        {showLabsModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowLabsModal(false))}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Lab Results</h3>
                <button onClick={() => setShowLabsModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Lab Type</label>
                  <select value={labForm.labType} onChange={e => setLabForm({...labForm, labType: e.target.value})}>
                    <option value="Baseline">Baseline</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Panel</label>
                  <select value={labForm.labPanel} onChange={e => setLabForm({...labForm, labPanel: e.target.value})}>
                    <option value="Elite">Elite</option>
                    <option value="Essential">Essential</option>
                    <option value="Metabolic">Metabolic</option>
                    <option value="Hormone">Hormone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={labForm.completedDate} onChange={e => setLabForm({...labForm, completedDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={labForm.notes} onChange={e => setLabForm({...labForm, notes: e.target.value})} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowLabsModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddLabs} className="btn-primary">Save Labs</button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Lab PDF Modal */}
        {showUploadModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowUploadModal(false))}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Upload Lab PDF</h3>
                <button onClick={() => setShowUploadModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                {uploadError && <div className="error-box">{uploadError}</div>}
                <div className="form-group">
                  <label>PDF File *</label>
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} />
                  {uploadForm.file && <div className="file-selected">Selected: {uploadForm.file.name}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lab Type</label>
                    <select value={uploadForm.labType} onChange={e => setUploadForm({...uploadForm, labType: e.target.value})}>
                      <option value="Baseline">Baseline</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Panel Type</label>
                    <select value={uploadForm.panelType} onChange={e => setUploadForm({...uploadForm, panelType: e.target.value})}>
                      <option value="Elite">Elite</option>
                      <option value="Essential">Essential</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Collection Date</label>
                  <input type="date" value={uploadForm.collectionDate} onChange={e => setUploadForm({...uploadForm, collectionDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={uploadForm.notes} onChange={e => setUploadForm({...uploadForm, notes: e.target.value})} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleUploadDocument} disabled={uploading || !uploadForm.file} className="btn-primary">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Document Modal (Docs tab) */}
        {showDocUploadModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowDocUploadModal(false))}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Upload Document</h3>
                <button onClick={() => setShowDocUploadModal(false)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                {docUploadError && <div className="error-box">{docUploadError}</div>}
                <div className="form-group">
                  <label>File (PDF, JPG, or PNG) *</label>
                  <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleDocFileSelect} />
                  {docUploadForm.file && <div className="file-selected">Selected: {docUploadForm.file.name} ({(docUploadForm.file.size / 1024).toFixed(0)} KB)</div>}
                </div>
                <div className="form-group">
                  <label>Document Name *</label>
                  <input type="text" value={docUploadForm.documentName} onChange={e => setDocUploadForm({...docUploadForm, documentName: e.target.value})} placeholder="e.g. MRI Report - Left Knee" />
                </div>
                <div className="form-group">
                  <label>Document Type</label>
                  <select value={docUploadForm.documentType} onChange={e => setDocUploadForm({...docUploadForm, documentType: e.target.value})}>
                    <option value="MRI Report">MRI Report</option>
                    <option value="Imaging">Imaging</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Referral">Referral</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Medical Record">Medical Record</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={docUploadForm.notes} onChange={e => setDocUploadForm({...docUploadForm, notes: e.target.value})} rows={2} placeholder="Optional notes about this document" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowDocUploadModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDocUpload} disabled={docUploading || !docUploadForm.file} className="btn-primary">{docUploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Send Symptoms Modal */}
        {showSymptomsModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowSymptomsModal(false))}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Send Symptoms Questionnaire</h3>
                <button onClick={() => setShowSymptomsModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                {symptomsSent ? (
                  <div className="success-msg">✓ SMS sent successfully!</div>
                ) : (
                  <>
                    <p>Send symptoms questionnaire link to:</p>
                    <p><strong>{formatPhone(patient.phone) || 'No phone number'}</strong></p>
                  </>
                )}
              </div>
              {!symptomsSent && (
                <div className="modal-footer">
                  <button onClick={() => setShowSymptomsModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSendSymptoms} disabled={sendingSymptoms || !patient.phone} className="btn-primary">{sendingSymptoms ? 'Sending...' : 'Send SMS'}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Intake Modal */}
        {showIntakeModal && selectedIntake && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowIntakeModal(false))}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Intake Form Details</h3>
                <button onClick={() => setShowIntakeModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="intake-detail-grid">
                  <div className="detail-row"><label>Name</label><span>{selectedIntake.first_name} {selectedIntake.last_name}</span></div>
                  <div className="detail-row"><label>Email</label><span>{selectedIntake.email}</span></div>
                  <div className="detail-row"><label>Phone</label><span>{formatPhone(selectedIntake.phone)}</span></div>
                  <div className="detail-row"><label>DOB</label><span>{formatDate(selectedIntake.date_of_birth)}</span></div>
                  <div className="detail-row"><label>Gender</label><span>{selectedIntake.gender}</span></div>
                  <div className="detail-row"><label>Submitted</label><span>{formatDate(selectedIntake.submitted_at)}</span></div>
                </div>
                {selectedIntake.symptoms && (
                  <div className="intake-symptoms">
                    <h4>Symptoms</h4>
                    <pre>{JSON.stringify(selectedIntake.symptoms, null, 2)}</pre>
                  </div>
                )}
                <div className="intake-links">
                  {selectedIntake.pdf_url && <button onClick={() => openPdfViewer(selectedIntake.pdf_url, 'Medical Intake')} className="btn-secondary">View Full PDF</button>}
                  {selectedIntake.photo_id_url && <button onClick={() => openPdfViewer(selectedIntake.photo_id_url, 'Photo ID')} className="btn-secondary">View Photo ID</button>}
                  {selectedIntake.signature_url && <button onClick={() => openPdfViewer(selectedIntake.signature_url, 'Signature')} className="btn-secondary">View Signature</button>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowBookingModal(false))}>
            <div className="modal modal-booking" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Book Appointment</h3>
                <button onClick={() => setShowBookingModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <CalendarView wizardOnly preselectedPatient={{ id: patient.id, name: patient.name, email: patient.email, phone: patient.phone }} />
              </div>
            </div>
          </div>
        )}



        {/* ==================== ADD CREDIT MODAL ==================== */}
        {showAddCreditModal && (
          <div className="modal-overlay" {...overlayClickProps(() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); })}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Account Credit</h3>
                <button onClick={() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); }} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                {/* Balance banner */}
                <div style={{ background: creditBalanceCents > 0 ? '#f0fdf4' : '#f9fafb', border: `1px solid ${creditBalanceCents > 0 ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 0, padding: '10px 14px', marginBottom: 20, fontSize: 14, color: creditBalanceCents > 0 ? '#166534' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Current balance</span>
                  <strong style={{ fontSize: 16 }}>${(creditBalanceCents / 100).toFixed(2)}</strong>
                </div>

                {/* Add credit form */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add Credit</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Amount ($)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={addCreditAmount}
                        onChange={e => setAddCreditAmount(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 15, boxSizing: 'border-box' }}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Reason</label>
                      <select
                        value={addCreditReason}
                        onChange={e => setAddCreditReason(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                      >
                        <option value="manual">Manual adjustment</option>
                        <option value="gift">Gift</option>
                        <option value="refund">Refund / credit</option>
                        <option value="loyalty">Loyalty reward</option>
                        <option value="promotion">Promotion</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Note (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Gift from JP Perarie"
                      value={addCreditNote}
                      onChange={e => setAddCreditNote(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); }}
                      style={{ padding: '8px 18px', borderRadius: 0, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={addCreditSaving || !addCreditAmount || isNaN(Number(addCreditAmount)) || Number(addCreditAmount) <= 0}
                      onClick={async () => {
                        setAddCreditSaving(true);
                        try {
                          const res = await fetch('/api/credits/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              patient_id: patient.id,
                              amount_dollars: addCreditAmount,
                              reason: addCreditReason,
                              description: addCreditNote || null,
                              created_by: 'admin',
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to add credit');
                          setCreditBalanceCents(data.new_balance_cents);
                          setCreditBalanceLoaded(true);
                          // Refresh history
                          const hRes = await fetch(`/api/credits/${id}`);
                          if (hRes.ok) { const hData = await hRes.json(); setCreditHistory(hData.history || []); }
                          setAddCreditAmount('');
                          setAddCreditNote('');
                          setAddCreditReason('manual');
                        } catch (err) {
                          alert(`Error: ${err.message}`);
                        } finally {
                          setAddCreditSaving(false);
                        }
                      }}
                      style={{ padding: '8px 20px', borderRadius: 0, border: 'none', background: addCreditSaving ? '#9ca3af' : '#166534', color: '#fff', cursor: addCreditSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      {addCreditSaving ? 'Adding…' : 'Add Credit'}
                    </button>
                  </div>
                </div>

                {/* Credit history */}
                {creditHistory.length > 0 && (
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit History</div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {creditHistory.map(entry => {
                        const isPositive = entry.amount_cents > 0;
                        const dateStr = entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                        const amtStr = (isPositive ? '+' : '') + '$' + (Math.abs(entry.amount_cents) / 100).toFixed(2);
                        const label = entry.description || entry.reason || (entry.type === 'use' ? 'Applied at checkout' : 'Credit added');
                        return (
                          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{dateStr} · {entry.type === 'use' ? 'used' : entry.reason || 'added'}</div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: isPositive ? '#16a34a' : '#dc2626', flexShrink: 0 }}>{amtStr}</div>
                            {/* Only allow deleting 'add' entries; 'use' entries are locked to purchase records */}
                            {entry.type === 'add' && (
                              <button
                                onClick={() => handleDeleteCreditEntry(entry.id)}
                                disabled={deletingCreditId === entry.id}
                                title="Remove this credit entry"
                                style={{ background: 'none', border: 'none', cursor: deletingCreditId === entry.id ? 'not-allowed' : 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1, padding: '2px 4px', opacity: deletingCreditId === entry.id ? 0.4 : 1, flexShrink: 0 }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEND PROGRESS MODAL ==================== */}
        {showSendProgressModal && sendProgressProtocol && (
          <div className="modal-overlay" {...overlayClickProps(() => setShowSendProgressModal(false))}>
            <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Send Progress to Patient</h3>
                <button onClick={() => setShowSendProgressModal(false)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                {sendProgressResult ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{sendProgressResult.success ? '✅' : '❌'}</div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: sendProgressResult.success ? '#16a34a' : '#dc2626', lineHeight: 1.5 }}>
                      {sendProgressResult.message}
                    </p>
                    <button onClick={() => setShowSendProgressModal(false)} style={{ marginTop: '16px', padding: '8px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer', fontSize: '14px' }}>Done</button>
                  </div>
                ) : (
                  <>
                    <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                      Send {patient?.first_name || 'patient'}'s weight loss progress chart and a link to their portal.
                    </p>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>Send via</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['email', 'sms', 'both'].map(m => (
                          <button key={m} onClick={() => setSendProgressMethod(m)} style={{
                            flex: 1, padding: '10px', borderRadius: 0, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            border: sendProgressMethod === m ? '2px solid #1e40af' : '1px solid #ddd',
                            background: sendProgressMethod === m ? '#eff6ff' : '#fff',
                            color: sendProgressMethod === m ? '#1e40af' : '#666'
                          }}>
                            {m === 'both' ? '📧 + 💬 Both' : m === 'email' ? '📧 Email' : '💬 SMS'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(sendProgressMethod === 'email' || sendProgressMethod === 'both') && !patient?.email && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '10px', marginBottom: '8px', fontSize: '13px', color: '#dc2626' }}>⚠️ No email on file for this patient</div>
                    )}
                    {(sendProgressMethod === 'sms' || sendProgressMethod === 'both') && !patient?.phone && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '10px', marginBottom: '8px', fontSize: '13px', color: '#dc2626' }}>⚠️ No phone number on file for this patient</div>
                    )}
                    <div style={{ background: '#f9fafb', borderRadius: 0, padding: '14px', marginTop: '12px', fontSize: '13px', color: '#555' }}>
                      <strong style={{ color: '#333' }}>Will send:</strong>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                        {(sendProgressMethod === 'email' || sendProgressMethod === 'both') && patient?.email && (
                          <li>Email with chart image + portal link → {patient.email}</li>
                        )}
                        {(sendProgressMethod === 'sms' || sendProgressMethod === 'both') && patient?.phone && (
                          <li>SMS with summary + portal link → {patient.phone}</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
              {!sendProgressResult && (
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 20px', borderTop: '1px solid #eee' }}>
                  <button onClick={() => setShowSendProgressModal(false)} style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 0, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button
                    onClick={handleSendProgress}
                    disabled={sendingProgress || ((sendProgressMethod === 'email' || sendProgressMethod === 'both') && !patient?.email && sendProgressMethod !== 'sms') || ((sendProgressMethod === 'sms' || sendProgressMethod === 'both') && !patient?.phone && sendProgressMethod !== 'email')}
                    style={{ padding: '8px 20px', background: sendingProgress ? '#93c5fd' : '#1e40af', color: '#fff', border: 'none', borderRadius: 0, cursor: sendingProgress ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    {sendingProgress ? 'Sending...' : 'Send Progress'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== MERGE PROTOCOL MODAL ==================== */}
        {showMergeModal && mergeSource && (
          <div className="modal-overlay" {...overlayClickProps(() => { if (!merging) { setShowMergeModal(false); setMergeError(''); } })}>
            <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Merge Protocol</h3>
                <button onClick={() => { setShowMergeModal(false); setMergeError(''); }} className="close-btn" disabled={merging}>&times;</button>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ marginBottom: 16, fontSize: 14, color: '#374151' }}>
                  Merge <strong>{getProtocolDisplayName(mergeSource)}</strong> into another protocol.
                  The injection count will roll over, and the surviving protocol will use the earliest start date.
                </p>

                {/* Source protocol summary */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 0, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Will be closed (merged away)</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {getProtocolDisplayName(mergeSource)}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    {mergeSource.selected_dose && <span>{mergeSource.selected_dose} · </span>}
                    Started {mergeSource.start_date ? new Date(mergeSource.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    {' · '}{mergeSource.sessions_used || 0} injections logged
                  </div>
                </div>

                {/* Target selector */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Merge into (surviving protocol):
                </label>
                <select
                  value={mergeTarget?.id || ''}
                  onChange={e => {
                    const all = [...activeProtocols, ...completedProtocols];
                    const chosen = all.find(p => p.id === e.target.value);
                    setMergeTarget(chosen || null);
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, marginBottom: 16, background: '#fff' }}
                  disabled={merging}
                >
                  {[...activeProtocols, ...completedProtocols]
                    .filter(p => p.id !== mergeSource.id && p.category === mergeSource.category && p.status !== 'merged' && p.status !== 'cancelled')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {getProtocolDisplayName(p)}
                        {p.selected_dose ? ` · ${p.selected_dose}` : ''}
                        {' · '}Started {p.start_date ? new Date(p.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {' · '}{p.sessions_used || 0} injections
                      </option>
                    ))}
                </select>

                {/* Preview */}
                {mergeTarget && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Surviving protocol (after merge)</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {getProtocolDisplayName(mergeTarget)}
                    </div>
                    <div style={{ fontSize: 13, color: '#444', marginTop: 2 }}>
                      Combined injections: <strong>{(mergeSource.sessions_used || 0) + (mergeTarget.sessions_used || 0)}</strong>
                      {' · '}Start date: <strong>
                        {(() => {
                          const s = mergeSource.start_date ? new Date(mergeSource.start_date + 'T12:00:00') : null;
                          const t = mergeTarget.start_date ? new Date(mergeTarget.start_date + 'T12:00:00') : null;
                          const earliest = s && t ? (s < t ? mergeSource.start_date : mergeTarget.start_date) : (mergeSource.start_date || mergeTarget.start_date);
                          return earliest ? new Date(earliest + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                        })()}
                      </strong>
                    </div>
                  </div>
                )}

                {mergeError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 0, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
                    {mergeError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowMergeModal(false); setMergeError(''); }}
                    disabled={merging}
                    style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', cursor: 'pointer', fontSize: 14 }}
                  >Cancel</button>
                  <button
                    onClick={handleMergeProtocol}
                    disabled={merging || !mergeTarget}
                    style={{ padding: '8px 20px', background: merging ? '#9ca3af' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 0, cursor: merging ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
                  >{merging ? 'Merging...' : 'Merge Protocol'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== EXTEND WL PROTOCOL MODAL ==================== */}
        {showExtendWLModal && extendWLProtocol && (
          <div className="modal-overlay" {...overlayClickProps(() => { if (!extendingWL) { setShowExtendWLModal(false); } })}>
            <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Extend Weight Loss Protocol</h3>
                <button onClick={() => setShowExtendWLModal(false)} className="close-btn" disabled={extendingWL}>&times;</button>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Current protocol summary */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Current Protocol</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{extendWLProtocol.medication || 'Weight Loss'} · {extendWLProtocol.selected_dose || '—'}</div>
                  <div style={{ fontSize: 13, color: '#444', marginTop: 2 }}>
                    {extendWLProtocol.sessions_used || 0}/{extendWLProtocol.total_sessions || 0} sessions used
                  </div>
                </div>

                {/* Duration */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Extend by
                </label>
                <select
                  value={extendWLDays}
                  onChange={e => setExtendWLDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, marginBottom: 16, background: '#fff' }}
                  disabled={extendingWL}
                >
                  <option value={7}>1 week (1 session)</option>
                  <option value={14}>2 weeks (2 sessions)</option>
                  <option value={28}>4 weeks (4 sessions)</option>
                  <option value={56}>8 weeks (8 sessions)</option>
                </select>

                {/* Dose change */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Dose (change if titrating)
                </label>
                <select
                  value={extendWLDose}
                  onChange={e => setExtendWLDose(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, marginBottom: 16, background: '#fff' }}
                  disabled={extendingWL}
                >
                  <option value="">— Keep current —</option>
                  {(WEIGHT_LOSS_DOSAGES[extendWLProtocol.medication] || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Link purchase */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Link purchase (optional)
                </label>
                <select
                  value={extendWLPurchaseId}
                  onChange={e => setExtendWLPurchaseId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, marginBottom: 16, background: '#fff' }}
                  disabled={extendingWL}
                >
                  <option value="">— None —</option>
                  {(allPurchases || [])
                    .filter(p => p.category === 'weight_loss' && !p.protocol_id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.item_name || p.description || 'Weight Loss'} — ${Number(p.amount_paid || 0).toFixed(0)} — {p.purchase_date ? new Date(p.purchase_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </option>
                    ))}
                </select>

                {/* Notes */}
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Notes (optional)
                </label>
                <textarea
                  value={extendWLNotes}
                  onChange={e => setExtendWLNotes(e.target.value)}
                  placeholder="e.g. Patient tolerating well, no side effects"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, marginBottom: 16, resize: 'vertical', minHeight: 60 }}
                  disabled={extendingWL}
                />

                {/* Preview */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 0, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>After extension</div>
                  <div style={{ fontSize: 13, color: '#1e3a5f' }}>
                    Sessions: {extendWLProtocol.sessions_used || 0}/{(extendWLProtocol.total_sessions || 0) + Math.floor(extendWLDays / 7)}
                    {' · '}<strong>{Math.floor(extendWLDays / 7)} new sessions</strong> added
                    {extendWLDose && extendWLDose !== extendWLProtocol.selected_dose && (
                      <span> · Dose: {extendWLProtocol.selected_dose} → <strong>{extendWLDose}</strong></span>
                    )}
                  </div>
                </div>

                {extendWLError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 0, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
                    {extendWLError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowExtendWLModal(false)}
                    disabled={extendingWL}
                    style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', cursor: 'pointer', fontSize: 14 }}
                  >Cancel</button>
                  <button
                    onClick={async () => {
                      setExtendingWL(true);
                      setExtendWLError('');
                      try {
                        const body = {
                          extensionDays: extendWLDays,
                          pickupFrequency: extendWLDays,
                        };
                        if (extendWLDose && extendWLDose !== extendWLProtocol.selected_dose) {
                          body.newDose = extendWLDose;
                        }
                        if (extendWLPurchaseId) {
                          body.purchaseId = extendWLPurchaseId;
                        }
                        if (extendWLNotes) {
                          body.notes = extendWLNotes;
                        }
                        const res = await fetch(`/api/protocols/${extendWLProtocol.id}/extend-wl`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to extend protocol');
                        setShowExtendWLModal(false);
                        fetchPatient();
                      } catch (err) {
                        setExtendWLError(err.message);
                      } finally {
                        setExtendingWL(false);
                      }
                    }}
                    disabled={extendingWL}
                    style={{ padding: '8px 20px', background: extendingWL ? '#9ca3af' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 0, cursor: extendingWL ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
                  >{extendingWL ? 'Extending...' : 'Extend Protocol'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== LOG ENTRY MODAL (shared ServiceLogContent) ==================== */}
        {showServiceLog && patient && (
          <ServiceLogContent
            key={serviceLogKey}
            autoOpen
            onClose={() => { setShowServiceLog(false); fetchPatient(); }}
            onLogComplete={handleLogComplete}
            preselectedPatient={{
              id: patient.id,
              name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name,
              phone: patient.phone,
            }}
          />
        )}

        {/* ==================== QUICK WEIGHT LOG MODAL ==================== */}
        {quickWeightModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setQuickWeightModal(null))}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3>Log Entry — {formatShortDate(quickWeightModal.slotDate)}</h3>
                <button onClick={() => setQuickWeightModal(null)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                  Fill in this week for {patient?.first_name || patient?.name}. Add dose to log as injection, or just weight for a check-in.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Dose</label>
                    <input
                      type="text"
                      value={quickWeightForm.dosage}
                      onChange={e => setQuickWeightForm({ ...quickWeightForm, dosage: e.target.value })}
                      placeholder="e.g. 4mg"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (lbs)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickWeightForm.weight}
                      onChange={e => setQuickWeightForm({ ...quickWeightForm, weight: e.target.value })}
                      placeholder="e.g. 148.5"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={quickWeightForm.notes}
                    onChange={e => setQuickWeightForm({ ...quickWeightForm, notes: e.target.value })}
                    rows={2}
                    placeholder="e.g. Backfill, no side effects"
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button
                  onClick={() => {
                    setQuickWeightModal(null);
                    openLogEntryModal(quickWeightModal.protocol, null);
                  }}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 0, background: '#fff', color: '#374151', cursor: 'pointer' }}
                >
                  Full Service Log
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setQuickWeightModal(null)} className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleQuickWeightSave}
                    disabled={quickWeightSaving || (!quickWeightForm.weight && !quickWeightForm.dosage)}
                    className="btn-primary"
                  >
                    {quickWeightSaving ? 'Saving...' : 'Save Weight'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipment Reminder Modal — auto-prompt after partial fulfillment */}
        {shipmentReminderModal && (
          <div className="modal-overlay" {...overlayClickProps(() => setShipmentReminderModal(null))}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h3>📦 Schedule Shipment Reminder</h3>
                <button onClick={() => setShipmentReminderModal(null)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 16, fontSize: 13 }}>
                  <strong style={{ color: '#92400e' }}>{shipmentReminderModal.pending} {shipmentReminderModal.medication || 'injection'}{shipmentReminderModal.pending > 1 ? 's' : ''}</strong>
                  <span style={{ color: '#78716c' }}> still need to be shipped to </span>
                  <strong style={{ color: '#92400e' }}>{shipmentReminderModal.patientName}</strong>
                </div>
                <div className="form-group">
                  <label>Ship by date *</label>
                  <input
                    type="date"
                    value={shipmentReminderForm.dueDate}
                    onChange={e => setShipmentReminderForm({ ...shipmentReminderForm, dueDate: e.target.value })}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div className="form-group">
                  <label>Assign to</label>
                  <select
                    value={shipmentReminderForm.assignedTo}
                    onChange={e => setShipmentReminderForm({ ...shipmentReminderForm, assignedTo: e.target.value })}
                    style={{ fontSize: 14 }}
                  >
                    <option value="">Select...</option>
                    {(taskEmployees || []).map(e => (
                      <option key={e.id} value={e.id}>{e.name}{e.id === employee?.id ? ' (Me)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={shipmentReminderForm.notes}
                    onChange={e => setShipmentReminderForm({ ...shipmentReminderForm, notes: e.target.value })}
                    rows={2}
                    placeholder="e.g. Ship to New Jersey address, FedEx overnight"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShipmentReminderModal(null)} className="btn-secondary">Skip</button>
                <button
                  onClick={handleCreateShipmentReminder}
                  disabled={shipmentReminderSaving || !shipmentReminderForm.dueDate || !shipmentReminderForm.assignedTo}
                  className="btn-primary"
                >
                  {shipmentReminderSaving ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Patient Confirmation Modal */}
        {showDeleteConfirm && deletePreview && (
          <>
            <div className="modal-overlay" {...overlayClickProps(() => { setShowDeleteConfirm(false); setDeletePreview(null); })} />
            <div className="modal delete-modal">
              <h3>Delete Patient</h3>
              <p style={{ margin: '12px 0', color: '#dc2626', fontWeight: 600 }}>
                Are you sure you want to permanently delete <strong>{deletePreview.patient?.name}</strong>?
              </p>
              {deletePreview.totalRecords > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, padding: '12px 16px', margin: '12px 0' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14 }}>
                    This will also delete {deletePreview.totalRecords} related record{deletePreview.totalRecords !== 1 ? 's' : ''}:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#666' }}>
                    {Object.entries(deletePreview.relatedRecords).map(([table, count]) => (
                      <li key={table}>{table.replace(/_/g, ' ')}: {count}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p style={{ margin: '12px 0', fontSize: 13, color: '#888' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePreview(null); }}
                  className="action-btn"
                  style={{ padding: '8px 20px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePatient}
                  disabled={deleting}
                  style={{
                    padding: '8px 20px', background: '#dc2626', color: '#fff',
                    border: 'none', borderRadius: 0, cursor: deleting ? 'wait' : 'pointer',
                    fontWeight: 600, opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Quick View — Encounters + Protocols */}
        {showQuickView && (
          <EncounterQuickView
            appointments={appointments}
            notes={notes}
            protocols={[...activeProtocols, ...completedProtocols]}
            onClose={() => setShowQuickView(false)}
            onOpenEncounter={(apt) => {
              setShowQuickView(false);
              setEditingAppointment(apt);
            }}
          />
        )}

        {/* Encounter Modal (replaces old Appointment Edit Modal) */}
        {editingAppointment && (
          <EncounterModal
            appointment={{ ...editingAppointment, patient_id: patient?.id }}
            currentUser={session?.user?.user_metadata?.full_name || session?.user?.email || 'Staff'}
            onClose={() => setEditingAppointment(null)}
            onRefresh={fetchPatient}
          />
        )}

        {/* Standalone Encounter Modal — create encounter note without a scheduled appointment */}
        {showStandaloneEncounterModal && (
          <StandaloneEncounterModal
            patient={patient}
            currentUser={session?.user?.user_metadata?.full_name || session?.user?.email || 'Staff'}
            onClose={() => setShowStandaloneEncounterModal(false)}
            onRefresh={fetchPatient}
          />
        )}

        {/* PDF Slide-Out Viewer */}
        {pdfSlideOut.open && (
          <>
            <div className="slideout-overlay" {...overlayClickProps(closePdfViewer)} />
            <div className="slideout-panel" style={{ width: `${slideoutWidth}%` }}>
              <div className="slideout-header">
                <h3>{pdfSlideOut.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Send to Patient button — shown for any document with a URL */}
                  {pdfSlideOut.url && !pdfSlideOut.url.startsWith('blob:') && (
                    <button onClick={() => {
                      setSendDocModal({ open: true, url: pdfSlideOut.url, name: pdfSlideOut.docName || pdfSlideOut.title, type: 'document' });
                      setSendDocMethod('both');
                      setSendDocResult(null);
                    }} style={{
                      padding: '5px 14px', fontSize: 12, fontWeight: 600,
                      background: '#2563eb', color: '#fff', border: 'none',
                      borderRadius: 0, cursor: 'pointer', marginRight: 6,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      Send to Patient
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
                    {[30, 50, 70].map(w => (
                      <button key={w} onClick={() => setSlideoutWidth(w)} style={{
                        padding: '4px 8px', fontSize: 11, fontWeight: 600, border: '1px solid #d1d5db',
                        borderRadius: 0, cursor: 'pointer',
                        background: slideoutWidth === w ? '#111827' : '#fff',
                        color: slideoutWidth === w ? '#fff' : '#374151',
                      }}>{w === 30 ? 'S' : w === 50 ? 'M' : 'L'}</button>
                    ))}
                  </div>
                  <button onClick={closePdfViewer} className="close-btn">×</button>
                </div>
              </div>
              <div className="slideout-content">
                {/\.(jpg|jpeg|png|gif|webp|bmp|heic)(\?|$)/i.test(pdfSlideOut.url) ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%', overflow: 'auto', padding: 20, background: '#f3f4f6' }}>
                    <img
                      src={pdfSlideOut.url}
                      alt={pdfSlideOut.title}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                    />
                  </div>
                ) : (
                  <iframe
                    src={pdfSlideOut.url}
                    title={pdfSlideOut.title}
                    className="slideout-iframe"
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Session Log Modal */}
        {sessionLogModal && (
          <>
            <div onClick={() => setSessionLogModal(null)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
              width: '90%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
                ✅ Log Session #{sessionLogModal.sessionNum}
              </h3>
              <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
                Mark this session as completed
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Session Date
                </label>
                <input
                  type="date"
                  value={sessionLogDate}
                  onChange={e => setSessionLogDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setSessionLogModal(null)} style={{
                  padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                  background: '#fff', cursor: 'pointer', fontSize: 14
                }}>Cancel</button>
                <button onClick={handleSessionLog} disabled={sessionLogSaving} style={{
                  padding: '8px 20px', border: 'none', borderRadius: 0,
                  background: '#000', color: '#fff', cursor: sessionLogSaving ? 'wait' : 'pointer',
                  fontSize: 14, fontWeight: 600, opacity: sessionLogSaving ? 0.6 : 1
                }}>{sessionLogSaving ? 'Saving...' : 'Log Session'}</button>
              </div>
            </div>
          </>
        )}

        {/* Blood Draw Modal */}
        {bloodDrawModal && (
          <>
            <div onClick={() => setBloodDrawModal(null)} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: '#fff', borderRadius: 0, padding: 24, zIndex: 10001,
              width: '90%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
                🩸 {bloodDrawModal.label}
              </h3>
              <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
                Scheduled: {bloodDrawModal.weekLabel}
                {bloodDrawModal.status === 'completed' && (
                  <span style={{ color: '#22c55e', fontWeight: 600 }}> — Completed</span>
                )}
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {bloodDrawModal.status === 'completed' ? 'Completed Date' : 'Completion Date'}
                </label>
                <input
                  type="date"
                  value={bloodDrawDate}
                  onChange={e => setBloodDrawDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {bloodDrawModal.status === 'completed' && (
                  <button onClick={() => handleBloodDrawSave('undo')} disabled={bloodDrawSaving} style={{
                    padding: '8px 16px', border: '1px solid #dc2626', borderRadius: 0,
                    background: '#fff', color: '#dc2626', cursor: bloodDrawSaving ? 'wait' : 'pointer',
                    fontSize: 13, fontWeight: 600, marginRight: 'auto'
                  }}>Undo</button>
                )}
                <button onClick={() => setBloodDrawModal(null)} style={{
                  padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 0,
                  background: '#fff', cursor: 'pointer', fontSize: 14
                }}>Cancel</button>
                <button onClick={() => handleBloodDrawSave('complete')} disabled={bloodDrawSaving} style={{
                  padding: '8px 20px', border: 'none', borderRadius: 0,
                  background: '#000', color: '#fff', cursor: bloodDrawSaving ? 'wait' : 'pointer',
                  fontSize: 14, fontWeight: 600, opacity: bloodDrawSaving ? 0.6 : 1
                }}>{bloodDrawSaving ? 'Saving...' : bloodDrawModal.status === 'completed' ? 'Update Date' : 'Mark Complete'}</button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .patient-profile {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .loading, .error {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        .error { color: #dc2626; }

        /* Header */
        .profile-header {
          margin-bottom: 20px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }
        .photo-id-badge {
          flex-shrink: 0;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s;
          gap: 1px;
          padding: 0;
          font-family: inherit;
        }
        .photo-id-badge:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
        }
        .photo-id-icon {
          font-size: 16px;
          line-height: 1;
        }
        .photo-id-label {
          font-size: 8px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          line-height: 1;
        }
        .photo-id-empty {
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          border-color: #c7d2fe;
          cursor: default;
        }
        .photo-id-empty:hover {
          border-color: #c7d2fe;
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          box-shadow: none;
        }
        .photo-id-initials {
          font-size: 20px;
          font-weight: 700;
          color: #4338ca;
          line-height: 1;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 14px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px 0;
          margin-top: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .back-btn:hover { color: #000; }
        .header-identity { min-width: 0; }
        .header-identity h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .contact-row {
          display: flex;
          gap: 12px;
          color: #6b7280;
          font-size: 13px;
          flex-wrap: wrap;
          align-items: center;
        }
        .blooio-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }
        /* Protocol Activity Row */
        .protocol-activity-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .protocol-activity-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .protocol-activity-badge:hover { opacity: 0.8; }
        .protocol-activity-name {
          font-weight: 600;
          white-space: nowrap;
        }
        .protocol-activity-detail {
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0.85;
        }
        .protocol-renewal-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          margin-left: 2px;
        }
        /* Header Toolbar */
        .header-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 12px;
          padding: 4px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        .toolbar-divider {
          width: 1px;
          height: 22px;
          background: #e2e8f0;
          margin: 0 4px;
          flex-shrink: 0;
        }
        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          line-height: 1;
          transition: all 0.15s;
          text-decoration: none;
        }
        .toolbar-btn:hover { background: #e2e8f0; color: #0f172a; }
        .toolbar-btn-orange { background: #fff7ed; color: #c2410c; font-weight: 600; }
        .toolbar-btn-orange:hover { background: #ffedd5; }
        .toolbar-btn-blue { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .toolbar-btn-blue:hover { background: #dbeafe; }
        .toolbar-btn-green { background: #f0fdf4; color: #16a34a; font-weight: 600; }
        .toolbar-btn-green:hover { background: #dcfce7; }
        .toolbar-btn-credit { background: #f0fdf4; color: #166534; }
        .toolbar-btn-credit:hover { background: #dcfce7; }
        .toolbar-btn-dark { background: #1e293b; color: #fff; font-weight: 600; }
        .toolbar-btn-dark:hover { background: #334155; }
        .toolbar-btn-orange { background: #fff7ed; color: #c2410c; font-weight: 600; }
        .toolbar-btn-orange:hover { background: #ffedd5; }
        .toolbar-btn-purple { background: #f5f3ff; color: #6d28d9; font-weight: 600; }
        .toolbar-btn-purple:hover { background: #ede9fe; }
        .toolbar-btn-more { padding: 6px 8px; font-size: 16px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
        .toolbar-btn-more:hover { color: #475569; }
        .toolbar-count {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 10px;
          background: #ede9fe;
          color: #6d28d9;
          font-weight: 700;
          margin-left: 2px;
        }
        .toolbar-label { pointer-events: none; }
        .toolbar-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        .toolbar-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          min-width: 200px;
          z-index: 100;
          padding: 4px;
          overflow: hidden;
        }
        .toolbar-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: none;
          color: #374151;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          border-radius: 7px;
          text-decoration: none;
          transition: background 0.1s;
        }
        .toolbar-dropdown-item:hover { background: #f1f5f9; }
        .toolbar-dropdown-danger { color: #dc2626; }
        .toolbar-dropdown-danger:hover { background: #fef2f2; }
        .delete-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          z-index: 10001;
          max-width: 480px;
          width: 90%;
        }

        /* Staff Briefing Bar (AI Synopsis + Staff Notes) */
        .staff-briefing-bar {
          margin: 0 0 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
        }
        .briefing-section {
          min-width: 0;
        }
        .briefing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 14px;
          background: #f9fafb;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.15s;
        }
        .briefing-header:hover { background: #f3f4f6; }
        .briefing-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .briefing-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .briefing-title {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.5px;
        }
        .briefing-loading {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 400;
          font-style: italic;
        }
        .briefing-count {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          background: #f3f4f6;
          padding: 1px 7px;
          border-radius: 10px;
        }
        .briefing-chevron {
          font-size: 10px;
          color: #9ca3af;
        }
        .briefing-add-btn {
          background: #111827;
          color: #fff;
          border: none;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .briefing-add-btn:hover { opacity: 0.85; }
        .briefing-body {
          padding: 12px 14px;
        }
        .briefing-placeholder {
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
        }
        .quick-note-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .quick-note-input {
          flex: 1;
          padding: 7px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .quick-note-input:focus { border-color: #111827; }
        .quick-note-save-btn {
          background: #111827;
          color: #fff;
          border: none;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .quick-note-save-btn:hover { opacity: 0.85; }
        .quick-note-save-btn:disabled { opacity: 0.4; cursor: default; }
        .briefing-notes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .briefing-note-item {
          padding: 8px 10px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #f3f4f6;
        }
        .briefing-note-meta {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 3px;
        }
        .briefing-note-pin {
          margin-left: 4px;
          font-size: 11px;
        }
        .briefing-note-body {
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
          white-space: pre-wrap;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .briefing-note-body-expanded {
          display: block;
          -webkit-line-clamp: unset;
          overflow: visible;
        }
        .briefing-view-all {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          text-align: left;
        }
        .briefing-view-all:hover { text-decoration: underline; }

        /* Patient Synopsis Card */
        .synopsis-card {
          margin: 0 0 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
        }
        .synopsis-alerts {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .synopsis-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .synopsis-alert:hover { opacity: 0.85; }
        .synopsis-alert-urgent {
          background: #fef2f2;
          color: #991b1b;
          border-bottom: 1px solid #fecaca;
        }
        .synopsis-alert-soon {
          background: #fffbeb;
          color: #92400e;
          border-bottom: 1px solid #fde68a;
        }
        .synopsis-alert-hrt {
          background: #faf5ff;
          color: #6b21a8;
          border-bottom: 1px solid #e9d5ff;
        }
        .synopsis-alert-info {
          background: #eff6ff;
          color: #1e40af;
          border-bottom: 1px solid #bfdbfe;
        }
        .synopsis-alert-icon { font-size: 15px; flex-shrink: 0; }
        .synopsis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 640px) {
          .synopsis-grid { grid-template-columns: 1fr; }
        }
        .synopsis-section {
          padding: 12px 16px;
        }
        .synopsis-section + .synopsis-section {
          border-left: 1px solid #f3f4f6;
        }
        @media (max-width: 640px) {
          .synopsis-section + .synopsis-section {
            border-left: none;
            border-top: 1px solid #f3f4f6;
          }
        }
        .synopsis-section-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .synopsis-empty {
          font-size: 13px;
          color: #9ca3af;
        }
        .synopsis-protocols {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .synopsis-protocol-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          cursor: pointer;
          padding: 2px 0;
        }
        .synopsis-protocol-row:hover { opacity: 0.8; }
        .synopsis-protocol-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .synopsis-protocol-name {
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
        }
        .synopsis-protocol-dose {
          color: #6b7280;
          font-size: 12px;
          white-space: nowrap;
        }
        .synopsis-protocol-supply {
          font-size: 12px;
          margin-left: auto;
          white-space: nowrap;
          font-weight: 500;
        }
        .synopsis-payments {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .synopsis-payment-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          cursor: pointer;
          padding: 2px 0;
        }
        .synopsis-payment-row:hover { opacity: 0.8; }
        .synopsis-payment-icon {
          font-size: 13px;
          flex-shrink: 0;
        }
        .synopsis-payment-desc {
          color: #1a1a1a;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .synopsis-payment-amount {
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          margin-left: auto;
        }
        .synopsis-payment-date {
          color: #9ca3af;
          font-size: 12px;
          white-space: nowrap;
        }
        .synopsis-payment-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .synopsis-payment-active {
          background: #dcfce7;
          color: #166534;
        }

        /* Demographics Toggle */
        .demographics-toggle-row {
          margin-top: 0;
          border-top: 1px solid #e5e7eb;
        }
        .demographics-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: #f8fafc;
          border: none;
          cursor: pointer;
          padding: 10px 16px;
          color: #374151;
          font-size: 13px;
          transition: background 0.15s;
        }
        .demographics-toggle:hover { background: #f1f5f9; }
        .demographics-preview {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #475569;
          flex-wrap: wrap;
        }
        .demographics-preview span + span::before {
          content: '·';
          margin-right: 16px;
          color: #94a3b8;
        }
        .demographics-toggle-icon {
          font-size: 12px;
          color: #3b82f6;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Demographics Section */
        .demographics-section {
          margin-top: 8px;
          padding: 14px 16px;
          background: #f9fafb;
          border-radius: 8px;
          animation: slideDown 0.15s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .demographics-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .edit-demographics-btn {
          background: none;
          border: none;
          font-size: 12px;
          color: #6b7280;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .edit-demographics-btn:hover { background: #e5e7eb; color: #111; }
        .save-demographics-btn {
          background: #2563eb;
          color: #fff;
          border: none;
          font-size: 12px;
          padding: 4px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .save-demographics-btn:hover { background: #1d4ed8; }
        .save-demographics-btn:disabled { opacity: 0.6; }
        .cancel-demographics-btn {
          background: #fff;
          border: 1px solid #d1d5db;
          font-size: 12px;
          padding: 4px 14px;
          border-radius: 4px;
          cursor: pointer;
          color: #374151;
        }
        .cancel-demographics-btn:hover { background: #f3f4f6; }
        .demographics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .demo-item label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .demo-item span {
          font-size: 14px;
          color: #111;
        }
        .from-intake {
          font-size: 11px;
          color: #6b7280;
          font-style: italic;
        }
        .demographics-edit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .edit-field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .edit-field input, .edit-field select {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        .edit-field input:focus, .edit-field select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
        }
        .edit-field-full {
          grid-column: 1 / -1;
        }

        /* Pending Section */
        .pending-section {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .pending-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
        }
        .pending-list { display: flex; flex-direction: column; gap: 8px; }
        .pending-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          padding: 12px 16px;
          border-radius: 6px;
        }
        .pending-info strong { display: block; margin-bottom: 2px; }
        .pending-info span { font-size: 13px; color: #666; }
        .pending-actions { display: flex; gap: 8px; }

        /* Tabs — Epic-style */
        .px-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 20px;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 3px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .px-tabs::-webkit-scrollbar { display: none; }
        .px-tabs button {
          padding: 10px 16px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-radius: 7px;
          white-space: nowrap;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .px-tabs button:hover { background: rgba(255,255,255,0.6); color: #334155; }
        .px-tabs button.active {
          background: #fff;
          color: #0f172a;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .px-tab-icon {
          font-size: 15px;
          line-height: 1;
        }
        .px-tab-label {
          line-height: 1;
        }
        .px-tab-count {
          font-size: 10px;
          font-weight: 700;
          background: #e2e8f0;
          color: #475569;
          padding: 1px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          line-height: 1.5;
        }
        .px-tabs button.active .px-tab-count {
          background: #dbeafe;
          color: #2563eb;
        }

        /* Cards */
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .empty {
          padding: 32px;
          text-align: center;
          color: #9ca3af;
        }

        /* Assessment */
        .assessment-grid { padding: 16px; }
        .assessment-item {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .assessment-item:last-child { border-bottom: none; }
        .assessment-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .status-complete { color: #059669; }
        .status-pending { color: #f59e0b; }

        /* Protocols */
        .protocol-list { padding: 0 16px 16px; }
        .protocol-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .protocol-row:last-child { border-bottom: none; }
        .protocol-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .protocol-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .protocol-name { font-weight: 500; }
        .protocol-dose { color: #666; font-size: 14px; }
        .protocol-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .status-text { font-size: 13px; color: #666; }
        .status-badge {
          font-size: 12px;
          padding: 4px 10px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
        }
        .protocol-card {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .protocol-card.completed { background: #f9fafb; }
        .protocol-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .protocol-details {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }
        .protocol-details span { margin-right: 12px; }
        .protocol-dates { font-size: 13px; color: #9ca3af; }
        .protocol-schedule {
          font-size: 13px;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .clinic-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .protocol-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        /* Weight Loss Progress */
        .wl-progress {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .wl-stats-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .wl-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .wl-stat-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .wl-stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #111;
        }
        .wl-stat-delta {
          font-size: 13px;
          font-weight: 600;
          color: #16a34a;
        }
        .wl-stat-arrow {
          color: #9ca3af;
          font-size: 18px;
        }
        .wl-stat-divider {
          width: 1px;
          height: 32px;
          background: #e5e7eb;
          margin: 0 4px;
        }
        .wl-chart {
          margin-bottom: 16px;
          background: #fafafa;
          border-radius: 8px;
          padding: 12px 4px;
        }
        .wl-history {
          overflow-x: auto;
        }
        .wl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .wl-table th {
          text-align: left;
          padding: 8px 12px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
          font-size: 12px;
          text-transform: uppercase;
        }
        .wl-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .wl-table tr:last-child td {
          border-bottom: none;
        }
        .wl-editable-row {
          cursor: pointer;
          transition: background 0.15s;
        }
        .wl-editable-row:hover {
          background: #f0f9ff;
        }
        .wl-editable-row:hover svg {
          stroke: #1e40af;
        }

        /* Protocol Expand — inline trackers */
        .protocol-expand {
          border-top: 1px solid #e5e7eb;
          padding: 16px 0 0;
          margin-top: 12px;
        }
        .px-stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .px-stat {
          flex: 1;
          min-width: 100px;
          background: #f9fafb;
          border-radius: 8px;
          padding: 10px 14px;
          text-align: center;
        }
        .px-stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .px-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .px-session-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
          gap: 6px;
          margin-bottom: 10px;
        }
        .px-session-grid.has-dates {
          grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
        }
        .px-session-box {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          position: relative;
          user-select: none;
        }
        .has-dates .px-session-box {
          aspect-ratio: auto;
          padding: 6px 2px;
          min-height: 48px;
        }
        .px-session-box.used {
          background: #22c55e;
          color: #fff;
        }
        .px-session-box.next {
          background: #111827;
          color: #fff;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .px-session-box.next:hover {
          transform: scale(1.08);
        }
        .px-session-box.future {
          background: #f3f4f6;
          color: #9ca3af;
        }
        .px-session-num {
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
        }
        .px-session-check {
          font-size: 10px;
          line-height: 1;
          margin-top: 1px;
        }
        .px-session-date {
          font-size: 9px;
          font-weight: 500;
          line-height: 1;
          margin-top: 2px;
          opacity: 0.9;
        }
        .px-session-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1;
          margin-top: 1px;
        }
        .px-legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        .px-legend-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 3px;
          margin-right: 4px;
          vertical-align: middle;
        }
        .px-cycle-bar {
          margin-bottom: 12px;
        }
        .px-bar-bg {
          width: 100%;
          height: 10px;
          background: #e5e7eb;
          border-radius: 5px;
          overflow: hidden;
        }
        .px-bar-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 5px;
          transition: width 0.3s;
        }
        .px-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .px-actions button {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #fff;
          cursor: pointer;
          transition: background 0.15s;
        }
        .px-actions button:hover {
          background: #f3f4f6;
        }
        .px-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .px-day-date {
          font-size: 8px;
          color: inherit;
          opacity: 0.8;
          line-height: 1;
          margin-top: 1px;
        }

        .view-all {
          display: block;
          text-align: center;
          padding: 12px;
          color: #2563eb;
          font-size: 14px;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* Intakes */
        .intake-list { padding: 0 16px 16px; }
        .intake-list.full { padding: 16px; }
        .intake-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
        }
        .intake-row:hover { background: #f9fafb; }
        .intake-icon { font-size: 24px; }
        .intake-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .intake-info strong { font-size: 14px; }
        .intake-info span { font-size: 13px; color: #666; }
        .intake-arrow { color: #9ca3af; }
        .intake-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .intake-card:hover { border-color: #000; }
        .intake-header {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        .intake-header > div {
          display: flex;
          flex-direction: column;
        }
        .intake-header strong { font-size: 15px; }
        .intake-header span { font-size: 13px; color: #666; }
        .intake-details {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }
        .intake-details span { margin-right: 16px; }
        .intake-actions { display: flex; gap: 8px; }

        /* Consent Cards */
        .consent-list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .consent-card {
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          transition: border-color 0.15s;
          cursor: pointer;
        }
        .consent-card:hover { border-color: #d1d5db; background: #fafafa; }
        .consent-header {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 6px;
        }
        .consent-icon { font-size: 18px; line-height: 1; }
        .consent-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .consent-title-group strong { font-size: 14px; font-weight: 600; color: #111; }
        .consent-status {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .consent-status.signed {
          background: #dcfce7;
          color: #15803d;
        }
        .consent-status.pending {
          background: #fef3c7;
          color: #a16207;
        }
        .consent-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 10px;
          padding-left: 28px;
        }
        .consent-date { color: #9ca3af; }
        .consent-actions { display: flex; gap: 8px; padding-left: 28px; }

        /* Document Cards */
        .document-list { padding: 16px; }
        .document-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .document-header {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        .document-icon { font-size: 20px; }
        .document-header > div {
          display: flex;
          flex-direction: column;
        }
        .document-header strong { font-size: 15px; }
        .document-type {
          font-size: 12px;
          color: #666;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }
        .document-details {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }
        .document-details span { margin-right: 16px; }
        .document-actions { display: flex; gap: 8px; }

        /* Labs & Docs */
        .doc-list { padding: 16px; }
        .doc-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .doc-icon { font-size: 24px; }
        .doc-info { flex: 1; }
        .doc-info strong { display: block; margin-bottom: 2px; }
        .doc-info span { font-size: 13px; color: #666; }
        .doc-actions { display: flex; gap: 8px; align-items: center; }
        .lab-list { padding: 16px; }
        .lab-row {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .lab-info strong { display: block; margin-bottom: 2px; }
        .lab-info span { font-size: 13px; color: #666; }

        /* Sessions */
        .session-list { padding: 16px; }
        .session-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .session-date {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          min-width: 80px;
        }
        .session-info strong { display: block; }
        .session-info span { font-size: 13px; color: #666; }
        .session-notes {
          font-size: 13px;
          color: #666;
          font-style: italic;
        }

        /* Appointments */
        .appointments-list { padding: 16px; }
        .appointment-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .appointment-row.upcoming {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }
        .appointment-row.past {
          background: #f9fafb;
        }
        .appointment-row:hover {
          background: #eff6ff !important;
          border-color: #bfdbfe;
        }
        .apt-date {
          min-width: 100px;
          text-align: center;
        }
        .apt-day {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .apt-time {
          font-size: 14px;
          font-weight: 500;
          color: #000;
        }
        .apt-details {
          flex: 1;
        }
        .apt-details strong {
          display: block;
          margin-bottom: 2px;
        }
        .apt-title {
          font-size: 13px;
          color: #666;
        }
        .apt-status {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: capitalize;
        }

        /* Notes */
        .notes-list { padding: 16px; }
        .note-row {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .note-date {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }
        .note-body {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        /* Buttons */
        .btn-primary {
          background: #000;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
        .btn-primary-sm {
          background: #000;
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-secondary {
          background: #fff;
          color: #000;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-secondary-sm {
          background: #fff;
          color: #000;
          border: 1px solid #d1d5db;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-text {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
        }
        .btn-text.danger { color: #dc2626; font-size: 18px; }
        .btn-group { display: flex; gap: 8px; }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
        }
        .modal-sm { max-width: 380px; }
        .modal-lg { max-width: 700px; }
        .modal-large { max-width: 600px; }
        .modal-booking { max-width: 1200px; }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
        }
        .modal-body { padding: 20px; }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
        }
        .modal-preview {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-weight: 500;
        }

        /* Forms */
        .form-group { margin-bottom: 16px; }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-group textarea { resize: vertical; }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-section-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 16px 0 8px 0;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .form-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
          padding: 8px 10px;
          background: #f9fafb;
          border-radius: 4px;
        }
        .checkbox-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          cursor: pointer;
        }
        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .error-box {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .success-msg {
          text-align: center;
          color: #059669;
          font-size: 16px;
          font-weight: 500;
          padding: 20px;
        }
        .file-selected {
          margin-top: 8px;
          font-size: 13px;
          color: #059669;
        }
        .pack-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .pack-toggle button {
          flex: 1;
          padding: 10px;
          border: 2px solid #d1d5db;
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .pack-toggle button.active {
          border-color: #000;
          background: #000;
          color: #fff;
        }

        /* Intake Detail Modal */
        .intake-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .detail-row {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-row label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .detail-row span { font-size: 14px; }
        .intake-symptoms {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .intake-symptoms h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        .intake-symptoms pre {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          overflow: auto;
          max-height: 200px;
        }
        .intake-links {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        /* Timeline */
        .timeline-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-chip {
          padding: 6px 14px;
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          color: #6b7280;
        }
        .filter-chip:hover { border-color: #000; color: #000; }
        .filter-chip.active {
          background: #000;
          color: #fff;
          border-color: #000;
        }
        .timeline-list { padding: 16px; }
        .timeline-event {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .timeline-event:last-child { border-bottom: none; }
        .timeline-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .timeline-content { flex: 1; min-width: 0; }
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .timeline-title { font-weight: 500; font-size: 14px; }
        .timeline-date { font-size: 12px; color: #9ca3af; white-space: nowrap; }
        .timeline-detail { font-size: 13px; color: #6b7280; margin-top: 2px; }

        /* Payments */
        .payments-list { padding: 0; }
        .payment-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .payment-row:last-child { border-bottom: none; }
        .payment-info { flex: 1; min-width: 0; }
        .payment-info strong { display: block; font-size: 14px; }
        .payment-date { font-size: 12px; color: #9ca3af; }
        .payment-amount { font-weight: 600; font-size: 15px; white-space: nowrap; }
        .payment-status {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          white-space: nowrap;
        }

        /* Communications */
        .comms-list { padding: 0; }
        .comms-row {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .comms-row:last-child { border-bottom: none; }
        .comms-row.inbound { background: #f9fafb; }
        .comms-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .comms-content { flex: 1; min-width: 0; }
        .comms-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }
        .comms-type { font-weight: 500; font-size: 13px; }
        .comms-date { font-size: 12px; color: #9ca3af; }
        .comms-message-type {
          font-size: 12px;
          color: #6b7280;
          text-transform: capitalize;
          margin-bottom: 4px;
        }
        .comms-body {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }
        .comms-status {
          display: inline-block;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

        /* Slide-Out PDF Viewer */
        .slideout-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1100;
          animation: fadeIn 0.2s ease-out;
        }
        .slideout-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          min-width: 300px;
          background: #fff;
          box-shadow: -4px 0 20px rgba(0,0,0,0.15);
          z-index: 1101;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.25s ease-out;
          transition: width 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .slideout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .slideout-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .slideout-content {
          flex: 1;
          overflow: hidden;
        }
        .slideout-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Send Forms Modal */
        .sf-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 10000; display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .sf-modal {
          background: #fff; border-radius: 16px; width: 100%; max-width: 540px;
          max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .sf-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px 12px; position: sticky; top: 0; background: #fff;
          border-bottom: 1px solid #f1f5f9; border-radius: 16px 16px 0 0; z-index: 1;
        }
        .sf-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
        .sf-close {
          background: none; border: none; font-size: 18px; color: #94a3b8;
          cursor: pointer; padding: 4px 8px; border-radius: 6px;
        }
        .sf-close:hover { background: #f1f5f9; color: #475569; }
        .sf-tab-row {
          display: flex; gap: 0; padding: 0 24px; border-bottom: 1px solid #e2e8f0;
        }
        .sf-tab-btn {
          flex: 1; padding: 10px 16px; border: none; background: none;
          font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer;
          border-bottom: 2px solid transparent; font-family: inherit;
          transition: all 0.15s;
        }
        .sf-tab-btn:hover { color: #475569; }
        .sf-tab-btn.active { color: #1e40af; border-bottom-color: #2563eb; }
        .sf-quick-row {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 16px 24px 8px;
        }
        .sf-quick-btn {
          padding: 5px 12px; border-radius: 20px; border: 1px solid #e2e8f0;
          background: #fff; color: #475569; font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .sf-quick-btn:hover { border-color: #94a3b8; background: #f8fafc; }
        .sf-quick-btn.active { background: #1e40af; color: #fff; border-color: #1e40af; }
        .sf-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
          padding: 12px 24px;
        }
        .sf-form-card {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; transition: all 0.15s;
          font-family: inherit; text-align: left;
        }
        .sf-form-card:hover { border-color: #94a3b8; background: #f8fafc; }
        .sf-form-card.active { border-color: #2563eb; background: #eff6ff; }
        .sf-form-check {
          width: 18px; height: 18px; border-radius: 4px; border: 2px solid #d1d5db;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
          transition: all 0.15s;
        }
        .sf-form-card.active .sf-form-check {
          background: #2563eb; border-color: #2563eb;
        }
        .sf-form-icon { font-size: 14px; flex-shrink: 0; }
        .sf-form-name { font-size: 12px; font-weight: 500; color: #1e293b; flex: 1; }
        .sf-form-time { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
        .sf-delivery {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 24px;
        }
        .sf-toggle {
          display: flex; background: #f1f5f9; border-radius: 8px; padding: 2px;
        }
        .sf-toggle-btn {
          padding: 6px 14px; border: none; border-radius: 6px;
          background: transparent; color: #64748b; font-size: 12px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .sf-toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sf-toggle-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .sf-delivery-to { font-size: 12px; color: #64748b; }
        .sf-actions { padding: 12px 24px 20px; display: flex; flex-direction: column; gap: 8px; }
        .sf-send-btn {
          width: 100%; padding: 12px; border: none; border-radius: 10px;
          background: #2563eb; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sf-send-btn:hover:not(:disabled) { background: #1d4ed8; }
        .sf-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sf-result {
          padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
          text-align: center;
        }
        .sf-result-ok { background: #f0fdf4; color: #166534; }
        .sf-result-err { background: #fef2f2; color: #991b1b; }

        /* Payments Section Styles */
        .pay-tabs {
          display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .pay-tab {
          padding: 6px 14px; border-radius: 20px; border: 1px solid #e2e8f0;
          background: #fff; color: #475569; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .pay-tab:hover { border-color: #94a3b8; background: #f8fafc; }
        .pay-tab.active { background: #1e40af; color: #fff; border-color: #1e40af; }
        .pay-section {
          background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .pay-section-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
        }
        .pay-section-header h3 {
          margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;
        }
        .pay-btn-primary {
          padding: 6px 14px; border-radius: 8px; border: none;
          background: #16a34a; color: #fff; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .pay-btn-primary:hover { background: #15803d; }
        .pay-btn-secondary {
          padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #fff; color: #475569; font-size: 12px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .pay-btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }
        .pay-empty {
          padding: 32px 20px; text-align: center; color: #94a3b8; font-size: 13px;
        }
        .pay-list { padding: 8px 12px; }
        .pay-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 10px; border: 1px solid #f1f5f9;
          background: #fafbfc; margin-bottom: 6px; transition: all 0.15s;
        }
        .pay-item:hover { border-color: #e2e8f0; background: #f8fafc; }
        .pay-item-info { flex: 1; min-width: 0; }
        .pay-item-title {
          font-size: 13px; font-weight: 600; color: #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pay-item-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .pay-item-amount { font-size: 15px; font-weight: 700; color: #0f172a; flex-shrink: 0; }
        .pay-badge {
          display: inline-block; padding: 3px 10px; border-radius: 12px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0;
        }
        .pay-badge-green { background: #dcfce7; color: #166534; }
        .pay-badge-yellow { background: #fef3c7; color: #92400e; }
        .pay-badge-red { background: #fee2e2; color: #dc2626; }
        .pay-badge-gray { background: #f3f4f6; color: #6b7280; }
        .pay-badge-blue { background: #dbeafe; color: #1e40af; }
        .pay-sub-card {
          background: #fafbfc; border-radius: 12px; border: 1px solid #e2e8f0;
          padding: 16px 18px; margin: 6px 0;
        }
        .pay-sub-card.past-due { border: 2px solid #fca5a5; }
        .pay-sub-header {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;
        }
        .pay-sub-name { font-weight: 700; font-size: 14px; color: #0f172a; }
        .pay-sub-since { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .pay-sub-price { font-weight: 700; font-size: 17px; color: #0f172a; text-align: right; }
        .pay-sub-price span { font-size: 11px; font-weight: 400; color: #94a3b8; }
        .pay-sub-details {
          display: flex; gap: 16px; font-size: 11px; color: #94a3b8; margin-bottom: 10px; flex-wrap: wrap;
        }
        .pay-sub-details strong { color: #475569; font-weight: 600; }
        .pay-sub-alert {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
          padding: 10px 14px; margin-bottom: 10px; font-size: 12px; color: #991b1b;
        }
        .pay-sub-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .pay-sub-actions button, .pay-sub-actions select, .pay-sub-actions a {
          padding: 5px 12px; font-size: 11px; border-radius: 6px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .pay-card-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: #fafbfc; border-radius: 10px;
          margin-bottom: 6px; border: 1px solid #f1f5f9;
        }
        .pay-card-icon { font-size: 20px; flex-shrink: 0; }
        .pay-card-info { flex: 1; }
        .pay-card-brand { font-weight: 600; font-size: 13px; color: #1e293b; }
        .pay-card-exp { font-size: 11px; color: #94a3b8; }
        .pay-new-sub-form {
          margin: 0 12px 12px; padding: 16px; background: #f0fdf4;
          border-radius: 10px; border: 1px solid #bbf7d0;
        }

        /* Responsive: Tablet */
        @media (max-width: 768px) {
          .patient-profile { padding: 16px; }
          .header-top { flex-direction: column; gap: 12px; }
          .header-left { width: 100%; }
          .header-identity h1 { font-size: 22px; }
          .header-toolbar { gap: 3px; }
          .toolbar-btn { padding: 5px 8px; font-size: 11px; }
          .toolbar-divider { height: 18px; }
          .sf-form-grid { grid-template-columns: 1fr; }
          .demographics-grid { grid-template-columns: repeat(2, 1fr); }
          .demographics-edit-grid { grid-template-columns: repeat(2, 1fr); }
          .demographics-preview { gap: 8px; font-size: 11px; }
          .px-tabs button { padding: 7px 10px; font-size: 11px; }
          .pending-card { flex-direction: column; gap: 12px; align-items: flex-start; }
          .protocol-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .intake-detail-grid { grid-template-columns: 1fr; }
          .slideout-panel { width: 100% !important; min-width: unset; }
          .form-row { grid-template-columns: 1fr; }
        }

        /* Responsive: Phone */
        @media (max-width: 480px) {
          .patient-profile { padding: 12px; }
          .header-identity h1 { font-size: 20px; }
          .back-text { display: none; }
          .contact-row { font-size: 12px; gap: 8px; }
          .header-toolbar { gap: 2px; padding: 3px; }
          .toolbar-label { display: none; }
          .toolbar-btn { padding: 6px 8px; }
          .toolbar-divider { margin: 0 2px; height: 16px; }
          .demographics-grid { grid-template-columns: 1fr; gap: 10px; }
          .demographics-edit-grid { grid-template-columns: 1fr; }
          .demographics-preview { flex-direction: column; gap: 2px; }
          .demographics-preview span + span::before { display: none; }
          .px-tabs button { padding: 6px 8px; font-size: 10px; gap: 3px; }
          .px-tab-icon { font-size: 12px; }
          .px-tab-count { font-size: 9px; padding: 1px 4px; }
          .card-header { padding: 12px 14px; }
          .pending-actions { width: 100%; }
          .pending-actions button { flex: 1; }
          .modal { max-width: 100% !important; border-radius: 16px 16px 0 0; width: 100%; }
          .wl-table { font-size: 12px; }
          .wl-table th, .wl-table td { padding: 6px 8px; }
        }
      `}</style>

      {/* Protocol PDF Modal */}
      {showProtocolPdfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowProtocolPdfModal(false)}>
          <div style={{ background: '#fff', borderRadius: 0, width: '90%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0a0a0a' }}>📄 Generate Protocol PDF</h3>
              <button onClick={() => setShowProtocolPdfModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', padding: '4px 8px' }}>✕</button>
            </div>

            {/* Protocol Selection */}
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Select peptide protocols to include in the PDF. You can adjust dose, duration, and pricing for each.</p>

              {Object.entries(protocolPdfSelections).map(([protId, sel]) => (
                <div key={protId} style={{
                  border: `1px solid ${sel.selected ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: 0, padding: '14px 16px', marginBottom: 12,
                  background: sel.selected ? '#f0f7ff' : '#fafafa',
                  transition: 'all 0.15s',
                }}>
                  {/* Toggle + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sel.selected ? 12 : 0 }}>
                    <input type="checkbox" checked={sel.selected} onChange={() => {
                      setProtocolPdfSelections(prev => ({
                        ...prev,
                        [protId]: { ...prev[protId], selected: !sel.selected }
                      }));
                    }} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>🧬 {sel.medication}</span>
                  </div>

                  {/* Editable fields (when selected) */}
                  {sel.selected && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', paddingLeft: 28 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Dose</label>
                        <input value={sel.dose} onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], dose: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Frequency</label>
                        <input value={sel.frequency} onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], frequency: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Duration</label>
                        <select value={sel.duration} onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], duration: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, background: '#fff' }}>
                          <option value="1 month">1 month</option>
                          <option value="2 months">2 months</option>
                          <option value="3 months">3 months</option>
                          <option value="6 months">6 months</option>
                          <option value="12 months">12 months</option>
                          <option value="Ongoing">Ongoing</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Price/Mo ($)</label>
                        <input type="number" value={sel.pricePerMonth} placeholder="e.g. 200" onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], pricePerMonth: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Plan Issued Date */}
              {Object.values(protocolPdfSelections).some(s => s.selected) && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Plan Issued Date</label>
                  <input type="date" value={protocolPdfPlanDate} onChange={e => setProtocolPdfPlanDate(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 0, fontSize: 13, width: 180 }} />
                  {(() => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const picked = new Date(protocolPdfPlanDate + 'T00:00:00');
                    const diff = Math.round((today - picked) / (1000*60*60*24));
                    if (diff > 0) return <span style={{ marginLeft: 10, fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 0 }}>Backdated {diff} day{diff !== 1 ? 's' : ''}</span>;
                    return null;
                  })()}
                </div>
              )}

              {Object.keys(protocolPdfSelections).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: 14 }}>
                  No active peptide protocols found for this patient.
                </div>
              )}
            </div>

            {/* Options */}
            {Object.values(protocolPdfSelections).filter(s => s.selected).length > 1 && (
              <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={protocolPdfCombine} onChange={() => setProtocolPdfCombine(!protocolPdfCombine)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} id="combine-pdf" />
                <label htmlFor="combine-pdf" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                  Combine into single document
                </label>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '16px 24px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowProtocolPdfModal(false)}
                style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 0, cursor: 'pointer' }}>
                Cancel
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveProtocolPdfToChart} disabled={protocolPdfSaving || Object.values(protocolPdfSelections).filter(s => s.selected).length === 0}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600,
                    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                    borderRadius: 0, cursor: 'pointer', opacity: protocolPdfSaving ? 0.6 : 1,
                  }}>
                  {protocolPdfSaving ? 'Saving...' : '💾 Save to Chart'}
                </button>
                <button onClick={handleSaveAndSendProtocolPdf} disabled={protocolPdfSaving || Object.values(protocolPdfSelections).filter(s => s.selected).length === 0}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600,
                    background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                    borderRadius: 0, cursor: 'pointer', opacity: protocolPdfSaving ? 0.6 : 1,
                  }}>
                  {protocolPdfSaving ? 'Saving...' : '📤 Save & Send'}
                </button>
                <button onClick={handleGenerateProtocolPdf} disabled={protocolPdfGenerating || Object.values(protocolPdfSelections).filter(s => s.selected).length === 0}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    background: '#0a0a0a', color: '#fff', border: 'none',
                    borderRadius: 0, cursor: 'pointer', opacity: protocolPdfGenerating ? 0.6 : 1,
                  }}>
                  {protocolPdfGenerating ? 'Generating...' : '📄 Preview PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Forms Modal */}
      {showSendFormsModal && (
        <div className="sf-overlay" {...overlayClickProps(() => setShowSendFormsModal(false))}>
          <div className="sf-modal" onClick={e => e.stopPropagation()}>
            <div className="sf-header">
              <h3>{sendFormsTab === 'forms' ? '📋' : '📖'} Send {sendFormsTab === 'forms' ? 'Forms' : 'Guides'} {patient?.first_name ? `to ${patient.first_name}` : ''}</h3>
              <button className="sf-close" onClick={() => setShowSendFormsModal(false)}>✕</button>
            </div>

            {/* Forms / Guides Tab Toggle */}
            <div className="sf-tab-row">
              <button className={`sf-tab-btn ${sendFormsTab === 'forms' ? 'active' : ''}`} onClick={() => setSendFormsTab('forms')}>
                📋 Forms {sendFormsSelected.size > 0 ? `(${sendFormsSelected.size})` : ''}
              </button>
              <button className={`sf-tab-btn ${sendFormsTab === 'guides' ? 'active' : ''}`} onClick={() => setSendFormsTab('guides')}>
                📖 Guides {sendGuidesSelected.size > 0 ? `(${sendGuidesSelected.size})` : ''}
              </button>
            </div>

            {sendFormsTab === 'forms' ? (
              <>
                {/* Quick Selects */}
                <div className="sf-quick-row">
                  {FORM_QUICK_SELECTS.map(qs => {
                    const isActive = qs.forms.every(f => sendFormsSelected.has(f)) && qs.forms.length === sendFormsSelected.size;
                    return (
                      <button key={qs.label} className={`sf-quick-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setSendFormsSelected(new Set(qs.forms))}>
                        {qs.label}
                      </button>
                    );
                  })}
                </div>

                {/* Form Grid */}
                <div className="sf-form-grid">
                  {SEND_FORMS_LIST.map(form => {
                    const checked = sendFormsSelected.has(form.id);
                    return (
                      <button key={form.id} className={`sf-form-card ${checked ? 'active' : ''}`}
                        onClick={() => {
                          const next = new Set(sendFormsSelected);
                          if (checked) next.delete(form.id); else next.add(form.id);
                          setSendFormsSelected(next);
                        }}>
                        <span className="sf-form-check">{checked ? '✓' : ''}</span>
                        <span className="sf-form-icon">{form.icon}</span>
                        <span className="sf-form-name">{form.name}</span>
                        <span className="sf-form-time">{form.time}</span>
                        {form.gender && patient?.gender && (
                          <span style={{fontSize: '0.6875rem', color: patient.gender === 'Female' ? '#ec4899' : '#3b82f6', fontWeight: 600, marginTop: '2px'}}>
                            {patient.gender === 'Female' ? '♀ Female' : '♂ Male'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Guide Category Filters */}
                <div className="sf-quick-row">
                  {GUIDE_CATEGORY_FILTERS.map(cat => (
                    <button key={cat.id} className={`sf-quick-btn ${sendGuidesCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSendGuidesCategory(cat.id)}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Guide Grid */}
                <div className="sf-form-grid">
                  {AVAILABLE_GUIDES
                    .filter(g => sendGuidesCategory === 'all' || g.category === sendGuidesCategory)
                    .map(guide => {
                      const checked = sendGuidesSelected.has(guide.id);
                      return (
                        <button key={guide.id} className={`sf-form-card ${checked ? 'active' : ''}`}
                          onClick={() => {
                            const next = new Set(sendGuidesSelected);
                            if (checked) next.delete(guide.id); else next.add(guide.id);
                            setSendGuidesSelected(next);
                          }}>
                          <span className="sf-form-check">{checked ? '✓' : ''}</span>
                          <span className="sf-form-icon">{guide.icon}</span>
                          <span className="sf-form-name">{guide.name}</span>
                        </button>
                      );
                    })}
                </div>
              </>
            )}

            {/* Delivery Method */}
            <div className="sf-delivery">
              <div className="sf-toggle">
                <button className={`sf-toggle-btn ${sendFormsMethod === 'sms' ? 'active' : ''}`} onClick={() => setSendFormsMethod('sms')} disabled={!patient?.phone}>
                  💬 SMS
                </button>
                <button className={`sf-toggle-btn ${sendFormsMethod === 'email' ? 'active' : ''}`} onClick={() => setSendFormsMethod('email')} disabled={!patient?.email}>
                  ✉️ Email
                </button>
              </div>
              <span className="sf-delivery-to">
                {sendFormsMethod === 'sms' ? (patient?.phone ? formatPhone(patient.phone) : 'No phone') : (patient?.email || 'No email')}
              </span>
            </div>

            {/* Send Button + Result */}
            <div className="sf-actions">
              {sendFormsTab === 'forms' ? (
                <button className="sf-send-btn" disabled={sendFormsSelected.size === 0 || sendFormsLoading || (sendFormsMethod === 'sms' && !patient?.phone) || (sendFormsMethod === 'email' && !patient?.email)}
                  onClick={handleSendForms}>
                  {sendFormsLoading ? 'Sending...' : `Send ${sendFormsSelected.size} Form${sendFormsSelected.size !== 1 ? 's' : ''} via ${sendFormsMethod === 'sms' ? 'SMS' : 'Email'}`}
                </button>
              ) : (
                <button className="sf-send-btn" disabled={sendGuidesSelected.size === 0 || sendFormsLoading || (sendFormsMethod === 'sms' && !patient?.phone) || (sendFormsMethod === 'email' && !patient?.email)}
                  onClick={handleSendGuides}>
                  {sendFormsLoading ? 'Sending...' : `Send ${sendGuidesSelected.size} Guide${sendGuidesSelected.size !== 1 ? 's' : ''} via ${sendFormsMethod === 'sms' ? 'SMS' : 'Email'}`}
                </button>
              )}
              {sendFormsResult && (
                <div className={`sf-result ${sendFormsResult.success ? 'sf-result-ok' : 'sf-result-err'}`}>
                  {sendFormsResult.success ? '✓' : '✕'} {sendFormsResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Document Modal */}
      {sendDocModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setSendDocModal({ open: false, url: '', name: '', type: '' })}>
          <div style={{
            background: '#fff', borderRadius: 0, width: 440, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Send Document to Patient</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>{sendDocModal.name}</p>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              {/* Patient contact info */}
              <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 0, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#6b7280' }}>Email:</span>
                  <span style={{ color: patient?.email ? '#111827' : '#ef4444', fontWeight: 500 }}>
                    {patient?.email || 'Not on file'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Phone:</span>
                  <span style={{ color: patient?.phone ? '#111827' : '#ef4444', fontWeight: 500 }}>
                    {patient?.phone || 'Not on file'}
                  </span>
                </div>
              </div>

              {/* Delivery method toggle */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>
                  Send via:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'email', label: 'Email Only', icon: '📧' },
                    { key: 'sms', label: 'Text Only', icon: '💬' },
                    { key: 'both', label: 'Both', icon: '📨' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setSendDocMethod(opt.key)}
                      style={{
                        flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 600,
                        background: sendDocMethod === opt.key ? '#eff6ff' : '#fff',
                        color: sendDocMethod === opt.key ? '#2563eb' : '#6b7280',
                        border: sendDocMethod === opt.key ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: 0, cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}>
                      <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warnings for missing contact info */}
              {sendDocMethod !== 'sms' && !patient?.email && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, fontSize: 12, color: '#991b1b', marginBottom: 8 }}>
                  No email address on file for this patient.
                </div>
              )}
              {sendDocMethod !== 'email' && !patient?.phone && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 0, fontSize: 12, color: '#991b1b', marginBottom: 8 }}>
                  No phone number on file for this patient.
                </div>
              )}

              {/* Results */}
              {sendDocResult && (
                <div style={{ marginTop: 8 }}>
                  {sendDocResult.map((r, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 0, fontSize: 13, marginBottom: 4,
                      background: r.success ? '#f0fdf4' : '#fef2f2',
                      border: r.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      color: r.success ? '#166534' : '#991b1b',
                    }}>
                      {r.success ? '✓' : '✗'} {r.type === 'email' ? 'Email' : 'Text'}: {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setSendDocModal({ open: false, url: '', name: '', type: '' })}
                style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 0, cursor: 'pointer' }}>
                {sendDocResult ? 'Done' : 'Cancel'}
              </button>
              {!sendDocResult && (
                <button onClick={handleSendDocument} disabled={sendDocLoading}
                  style={{
                    padding: '8px 24px', fontSize: 13, fontWeight: 600,
                    background: '#2563eb', color: '#fff', border: 'none',
                    borderRadius: 0, cursor: 'pointer', opacity: sendDocLoading ? 0.6 : 1,
                  }}>
                  {sendDocLoading ? 'Sending...' : 'Send Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        recipientEmail={patient?.email}
        recipientName={patient?.first_name || patient?.name || ''}
        patientId={patient?.id}
        patientName={patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()}
        ghlContactId={patient?.ghl_contact_id}
        session={session}
      />

      {/* Dispense Modal */}
      {dispensingProtocol && (
        <div className="modal-overlay" {...overlayClickProps(() => { setDispensingProtocol(null); setDispenseResult(null); })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Dispense Medication</h3>
              <button onClick={() => { setDispensingProtocol(null); setDispenseResult(null); }} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              {/* Patient */}
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()}</span>
              </div>

              {/* Medication */}
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medication</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{getProtocolDisplayName(dispensingProtocol)}</span>
              </div>

              {/* Dosage */}
              {(dispensingProtocol.selected_dose || dispensingProtocol.dosage) && (() => {
                const doseOptions = getDispenseDoseOptions(dispensingProtocol);
                if (doseOptions && doseOptions.length > 0) {
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Dosage</div>
                      {customDoseMode ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="e.g. 0.275ml / 55mg"
                            value={customDoseValue}
                            onChange={e => setCustomDoseValue(e.target.value)}
                            autoFocus
                            style={{ flex: 1, padding: '10px 12px', fontSize: '14px', fontWeight: 600, border: '2px solid #2563eb', borderRadius: 0, fontFamily: 'inherit', color: '#111', background: '#eff6ff', outline: 'none' }}
                          />
                          <button onClick={() => { if (customDoseValue.trim()) { setDispenseDosage(customDoseValue.trim()); setCustomDoseMode(false); } }} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, background: '#111', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer' }}>Set</button>
                          <button onClick={() => { setCustomDoseMode(false); setCustomDoseValue(''); }} style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 0, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <select
                          value={dispenseDosage}
                          onChange={e => {
                            if (e.target.value === '__custom__') { setCustomDoseMode(true); setCustomDoseValue(''); }
                            else setDispenseDosage(e.target.value);
                          }}
                          style={{
                            width: '100%', padding: '10px 12px', fontSize: '14px', fontWeight: 600,
                            border: dispenseDosage !== (dispensingProtocol.selected_dose || dispensingProtocol.dosage) ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                            borderRadius: 0, fontFamily: 'inherit', color: '#111',
                            background: dispenseDosage !== (dispensingProtocol.selected_dose || dispensingProtocol.dosage) ? '#fffbeb' : '#fff',
                            cursor: 'pointer', outline: 'none',
                            appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M6 8L1 3h10z\' fill=\'%236b7280\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px',
                          }}
                        >
                          {!doseOptions.some(d => d.value === dispenseDosage) && dispenseDosage && (
                            <option value={dispenseDosage}>{dispenseDosage} (current)</option>
                          )}
                          {doseOptions.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                          <option value="__custom__">Custom dose...</option>
                        </select>
                      )}
                      {dispenseDosage !== (dispensingProtocol.selected_dose || dispensingProtocol.dosage) && !customDoseMode && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>Changed from {dispensingProtocol.selected_dose || dispensingProtocol.dosage}</div>
                      )}
                    </div>
                  );
                }
                return (
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dosage</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{dispenseDosage}</span>
                  </div>
                );
              })()}

              {/* Supply Type Selector */}
              {(() => {
                const options = getDispenseSupplyOptions(dispensingProtocol);
                const pt = (dispensingProtocol.program_type || dispensingProtocol.category || '').toLowerCase();
                const vialInfo = pt === 'peptide' ? getPeptideVialSupply(dispensingProtocol.medication || dispensingProtocol.program_name || '') : null;
                if (options) {
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                        {vialInfo ? `Vial Supply (${vialInfo.vialSize})` : 'Supply Type'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {options.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setSelectedSupplyType(opt.value); setSplitDoseMode(false); setSplitDoses([]); setDosingNotes(''); }}
                            style={{
                              padding: '8px 16px', borderRadius: 0, fontSize: '13px', fontWeight: 600,
                              fontFamily: 'inherit', cursor: 'pointer',
                              border: selectedSupplyType === opt.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                              background: selectedSupplyType === opt.value ? '#eff6ff' : '#fff',
                              color: selectedSupplyType === opt.value ? '#2563eb' : '#374151',
                            }}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return dispensingProtocol.supply_type ? (
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supply</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{SUPPLY_LABELS[dispensingProtocol.supply_type] || dispensingProtocol.supply_type}</span>
                  </div>
                ) : null;
              })()}

              {/* Refill Cycle */}
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Refill Cycle</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>{formatIntervalLabel(getDispenseActiveInterval())}</span>
              </div>

              {/* Date Picker */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Dispense Date</div>
                <input
                  type="date"
                  value={dispenseDate}
                  onChange={e => setDispenseDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 0, fontSize: '14px', fontFamily: 'inherit', color: '#111', boxSizing: 'border-box' }}
                />
              </div>

              {/* Dosing Notes — weight loss only */}
              {['weight_loss'].includes((dispensingProtocol.program_type || dispensingProtocol.category || '').toLowerCase()) && (() => {
                const supplyCount = selectedSupplyType.startsWith('wl_') ? parseInt(selectedSupplyType.split('_')[1]) : 1;
                const med = dispensingProtocol.medication || dispensingProtocol.program_name || '';
                const doseOptions = WEIGHT_LOSS_DOSAGES[med] || [];
                const currentDose = dispenseDosage || dispensingProtocol.selected_dose || dispensingProtocol.dosage || '';

                return supplyCount > 1 ? (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dosing Schedule</div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!splitDoseMode) {
                            setSplitDoseMode(true);
                            setSplitDoses(Array.from({ length: supplyCount }, () => currentDose));
                          } else {
                            setSplitDoseMode(false);
                            setSplitDoses([]);
                            setDosingNotes('');
                          }
                        }}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: splitDoseMode ? '1px solid #dc2626' : '1px solid #2563eb',
                          background: splitDoseMode ? '#fef2f2' : '#eff6ff',
                          color: splitDoseMode ? '#dc2626' : '#2563eb',
                          borderRadius: 0, fontFamily: 'inherit',
                        }}
                      >
                        {splitDoseMode ? 'Cancel Split' : `Split ${supplyCount} Doses`}
                      </button>
                    </div>
                    {splitDoseMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {splitDoses.map((dose, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 60 }}>Wk {i + 1}</span>
                            <select
                              value={dose}
                              onChange={e => {
                                const updated = [...splitDoses];
                                updated[i] = e.target.value;
                                setSplitDoses(updated);
                                setDosingNotes(updated.map((d, idx) => `${d} wk${idx + 1}`).join(' → '));
                              }}
                              style={{
                                flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600,
                                border: dose !== currentDose ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                                background: dose !== currentDose ? '#fffbeb' : '#fff',
                                borderRadius: 0, fontFamily: 'inherit', color: '#111', cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M6 8L1 3h10z\' fill=\'%236b7280\'/%3E%3C/svg%3E")',
                                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px',
                              }}
                            >
                              {doseOptions.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                        {splitDoses.length > 0 && !splitDoses.every(d => d === splitDoses[0]) && (
                          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                            Schedule: {splitDoses.map((d, i) => `${d} wk${i + 1}`).join(' → ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        All {supplyCount} injections at {currentDose}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              {/* Refill Cycle Override */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Refill Due In</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Auto', value: '' },
                    { label: '1 week', value: '7' },
                    { label: '2 weeks', value: '14' },
                    { label: '4 weeks', value: '28' },
                    { label: '6 weeks', value: '42' },
                    { label: '8 weeks', value: '56' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRefillOverride(opt.value)}
                      style={{
                        padding: '7px 14px', borderRadius: 0, fontSize: '13px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'inherit',
                        border: refillOverride === opt.value ? '2px solid #111' : '1px solid #ddd',
                        background: refillOverride === opt.value ? '#111' : '#fff',
                        color: refillOverride === opt.value ? '#fff' : '#666',
                      }}
                    >
                      {opt.label}{opt.value === '' && getIntervalForSupply(selectedSupplyType, dispensingProtocol) ? ` (${getIntervalForSupply(selectedSupplyType, dispensingProtocol)}d)` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview: Next Refill */}
              {dispensePreviewNextRefill() && (
                <div style={{ padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 0, marginBottom: 14 }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Next refill will be set to:</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>{formatShortDate(dispensePreviewNextRefill())}</div>
                  <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>{getDispenseActiveInterval()} days from {formatShortDate(dispenseDate)}</div>
                </div>
              )}

              {/* Fulfillment Method */}
              {['hrt', 'weight_loss', 'peptide'].includes(dispensingProtocol.category) && (
                <div style={{ marginBottom: 14, padding: '12px', background: '#f8f9fa', borderRadius: 0, border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fulfillment</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: fulfillmentMethod === 'overnight' ? '10px' : '0' }}>
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('in_clinic')}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 0, fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        border: fulfillmentMethod === 'in_clinic' ? '2px solid #2E75B6' : '1px solid #ddd',
                        background: fulfillmentMethod === 'in_clinic' ? '#EBF3FB' : '#fff',
                        color: fulfillmentMethod === 'in_clinic' ? '#2E75B6' : '#666',
                        fontFamily: 'inherit',
                      }}
                    >Picked Up In Clinic</button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentMethod('overnight')}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 0, fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        border: fulfillmentMethod === 'overnight' ? '2px solid #e67e22' : '1px solid #ddd',
                        background: fulfillmentMethod === 'overnight' ? '#FFF5EB' : '#fff',
                        color: fulfillmentMethod === 'overnight' ? '#e67e22' : '#666',
                        fontFamily: 'inherit',
                      }}
                    >Overnighted</button>
                  </div>
                  {fulfillmentMethod === 'overnight' && (
                    <input
                      type="text"
                      placeholder="Tracking number (optional)"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 0, fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              )}

              {/* Result */}
              {dispenseResult && (
                <div style={{
                  padding: '10px 14px', borderRadius: 0, marginBottom: '12px', fontSize: '13px',
                  background: dispenseResult.success ? '#f0fdf4' : '#fef2f2',
                  color: dispenseResult.success ? '#16a34a' : '#dc2626',
                  border: dispenseResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                }}>
                  {dispenseResult.message}
                </div>
              )}

              {/* Dispense Button */}
              <button
                onClick={handleDispense}
                disabled={dispensing || dispenseResult?.success || !dispenseDate}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: 0,
                  background: dispenseResult?.success ? '#e5e7eb' : '#000',
                  color: dispenseResult?.success ? '#9ca3af' : '#fff',
                  fontSize: '15px', fontWeight: 600,
                  cursor: dispensing || dispenseResult?.success ? 'default' : 'pointer',
                  fontFamily: 'inherit', marginTop: '4px',
                }}
              >
                {dispensing ? 'Dispensing...' : dispenseResult?.success ? '✓ Dispensed' : 'Dispense & Log Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SMSComposeModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        recipientPhone={patient?.phone}
        recipientName={patient?.first_name || patient?.name || ''}
        patientId={patient?.id}
        patientName={patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()}
      />
    </AdminLayout>
  );
}
