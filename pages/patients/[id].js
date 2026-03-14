// /pages/patients/[id].js
// Unified Patient Profile Page - Range Medical
// Single source of truth for all patient data

import { useState, useEffect, useRef } from 'react';
import { formatPhone } from '../../lib/format-utils';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import EmailComposeModal from '../../components/EmailComposeModal';
import SMSComposeModal from '../../components/SMSComposeModal';
import { useAuth } from '../../components/AuthProvider';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import unified protocol configuration
import {
  CATEGORY_COLORS,
  INJECTION_MEDICATIONS,
  PEPTIDE_OPTIONS,
  WEIGHT_LOSS_MEDICATIONS,
  WEIGHT_LOSS_DOSAGES,
  HRT_MEDICATIONS,
  TESTOSTERONE_DOSES,
  HRT_SUPPLY_TYPES,
  INJECTION_METHODS,
  FREQUENCY_OPTIONS,
  VISIT_FREQUENCY_OPTIONS,
  PROTOCOL_STATUS_OPTIONS,
  DELIVERY_METHODS,
  IV_THERAPY_TYPES,
  findPeptideInfo,
  findMatchingPeptide,
  getDoseOptions
} from '../../lib/protocol-config';
import { getHRTLabSchedule, matchDrawsToLogs, buildAdaptiveHRTSchedule, isHRTProtocol } from '../../lib/hrt-lab-schedule';
import { isRecoveryPeptide, isGHPeptide } from '../../lib/protocol-config';
import BookingTab from '../../components/BookingTab';
import LabDashboard from '../../components/labs/LabDashboard';
import ConversationView from '../../components/ConversationView';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import POSChargeModal from '../../components/POSChargeModal';
import EncounterModal from '../../components/EncounterModal';
import EncounterQuickView from '../../components/EncounterQuickView';
import SignatureCanvas from '../../components/SignatureCanvas';
import CycleProgressCard from '../../components/CycleProgressCard';
import { PROTOCOL_TYPES } from '../../lib/protocol-types';

// Map protocol.category → service-log category
const CATEGORY_TO_SVC = {
  hrt: 'testosterone',
  weight_loss: 'weight_loss',
  peptide: 'peptide',
  iv: 'iv_therapy',
  hbot: 'hbot',
  rlt: 'red_light',
  injection: 'vitamin',
};

// HRT dosages & delivery from protocol-types
const HRT_OPTIONS = {
  male: { dosages: PROTOCOL_TYPES.hrt_male.dosages, deliveryMethods: PROTOCOL_TYPES.hrt_male.deliveryMethods },
  female: { dosages: PROTOCOL_TYPES.hrt_female.dosages, deliveryMethods: PROTOCOL_TYPES.hrt_female.deliveryMethods },
};

// Weight loss meds with dosages
const WL_MEDS = WEIGHT_LOSS_MEDICATIONS.map(med => ({
  value: med, label: med, dosages: WEIGHT_LOSS_DOSAGES[med] || []
}));

// Vitamin injection options
const _injMeds = PROTOCOL_TYPES.single_injection?.medications || [];
const VITAMIN_OPTS = [
  ..._injMeds.map(m => ({ value: m, label: m })),
  { value: 'NAD+ 50mg', label: 'NAD+ 50mg' },
  { value: 'NAD+ 100mg', label: 'NAD+ 100mg' },
  { value: 'Lipo-C', label: 'Lipo-C' },
  { value: 'Taurine', label: 'Taurine' },
  { value: 'Toradol', label: 'Toradol' },
];

