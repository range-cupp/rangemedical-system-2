// /pages/admin/pipeline.js
// Pipeline with URL-based tabs for proper back button behavior
// Includes Patients tab
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Pipeline() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Get tab from URL, default to 'needs-protocol'
  const activeTab = router.query.tab || 'needs-protocol';
  
  const [needsProtocol, setNeedsProtocol] = useState([]);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddCompletedModal, setShowAddCompletedModal] = useState(false);
  const [showAddToPackModal, setShowAddToPackModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const [templates, setTemplates] = useState([]);
  const [peptides, setPeptides] = useState([]);
  const [existingPacks, setExistingPacks] = useState([]);
  
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    medication: ''
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

  const [addToPackForm, setAddToPackForm] = useState({
    protocolId: '',
    sessionsToAdd: 1
  });

  // Change tab by updating URL (shallow routing)
  const setActiveTab = (tab) => {
    router.push(
      { pathname: '/admin/pipeline', query: { tab } },
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pipeline data from the single endpoint
      const pipelineRes = await fetch('/api/admin/pipeline');
      const pipelineData = await pipelineRes.json();
      
      setNeedsProtocol(pipelineData.needsProtocol || []);
      
      // Sort active protocols by days remaining (lowest first)
      const sortedActive = (pipelineData.activeProtocols || []).sort((a, b) => {
        // Handle null/undefined days_remaining - put them at the end
        if (a.days_remaining === null || a.days_remaining === undefined) return 1;
        if (b.days_remaining === null || b.days_remaining === undefined) return -1;
        return a.days_remaining - b.days_remaining;
      });
      setActiveProtocols(sortedActive);
      
      setCompletedProtocols(pipelineData.completedProtocols || []);
      
      // Extract unique patients from pipeline data
      const patientMap = new Map();
      
      // From purchases needing protocol
      (pipelineData.needsProtocol || []).forEach(p => {
        const key = p.patient_id || p.ghl_contact_id || p.patient_name;
        if (key && p.patient_name && p.patient_name !== 'Unknown') {
          if (!patientMap.has(key)) {
            patientMap.set(key, {
              id: p.patient_id || p.ghl_contact_id,
              name: p.patient_name,
              ghl_contact_id: p.ghl_contact_id,
              purchase_count: 0,
              protocol_count: 0
            });
          }
          patientMap.get(key).purchase_count++;
        }
      });
      
      // From active protocols
      (pipelineData.activeProtocols || []).forEach(p => {
        const key = p.patient_id || p.ghl_contact_id || p.patient_name;
        if (key && p.patient_name && p.patient_name !== 'Unknown') {
          if (!patientMap.has(key)) {
            patientMap.set(key, {
              id: p.patient_id || p.ghl_contact_id,
              name: p.patient_name,
              ghl_contact_id: p.ghl_contact_id,
              purchase_count: 0,
              protocol_count: 0
            });
          }
          patientMap.get(key).protocol_count++;
        }
      });
      
      // From completed protocols
      (pipelineData.completedProtocols || []).forEach(p => {
        const key = p.patient_id || p.ghl_contact_id || p.patient_name;
        if (key && p.patient_name && p.patient_name !== 'Unknown') {
          if (!patientMap.has(key)) {
            patientMap.set(key, {
              id: p.patient_id || p.ghl_contact_id,
              name: p.patient_name,
              ghl_contact_id: p.ghl_contact_id,
              purchase_count: 0,
              protocol_count: 0
            });
          }
          patientMap.get(key).protocol_count++;
        }
      });
      
      // Convert to array and sort by name
      const extractedPatients = Array.from(patientMap.values())
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setPatients(extractedPatients);
      
      // Fetch templates and peptides for modals (optional - don't crash if they fail)
      try {
        const templatesRes = await fetch('/api/protocol-templates');
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(Array.isArray(templatesData) ? templatesData : []);
        }
      } catch (e) {
        console.log('Could not load templates');
      }
      
      try {
        const peptidesRes = await fetch('/api/peptides');
        if (peptidesRes.ok) {
          const peptidesData = await peptidesRes.json();
          setPeptides(Array.isArray(peptidesData) ? peptidesData : []);
        }
      } catch (e) {
        console.log('Could not load peptides');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPacks = async (patientId, category) => {
    try {
      const res = await fetch(`/api/protocols?patient_id=${patientId}&status=active&category=${category}`);
      const data = await res.json();
      setExistingPacks(Array.isArray(data) ? data.filter(p => p.total_sessions && p.sessions_used < p.total_sessions) : []);
    } catch (error) {
      console.error('Error fetching packs:', error);
      setExistingPacks([]);
    }
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
      medication: ''
    });
    
    // Check for existing packs if this is a single session type
    if (purchase.patient_id && isSingleSession(purchase.product_name)) {
      await fetchExistingPacks(purchase.patient_id, purchase.category);
    } else {
      setExistingPacks([]);
    }
    
    setShowAssignModal(true);
  };

  const isSingleSession = (itemName) => {
    const name = itemName?.toLowerCase() || '';
    return (
      (name.includes('iv') && !name.includes('pack') && !name.includes('10') && !name.includes('12')) ||
      (name.includes('injection') && !name.includes('pack') && !name.includes('10') && !name.includes('12'))
    );
  };

  const openAddToPackModal = (purchase) => {
    setSelectedPurchase(purchase);
    setAddToPackForm({
      protocolId: '',
      sessionsToAdd: 1
    });
    setShowAddToPackModal(true);
  };

  const handleAssignProtocol = async () => {
    try {
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPurchase.patient_id,
          purchaseId: selectedPurchase.id,
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: assignForm.selectedDose,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          medication: assignForm.medication
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
    }
  };

  const handleAddToExistingPack = async () => {
    try {
      const res = await fetch('/api/protocols/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: addToPackForm.protocolId,
          purchaseId: selectedPurchase.id,
          sessionsToAdd: addToPackForm.sessionsToAdd
        })
      });

      if (res.ok) {
        setShowAddToPackModal(false);
        fetchData();
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

  const handleDismiss = async (purchaseId) => {
    if (!confirm('Dismiss this purchase? It won\'t show in the pipeline anymore.')) return;
    
    try {
      await fetch(`/api/purchases/${purchaseId}/dismiss`, { method: 'POST' });
      setNeedsProtocol(needsProtocol.filter(p => p.id !== purchaseId));
    } catch (error) {
      console.error('Error dismissing:', error);
    }
  };

  const handleMarkAsLabOrder = async (purchase) => {
    try {
      const res = await fetch('/api/purchases/mark-lab-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: purchase.id })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error marking as lab order:', error);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const isLabPurchase = (itemName) => {
    const name = itemName?.toLowerCase() || '';
    return name.includes('blood draw') || name.includes('lab') || name.includes('panel');
  };

  // Filter patients by search
  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const search = patientSearch.toLowerCase();
    const name = (p.name || p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
    const email = (p.email || '').toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    return name.includes(search) || email.includes(search) || phone.includes(search);
  });

  const counts = {
    needsProtocol: needsProtocol.length,
    active: activeProtocols.length,
    completed: completedProtocols.length,
    patients: patients.length
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
            <span style={{
              ...styles.badge,
              ...(activeTab === 'needs-protocol' ? styles.badgeActive : {})
            }}>
              {counts.needsProtocol}
            </span>
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'active' ? styles.tabActiveGreen : {})
            }}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span style={{
              ...styles.badge,
              backgroundColor: '#dcfce7',
              color: '#166534',
              ...(activeTab === 'active' ? { backgroundColor: '#22c55e', color: 'white' } : {})
            }}>
              {counts.active}
            </span>
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'completed' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('completed')}
          >
            Completed
            <span style={{
              ...styles.badge,
              backgroundColor: '#e5e7eb',
              color: '#374151',
              ...(activeTab === 'completed' ? { backgroundColor: '#6b7280', color: 'white' } : {})
            }}>
              {counts.completed}
            </span>
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'patients' ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab('patients')}
          >
            Patients
            <span style={{
              ...styles.badge,
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              ...(activeTab === 'patients' ? { backgroundColor: '#3b82f6', color: 'white' } : {})
            }}>
              {counts.patients}
            </span>
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          
          {/* Needs Protocol Tab */}
          {activeTab === 'needs-protocol' && (
            <div style={styles.list}>
              {needsProtocol.length === 0 ? (
                <div style={styles.empty}>No purchases needing protocol assignment</div>
              ) : (
                needsProtocol.map(purchase => (
                  <div key={purchase.id} style={styles.card}>
                    <div style={styles.cardInfo}>
                      {purchase.patient_id ? (
                        <Link 
                          href={`/admin/patient/${purchase.patient_id}`}
                          style={styles.patientName}
                        >
                          {purchase.patient_name || 'Unknown'}
                        </Link>
                      ) : (
                        <span style={styles.patientNameUnlinked}>{purchase.patient_name || 'Unknown'}</span>
                      )}
                      <div style={styles.itemName}>{purchase.product_name}</div>
                      <div style={styles.meta}>
                        {purchase.amount_paid ? `$${purchase.amount_paid.toFixed(2)}` : '$'} • {formatDate(purchase.purchase_date)}
                        {purchase.category && ` • ${purchase.category}`}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      {isLabPurchase(purchase.product_name) ? (
                        <button 
                          onClick={() => handleMarkAsLabOrder(purchase)}
                          style={styles.labButton}
                        >
                          Mark as Lab Order
                        </button>
                      ) : (
                        <>
                          {existingPacks.length > 0 && purchase.patient_id && isSingleSession(purchase.product_name) && (
                            <button 
                              onClick={() => openAddToPackModal(purchase)}
                              style={styles.secondaryButton}
                            >
                              Add to Pack
                            </button>
                          )}
                          <button 
                            onClick={() => openAssignModal(purchase)}
                            style={styles.primaryButton}
                          >
                            Start Protocol
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDismiss(purchase.id)}
                        style={styles.dismissButton}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Tab */}
          {activeTab === 'active' && (
            <div style={styles.list}>
              {activeProtocols.length === 0 ? (
                <div style={styles.empty}>No active protocols</div>
              ) : (
                activeProtocols.map(protocol => (
                  <div key={protocol.id} style={styles.card}>
                    <div style={styles.cardInfo}>
                      {protocol.patient_id ? (
                        <Link 
                          href={`/admin/patient/${protocol.patient_id}`}
                          style={styles.patientName}
                        >
                          {protocol.patient_name || 'Unknown'}
                        </Link>
                      ) : (
                        <span style={styles.patientNameUnlinked}>{protocol.patient_name || 'Unknown'}</span>
                      )}
                      <div style={styles.itemName}>
                        {protocol.program_name}
                        {protocol.medication && ` - ${protocol.medication}`}
                        {protocol.selected_dose && ` (${protocol.selected_dose})`}
                      </div>
                      <div style={styles.meta}>
                        Started {formatDate(protocol.start_date)}
                        {protocol.total_sessions && (
                          <> • {protocol.sessions_used || 0}/{protocol.total_sessions} sessions</>
                        )}
                        {protocol.days_remaining !== null && protocol.days_remaining !== undefined && (
                          <> • {protocol.days_remaining > 0 ? `${protocol.days_remaining} days left` : 'Ending today'}</>
                        )}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <Link 
                        href={`/admin/protocol/${protocol.id}`}
                        style={styles.viewButton}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div style={styles.list}>
              <div style={styles.completedHeader}>
                <button 
                  onClick={() => setShowAddCompletedModal(true)}
                  style={styles.addCompletedButton}
                >
                  + Add Historical Protocol
                </button>
              </div>
              {completedProtocols.length === 0 ? (
                <div style={styles.empty}>No completed protocols</div>
              ) : (
                completedProtocols.map(protocol => (
                  <div key={protocol.id} style={styles.card}>
                    <div style={styles.cardInfo}>
                      {protocol.patient_id ? (
                        <Link 
                          href={`/admin/patient/${protocol.patient_id}`}
                          style={styles.patientName}
                        >
                          {protocol.patient_name || 'Unknown'}
                        </Link>
                      ) : (
                        <span style={styles.patientNameUnlinked}>{protocol.patient_name || 'Unknown'}</span>
                      )}
                      <div style={styles.itemName}>
                        {protocol.program_name}
                        {protocol.medication && ` - ${protocol.medication}`}
                      </div>
                      <div style={styles.meta}>
                        {formatDate(protocol.start_date)} - {formatDate(protocol.end_date)}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <Link 
                        href={`/admin/protocol/${protocol.id}`}
                        style={styles.viewButton}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div style={styles.list}>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              {filteredPatients.length === 0 ? (
                <div style={styles.empty}>
                  {patientSearch ? 'No patients match your search' : 'No patients found'}
                </div>
              ) : (
                filteredPatients.map(patient => {
                  const patientId = patient.id || patient.ghl_contact_id;
                  const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.patient_name || 'Unknown';
                  return (
                    <div key={patientId} style={styles.card}>
                      <div style={styles.cardInfo}>
                        <Link 
                          href={`/admin/patient/${patientId}`}
                          style={styles.patientName}
                        >
                          {patientName}
                        </Link>
                        <div style={styles.meta}>
                          {patient.email && <span>{patient.email}</span>}
                          {patient.phone && <span> • {patient.phone}</span>}
                          {patient.protocol_count > 0 && <span> • {patient.protocol_count} protocols</span>}
                          {patient.purchase_count > 0 && <span> • {patient.purchase_count} purchases</span>}
                        </div>
                      </div>
                      <div style={styles.cardActions}>
                        <Link 
                          href={`/admin/patient/${patientId}`}
                          style={styles.viewButton}
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Assign Protocol Modal */}
        {showAssignModal && selectedPurchase && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Start Protocol</h2>
              <p style={styles.modalSubtitle}>
                {selectedPurchase.patient_name || 'Unknown'} - {selectedPurchase.product_name}
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Protocol Template</label>
                <select
                  style={styles.select}
                  value={assignForm.templateId}
                  onChange={(e) => setAssignForm({ ...assignForm, templateId: e.target.value, peptideId: '', selectedDose: '', medication: '' })}
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
                    <label style={styles.label}>Peptide</label>
                    <select
                      style={styles.select}
                      value={assignForm.peptideId}
                      onChange={(e) => setAssignForm({ ...assignForm, peptideId: e.target.value, selectedDose: '' })}
                    >
                      <option value="">Select peptide...</option>
                      {peptides.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                  </div>

                  {assignForm.peptideId && getSelectedPeptide(assignForm)?.dose_options && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dose</label>
                      <select
                        style={styles.select}
                        value={assignForm.selectedDose}
                        onChange={(e) => setAssignForm({ ...assignForm, selectedDose: e.target.value })}
                      >
                        <option value="">Select dose...</option>
                        {getSelectedPeptide(assignForm).dose_options.map(dose => (
                          <option key={dose} value={dose}>{dose}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {isInjectionTemplate(assignForm) && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Medication</label>
                  <select
                    style={styles.select}
                    value={assignForm.medication}
                    onChange={(e) => setAssignForm({ ...assignForm, medication: e.target.value })}
                  >
                    <option value="">Select medication...</option>
                    <option value="NAD+ 100mg">NAD+ 100mg</option>
                    <option value="NAD+ 200mg">NAD+ 200mg</option>
                    <option value="B12">B12</option>
                    <option value="Glutathione">Glutathione</option>
                    <option value="Vitamin D">Vitamin D</option>
                    <option value="Biotin">Biotin</option>
                    <option value="Lipo-C">Lipo-C</option>
                    <option value="Skinny Shot">Skinny Shot</option>
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Frequency</label>
                <select
                  style={styles.select}
                  value={assignForm.frequency}
                  onChange={(e) => setAssignForm({ ...assignForm, frequency: e.target.value })}
                >
                  <option value="">Select frequency...</option>
                  <option value="2x daily">2x Daily</option>
                  <option value="daily">Daily</option>
                  <option value="every other day">Every Other Day</option>
                  <option value="every 5 days">Every 5 Days</option>
                  <option value="2x weekly">2x Weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="as needed">As Needed</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  style={styles.textarea}
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Any special instructions..."
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignProtocol}
                  style={styles.submitButton}
                  disabled={!assignForm.templateId}
                >
                  Start Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add to Pack Modal */}
        {showAddToPackModal && selectedPurchase && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Add to Existing Pack</h2>
              <p style={styles.modalSubtitle}>
                {selectedPurchase.patient_name} - {selectedPurchase.product_name}
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Select Pack</label>
                <select
                  style={styles.select}
                  value={addToPackForm.protocolId}
                  onChange={(e) => setAddToPackForm({ ...addToPackForm, protocolId: e.target.value })}
                >
                  <option value="">Select pack...</option>
                  {existingPacks.map(pack => (
                    <option key={pack.id} value={pack.id}>
                      {pack.program_name} - {pack.sessions_used}/{pack.total_sessions} used
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowAddToPackModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddToExistingPack}
                  style={styles.submitButton}
                  disabled={!addToPackForm.protocolId}
                >
                  Add Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Completed Protocol Modal */}
        {showAddCompletedModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Add Historical Protocol</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Patient</label>
                <select
                  style={styles.select}
                  value={completedForm.patientId}
                  onChange={(e) => setCompletedForm({ ...completedForm, patientId: e.target.value })}
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => {
                    const patientId = p.id || p.ghl_contact_id;
                    const patientName = p.name || p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
                    return (
                      <option key={patientId} value={patientId}>
                        {patientName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Protocol Template</label>
                <select
                  style={styles.select}
                  value={completedForm.templateId}
                  onChange={(e) => setCompletedForm({ ...completedForm, templateId: e.target.value, peptideId: '', selectedDose: '' })}
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
                      style={styles.select}
                      value={completedForm.peptideId}
                      onChange={(e) => setCompletedForm({ ...completedForm, peptideId: e.target.value, selectedDose: '' })}
                    >
                      <option value="">Select peptide...</option>
                      {peptides.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                  </div>

                  {completedForm.peptideId && getSelectedPeptide(completedForm)?.dose_options && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dose</label>
                      <select
                        style={styles.select}
                        value={completedForm.selectedDose}
                        onChange={(e) => setCompletedForm({ ...completedForm, selectedDose: e.target.value })}
                      >
                        <option value="">Select dose...</option>
                        {getSelectedPeptide(completedForm).dose_options.map(dose => (
                          <option key={dose} value={dose}>{dose}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Frequency</label>
                <select
                  style={styles.select}
                  value={completedForm.frequency}
                  onChange={(e) => setCompletedForm({ ...completedForm, frequency: e.target.value })}
                >
                  <option value="">Select frequency...</option>
                  <option value="2x daily">2x Daily</option>
                  <option value="daily">Daily</option>
                  <option value="every other day">Every Other Day</option>
                  <option value="every 5 days">Every 5 Days</option>
                  <option value="2x weekly">2x Weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={completedForm.startDate}
                    onChange={(e) => setCompletedForm({ ...completedForm, startDate: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={completedForm.endDate}
                    onChange={(e) => setCompletedForm({ ...completedForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  style={styles.textarea}
                  value={completedForm.notes}
                  onChange={(e) => setCompletedForm({ ...completedForm, notes: e.target.value })}
                  placeholder="Any notes about this protocol..."
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowAddCompletedModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCompleted}
                  style={styles.submitButton}
                  disabled={!completedForm.patientId || !completedForm.templateId}
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0',
  },
  tab: {
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#111',
    borderBottomColor: '#111',
  },
  tabActiveGreen: {
    color: '#16a34a',
    borderBottomColor: '#22c55e',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  badgeActive: {
    backgroundColor: '#dc2626',
    color: 'white',
  },
  content: {
    marginTop: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
  },
  cardInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111',
    textDecoration: 'underline',
    textDecorationColor: '#d1d5db',
    textUnderlineOffset: '2px',
  },
  patientNameUnlinked: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#9ca3af',
  },
  itemName: {
    fontSize: '14px',
    color: '#374151',
    marginTop: '4px',
  },
  meta: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#111',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  labButton: {
    padding: '8px 16px',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  dismissButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  viewButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#111',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  completedHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  addCompletedButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#111',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#111',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};
