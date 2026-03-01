// /pages/patients/[id].js
// Unified Patient Profile Page - Range Medical
// Single source of truth for all patient data

import { useState, useEffect, useRef } from 'react';
import { formatPhone } from '../../lib/format-utils';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

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
        setLabs(data.labs || []);
        setIntakes(data.intakes || []);
        setConsents(data.consents || []);
        setMedicalDocuments(data.medicalDocuments || []);
        setSessions(data.sessions || []);
        setSymptomResponses(data.symptomResponses || []);
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
              const schedule = getHRTLabSchedule(p.start_date);
              schedules[p.id] = matchDrawsToLogs(schedule, bloodDrawLogs, data.labs || []);
            } catch {
              const schedule = getHRTLabSchedule(p.start_date);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    if (patient?.first_name && patient?.last_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    return patient?.name || 'Unknown Patient';
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

  // Patient edit handlers
  const startEditingPatient = () => {
    setPatientEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
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
    setPdfSlideOut({ open: true, url, title });
  };

  const closePdfViewer = () => {
    setPdfSlideOut({ open: false, url: '', title: '' });
  };

  return (
    <>
      <Head>
        <title>{getPatientDisplayName()} | Range Medical</title>
      </Head>

      <div className="patient-profile">
        {/* Header */}
        <header className="profile-header">
          <div className="header-top">
            <button onClick={() => router.back()} className="back-btn">← Back</button>
            <div className="header-actions">
              {patient.phone && (
                <>
                  <a href={`sms:${patient.phone}`} className="action-btn">📱 Text</a>
                  <a href={`tel:${patient.phone}`} className="action-btn">📞 Call</a>
                </>
              )}
              {patient.email && (
                <a href={`mailto:${patient.email}`} className="action-btn">📧 Email</a>
              )}
              {ghlLink && (
                <a href={ghlLink} target="_blank" rel="noopener noreferrer" className="action-btn">🔗 Open GHL</a>
              )}
              <button onClick={() => setShowBookingModal(true)} className="action-btn action-btn-primary">📅 Book Appointment</button>
              <button onClick={() => setShowChargeModal(true)} className="action-btn action-btn-charge">💳 Charge</button>
            </div>
          </div>

          <div className="header-main">
            <h1>{getPatientDisplayName()}</h1>
            <div className="contact-row">
              {patient.email && <span>{patient.email}</span>}
              {patient.phone && <span>{formatPhone(patient.phone)}</span>}
            </div>
          </div>

          {/* Demographics */}
          <div className="demographics-section">
            <div className="demographics-header">
              {!editingPatient ? (
                <button onClick={startEditingPatient} className="edit-demographics-btn">✏️ Edit</button>
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

        {/* Tab Navigation */}
        <nav className="tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'protocols' ? 'active' : ''} onClick={() => setActiveTab('protocols')}>Protocols ({stats.activeCount})</button>
          <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => { setActiveTab('timeline'); if (timeline.length === 0) fetchTimeline(); }}>Timeline</button>
          <button className={activeTab === 'labs' ? 'active' : ''} onClick={() => setActiveTab('labs')}>Labs</button>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>Appointments ({appointments.length})</button>
          <button className={activeTab === 'intakes' ? 'active' : ''} onClick={() => setActiveTab('intakes')}>Documents ({intakes.length + consents.length})</button>
          <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>Payments</button>
          <button className={activeTab === 'communications' ? 'active' : ''} onClick={() => setActiveTab('communications')}>Communications</button>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Range Assessment Card */}
              <section className="card">
                <div className="card-header">
                  <h3>Range Assessment</h3>
                </div>
                <div className="assessment-grid">
                  <div className="assessment-item">
                    <div className="assessment-label">
                      <span>Baseline Labs</span>
                      <div className="btn-group">
                        <button onClick={() => setShowLabsModal(true)} className="btn-text">+ Add</button>
                      </div>
                    </div>
                    {hasBaselineLabs ? (
                      <span className="status-complete">
                        ✓ {latestLabs?.lab_panel || latestLabDoc?.panel_type || 'Complete'} ({formatShortDate(latestLabs?.completed_date || latestLabs?.collection_date || latestLabDoc?.collection_date)})
                      </span>
                    ) : (
                      <span className="status-pending">Not completed</span>
                    )}
                  </div>
                  <div className="assessment-item">
                    <div className="assessment-label">
                      <span>Symptoms Questionnaire</span>
                      <div className="btn-group">
                        <button onClick={() => setShowSymptomsModal(true)} className="btn-text">Send</button>
                        <button onClick={copySymptomLink} className="btn-text">Copy Link</button>
                      </div>
                    </div>
                    {baselineSymptoms ? (
                      <span className="status-complete">✓ Complete ({formatShortDate(baselineSymptoms.symptom_date)})</span>
                    ) : (
                      <span className="status-pending">Not completed</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Active Protocols Summary */}
              <section className="card">
                <div className="card-header">
                  <h3>Active Protocols</h3>
                  <button onClick={() => openAssignModal()} className="btn-primary-sm">+ Add</button>
                </div>
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
                            {protocol.selected_dose && <span className="protocol-dose">{protocol.selected_dose}</span>}
                          </div>
                          <div className="protocol-status">
                            <span className="status-text">{protocol.status_text}</span>
                            <button onClick={() => openEditModal(protocol)} className="btn-text">Edit</button>
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
                          <div className="protocol-card-header">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">{protocol.program_name || protocol.medication}</span>
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
                                    Lab Schedule: {completed} of {total} draws completed
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
                                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {schedule.map(draw => {
                                      const color = draw.status === 'completed' ? '#22c55e' : draw.status === 'overdue' ? '#dc2626' : '#9ca3af';
                                      return (
                                        <div key={draw.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
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
                          <div className="protocol-card-header">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">{protocol.program_name || protocol.medication}</span>
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
                    {consents.map(consent => (
                      <div key={consent.id} className="consent-card">
                        <div className="consent-header">
                          <span className="consent-icon">
                            {consent.consent_type === 'hipaa' ? '🔒' :
                             consent.consent_type === 'hrt' ? '💉' :
                             consent.consent_type === 'peptide' ? '🧬' :
                             consent.consent_type === 'weight-loss' ? '⚖️' :
                             consent.consent_type === 'iv' ? '💧' :
                             consent.consent_type === 'hbot' ? '🫁' :
                             consent.consent_type === 'blood-draw' ? '🩸' : '📝'}
                          </span>
                          <div>
                            <strong>{consent.consent_type ? consent.consent_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Consent'} Consent</strong>
                            <span className={`consent-status ${consent.consent_given ? 'signed' : 'pending'}`}>
                              {consent.consent_given ? '✓ Signed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        <div className="consent-details">
                          <span>{consent.first_name} {consent.last_name}</span>
                          <span>{formatDate(consent.consent_date || consent.submitted_at)}</span>
                        </div>
                        <div className="consent-actions">
                          {consent.pdf_url && <button onClick={() => openPdfViewer(consent.pdf_url, `${consent.consent_type || 'Consent'} Form`)} className="btn-secondary-sm">View PDF</button>}
                          {consent.signature_url && <button onClick={() => openPdfViewer(consent.signature_url, 'Signature')} className="btn-text">Signature</button>}
                        </div>
                      </div>
                    ))}
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
                      <div key={intake.id} className="intake-card" onClick={() => { setSelectedIntake(intake); setShowIntakeModal(true); }}>
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
                          {intake.pdf_url && <button onClick={e => { e.stopPropagation(); openPdfViewer(intake.pdf_url, 'Medical Intake'); }} className="btn-secondary-sm">View PDF</button>}
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

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <section className="card">
              <div className="card-header">
                <h3>Clinic Appointments ({appointments.length})</h3>
              </div>
              {appointments.length === 0 ? (
                <div className="empty">No appointments found</div>
              ) : (
                <div className="appointments-list">
                  {appointments.map(apt => {
                    const aptDate = new Date(apt.start_time);
                    const isPast = aptDate < new Date();
                    const isUpcoming = !isPast;
                    const status = (apt.status || 'scheduled').toLowerCase();
                    const statusColors = {
                      scheduled: { bg: '#fef3c7', text: '#92400e' },
                      confirmed: { bg: '#dbeafe', text: '#1e40af' },
                      showed: { bg: '#dcfce7', text: '#166534' },
                      completed: { bg: '#dcfce7', text: '#166534' },
                      no_show: { bg: '#fee2e2', text: '#dc2626' },
                      cancelled: { bg: '#f3f4f6', text: '#6b7280' }
                    };
                    const statusStyle = statusColors[status] || statusColors.scheduled;

                    return (
                      <div key={apt.id} className={`appointment-row ${isUpcoming ? 'upcoming' : 'past'}`}>
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
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
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

              <section className="card">
                <div className="card-header">
                  <h3>Purchases ({allPurchases.length})</h3>
                </div>
                {allPurchases.length === 0 ? (
                  <div className="empty">No purchases found</div>
                ) : (
                  <div className="payments-list">
                    {allPurchases.map(purchase => (
                      <div key={purchase.id} className="payment-row">
                        <div className="payment-info">
                          <strong>{purchase.product_name || 'Purchase'}</strong>
                          <span className="payment-date">{formatDate(purchase.purchased_at || purchase.created_at)}</span>
                        </div>
                        <div className="payment-amount">${(purchase.amount_paid || 0).toFixed(2)}</div>
                        <span className="payment-status" style={{
                          background: purchase.protocol_assigned ? '#dcfce7' : '#fef3c7',
                          color: purchase.protocol_assigned ? '#166534' : '#92400e'
                        }}>
                          {purchase.protocol_assigned ? 'assigned' : 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
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

        {/* PDF Slide-Out Viewer */}
        {pdfSlideOut.open && (
          <>
            <div className="slideout-overlay" onClick={closePdfViewer} />
            <div className="slideout-panel">
              <div className="slideout-header">
                <h3>{pdfSlideOut.title}</h3>
                <button onClick={closePdfViewer} className="close-btn">×</button>
              </div>
              <div className="slideout-content">
                <iframe
                  src={pdfSlideOut.url}
                  title={pdfSlideOut.title}
                  className="slideout-iframe"
                />
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
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 14px;
          color: #666;
          cursor: pointer;
        }
        .back-btn:hover { color: #000; }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .action-btn {
          font-size: 13px;
          color: #374151;
          text-decoration: none;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-weight: 500;
          white-space: nowrap;
        }
        .action-btn:hover { background: #f3f4f6; border-color: #9ca3af; }
        .action-btn-primary {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .action-btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
        .action-btn-charge {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }
        .action-btn-charge:hover { background: #15803d; border-color: #15803d; }
        .header-main h1 {
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        .contact-row {
          display: flex;
          gap: 16px;
          color: #666;
          font-size: 14px;
        }
        .demographics-section {
          margin-top: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
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
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0;
        }
        .tabs button {
          padding: 12px 20px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .tabs button:hover { color: #111; }
        .tabs button.active {
          color: #000;
          border-bottom-color: #000;
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
        .consent-list { padding: 16px; }
        .consent-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #fafafa;
        }
        .consent-header {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          align-items: flex-start;
        }
        .consent-icon { font-size: 20px; }
        .consent-header > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .consent-header strong { font-size: 15px; }
        .consent-status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }
        .consent-status.signed {
          background: #dcfce7;
          color: #166534;
        }
        .consent-status.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .consent-details {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }
        .consent-details span { margin-right: 16px; }
        .consent-actions { display: flex; gap: 8px; }

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
          width: 70%;
          max-width: 900px;
          min-width: 400px;
          background: #fff;
          box-shadow: -4px 0 20px rgba(0,0,0,0.15);
          z-index: 1101;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.25s ease-out;
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

        /* Responsive */
        @media (max-width: 768px) {
          .demographics-grid { grid-template-columns: repeat(2, 1fr); }
          .demographics-edit-grid { grid-template-columns: repeat(2, 1fr); }
          .tabs { overflow-x: auto; }
          .tabs button { padding: 12px 16px; white-space: nowrap; }
          .pending-card { flex-direction: column; gap: 12px; align-items: flex-start; }
          .protocol-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .intake-detail-grid { grid-template-columns: 1fr; }
          .slideout-panel { width: 100%; min-width: unset; }
        }
      `}</style>
    </>
  );
}
