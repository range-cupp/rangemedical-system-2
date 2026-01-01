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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  
  const [templates, setTemplates] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [patients, setPatients] = useState([]);
  
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    injectionMedication: '',
    injectionDose: ''
  });

  const [existingPacks, setExistingPacks] = useState([]);
  const [addToPackMode, setAddToPackMode] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('');
  
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

  const [editForm, setEditForm] = useState({
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: '',
    endDate: '',
    status: '',
    notes: '',
    medication: '',
    sessionsUsed: 0,
    totalSessions: null
  });

  const INJECTION_MEDICATIONS = [
    'Amino Blend',
    'B12',
    'B-Complex',
    'Biotin',
    'Vitamin D3',
    'NAC',
    'BCAA',
    'L-Carnitine',
    'Glutathione',
    'NAD+'
  ];

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
    // Parse as local date to avoid timezone shift
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const openAssignModal = async (purchase) => {
    setSelectedPurchase(purchase);
    setAssignForm({
      templateId: '',
      peptideId: '',
      selectedDose: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      injectionMedication: '',
      injectionDose: ''
    });
    setAddToPackMode(false);
    setSelectedPackId('');
    setExistingPacks([]);

    // Check if this is an injection and patient has existing packs
    const isInjection = purchase.category === 'Injection' || 
                        purchase.item_name?.toLowerCase().includes('injection');
    
    if (isInjection && (purchase.patient_id || purchase.ghl_contact_id)) {
      try {
        const params = new URLSearchParams();
        if (purchase.patient_id) params.set('patient_id', purchase.patient_id);
        if (purchase.ghl_contact_id) params.set('ghl_contact_id', purchase.ghl_contact_id);
        
        const res = await fetch(`/api/protocols/active-packs?${params}`);
        const data = await res.json();
        if (data.packs?.length > 0) {
          setExistingPacks(data.packs);
        }
      } catch (err) {
        console.error('Error fetching packs:', err);
      }
    }

    setShowAssignModal(true);
  };

  const handleAssignProtocol = async () => {
    try {
      // Use injection medication if it's an injection template
      const template = templates.find(t => t.id === assignForm.templateId);
      const isInjection = template?.name?.toLowerCase().includes('injection');
      
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
          selectedDose: isInjection ? assignForm.injectionDose : assignForm.selectedDose,
          medication: isInjection ? assignForm.injectionMedication : null,
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

  const handleAddToPack = async () => {
    if (!selectedPackId) {
      alert('Please select a pack');
      return;
    }

    try {
      const res = await fetch(`/api/protocols/${selectedPackId}/add-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: selectedPurchase.id,
          sessionCount: 1
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
        alert(data.message || 'Session added to pack');
      } else {
        alert(data.error || 'Failed to add session');
      }
    } catch (error) {
      console.error('Error adding to pack:', error);
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
      totalSessions: protocol.total_sessions || null
    });
    setShowEditModal(true);
  };

  const handleEditProtocol = async () => {
    try {
      const res = await fetch(`/api/protocols/${selectedProtocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication: editForm.medication,
          selectedDose: editForm.selectedDose,
          frequency: editForm.frequency,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          status: editForm.status,
          notes: editForm.notes,
          sessionsUsed: editForm.sessionsUsed
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update protocol');
      }
    } catch (error) {
      console.error('Error updating protocol:', error);
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

  const isInjectionTemplate = (form) => {
    const template = getSelectedTemplate(form);
    return template?.name?.toLowerCase().includes('injection');
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
              <div style={styles.activeGrid}>
                {activeProtocols.map(protocol => {
                  const isSessionBased = protocol.total_sessions && protocol.total_sessions > 0;
                  const totalDays = protocol.end_date && protocol.start_date 
                    ? Math.ceil((new Date(protocol.end_date) - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24))
                    : null;
                  const daysPassed = protocol.start_date
                    ? Math.ceil((new Date() - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24))
                    : 0;
                  const currentDay = Math.min(daysPassed, totalDays || daysPassed);
                  
                  // Calculate progress - either by sessions or by days
                  const progressPercent = isSessionBased 
                    ? ((protocol.sessions_used || 0) / protocol.total_sessions) * 100
                    : (totalDays ? Math.min((currentDay / totalDays) * 100, 100) : 0);
                  
                  return (
                    <div key={protocol.id} style={styles.activeCard}>
                      <div style={styles.activeCardHeader}>
                        <span style={styles.activePatientName}>{protocol.patient_name}</span>
                      </div>
                      <div style={styles.activeProtocolInfo}>
                        <span style={styles.protocolDot}>●</span>
                        <span>{protocol.medication || protocol.program_name}</span>
                        {protocol.selected_dose && <span> - {protocol.selected_dose}</span>}
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{...styles.progressFill, width: `${progressPercent}%`}}></div>
                      </div>
                      <div style={styles.activeCardFooter}>
                        {isSessionBased ? (
                          <span style={styles.sessionsBadge}>
                            {protocol.sessions_used || 0} of {protocol.total_sessions} used
                          </span>
                        ) : totalDays ? (
                          <span>Day {currentDay} of {totalDays}</span>
                        ) : (
                          <span>Ongoing</span>
                        )}
                        {protocol.frequency && <span style={styles.frequencyBadge}>{protocol.frequency}</span>}
                        <button 
                          onClick={() => openEditModal(protocol)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                      <div style={styles.patientName}>{protocol.patient_name}</div>
                      <div style={styles.productName}>
                        {protocol.program_name || protocol.medication}
                        {protocol.selected_dose && ` • ${protocol.selected_dose}`}
                      </div>
                      <div style={styles.meta}>
                        {formatDate(protocol.start_date)} → {formatDate(protocol.end_date)}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <span style={styles.completed}>✓ Complete</span>
                      <button 
                        onClick={() => openEditModal(protocol)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>
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

                {/* Show Add to Pack option if packs exist */}
                {existingPacks.length > 0 && (
                  <div style={styles.packOption}>
                    <div style={styles.packToggle}>
                      <button 
                        onClick={() => setAddToPackMode(false)}
                        style={addToPackMode ? styles.toggleInactive : styles.toggleActive}
                      >
                        New Protocol
                      </button>
                      <button 
                        onClick={() => setAddToPackMode(true)}
                        style={addToPackMode ? styles.toggleActive : styles.toggleInactive}
                      >
                        Add to Existing Pack
                      </button>
                    </div>

                    {addToPackMode && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select Pack</label>
                        <select 
                          value={selectedPackId}
                          onChange={e => setSelectedPackId(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Choose pack...</option>
                          {existingPacks.map(pack => (
                            <option key={pack.id} value={pack.id}>
                              {pack.program_name} - {pack.sessions_used || 0} of {pack.total_sessions} used
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {!addToPackMode && (
                  <>
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
                            <option value="Every 5 days">Every 5 days</option>
                            <option value="5 days on, 2 off">5 days on, 2 off</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>
                      </>
                    )}

                    {isInjectionTemplate(assignForm) && (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Medication *</label>
                          <select 
                            value={assignForm.injectionMedication}
                            onChange={e => setAssignForm({...assignForm, injectionMedication: e.target.value})}
                            style={styles.select}
                          >
                            <option value="">Select medication...</option>
                            {INJECTION_MEDICATIONS.map(med => (
                              <option key={med} value={med}>{med}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>Dose</label>
                          <input 
                            type="text"
                            value={assignForm.injectionDose}
                            onChange={e => setAssignForm({...assignForm, injectionDose: e.target.value})}
                            placeholder="e.g. 100mg, 200mg"
                            style={styles.input}
                          />
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
                  </>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowAssignModal(false)} style={styles.cancelButton}>Cancel</button>
                {addToPackMode ? (
                  <button 
                    onClick={handleAddToPack}
                    disabled={!selectedPackId}
                    style={styles.primaryButton}
                  >
                    Add to Pack
                  </button>
                ) : (
                  <button 
                    onClick={handleAssignProtocol}
                    disabled={!assignForm.templateId}
                    style={styles.primaryButton}
                  >
                    Start Protocol
                  </button>
                )}
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
                        <option value="Every 5 days">Every 5 days</option>
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

        {/* Edit Protocol Modal */}
        {showEditModal && selectedProtocol && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Edit Protocol</h3>
                <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.purchasePreview}>
                  <strong>{selectedProtocol.patient_name}</strong>
                  <div>{selectedProtocol.program_name}</div>
                  {selectedProtocol.medication && <div style={{color: '#666'}}>{selectedProtocol.medication}</div>}
                </div>

                {/* Medication picker for injections */}
                {selectedProtocol.program_name?.toLowerCase().includes('injection') && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Medication</label>
                    <select 
                      value={editForm.medication}
                      onChange={e => setEditForm({...editForm, medication: e.target.value})}
                      style={styles.select}
                    >
                      <option value="">Select medication...</option>
                      {INJECTION_MEDICATIONS.map(med => (
                        <option key={med} value={med}>{med}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Dose</label>
                  <input 
                    type="text"
                    value={editForm.selectedDose}
                    onChange={e => setEditForm({...editForm, selectedDose: e.target.value})}
                    placeholder="e.g. 500mcg, 100mg"
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
                    <option value="Every 5 days">Every 5 days</option>
                            <option value="5 days on, 2 off">5 days on, 2 off</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                {/* Sessions tracking for packs */}
                {editForm.totalSessions && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Sessions Used (of {editForm.totalSessions})</label>
                    <input 
                      type="number"
                      min="0"
                      max={editForm.totalSessions}
                      value={editForm.sessionsUsed}
                      onChange={e => setEditForm({...editForm, sessionsUsed: parseInt(e.target.value) || 0})}
                      style={styles.input}
                    />
                  </div>
                )}

                {/* Date fields only for non-session protocols */}
                {!editForm.totalSessions && (
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
                )}

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
                  style={styles.primaryButton}
                >
                  Save Changes
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
  // Active protocol card styles
  activeGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activeCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  activeCardHeader: {
    minWidth: '150px'
  },
  activePatientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000'
  },
  activeProtocolInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    flex: 1
  },
  protocolDot: {
    color: '#10b981',
    fontSize: '12px'
  },
  progressBar: {
    width: '150px',
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#10b981',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  },
  activeCardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '13px',
    color: '#6b7280',
    minWidth: '180px',
    justifyContent: 'flex-end'
  },
  frequencyBadge: {
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  editButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    marginLeft: '8px'
  },
  packOption: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  packToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  toggleActive: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #000',
    background: '#000',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  toggleInactive: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #d1d5db',
    background: '#fff',
    color: '#666',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  sessionsBadge: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
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