// IV therapy options
const IV_OPTS = (PROTOCOL_TYPES.iv_therapy?.medications || []).map(m => ({ value: m, label: m }));

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
];
const FORM_QUICK_SELECTS = [
  { label: 'New Patient', forms: ['intake', 'hipaa'] },
  { label: 'HRT', forms: ['intake', 'hipaa', 'hrt', 'blood-draw'] },
  { label: 'Weight Loss', forms: ['intake', 'hipaa', 'weight-loss', 'blood-draw'] },
  { label: 'IV Therapy', forms: ['intake', 'hipaa', 'iv'] },
  { label: 'Peptides', forms: ['intake', 'hipaa', 'peptide'] },
  { label: 'HBOT', forms: ['intake', 'hipaa', 'hbot'] },
  { label: 'Red Light', forms: ['intake', 'hipaa', 'red-light'] },
  { label: 'PRP', forms: ['intake', 'hipaa', 'prp', 'blood-draw'] },
  { label: 'Exosome IV', forms: ['intake', 'hipaa', 'exosome-iv'] },
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
            borderRadius: 8, cursor: 'pointer',
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
      borderRadius: 8, border: '1px solid #e5e7eb',
    }}>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#374151' }}>
        Add New Card
      </div>
      <div style={{
        padding: '12px', background: '#fff', border: '1px solid #d1d5db',
        borderRadius: 8, marginBottom: 12,
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
            border: 'none', borderRadius: 8,
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
            borderRadius: 8, cursor: 'pointer',
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
  const { session } = useAuth();

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
  const [sessions, setSessions] = useState([]);
  const [symptomResponses, setSymptomResponses] = useState([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [selectedQuestionnaireIdx, setSelectedQuestionnaireIdx] = useState(0);
  const [labProtocols, setLabProtocols] = useState([]);
  const [labDocuments, setLabDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [weightLossLogs, setWeightLossLogs] = useState([]);
  const [allProtocolLogs, setAllProtocolLogs] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [vitalsDisplayCount, setVitalsDisplayCount] = useState(5);
  const [commsLog, setCommsLog] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [hrtLabSchedules, setHrtLabSchedules] = useState({});
  const [cycleInfo, setCycleInfo] = useState(null);

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
  const [pinnedNoteExpanded, setPinnedNoteExpanded] = useState(false);

  // Protocol PDF modal
  const [showProtocolPdfModal, setShowProtocolPdfModal] = useState(false);
  const [protocolPdfSelections, setProtocolPdfSelections] = useState({});
  const [protocolPdfCombine, setProtocolPdfCombine] = useState(true);
  const [protocolPdfGenerating, setProtocolPdfGenerating] = useState(false);
  const [protocolPdfSaving, setProtocolPdfSaving] = useState(false);

  // Session log modal (for inline session grids — HBOT, RLT, IV, Injection)
  const [sessionLogModal, setSessionLogModal] = useState(null);
  const [sessionLogDate, setSessionLogDate] = useState('');
  const [sessionLogSaving, setSessionLogSaving] = useState(false);

  // Slide-out PDF viewer state
  const [pdfSlideOut, setPdfSlideOut] = useState({ open: false, url: '', title: '' });
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
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [generatingChart, setGeneratingChart] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
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
  const [editInjectionForm, setEditInjectionForm] = useState({ entry_date: '', dosage: '', weight: '', notes: '' });
  const [editInjectionSaving, setEditInjectionSaving] = useState(false);
  const [confirmDeleteInjection, setConfirmDeleteInjection] = useState(false);

  // Log Entry modal state
  const [showLogEntryModal, setShowLogEntryModal] = useState(false);
  const [logEntryProtocol, setLogEntryProtocol] = useState(null);
  const [logEntryType, setLogEntryType] = useState('injection');
  const [logEntryDate, setLogEntryDate] = useState('');
  const [logForm, setLogForm] = useState({ hrt_type: 'male', medication: '', dosage: '', custom_dosage: '', weight: '', quantity: 1, delivery_method: '', duration: 60, notes: '' });
  const [logDispensing, setLogDispensing] = useState({ administered_by: '', lot_number: '', expiration_date: '' });
  const [logSignature, setLogSignature] = useState(null);
  const [logSubmitting, setLogSubmitting] = useState(false);

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

  // Payments sub-tab state
  const [paymentsSubTab, setPaymentsSubTab] = useState('subscriptions');

  // Saved cards state
  const [savedCards, setSavedCards] = useState([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);

  // Stripe subscription management state
  const [stripeSubscriptions, setStripeSubscriptions] = useState([]);
  const [loadingStripeSubs, setLoadingStripeSubs] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(null);

  // Form states
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [existingPacks, setExistingPacks] = useState([]);
  const [addToPackMode, setAddToPackMode] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('');

  const [assignForm, setAssignForm] = useState({
    templateId: '', peptideId: '', selectedDose: '', frequency: '',
    startDate: new Date().toISOString().split('T')[0], notes: '',
    injectionMedication: '', injectionDose: ''
  });

  const [editForm, setEditForm] = useState({
    medication: '', selectedDose: '', frequency: '', startDate: '',
    endDate: '', status: '', notes: '', sessionsUsed: 0, totalSessions: null,
    // HRT vial-specific fields
    dosePerInjection: '', injectionsPerWeek: 2, vialSize: '', supplyType: '', lastRefillDate: '',
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
  const [sendingSymptoms, setSendingSymptoms] = useState(false);
  const [symptomsSent, setSymptomsSent] = useState(false);
  const fileInputRef = useRef(null);

  // Notes state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteFormatted, setNoteFormatted] = useState('');
  const [noteFormatting, setNoteFormatting] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteBody, setEditNoteBody] = useState('');
  const [editNoteSaving, setEditNoteSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const recognitionRef = useRef(null);

  // Blooio opt-in status
  const [blooioOptIn, setBlooioOptIn] = useState(null); // null=loading, true=opted in, false=pending
  const [showDemographics, setShowDemographics] = useState(false);

  // Patient edit mode
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState({});
  const [savingPatient, setSavingPatient] = useState(false);

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
          for (const p of hrtProtos) {
            try {
              const protoRes = await fetch(`/api/protocols/${p.id}`);
              const protoData = await protoRes.json();
              const bloodDrawLogs = (protoData.activityLogs || []).filter(l => l.log_type === 'blood_draw');
              const firstFollowup = protoData.protocol?.first_followup_weeks || p.first_followup_weeks || 8;
              schedules[p.id] = buildAdaptiveHRTSchedule(p.start_date, firstFollowup, bloodDrawLogs, data.labs || [], data.labProtocols || []);
            } catch {
              const firstFollowup = p.first_followup_weeks || 8;
              const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
              schedules[p.id] = schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null, logId: null }));
            }
          }
          setHrtLabSchedules(schedules);
        }
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
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

  // Auto-load stripe subscriptions when switching to subscriptions sub-tab
  useEffect(() => {
    if (activeTab === 'payments' && paymentsSubTab === 'subscriptions' && stripeSubscriptions.length === 0 && !loadingStripeSubs) {
      fetchStripeSubscriptions();
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

  // Protocol handlers
  const openAssignModal = async (notification = null) => {
    setSelectedNotification(notification);
    setAssignForm({
      templateId: '', peptideId: '', selectedDose: '', frequency: '',
      startDate: new Date().toISOString().split('T')[0], notes: '',
      injectionMedication: '', injectionDose: ''
    });
    setAddToPackMode(false);
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

      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: isInjection ? assignForm.injectionDose : assignForm.selectedDose,
          medication: isInjection ? assignForm.injectionMedication : null,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          purchaseId: selectedNotification?.id
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
      notes: log.notes || '',
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
          entry_date: editInjectionForm.entry_date,
          dosage: editInjectionForm.dosage,
          weight: editInjectionForm.weight || null,
          medication: editInjectionModal.medication,
          notes: editInjectionForm.notes || null,
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

  // Open Log Entry modal for a protocol
  const openLogEntryModal = (protocol, e) => {
    if (e) e.stopPropagation();
    const svcCat = CATEGORY_TO_SVC[protocol.category] || protocol.category;
    let defaultType = 'injection';
    if (['hbot', 'rlt', 'iv'].includes(protocol.category)) defaultType = 'session';
    else if (protocol.delivery_method === 'take_home') defaultType = 'pickup';
    const hrtType = (protocol.program_type || '').includes('female') || (protocol.medication || '').toLowerCase().includes('female') ? 'female' : 'male';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    setLogEntryProtocol({ ...protocol, svcCat });
    setLogEntryType(defaultType);
    setLogEntryDate(today);
    setLogForm({ hrt_type: hrtType, medication: protocol.medication || '', dosage: protocol.current_dose || protocol.selected_dose || protocol.starting_dose || '', custom_dosage: '', weight: '', quantity: 1, delivery_method: '', duration: protocol.category === 'rlt' ? 20 : 60, notes: '' });
    setLogDispensing({ administered_by: '', lot_number: '', expiration_date: '' });
    setLogSignature(null);
    setShowLogEntryModal(true);
  };

  // Submit log entry to service-log API
  const handleSubmitLogEntry = async () => {
    if (!logEntryProtocol || !patient) return;
    setLogSubmitting(true);
    try {
      const svcCat = logEntryProtocol.svcCat;
      const payload = {
        patient_id: patient.id,
        category: svcCat,
        entry_type: logEntryType,
        entry_date: logEntryDate,
        notes: logForm.notes || null,
        protocol_id: logEntryProtocol.id,
        administered_by: logDispensing.administered_by || null,
        lot_number: logDispensing.lot_number || null,
        expiration_date: logDispensing.expiration_date || null,
        signature_url: logSignature || null,
      };
      if (svcCat === 'testosterone') {
        payload.medication = logForm.hrt_type === 'male' ? 'Male HRT' : 'Female HRT';
        if (logEntryType === 'injection') {
          payload.dosage = logForm.dosage === 'custom' ? logForm.custom_dosage : logForm.dosage;
        } else {
          const dm = logForm.delivery_method || '';
          const isVial = dm === 'vial';
          const qty = isVial ? 1 : (dm.startsWith('prefilled_') ? parseInt(dm.replace('prefilled_', '')) : (logForm.quantity || 1));
          payload.delivery_method = dm;
          payload.quantity = qty;
          payload.supply_type = isVial ? 'vial_10ml' : qty >= 8 ? 'prefilled_4week' : qty >= 4 ? 'prefilled_2week' : 'prefilled';
          payload.dosage = isVial ? `1 vial @ ${logForm.dosage}` : `${qty} prefilled @ ${logForm.dosage}`;
        }
      } else if (svcCat === 'weight_loss') {
        payload.medication = logForm.medication;
        if (logEntryType === 'injection') {
          payload.dosage = logForm.dosage;
          payload.weight = logForm.weight ? parseFloat(logForm.weight) : null;
        } else {
          payload.quantity = logForm.quantity;
          payload.dosage = logForm.dosage ? `${logForm.quantity} week supply @ ${logForm.dosage}` : `${logForm.quantity} week supply`;
        }
      } else if (svcCat === 'vitamin') {
        payload.medication = logForm.medication;
        payload.quantity = logForm.quantity || 1;
        payload.dosage = logForm.quantity > 1 ? `${logForm.quantity} injections` : 'Standard';
      } else if (svcCat === 'peptide') {
        payload.medication = logForm.medication;
        if (logEntryType === 'injection') {
          payload.dosage = logForm.dosage || 'Standard';
        } else if (logEntryType === 'med_pickup') {
          payload.entry_type = 'pickup';
          payload.quantity = logForm.quantity || 1;
          payload.dosage = logForm.dosage || 'Standard';
          payload.supply_type = 'medication';
        } else {
          payload.quantity = logForm.quantity || 1;
          payload.dosage = logForm.dosage ? `${logForm.quantity} vial(s) @ ${logForm.dosage}` : `${logForm.quantity} vial(s)`;
        }
      } else if (svcCat === 'iv_therapy') {
        payload.medication = logForm.medication;
        payload.duration = logForm.duration;
      } else if (svcCat === 'hbot') {
        payload.medication = 'HBOT Session';
        payload.duration = 60;
      } else if (svcCat === 'red_light') {
        payload.medication = 'Red Light Session';
        payload.duration = logForm.duration || 20;
      }
      const res = await fetch('/api/service-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setShowLogEntryModal(false);
        fetchPatient();
      } else if (data.duplicate) {
        // Duplicate entry detected — ask user if they want to force
        const forceIt = confirm(`This entry was already logged for today. Log another entry anyway?`);
        if (forceIt) {
          payload.force = true;
          const res2 = await fetch('/api/service-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data2 = await res2.json();
          if (data2.success) {
            setShowLogEntryModal(false);
            fetchPatient();
          } else {
            alert('Error: ' + (data2.error || 'Failed to log entry'));
          }
        }
      } else {
        alert('Error: ' + (data.error || 'Failed to log entry'));
      }
    } catch (err) {
      console.error('Error submitting log entry:', err);
      alert('Error: ' + err.message);
    }
    setLogSubmitting(false);
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
      // HRT vial-specific fields
      dosePerInjection: protocol.dose_per_injection || '',
      injectionsPerWeek: protocol.injections_per_week || 2,
      vialSize: protocol.vial_size || '',
      supplyType: supplyType,
      lastRefillDate: protocol.last_refill_date || '',
      // HRT injection method
      injectionMethod: protocol.injection_method || '',
      // In-clinic scheduling fields
      deliveryMethod: deliveryMethod,
      visitFrequency: protocol.visit_frequency || '',
      scheduledDays: protocol.scheduled_days || [],
      lastVisitDate: protocol.last_visit_date || '',
      nextExpectedDate: protocol.next_expected_date || ''
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

      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication: editForm.medication || null,
          selected_dose: editForm.selectedDose || null,
          frequency: derivedFrequency,
          start_date: dateOrNull(editForm.startDate),
          end_date: dateOrNull(editForm.endDate),
          status: editForm.status,
          notes: editForm.notes || null,
          sessions_used: editForm.sessionsUsed,
          // HRT vial-specific fields (dose_per_injection auto-derived from selected_dose for HRT)
          dose_per_injection: derivedDosePerInjection,
          injections_per_week: editForm.injectionsPerWeek ? parseInt(editForm.injectionsPerWeek) : null,
          vial_size: editForm.vialSize ? parseFloat(editForm.vialSize) : null,
          supply_type: editForm.supplyType || null,
          last_refill_date: dateOrNull(editForm.lastRefillDate),
          // HRT injection method
          injection_method: editForm.injectionMethod || null,
          // In-clinic scheduling fields
          delivery_method: editForm.deliveryMethod || null,
          visit_frequency: editForm.visitFrequency || null,
          scheduled_days: editForm.scheduledDays.length > 0 ? editForm.scheduledDays : null,
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
    { id: 'draw_scheduled', label: 'Scheduled', color: '#94a3b8', icon: '📅' },
    { id: 'blood_draw_complete', label: 'Blood Draw', color: '#f59e0b', icon: '🩸' },
    { id: 'results_received', label: 'Results In', color: '#8b5cf6', icon: '📋' },
    { id: 'provider_reviewed', label: 'Reviewed', color: '#10b981', icon: '👨‍⚕️' },
    { id: 'consult_scheduled', label: 'Consult', color: '#6366f1', icon: '🗓️' },
    { id: 'consult_complete', label: 'Complete', color: '#3b82f6', icon: '✅' }
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
          created_by: 'Staff',
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

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
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
  const pinnedNote = notes.find(n => n.pinned);

  // Helper to open PDF in slide-out viewer
  const openPdfViewer = (url, title = 'Document') => {
    setSlideoutWidth(70);
    setPdfSlideOut({ open: true, url, title });
  };

  const closePdfViewer = () => {
    setPdfSlideOut({ open: false, url: '', title: '' });
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
      const wlLogs = (allProtocolLogs || []).filter(l => l.protocol_id === sendProgressProtocol.id && l.weight);
      const sWeight = wlLogs.length > 0 ? parseFloat(wlLogs[0].weight) : null;
      const cWeight = wlLogs.length > 0 ? parseFloat(wlLogs[wlLogs.length - 1].weight) : null;
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
              </div>
            </div>
          </div>
          {/* Action Toolbar */}
          <div className="header-toolbar">
            <div className="toolbar-group">
              {patient.phone && <button onClick={() => setSmsModalOpen(true)} className="toolbar-btn" title="Send text message">💬 <span className="toolbar-label">SMS</span></button>}
              {patient.phone && <a href={`tel:${patient.phone}`} className="toolbar-btn" title="Call patient">📞 <span className="toolbar-label">Call</span></a>}
              {patient.email && <button onClick={() => setEmailModalOpen(true)} className="toolbar-btn" title="Send email">✉️ <span className="toolbar-label">Email</span></button>}
              <button onClick={() => { setShowSendFormsModal(true); setSendFormsSelected(new Set()); setSendFormsResult(null); }} className="toolbar-btn" title="Send forms">📋 <span className="toolbar-label">Forms</span></button>
            </div>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <button onClick={() => setShowBookingModal(true)} className="toolbar-btn toolbar-btn-blue" title="Book appointment">📅 <span className="toolbar-label">Book</span></button>
              <button onClick={() => setShowChargeModal(true)} className="toolbar-btn toolbar-btn-green" title="Charge patient">💳 <span className="toolbar-label">Charge</span></button>
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
                {!showDemographics && (
                  <>
                    {(patient.date_of_birth || intakeDemographics?.date_of_birth) && <span>{formatDate(patient.date_of_birth || intakeDemographics?.date_of_birth)}</span>}
                    {(patient.gender || intakeDemographics?.gender) && <span>{patient.gender || intakeDemographics?.gender}</span>}
                    {patient.created_at && <span>Since {formatDate(patient.created_at)}</span>}
                  </>
                )}
                {showDemographics && <span style={{ color: '#374151' }}>Patient Details</span>}
              </span>
              <span className="demographics-toggle-icon">{showDemographics ? '▲ Hide' : '▼ Details'}</span>
            </button>
          </div>

          {/* Medical Alerts */}
          {(() => {
            // Pull medical data from the most recent intake
            const intake = intakes && intakes.length > 0 ? intakes[0] : null;
            if (!intake) return null;

            // Resolve allergies from whichever field is populated
            let allergyText = null;
            const noKnownAllergies = intake.has_allergies === false;
            if (!noKnownAllergies) {
              allergyText = (typeof intake.allergies === 'string' ? intake.allergies : null) ||
                (intake.allergies && typeof intake.allergies === 'object' ? intake.allergies.text : null) ||
                (intake.allergy_reactions ? `Allergies noted` : null) ||
                null;
            }

            // Medications
            const medsText = intake.current_medications || intake.medication_notes || null;

            // Medical conditions — parse JSONB object for any "Yes" conditions
            let conditionsText = null;
            if (intake.medical_conditions && typeof intake.medical_conditions === 'object') {
              const activeConditions = Object.values(intake.medical_conditions)
                .filter(c => c && c.response && c.response !== 'No')
                .map(c => c.label);
              if (activeConditions.length > 0) conditionsText = activeConditions.join(', ');
            } else if (typeof intake.medical_conditions === 'string') {
              conditionsText = intake.medical_conditions;
            }

            // HRT status
            const hrtText = intake.on_hrt ? (intake.hrt_details || 'On HRT') : null;

            const hasAlerts = allergyText || medsText || conditionsText || hrtText || noKnownAllergies;
            if (!hasAlerts) return null;

            const chipStyle = {
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
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
                {conditionsText && (
                  <span style={{ ...chipStyle, background: '#fefce8', color: '#854d0e', border: '1px solid #fde68a' }}>
                    <span style={{ fontSize: '13px' }}>🏥</span>
                    <strong>Conditions:</strong> {conditionsText}
                  </span>
                )}
                {hrtText && (
                  <span style={{ ...chipStyle, background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
                    <span style={{ fontSize: '13px' }}>💉</span>
                    <strong>HRT:</strong> {hrtText}
                  </span>
                )}
              </div>
            );
          })()}

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
                      <span>{formatDate(patient.date_of_birth)}</span>
                    ) : intakeDemographics?.date_of_birth ? (
                      <span>{formatDate(intakeDemographics.date_of_birth)} <span className="from-intake">(from intake)</span></span>
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
            borderRadius: 8,
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
                    {pinnedNote.created_by && ` · ${pinnedNote.created_by}`}
                  </span>
                </div>
                <div style={{
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
            {pinnedNote.body && pinnedNote.body.length > 120 && (
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

        {/* Tab Navigation */}
        <nav className="px-tabs">
          {[
            { key: 'overview', label: 'Overview', icon: '📋' },
            { key: 'protocols', label: 'Protocols', icon: '💊', count: stats.activeCount || 0 },
            { key: 'medications', label: 'Medications', icon: '💉', count: (medications.length + prescriptions.length) || 0 },
            { key: 'labs', label: 'Labs', icon: '🔬' },
            { key: 'appointments', label: 'Visits', icon: '📅', count: (appointments.length + serviceLogs.length) || 0 },
            { key: 'timeline', label: 'Timeline', icon: '📊' },
            { key: 'notes', label: 'Notes', icon: '📝', count: notes.length || 0 },
            { key: 'intakes', label: 'Docs', icon: '📄', count: (intakes.length + consents.length + medicalDocuments.length + assessments.length) || 0 },
            { key: 'tasks', label: 'Tasks', icon: '✅', count: patientTasks.filter(t => t.status === 'pending').length || 0 },
            { key: 'symptoms', label: 'Symptoms', icon: '🩺', count: questionnaireResponses.length || 0 },
            { key: 'payments', label: 'Payments', icon: '💳' },
            { key: 'communications', label: 'Comms', icon: '💬' },
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
                        background: '#f8fafc', borderRadius: '8px',
                        border: sub.status === 'past_due' ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: '4px',
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
                          border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 24px 4px 10px',
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
                              contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
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
                    borderRadius: '8px',
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
                    <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '4px',
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
                            <span className="protocol-name">{protocol.program_name || protocol.medication}</span>
                            {protocol.medication && protocol.program_name && protocol.medication !== protocol.program_name && (
                              <span className="protocol-dose" style={{ fontWeight: 500 }}>({protocol.medication})</span>
                            )}
                            {protocol.selected_dose && <span className="protocol-dose">{protocol.selected_dose}</span>}
                          </div>
                          <div className="protocol-status">
                            <span className="status-text">{protocol.status_text}</span>
                            {protocol.status === 'active' && (
                              <button
                                onClick={(e) => openLogEntryModal(protocol, e)}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
                      margin: '0 0 12px', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      background: `${stage.color}15`, border: `1px solid ${stage.color}40`,
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🧪</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Labs:</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '4px',
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
                            borderRadius: '12px', cursor: 'pointer',
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
                        const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : '#9ca3af';
                        return (
                          <div
                            key={draw.label}
                            onClick={() => handleBloodDrawClick(draw, protocol.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
                              cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{
                              width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0,
                              border: draw.status === 'completed' ? 'none' : `2px solid ${color}`,
                              boxSizing: 'border-box'
                            }} />
                            <span style={{ fontWeight: '500', color: '#374151', minWidth: '110px' }}>{draw.label}</span>
                            <span style={{ color: '#6b7280', flex: 1 }}>{draw.weekLabel}</span>
                            {draw.completedDate && (
                              <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 500 }}>✓ {formatShortDate(draw.completedDate)}</span>
                            )}
                            {draw.status === 'overdue' && !draw.completedDate && (
                              <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 500 }}>Overdue</span>
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
                          <strong>{consent.consent_type ? consent.consent_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Consent'}</strong>
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
                        background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0',
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
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
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
                        background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0',
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
                            <div style={{ marginTop: '6px', padding: '3px 8px', display: 'inline-block', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '11px', fontWeight: 600, color: '#dc2626' }}>
                              ⚠ Controlled{rx.schedule ? ` (${rx.schedule})` : ''}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
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
                        background: '#fafafa', borderRadius: '8px', border: '1px solid #f1f5f9', opacity: 0.7,
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
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: '#f3f4f6', color: '#94a3b8', whiteSpace: 'nowrap' }}>Discontinued</span>
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
                        borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        📄 Generate PDF
                      </button>
                    )}
                    <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add Protocol</button>
                  </div>
                </div>
                {activeProtocols.length === 0 && completedProtocols.filter(p => p.status !== 'merged').length === 0 ? (
                  <div className="empty">No protocols</div>
                ) : (
                  <div className="protocol-list">
                    {[...activeProtocols, ...completedProtocols].filter(p => p.status !== 'merged').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(protocol => {
                      const cat = getCategoryStyle(protocol.category);
                      const isExpanded = expandedProtocols[protocol.id];
                      const isWeightLoss = protocol.category === 'weight_loss';
                      const wlLogs = isWeightLoss
                        ? weightLossLogs
                            .filter(l => l.protocol_id === protocol.id || !l.protocol_id)
                            .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
                        : [];
                      const chartData = wlLogs.filter(l => l.weight).map(l => ({
                        date: new Date(l.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        weight: parseFloat(l.weight),
                        dose: l.dosage || ''
                      }));
                      const startingWeight = chartData.length > 0 ? chartData[0].weight : null;
                      const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;
                      const totalLoss = startingWeight && currentWeight ? (startingWeight - currentWeight).toFixed(1) : null;
                      const startingDose = wlLogs.length > 0 ? wlLogs[0].dosage : null;
                      const currentDose = wlLogs.length > 0 ? wlLogs[wlLogs.length - 1].dosage : null;
                      const pLogs = getProtocolLogsForId(protocol.id);

                      return (
                        <div key={protocol.id} className="protocol-card" style={protocol.status === 'completed' ? { opacity: 0.7 } : {}}>
                          <div className="protocol-card-header">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">{protocol.program_name || protocol.medication}</span>
                            {protocol.status === 'completed' && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>✓ Completed</span>}
                            {protocol.delivery_method === 'in_clinic' && <span className="clinic-badge">In-Clinic</span>}
                          </div>
                          <div className="protocol-details">
                            {protocol.medication && protocol.program_name && protocol.medication !== protocol.program_name && (
                              <span style={{ fontWeight: 500 }}>{protocol.medication}</span>
                            )}
                            {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                            {protocol.frequency && <span>{protocol.frequency}</span>}
                          </div>
                          {protocol.delivery_method === 'in_clinic' && protocol.scheduled_days?.length > 0 && (
                            <div className="protocol-schedule">
                              Schedule: {protocol.scheduled_days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}
                              {protocol.next_expected_date && ` • Next: ${formatShortDate(protocol.next_expected_date)}`}
                            </div>
                          )}
                          <div className="protocol-dates">Started {formatShortDate(protocol.start_date)}{protocol.end_date && ` → ${formatShortDate(protocol.end_date)}`}</div>
                          <div className="protocol-footer">
                            <span className="status-badge">{protocol.status_text}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {protocol.status === 'active' && (
                                <button
                                  onClick={(e) => openLogEntryModal(protocol, e)}
                                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >+ Log Entry</button>
                              )}
                              {protocol.status === 'active' && (
                                <button
                                  onClick={() => setExpandedProtocols(prev => ({ ...prev, [protocol.id]: !prev[protocol.id] }))}
                                  className="btn-secondary-sm"
                                >{isExpanded ? 'Hide Details' : 'View Details'}</button>
                              )}
                              <button onClick={() => openEditModal(protocol)} className="btn-secondary-sm">Edit</button>
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
                                    style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
                                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
                                style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                Send Portal Link
                              </button>
                              {protocol.access_token && (
                                <button
                                  onClick={() => {
                                    const url = `https://www.range-medical.com/hrt/${protocol.access_token}`;
                                    navigator.clipboard.writeText(url).then(() => alert('Portal link copied!')).catch(() => prompt('Copy this link:', url));
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
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
                              <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                                      const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : '#9ca3af';
                                      return (
                                        <div
                                          key={draw.label}
                                          onClick={() => handleBloodDrawClick(draw, protocol.id)}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                                            cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.15s'
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                          <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0
                                          }} />
                                          <span style={{ fontWeight: '500', color: '#374151', minWidth: '100px' }}>{draw.label}</span>
                                          <span style={{ color: '#6b7280' }}>{draw.weekLabel}</span>
                                          {draw.completedDate && (
                                            <span style={{ color: '#22c55e', marginLeft: 'auto', fontSize: '12px' }}>✓ {formatShortDate(draw.completedDate)}</span>
                                          )}
                                          {draw.status === 'overdue' && !draw.completedDate && (
                                            <span style={{ color: '#dc2626', marginLeft: 'auto', fontSize: '12px' }}>Overdue</span>
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

                          {/* Weight Loss Progress Panel */}
                          {/* Weight Loss Email Drip Sequence */}
                          {isWeightLoss && protocol.status === 'active' && (() => {
                            const pDripLogs = dripLogs[protocol.id] || [];
                            const hasStarted = pDripLogs.length > 0;
                            return (
                              <div style={{ marginTop: 10, padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Email Sequence</span>
                                  {!hasStarted && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Start the 4-day email sequence? Email 1 will send immediately.')) return;
                                        setStartingDrip(protocol.id);
                                        try {
                                          const resp = await fetch('/api/protocols/start-drip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ protocolId: protocol.id }) });
                                          const data = await resp.json();
                                          if (data.success) { alert('Email 1 sent! Emails 2-4 follow over next 3 days.'); fetchDripLogs(protocol.id); }
                                          else { alert('Error: ' + (data.error || 'Failed to start sequence')); }
                                        } catch (err) { alert('Error: ' + err.message); }
                                        setStartingDrip(null);
                                      }}
                                      disabled={startingDrip === protocol.id}
                                      style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
                                    >{startingDrip === protocol.id ? 'Starting...' : 'Start Sequence'}</button>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  {WL_DRIP_EMAILS.map(em => {
                                    const sent = pDripLogs.some(l => (l.notes || '').includes(`Email ${em.num}`));
                                    return (
                                      <div key={em.num} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sent ? '#22c55e' : '#d1d5db', display: 'inline-block' }} />
                                        <span style={{ color: sent ? '#166534' : '#9ca3af' }}>{em.subject}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Weight Loss Weekly Check-in Texts */}
                          {isWeightLoss && protocol.status === 'active' && protocol.delivery_method !== 'in_clinic' && (() => {
                            const enabled = protocol.checkin_reminder_enabled === true;
                            const injDay = protocol.injection_day;
                            if (enabled) {
                              return (
                                <div style={{ marginTop: 6, padding: '8px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>✅ Weekly check-ins ({injDay || 'Monday'})</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <select value={injDay || 'Monday'} onChange={async e => { try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ injection_day: e.target.value }) }); fetchPatient(); } catch {} }} style={{ padding: '2px 4px', border: '1px solid #BBF7D0', borderRadius: 4, fontSize: 11, color: '#15803D', background: '#F0FDF4' }}>
                                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <button onClick={async () => { try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkin_reminder_enabled: false }) }); fetchPatient(); } catch {} }} style={{ fontSize: 10, color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Disable</button>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div style={{ marginTop: 6, padding: '8px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#666' }}>Check-in day:</span>
                                <select value={wlCheckinDay} onChange={e => setWlCheckinDay(e.target.value)} style={{ padding: '3px 6px', border: '1px solid #e5e5e5', borderRadius: 4, fontSize: 11 }}>
                                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <button
                                  onClick={async () => { setEnablingCheckin(protocol.id); try { await fetch(`/api/admin/protocols/${protocol.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkin_reminder_enabled: true, injection_day: wlCheckinDay }) }); fetchPatient(); } catch { alert('Failed'); } setEnablingCheckin(null); }}
                                  disabled={enablingCheckin === protocol.id}
                                  style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: '#000', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', marginLeft: 'auto' }}
                                >{enablingCheckin === protocol.id ? 'Enabling...' : 'Enable Check-ins'}</button>
                              </div>
                            );
                          })()}

                          {isWeightLoss && isExpanded && wlLogs.length > 0 && (
                            <div className="wl-progress">
                              {/* Stats Row */}
                              <div className="wl-stats-row">
                                <div className="wl-stat">
                                  <span className="wl-stat-label">Starting Weight</span>
                                  <span className="wl-stat-value">{startingWeight ? `${startingWeight} lbs` : '—'}</span>
                                </div>
                                <span className="wl-stat-arrow">→</span>
                                <div className="wl-stat">
                                  <span className="wl-stat-label">Current Weight</span>
                                  <span className="wl-stat-value">{currentWeight ? `${currentWeight} lbs` : '—'}</span>
                                  {totalLoss && <span className="wl-stat-delta">-{totalLoss} lbs</span>}
                                </div>
                                <div className="wl-stat-divider" />
                                <div className="wl-stat">
                                  <span className="wl-stat-label">Starting Dose</span>
                                  <span className="wl-stat-value">{startingDose || '—'}</span>
                                </div>
                                <span className="wl-stat-arrow">→</span>
                                <div className="wl-stat">
                                  <span className="wl-stat-label">Current Dose</span>
                                  <span className="wl-stat-value">{currentDose || '—'}</span>
                                </div>
                                <div className="wl-stat-divider" />
                                <div className="wl-stat">
                                  <span className="wl-stat-label">Sessions</span>
                                  <span className="wl-stat-value">{wlLogs.length}{protocol.total_sessions ? ` of ${protocol.total_sessions}` : ''}</span>
                                </div>
                                {chartData.length >= 2 && (
                                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => window.open(`/portal/${protocol.access_token || protocol.id}`, '_blank')}
                                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
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
                                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                    >
                                      📤 Send Progress
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Weight Chart */}
                              {chartData.length >= 2 && (
                                <div className="wl-chart" id={`wl-chart-${protocol.id}`}>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} unit=" lbs" width={65} />
                                      <Tooltip
                                        formatter={(value) => [`${value} lbs`, 'Weight']}
                                        labelFormatter={(label) => label}
                                        contentStyle={{ fontSize: 13, borderRadius: 8 }}
                                      />
                                      <Line type="monotone" dataKey="weight" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              {/* Injection Schedule Table — full slot view */}
                              <div className="wl-history">
                                <table className="wl-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: 28, color: '#9ca3af' }}>#</th>
                                      <th>Date</th>
                                      <th>Dose</th>
                                      <th>Weight</th>
                                      <th>Change</th>
                                      <th style={{ width: 40 }}></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const totalSlots = protocol.total_sessions;
                                      const startStr = protocol.start_date;
                                      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                                      const todayDate = new Date(todayStr + 'T12:00:00');

                                      // If no schedule defined, fall back to simple list of actual logs
                                      if (!totalSlots || !startStr) {
                                        return wlLogs.map((log, i) => {
                                          const prevWeight = i > 0 && wlLogs[i - 1].weight ? parseFloat(wlLogs[i - 1].weight) : null;
                                          const curWeight = log.weight ? parseFloat(log.weight) : null;
                                          const delta = prevWeight && curWeight ? (curWeight - prevWeight).toFixed(1) : null;
                                          return (
                                            <tr key={log.id} className="wl-editable-row" onClick={() => openEditInjection(log)} title="Click to edit">
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                                              <td>{formatShortDate(log.entry_date)}</td>
                                              <td>{log.dosage || '—'}</td>
                                              <td>{log.weight ? `${log.weight} lbs` : '—'}</td>
                                              <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>{delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '—'}</td>
                                              <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                            </tr>
                                          );
                                        });
                                      }

                                      // Build full slot schedule
                                      const freqLower = (protocol.frequency || '').toLowerCase();
                                      const intervalDays = freqLower.includes('bi') ? 14 : 7;
                                      const startDate = new Date(startStr + 'T12:00:00');
                                      const usedIds = new Set();

                                      const slots = Array.from({ length: totalSlots }, (_, i) => {
                                        const expDate = new Date(startDate);
                                        expDate.setDate(expDate.getDate() + i * intervalDays);
                                        const expStr = expDate.toISOString().split('T')[0];
                                        const matchLog = wlLogs.find(l => {
                                          if (usedIds.has(l.id)) return false;
                                          const d = new Date(l.entry_date + 'T12:00:00');
                                          return Math.abs(d - expDate) <= 4 * 24 * 60 * 60 * 1000;
                                        });
                                        if (matchLog) usedIds.add(matchLog.id);
                                        return { num: i + 1, expDate, expStr, log: matchLog || null, isFuture: expDate > todayDate };
                                      });

                                      const rows = slots.map(slot => {
                                        if (slot.log) {
                                          const prevSlot = slots.slice(0, slot.num - 1).reverse().find(s => s.log);
                                          const prevWeight = prevSlot?.log?.weight ? parseFloat(prevSlot.log.weight) : null;
                                          const curWeight = slot.log.weight ? parseFloat(slot.log.weight) : null;
                                          const delta = prevWeight && curWeight ? (curWeight - prevWeight).toFixed(1) : null;
                                          return (
                                            <tr key={slot.log.id} className="wl-editable-row" onClick={() => openEditInjection(slot.log)} title="Click to edit or delete">
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                              <td>{formatShortDate(slot.log.entry_date)}</td>
                                              <td>{slot.log.dosage || '—'}</td>
                                              <td>{slot.log.weight ? `${slot.log.weight} lbs` : '—'}</td>
                                              <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>{delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '—'}</td>
                                              <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                            </tr>
                                          );
                                        } else if (!slot.isFuture) {
                                          return (
                                            <tr key={'missed-' + slot.num} style={{ background: '#fef2f2', cursor: 'pointer' }}
                                              onClick={() => { openLogEntryModal(protocol, null); setLogEntryDate(slot.expStr); }}
                                              title="Click to log this injection">
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                              <td style={{ color: '#dc2626' }}>{formatShortDate(slot.expStr)}</td>
                                              <td colSpan={3} style={{ color: '#dc2626', fontStyle: 'italic' }}>Missed — click to add</td>
                                              <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700, fontSize: 16 }}>+</td>
                                            </tr>
                                          );
                                        } else {
                                          return (
                                            <tr key={'future-' + slot.num} style={{ opacity: 0.35 }}>
                                              <td style={{ color: '#9ca3af', fontSize: 12 }}>{slot.num}</td>
                                              <td style={{ color: '#9ca3af' }}>{formatShortDate(slot.expStr)}</td>
                                              <td colSpan={3} style={{ color: '#9ca3af', fontStyle: 'italic' }}>Upcoming</td>
                                              <td></td>
                                            </tr>
                                          );
                                        }
                                      });

                                      // Append any unmatched logs (don't fall in any expected slot)
                                      wlLogs.filter(l => !usedIds.has(l.id)).forEach((log, i) => {
                                        const prevSlot = slots.filter(s => s.log).reverse()[0];
                                        const prevWeight = prevSlot?.log?.weight ? parseFloat(prevSlot.log.weight) : null;
                                        const curWeight = log.weight ? parseFloat(log.weight) : null;
                                        const delta = prevWeight && curWeight ? (curWeight - prevWeight).toFixed(1) : null;
                                        rows.push(
                                          <tr key={'extra-' + log.id} className="wl-editable-row" onClick={() => openEditInjection(log)} title="Click to edit or delete">
                                            <td style={{ color: '#9ca3af', fontSize: 12 }}>+</td>
                                            <td>{formatShortDate(log.entry_date)}</td>
                                            <td>{log.dosage || '—'}</td>
                                            <td>{log.weight ? `${log.weight} lbs` : '—'}</td>
                                            <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>{delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : '—'}</td>
                                            <td style={{ textAlign: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></td>
                                          </tr>
                                        );
                                      });

                                      return rows;
                                    })()}
                                  </tbody>
                                </table>
                              </div>
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
                            // Use calendar days (duration_days or parsed from name), NOT injection count (total_sessions)
                            let totalDays = protocol.duration_days || protocol.total_days || 30;
                            const nameMatch = (protocol.program_name || '').match(/(\d+)\s*day/i);
                            if (nameMatch) totalDays = parseInt(nameMatch[1]);
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
                                {/* Action buttons for recovery peptides */}
                                {isRecovery && protocol.status === 'active' && (
                                  <div className="px-actions">
                                    {!protocol.peptide_checkin_optin_sent && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/admin/protocols/${protocol.id}/send-optin`, { method: 'POST' });
                                            const data = await res.json();
                                            if (res.ok) { alert(data.twoStep ? 'Opt-in request sent! Link will deliver when patient replies.' : 'Check-in opt-in sent!'); fetchPatient(); }
                                            else { alert(data.error || 'Failed to send'); }
                                          } catch (e) { alert('Failed to send'); }
                                        }}
                                        className="btn-secondary-sm"
                                      >📱 Send Check-in Opt-in</button>
                                    )}
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
                                  <div style={{ padding: '8px 12px', background: protocol.hrt_reminders_enabled ? '#F0FDF4' : '#f9fafb', border: `1px solid ${protocol.hrt_reminders_enabled ? '#BBF7D0' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                          style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: '#000', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
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
                    background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
                    padding: '20px 24px', marginBottom: 16,
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>Lab Order</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: isElite ? '#f0fdf4' : '#f5f5f5',
                          color: isElite ? '#15803d' : '#525252',
                        }}>{panelType}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                          background: '#f5f5f5', color: '#525252',
                        }}>{labType}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#737373' }}>Draw: {drawDate}</span>
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
                      background: '#fafafa', borderRadius: 8, padding: '10px 14px',
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
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {nextStage && (
                          <button
                            onClick={() => handleLabStageAdvance(lp.id, nextStage.id)}
                            style={{
                              padding: '7px 16px', border: 'none', borderRadius: 6,
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
                            padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: 6,
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
                  background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
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
                        <span style={{ fontSize: 12, color: '#a3a3a3' }}>{drawDate}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No active labs message */}
              {labProtocols.length === 0 && (
                <div style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
                  padding: '32px 24px', textAlign: 'center', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, color: '#a3a3a3' }}>No lab orders yet</div>
                </div>
              )}

              {/* Lab Documents — Card Grid */}
              <div style={{
                background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
                padding: '20px 24px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>Lab Documents</span>
                  <button onClick={() => setShowUploadModal(true)} style={{
                    padding: '6px 14px', background: '#000', color: '#fff', border: 'none',
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
                        border: '1px solid #e5e5e5', borderRadius: 8, padding: '12px 14px',
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
                              borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', color: '#000',
                            }}>View</button>
                          )}
                          {doc.source !== 'labs' && (
                            <button onClick={() => handleDeleteDocument(doc.id)} style={{
                              padding: '5px 10px', background: '#fff', border: '1px solid #e5e5e5',
                              borderRadius: 4, fontSize: 11, color: '#dc2626', cursor: 'pointer',
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
                        ? consent.consent_type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
              {medicalDocuments.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h3>Medical Documents ({medicalDocuments.length})</h3>
                  </div>
                  <div className="document-list">
                    {medicalDocuments.map(doc => (
                      <div key={doc.id} className="document-card">
                        <div className="document-header">
                          <span className="document-icon">📄</span>
                          <div>
                            <strong>{doc.document_name || 'Document'}</strong>
                            <span className="document-type">{doc.document_type || 'General'}</span>
                          </div>
                        </div>
                        <div className="document-details">
                          <span>{formatDate(doc.uploaded_at)}</span>
                          {doc.uploaded_by && <span>by {doc.uploaded_by}</span>}
                        </div>
                        <div className="document-actions">
                          {doc.document_url && <button onClick={() => openPdfViewer(doc.document_url, doc.document_name || 'Document')} className="btn-secondary-sm">View</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {apt.encounter_note_count > 0 && (
                              <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#5b21b6' }}>
                                📝 {apt.encounter_note_count}
                              </span>
                            )}
                            <span className="apt-status" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                              {displayStatus.replace('_', ' ')}
                            </span>
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
                          vitamin: 'Injection', testosterone: 'HRT', weight_loss: 'Weight Loss',
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
          {activeTab === 'notes' && (
            <>
              <section className="card">
                <div className="card-header">
                  <h3>Notes ({notes.length})</h3>
                  <button className="btn-primary-sm" onClick={() => setShowAddNoteModal(true)}>+ Add Note</button>
                </div>
                {notes.length === 0 ? (
                  <div className="empty">No notes yet</div>
                ) : (
                  <div className="notes-list">
                    {notes.map(note => (
                      <div key={note.id} className="note-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="note-date">
                            {formatDate(note.note_date || note.created_at)}
                            {note.created_by && <span style={{ fontWeight: 400, marginLeft: 8 }}>by {note.created_by}</span>}
                            <span style={{
                              marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                              background: note.source === 'encounter' ? '#fef3c7' : note.source === 'addendum' ? '#fef3c7' : note.source === 'protocol' ? '#f3e8ff' : note.source === 'manual' ? '#dbeafe' : '#f3f4f6',
                              color: note.source === 'encounter' ? '#92400e' : note.source === 'addendum' ? '#92400e' : note.source === 'protocol' ? '#7c3aed' : note.source === 'manual' ? '#1e40af' : '#6b7280',
                            }}>
                              {note.source === 'encounter' ? 'Encounter' : note.source === 'addendum' ? 'Addendum' : note.source === 'protocol' ? 'Protocol Note' : note.source === 'manual' ? 'Staff Note' : 'GHL Import'}
                            </span>
                            {note.status && (
                              <span style={{
                                marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                                background: note.status === 'signed' ? '#d1fae5' : '#f3f4f6',
                                color: note.status === 'signed' ? '#065f46' : '#6b7280',
                              }}>
                                {note.status === 'signed' ? '✓ Signed' : 'Draft'}
                              </span>
                            )}
                            {note.protocol_name && (
                              <span
                                style={{
                                  marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                                  background: '#f0f9ff', color: '#0369a1',
                                }}
                              >
                                {note.protocol_name}
                              </span>
                            )}
                            {note.pinned && (
                              <span style={{
                                marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
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
                            {(note.source === 'manual' || note.source === 'protocol') && (
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
                          {note.body}
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
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              <section className="card">
                <div className="card-header">
                  <h3>Tasks ({patientTasks.length})</h3>
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
                              borderRadius: 4,
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
                                  borderRadius: 6,
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
            </>
          )}

          {/* Symptoms Tab */}
          {activeTab === 'symptoms' && (
            <>
              {questionnaireResponses.length === 0 ? (
                <section className="card">
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>No Symptoms Questionnaires</h3>
                    <p style={{ color: '#888', fontSize: '14px', margin: '0 0 20px' }}>
                      This patient hasn&apos;t completed a symptoms questionnaire yet.
                    </p>
                    <a href="/admin/send-forms" style={{ display: 'inline-block', padding: '10px 20px', background: '#000', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                      Send Questionnaire
                    </a>
                  </div>
                </section>
              ) : (() => {
                const selected = questionnaireResponses[selectedQuestionnaireIdx] || questionnaireResponses[0];
                const responses = selected?.responses || {};
                const overallScore = selected?.overall_score;
                const submittedDate = selected?.submitted_at ? new Date(selected.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';

                const SYMPTOM_SECTIONS = [
                  { title: 'Energy & Brain', keys: ['energy', 'fatigue', 'focus', 'memory'] },
                  { title: 'Sleep', keys: ['sleep_onset', 'sleep_quality'] },
                  { title: 'Mood & Stress', keys: ['mood', 'stress', 'anxiety'] },
                  { title: 'Weight & Metabolism', keys: ['weight_satisfaction', 'weight_loss_ease', 'cravings'] },
                  { title: 'Recovery & Pain', keys: ['recovery', 'pain', 'strength'] },
                  { title: 'Hormones', keys: ['libido', 'sexual_performance'] },
                ];

                const QUESTION_LABELS = {
                  overall_health: 'Overall Health',
                  energy: 'Daytime Energy',
                  fatigue: 'Fatigue',
                  focus: 'Focus & Clarity',
                  memory: 'Memory',
                  sleep_onset: 'Falling Asleep',
                  sleep_quality: 'Sleep Quality',
                  mood: 'Mood',
                  stress: 'Stress Level',
                  anxiety: 'Anxiety',
                  weight_satisfaction: 'Weight Satisfaction',
                  weight_loss_ease: 'Weight Loss Ease',
                  cravings: 'Cravings',
                  recovery: 'Recovery Speed',
                  pain: 'Pain & Soreness',
                  strength: 'Strength',
                  libido: 'Sex Drive',
                  sexual_performance: 'Sexual Performance',
                };

                // Questions where higher = worse (invert color logic)
                const INVERTED_KEYS = ['fatigue', 'stress', 'anxiety', 'pain', 'cravings'];

                const getScoreColor = (score, key) => {
                  const isInverted = INVERTED_KEYS.includes(key);
                  const effectiveScore = isInverted ? (11 - score) : score;
                  if (effectiveScore >= 7) return { bar: '#22c55e', bg: '#f0fdf4' };
                  if (effectiveScore >= 4) return { bar: '#eab308', bg: '#fefce8' };
                  return { bar: '#ef4444', bg: '#fef2f2' };
                };

                return (
                  <>
                    {/* History selector */}
                    {questionnaireResponses.length > 1 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {questionnaireResponses.map((qr, idx) => {
                          const d = qr.submitted_at ? new Date(qr.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `#${idx + 1}`;
                          return (
                            <button
                              key={qr.id || idx}
                              onClick={() => setSelectedQuestionnaireIdx(idx)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: idx === selectedQuestionnaireIdx ? '#000' : '#ddd',
                                background: idx === selectedQuestionnaireIdx ? '#000' : '#fff',
                                color: idx === selectedQuestionnaireIdx ? '#fff' : '#666',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary header */}
                    <section className="card">
                      <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%',
                          background: overallScore >= 7 ? '#f0fdf4' : overallScore >= 4 ? '#fefce8' : '#fef2f2',
                          border: `3px solid ${overallScore >= 7 ? '#22c55e' : overallScore >= 4 ? '#eab308' : '#ef4444'}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: '24px', fontWeight: '700', lineHeight: 1 }}>{overallScore ? overallScore.toFixed(1) : '—'}</span>
                          <span style={{ fontSize: '11px', color: '#888' }}>/10</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Overall Score</div>
                          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Submitted {submittedDate}</div>
                          {responses.goals && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '4px' }}>GOALS</div>
                              <div style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', background: '#f9fafb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                {responses.goals}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Overall Health */}
                    {responses.overall_health && (
                      <section className="card" style={{ marginTop: '12px' }}>
                        <div style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Overall Health</span>
                            <span style={{ fontSize: '15px', fontWeight: '700' }}>{responses.overall_health}/10</span>
                          </div>
                          <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${responses.overall_health * 10}%`, background: getScoreColor(responses.overall_health, 'overall_health').bar, borderRadius: '4px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Section cards */}
                    {SYMPTOM_SECTIONS.map(section => {
                      const sectionScores = section.keys.filter(k => responses[k] != null);
                      if (sectionScores.length === 0) return null;

                      return (
                        <section key={section.title} className="card" style={{ marginTop: '12px' }}>
                          <div className="card-header">
                            <h3>{section.title}</h3>
                          </div>
                          <div style={{ padding: '4px 20px 16px' }}>
                            {section.keys.map(key => {
                              const score = responses[key];
                              if (score == null) return null;
                              const colors = getScoreColor(score, key);
                              return (
                                <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                                      {QUESTION_LABELS[key] || key}
                                      {INVERTED_KEYS.includes(key) && <span style={{ fontSize: '10px', color: '#aaa', marginLeft: '6px' }}>▼</span>}
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: colors.bar }}>{score}/10</span>
                                  </div>
                                  <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${score * 10}%`, background: colors.bar, borderRadius: '3px', transition: 'width 0.3s' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </>
                );
              })()}
            </>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              {/* Payments Sub-tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'subscriptions', label: `Subscriptions${subscriptions.length > 0 ? ` (${subscriptions.filter(s => s.status === 'active' || s.status === 'past_due').length})` : ''}` },
                  { key: 'invoices', label: 'Invoices' },
                  { key: 'purchases', label: 'Purchases' },
                  { key: 'cards', label: `Payment Methods${savedCards.length > 0 ? ` (${savedCards.length})` : ''}` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPaymentsSubTab(tab.key)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: paymentsSubTab === tab.key ? '2px solid #166534' : '1px solid #d1d5db',
                      background: paymentsSubTab === tab.key ? '#dcfce7' : '#fff',
                      color: paymentsSubTab === tab.key ? '#166534' : '#374151',
                      fontWeight: paymentsSubTab === tab.key ? 600 : 400,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subscriptions Sub-tab */}
              {paymentsSubTab === 'subscriptions' && (
                <section className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Subscriptions</h3>
                    <button
                      onClick={() => { if (!loadingStripeSubs) fetchStripeSubscriptions(); }}
                      style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}
                    >
                      {loadingStripeSubs ? 'Loading...' : 'Refresh from Stripe'}
                    </button>
                  </div>

                  {stripeSubscriptions.length === 0 && !loadingStripeSubs ? (
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                      <div className="empty">No subscriptions found</div>
                      <button
                        onClick={fetchStripeSubscriptions}
                        style={{ marginTop: 8, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Load from Stripe
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '0 16px 16px' }}>
                      {stripeSubscriptions.map(sub => {
                        const isPastDue = sub.status === 'past_due';
                        const isPaused = !!sub.pause_collection;
                        const isCanceled = sub.status === 'canceled';
                        const isCancelingAtEnd = sub.cancel_at_period_end;
                        const isActive = sub.status === 'active' && !isPaused && !isCancelingAtEnd;
                        const pm = sub.payment_method;
                        const inv = sub.latest_invoice;

                        const statusColor = isPastDue ? '#ef4444' : isPaused ? '#f59e0b' : isCanceled ? '#6b7280' : isCancelingAtEnd ? '#f59e0b' : '#16a34a';
                        const statusLabel = isPastDue ? 'Past Due' : isPaused ? 'Paused' : isCanceled ? 'Canceled' : isCancelingAtEnd ? 'Canceling' : 'Active';
                        const statusBg = isPastDue ? '#fee2e2' : isPaused ? '#fef3c7' : isCanceled ? '#f3f4f6' : isCancelingAtEnd ? '#fef3c7' : '#dcfce7';

                        return (
                          <div key={sub.id} style={{
                            background: '#f8fafc', borderRadius: 10, border: isPastDue ? '2px solid #fca5a5' : '1px solid #e2e8f0',
                            padding: '16px', marginTop: 10,
                          }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                                  {sub.description || 'Subscription'}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                  {sub.service_category && (
                                    <span style={{
                                      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginRight: 8,
                                      background: sub.service_category === 'hrt' ? '#dbeafe' : sub.service_category === 'weight_loss' ? '#fef3c7' : '#e2e8f0',
                                      color: sub.service_category === 'hrt' ? '#1e40af' : sub.service_category === 'weight_loss' ? '#92400e' : '#475569'
                                    }}>
                                      {sub.service_category}
                                    </span>
                                  )}
                                  Since {new Date(sub.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>
                                  ${(sub.amount_cents / 100).toFixed(0)}<span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>/{sub.interval}</span>
                                </div>
                                <span style={{
                                  display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                                  fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor, marginTop: 4,
                                }}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            {/* Details row */}
                            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                              {pm && (
                                <div>
                                  <span style={{ fontWeight: 600, color: '#374151' }}>Card: </span>
                                  {pm.brand.toUpperCase()} ···· {pm.last4}
                                  <span style={{ marginLeft: 4, color: '#94a3b8' }}>({String(pm.exp_month).padStart(2, '0')}/{pm.exp_year})</span>
                                </div>
                              )}
                              {sub.current_period_end && !isCanceled && (
                                <div>
                                  <span style={{ fontWeight: 600, color: '#374151' }}>{isCancelingAtEnd ? 'Ends: ' : 'Renews: '}</span>
                                  {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              )}
                              {isCanceled && sub.canceled_at && (
                                <div>
                                  <span style={{ fontWeight: 600, color: '#374151' }}>Canceled: </span>
                                  {new Date(sub.canceled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              )}
                            </div>

                            {/* Past due alert */}
                            {isPastDue && inv && (
                              <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px',
                                marginBottom: 12, fontSize: 13, color: '#991b1b',
                              }}>
                                Payment failed — ${(inv.amount_due / 100).toFixed(2)} due
                                {inv.attempt_count > 1 && ` (${inv.attempt_count} attempts)`}
                                {inv.next_payment_attempt && (
                                  <span style={{ marginLeft: 8, fontSize: 12, color: '#b91c1c' }}>
                                    Next retry: {new Date(inv.next_payment_attempt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Action buttons */}
                            {!isCanceled && (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {/* Update payment method */}
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
                                      padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6,
                                      background: isPastDue ? '#16a34a' : '#fff', color: isPastDue ? '#fff' : '#374151',
                                      cursor: 'pointer', fontWeight: isPastDue ? 600 : 400,
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

                                {/* Retry payment with current card */}
                                {isPastDue && (
                                  <button
                                    onClick={() => handleSubAction(sub.id, 'retry_payment')}
                                    disabled={!!subActionLoading}
                                    style={{
                                      padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                                      background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
                                    }}
                                  >
                                    {subActionLoading === sub.id + '_retry_payment' ? 'Retrying...' : 'Retry Payment'}
                                  </button>
                                )}

                                {/* Pause / Resume */}
                                {isActive && (
                                  <button
                                    onClick={() => handleSubAction(sub.id, 'pause')}
                                    disabled={!!subActionLoading}
                                    style={{
                                      padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                                      background: '#fff', color: '#f59e0b', border: '1px solid #fcd34d', cursor: 'pointer',
                                    }}
                                  >
                                    {subActionLoading === sub.id + '_pause' ? 'Pausing...' : 'Pause'}
                                  </button>
                                )}
                                {isPaused && (
                                  <button
                                    onClick={() => handleSubAction(sub.id, 'resume')}
                                    disabled={!!subActionLoading}
                                    style={{
                                      padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                                      background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
                                    }}
                                  >
                                    {subActionLoading === sub.id + '_resume' ? 'Resuming...' : 'Resume'}
                                  </button>
                                )}

                                {/* Undo cancel at period end */}
                                {isCancelingAtEnd && (
                                  <button
                                    onClick={() => handleSubAction(sub.id, 'undo_cancel')}
                                    disabled={!!subActionLoading}
                                    style={{
                                      padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                                      background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
                                    }}
                                  >
                                    {subActionLoading === sub.id + '_undo_cancel' ? 'Undoing...' : 'Undo Cancel'}
                                  </button>
                                )}

                                {/* Cancel options */}
                                {!isCancelingAtEnd && !isPaused && (
                                  <>
                                    <button
                                      onClick={() => handleCancelSubscription(sub.id, false)}
                                      disabled={!!subActionLoading}
                                      style={{
                                        padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                                        background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', cursor: 'pointer',
                                      }}
                                    >
                                      Cancel at Period End
                                    </button>
                                    <button
                                      onClick={() => handleCancelSubscription(sub.id, true)}
                                      disabled={!!subActionLoading}
                                      style={{
                                        padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                                        background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer',
                                      }}
                                    >
                                      Cancel Now
                                    </button>
                                  </>
                                )}

                                {/* View invoice on Stripe */}
                                {inv?.hosted_invoice_url && (
                                  <a
                                    href={inv.hosted_invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                                      background: '#fff', color: '#3b82f6', border: '1px solid #93c5fd', cursor: 'pointer',
                                      textDecoration: 'none', display: 'inline-block',
                                    }}
                                  >
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
                </section>
              )}

              {/* Invoices Sub-tab */}
              {paymentsSubTab === 'invoices' && (
                <section className="card">
                  <div className="card-header">
                    <h3>Invoices ({invoices.length})</h3>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="empty">No invoices found</div>
                  ) : (
                    <div className="payments-list">
                      {invoices.map(inv => {
                        const statusColors = {
                          paid: { bg: '#dcfce7', text: '#166534' },
                          pending: { bg: '#fef3c7', text: '#92400e' },
                          overdue: { bg: '#fee2e2', text: '#dc2626' },
                          void: { bg: '#f3f4f6', text: '#6b7280' },
                          draft: { bg: '#f3f4f6', text: '#6b7280' }
                        };
                        const invStatus = (inv.status || 'pending').toLowerCase();
                        const invStyle = statusColors[invStatus] || statusColors.pending;

                        return (
                          <div key={inv.id} className="payment-row">
                            <div className="payment-info">
                              <strong>{inv.description || inv.line_items?.[0]?.description || 'Invoice'}</strong>
                              <span className="payment-date">{formatDate(inv.created_at)}</span>
                            </div>
                            <div className="payment-amount">${(inv.total_amount || inv.amount || 0).toFixed(2)}</div>
                            <span className="payment-status" style={{ background: invStyle.bg, color: invStyle.text }}>
                              {invStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* Purchases Sub-tab */}
              {paymentsSubTab === 'purchases' && (
                <section className="card">
                  <div className="card-header">
                    <h3>Purchases ({allPurchases.length})</h3>
                  </div>
                  {allPurchases.length === 0 ? (
                    <div className="empty">No purchases found</div>
                  ) : (
                    <div className="payments-list">
                      {allPurchases.map(purchase => (
                        <div key={purchase.id} className="payment-row" style={{ cursor: 'pointer' }} onClick={() => openEditPurchase(purchase)}>
                          <div className="payment-info">
                            <strong>{purchase.product_name || purchase.item_name || 'Purchase'}</strong>
                            <span className="payment-date">{formatDate(purchase.purchased_at || purchase.purchase_date || purchase.created_at)}</span>
                          </div>
                          <div className="payment-amount">${(purchase.amount_paid || purchase.amount || 0).toFixed(2)}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {purchase.stripe_subscription_id && (
                              <span className="payment-status" style={{ background: '#dbeafe', color: '#1e40af' }}>
                                recurring
                              </span>
                            )}
                            <span className="payment-status" style={{
                              background: purchase.protocol_created ? '#dcfce7' : '#fef3c7',
                              color: purchase.protocol_created ? '#166534' : '#92400e'
                            }}>
                              {purchase.protocol_created ? 'protocol set' : 'no protocol'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Payment Methods (Cards) Sub-tab */}
              {paymentsSubTab === 'cards' && (
                <section className="card">
                  <div className="card-header">
                    <h3>Payment Methods</h3>
                  </div>

                  {/* Saved Cards List */}
                  {savedCards.length > 0 ? (
                    <div style={{ padding: '0 16px 16px' }}>
                      {savedCards.map(card => (
                        <div key={card.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', background: '#f9fafb', borderRadius: 8,
                          marginTop: 8, border: '1px solid #e5e7eb',
                        }}>
                          <span style={{ fontSize: 20 }}>💳</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
                              {card.brand.toUpperCase()} ···· {card.last4}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            style={{
                              padding: '6px 12px', fontSize: 12, fontWeight: 500,
                              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                              color: '#dc2626', cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">No cards on file</div>
                  )}

                  {/* Add Card Section */}
                  {stripePromise && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <Elements stripe={stripePromise}>
                        <AddCardForm patientId={id} onCardSaved={() => fetchSavedCards()} />
                      </Elements>
                    </div>
                  )}
                </section>
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
          <div className="modal-overlay" onClick={() => setShowEditPurchaseModal(false)}>
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
                    <button onClick={() => setConfirmDeletePurchase(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: '6px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      Delete
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Delete this purchase?</span>
                      <button onClick={handleDeletePurchase} disabled={deletingPurchase} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '6px', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>
                        {deletingPurchase ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDeletePurchase(false)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', cursor: 'pointer' }}>
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
          <div className="modal-overlay" onClick={() => setEditInjectionModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <h3>Edit Injection</h3>
                <button onClick={() => setEditInjectionModal(null)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={editInjectionForm.entry_date} onChange={e => setEditInjectionForm({ ...editInjectionForm, entry_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Dose</label>
                  <input type="text" value={editInjectionForm.dosage} onChange={e => setEditInjectionForm({ ...editInjectionForm, dosage: e.target.value })} placeholder="e.g. 4mg" />
                </div>
                <div className="form-group">
                  <label>Weight (lbs)</label>
                  <input type="number" step="0.1" value={editInjectionForm.weight} onChange={e => setEditInjectionForm({ ...editInjectionForm, weight: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={editInjectionForm.notes} onChange={e => setEditInjectionForm({ ...editInjectionForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {!confirmDeleteInjection ? (
                    <button onClick={() => setConfirmDeleteInjection(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: '6px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      Delete
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Delete?</span>
                      <button onClick={handleDeleteInjection} disabled={editInjectionSaving} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '6px', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>
                        {editInjectionSaving ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDeleteInjection(false)} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#374151', cursor: 'pointer' }}>
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
          <div className="modal-overlay" onClick={() => { setShowAddNoteModal(false); stopDictation(); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h3>Add Note</h3>
                <button onClick={() => { setShowAddNoteModal(false); stopDictation(); setNoteInput(''); setNoteFormatted(''); }} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Note (type or dictate)</label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      rows={6}
                      placeholder="Type your clinical note here, or click the microphone to dictate..."
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
          <div className="modal-overlay" onClick={() => { setEditingNote(null); setEditNoteBody(''); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h3>Edit Note</h3>
                <button onClick={() => { setEditingNote(null); setEditNoteBody(''); }} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                  {formatDate(editingNote.note_date || editingNote.created_at)}
                  {editingNote.created_by && ` — by ${editingNote.created_by}`}
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
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Assign Protocol</h3>
                <button onClick={() => setShowAssignModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                {selectedNotification && (
                  <div className="modal-preview">{selectedNotification.product_name} • ${selectedNotification.amount_paid?.toFixed(2)}</div>
                )}

                {existingPacks.length > 0 && (
                  <div className="pack-toggle">
                    <button className={!addToPackMode ? 'active' : ''} onClick={() => setAddToPackMode(false)}>New Protocol</button>
                    <button className={addToPackMode ? 'active' : ''} onClick={() => setAddToPackMode(true)}>Add to Pack</button>
                  </div>
                )}

                {addToPackMode ? (
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
                      <select value={assignForm.templateId} onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}>
                        <option value="">Select template...</option>
                        {Object.entries(templates.grouped || {}).map(([category, temps]) => (
                          <optgroup key={category} label={category}>
                            {temps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {isPeptideTemplate() && (
                      <>
                        <div className="form-group">
                          <label>Select Peptide</label>
                          <select value={assignForm.peptideId} onChange={e => setAssignForm({...assignForm, peptideId: e.target.value})}>
                            <option value="">Select peptide...</option>
                            {peptides.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        {getSelectedPeptide()?.dose_options?.length > 0 && (
                          <div className="form-group">
                            <label>Dose</label>
                            <select value={assignForm.selectedDose} onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}>
                              <option value="">Select dose...</option>
                              {getSelectedPeptide().dose_options.map(dose => <option key={dose} value={dose}>{dose}</option>)}
                            </select>
                          </div>
                        )}
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

                    <div className="form-group">
                      <label>Frequency</label>
                      <select value={assignForm.frequency} onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}>
                        <option value="">Select frequency...</option>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={assignForm.startDate} onChange={e => setAssignForm({...assignForm, startDate: e.target.value})} />
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
                {addToPackMode ? (
                  <button onClick={handleAddToPack} disabled={!selectedPackId} className="btn-primary">Add to Pack</button>
                ) : (
                  <button onClick={handleAssignProtocol} disabled={!assignForm.templateId} className="btn-primary">Assign</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Protocol Modal */}
        {showEditModal && selectedProtocol && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Protocol</h3>
                <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="modal-preview">{selectedProtocol.program_name}</div>

                {/* Medication Selection - Category-based */}
                <div className="form-section-label">Medication & Dosing</div>

                {/* Weight Loss Protocols */}
                {selectedProtocol.category === 'weight_loss' && (
                  <>
                    <div className="form-group">
                      <label>Medication</label>
                      <select
                        value={editForm.medication}
                        onChange={e => setEditForm({...editForm, medication: e.target.value, selectedDose: ''})}
                      >
                        <option value="">Select medication...</option>
                        {WEIGHT_LOSS_MEDICATIONS.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dose</label>
                      <select
                        value={editForm.selectedDose}
                        onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                      >
                        <option value="">Select dose...</option>
                        {editForm.medication && WEIGHT_LOSS_DOSAGES[editForm.medication]?.map(dose => (
                          <option key={dose} value={dose}>{dose}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Peptide Protocols */}
                {selectedProtocol.category === 'peptide' && (
                  <>
                    <div className="form-group">
                      <label>Peptide</label>
                      <select
                        value={editForm.medication}
                        onChange={e => {
                          const peptideInfo = findPeptideInfo(e.target.value);
                          setEditForm({
                            ...editForm,
                            medication: e.target.value,
                            selectedDose: peptideInfo?.startingDose || '',
                            frequency: peptideInfo?.frequency || editForm.frequency
                          });
                        }}
                      >
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
                    <div className="form-group">
                      <label>Dose</label>
                      {(() => {
                        const peptideInfo = findPeptideInfo(editForm.medication);
                        if (peptideInfo?.doses) {
                          return (
                            <select
                              value={editForm.selectedDose}
                              onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                            >
                              <option value="">Select dose...</option>
                              {peptideInfo.doses.map(dose => (
                                <option key={dose} value={dose}>{dose}</option>
                              ))}
                            </select>
                          );
                        } else if (peptideInfo) {
                          return (
                            <select
                              value={editForm.selectedDose}
                              onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                            >
                              <option value="">Select dose...</option>
                              <option value={peptideInfo.startingDose}>{peptideInfo.startingDose} (Starting)</option>
                              {peptideInfo.maxDose !== peptideInfo.startingDose && (
                                <option value={peptideInfo.maxDose}>{peptideInfo.maxDose} (Max)</option>
                              )}
                              <option value="custom">Custom...</option>
                            </select>
                          );
                        }
                        return (
                          <input
                            type="text"
                            value={editForm.selectedDose}
                            onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                            placeholder="Enter dose"
                          />
                        );
                      })()}
                    </div>
                    {editForm.selectedDose === 'custom' && (
                      <div className="form-group">
                        <label>Custom Dose</label>
                        <input
                          type="text"
                          onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                          placeholder="e.g., 400mcg"
                        />
                      </div>
                    )}
                    {findPeptideInfo(editForm.medication)?.notes && (
                      <div className="form-hint">{findPeptideInfo(editForm.medication).notes}</div>
                    )}
                  </>
                )}

                {/* HRT Protocols */}
                {selectedProtocol.category === 'hrt' && (
                  <>
                    <div className="form-group">
                      <label>Medication</label>
                      <select
                        value={editForm.medication}
                        onChange={e => setEditForm({...editForm, medication: e.target.value})}
                      >
                        <option value="">Select medication...</option>
                        {HRT_MEDICATIONS.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dose</label>
                      <select
                        value={editForm.selectedDose}
                        onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                      >
                        <option value="">Select dose...</option>
                        {TESTOSTERONE_DOSES.male.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                        <optgroup label="Female Doses">
                          {TESTOSTERONE_DOSES.female.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Injections/Week</label>
                      <select value={editForm.injectionsPerWeek} onChange={e => setEditForm({...editForm, injectionsPerWeek: e.target.value})}>
                        <option value="1">1x per week</option>
                        <option value="2">2x per week</option>
                        <option value="3">3x per week</option>
                        <option value="7">7x per week (daily)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Injection Protocols */}
                {selectedProtocol.category === 'injection' && (
                  <>
                    <div className="form-group">
                      <label>Medication</label>
                      <select
                        value={editForm.medication}
                        onChange={e => setEditForm({...editForm, medication: e.target.value})}
                      >
                        <option value="">Select medication...</option>
                        {INJECTION_MEDICATIONS.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dose</label>
                      <input
                        type="text"
                        value={editForm.selectedDose}
                        onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                        placeholder="e.g., 100mg, 1ml"
                      />
                    </div>
                  </>
                )}

                {/* IV Therapy Protocols */}
                {selectedProtocol.category === 'iv' && (
                  <>
                    <div className="form-group">
                      <label>IV Type</label>
                      <select
                        value={editForm.medication}
                        onChange={e => setEditForm({...editForm, medication: e.target.value})}
                      >
                        <option value="">Select IV type...</option>
                        {IV_THERAPY_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Generic fallback for other categories */}
                {!['weight_loss', 'peptide', 'hrt', 'injection', 'iv'].includes(selectedProtocol.category) && (
                  <div className="form-group">
                    <label>Dose</label>
                    <input
                      type="text"
                      value={editForm.selectedDose}
                      onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                      placeholder="Enter dose"
                    />
                  </div>
                )}

                {/* Frequency - Full options from config (hidden for HRT — Injections/Week is the source of truth) */}
                {selectedProtocol.category !== 'hrt' && (
                  <div className="form-group">
                    <label>Frequency</label>
                    <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                      <option value="">Select...</option>
                      {FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* HRT Supply Tracking - only Supply Type and Last Refill (dose & frequency are in main section above) */}
                {selectedProtocol.category === 'hrt' && (
                  <>
                    <div className="form-section-label">HRT Supply Tracking</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Supply Type</label>
                        <select value={editForm.supplyType} onChange={e => setEditForm({...editForm, supplyType: e.target.value})}>
                          <option value="">Select...</option>
                          {HRT_SUPPLY_TYPES.map(st => (
                            <option key={st.value} value={st.value}>{st.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Last Refill Date</label>
                        <input type="date" value={editForm.lastRefillDate} onChange={e => setEditForm({...editForm, lastRefillDate: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery & Scheduling */}
                <div className="form-section-label">Delivery & Scheduling</div>
                <div className="form-group">
                  <label>Delivery Method</label>
                  <select value={editForm.deliveryMethod} onChange={e => setEditForm({...editForm, deliveryMethod: e.target.value})}>
                    <option value="">Select...</option>
                    {DELIVERY_METHODS.map(dm => (
                      <option key={dm.value} value={dm.value}>{dm.label}</option>
                    ))}
                  </select>
                </div>

                {/* Injection Method (IM/SubQ) - show for HRT take-home protocols */}
                {selectedProtocol?.category === 'hrt' && editForm.deliveryMethod === 'take_home' && (
                  <div className="form-group">
                    <label>Injection Method</label>
                    <select value={editForm.injectionMethod} onChange={e => setEditForm({...editForm, injectionMethod: e.target.value})}>
                      <option value="">Select...</option>
                      {INJECTION_METHODS.map(im => (
                        <option key={im.value} value={im.value}>{im.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {editForm.deliveryMethod === 'in_clinic' && (
                  <>
                    <div className="form-group">
                      <label>Visit Frequency</label>
                      <select value={editForm.visitFrequency} onChange={e => setEditForm({...editForm, visitFrequency: e.target.value})}>
                        <option value="">Select...</option>
                        {VISIT_FREQUENCY_OPTIONS.map(vf => (
                          <option key={vf.value} value={vf.value}>{vf.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Scheduled Days</label>
                      <div className="checkbox-group">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                          <label key={day} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={editForm.scheduledDays.includes(day)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setEditForm({...editForm, scheduledDays: [...editForm.scheduledDays, day]});
                                } else {
                                  setEditForm({...editForm, scheduledDays: editForm.scheduledDays.filter(d => d !== day)});
                                }
                              }}
                            />
                            {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Last Visit</label>
                        <input type="date" value={editForm.lastVisitDate} onChange={e => setEditForm({...editForm, lastVisitDate: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Next Expected</label>
                        <input type="date" value={editForm.nextExpectedDate} onChange={e => setEditForm({...editForm, nextExpectedDate: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

                {/* Sessions or Date Range */}
                <div className="form-section-label">Duration</div>
                {editForm.totalSessions ? (
                  <div className="form-group">
                    <label>Sessions Used (of {editForm.totalSessions})</label>
                    <input type="number" min="0" max={editForm.totalSessions} value={editForm.sessionsUsed} onChange={e => setEditForm({...editForm, sessionsUsed: parseInt(e.target.value) || 0})} />
                  </div>
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input type="date" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="form-group">
                  <label>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                    {PROTOCOL_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
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
          <div className="modal-overlay" onClick={() => setShowLabsModal(false)}>
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
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
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

        {/* Send Symptoms Modal */}
        {showSymptomsModal && (
          <div className="modal-overlay" onClick={() => setShowSymptomsModal(false)}>
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
          <div className="modal-overlay" onClick={() => setShowIntakeModal(false)}>
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
          <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
            <div className="modal modal-booking" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Book Appointment</h3>
                <button onClick={() => setShowBookingModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <BookingTab preselectedPatient={{ id: patient.id, name: patient.name, email: patient.email, phone: patient.phone }} />
              </div>
            </div>
          </div>
        )}

        {/* POS Charge Modal */}
        <POSChargeModal
          isOpen={showChargeModal}
          onClose={() => setShowChargeModal(false)}
          patient={patient}
          stripePromise={stripePromise}
        />

        {/* ==================== ADD CREDIT MODAL ==================== */}
        {showAddCreditModal && (
          <div className="modal-overlay" onClick={() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); }}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Account Credit</h3>
                <button onClick={() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); }} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                {/* Balance banner */}
                <div style={{ background: creditBalanceCents > 0 ? '#f0fdf4' : '#f9fafb', border: `1px solid ${creditBalanceCents > 0 ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 14, color: creditBalanceCents > 0 ? '#166534' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Reason</label>
                      <select
                        value={addCreditReason}
                        onChange={e => setAddCreditReason(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
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
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setShowAddCreditModal(false); setAddCreditAmount(''); setAddCreditNote(''); setAddCreditReason('manual'); }}
                      style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
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
                      style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: addCreditSaving ? '#9ca3af' : '#166534', color: '#fff', cursor: addCreditSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
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
          <div className="modal-overlay" onClick={() => setShowSendProgressModal(false)}>
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
                    <button onClick={() => setShowSendProgressModal(false)} style={{ marginTop: '16px', padding: '8px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Done</button>
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
                            flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
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
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '13px', color: '#dc2626' }}>⚠️ No email on file for this patient</div>
                    )}
                    {(sendProgressMethod === 'sms' || sendProgressMethod === 'both') && !patient?.phone && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '13px', color: '#dc2626' }}>⚠️ No phone number on file for this patient</div>
                    )}
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', marginTop: '12px', fontSize: '13px', color: '#555' }}>
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
                  <button onClick={() => setShowSendProgressModal(false)} style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button
                    onClick={handleSendProgress}
                    disabled={sendingProgress || ((sendProgressMethod === 'email' || sendProgressMethod === 'both') && !patient?.email && sendProgressMethod !== 'sms') || ((sendProgressMethod === 'sms' || sendProgressMethod === 'both') && !patient?.phone && sendProgressMethod !== 'email')}
                    style={{ padding: '8px 20px', background: sendingProgress ? '#93c5fd' : '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', cursor: sendingProgress ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
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
          <div className="modal-overlay" onClick={() => { if (!merging) { setShowMergeModal(false); setMergeError(''); } }}>
            <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Merge Protocol</h3>
                <button onClick={() => { setShowMergeModal(false); setMergeError(''); }} className="close-btn" disabled={merging}>&times;</button>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ marginBottom: 16, fontSize: 14, color: '#374151' }}>
                  Merge <strong>{mergeSource.program_name || mergeSource.medication}</strong> into another protocol.
                  The injection count will roll over, and the surviving protocol will use the earliest start date.
                </p>

                {/* Source protocol summary */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Will be closed (merged away)</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mergeSource.program_name || mergeSource.medication}</div>
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
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginBottom: 16, background: '#fff' }}
                  disabled={merging}
                >
                  {[...activeProtocols, ...completedProtocols]
                    .filter(p => p.id !== mergeSource.id && p.category === mergeSource.category && p.status !== 'merged' && p.status !== 'cancelled')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.program_name || p.medication}
                        {p.selected_dose ? ` · ${p.selected_dose}` : ''}
                        {' · '}Started {p.start_date ? new Date(p.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {' · '}{p.sessions_used || 0} injections
                      </option>
                    ))}
                </select>

                {/* Preview */}
                {mergeTarget && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Surviving protocol (after merge)</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{mergeTarget.program_name || mergeTarget.medication}</div>
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
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
                    {mergeError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowMergeModal(false); setMergeError(''); }}
                    disabled={merging}
                    style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}
                  >Cancel</button>
                  <button
                    onClick={handleMergeProtocol}
                    disabled={merging || !mergeTarget}
                    style={{ padding: '8px 20px', background: merging ? '#9ca3af' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: merging ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
                  >{merging ? 'Merging...' : 'Merge Protocol'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== LOG ENTRY MODAL ==================== */}
        {showLogEntryModal && logEntryProtocol && (
          <div className="modal-overlay" onClick={() => setShowLogEntryModal(false)}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Log Entry — {logEntryProtocol.program_name || logEntryProtocol.medication}</h3>
                <button onClick={() => setShowLogEntryModal(false)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                {/* Date */}
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={logEntryDate} onChange={e => setLogEntryDate(e.target.value)} />
                </div>

                {/* Entry type toggle (HRT, WL) */}
                {['testosterone', 'weight_loss'].includes(logEntryProtocol.svcCat) && (
                  <div className="form-group">
                    <label>Type</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setLogEntryType('injection')} style={{ flex: 1, padding: '8px 0', border: '1px solid', borderColor: logEntryType === 'injection' ? '#000' : '#d1d5db', borderRadius: 6, background: logEntryType === 'injection' ? '#000' : '#fff', color: logEntryType === 'injection' ? '#fff' : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>In-Clinic Injection</button>
                      <button onClick={() => setLogEntryType('pickup')} style={{ flex: 1, padding: '8px 0', border: '1px solid', borderColor: logEntryType === 'pickup' ? '#000' : '#d1d5db', borderRadius: 6, background: logEntryType === 'pickup' ? '#000' : '#fff', color: logEntryType === 'pickup' ? '#fff' : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Medication Pickup</button>
                    </div>
                  </div>
                )}
                {logEntryProtocol.svcCat === 'peptide' && (
                  <div className="form-group">
                    <label>Type</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setLogEntryType('injection')} style={{ flex: 1, padding: '8px 0', border: '1px solid', borderColor: logEntryType === 'injection' ? '#000' : '#d1d5db', borderRadius: 6, background: logEntryType === 'injection' ? '#000' : '#fff', color: logEntryType === 'injection' ? '#fff' : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Injection</button>
                      <button onClick={() => setLogEntryType('pickup')} style={{ flex: 1, padding: '8px 0', border: '1px solid', borderColor: logEntryType === 'pickup' ? '#000' : '#d1d5db', borderRadius: 6, background: logEntryType === 'pickup' ? '#000' : '#fff', color: logEntryType === 'pickup' ? '#fff' : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Vial Pickup</button>
                      <button onClick={() => setLogEntryType('med_pickup')} style={{ flex: 1, padding: '8px 0', border: '1px solid', borderColor: logEntryType === 'med_pickup' ? '#000' : '#d1d5db', borderRadius: 6, background: logEntryType === 'med_pickup' ? '#000' : '#fff', color: logEntryType === 'med_pickup' ? '#fff' : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Med Pickup</button>
                    </div>
                  </div>
                )}

                {/* ---- TESTOSTERONE / HRT ---- */}
                {logEntryProtocol.svcCat === 'testosterone' && (
                  <>
                    <div className="form-group">
                      <label>HRT Type</label>
                      <select value={logForm.hrt_type} onChange={e => setLogForm(p => ({ ...p, hrt_type: e.target.value, dosage: '' }))}>
                        <option value="male">Male HRT (200mg/ml)</option>
                        <option value="female">Female HRT (100mg/ml)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dosage</label>
                      <select value={logForm.dosage} onChange={e => setLogForm(p => ({ ...p, dosage: e.target.value }))}>
                        <option value="">Select dosage...</option>
                        {(HRT_OPTIONS[logForm.hrt_type]?.dosages || []).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      {logForm.dosage === 'custom' && (
                        <input type="text" placeholder="Enter custom dosage..." value={logForm.custom_dosage} onChange={e => setLogForm(p => ({ ...p, custom_dosage: e.target.value }))} style={{ marginTop: 6 }} />
                      )}
                    </div>
                    {logEntryType === 'pickup' && (
                      <div className="form-group">
                        <label>Dispensing</label>
                        <select value={logForm.delivery_method} onChange={e => setLogForm(p => ({ ...p, delivery_method: e.target.value }))}>
                          <option value="">Select...</option>
                          {(HRT_OPTIONS[logForm.hrt_type]?.deliveryMethods || []).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* ---- WEIGHT LOSS ---- */}
                {logEntryProtocol.svcCat === 'weight_loss' && (
                  <>
                    <div className="form-group">
                      <label>Medication</label>
                      <select value={logForm.medication} onChange={e => setLogForm(p => ({ ...p, medication: e.target.value, dosage: '' }))}>
                        {WL_MEDS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    {logEntryType === 'injection' && (
                      <>
                        <div className="form-group">
                          <label>Current Weight (lbs)</label>
                          <input type="number" step="0.1" value={logForm.weight} onChange={e => setLogForm(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 215.5" />
                        </div>
                        <div className="form-group">
                          <label>Dosage</label>
                          <select value={logForm.dosage} onChange={e => setLogForm(p => ({ ...p, dosage: e.target.value }))}>
                            <option value="">Select dosage...</option>
                            {(WL_MEDS.find(m => m.value === logForm.medication)?.dosages || []).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    {logEntryType === 'pickup' && (
                      <>
                        <div className="form-group">
                          <label>Dosage</label>
                          <select value={logForm.dosage} onChange={e => setLogForm(p => ({ ...p, dosage: e.target.value }))}>
                            <option value="">Select dosage...</option>
                            {Array.from({ length: 30 }, (_, i) => { const mg = (i + 1) * 0.5; const label = mg % 1 === 0 ? `${mg}mg` : `${mg.toFixed(1)}mg`; return <option key={mg} value={label}>{label}</option>; })}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Supply Duration</label>
                          <select value={logForm.quantity} onChange={e => setLogForm(p => ({ ...p, quantity: parseInt(e.target.value) }))}>
                            <option value="1">1 week</option>
                            <option value="2">2 weeks</option>
                            <option value="3">3 weeks</option>
                            <option value="4">4 weeks</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ---- VITAMIN / INJECTION ---- */}
                {logEntryProtocol.svcCat === 'vitamin' && (
                  <>
                    <div className="form-group">
                      <label>Injection</label>
                      <select value={logForm.medication} onChange={e => setLogForm(p => ({ ...p, medication: e.target.value }))}>
                        <option value="">Select injection...</option>
                        {VITAMIN_OPTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantity</label>
                      <select value={logForm.quantity} onChange={e => setLogForm(p => ({ ...p, quantity: parseInt(e.target.value) }))}>
                        <option value="1">1 injection</option>
                        <option value="2">2 injections</option>
                        <option value="3">3 injections</option>
                        <option value="4">4 pack</option>
                        <option value="8">8 pack</option>
                        <option value="10">10 pack</option>
                        <option value="12">12 pack</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ---- PEPTIDE ---- */}
                {logEntryProtocol.svcCat === 'peptide' && (
                  <>
                    <div className="form-group">
                      <label>Peptide</label>
                      <select value={logForm.medication} onChange={e => setLogForm(p => ({ ...p, medication: e.target.value }))}>
                        <option value="">Select peptide...</option>
                        {logForm.medication && !PEPTIDE_OPTIONS.flatMap(g => g.options).find(o => o.value === logForm.medication) && (
                          <option value={logForm.medication}>{logForm.medication} (from protocol)</option>
                        )}
                        {PEPTIDE_OPTIONS.map(group => (
                          <optgroup key={group.group} label={group.group}>
                            {group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.value}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dosage</label>
                      <input type="text" value={logForm.dosage} onChange={e => setLogForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 500mcg, 1mg..." />
                    </div>
                    {(logEntryType === 'pickup' || logEntryType === 'med_pickup') && (
                      <div className="form-group">
                        <label>Quantity</label>
                        <input type="number" min="1" value={logForm.quantity} onChange={e => setLogForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                      </div>
                    )}
                  </>
                )}

                {/* ---- IV THERAPY ---- */}
                {logEntryProtocol.svcCat === 'iv_therapy' && (
                  <>
                    <div className="form-group">
                      <label>IV Type</label>
                      <select value={logForm.medication} onChange={e => setLogForm(p => ({ ...p, medication: e.target.value }))}>
                        <option value="">Select IV...</option>
                        {IV_OPTS.map(iv => <option key={iv.value} value={iv.value}>{iv.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration</label>
                      <select value={logForm.duration} onChange={e => setLogForm(p => ({ ...p, duration: parseInt(e.target.value) }))}>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">120 minutes</option>
                        <option value="180">180 minutes (NAD+)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ---- HBOT ---- */}
                {logEntryProtocol.svcCat === 'hbot' && (
                  <div className="form-hint" style={{ marginBottom: 16, background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
                    60-minute session at 2.0 ATA
                  </div>
                )}

                {/* ---- RED LIGHT ---- */}
                {logEntryProtocol.svcCat === 'red_light' && (
                  <div className="form-group">
                    <label>Duration</label>
                    <select value={logForm.duration} onChange={e => setLogForm(p => ({ ...p, duration: parseInt(e.target.value) }))}>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea value={logForm.notes} onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>

                {/* Dispensing Details */}
                <div className="form-section-label">Dispensing Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Administered By</label>
                    <input type="text" value={logDispensing.administered_by} onChange={e => setLogDispensing(p => ({ ...p, administered_by: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Lot #</label>
                    <input type="text" value={logDispensing.lot_number} onChange={e => setLogDispensing(p => ({ ...p, lot_number: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Exp Date</label>
                    <input type="date" value={logDispensing.expiration_date} onChange={e => setLogDispensing(p => ({ ...p, expiration_date: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <SignatureCanvas onSignature={dataUrl => setLogSignature(dataUrl)} width={440} height={120} label="Patient Signature" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowLogEntryModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSubmitLogEntry} disabled={logSubmitting} className="btn-primary">
                  {logSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Patient Confirmation Modal */}
        {showDeleteConfirm && deletePreview && (
          <>
            <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setDeletePreview(null); }} />
            <div className="modal delete-modal">
              <h3>Delete Patient</h3>
              <p style={{ margin: '12px 0', color: '#dc2626', fontWeight: 600 }}>
                Are you sure you want to permanently delete <strong>{deletePreview.patient?.name}</strong>?
              </p>
              {deletePreview.totalRecords > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', margin: '12px 0' }}>
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
                    border: 'none', borderRadius: 6, cursor: deleting ? 'wait' : 'pointer',
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

        {/* PDF Slide-Out Viewer */}
        {pdfSlideOut.open && (
          <>
            <div className="slideout-overlay" onClick={closePdfViewer} />
            <div className="slideout-panel" style={{ width: `${slideoutWidth}%` }}>
              <div className="slideout-header">
                <h3>{pdfSlideOut.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
                    {[30, 50, 70].map(w => (
                      <button key={w} onClick={() => setSlideoutWidth(w)} style={{
                        padding: '4px 8px', fontSize: 11, fontWeight: 600, border: '1px solid #d1d5db',
                        borderRadius: 4, cursor: 'pointer',
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
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
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
              background: '#fff', borderRadius: 12, padding: 24, zIndex: 10001,
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
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setSessionLogModal(null)} style={{
                  padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontSize: 14
                }}>Cancel</button>
                <button onClick={handleSessionLog} disabled={sessionLogSaving} style={{
                  padding: '8px 20px', border: 'none', borderRadius: 6,
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
              background: '#fff', borderRadius: 12, padding: 24, zIndex: 10001,
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
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {bloodDrawModal.status === 'completed' && (
                  <button onClick={() => handleBloodDrawSave('undo')} disabled={bloodDrawSaving} style={{
                    padding: '8px 16px', border: '1px solid #dc2626', borderRadius: 6,
                    background: '#fff', color: '#dc2626', cursor: bloodDrawSaving ? 'wait' : 'pointer',
                    fontSize: 13, fontWeight: 600, marginRight: 'auto'
                  }}>Undo</button>
                )}
                <button onClick={() => setBloodDrawModal(null)} style={{
                  padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontSize: 14
                }}>Cancel</button>
                <button onClick={() => handleBloodDrawSave('complete')} disabled={bloodDrawSaving} style={{
                  padding: '8px 20px', border: 'none', borderRadius: 6,
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
        .toolbar-btn-blue { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .toolbar-btn-blue:hover { background: #dbeafe; }
        .toolbar-btn-green { background: #f0fdf4; color: #16a34a; font-weight: 600; }
        .toolbar-btn-green:hover { background: #dcfce7; }
        .toolbar-btn-credit { background: #f0fdf4; color: #166534; }
        .toolbar-btn-credit:hover { background: #dcfce7; }
        .toolbar-btn-dark { background: #1e293b; color: #fff; font-weight: 600; }
        .toolbar-btn-dark:hover { background: #334155; }
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

        /* Demographics Toggle */
        .demographics-toggle-row {
          margin-top: 12px;
          border-top: 1px solid #f3f4f6;
          padding-top: 8px;
        }
        .demographics-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 0;
          color: #6b7280;
          font-size: 12px;
        }
        .demographics-toggle:hover { color: #374151; }
        .demographics-preview {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #9ca3af;
        }
        .demographics-preview span + span::before {
          content: '·';
          margin-right: 16px;
          color: #d1d5db;
        }
        .demographics-toggle-icon {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
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
          padding: 8px 12px;
          border: none;
          background: none;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-radius: 7px;
          white-space: nowrap;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 5px;
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
          font-size: 13px;
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
          <div style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
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
                  borderRadius: 10, padding: '14px 16px', marginBottom: 12,
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
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Frequency</label>
                        <input value={sel.frequency} onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], frequency: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>Duration</label>
                        <select value={sel.duration} onChange={e => setProtocolPdfSelections(prev => ({
                          ...prev, [protId]: { ...prev[protId], duration: e.target.value }
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' }}>
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
                        }))} style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

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
                style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveProtocolPdfToChart} disabled={protocolPdfSaving || Object.values(protocolPdfSelections).filter(s => s.selected).length === 0}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600,
                    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                    borderRadius: 8, cursor: 'pointer', opacity: protocolPdfSaving ? 0.6 : 1,
                  }}>
                  {protocolPdfSaving ? 'Saving...' : '💾 Save to Chart'}
                </button>
                <button onClick={handleGenerateProtocolPdf} disabled={protocolPdfGenerating || Object.values(protocolPdfSelections).filter(s => s.selected).length === 0}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    background: '#0a0a0a', color: '#fff', border: 'none',
                    borderRadius: 8, cursor: 'pointer', opacity: protocolPdfGenerating ? 0.6 : 1,
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
        <div className="sf-overlay" onClick={() => setShowSendFormsModal(false)}>
          <div className="sf-modal" onClick={e => e.stopPropagation()}>
            <div className="sf-header">
              <h3>📋 Send Forms {patient?.first_name ? `to ${patient.first_name}` : ''}</h3>
              <button className="sf-close" onClick={() => setShowSendFormsModal(false)}>✕</button>
            </div>

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
                  </button>
                );
              })}
            </div>

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
              <button className="sf-send-btn" disabled={sendFormsSelected.size === 0 || sendFormsLoading || (sendFormsMethod === 'sms' && !patient?.phone) || (sendFormsMethod === 'email' && !patient?.email)}
                onClick={handleSendForms}>
                {sendFormsLoading ? 'Sending...' : `Send ${sendFormsSelected.size} Form${sendFormsSelected.size !== 1 ? 's' : ''} via ${sendFormsMethod === 'sms' ? 'SMS' : 'Email'}`}
              </button>
              {sendFormsResult && (
                <div className={`sf-result ${sendFormsResult.success ? 'sf-result-ok' : 'sf-result-err'}`}>
                  {sendFormsResult.success ? '✓' : '✕'} {sendFormsResult.message}
                </div>
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
