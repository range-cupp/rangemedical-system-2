// /pages/patients/[id].js
// Unified Patient Profile Page - Range Medical
// Single source of truth for all patient data

import { useState, useEffect, useRef } from 'react';
import { formatPhone } from '../../lib/format-utils';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

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
  FREQUENCY_OPTIONS,
  VISIT_FREQUENCY_OPTIONS,
  PROTOCOL_STATUS_OPTIONS,
  DELIVERY_METHODS,
  IV_THERAPY_TYPES,
  findPeptideInfo,
  findMatchingPeptide,
  getDoseOptions
} from '../../lib/protocol-config';
import { getHRTLabSchedule, matchDrawsToLogs, isHRTProtocol } from '../../lib/hrt-lab-schedule';
import { isRecoveryPeptide, isGHPeptide } from '../../lib/protocol-config';
import BookingTab from '../../components/BookingTab';
import LabDashboard from '../../components/labs/LabDashboard';
import ConversationView from '../../components/ConversationView';
import { loadStripe } from '@stripe/stripe-js';
import POSChargeModal from '../../components/POSChargeModal';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query || {};

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
  const [sessions, setSessions] = useState([]);
  const [symptomResponses, setSymptomResponses] = useState([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [selectedQuestionnaireIdx, setSelectedQuestionnaireIdx] = useState(0);
  const [labProtocols, setLabProtocols] = useState([]);
  const [labDocuments, setLabDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [weightLossLogs, setWeightLossLogs] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [commsLog, setCommsLog] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [invoices, setInvoices] = useState([]);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePreview, setDeletePreview] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bloodDrawModal, setBloodDrawModal] = useState(null);
  const [bloodDrawDate, setBloodDrawDate] = useState('');
  const [bloodDrawSaving, setBloodDrawSaving] = useState(false);
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editPurchaseForm, setEditPurchaseForm] = useState({ product_name: '', amount_paid: '', stripe_subscription_id: '', notes: '' });

  // Appointment edit modal state
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [aptEditStatus, setAptEditStatus] = useState('');
  const [aptEditNotes, setAptEditNotes] = useState('');
  const [aptEditCategory, setAptEditCategory] = useState('');
  const [savingApt, setSavingApt] = useState(false);

  // Payments sub-tab state
  const [paymentsSubTab, setPaymentsSubTab] = useState('invoices');

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
        setCompletedProtocols(data.completedProtocols || []);
        setPendingNotifications(data.pendingNotifications || []);
        setLabProtocols(data.labProtocols || []);
        setLabs(data.labs || []);
        setIntakes(data.intakes || []);
        setConsents(data.consents || []);
        setMedicalDocuments(data.medicalDocuments || []);
        setSessions(data.sessions || []);
        setSymptomResponses(data.symptomResponses || []);
        setQuestionnaireResponses(data.questionnaireResponses || []);
        setAppointments(data.appointments || []);
        setNotes(data.notes || []);
        setWeightLossLogs(data.weightLossLogs || []);
        setServiceLogs(data.serviceLogs || []);
        setCommsLog(data.commsLog || []);
        setAllPurchases(data.allPurchases || []);
        setInvoices(data.invoices || []);
        setStats(data.stats || {});

        // Compute HRT lab schedules for active HRT protocols
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
              const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
              schedules[p.id] = matchDrawsToLogs(schedule, bloodDrawLogs, data.labs || [], data.labProtocols || []);
            } catch {
              const firstFollowup = p.first_followup_weeks || 8;
              const schedule = getHRTLabSchedule(p.start_date, firstFollowup);
              schedules[p.id] = schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null }));
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

    // Recompute the lab schedule locally
    const updatedProto = { ...proto, first_followup_weeks: newWeeks };
    try {
      const protoRes = await fetch(`/api/protocols/${protocolId}`);
      const protoData = await protoRes.json();
      const bloodDrawLogs = (protoData.activityLogs || []).filter(l => l.log_type === 'blood_draw');
      const schedule = getHRTLabSchedule(updatedProto.start_date, newWeeks);
      const matched = matchDrawsToLogs(schedule, bloodDrawLogs, labs || [], labProtocols || []);
      setHrtLabSchedules(prev => ({ ...prev, [protocolId]: matched }));
    } catch {
      const schedule = getHRTLabSchedule(updatedProto.start_date, newWeeks);
      setHrtLabSchedules(prev => ({ ...prev, [protocolId]: schedule.map(s => ({ ...s, status: 'upcoming', completedDate: null })) }));
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  // Log a session for a session-based protocol (HBOT, RLT, injection packs, etc.)
  const handleLogSession = async (protocolId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/protocols/${protocolId}/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_type: 'session',
          log_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        fetchPatient();
      }
    } catch (err) {
      console.error('Error logging session:', err);
    }
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

      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication: editForm.medication || null,
          selected_dose: editForm.selectedDose || null,
          frequency: editForm.frequency || null,
          start_date: dateOrNull(editForm.startDate),
          end_date: dateOrNull(editForm.endDate),
          status: editForm.status,
          notes: editForm.notes || null,
          sessions_used: editForm.sessionsUsed,
          // HRT vial-specific fields
          dose_per_injection: editForm.dosePerInjection ? parseFloat(editForm.dosePerInjection) : null,
          injections_per_week: editForm.injectionsPerWeek ? parseInt(editForm.injectionsPerWeek) : null,
          vial_size: editForm.vialSize ? parseFloat(editForm.vialSize) : null,
          supply_type: editForm.supplyType || null,
          last_refill_date: dateOrNull(editForm.lastRefillDate),
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
    { id: 'blood_draw_complete', label: 'Blood Draw Complete', color: '#f59e0b', icon: '🩸' },
    { id: 'results_received', label: 'Results Received', color: '#8b5cf6', icon: '📋' },
    { id: 'provider_reviewed', label: 'Provider Reviewed', color: '#10b981', icon: '👨‍⚕️' },
    { id: 'consult_scheduled', label: 'Consult Scheduled', color: '#6366f1', icon: '🗓️' },
    { id: 'consult_complete', label: 'Consult Complete', color: '#3b82f6', icon: '✅' }
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
                </div>
              </div>
            </div>
            <div className="header-actions">
              <div className="actions-primary">
                {patient.phone && <a href={`sms:${patient.phone}`} className="action-btn" title="Send text message">SMS</a>}
                {patient.phone && <a href={`tel:${patient.phone}`} className="action-btn" title="Call patient">Call</a>}
                {patient.email && <a href={`mailto:${patient.email}`} className="action-btn" title="Send email">Email</a>}
                {ghlLink && <a href={ghlLink} target="_blank" rel="noopener noreferrer" className="action-btn" title="Open in GoHighLevel">GHL</a>}
              </div>
              <div className="actions-cta">
                <button onClick={() => setShowBookingModal(true)} className="action-btn action-btn-primary">Book</button>
                <button onClick={() => setShowChargeModal(true)} className="action-btn action-btn-charge">Charge</button>
              </div>
              <button onClick={handleDeletePatient} className="action-btn action-btn-delete" title="Delete patient">Del</button>
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
                </div>
              )}
            </div>
          )}
        </header>

        {/* Pending Purchases Alert */}
        {pendingNotifications.length > 0 && (
          <section className="pending-section">
            <h2>Pending Purchases ({pendingNotifications.length})</h2>
            <div className="pending-list">
              {pendingNotifications.map(notif => (
                <div key={notif.id} className="pending-card">
                  <div className="pending-info">
                    <strong>{notif.product_name}</strong>
                    <span>${notif.amount_paid?.toFixed(2)} • {formatShortDate(notif.purchase_date)}</span>
                  </div>
                  <div className="pending-actions">
                    <button onClick={() => openAssignModal(notif)} className="btn-primary-sm">Assign Protocol</button>
                    <button onClick={() => handleDismissNotification(notif.id)} className="btn-secondary-sm">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pinned Note */}
        {pinnedNote && (
          <section style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
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
                maxHeight: 80,
                overflow: 'hidden',
              }}>
                {pinnedNote.body}
              </div>
            </div>
            <button
              onClick={() => handleTogglePin(pinnedNote.id, true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400e',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 6px',
                flexShrink: 0,
              }}
              title="Unpin note"
            >
              ✕
            </button>
          </section>
        )}

        {/* Tab Navigation */}
        <nav className="tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'protocols' ? 'active' : ''} onClick={() => setActiveTab('protocols')}>Protocols{stats.activeCount > 0 && <span className="tab-count">{stats.activeCount}</span>}</button>
          <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => { setActiveTab('timeline'); if (timeline.length === 0) fetchTimeline(); }}>Timeline</button>
          <button className={activeTab === 'labs' ? 'active' : ''} onClick={() => setActiveTab('labs')}>Labs</button>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>Visits{(appointments.length + serviceLogs.length) > 0 && <span className="tab-count">{appointments.length + serviceLogs.length}</span>}</button>
          <button className={activeTab === 'intakes' ? 'active' : ''} onClick={() => setActiveTab('intakes')}>Docs{(intakes.length + consents.length + medicalDocuments.length) > 0 && <span className="tab-count">{intakes.length + consents.length + medicalDocuments.length}</span>}</button>
          <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notes{notes.length > 0 && <span className="tab-count">{notes.length}</span>}</button>
          <button className={activeTab === 'symptoms' ? 'active' : ''} onClick={() => setActiveTab('symptoms')}>Symptoms{questionnaireResponses.length > 0 && <span className="tab-count">{questionnaireResponses.length}</span>}</button>
          <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>Payments</button>
          <button className={activeTab === 'communications' ? 'active' : ''} onClick={() => setActiveTab('communications')}>Comms</button>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Active Protocols Summary */}
              <section className="card">
                <div className="card-header">
                  <h3>Active Protocols</h3>
                  <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add</button>
                </div>

                {/* Recovery Peptide Cycle Tracker — uses actual protocol duration as source of truth */}
                {cycleInfo?.hasCycle && (() => {
                  const planned = cycleInfo.totalPlannedDays || cycleInfo.maxDays;
                  const used = cycleInfo.cycleDaysUsed;
                  const remaining = cycleInfo.daysRemaining;
                  const approachingMax = used > 60 || planned > 60;
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
                        <div key={protocol.id} className="protocol-row" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/protocols/${protocol.id}`)}>
                          <div className="protocol-main">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name" style={{ textDecoration: 'underline', textDecorationColor: '#d1d5db' }}>{protocol.program_name || protocol.medication}</span>
                            {protocol.selected_dose && <span className="protocol-dose">{protocol.selected_dose}</span>}
                          </div>
                          <div className="protocol-status">
                            <span className="status-text">{protocol.status_text}</span>
                            {protocol.total_sessions > 0 && protocol.sessions_remaining > 0 && (
                              <button
                                onClick={(e) => handleLogSession(protocol.id, e)}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >✓ Log</button>
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

              {/* Payment Renewal Alerts */}
              {(() => {
                const renewalProtocols = activeProtocols.filter(p => {
                  if (p.total_sessions > 0) {
                    const remaining = p.total_sessions - (p.sessions_used || 0);
                    return remaining <= 2;
                  }
                  if (p.days_remaining !== null && p.days_remaining !== undefined) {
                    return p.days_remaining <= 7;
                  }
                  return false;
                });
                if (renewalProtocols.length === 0) return null;
                return (
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {renewalProtocols.map(p => {
                      const sessionsUsed = p.sessions_used || 0;
                      const remaining = p.total_sessions ? (p.total_sessions - sessionsUsed) : p.days_remaining;
                      const isDue = p.total_sessions ? remaining <= 0 : (p.days_remaining !== null && p.days_remaining <= 0);
                      return (
                        <div key={p.id} style={{
                          padding: '10px 14px', borderRadius: '8px',
                          background: isDue ? '#fee2e2' : '#fef3c7',
                          border: `1px solid ${isDue ? '#fecaca' : '#fde68a'}`,
                          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
                        }}>
                          <span style={{ fontSize: '15px' }}>💰</span>
                          <span style={{ fontWeight: 600, color: isDue ? '#dc2626' : '#92400e' }}>
                            {isDue ? 'Payment Due' : 'Payment Upcoming'}
                          </span>
                          <span style={{ color: '#374151' }}>—</span>
                          <span style={{ color: '#374151' }}>{p.program_name}:</span>
                          <span style={{ fontWeight: 500, color: isDue ? '#dc2626' : '#92400e' }}>
                            {p.total_sessions ? `${sessionsUsed} of ${p.total_sessions} sessions used` : `${p.days_remaining}d left`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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

          {/* Protocols Tab */}
          {activeTab === 'protocols' && (
            <>
              <section className="card">
                <div className="card-header">
                  <h3>Active Protocols ({activeProtocols.length})</h3>
                  <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add Protocol</button>
                </div>
                {activeProtocols.length === 0 ? (
                  <div className="empty">No active protocols</div>
                ) : (
                  <div className="protocol-list">
                    {activeProtocols.map(protocol => {
                      const cat = getCategoryStyle(protocol.category);
                      const isExpanded = expandedProtocols[protocol.id];
                      const isWeightLoss = protocol.category === 'weight_loss';
                      const protocolLogs = isWeightLoss ? weightLossLogs.filter(l => !protocol.id || l) : [];
                      const chartData = protocolLogs.filter(l => l.weight).map(l => ({
                        date: new Date(l.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        weight: parseFloat(l.weight),
                        dose: l.dosage || ''
                      }));
                      const startingWeight = chartData.length > 0 ? chartData[0].weight : null;
                      const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : null;
                      const totalLoss = startingWeight && currentWeight ? (startingWeight - currentWeight).toFixed(1) : null;
                      const startingDose = protocolLogs.length > 0 ? protocolLogs[0].dosage : null;
                      const currentDose = protocolLogs.length > 0 ? protocolLogs[protocolLogs.length - 1].dosage : null;

                      return (
                        <div key={protocol.id} className="protocol-card">
                          <div className="protocol-card-header" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/protocols/${protocol.id}`)}>
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name" style={{ textDecoration: 'underline', textDecorationColor: '#d1d5db' }}>{protocol.program_name || protocol.medication}</span>
                            {protocol.delivery_method === 'in_clinic' && <span className="clinic-badge">In-Clinic</span>}
                          </div>
                          <div className="protocol-details">
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
                              {protocol.total_sessions > 0 && protocol.sessions_remaining > 0 && (
                                <button
                                  onClick={() => handleLogSession(protocol.id)}
                                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >✓ Log Session</button>
                              )}
                              {isWeightLoss && protocolLogs.length > 0 && (
                                <button
                                  onClick={() => setExpandedProtocols(prev => ({ ...prev, [protocol.id]: !prev[protocol.id] }))}
                                  className="btn-secondary-sm"
                                >{isExpanded ? 'Hide Progress' : 'View Progress'}</button>
                              )}
                              <button onClick={() => openEditModal(protocol)} className="btn-secondary-sm">Edit</button>
                            </div>
                          </div>

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
                          {isWeightLoss && isExpanded && protocolLogs.length > 0 && (
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
                                  <span className="wl-stat-value">{protocolLogs.length}{protocol.total_sessions ? ` of ${protocol.total_sessions}` : ''}</span>
                                </div>
                              </div>

                              {/* Weight Chart */}
                              {chartData.length >= 2 && (
                                <div className="wl-chart">
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

                              {/* Injection History Table */}
                              <div className="wl-history">
                                <table className="wl-table">
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Dose</th>
                                      <th>Weight</th>
                                      <th>Change</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {protocolLogs.flatMap((log, i) => {
                                      const rows = [];
                                      // Check for missed weeks between entries
                                      if (i > 0) {
                                        const prevDate = new Date(protocolLogs[i - 1].entry_date + 'T00:00:00');
                                        const curDate = new Date(log.entry_date + 'T00:00:00');
                                        const daysBetween = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
                                        const missedWeeks = Math.floor(daysBetween / 7) - 1;
                                        for (let m = 1; m <= missedWeeks; m++) {
                                          const missedDate = new Date(prevDate);
                                          missedDate.setDate(missedDate.getDate() + (m * 7));
                                          rows.push(
                                            <tr key={'missed-' + i + '-' + m} style={{ background: '#fef2f2' }}>
                                              <td style={{ color: '#dc2626' }}>{formatShortDate(missedDate.toISOString().split('T')[0])}</td>
                                              <td colSpan={3} style={{ color: '#dc2626', fontStyle: 'italic', textAlign: 'center' }}>Missed</td>
                                            </tr>
                                          );
                                        }
                                      }
                                      const prevWeight = i > 0 && protocolLogs[i - 1].weight ? parseFloat(protocolLogs[i - 1].weight) : null;
                                      const curWeight = log.weight ? parseFloat(log.weight) : null;
                                      const delta = prevWeight && curWeight ? (curWeight - prevWeight).toFixed(1) : null;
                                      rows.push(
                                        <tr key={log.entry_date + i}>
                                          <td>{formatShortDate(log.entry_date)}</td>
                                          <td>{log.dosage || '—'}</td>
                                          <td>{log.weight ? `${log.weight} lbs` : '—'}</td>
                                          <td style={{ color: delta && parseFloat(delta) < 0 ? '#16a34a' : delta && parseFloat(delta) > 0 ? '#dc2626' : '#666' }}>
                                            {delta ? (parseFloat(delta) > 0 ? `+${delta}` : delta) + ' lbs' : i === 0 ? '—' : '—'}
                                          </td>
                                        </tr>
                                      );
                                      return rows;
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="card-header">
                  <h3>Completed Protocols ({completedProtocols.length})</h3>
                </div>
                {completedProtocols.length === 0 ? (
                  <div className="empty">No completed protocols</div>
                ) : (
                  <div className="protocol-list">
                    {completedProtocols.map(protocol => {
                      const cat = getCategoryStyle(protocol.category);
                      return (
                        <div key={protocol.id} className="protocol-card completed">
                          <div className="protocol-card-header" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/protocols/${protocol.id}`)}>
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name" style={{ textDecoration: 'underline', textDecorationColor: '#d1d5db' }}>{protocol.program_name || protocol.medication}</span>
                          </div>
                          <div className="protocol-dates">{formatShortDate(protocol.start_date)} → {formatShortDate(protocol.end_date)}</div>
                          <div className="protocol-footer">
                            <span className="status-complete">✓ Complete</span>
                            <button onClick={() => openEditModal(protocol)} className="btn-text">View</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Labs Tab */}
          {activeTab === 'labs' && (
            <>
              {/* Lab Pipeline Status */}
              {labProtocols.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h3>Lab Pipeline</h3>
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    {labProtocols.filter(lp => lp.status !== 'consult_complete').map(lp => {
                      const stage = LAB_STAGES.find(s => s.id === lp.status) || LAB_STAGES[0];
                      const stageIdx = LAB_STAGES.findIndex(s => s.id === lp.status);
                      const nextStage = stageIdx < LAB_STAGES.length - 1 ? LAB_STAGES[stageIdx + 1] : null;
                      const panelType = lp.medication || 'Essential';
                      const labType = lp.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
                      const panelColor = panelType === 'Elite' ? { bg: '#fdf2f8', text: '#9d174d' } : { bg: '#f0f9ff', text: '#0369a1' };
                      const drawDateObj2 = lp.start_date ? new Date(lp.start_date + 'T12:00:00') : null;
                      const drawDate = drawDateObj2 ? drawDateObj2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(drawDateObj2.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '-';
                      return (
                        <div key={lp.id} style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb',
                          marginBottom: '10px',
                          background: '#fff'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '4px 10px', borderRadius: '6px',
                              backgroundColor: stage.color, color: '#fff',
                              fontSize: '12px', fontWeight: '600'
                            }}>
                              {stage.icon} {stage.label}
                            </span>
                            <span style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                              backgroundColor: panelColor.bg, color: panelColor.text, fontWeight: '600'
                            }}>{panelType}</span>
                            <span style={{
                              fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                              backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '500'
                            }}>{labType}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Draw: {drawDate}</span>
                          </div>
                          {lp.notes && (
                            <div style={{
                              padding: '4px 8px', backgroundColor: '#fef3c7', borderRadius: '4px',
                              fontSize: '11px', color: '#92400e', fontStyle: 'italic', marginBottom: '8px'
                            }}>{lp.notes}</div>
                          )}
                          {/* Stage progress bar */}
                          <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                            {LAB_STAGES.map((s, i) => (
                              <div key={s.id} style={{
                                flex: 1, height: '4px', borderRadius: '2px',
                                backgroundColor: i <= stageIdx ? stage.color : '#e5e7eb'
                              }} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {nextStage && (
                              <button
                                onClick={() => handleLabStageAdvance(lp.id, nextStage.id)}
                                style={{
                                  flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                                  backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer',
                                  fontWeight: '500', fontSize: '12px'
                                }}
                              >
                                → {nextStage.label}
                              </button>
                            )}
                            <select
                              onChange={(e) => { if (e.target.value) { handleLabStageAdvance(lp.id, e.target.value); e.target.value = ''; } }}
                              defaultValue=""
                              style={{
                                padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
                                backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', color: '#6b7280'
                              }}
                            >
                              <option value="" disabled>Move to...</option>
                              {LAB_STAGES.filter(s => s.id !== lp.status).map(s => (
                                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                    {/* Completed labs */}
                    {labProtocols.filter(lp => lp.status === 'consult_complete').length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px' }}>
                          Completed ({labProtocols.filter(lp => lp.status === 'consult_complete').length})
                        </div>
                        {labProtocols.filter(lp => lp.status === 'consult_complete').map(lp => {
                          const panelType = lp.medication || 'Essential';
                          const labType = lp.delivery_method === 'follow_up' ? 'Follow-up' : 'New Patient';
                          const drawDateObj3 = lp.start_date ? new Date(lp.start_date + 'T12:00:00') : null;
                          const drawDate = drawDateObj3 ? drawDateObj3.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(drawDateObj3.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '-';
                          return (
                            <div key={lp.id} style={{
                              padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
                              marginBottom: '6px', background: '#f9fafb', opacity: 0.7
                            }}>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                ✅ {panelType} • {labType} • Draw: {drawDate}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="card">
                <div className="card-header">
                  <h3>Lab Documents</h3>
                  <button onClick={() => setShowUploadModal(true)} className="btn-primary-sm">+ Upload PDF</button>
                </div>
                {loadingDocs ? (
                  <div className="empty">Loading documents...</div>
                ) : labDocuments.length === 0 ? (
                  <div className="empty">No lab documents uploaded yet</div>
                ) : (
                  <div className="doc-list">
                    {labDocuments.map(doc => (
                      <div key={doc.id} className="doc-row">
                        <span className="doc-icon">📄</span>
                        <div className="doc-info">
                          <strong>{doc.file_name}</strong>
                          <span>{doc.lab_type || 'Lab'} • {doc.panel_type} • {formatShortDate(doc.collection_date)}</span>
                        </div>
                        <div className="doc-actions">
                          {doc.url && <button onClick={() => openPdfViewer(doc.url, doc.file_name || 'Lab Document')} className="btn-secondary-sm">View</button>}
                          <button onClick={() => handleDeleteDocument(doc.id)} className="btn-text danger">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <LabDashboard
                patientId={patient.id}
                patientGender={patient.gender || intakeDemographics?.gender}
                embedded={true}
              />
            </>
          )}

          {/* Documents Tab (Intakes + Consents) */}
          {activeTab === 'intakes' && (
            <>
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
                          <span className="apt-status" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                            {displayStatus.replace('_', ' ')}
                          </span>
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
                  <h3>Clinical Notes ({notes.length})</h3>
                  <button className="btn-primary-sm" onClick={() => setShowAddNoteModal(true)}>+ Add Note</button>
                </div>
                {notes.length === 0 ? (
                  <div className="empty">No clinical notes yet</div>
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
                              background: note.source === 'manual' ? '#dbeafe' : '#f3f4f6',
                              color: note.source === 'manual' ? '#1e40af' : '#6b7280',
                            }}>
                              {note.source === 'manual' ? 'Staff Note' : 'GHL Import'}
                            </span>
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
                            {note.source === 'manual' && (
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
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'invoices', label: 'Invoices' },
                  { key: 'purchases', label: 'Purchases' },
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
                              background: purchase.protocol_assigned ? '#dcfce7' : '#fef3c7',
                              color: purchase.protocol_assigned ? '#166534' : '#92400e'
                            }}>
                              {purchase.protocol_assigned ? 'assigned' : 'pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

            </>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <ConversationView
              patientId={id}
              patientName={patient?.name || patient?.full_name}
              patientPhone={patient?.phone}
              ghlContactId={patient?.ghl_contact_id}
            />
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
              <div className="modal-footer">
                <button onClick={() => setShowEditPurchaseModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleEditPurchase} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNoteModal && (
          <div className="modal-overlay" onClick={() => { setShowAddNoteModal(false); stopDictation(); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h3>Add Clinical Note</h3>
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

                {/* Frequency - Full options from config */}
                <div className="form-group">
                  <label>Frequency</label>
                  <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                    <option value="">Select...</option>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* HRT Vial Tracking Fields - show for HRT protocols */}
                {selectedProtocol.category === 'hrt' && (
                  <>
                    <div className="form-section-label">HRT Supply Tracking</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Dose per Injection (ml)</label>
                        <select value={editForm.dosePerInjection} onChange={e => setEditForm({...editForm, dosePerInjection: e.target.value})}>
                          <option value="">Select...</option>
                          {TESTOSTERONE_DOSES.male.map(d => (
                            <option key={d.value} value={d.value.split('/')[0]}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Injections/Week</label>
                        <select value={editForm.injectionsPerWeek} onChange={e => setEditForm({...editForm, injectionsPerWeek: e.target.value})}>
                          <option value="1">1x per week</option>
                          <option value="2">2x per week</option>
                          <option value="7">7x per week (daily)</option>
                        </select>
                      </div>
                    </div>
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
              <div className="modal-footer">
                <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleEditProtocol} className="btn-primary">Save Changes</button>
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

        {/* Appointment Edit Modal */}
        {editingAppointment && (
          <div className="modal-overlay" onClick={() => setEditingAppointment(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3>Edit Appointment</h3>
                <button onClick={() => setEditingAppointment(null)} className="close-btn">&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 6, fontSize: 13, color: '#6b7280' }}>
                  <strong style={{ color: '#111827' }}>{editingAppointment.calendar_name || 'Appointment'}</strong>
                  {' — '}
                  {new Date(editingAppointment.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                  {' at '}
                  {new Date(editingAppointment.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })}
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={aptEditStatus} onChange={e => setAptEditStatus(e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="showed">Showed</option>
                    <option value="completed">Completed</option>
                    <option value="no_show">No Show</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category / Label</label>
                  <input
                    type="text"
                    value={aptEditCategory}
                    onChange={e => setAptEditCategory(e.target.value)}
                    placeholder="e.g. IV Therapy, Follow-up, Consultation"
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={aptEditNotes}
                    onChange={e => setAptEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingAppointment(null)} className="btn-secondary">Cancel</button>
                <button
                  disabled={savingApt}
                  className="btn-primary"
                  onClick={async () => {
                    setSavingApt(true);
                    try {
                      const table = editingAppointment._table || 'clinic_appointments';
                      const res = await fetch('/api/appointments/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: editingAppointment.id,
                          table,
                          status: aptEditStatus,
                          notes: aptEditNotes,
                          category: aptEditCategory
                        })
                      });
                      if (res.ok) {
                        fetchPatient();
                        setEditingAppointment(null);
                      } else {
                        const err = await res.json();
                        alert('Error saving: ' + (err.error || 'Unknown error'));
                      }
                    } catch (err) {
                      alert('Error saving appointment');
                    } finally {
                      setSavingApt(false);
                    }
                  }}
                >
                  {savingApt ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
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
        .header-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }
        .actions-primary {
          display: flex;
          gap: 2px;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 2px;
        }
        .actions-cta {
          display: flex;
          gap: 4px;
        }
        .action-btn {
          font-size: 12px;
          color: #374151;
          text-decoration: none;
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
          line-height: 1;
          transition: background 0.15s;
        }
        .action-btn:hover { background: #e5e7eb; }
        .action-btn-primary {
          background: #2563eb;
          color: #fff;
        }
        .action-btn-primary:hover { background: #1d4ed8; }
        .action-btn-charge {
          background: #16a34a;
          color: #fff;
        }
        .action-btn-charge:hover { background: #15803d; }
        .action-btn-delete {
          color: #9ca3af;
          padding: 6px 8px;
        }
        .action-btn-delete:hover { color: #dc2626; background: #fef2f2; }
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

        /* Tabs */
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tabs button {
          padding: 10px 14px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 500;
          color: #9ca3af;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tabs button:hover { color: #374151; }
        .tabs button.active {
          color: #111;
          border-bottom-color: #2563eb;
          font-weight: 600;
        }
        .tab-count {
          font-size: 10px;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
          padding: 1px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          line-height: 1.4;
        }
        .tabs button.active .tab-count {
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

        /* Responsive: Tablet */
        @media (max-width: 768px) {
          .patient-profile { padding: 16px; }
          .header-top { flex-direction: column; gap: 12px; }
          .header-left { width: 100%; }
          .header-identity h1 { font-size: 22px; }
          .header-actions { width: 100%; flex-wrap: wrap; }
          .actions-primary { flex: 1; justify-content: center; }
          .actions-cta { flex: 1; justify-content: center; }
          .demographics-grid { grid-template-columns: repeat(2, 1fr); }
          .demographics-edit-grid { grid-template-columns: repeat(2, 1fr); }
          .demographics-preview { gap: 8px; font-size: 11px; }
          .tabs button { padding: 10px 12px; font-size: 12px; }
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
          .header-actions { gap: 4px; }
          .actions-primary { gap: 0; padding: 1px; }
          .action-btn { padding: 5px 8px; font-size: 11px; }
          .action-btn-delete { padding: 5px 6px; }
          .demographics-grid { grid-template-columns: 1fr; gap: 10px; }
          .demographics-edit-grid { grid-template-columns: 1fr; }
          .demographics-preview { flex-direction: column; gap: 2px; }
          .demographics-preview span + span::before { display: none; }
          .tabs button { padding: 8px 10px; font-size: 12px; }
          .tab-count { font-size: 9px; padding: 1px 5px; }
          .card-header { padding: 12px 14px; }
          .pending-actions { width: 100%; }
          .pending-actions button { flex: 1; }
          .modal { max-width: 100% !important; border-radius: 16px 16px 0 0; width: 100%; }
          .wl-table { font-size: 12px; }
          .wl-table th, .wl-table td { padding: 6px 8px; }
        }
      `}</style>
    </AdminLayout>
  );
}
