// /pages/patients/[id].js
// Unified Patient Profile Page - Range Medical
// Single source of truth for all patient data

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Category colors for protocols
const CATEGORY_COLORS = {
  hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
  weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
  peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
  iv: { bg: '#ffedd5', text: '#c2410c', label: 'IV' },
  hbot: { bg: '#e0e7ff', text: '#3730a3', label: 'HBOT' },
  rlt: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
  injection: { bg: '#fef3c7', text: '#92400e', label: 'Injection' },
  other: { bg: '#f3f4f6', text: '#374151', label: 'Other' }
};

const INJECTION_MEDICATIONS = [
  'Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3',
  'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'
];

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
  const [stats, setStats] = useState({});

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingDocs, setLoadingDocs] = useState(false);

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
    dosePerInjection: '', injectionsPerWeek: 2, vialSize: '', supplyType: '', lastRefillDate: ''
  });

  const [labForm, setLabForm] = useState({
    labType: 'Baseline', labPanel: 'Elite',
    completedDate: new Date().toISOString().split('T')[0], notes: ''
  });

  const [uploadForm, setUploadForm] = useState({
    file: null, panelType: 'Elite',
    collectionDate: new Date().toISOString().split('T')[0], notes: ''
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [sendingSymptoms, setSendingSymptoms] = useState(false);
  const [symptomsSent, setSymptomsSent] = useState(false);
  const fileInputRef = useRef(null);

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
        setStats(data.stats || {});
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
    setEditForm({
      medication: protocol.medication || '',
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
      supplyType: protocol.supply_type || '',
      lastRefillDate: protocol.last_refill_date || ''
    });
    setShowEditModal(true);
  };

  const handleEditProtocol = async () => {
    try {
      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication: editForm.medication,
          selected_dose: editForm.selectedDose,
          frequency: editForm.frequency,
          start_date: editForm.startDate,
          end_date: editForm.endDate,
          status: editForm.status,
          notes: editForm.notes,
          sessions_used: editForm.sessionsUsed,
          // HRT vial-specific fields
          dose_per_injection: editForm.dosePerInjection ? parseFloat(editForm.dosePerInjection) : null,
          injections_per_week: editForm.injectionsPerWeek ? parseInt(editForm.injectionsPerWeek) : null,
          vial_size: editForm.vialSize ? parseFloat(editForm.vialSize) : null,
          supply_type: editForm.supplyType,
          last_refill_date: editForm.lastRefillDate
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
          panelType: uploadForm.panelType,
          collectionDate: uploadForm.collectionDate,
          notes: uploadForm.notes
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      await fetchLabDocuments();
      setUploadForm({ file: null, panelType: 'Elite', collectionDate: new Date().toISOString().split('T')[0], notes: '' });
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
            {ghlLink && (
              <a href={ghlLink} target="_blank" rel="noopener noreferrer" className="ghl-link">
                Open in GHL ↗
              </a>
            )}
          </div>

          <div className="header-main">
            <h1>{getPatientDisplayName()}</h1>
            <div className="contact-row">
              {patient.email && <span>{patient.email}</span>}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
          </div>

          {/* Demographics */}
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
              <label>Location</label>
              <span>{patient.city && patient.state ? `${patient.city}, ${patient.state}` : '—'}</span>
            </div>
            <div className="demo-item">
              <label>Patient Since</label>
              <span>{patient.created_at ? formatDate(patient.created_at) : '—'}</span>
            </div>
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
          <button className={activeTab === 'labs' ? 'active' : ''} onClick={() => setActiveTab('labs')}>Labs</button>
          <button className={activeTab === 'intakes' ? 'active' : ''} onClick={() => setActiveTab('intakes')}>Documents ({intakes.length + consents.length})</button>
          <button className={activeTab === 'sessions' ? 'active' : ''} onClick={() => setActiveTab('sessions')}>Sessions ({sessions.length})</button>
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
                      return (
                        <div key={protocol.id} className="protocol-card">
                          <div className="protocol-card-header">
                            <span className="protocol-badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                            <span className="protocol-name">{protocol.program_name || protocol.medication}</span>
                          </div>
                          <div className="protocol-details">
                            {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                            {protocol.frequency && <span>{protocol.frequency}</span>}
                          </div>
                          <div className="protocol-dates">Started {formatShortDate(protocol.start_date)}{protocol.end_date && ` → ${formatShortDate(protocol.end_date)}`}</div>
                          <div className="protocol-footer">
                            <span className="status-badge">{protocol.status_text}</span>
                            <button onClick={() => openEditModal(protocol)} className="btn-secondary-sm">Edit</button>
                          </div>
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
                          <span>{doc.panel_type} • {formatShortDate(doc.collection_date)} • {formatFileSize(doc.file_size)}</span>
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

              <section className="card">
                <div className="card-header">
                  <h3>Lab Results</h3>
                  <button onClick={() => setShowLabsModal(true)} className="btn-primary-sm">+ Add Labs</button>
                </div>
                {labs.length === 0 ? (
                  <div className="empty">No lab results recorded</div>
                ) : (
                  <div className="lab-list">
                    {labs.map(lab => (
                      <div key={lab.id} className="lab-row">
                        <div className="lab-info">
                          <strong>{lab.lab_panel || 'Lab Panel'}</strong>
                          <span>{lab.lab_type} • {formatDate(lab.completed_date || lab.collection_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
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
                          <span>{intake.phone}</span>
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

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <section className="card">
              <div className="card-header">
                <h3>Sessions & Visits ({sessions.length})</h3>
              </div>
              {sessions.length === 0 ? (
                <div className="empty">No sessions recorded</div>
              ) : (
                <div className="session-list">
                  {sessions.map(session => (
                    <div key={session.id} className="session-row">
                      <div className="session-date">{formatShortDate(session.session_date)}</div>
                      <div className="session-info">
                        <strong>{session.protocols?.program_name || 'Session'}</strong>
                        {session.session_number && <span>Session #{session.session_number}</span>}
                      </div>
                      {session.notes && <div className="session-notes">{session.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
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
                        <option value="Daily">Daily</option>
                        <option value="Every other day">Every other day</option>
                        <option value="2x weekly">2x weekly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="As needed">As needed</option>
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
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Protocol</h3>
                <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="modal-preview">{selectedProtocol.program_name}</div>

                <div className="form-group">
                  <label>Dose</label>
                  <input type="text" value={editForm.selectedDose} onChange={e => setEditForm({...editForm, selectedDose: e.target.value})} placeholder="e.g., 0.4ml/80mg" />
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="Daily">Daily</option>
                    <option value="Every other day">Every other day</option>
                    <option value="2x weekly">2x weekly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                {/* HRT Vial Tracking Fields - show for HRT protocols */}
                {selectedProtocol.category === 'hrt' && (
                  <>
                    <div className="form-section-label">HRT Vial Tracking</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Dose per Injection (ml)</label>
                        <select value={editForm.dosePerInjection} onChange={e => setEditForm({...editForm, dosePerInjection: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="0.25">0.25ml (50mg)</option>
                          <option value="0.3">0.3ml (60mg)</option>
                          <option value="0.35">0.35ml (70mg)</option>
                          <option value="0.4">0.4ml (80mg)</option>
                          <option value="0.5">0.5ml (100mg)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Injections/Week</label>
                        <select value={editForm.injectionsPerWeek} onChange={e => setEditForm({...editForm, injectionsPerWeek: e.target.value})}>
                          <option value="1">1x per week</option>
                          <option value="2">2x per week</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Supply Type</label>
                        <select value={editForm.supplyType} onChange={e => setEditForm({...editForm, supplyType: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="vial_10ml">10ml Vial</option>
                          <option value="vial_5ml">5ml Vial</option>
                          <option value="prefill_2week">2-Week Prefilled</option>
                          <option value="prefill_4week">4-Week Prefilled</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Last Refill Date</label>
                        <input type="date" value={editForm.lastRefillDate} onChange={e => setEditForm({...editForm, lastRefillDate: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

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

                <div className="form-group">
                  <label>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

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
                <div className="form-group">
                  <label>Panel Type</label>
                  <select value={uploadForm.panelType} onChange={e => setUploadForm({...uploadForm, panelType: e.target.value})}>
                    <option value="Elite">Elite</option>
                    <option value="Essential">Essential</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Other">Other</option>
                  </select>
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
                    <p><strong>{patient.phone || 'No phone number'}</strong></p>
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
                  <div className="detail-row"><label>Phone</label><span>{selectedIntake.phone}</span></div>
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
        .ghl-link {
          font-size: 13px;
          color: #2563eb;
          text-decoration: none;
          padding: 6px 12px;
          border: 1px solid #2563eb;
          border-radius: 6px;
        }
        .ghl-link:hover { background: #eff6ff; }
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
        .demographics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
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
        .protocol-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
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
