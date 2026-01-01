// /pages/admin/pipeline.js
// Simple Pipeline - The Starting Point
// Range Medical

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Pipeline() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('needs-protocol');
  
  const [needsProtocol, setNeedsProtocol] = useState([]);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddCompletedModal, setShowAddCompletedModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const [templates, setTemplates] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [patients, setPatients] = useState([]);
  
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [completedForm, setCompletedForm] = useState({
    patientId: '',
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pipelineRes, templatesRes, peptidesRes, patientsRes] = await Promise.all([
        fetch('/api/admin/pipeline'),
        fetch('/api/protocols/templates'),
        fetch('/api/peptides'),
        fetch('/api/admin/patients?limit=500')
      ]);
      
      const pipelineData = await pipelineRes.json();
      const templatesData = await templatesRes.json();
      const peptidesData = await peptidesRes.json();
      const patientsData = await patientsRes.json();
      
      setNeedsProtocol(pipelineData.needsProtocol || []);
      setActiveProtocols(pipelineData.activeProtocols || []);
      setCompletedProtocols(pipelineData.completedProtocols || []);
      setTemplates(templatesData.templates || []);
      setPeptides(peptidesData.peptides || []);
      setPatients(patientsData.patients || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const openAssignModal = (purchase) => {
    setSelectedPurchase(purchase);
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
          patientId: selectedPurchase.patient_id,
          ghlContactId: selectedPurchase.ghl_contact_id,
          patientName: selectedPurchase.patient_name,
          purchaseId: selectedPurchase.id,
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: assignForm.selectedDose,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to assign protocol');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
    }
  };

  const handleAddCompleted = async () => {
    try {
      const res = await fetch('/api/protocols/add-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedForm)
      });

      if (res.ok) {
        setShowAddCompletedModal(false);
        setCompletedForm({
          patientId: '',
          templateId: '',
          peptideId: '',
          selectedDose: '',
          frequency: '',
          startDate: '',
          endDate: '',
          notes: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding completed protocol:', error);
    }
  };

  const handleDismiss = async (purchaseId) => {
    if (!confirm('Dismiss this purchase? It won\'t show in the pipeline anymore.')) return;
    
    try {
      await fetch(`/api/purchases/${purchaseId}/dismiss`, { method: 'POST' });
      setNeedsProtocol(needsProtocol.filter(p => p.id !== purchaseId));
    } catch (error) {
      console.error('Error dismissing:', error);
    }
  };

  const getSelectedTemplate = (form) => {
    return templates.find(t => t.id === form.templateId);
  };

  const getSelectedPeptide = (form) => {
    return peptides.find(p => p.id === form.peptideId);
  };

  const isPeptideTemplate = (form) => {
    const template = getSelectedTemplate(form);
    return template?.name?.toLowerCase().includes('peptide');
  };

  const counts = {
    needsProtocol: needsProtocol.length,
    active: activeProtocols.length,
    completed: completedProtocols.length
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading pipeline...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pipeline | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Pipeline</h1>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'needs-protocol' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('needs-protocol')}
          >
            Needs Protocol
            {counts.needsProtocol > 0 && (
              <span style={styles.badge}>{counts.needsProtocol}</span>
            )}
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'active' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span style={styles.badgeGreen}>{counts.active}</span>
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'completed' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('completed')}
          >
            Completed
            <span style={styles.badgeGray}>{counts.completed}</span>
          </button>
        </div>

        {/* Needs Protocol Tab */}
        {activeTab === 'needs-protocol' && (
          <div style={styles.section}>
            {needsProtocol.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✓</div>
                <div>All caught up! No purchases waiting for protocols.</div>
              </div>
            ) : (
              <div style={styles.list}>
                {needsProtocol.map(purchase => (
                  <div key={purchase.id} style={styles.card}>
                    <div style={styles.cardMain}>
                      <div style={styles.patientName}>{purchase.patient_name}</div>
                      <div style={styles.productName}>{purchase.product_name}</div>
                      <div style={styles.meta}>
                        ${purchase.amount_paid?.toFixed(2)} • {formatDate(purchase.purchase_date)}
                        {purchase.category && ` • ${purchase.category}`}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button 
                        onClick={() => openAssignModal(purchase)}
                        style={styles.primaryButton}
                      >
                        Start Protocol
                      </button>
                      <button 
                        onClick={() => handleDismiss(purchase.id)}
                        style={styles.dismissButton}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div style={styles.section}>
            {activeProtocols.length === 0 ? (
              <div style={styles.emptyState}>
                No active protocols
              </div>
            ) : (
              <div style={styles.list}>
                {activeProtocols.map(protocol => (
                  <div key={protocol.id} style={styles.card}>
                    <div style={styles.cardMain}>
                      <Link href={`/patients/${protocol.patient_id}`} style={styles.patientLink}>
                        {protocol.patient_name}
                      </Link>
                      <div style={styles.productName}>
                        {protocol.program_name || protocol.medication}
                        {protocol.selected_dose && ` • ${protocol.selected_dose}`}
                      </div>
                      <div style={styles.meta}>
                        Started {formatDate(protocol.start_date)}
                        {protocol.frequency && ` • ${protocol.frequency}`}
                      </div>
                    </div>
                    <div style={styles.cardStatus}>
                      {protocol.days_remaining > 0 ? (
                        <span style={styles.daysLeft}>{protocol.days_remaining} days left</span>
                      ) : (
                        <span style={styles.ending}>Ending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <button 
                onClick={() => setShowAddCompletedModal(true)}
                style={styles.secondaryButton}
              >
                + Add Historical Protocol
              </button>
            </div>
            
            {completedProtocols.length === 0 ? (
              <div style={styles.emptyState}>
                No completed protocols yet
              </div>
            ) : (
              <div style={styles.list}>
                {completedProtocols.map(protocol => (
                  <div key={protocol.id} style={{...styles.card, opacity: 0.8}}>
                    <div style={styles.cardMain}>
                      <Link href={`/patients/${protocol.patient_id}`} style={styles.patientLink}>
                        {protocol.patient_name}
                      </Link>
                      <div style={styles.productName}>
                        {protocol.program_name || protocol.medication}
                        {protocol.selected_dose && ` • ${protocol.selected_dose}`}
                      </div>
                      <div style={styles.meta}>
                        {formatDate(protocol.start_date)} → {formatDate(protocol.end_date)}
                      </div>
                    </div>
                    <div style={styles.cardStatus}>
                      <span style={styles.completed}>✓ Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assign Protocol Modal */}
        {showAssignModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Start Protocol</h3>
                <button onClick={() => setShowAssignModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.purchasePreview}>
                  <strong>{selectedPurchase?.patient_name}</strong>
                  <div>{selectedPurchase?.product_name}</div>
                  <div style={styles.meta}>${selectedPurchase?.amount_paid?.toFixed(2)} • {selectedPurchase?.category}</div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol Template *</label>
                  <select 
                    value={assignForm.templateId}
                    onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}
                    style={styles.select}
                  >
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {isPeptideTemplate(assignForm) && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Peptide *</label>
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

                    {getSelectedPeptide(assignForm)?.dose_options?.length > 0 && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dose *</label>
                        <select 
                          value={assignForm.selectedDose}
                          onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}
                          style={styles.select}
                        >
                          <option value="">Select dose...</option>
                          {getSelectedPeptide(assignForm).dose_options.map(dose => (
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
                    placeholder="Any notes..."
                    style={styles.textarea}
                    rows={2}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowAssignModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleAssignProtocol}
                  disabled={!assignForm.templateId}
                  style={styles.primaryButton}
                >
                  Start Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Completed Modal */}
        {showAddCompletedModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddCompletedModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Add Historical Protocol</h3>
                <button onClick={() => setShowAddCompletedModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient *</label>
                  <select 
                    value={completedForm.patientId}
                    onChange={e => setCompletedForm({...completedForm, patientId: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Select patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Protocol Template *</label>
                  <select 
                    value={completedForm.templateId}
                    onChange={e => setCompletedForm({...completedForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}
                    style={styles.select}
                  >
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {isPeptideTemplate(completedForm) && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Peptide</label>
                      <select 
                        value={completedForm.peptideId}
                        onChange={e => setCompletedForm({...completedForm, peptideId: e.target.value, selectedDose: ''})}
                        style={styles.select}
                      >
                        <option value="">Select peptide...</option>
                        {peptides.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {getSelectedPeptide(completedForm)?.dose_options?.length > 0 && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dose</label>
                        <select 
                          value={completedForm.selectedDose}
                          onChange={e => setCompletedForm({...completedForm, selectedDose: e.target.value})}
                          style={styles.select}
                        >
                          <option value="">Select dose...</option>
                          {getSelectedPeptide(completedForm).dose_options.map(dose => (
                            <option key={dose} value={dose}>{dose}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Frequency</label>
                      <select 
                        value={completedForm.frequency}
                        onChange={e => setCompletedForm({...completedForm, frequency: e.target.value})}
                        style={styles.select}
                      >
                        <option value="">Select frequency...</option>
                        <option value="2x daily">2x daily</option>
                        <option value="Daily">Daily</option>
                        <option value="Every other day">Every other day</option>
                        <option value="2x weekly">2x weekly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="5 days on, 2 off">5 days on, 2 off</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date *</label>
                    <input 
                      type="date"
                      value={completedForm.startDate}
                      onChange={e => setCompletedForm({...completedForm, startDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date *</label>
                    <input 
                      type="date"
                      value={completedForm.endDate}
                      onChange={e => setCompletedForm({...completedForm, endDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea 
                    value={completedForm.notes}
                    onChange={e => setCompletedForm({...completedForm, notes: e.target.value})}
                    placeholder="Any notes..."
                    style={styles.textarea}
                    rows={2}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowAddCompletedModal(false)} style={styles.cancelButton}>Cancel</button>
                <button 
                  onClick={handleAddCompleted}
                  disabled={!completedForm.patientId || !completedForm.templateId || !completedForm.startDate || !completedForm.endDate}
                  style={styles.primaryButton}
                >
                  Add Protocol
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
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0'
  },
  tab: {
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '-1px'
  },
  tabActive: {
    color: '#000',
    borderBottomColor: '#000'
  },
  badge: {
    background: '#fef3c7',
    color: '#b45309',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeGreen: {
    background: '#d1fae5',
    color: '#059669',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeGray: {
    background: '#f3f4f6',
    color: '#6b7280',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  section: {},
  sectionHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  cardMain: {
    flex: 1
  },
  patientLink: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    textDecoration: 'none'
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000'
  },
  productName: {
    fontSize: '14px',
    color: '#374151',
    marginTop: '4px'
  },
  meta: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  cardStatus: {},
  primaryButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  secondaryButton: {
    background: '#fff',
    color: '#000',
    border: '1px solid #000',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  dismissButton: {
    background: 'none',
    color: '#9ca3af',
    border: '1px solid #e5e7eb',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  daysLeft: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  ending: {
    background: '#fef3c7',
    color: '#b45309',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  completed: {
    color: '#059669',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  emptyIcon: {
    fontSize: '32px',
    marginBottom: '12px'
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
  purchasePreview: {
    background: '#f9fafb',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
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
  cancelButton: {
    background: '#fff',
    color: '#000',
    border: '1px solid #d1d5db',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
