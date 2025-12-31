// /pages/patients/[id].js
// Patient Profile Page - Range Assessment System

import { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({});
  
  const [templates, setTemplates] = useState({ grouped: {} });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    selectedDose: '',
    vialDuration: ''
  });
  
  const [showLabsModal, setShowLabsModal] = useState(false);
  const [labForm, setLabForm] = useState({
    labType: 'Baseline',
    labPanel: 'Elite',
    completedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [sendingSymptoms, setSendingSymptoms] = useState(false);
  const [showViewLabsModal, setShowViewLabsModal] = useState(false);
  
  // Peptide selection
  const [peptides, setPeptides] = useState({ grouped: {} });
  const [selectedPeptide, setSelectedPeptide] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPatientProfile();
      fetchTemplates();
      fetchPeptides();
    }
  }, [id]);

  async function fetchPatientProfile() {
    try {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      
      if (res.ok) {
        setPatient(data.patient);
        setActiveProtocols(data.activeProtocols);
        setCompletedProtocols(data.completedProtocols);
        setPendingNotifications(data.pendingNotifications);
        setBaselineSymptoms(data.baselineSymptoms);
        setLatestLabs(data.latestLabs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/protocols/templates');
      const data = await res.json();
      if (res.ok) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }

  async function fetchPeptides() {
    try {
      const res = await fetch('/api/peptides');
      const data = await res.json();
      if (res.ok) {
        setPeptides(data);
      }
    } catch (error) {
      console.error('Error fetching peptides:', error);
    }
  }

  async function handleAssignProtocol() {
    try {
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          templateId: assignForm.templateId,
          notificationId: selectedNotification?.id,
          purchaseId: selectedNotification?.purchase_id,
          startDate: assignForm.startDate,
          notes: assignForm.notes || null,
          peptideId: selectedPeptide?.id || null,
          selectedDose: assignForm.selectedDose || null,
          vialDuration: assignForm.vialDuration ? parseInt(assignForm.vialDuration) : null
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowAssignModal(false);
        setSelectedNotification(null);
        setSelectedPeptide(null);
        setAssignForm({
          templateId: '',
          startDate: new Date().toISOString().split('T')[0],
          notes: '',
          selectedDose: '',
          vialDuration: ''
        });
        fetchPatientProfile();
      } else {
        alert('Error: ' + (data.error || 'Failed to assign protocol'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleDismissNotification(notificationId) {
    if (!confirm('Dismiss this notification? The purchase will still be recorded.')) return;
    
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      fetchPatientProfile();
    } catch (error) {
      console.error('Error dismissing:', error);
    }
  }

  async function handleAddLab() {
    try {
      const res = await fetch(`/api/patients/${id}/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labType: labForm.labType,
          labPanel: labForm.labPanel,
          completedDate: labForm.completedDate,
          status: 'completed',
          notes: labForm.notes
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowLabsModal(false);
        setLabForm({
          labType: 'Baseline',
          labPanel: 'Elite',
          completedDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchPatientProfile();
      } else {
        alert('Error: ' + (data.error || 'Failed to add lab'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleSendSymptoms() {
    setSendingSymptoms(true);
    try {
      const res = await fetch(`/api/patients/${id}/send-symptoms`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.link) {
          const copyText = data.smsText || data.link;
          await navigator.clipboard.writeText(copyText);
          alert('Link copied to clipboard! Paste into your messaging app.');
        } else {
          alert('Symptoms questionnaire sent via SMS!');
        }
      } else {
        alert('Error: ' + (data.error || 'Failed to send'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSendingSymptoms(false);
    }
  }

  function copyQuestionnaireLink() {
    const link = `https://app.range-medical.com/symptom-questionnaire?email=${encodeURIComponent(patient?.email || '')}&name=${encodeURIComponent(patientName)}`;
    navigator.clipboard.writeText(link);
    alert('Link copied!');
  }

  function getSymptomLabel(key) {
    const labels = {
      overall_health: 'Overall Health',
      energy: 'Energy',
      fatigue: 'Fatigue',
      focus: 'Focus',
      memory: 'Memory',
      sleep_onset: 'Sleep Onset',
      sleep_quality: 'Sleep Quality',
      mood: 'Mood',
      stress: 'Stress',
      anxiety: 'Anxiety',
      weight_satisfaction: 'Weight Satisfaction',
      weight_loss_ease: 'Weight Loss Ease',
      cravings: 'Cravings',
      recovery: 'Recovery',
      pain: 'Pain',
      strength: 'Strength',
      libido: 'Libido',
      sexual_performance: 'Sexual Performance',
      goals: 'Goals'
    };
    return labels[key] || key;
  }

  function openAssignModal(notification = null) {
    setSelectedNotification(notification);
    setSelectedPeptide(null);
    setAssignForm({
      templateId: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      selectedDose: '',
      vialDuration: ''
    });
    setShowAssignModal(true);
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getDaysRemaining(endDate) {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  }

  function formatLabValue(value, decimals = 1) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      return decimals === 0 ? Math.round(value) : value.toFixed(decimals);
    }
    return value;
  }

  function getLabValueColor(value, low, high) {
    if (value === null || value === undefined) return '#666';
    if (value < low || value > high) return '#ef4444';
    return '#22c55e';
  }

  function getLabCategories() {
    if (!latestLabs) return [];
    
    const categories = [
      {
        name: 'Hormones',
        values: [
          { label: 'Total Testosterone', value: latestLabs.total_testosterone, unit: 'ng/dL', low: 300, high: 1000 },
          { label: 'Free Testosterone', value: latestLabs.free_testosterone, unit: 'pg/mL', low: 5, high: 25 },
          { label: 'Estradiol', value: latestLabs.estradiol, unit: 'pg/mL', low: 10, high: 40 },
          { label: 'DHEA-S', value: latestLabs.dhea_s, unit: 'µg/dL', low: 100, high: 500 },
          { label: 'FSH', value: latestLabs.fsh, unit: 'mIU/mL', low: 1, high: 12 },
          { label: 'LH', value: latestLabs.lh, unit: 'mIU/mL', low: 1, high: 9 },
          { label: 'Progesterone', value: latestLabs.progesterone, unit: 'ng/mL', low: 0.2, high: 1.4 },
          { label: 'SHBG', value: latestLabs.shbg, unit: 'nmol/L', low: 16, high: 55 },
          { label: 'IGF-1', value: latestLabs.igf_1, unit: 'ng/mL', low: 100, high: 300 },
          { label: 'Cortisol', value: latestLabs.cortisol, unit: 'µg/dL', low: 5, high: 25 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Thyroid',
        values: [
          { label: 'TSH', value: latestLabs.tsh, unit: 'µIU/mL', low: 0.4, high: 4.0 },
          { label: 'Free T3', value: latestLabs.free_t3, unit: 'pg/mL', low: 2.3, high: 4.2 },
          { label: 'Free T4', value: latestLabs.free_t4, unit: 'ng/dL', low: 0.8, high: 1.8 },
          { label: 'TPO Antibody', value: latestLabs.tpo_antibody, unit: 'IU/mL', low: 0, high: 35 },
          { label: 'Thyroglobulin Ab', value: latestLabs.thyroglobulin_antibody, unit: 'IU/mL', low: 0, high: 40 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Metabolic',
        values: [
          { label: 'Glucose', value: latestLabs.glucose, unit: 'mg/dL', low: 70, high: 100, decimals: 0 },
          { label: 'HbA1c', value: latestLabs.hemoglobin_a1c, unit: '%', low: 4.0, high: 5.7 },
          { label: 'Fasting Insulin', value: latestLabs.fasting_insulin, unit: 'µU/mL', low: 2, high: 20 },
          { label: 'Uric Acid', value: latestLabs.uric_acid, unit: 'mg/dL', low: 3.5, high: 7.2 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Lipids',
        values: [
          { label: 'Total Cholesterol', value: latestLabs.total_cholesterol, unit: 'mg/dL', low: 125, high: 200, decimals: 0 },
          { label: 'LDL', value: latestLabs.ldl_cholesterol, unit: 'mg/dL', low: 0, high: 100, decimals: 0 },
          { label: 'HDL', value: latestLabs.hdl_cholesterol, unit: 'mg/dL', low: 40, high: 100, decimals: 0 },
          { label: 'Triglycerides', value: latestLabs.triglycerides, unit: 'mg/dL', low: 0, high: 150, decimals: 0 },
          { label: 'VLDL', value: latestLabs.vldl_cholesterol, unit: 'mg/dL', low: 0, high: 40, decimals: 0 },
          { label: 'Apo B', value: latestLabs.apolipoprotein_b, unit: 'mg/dL', low: 40, high: 100, decimals: 0 },
          { label: 'Apo A1', value: latestLabs.apolipoprotein_a1, unit: 'mg/dL', low: 120, high: 180, decimals: 0 },
          { label: 'Lp(a)', value: latestLabs.lp_a, unit: 'mg/dL', low: 0, high: 30 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Inflammation',
        values: [
          { label: 'CRP (hs)', value: latestLabs.crp_hs, unit: 'mg/L', low: 0, high: 1.0 },
          { label: 'Homocysteine', value: latestLabs.homocysteine, unit: 'µmol/L', low: 5, high: 15 },
          { label: 'ESR', value: latestLabs.esr, unit: 'mm/hr', low: 0, high: 15, decimals: 0 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Vitamins & Minerals',
        values: [
          { label: 'Vitamin D', value: latestLabs.vitamin_d, unit: 'ng/mL', low: 30, high: 80 },
          { label: 'Vitamin B12', value: latestLabs.vitamin_b12, unit: 'pg/mL', low: 200, high: 900, decimals: 0 },
          { label: 'Folate', value: latestLabs.folate, unit: 'ng/mL', low: 3, high: 17 },
          { label: 'Magnesium', value: latestLabs.magnesium, unit: 'mg/dL', low: 1.5, high: 2.5 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Iron Panel',
        values: [
          { label: 'Iron', value: latestLabs.iron, unit: 'µg/dL', low: 60, high: 170, decimals: 0 },
          { label: 'Ferritin', value: latestLabs.ferritin, unit: 'ng/mL', low: 30, high: 300, decimals: 0 },
          { label: 'TIBC', value: latestLabs.tibc, unit: 'µg/dL', low: 250, high: 400, decimals: 0 },
          { label: 'Iron Saturation', value: latestLabs.iron_saturation, unit: '%', low: 20, high: 50, decimals: 0 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Liver',
        values: [
          { label: 'AST', value: latestLabs.ast, unit: 'U/L', low: 10, high: 40, decimals: 0 },
          { label: 'ALT', value: latestLabs.alt, unit: 'U/L', low: 7, high: 56, decimals: 0 },
          { label: 'Alk Phos', value: latestLabs.alkaline_phosphatase, unit: 'U/L', low: 44, high: 147, decimals: 0 },
          { label: 'GGT', value: latestLabs.ggt, unit: 'U/L', low: 9, high: 48, decimals: 0 },
          { label: 'Bilirubin', value: latestLabs.total_bilirubin, unit: 'mg/dL', low: 0.1, high: 1.2 },
          { label: 'Albumin', value: latestLabs.albumin, unit: 'g/dL', low: 3.5, high: 5.5 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Kidney',
        values: [
          { label: 'BUN', value: latestLabs.bun, unit: 'mg/dL', low: 7, high: 25, decimals: 0 },
          { label: 'Creatinine', value: latestLabs.creatinine, unit: 'mg/dL', low: 0.6, high: 1.2 },
          { label: 'eGFR', value: latestLabs.egfr, unit: 'mL/min', low: 60, high: 120, decimals: 0 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'CBC',
        values: [
          { label: 'WBC', value: latestLabs.wbc, unit: '10³/µL', low: 4.5, high: 11.0 },
          { label: 'RBC', value: latestLabs.rbc, unit: '10⁶/µL', low: 4.5, high: 5.5 },
          { label: 'Hemoglobin', value: latestLabs.hemoglobin, unit: 'g/dL', low: 13, high: 17 },
          { label: 'Hematocrit', value: latestLabs.hematocrit, unit: '%', low: 38, high: 50 },
          { label: 'Platelets', value: latestLabs.platelets, unit: '10³/µL', low: 150, high: 400, decimals: 0 },
          { label: 'MCV', value: latestLabs.mcv, unit: 'fL', low: 80, high: 100 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
      {
        name: 'Prostate',
        values: [
          { label: 'PSA Total', value: latestLabs.psa_total, unit: 'ng/mL', low: 0, high: 4.0 },
          { label: 'PSA Free', value: latestLabs.psa_free, unit: 'ng/mL', low: 0, high: 1.0 },
        ].filter(v => v.value !== null && v.value !== undefined)
      },
    ];

    return categories.filter(cat => cat.values.length > 0);
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading patient profile...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Patient not found</div>
      </div>
    );
  }

  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown';

  return (
    <>
      <Head>
        <title>{patientName} | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => router.back()} style={styles.backButton}>
              ← Back
            </button>
            <h1 style={styles.patientName}>{patientName}</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.contactInfo}>
              {patient.email && <span>{patient.email}</span>}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        {pendingNotifications.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>⚠️ Needs Attention</h2>
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
                  <>
                    <span style={styles.checkmark}>✓</span>
                    {latestLabs.panel_type || latestLabs.lab_panel || 'Completed'} 
                    <span style={styles.assessmentDate}>({formatDate(latestLabs.test_date || latestLabs.completed_date)})</span>
                  </>
                ) : (
                  <span style={styles.pending}>Not completed</span>
                )}
              </div>
            </div>
            <div style={styles.assessmentCard}>
              <div style={styles.assessmentHeader}>
                <div style={styles.assessmentLabel}>Symptoms Questionnaire</div>
                <div style={styles.buttonGroup}>
                  {baselineSymptoms && (
                    <button 
                      onClick={() => setShowSymptomsModal(true)} 
                      style={styles.smallButton}
                    >
                      View
                    </button>
                  )}
                  <button 
                    onClick={handleSendSymptoms}
                    disabled={sendingSymptoms}
                    style={styles.smallButton}
                  >
                    {sendingSymptoms ? '...' : 'Send SMS'}
                  </button>
                  <button 
                    onClick={copyQuestionnaireLink}
                    style={styles.smallButton}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
              <div style={styles.assessmentValue}>
                {baselineSymptoms ? (
                  <>
                    <span style={styles.checkmark}>✓</span>
                    Completed
                    <span style={styles.assessmentDate}>({formatDate(baselineSymptoms.submitted_at)})</span>
                    {baselineSymptoms.overall_score && (
                      <span style={styles.scoreDisplay}>Avg: {baselineSymptoms.overall_score.toFixed(1)}/10</span>
                    )}
                  </>
                ) : (
                  <span style={styles.pending}>Not completed</span>
                )}
              </div>
            </div>
          </div>
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
              {activeProtocols.map(protocol => {
                const daysRemaining = getDaysRemaining(protocol.end_date);
                return (
                  <div key={protocol.id} style={styles.protocolCard}>
                    <div style={styles.protocolHeader}>
                      <div style={styles.protocolName}>{protocol.protocol_name}</div>
                      <div style={styles.protocolCategory}>{protocol.category}</div>
                    </div>
                    <div style={styles.protocolDetails}>
                      <div style={styles.protocolStat}>
                        <span style={styles.statLabel}>Started</span>
                        <span style={styles.statValue}>{formatDate(protocol.start_date)}</span>
                      </div>
                      {daysRemaining !== null && (
                        <div style={styles.protocolStat}>
                          <span style={styles.statLabel}>Days Left</span>
                          <span style={styles.statValue}>{daysRemaining}</span>
                        </div>
                      )}
                      {protocol.compliance_percent !== null && (
                        <div style={styles.protocolStat}>
                          <span style={styles.statLabel}>Compliance</span>
                          <span style={{
                            ...styles.statValue,
                            color: protocol.compliance_percent >= 80 ? '#22c55e' : 
                                   protocol.compliance_percent >= 50 ? '#f59e0b' : '#ef4444'
                          }}>
                            {protocol.compliance_percent}%
                          </span>
                        </div>
                      )}
                    </div>
                    {protocol.medication && (
                      <div style={styles.protocolMedication}>
                        {protocol.medication} {protocol.dose && `• ${protocol.dose}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Protocols */}
        {completedProtocols.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Completed Protocols</h2>
            </div>
            <div style={styles.completedList}>
              {completedProtocols.map(protocol => (
                <div key={protocol.id} style={styles.completedItem}>
                  <span style={styles.completedName}>{protocol.protocol_name}</span>
                  <span style={styles.completedDate}>{formatDate(protocol.end_date)}</span>
                  <span style={styles.completedCompliance}>
                    {protocol.compliance_percent}% ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Protocol Modal */}
        {showAssignModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  {selectedNotification ? 'Assign Protocol for Purchase' : 'Add New Protocol'}
                </h3>
                <button onClick={() => setShowAssignModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              {selectedNotification && (
                <div style={styles.purchaseInfo}>
                  <strong>{selectedNotification.product_name}</strong>
                  <span>${selectedNotification.amount_paid?.toFixed(2)}</span>
                </div>
              )}
              
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol Template *</label>
                  <select
                    value={assignForm.templateId}
                    onChange={e => {
                      setAssignForm({...assignForm, templateId: e.target.value, vialDuration: ''});
                      setSelectedPeptide(null);
                    }}
                    style={styles.select}
                  >
                    <option value="">Select a template...</option>
                    {Object.entries(templates.grouped || {}).map(([category, categoryTemplates]) => (
                      <optgroup key={category} label={category.toUpperCase()}>
                        {categoryTemplates.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.name.includes('Vial') ? '' : `(${t.duration_days} days)`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Show duration picker for Vial */}
                {assignForm.templateId && templates.grouped?.peptide?.find(t => t.id === assignForm.templateId)?.name?.includes('Vial') && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Vial Duration *</label>
                    <select
                      value={assignForm.vialDuration || ''}
                      onChange={e => setAssignForm({...assignForm, vialDuration: e.target.value})}
                      style={styles.select}
                    >
                      <option value="">Select duration...</option>
                      <option value="10">10 Days</option>
                      <option value="20">20 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                )}

                {/* Show peptide selector for peptide protocols */}
                {assignForm.templateId && templates.grouped?.peptide?.some(t => t.id === assignForm.templateId) && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Peptide *</label>
                      <select
                        value={selectedPeptide?.id || ''}
                        onChange={e => {
                          const peptide = peptides.peptides?.find(p => p.id === e.target.value);
                          setSelectedPeptide(peptide || null);
                          setAssignForm({...assignForm, selectedDose: ''});
                        }}
                        style={styles.select}
                      >
                        <option value="">Select a peptide...</option>
                        {Object.entries(peptides.grouped || {}).map(([category, categoryPeptides]) => (
                          <optgroup key={category} label={category}>
                            {categoryPeptides.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Show dose dropdown when peptide selected */}
                    {selectedPeptide && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Select Dose *</label>
                          <select
                            value={assignForm.selectedDose || ''}
                            onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}
                            style={styles.select}
                          >
                            <option value="">Select a dose...</option>
                            {selectedPeptide.dose_options?.map(dose => (
                              <option key={dose} value={dose}>
                                {dose}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.peptideInfo}>
                          <div style={styles.peptideInfoRow}>
                            <span style={styles.peptideInfoLabel}>Frequency:</span>
                            <span>{selectedPeptide.frequency}</span>
                          </div>
                          {selectedPeptide.notes && (
                            <div style={styles.peptideInfoRow}>
                              <span style={styles.peptideInfoLabel}>Notes:</span>
                              <span>{selectedPeptide.notes}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={assignForm.notes}
                    onChange={e => setAssignForm({...assignForm, notes: e.target.value})}
                    placeholder="Any special instructions..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowAssignModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button 
                  onClick={handleAssignProtocol}
                  disabled={
                    !assignForm.templateId || 
                    (templates.grouped?.peptide?.some(t => t.id === assignForm.templateId) && (!selectedPeptide || !assignForm.selectedDose)) ||
                    (templates.grouped?.peptide?.find(t => t.id === assignForm.templateId)?.name?.includes('Vial') && !assignForm.vialDuration)
                  }
                  style={{
                    ...styles.saveButton,
                    opacity: (
                      !assignForm.templateId || 
                      (templates.grouped?.peptide?.some(t => t.id === assignForm.templateId) && (!selectedPeptide || !assignForm.selectedDose)) ||
                      (templates.grouped?.peptide?.find(t => t.id === assignForm.templateId)?.name?.includes('Vial') && !assignForm.vialDuration)
                    ) ? 0.5 : 1
                  }}
                >
                  Assign Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lab Modal */}
        {showLabsModal && (
          <div style={styles.modalOverlay} onClick={() => setShowLabsModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Add Lab Results</h3>
                <button onClick={() => setShowLabsModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Lab Type</label>
                    <select
                      value={labForm.labType}
                      onChange={e => setLabForm({...labForm, labType: e.target.value})}
                      style={styles.select}
                    >
                      <option value="Baseline">Baseline</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Recheck">Recheck</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Panel</label>
                    <select
                      value={labForm.labPanel}
                      onChange={e => setLabForm({...labForm, labPanel: e.target.value})}
                      style={styles.select}
                    >
                      <option value="Elite">Elite</option>
                      <option value="Essential">Essential</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
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
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={labForm.notes}
                    onChange={e => setLabForm({...labForm, notes: e.target.value})}
                    placeholder="Any notes about this lab..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowLabsModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleAddLab} style={styles.saveButton}>
                  Add Lab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Symptoms Modal */}
        {showSymptomsModal && baselineSymptoms && (
          <div style={styles.modalOverlay} onClick={() => setShowSymptomsModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Symptoms Questionnaire</h3>
                <button onClick={() => setShowSymptomsModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.symptomsMeta}>
                  <span>Submitted: {formatDate(baselineSymptoms.submitted_at)}</span>
                  {baselineSymptoms.overall_score && (
                    <span style={styles.overallScore}>
                      Overall: {baselineSymptoms.overall_score.toFixed(1)}/10
                    </span>
                  )}
                </div>
                
                <div style={styles.symptomsGrid}>
                  {Object.entries(baselineSymptoms).map(([key, value]) => {
                    if (['id', 'patient_id', 'submitted_at', 'overall_score', 'goals', 'created_at', 'updated_at'].includes(key)) return null;
                    if (value === null) return null;
                    
                    const isNumeric = typeof value === 'number';
                    
                    return (
                      <div key={key} style={styles.symptomItem}>
                        <span style={styles.symptomLabel}>{getSymptomLabel(key)}</span>
                        {isNumeric ? (
                          <div style={styles.symptomScore}>
                            <div style={styles.scoreBar}>
                              <div style={{
                                ...styles.scoreBarFill,
                                width: `${(value / 10) * 100}%`,
                                background: value < 4 ? '#ef4444' : value < 7 ? '#f59e0b' : '#22c55e'
                              }} />
                            </div>
                            <span style={styles.scoreValue}>{value}/10</span>
                          </div>
                        ) : (
                          <span style={styles.symptomText}>{value}</span>
                        )}
                      </div>
                    );
                  })}
                  
                  {baselineSymptoms.goals && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={styles.symptomLabel}>Goals</div>
                      <p style={{ margin: '8px 0 0 0', color: '#666', lineHeight: '1.5' }}>
                        {baselineSymptoms.goals}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW LABS MODAL */}
        {showViewLabsModal && latestLabs && (
          <div style={styles.modalOverlay} onClick={() => setShowViewLabsModal(false)}>
            <div style={styles.labsModal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  Lab Results — {latestLabs.panel_type || 'Panel'} 
                  <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                    {formatDate(latestLabs.test_date || latestLabs.completed_date)}
                  </span>
                </h3>
                <button onClick={() => setShowViewLabsModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.labsModalBody}>
                {latestLabs.lab_provider && (
                  <div style={styles.labProviderBadge}>
                    Lab: {latestLabs.lab_provider}
                    {latestLabs.notes && ` • ${latestLabs.notes}`}
                  </div>
                )}
                
                <div style={styles.labCategoriesGrid}>
                  {getLabCategories().map(category => (
                    <div key={category.name} style={styles.labCategory}>
                      <h4 style={styles.labCategoryTitle}>{category.name}</h4>
                      <div style={styles.labValues}>
                        {category.values.map(lab => (
                          <div key={lab.label} style={styles.labRow}>
                            <span style={styles.labLabel}>{lab.label}</span>
                            <span style={{
                              ...styles.labValue,
                              color: getLabValueColor(lab.value, lab.low, lab.high)
                            }}>
                              {formatLabValue(lab.value, lab.decimals ?? 1)}
                              <span style={styles.labUnit}>{lab.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {getLabCategories().length === 0 && (
                  <div style={styles.emptyState}>
                    No detailed lab values available for this panel.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

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
    color: '#92400e'
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
    border: '1px solid #e5e7eb',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  assessmentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  assessmentCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  assessmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  assessmentLabel: {
    fontSize: '14px',
    color: '#666'
  },
  smallButton: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#333'
  },
  assessmentValue: {
    fontSize: '16px',
    fontWeight: '500'
  },
  assessmentDate: {
    fontSize: '14px',
    color: '#666',
    marginLeft: '8px'
  },
  checkmark: {
    color: '#22c55e',
    marginRight: '8px'
  },
  pending: {
    color: '#f59e0b'
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center',
    color: '#666',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  protocolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  protocolCard: {
    padding: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  protocolName: {
    fontSize: '16px',
    fontWeight: '600'
  },
  protocolCategory: {
    fontSize: '12px',
    color: '#666',
    background: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  protocolDetails: {
    display: 'flex',
    gap: '24px',
    marginBottom: '8px'
  },
  protocolStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600'
  },
  protocolMedication: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6'
  },
  completedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  completedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: '6px',
    fontSize: '14px'
  },
  completedName: {
    flex: 1
  },
  completedDate: {
    color: '#666',
    marginRight: '16px'
  },
  completedCompliance: {
    color: '#22c55e',
    fontWeight: '500'
  },
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
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  labsModal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1
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
    cursor: 'pointer',
    color: '#666'
  },
  purchaseInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#f3f4f6',
    fontSize: '14px'
  },
  modalBody: {
    padding: '24px'
  },
  labsModalBody: {
    padding: '24px'
  },
  labProviderBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#666',
    marginBottom: '20px'
  },
  labCategoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  labCategory: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb'
  },
  labCategoryTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
    fontSize: '14px'
  },
  labLabel: {
    color: '#666'
  },
  labValue: {
    fontWeight: '600',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  labUnit: {
    fontSize: '11px',
    fontWeight: 'normal',
    color: '#999'
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#fff'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    background: '#fff',
    color: '#333',
    border: '1px solid #e5e7eb',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  saveButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonGroup: {
    display: 'flex',
    gap: '6px'
  },
  scoreDisplay: {
    marginLeft: '12px',
    padding: '2px 8px',
    background: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#666'
  },
  symptomsMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#666'
  },
  overallScore: {
    fontWeight: '600',
    color: '#000'
  },
  symptomsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  symptomItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  symptomLabel: {
    fontSize: '14px',
    fontWeight: '500',
    flex: 1
  },
  symptomScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
  },
  scoreBar: {
    flex: 1,
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s'
  },
  scoreValue: {
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '40px',
    textAlign: 'right'
  },
  symptomText: {
    fontSize: '14px',
    color: '#666',
    flex: 1,
    textAlign: 'right'
  },
  peptideInfo: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px'
  },
  peptideInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    padding: '4px 0'
  },
  peptideInfoLabel: {
    color: '#166534',
    fontWeight: '500'
  }
};
