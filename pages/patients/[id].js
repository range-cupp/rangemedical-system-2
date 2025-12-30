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
    customMedication: '',
    customDose: '',
    notes: ''
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

  useEffect(() => {
    if (id) {
      fetchPatientProfile();
      fetchTemplates();
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
          customMedication: assignForm.customMedication || null,
          customDose: assignForm.customDose || null,
          notes: assignForm.notes || null
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowAssignModal(false);
        setSelectedNotification(null);
        setAssignForm({
          templateId: '',
          startDate: new Date().toISOString().split('T')[0],
          customMedication: '',
          customDose: '',
          notes: ''
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
          // No GHL contact, show link to copy
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
                <button onClick={() => setShowLabsModal(true)} style={styles.smallButton}>
                  + Add
                </button>
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
                      {protocol.total_sessions && (
                        <div style={styles.protocolStat}>
                          <span style={styles.statLabel}>Sessions</span>
                          <span style={styles.statValue}>
                            {protocol.sessions_completed}/{protocol.total_sessions}
                          </span>
                        </div>
                      )}
                    </div>
                    {protocol.medication && (
                      <div style={styles.protocolMedication}>
                        {protocol.medication} {protocol.dose && `• ${protocol.dose}`} {protocol.frequency && `• ${protocol.frequency}`}
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
                    onChange={e => setAssignForm({...assignForm, templateId: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Select a template...</option>
                    
                    {templates.grouped?.peptide?.length > 0 && (
                      <optgroup label="Peptides">
                        {templates.grouped.peptide.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {templates.grouped?.weight_loss?.length > 0 && (
                      <optgroup label="Weight Loss">
                        {templates.grouped.weight_loss.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {templates.grouped?.hrt?.length > 0 && (
                      <optgroup label="HRT">
                        {templates.grouped.hrt.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                    
                    {templates.grouped?.therapy?.length > 0 && (
                      <optgroup label="Therapies">
                        {templates.grouped.therapy.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={e => setAssignForm({...assignForm, startDate: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Custom Medication (optional)</label>
                    <input
                      type="text"
                      value={assignForm.customMedication}
                      onChange={e => setAssignForm({...assignForm, customMedication: e.target.value})}
                      placeholder="Override template medication"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Custom Dose (optional)</label>
                    <input
                      type="text"
                      value={assignForm.customDose}
                      onChange={e => setAssignForm({...assignForm, customDose: e.target.value})}
                      placeholder="Override template dose"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea
                    value={assignForm.notes}
                    onChange={e => setAssignForm({...assignForm, notes: e.target.value})}
                    placeholder="Optional notes..."
                    style={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowAssignModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button 
                  onClick={handleAssignProtocol}
                  disabled={!assignForm.templateId}
                  style={{
                    ...styles.saveButton,
                    opacity: assignForm.templateId ? 1 : 0.5
                  }}
                >
                  Assign Protocol
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <option value="Elite">Elite Panel</option>
                    <option value="Essential">Essential Panel</option>
                    <option value="Metabolic">Metabolic Panel</option>
                    <option value="Hormone">Hormone Panel</option>
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
                    placeholder="Optional notes..."
                    style={styles.textarea}
                    rows={3}
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
    alignItems: 'flex-start',
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
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px'
  },
  patientName: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  headerRight: {},
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    color: '#666',
    textAlign: 'right'
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
    border: '1px solid #f59e0b',
    borderRadius: '8px'
  },
  notificationInfo: {},
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
    fontSize: '14px',
    fontWeight: '500'
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
    gridTemplateColumns: 'repeat(2, 1fr)',
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
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
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
  }
};
