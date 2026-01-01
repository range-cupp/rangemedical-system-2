// /pages/patients/[id].js
// Patient Profile Page - Range Assessment System
// WITH Lab Documents PDF Upload Feature

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [baselineSymptoms, setBaselineSymptoms] = useState(null);
  const [latestLabs, setLatestLabs] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const [stats, setStats] = useState({});
  
  // Lab documents state
  const [labDocuments, setLabDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  const [templates, setTemplates] = useState({ grouped: {} });
  const [peptides, setPeptides] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [showLabsModal, setShowLabsModal] = useState(false);
  const [labForm, setLabForm] = useState({
    labType: 'Baseline',
    labPanel: 'Elite',
    completedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [showViewLabsModal, setShowViewLabsModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [sendingSymptoms, setSendingSymptoms] = useState(false);
  const [symptomsSent, setSymptomsSent] = useState(false);
  
  // Edit protocol state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [editForm, setEditForm] = useState({
    selectedDose: '',
    frequency: '',
    startDate: '',
    endDate: '',
    status: '',
    notes: ''
  });
  
  // Lab upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    panelType: 'Elite',
    collectionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Load patient data
  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchTemplates();
      fetchPeptides();
      fetchLabDocuments();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      
      if (data.patient) {
        setPatient(data.patient);
        setActiveProtocols(data.activeProtocols || []);
        setCompletedProtocols(data.completedProtocols || []);
        setPendingNotifications(data.pendingNotifications || []);
        setBaselineSymptoms(data.baselineSymptoms);
        setLatestLabs(data.latestLabs);
        setLabResults(data.labResults || []);
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
      if (data.grouped) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchPeptides = async () => {
    try {
      const res = await fetch('/api/peptides');
      const data = await res.json();
      if (data.peptides) {
        setPeptides(data.peptides);
      }
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
      if (data.documents) {
        setLabDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching lab documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Lab document handlers
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
    if (!uploadForm.file) {
      setUploadError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Convert file to base64
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

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh documents list
      await fetchLabDocuments();
      
      // Reset form and close modal
      setUploadForm({
        file: null,
        panelType: 'Elite',
        collectionDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const res = await fetch(`/api/patients/${id}/lab-documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (res.ok) {
        setLabDocuments(labDocuments.filter(d => d.id !== documentId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Protocol assignment handlers
  const openAssignModal = (notification = null) => {
    setSelectedNotification(notification);
    setAssignForm({
      templateId: '',
      peptideId: '',
      selectedDose: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAssignModal(true);
  };

  const handleAssignProtocol = async () => {
    try {
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: assignForm.selectedDose,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          purchaseId: selectedNotification?.id
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchPatient();
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
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

  const handleSendSymptoms = async () => {
    setSendingSymptoms(true);
    try {
      const res = await fetch('/api/symptoms/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          phone: patient?.phone,
          name: patient?.name
        })
      });
      
      if (res.ok) {
        setSymptomsSent(true);
        setTimeout(() => {
          setShowSymptomsModal(false);
          setSymptomsSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending symptoms:', error);
    } finally {
      setSendingSymptoms(false);
    }
  };

  const copySymptomLink = () => {
    const link = `https://app.range-medical.com/symptom-questionnaire?patient=${id}&name=${encodeURIComponent(patient?.name || '')}`;
    navigator.clipboard.writeText(link);
    alert('Link copied!');
  };

  const openEditModal = (protocol) => {
    setSelectedProtocol(protocol);
    setEditForm({
      selectedDose: protocol.selected_dose || '',
      frequency: protocol.frequency || '',
      startDate: protocol.start_date || '',
      endDate: protocol.end_date || '',
      status: protocol.status || 'active',
      notes: protocol.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditProtocol = async () => {
    try {
      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
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

  const getSelectedTemplate = () => {
    if (!assignForm.templateId) return null;
    for (const category of Object.values(templates.grouped || {})) {
      const found = category.find(t => t.id === assignForm.templateId);
      if (found) return found;
    }
    return null;
  };

  const getSelectedPeptide = () => {
    if (!assignForm.peptideId) return null;
    return peptides.find(p => p.id === assignForm.peptideId);
  };

  const isPeptideTemplate = () => {
    const template = getSelectedTemplate();
    return template?.name?.toLowerCase().includes('peptide');
  };

  // Lab results display helpers
  const getLabCategories = () => {
    if (!labResults || labResults.length === 0) return [];
    
    const categories = {
      'Hormones': ['testosterone_total', 'testosterone_free', 'estradiol', 'dhea_s', 'fsh', 'lh', 'igf_1', 'cortisol'],
      'Thyroid': ['tsh', 'free_t3', 'free_t4', 'tpo_antibodies', 'thyroglobulin_ab'],
      'Metabolic': ['glucose', 'hba1c', 'fasting_insulin', 'uric_acid'],
      'Lipids': ['total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'apo_b', 'lp_a'],
      'Inflammation': ['crp_hs', 'homocysteine', 'esr'],
      'Vitamins': ['vitamin_d', 'b12', 'folate', 'magnesium'],
      'Iron Panel': ['iron', 'ferritin', 'tibc', 'iron_saturation'],
      'Liver': ['ast', 'alt', 'alk_phos', 'ggt', 'bilirubin', 'albumin'],
      'Kidney': ['bun', 'creatinine', 'egfr'],
      'CBC': ['wbc', 'rbc', 'hemoglobin', 'hematocrit', 'platelets'],
      'Prostate': ['psa_total', 'psa_free']
    };

    const result = [];
    for (const [category, keys] of Object.entries(categories)) {
      const values = [];
      for (const key of keys) {
        const lab = labResults.find(l => l.test_name?.toLowerCase().replace(/[^a-z0-9]/g, '_') === key || l.test_code === key);
        if (lab && lab.result_value) {
          values.push(lab);
        }
      }
      if (values.length > 0) {
        result.push({ category, values });
      }
    }
    return result;
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!patient) {
    return <div style={styles.error}>Patient not found</div>;
  }

  return (
    <>
      <Head>
        <title>{patient.name} | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => router.back()} style={styles.backButton}>
              ← Back
            </button>
            <h1 style={styles.patientName}>{patient.name}</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.contactInfo}>
              {patient.email && <span>{patient.email}</span>}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
          </div>
        </div>

        {/* Pending Notifications */}
        {pendingNotifications.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                Pending Purchases ({pendingNotifications.length})
              </h2>
            </div>
            <div style={styles.notificationsList}>
              {pendingNotifications.map(notif => (
                <div key={notif.id} style={styles.notificationCard}>
                  <div style={styles.notificationInfo}>
                    <div style={styles.notificationProduct}>{notif.product_name}</div>
                    <div style={styles.notificationMeta}>
                      ${notif.amount_paid?.toFixed(2)} • {formatDate(notif.purchase_date)}
                    </div>
                  </div>
                  <div style={styles.notificationActions}>
                    <button 
                      onClick={() => openAssignModal(notif)}
                      style={styles.assignButton}
                    >
                      Assign Protocol
                    </button>
                    <button 
                      onClick={() => handleDismissNotification(notif.id)}
                      style={styles.dismissButton}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Range Assessment */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Range Assessment</h2>
          </div>
          <div style={styles.assessmentGrid}>
            {/* Baseline Labs Card */}
            <div style={styles.assessmentCard}>
              <div style={styles.assessmentHeader}>
                <div style={styles.assessmentLabel}>Baseline Labs</div>
                <div style={styles.buttonGroup}>
                  {latestLabs && (
                    <button 
                      onClick={() => setShowViewLabsModal(true)} 
                      style={styles.smallButton}
                    >
                      View
                    </button>
                  )}
                  <button onClick={() => setShowLabsModal(true)} style={styles.smallButton}>
                    + Add
                  </button>
                </div>
              </div>
              <div style={styles.assessmentValue}>
                {latestLabs ? (
                  <span style={styles.completedBadge}>
                    ✓ {latestLabs.lab_panel || 'Complete'} ({formatDate(latestLabs.completed_date || latestLabs.test_date)})
                  </span>
                ) : (
                  <span style={styles.pendingBadge}>Not completed</span>
                )}
              </div>
            </div>

            {/* Symptoms Card */}
            <div style={styles.assessmentCard}>
              <div style={styles.assessmentHeader}>
                <div style={styles.assessmentLabel}>Symptoms Questionnaire</div>
                <div style={styles.buttonGroup}>
                  <button onClick={() => setShowSymptomsModal(true)} style={styles.smallButton}>
                    Send SMS
                  </button>
                  <button onClick={copySymptomLink} style={styles.smallButton}>
                    Copy Link
                  </button>
                </div>
              </div>
              <div style={styles.assessmentValue}>
                {baselineSymptoms ? (
                  <span style={styles.completedBadge}>
                    ✓ Complete ({formatDate(baselineSymptoms.submitted_at)})
                  </span>
                ) : (
                  <span style={styles.pendingBadge}>Not completed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lab Documents Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Lab Documents</h2>
            <button 
              style={styles.addButton}
              onClick={() => setShowUploadModal(true)}
            >
              + Upload PDF
            </button>
          </div>
          
          {loadingDocs ? (
            <div style={styles.emptyState}>Loading documents...</div>
          ) : labDocuments.length === 0 ? (
            <div style={styles.emptyState}>
              No lab documents uploaded yet. Click "Upload PDF" to add lab results.
            </div>
          ) : (
            <div style={styles.documentList}>
              {labDocuments.map((doc) => (
                <div key={doc.id} style={styles.documentCard}>
                  <div style={styles.documentIcon}>📄</div>
                  <div style={styles.documentInfo}>
                    <div style={styles.documentName}>{doc.file_name}</div>
                    <div style={styles.documentMeta}>
                      {doc.panel_type && <span style={styles.docBadge}>{doc.panel_type}</span>}
                      <span>{formatDate(doc.collection_date)}</span>
                      <span style={styles.fileSize}>{formatFileSize(doc.file_size)}</span>
                    </div>
                    {doc.notes && <div style={styles.documentNotes}>{doc.notes}</div>}
                  </div>
                  <div style={styles.documentActions}>
                    {doc.url && (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.viewDocButton}
                      >
                        View
                      </a>
                    )}
                    <button 
                      onClick={() => handleDeleteDocument(doc.id)}
                      style={styles.deleteDocButton}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Protocols */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Active Protocols</h2>
            <button onClick={() => openAssignModal()} style={styles.addButton}>
              + Add Protocol
            </button>
          </div>
          {activeProtocols.length === 0 ? (
            <div style={styles.emptyState}>No active protocols</div>
          ) : (
            <div style={styles.protocolsList}>
              {activeProtocols.map(protocol => (
                <div key={protocol.id} style={styles.protocolCard}>
                  <div style={styles.protocolInfo}>
                    <div style={styles.protocolName}>{protocol.program_name || protocol.medication}</div>
                    <div style={styles.protocolMeta}>
                      {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                      {protocol.frequency && <span> • {protocol.frequency}</span>}
                    </div>
                    <div style={styles.protocolDates}>
                      Started {formatDate(protocol.start_date)}
                      {protocol.end_date && ` • Ends ${formatDate(protocol.end_date)}`}
                    </div>
                  </div>
                  <div style={styles.protocolActions}>
                    {protocol.days_remaining > 0 ? (
                      <span style={styles.daysRemaining}>{protocol.days_remaining} days left</span>
                    ) : (
                      <span style={styles.protocolComplete}>Complete</span>
                    )}
                    <button onClick={() => openEditModal(protocol)} style={styles.editProtocolButton}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Protocols */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Completed Protocols</h2>
          </div>
          {completedProtocols.length === 0 ? (
            <div style={styles.emptyState}>No completed protocols</div>
          ) : (
            <div style={styles.protocolsList}>
              {completedProtocols.map(protocol => (
                <div key={protocol.id} style={{...styles.protocolCard, background: '#f9fafb'}}>
                  <div style={styles.protocolInfo}>
                    <div style={styles.protocolName}>{protocol.program_name || protocol.medication}</div>
                    <div style={styles.protocolMeta}>
                      {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                      {protocol.frequency && <span> • {protocol.frequency}</span>}
                    </div>
                    <div style={styles.protocolDates}>
                      {formatDate(protocol.start_date)} → {formatDate(protocol.end_date)}
                    </div>
                  </div>
                  <div style={styles.protocolActions}>
                    <span style={styles.protocolComplete}>✓ Complete</span>
                    <button onClick={() => openEditModal(protocol)} style={styles.editProtocolButton}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Labs Modal */}
        {showLabsModal && (
          <div style={styles.modalOverlay} onClick={() => setShowLabsModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Add Lab Results</h3>
                <button onClick={() => setShowLabsModal(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lab Type</label>
                  <select 
                    value={labForm.labType} 
                    onChange={e => setLabForm({...labForm, labType: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Baseline">Baseline</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lab Panel</label>
                  <select 
                    value={labForm.labPanel} 
                    onChange={e => setLabForm({...labForm, labPanel: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Elite">Elite</option>
                    <option value="Essential">Essential</option>
                    <option value="Metabolic">Metabolic</option>
                    <option value="Hormone">Hormone</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Completed Date</label>
                  <input 
                    type="date" 
                    value={labForm.completedDate}
                    onChange={e => setLabForm({...labForm, completedDate: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea 
                    value={labForm.notes}
                    onChange={e => setLabForm({...labForm, notes: e.target.value})}
                    placeholder="Any notes..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowLabsModal(false)} style={styles.cancelButton}>Cancel</button>
                <button onClick={handleAddLabs} style={styles.submitButton}>Save Labs</button>
              </div>
            </div>
          </div>
        )}

        {/* View Labs Modal */}
        {showViewLabsModal && (
          <div style={styles.modalOverlay} onClick={() => setShowViewLabsModal(false)}>
            <div style={{...styles.modal, maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  Lab Results — {latestLabs?.lab_panel || 'Panel'} {formatDate(latestLabs?.completed_date || latestLabs?.test_date)}
                </h3>
                <button onClick={() => setShowViewLabsModal(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                {getLabCategories().length > 0 ? (
                  <div style={styles.labCategoriesGrid}>
                    {getLabCategories().map(cat => (
                      <div key={cat.category} style={styles.labCategory}>
                        <h4 style={styles.labCategoryTitle}>{cat.category}</h4>
                        <div style={styles.labValues}>
                          {cat.values.map(lab => (
                            <div key={lab.id} style={styles.labRow}>
                              <span style={styles.labName}>{lab.test_name}</span>
                              <span style={{
                                ...styles.labValue,
                                color: lab.flag === 'H' || lab.flag === 'L' ? '#dc2626' : '#059669'
                              }}>
                                {lab.result_value} {lab.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    No detailed lab values available for this panel.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Lab Document Modal */}
        {showUploadModal && (
          <div style={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Upload Lab PDF</h3>
                <button onClick={() => setShowUploadModal(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                {uploadError && <div style={styles.errorBox}>{uploadError}</div>}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>PDF File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    style={styles.fileInput}
                  />
                  {uploadForm.file && (
                    <div style={styles.selectedFile}>
                      Selected: {uploadForm.file.name}
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Panel Type</label>
                  <select
                    value={uploadForm.panelType}
                    onChange={(e) => setUploadForm({ ...uploadForm, panelType: e.target.value })}
                    style={styles.select}
                  >
                    <option value="Elite">Elite</option>
                    <option value="Essential">Essential</option>
                    <option value="Metabolic">Metabolic</option>
                    <option value="Hormone">Hormone</option>
                    <option value="Thyroid">Thyroid</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Collection Date</label>
                  <input
                    type="date"
                    value={uploadForm.collectionDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, collectionDate: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    placeholder="Any notes about these lab results..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowUploadModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleUploadDocument}
                  disabled={uploading || !uploadForm.file}
                  style={styles.submitButton}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms Modal */}
        {showSymptomsModal && (
          <div style={styles.modalOverlay} onClick={() => setShowSymptomsModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Send Symptoms Questionnaire</h3>
                <button onClick={() => setShowSymptomsModal(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                {symptomsSent ? (
                  <div style={styles.successMessage}>
                    ✓ SMS sent successfully!
                  </div>
                ) : (
                  <>
                    <p>Send symptoms questionnaire link to:</p>
                    <p style={{fontWeight: '600'}}>{patient.phone || 'No phone number'}</p>
                  </>
                )}
              </div>
              {!symptomsSent && (
                <div style={styles.modalFooter}>
                  <button onClick={() => setShowSymptomsModal(false)} style={styles.cancelButton}>Cancel</button>
                  <button 
                    onClick={handleSendSymptoms}
                    disabled={sendingSymptoms || !patient.phone}
                    style={styles.submitButton}
                  >
                    {sendingSymptoms ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Protocol Modal */}
        {showEditModal && selectedProtocol && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Edit Protocol</h3>
                <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.editPreview}>
                  <strong>{selectedProtocol.program_name || selectedProtocol.medication}</strong>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Dose</label>
                  <input 
                    type="text"
                    value={editForm.selectedDose}
                    onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                    placeholder="e.g. 500mcg/500mcg"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Frequency</label>
                  <select 
                    value={editForm.frequency}
                    onChange={e => setEditForm({...editForm, frequency: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Select frequency...</option>
                    <option value="2x daily">2x daily</option>
                    <option value="Daily">Daily</option>
                    <option value="Every other day">Every other day</option>
                    <option value="2x weekly">2x weekly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="5 days on, 2 off">5 days on, 2 off</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input 
                      type="date"
                      value={editForm.startDate}
                      onChange={e => setEditForm({...editForm, startDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date</label>
                    <input 
                      type="date"
                      value={editForm.endDate}
                      onChange={e => setEditForm({...editForm, endDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select 
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                    style={styles.select}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea 
                    value={editForm.notes}
                    onChange={e => setEditForm({...editForm, notes: e.target.value})}
                    placeholder="Any notes..."
                    style={styles.textarea}
                    rows={2}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowEditModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleEditProtocol}
                  style={styles.submitButton}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Protocol Modal */}
        {showAssignModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Assign Protocol</h3>
                <button onClick={() => setShowAssignModal(false)} style={styles.closeButton}>×</button>
              </div>
              <div style={styles.modalBody}>
                {selectedNotification && (
                  <div style={styles.notificationPreview}>
                    <strong>{selectedNotification.product_name}</strong>
                    <span> • ${selectedNotification.amount_paid?.toFixed(2)}</span>
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol Template *</label>
                  <select 
                    value={assignForm.templateId}
                    onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}
                    style={styles.select}
                  >
                    <option value="">Select template...</option>
                    {Object.entries(templates.grouped || {}).map(([category, temps]) => (
                      <optgroup key={category} label={category}>
                        {temps.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {isPeptideTemplate() && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Peptide *</label>
                      <select 
                        value={assignForm.peptideId}
                        onChange={e => setAssignForm({...assignForm, peptideId: e.target.value, selectedDose: ''})}
                        style={styles.select}
                      >
                        <option value="">Select peptide...</option>
                        {peptides.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {getSelectedPeptide()?.dose_options?.length > 0 && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select Dose *</label>
                        <select 
                          value={assignForm.selectedDose}
                          onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}
                          style={styles.select}
                        >
                          <option value="">Select a dose...</option>
                          {getSelectedPeptide().dose_options.map(dose => (
                            <option key={dose} value={dose}>{dose}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Frequency</label>
                      <select 
                        value={assignForm.frequency}
                        onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}
                        style={styles.select}
                      >
                        <option value="">Select frequency...</option>
                        <option value="2x daily">2x daily</option>
                        <option value="Daily">Daily</option>
                        <option value="Every other day">Every other day</option>
                        <option value="2x weekly">2x weekly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="5 days on, 2 off">5 days on, 2 off</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input 
                    type="date"
                    value={assignForm.startDate}
                    onChange={e => setAssignForm({...assignForm, startDate: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea 
                    value={assignForm.notes}
                    onChange={e => setAssignForm({...assignForm, notes: e.target.value})}
                    placeholder="Any special instructions..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowAssignModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleAssignProtocol}
                  disabled={!assignForm.templateId}
                  style={styles.submitButton}
                >
                  Assign Protocol
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '48px',
    color: '#ef4444'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666'
  },
  patientName: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  headerRight: {
    textAlign: 'right'
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: '#666',
    fontSize: '14px'
  },
  section: {
    marginBottom: '32px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  addButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px',
    color: '#999',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  // Assessment styles
  assessmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  assessmentCard: {
    padding: '16px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  assessmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  assessmentLabel: {
    fontWeight: '600',
    fontSize: '14px'
  },
  assessmentValue: {
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  smallButton: {
    background: '#fff',
    border: '1px solid #d1d5db',
    padding: '4px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  completedBadge: {
    color: '#059669',
    fontWeight: '500'
  },
  pendingBadge: {
    color: '#f59e0b'
  },
  // Document styles
  documentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  documentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  documentIcon: {
    fontSize: '24px'
  },
  documentInfo: {
    flex: 1
  },
  documentName: {
    fontWeight: '500',
    marginBottom: '4px'
  },
  documentMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#666'
  },
  docBadge: {
    background: '#e5e7eb',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  fileSize: {
    color: '#999'
  },
  documentNotes: {
    marginTop: '4px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },
  documentActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  viewDocButton: {
    background: '#fff',
    color: '#000',
    border: '1px solid #000',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none'
  },
  deleteDocButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  // Notification styles
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  notificationCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '8px',
    border: '1px solid #f59e0b'
  },
  notificationInfo: {
    flex: 1
  },
  notificationProduct: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  notificationMeta: {
    fontSize: '14px',
    color: '#666'
  },
  notificationActions: {
    display: 'flex',
    gap: '8px'
  },
  assignButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  dismissButton: {
    background: '#fff',
    color: '#666',
    border: '1px solid #d1d5db',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  // Protocol styles
  protocolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  protocolCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  protocolInfo: {
    flex: 1
  },
  protocolName: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  protocolMeta: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px'
  },
  protocolDates: {
    fontSize: '13px',
    color: '#999'
  },
  protocolStatus: {},
  protocolActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  editProtocolButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#666'
  },
  editPreview: {
    background: '#f9fafb',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  daysRemaining: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500'
  },
  protocolComplete: {
    color: '#059669',
    fontWeight: '500'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '20px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#fff'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '2px dashed #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  selectedFile: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#059669'
  },
  errorBox: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  cancelButton: {
    background: '#fff',
    color: '#000',
    border: '1px solid #d1d5db',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  successMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#059669',
    fontSize: '16px',
    fontWeight: '500'
  },
  notificationPreview: {
    background: '#f3f4f6',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  // Lab results modal styles
  labCategoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  labCategory: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '8px'
  },
  labCategoryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  },
  labValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  labRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px'
  },
  labName: {
    color: '#666'
  },
  labValue: {
    fontWeight: '600'
  }
};
