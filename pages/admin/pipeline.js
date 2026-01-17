// /pages/admin/pipeline.js
// Unified Protocol Pipeline with Start Protocol & Activity Logging
// Range Medical - Updated 2026-01-17

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Peptide options for the dropdown
const PEPTIDE_OPTIONS = [
  { group: 'Recovery / Tissue Repair', options: [
    { value: 'BPC-157', dose: '250-500mcg' },
    { value: 'TB-500', dose: '2-2.5mg' },
    { value: 'Wolverine Blend (BPC/TB)', dose: '500mcg/500mcg' },
    { value: 'KPV', dose: '200-400mcg' },
    { value: 'LL-37', dose: '50-100mcg' },
    { value: 'GHK-Cu', dose: '1-2mg' },
  ]},
  { group: 'Weight Loss / Metabolic', options: [
    { value: 'AOD 9604', dose: '300mcg' },
    { value: 'MOTS-c', dose: '5-10mg' },
    { value: 'Tesamorelin', dose: '1-2mg' },
    { value: 'Tesamorelin/Ipamorelin', dose: '0.3mL' },
    { value: 'MK-677', dose: '10-25mg' },
  ]},
  { group: 'GH Secretagogues', options: [
    { value: 'Ipamorelin', dose: '200-300mcg' },
    { value: 'CJC-1295 No DAC', dose: '100-200mcg' },
    { value: 'CJC/Ipamorelin', dose: '0.2-0.3mL' },
    { value: 'Sermorelin', dose: '200-500mcg' },
  ]},
  { group: 'Longevity', options: [
    { value: 'Epithalon', dose: '5-10mg' },
    { value: 'Thymosin Alpha-1', dose: '1.6mg' },
    { value: 'NAD+', dose: '50-200mg' },
  ]},
  { group: 'Cognitive', options: [
    { value: 'Selank', dose: '250-500mcg' },
    { value: 'Semax', dose: '200-600mcg' },
    { value: 'Dihexa', dose: '10-20mg' },
  ]},
  { group: 'Sexual Health', options: [
    { value: 'PT-141', dose: '1-2mg' },
    { value: 'Kisspeptin', dose: '50-200mcg' },
  ]},
  { group: 'HRT Support', options: [
    { value: 'Gonadorelin', dose: '100-200mcg' },
    { value: 'HCG', dose: '500-1000 IU' },
  ]},
];

// Testosterone dosage options
const TESTOSTERONE_DOSES = {
  male: [
    { value: '0.3ml/60mg', label: '0.3ml / 60mg' },
    { value: '0.35ml/70mg', label: '0.35ml / 70mg' },
    { value: '0.4ml/80mg', label: '0.4ml / 80mg' },
    { value: '0.5ml/100mg', label: '0.5ml / 100mg' },
  ],
  female: [
    { value: '0.1ml/10mg', label: '0.1ml / 10mg' },
    { value: '0.15ml/15mg', label: '0.15ml / 15mg' },
    { value: '0.2ml/20mg', label: '0.2ml / 20mg' },
    { value: '0.25ml/25mg', label: '0.25ml / 25mg' },
    { value: '0.3ml/30mg', label: '0.3ml / 30mg' },
    { value: '0.4ml/40mg', label: '0.4ml / 40mg' },
    { value: '0.5ml/50mg', label: '0.5ml / 50mg' },
  ]
};

export default function UnifiedPipeline() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('active');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [renewModal, setRenewModal] = useState(null);
  const [renewingId, setRenewingId] = useState(null);
  const [startModal, setStartModal] = useState(false);
  const [logModal, setLogModal] = useState(null);
  
  // Patient search for Start Protocol
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  // Start Protocol form state
  const [protocolType, setProtocolType] = useState('');
  const [protocolForm, setProtocolForm] = useState({});
  const [selectedPurchase, setSelectedPurchase] = useState(null);  // Track purchase being processed
  
  // Log form state
  const [logForm, setLogForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
    fetchPatients();
    // Check for admin mode
    if (router.query.admin === 'true') {
      setIsAdmin(true);
    }
  }, [router.query]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pipeline');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Use patients-all endpoint to get ALL patients
      const res = await fetch('/api/patients-all');
      const json = await res.json();
      if (json.patients) {
        setPatients(json.patients);
        console.log('Patients loaded:', json.patients.length, 'at', json.timestamp);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  // Filter patients for search
  const filteredPatients = patients.filter(p => {
    if (!patientSearch || patientSearch.length < 1) return false;
    const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
    return name.includes(patientSearch.toLowerCase());
  }).slice(0, 10);

  // Get filtered protocols
  const getFilteredProtocols = () => {
    if (!data) return [];
    
    let protocols = [];
    
    if (statusFilter === 'active' || statusFilter === 'all') {
      protocols = [
        ...data.protocols.ending_soon,
        ...data.protocols.active,
        ...data.protocols.just_started
      ];
    }
    if (statusFilter === 'completed' || statusFilter === 'all') {
      protocols = [...protocols, ...data.protocols.completed];
    }
    
    if (deliveryFilter !== 'all') {
      protocols = protocols.filter(p => p.delivery === deliveryFilter);
    }
    
    if (categoryFilter !== 'all') {
      protocols = protocols.filter(p => p.category === categoryFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      protocols = protocols.filter(p => 
        (p.patient_name || '').toLowerCase().includes(term) ||
        (p.medication || '').toLowerCase().includes(term) ||
        (p.program_name || '').toLowerCase().includes(term)
      );
    }
    
    return protocols;
  };

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Category badge
  const getCategoryBadge = (category) => {
    const badges = {
      peptide: { emoji: '🧬', color: '#ddd6fe', text: 'Peptide' },
      weight_loss: { emoji: '💉', color: '#bbf7d0', text: 'Weight Loss' },
      hrt: { emoji: '💊', color: '#fed7aa', text: 'HRT' },
      iv: { emoji: '💧', color: '#bfdbfe', text: 'IV' },
      hbot: { emoji: '🫁', color: '#fecaca', text: 'HBOT' },
      rlt: { emoji: '🔴', color: '#fecdd3', text: 'RLT' },
      injection: { emoji: '💉', color: '#e9d5ff', text: 'Injection' }
    };
    return badges[category] || { emoji: '📋', color: '#e5e7eb', text: 'Other' };
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  // Get duration display
  const getDuration = (protocol) => {
    // For session-based protocols (IV, HBOT, RLT)
    if (protocol.total_sessions && ['iv', 'hbot', 'rlt', 'injection'].includes(protocol.category)) {
      return `${protocol.sessions_used || 0}/${protocol.total_sessions} sessions`;
    }
    
    // For peptide protocols - show the program duration
    if (protocol.category === 'peptide') {
      const programName = (protocol.program_name || '').toLowerCase();
      
      // Extract duration from program_name (e.g., "10 Day", "7 Day", "30 Day")
      const durationMatch = programName.match(/(\d+)\s*day/i);
      if (durationMatch) {
        return `${durationMatch[1]} Day Program`;
      }
      
      // Check if it's a vial protocol
      if (programName.includes('vial')) {
        return 'Vial Protocol';
      }
      
      // Try to use total_days from API calculation
      if (protocol.total_days) {
        return `${protocol.total_days} Day Program`;
      }
      
      // Fallback to program_name if it exists
      if (protocol.program_name) {
        return protocol.program_name;
      }
    }
    
    // For HRT protocols
    if (protocol.category === 'hrt') {
      if (protocol.weeks_remaining) {
        return `~${protocol.weeks_remaining} weeks left`;
      }
      return protocol.supply_type || 'Ongoing';
    }
    
    // For weight loss
    if (protocol.category === 'weight_loss') {
      if (protocol.total_sessions) {
        return `${protocol.sessions_used || 0}/${protocol.total_sessions} injections`;
      }
      return protocol.program_name || 'Weight Loss';
    }
    
    // Default
    if (protocol.program_name) {
      return protocol.program_name;
    }
    return '-';
  };

  // GHL links
  const openGHL = (ghlId) => {
    if (!ghlId) {
      showToast('No GHL contact linked', 'error');
      return;
    }
    window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${ghlId}`, '_blank');
  };

  const openGHLConversation = (ghlId) => {
    if (!ghlId) {
      showToast('No GHL contact linked', 'error');
      return;
    }
    window.open(`https://app.gohighlevel.com/v2/location/WICdvbXmTjQORW6GiHWW/contacts/detail/${ghlId}`, '_blank');
  };

  // Renew modal
  const openRenewModal = (protocol) => {
    setRenewModal({
      protocol,
      duration: '30',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const closeRenewModal = () => setRenewModal(null);

  const confirmRenew = async () => {
    if (!renewModal) return;
    setRenewingId(renewModal.protocol.id);
    
    try {
      const res = await fetch(`/api/protocols/${renewModal.protocol.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_days: parseInt(renewModal.duration),
          start_date: renewModal.startDate
        })
      });
      
      const result = await res.json();
      if (result.success) {
        showToast('Protocol extended!');
        closeRenewModal();
        fetchData();
      } else {
        showToast(result.error || 'Failed to renew', 'error');
      }
    } catch (err) {
      showToast('Error extending protocol', 'error');
    } finally {
      setRenewingId(null);
    }
  };

  // Delete protocol (admin only)
  const deleteProtocol = async (protocol) => {
    const confirmMsg = `DELETE protocol for ${protocol.patient_name}?\n\n${protocol.medication || protocol.program_name}\n\nThis cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/protocols/${protocol.id}`, {
        method: 'DELETE'
      });
      
      const result = await res.json();
      if (result.success) {
        showToast('Protocol deleted');
        fetchData();
      } else {
        showToast(result.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Error deleting protocol', 'error');
    }
  };

  // ========== START PROTOCOL MODAL ==========
  const openStartModal = () => {
    setStartModal(true);
    setSelectedPatient(null);
    setPatientSearch('');
    setProtocolType('');
    setProtocolForm({
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const closeStartModal = () => {
    setStartModal(false);
    setSelectedPatient(null);
    setProtocolType('');
    setProtocolForm({});
    setSelectedPurchase(null);  // Clear purchase tracking
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch('');
    setShowPatientDropdown(false);
  };

  const submitStartProtocol = async () => {
    console.log('=== SUBMIT START PROTOCOL ===');
    console.log('selectedPatient:', selectedPatient);
    console.log('protocolType:', protocolType);
    
    if (!selectedPatient) {
      showToast('Please select a patient from the dropdown', 'error');
      alert('No patient selected! Please click on a patient from the search results.');
      return;
    }
    if (!protocolType) {
      showToast('Please select a protocol type', 'error');
      return;
    }
    
    setSubmitting(true);
    
    const payload = {
      patient_id: selectedPatient.id,
      ghl_contact_id: selectedPatient.ghl_contact_id,
      purchase_id: selectedPurchase?.id || null,  // Link to purchase if starting from payment
      program_type: protocolType,
      start_date: protocolForm.start_date,
      notes: protocolForm.notes || null,
      ...protocolForm
    };
    
    // Add protocol-specific fields
    switch (protocolType) {
      case 'weight_loss':
        payload.medication = protocolForm.wl_medication;
        payload.dose = protocolForm.wl_starting_dose;
        payload.delivery_method = protocolForm.wl_delivery;
        payload.total_sessions = parseInt(protocolForm.wl_total_injections) || 4;
        break;
      case 'peptide':
        payload.program_name = protocolForm.peptide_program;
        payload.medication = protocolForm.peptide_medication;
        payload.dose = protocolForm.peptide_dosage;
        payload.frequency = protocolForm.peptide_frequency;
        payload.delivery_method = protocolForm.peptide_delivery;
        break;
      case 'hrt':
        payload.medication = protocolForm.hrt_medication;
        payload.dose = protocolForm.hrt_dosage;
        payload.delivery_method = protocolForm.hrt_delivery;
        payload.supply_type = protocolForm.hrt_supply_type;
        break;
      case 'iv':
        payload.program_name = protocolForm.iv_package;
        payload.medication = protocolForm.iv_type;
        payload.total_sessions = protocolForm.iv_package === 'Single' ? 1 : 
                                 protocolForm.iv_package === '5 Pack' ? 5 : 10;
        payload.delivery_method = 'in_clinic';
        break;
      case 'hbot':
        payload.program_name = protocolForm.hbot_package;
        payload.total_sessions = protocolForm.hbot_package === 'Single' ? 1 : 
                                 protocolForm.hbot_package === '5 Pack' ? 5 : 10;
        payload.delivery_method = 'in_clinic';
        break;
      case 'rlt':
        payload.program_name = protocolForm.rlt_package;
        payload.total_sessions = protocolForm.rlt_package === 'Single' ? 1 : 
                                 protocolForm.rlt_package === '5 Pack' ? 5 : 10;
        payload.delivery_method = 'in_clinic';
        break;
      case 'injection':
        payload.program_name = protocolForm.injection_package;
        payload.medication = protocolForm.injection_type;
        payload.total_sessions = protocolForm.injection_package === 'Single' ? 1 : 
                                 protocolForm.injection_package === '5 Pack' ? 5 : 10;
        payload.delivery_method = protocolForm.injection_delivery;
        break;
    }

    try {
      const res = await fetch('/api/protocols/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.success) {
        showToast('Protocol created!');
        closeStartModal();
        fetchData();
      } else {
        showToast(result.error || 'Failed to create protocol', 'error');
      }
    } catch (err) {
      showToast('Error creating protocol', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== LOG ACTIVITY MODAL ==========
  const openLogModal = (protocol) => {
    setLogModal(protocol);
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      log_type: getDefaultLogType(protocol.category)
    });
  };

  const closeLogModal = () => {
    setLogModal(null);
    setLogForm({});
  };

  const getDefaultLogType = (category) => {
    switch (category) {
      case 'weight_loss': return 'injection';
      case 'hrt': return 'injection';
      case 'peptide': return 'session';
      default: return 'session';
    }
  };

  const submitLog = async () => {
    if (!logModal) return;
    setSubmitting(true);
    
    const category = logModal.category;
    let endpoint = '/api/injection-logs';
    
    const payload = {
      patient_id: logModal.patient_id,
      ghl_contact_id: logModal.ghl_contact_id,
      protocol_id: logModal.id,
      entry_type: logForm.log_type === 'pickup' ? 'pickup' : 'injection',
      entry_date: logForm.date,
      category: category,
      medication: logModal.medication || logModal.program_name,
      dosage: logForm.dosage || logModal.dose,
      notes: logForm.notes || null
    };

    // Add category-specific fields
    if (category === 'weight_loss') {
      payload.weight = logForm.weight;
    } else if (category === 'hrt' && logForm.log_type === 'pickup') {
      payload.supply_type = logForm.supply_type;
      payload.quantity = logForm.quantity || 1;
    } else if (category === 'hrt' && logForm.log_type === 'blood_draw') {
      endpoint = '/api/ghl/log-hrt-blooddraw';
      payload.contact_id = logModal.ghl_contact_id;
      payload.panel_type = logForm.panel_type;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.success) {
        showToast('Activity logged!');
        closeLogModal();
        fetchData();
      } else {
        showToast(result.error || 'Failed to log activity', 'error');
      }
    } catch (err) {
      showToast('Error logging activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Render protocol row
  const renderRow = (protocol) => {
    const badge = getCategoryBadge(protocol.category);
    const isOverdue = protocol.days_remaining !== undefined && protocol.days_remaining <= 0;
    const isEndingSoon = protocol.urgency === 'ending_soon';
    
    return (
      <tr key={protocol.id} style={styles.row}>
        <td style={styles.cell}>
          <a href={`/admin/patient/${protocol.patient_id}`} style={styles.patientLink}>
            {protocol.patient_name || 'Unknown'}
          </a>
        </td>
        <td style={styles.cell}>
          <span style={{ ...styles.categoryBadge, background: badge.color }}>
            {badge.emoji}
          </span>
          {protocol.medication || protocol.program_name || '-'}
        </td>
        <td style={styles.cell}>{protocol.dose || '-'}</td>
        <td style={styles.cell}>{getDuration(protocol)}</td>
        <td style={styles.cell}>
          <div>{formatDate(protocol.last_refill_date || protocol.start_date)}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {protocol.last_refill_date ? 'Last refill' : 'Started'}
          </div>
        </td>
        <td style={styles.cell}>
          <span style={{
            ...styles.daysLeft,
            color: isOverdue ? '#dc2626' : isEndingSoon ? '#f59e0b' : '#059669',
            background: isOverdue ? '#fef2f2' : isEndingSoon ? '#fffbeb' : '#f0fdf4'
          }}>
            {protocol.status_text}
          </span>
        </td>
        <td style={styles.cell}>
          <span style={{
            ...styles.deliveryBadge,
            background: protocol.delivery === 'take_home' ? '#dbeafe' : '#f3f4f6',
            color: protocol.delivery === 'take_home' ? '#1d4ed8' : '#374151'
          }}>
            {protocol.delivery === 'take_home' ? 'TAKE HOME' : 'IN CLINIC'}
          </span>
        </td>
        <td style={styles.cellActions}>
          <button 
            style={{ ...styles.actionBtn, ...styles.logBtn }}
            onClick={() => openLogModal(protocol)}
            title="Log Activity"
          >
            ➕ Log
          </button>
          <button 
            style={styles.actionBtn}
            onClick={() => openGHLConversation(protocol.ghl_contact_id)}
            title="Open SMS in GHL"
          >
            📱 SMS
          </button>
          <button 
            style={styles.actionBtn}
            onClick={() => openGHL(protocol.ghl_contact_id)}
            title="Open in GHL"
          >
            ↗ GHL
          </button>
          {/* Only show Extend for peptide protocols - HRT uses Refill via Log button */}
          {protocol.category === 'peptide' && (isEndingSoon || isOverdue || protocol.status === 'completed') && (
            <button 
              style={{ ...styles.actionBtn, ...styles.renewBtn }}
              onClick={() => openRenewModal(protocol)}
              title="Extend Protocol"
            >
              ⏳
            </button>
          )}
          {/* Admin-only delete button - add ?admin=true to URL */}
          {isAdmin && (
            <button 
              style={{ ...styles.actionBtn, ...styles.deleteBtn }}
              onClick={() => deleteProtocol(protocol)}
              title="Delete Protocol"
            >
              🗑️
            </button>
          )}
        </td>
      </tr>
    );
  };

  // Render table
  const renderTable = () => {
    const protocols = getFilteredProtocols();
    
    if (protocols.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p>No protocols found</p>
        </div>
      );
    }

    return (
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>PATIENT</th>
              <th style={styles.headerCell}>MEDICATION</th>
              <th style={styles.headerCell}>DOSE</th>
              <th style={styles.headerCell}>PROGRAM</th>
              <th style={styles.headerCell}>LAST ACTIVITY</th>
              <th style={styles.headerCell}>STATUS</th>
              <th style={styles.headerCell}>DELIVERY</th>
              <th style={styles.headerCell}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map(p => renderRow(p))}
          </tbody>
        </table>
      </div>
    );
  };

  // ========== RENDER START PROTOCOL FORM FIELDS ==========
  const renderProtocolFields = () => {
    switch (protocolType) {
      case 'weight_loss':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Medication *</label>
              <select
                value={protocolForm.wl_medication || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, wl_medication: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select medication...</option>
                <option value="Semaglutide">Semaglutide</option>
                <option value="Tirzepatide">Tirzepatide</option>
                <option value="Retatrutide">Retatrutide</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Starting Dose</label>
              <select
                value={protocolForm.wl_starting_dose || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, wl_starting_dose: e.target.value })}
                style={styles.formSelect}
              >
                <option value="">Select dose...</option>
                {['0.25mg', '0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Delivery *</label>
              <select
                value={protocolForm.wl_delivery || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, wl_delivery: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select delivery...</option>
                <option value="in_clinic">In Clinic - Patient comes in weekly</option>
                <option value="take_home">Take Home - Patient self-injects</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Total Injections</label>
              <select
                value={protocolForm.wl_total_injections || '4'}
                onChange={(e) => setProtocolForm({ ...protocolForm, wl_total_injections: e.target.value })}
                style={styles.formSelect}
              >
                <option value="4">4 (Monthly)</option>
                <option value="8">8 (2 Months)</option>
                <option value="12">12 (3 Months)</option>
              </select>
            </div>
          </>
        );
        
      case 'peptide':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Program Duration *</label>
              <select
                value={protocolForm.peptide_program || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, peptide_program: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select program...</option>
                <option value="7 Day">7 Day</option>
                <option value="10 Day">10 Day</option>
                <option value="20 Day">20 Day</option>
                <option value="30 Day">30 Day</option>
                <option value="Vial">Vial</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Peptide *</label>
              <select
                value={protocolForm.peptide_medication || ''}
                onChange={(e) => {
                  const selected = e.target.value;
                  const allOptions = PEPTIDE_OPTIONS.flatMap(g => g.options);
                  const opt = allOptions.find(o => o.value === selected);
                  // Auto-select frequency based on peptide
                  let autoFrequency = protocolForm.peptide_frequency || 'Daily';
                  if (selected === 'MOTS-c') {
                    autoFrequency = '1x every 5 days';
                  }
                  setProtocolForm({ 
                    ...protocolForm, 
                    peptide_medication: selected,
                    peptide_dosage: opt?.dose || '',
                    peptide_frequency: autoFrequency
                  });
                }}
                style={styles.formSelect}
                required
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
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Dosage</label>
              <input
                type="text"
                value={protocolForm.peptide_dosage || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, peptide_dosage: e.target.value })}
                placeholder="e.g. 500mcg"
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Frequency</label>
              <select
                value={protocolForm.peptide_frequency || 'Daily'}
                onChange={(e) => setProtocolForm({ ...protocolForm, peptide_frequency: e.target.value })}
                style={styles.formSelect}
              >
                <option value="Daily">Daily</option>
                <option value="1x daily (AM)">1x daily (AM)</option>
                <option value="1x daily (PM/bedtime)">1x daily (PM/bedtime)</option>
                <option value="2x daily">2x daily</option>
                <option value="5 days on / 2 days off">5 days on / 2 days off</option>
                <option value="Every other day">Every other day</option>
                <option value="1x every 5 days">1x every 5 days</option>
                <option value="3x per week">3x per week</option>
                <option value="2x per week">2x per week</option>
                <option value="1x per week">1x per week</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Delivery *</label>
              <select
                value={protocolForm.peptide_delivery || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, peptide_delivery: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select delivery...</option>
                <option value="in_clinic">In Clinic</option>
                <option value="take_home">Take Home</option>
              </select>
            </div>
          </>
        );
        
      case 'hrt':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>HRT Type *</label>
              <select
                value={protocolForm.hrt_type || 'male'}
                onChange={(e) => setProtocolForm({ ...protocolForm, hrt_type: e.target.value })}
                style={styles.formSelect}
              >
                <option value="male">Male HRT (200mg/ml)</option>
                <option value="female">Female HRT (100mg/ml)</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Medication</label>
              <select
                value={protocolForm.hrt_medication || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, hrt_medication: e.target.value })}
                style={styles.formSelect}
              >
                <option value="">Select medication...</option>
                <option value="Testosterone Cypionate">Testosterone Cypionate</option>
                <option value="Testosterone Enanthate">Testosterone Enanthate</option>
                <option value="Nandrolone">Nandrolone</option>
                <option value="HCG">HCG</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Dosage *</label>
              <select
                value={protocolForm.hrt_dosage || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, hrt_dosage: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select dose...</option>
                {(TESTOSTERONE_DOSES[protocolForm.hrt_type || 'male'] || []).map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Delivery *</label>
              <select
                value={protocolForm.hrt_delivery || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, hrt_delivery: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select delivery...</option>
                <option value="in_clinic">In Clinic (2x/week injections)</option>
                <option value="take_home">Take Home (Self-inject)</option>
              </select>
            </div>
            {protocolForm.hrt_delivery === 'take_home' && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Supply Type</label>
                <select
                  value={protocolForm.hrt_supply_type || ''}
                  onChange={(e) => setProtocolForm({ ...protocolForm, hrt_supply_type: e.target.value })}
                  style={styles.formSelect}
                >
                  <option value="">Select type...</option>
                  <option value="prefilled_2week">Pre-filled 2 Week (4 injections)</option>
                  <option value="prefilled_4week">Pre-filled 4 Week (8 injections)</option>
                  <option value="vial_5ml">Vial 5ml</option>
                  <option value="vial_10ml">Vial 10ml</option>
                </select>
              </div>
            )}
          </>
        );
        
      case 'iv':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Package *</label>
              <select
                value={protocolForm.iv_package || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, iv_package: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select package...</option>
                <option value="Single">Single Session</option>
                <option value="5 Pack">5 Pack</option>
                <option value="10 Pack">10 Pack</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>IV Type</label>
              <select
                value={protocolForm.iv_type || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, iv_type: e.target.value })}
                style={styles.formSelect}
              >
                <option value="">Select type...</option>
                <option value="Myers Cocktail">Myers Cocktail</option>
                <option value="NAD+">NAD+</option>
                <option value="High Dose Vitamin C">High Dose Vitamin C</option>
                <option value="Hydration">Hydration</option>
                <option value="Immunity">Immunity</option>
                <option value="Recovery">Recovery</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div style={styles.infoBox}>ℹ️ All IV Therapy sessions are In Clinic</div>
          </>
        );
        
      case 'hbot':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Package *</label>
              <select
                value={protocolForm.hbot_package || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, hbot_package: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select package...</option>
                <option value="Single">Single Session</option>
                <option value="5 Pack">5 Pack</option>
                <option value="10 Pack">10 Pack</option>
              </select>
            </div>
            <div style={styles.infoBox}>ℹ️ All HBOT sessions are In Clinic</div>
          </>
        );
        
      case 'rlt':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Package *</label>
              <select
                value={protocolForm.rlt_package || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, rlt_package: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select package...</option>
                <option value="Single">Single Session</option>
                <option value="5 Pack">5 Pack</option>
                <option value="10 Pack">10 Pack</option>
              </select>
            </div>
            <div style={styles.infoBox}>ℹ️ All Red Light sessions are In Clinic</div>
          </>
        );
        
      case 'injection':
        return (
          <>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Package *</label>
              <select
                value={protocolForm.injection_package || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, injection_package: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select package...</option>
                <option value="Single">Single Session</option>
                <option value="5 Pack">5 Pack</option>
                <option value="10 Pack">10 Pack</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Injection Type</label>
              <input
                type="text"
                value={protocolForm.injection_type || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, injection_type: e.target.value })}
                placeholder="e.g. B12, Glutathione, Lipo-C"
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Delivery *</label>
              <select
                value={protocolForm.injection_delivery || ''}
                onChange={(e) => setProtocolForm({ ...protocolForm, injection_delivery: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select delivery...</option>
                <option value="in_clinic">In Clinic</option>
                <option value="take_home">Take Home</option>
              </select>
            </div>
          </>
        );
        
      default:
        return <p style={{ color: '#6b7280' }}>Select a protocol type above.</p>;
    }
  };

  // ========== RENDER LOG FORM FIELDS ==========
  const renderLogFields = () => {
    if (!logModal) return null;
    const category = logModal.category;
    
    if (category === 'weight_loss') {
      return (
        <>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Current Weight (lbs) *</label>
            <input
              type="number"
              step="0.1"
              value={logForm.weight || ''}
              onChange={(e) => setLogForm({ ...logForm, weight: e.target.value })}
              placeholder="e.g. 215.5"
              style={styles.formInput}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Dose</label>
            <select
              value={logForm.dosage || logModal.dose || ''}
              onChange={(e) => setLogForm({ ...logForm, dosage: e.target.value })}
              style={styles.formSelect}
            >
              <option value="">Same as protocol ({logModal.dose})</option>
              {['0.25mg', '0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </>
      );
    }
    
    if (category === 'hrt') {
      return (
        <>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Log Type *</label>
            <select
              value={logForm.log_type || 'injection'}
              onChange={(e) => setLogForm({ ...logForm, log_type: e.target.value })}
              style={styles.formSelect}
            >
              <option value="injection">💉 In-Clinic Injection</option>
              <option value="pickup">📦 Medication Pickup</option>
              <option value="blood_draw">🩸 Blood Draw</option>
            </select>
          </div>
          
          {logForm.log_type === 'injection' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Dose Administered</label>
                <input
                  type="text"
                  value={logForm.dosage || logModal.dose || ''}
                  onChange={(e) => setLogForm({ ...logForm, dosage: e.target.value })}
                  placeholder={logModal.dose || 'e.g. 100mg'}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Injection Site</label>
                <select
                  value={logForm.site || ''}
                  onChange={(e) => setLogForm({ ...logForm, site: e.target.value })}
                  style={styles.formSelect}
                >
                  <option value="">Select site...</option>
                  <option value="Deltoid - Left">Deltoid - Left</option>
                  <option value="Deltoid - Right">Deltoid - Right</option>
                  <option value="Glute - Left">Glute - Left</option>
                  <option value="Glute - Right">Glute - Right</option>
                  <option value="Thigh - Left">Thigh - Left</option>
                  <option value="Thigh - Right">Thigh - Right</option>
                </select>
              </div>
            </>
          )}
          
          {logForm.log_type === 'pickup' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Supply Type *</label>
                <select
                  value={logForm.supply_type || ''}
                  onChange={(e) => setLogForm({ ...logForm, supply_type: e.target.value })}
                  style={styles.formSelect}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="prefilled_2week">Pre-filled 2 Week (4 injections)</option>
                  <option value="prefilled_4week">Pre-filled 4 Week (8 injections)</option>
                  <option value="vial_5ml">Vial 5ml</option>
                  <option value="vial_10ml">Vial 10ml</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Dose</label>
                <input
                  type="text"
                  value={logForm.dosage || logModal.dose || ''}
                  onChange={(e) => setLogForm({ ...logForm, dosage: e.target.value })}
                  placeholder={logModal.dose || 'e.g. 0.4ml/80mg'}
                  style={styles.formInput}
                />
              </div>
            </>
          )}
          
          {logForm.log_type === 'blood_draw' && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Panel Type *</label>
              <select
                value={logForm.panel_type || ''}
                onChange={(e) => setLogForm({ ...logForm, panel_type: e.target.value })}
                style={styles.formSelect}
                required
              >
                <option value="">Select panel...</option>
                <option value="Essential Panel">Essential Panel</option>
                <option value="Elite Panel">Elite Panel</option>
                <option value="Follow Up Panel">Follow Up Panel</option>
              </select>
            </div>
          )}
        </>
      );
    }
    
    // Default for peptide, IV, HBOT, RLT, injection
    return (
      <div style={styles.infoBox}>
        ✓ Logging session for {logModal.medication || logModal.program_name}
      </div>
    );
  };

  // Main render
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading protocols...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Protocol Pipeline | Range Medical</title>
      </Head>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>💊 Protocol Pipeline</h1>
          
          <div style={styles.headerActions}>
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            
            <div style={styles.tabs}>
              {['active', 'completed'].map(status => (
                <button
                  key={status}
                  style={{
                    ...styles.tab,
                    ...(statusFilter === status ? styles.tabActive : {})
                  }}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            <div style={styles.tabs}>
              {[
                { value: 'all', label: 'All' },
                { value: 'in_clinic', label: 'In Clinic' },
                { value: 'take_home', label: 'Take Home' }
              ].map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.tab,
                    ...(deliveryFilter === opt.value ? styles.tabActive : {})
                  }}
                  onClick={() => setDeliveryFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <button style={styles.refreshBtn} onClick={fetchData}>
              ↻ Refresh
            </button>
            
            <a href="/admin/activity-log" style={styles.activityLogBtn}>
              📋 Activity Log
            </a>
            
            <button style={styles.startProtocolBtn} onClick={openStartModal}>
              ➕ Start Protocol
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div style={styles.statsBar}>
            <div style={{ ...styles.statCard, borderLeftColor: '#dc2626' }}>
              <div style={styles.statLabel}>ENDING SOON (≤3 DAYS)</div>
              <div style={styles.statValue}>{data.counts.ending_soon}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#f59e0b' }}>
              <div style={styles.statLabel}>ACTIVE (4-14 DAYS)</div>
              <div style={styles.statValue}>{data.counts.active}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#22c55e' }}>
              <div style={styles.statLabel}>JUST STARTED (15+ DAYS)</div>
              <div style={styles.statValue}>{data.counts.just_started}</div>
            </div>
            <div style={{ ...styles.statCard, borderLeftColor: '#6b7280' }}>
              <div style={styles.statLabel}>NEEDS FOLLOW-UP</div>
              <div style={styles.statValue}>{data.counts.needs_followup}</div>
            </div>
          </div>
        )}

        {/* Recent Payments Needing Protocol */}
        {data?.purchases?.needs_protocol?.length > 0 && (
          <div style={styles.purchasesSection}>
            <div style={styles.purchasesHeader}>
              <h3 style={styles.purchasesTitle}>
                💳 Payments Needing Protocol ({data.purchases.needs_protocol.length})
              </h3>
              <span style={styles.purchasesSubtitle}>
                Since {formatDate(data.purchases.since_date)}
              </span>
            </div>
            <div style={styles.purchasesTable}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={styles.headerCell}>DATE</th>
                    <th style={styles.headerCell}>PATIENT</th>
                    <th style={styles.headerCell}>PRODUCT</th>
                    <th style={styles.headerCell}>AMOUNT</th>
                    <th style={styles.headerCell}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {data.purchases.needs_protocol.map(purchase => (
                    <tr key={purchase.id} style={styles.row}>
                      <td style={styles.cell}>{formatDate(purchase.purchase_date)}</td>
                      <td style={styles.cell}>
                        <strong>{purchase.patient_name || 'Unknown'}</strong>
                      </td>
                      <td style={styles.cell}>
                        <span style={{
                          ...styles.categoryBadge,
                          background: getCategoryBadge(purchase.category).color
                        }}>
                          {getCategoryBadge(purchase.category).emoji}
                        </span>
                        {purchase.item_name}
                      </td>
                      <td style={styles.cell}>
                        ${(purchase.amount || 0).toFixed(2)}
                      </td>
                      <td style={styles.cell}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.startBtn }}
                          onClick={() => {
                            console.log('=== START BUTTON CLICKED ===');
                            console.log('Purchase:', purchase);
                            console.log('Purchase ghl_contact_id:', purchase.ghl_contact_id);
                            console.log('Patients loaded:', patients.length);
                            
                            // Try multiple ways to find the patient
                            let patient = null;
                            
                            // 1. Try by patient_id first (most reliable)
                            if (purchase.patient_id) {
                              patient = patients.find(p => p.id === purchase.patient_id);
                              console.log('Found by patient_id:', patient);
                            }
                            
                            // 2. Try by ghl_contact_id
                            if (!patient && purchase.ghl_contact_id) {
                              patient = patients.find(p => p.ghl_contact_id === purchase.ghl_contact_id);
                              console.log('Found by ghl_contact_id:', patient);
                            }
                            
                            // 3. Try by name match (check both first+last and name field)
                            if (!patient && purchase.patient_name) {
                              const purchaseName = purchase.patient_name.toLowerCase().trim();
                              patient = patients.find(p => {
                                const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
                                const altName = (p.name || '').toLowerCase().trim();
                                return fullName === purchaseName || altName === purchaseName;
                              });
                              console.log('Found by name:', patient);
                            }
                            
                            console.log('Final patient found:', patient);
                            
                            // Set the patient if found
                            if (patient) {
                              setSelectedPatient(patient);
                              const displayName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || '';
                              setPatientSearch(displayName);
                              setShowPatientDropdown(false);
                              console.log('Patient selected:', patient.id, displayName);
                            } else {
                              // Not found - show alert
                              console.log('NO PATIENT FOUND!');
                              alert('Patient not found in database. Please search manually.');
                              setSelectedPatient(null);
                              setPatientSearch(purchase.patient_name || '');
                            }
                            
                            // Set protocol type based on category
                            const categoryMap = {
                              'peptide': 'peptide',
                              'hrt': 'hrt',
                              'weight_loss': 'weight_loss',
                              'weight loss': 'weight_loss',
                              'iv': 'iv',
                              'iv_therapy': 'iv',
                              'hbot': 'hbot',
                              'rlt': 'rlt'
                            };
                            const mappedType = categoryMap[(purchase.category || '').toLowerCase()] || '';
                            setProtocolType(mappedType);
                            setSelectedPurchase(purchase);
                            setStartModal(true);
                          }}
                          title="Start Protocol"
                        >
                          + Start
                        </button>
                        <button
                          style={styles.actionBtn}
                          onClick={() => openGHL(purchase.ghl_contact_id)}
                          title="Open in GHL"
                        >
                          GHL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={styles.categoryFilters}>
          {[
            { value: 'all', label: 'All Types', emoji: '📋' },
            { value: 'peptide', label: 'Peptide', emoji: '🧬' },
            { value: 'weight_loss', label: 'Weight Loss', emoji: '💉' },
            { value: 'hrt', label: 'HRT', emoji: '💊' },
            { value: 'iv', label: 'IV', emoji: '💧' },
            { value: 'hbot', label: 'HBOT', emoji: '🫁' },
            { value: 'rlt', label: 'RLT', emoji: '🔴' }
          ].map(cat => (
            <button
              key={cat.value}
              style={{
                ...styles.categoryTab,
                ...(categoryFilter === cat.value ? styles.categoryTabActive : {})
              }}
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {renderTable()}

        {/* ========== START PROTOCOL MODAL ========== */}
        {startModal && (
          <div style={styles.modalOverlay} onClick={closeStartModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>➕ Start New Protocol</h2>
              
              {/* Patient Search */}
              {!selectedPatient ? (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Search Patient *</label>
                  <input
                    type="text"
                    placeholder="Start typing patient name..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    style={styles.formInput}
                  />
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div style={styles.searchDropdown}>
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          style={styles.searchResult}
                          onClick={() => selectPatient(p)}
                        >
                          <div style={{ fontWeight: '500' }}>
                            {p.first_name} {p.last_name || p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {p.ghl_contact_id ? `GHL: ${p.ghl_contact_id}` : 'No GHL ID'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.selectedPatientBadge}>
                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {selectedPatient.first_name} {selectedPatient.last_name || selectedPatient.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedPatient.ghl_contact_id ? `GHL: ${selectedPatient.ghl_contact_id}` : 'No GHL ID'}
                    </div>
                  </div>
                  <button
                    style={styles.changeBtn}
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change
                  </button>
                </div>
              )}
              
              {/* Protocol Type */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Protocol Type *</label>
                <select
                  value={protocolType}
                  onChange={(e) => {
                    setProtocolType(e.target.value);
                    setProtocolForm({ ...protocolForm, start_date: protocolForm.start_date });
                  }}
                  style={styles.formSelect}
                >
                  <option value="">Select type...</option>
                  <option value="weight_loss">💉 Weight Loss</option>
                  <option value="peptide">🧬 Peptide Protocol</option>
                  <option value="hrt">💊 HRT Protocol</option>
                  <option value="iv">💧 IV Therapy</option>
                  <option value="hbot">🫁 HBOT (Hyperbaric)</option>
                  <option value="rlt">🔴 Red Light Therapy</option>
                  <option value="injection">💉 Injection Pack</option>
                </select>
              </div>
              
              {/* Protocol-specific fields */}
              {renderProtocolFields()}
              
              {/* Start Date */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Start Date *</label>
                <input
                  type="date"
                  value={protocolForm.start_date || ''}
                  onChange={(e) => setProtocolForm({ ...protocolForm, start_date: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
              
              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  value={protocolForm.notes || ''}
                  onChange={(e) => setProtocolForm({ ...protocolForm, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  style={styles.formTextarea}
                />
              </div>
              
              <div style={styles.modalActions}>
                <button style={styles.modalCancelBtn} onClick={closeStartModal}>
                  Cancel
                </button>
                <button
                  style={styles.modalConfirmBtn}
                  onClick={submitStartProtocol}
                  disabled={submitting || !selectedPatient || !protocolType}
                >
                  {submitting ? 'Creating...' : 'Start Protocol'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== LOG ACTIVITY MODAL ========== */}
        {logModal && (
          <div style={styles.modalOverlay} onClick={closeLogModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>➕ Log Activity</h2>
              
              <div style={styles.selectedPatientBadge}>
                <div>
                  <div style={{ fontWeight: '600' }}>{logModal.patient_name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {getCategoryBadge(logModal.category).emoji} {logModal.medication || logModal.program_name}
                  </div>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date *</label>
                <input
                  type="date"
                  value={logForm.date || ''}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
              
              {renderLogFields()}
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  value={logForm.notes || ''}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Any observations..."
                  style={styles.formTextarea}
                />
              </div>
              
              <div style={styles.modalActions}>
                <button style={styles.modalCancelBtn} onClick={closeLogModal}>
                  Cancel
                </button>
                <button
                  style={styles.modalConfirmBtn}
                  onClick={submitLog}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Log Activity'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== RENEW MODAL ========== */}
        {renewModal && (
          <div style={styles.modalOverlay} onClick={closeRenewModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>⏳ Extend Peptide Protocol</h2>
              
              <div style={styles.selectedPatientBadge}>
                <div>
                  <div style={{ fontWeight: '600' }}>{renewModal.protocol.patient_name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {renewModal.protocol.medication || renewModal.protocol.program_name}
                  </div>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Extension Start Date</label>
                <input
                  type="date"
                  value={renewModal.startDate}
                  onChange={(e) => setRenewModal({ ...renewModal, startDate: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Add Days</label>
                <select
                  value={renewModal.duration}
                  onChange={(e) => setRenewModal({ ...renewModal, duration: e.target.value })}
                  style={styles.formSelect}
                >
                  <option value="7">+ 7 days</option>
                  <option value="10">+ 10 days</option>
                  <option value="14">+ 14 days</option>
                  <option value="20">+ 20 days</option>
                  <option value="30">+ 30 days</option>
                  <option value="60">+ 60 days</option>
                  <option value="90">+ 90 days</option>
                </select>
              </div>
              
              <div style={styles.modalActions}>
                <button style={styles.modalCancelBtn} onClick={closeRenewModal}>
                  Cancel
                </button>
                <button
                  style={styles.modalConfirmBtn}
                  onClick={confirmRenew}
                  disabled={renewingId === renewModal.protocol.id}
                >
                  {renewingId === renewModal.protocol.id ? 'Extending...' : 'Extend Protocol'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            ...styles.toast,
            background: toast.type === 'error' ? '#dc2626' : '#22c55e'
          }}>
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    color: '#dc2626'
  },
  header: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  searchInput: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '200px',
    outline: 'none'
  },
  tabs: {
    display: 'flex',
    gap: '4px'
  },
  tab: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  tabActive: {
    background: '#111',
    color: 'white',
    borderColor: '#111'
  },
  refreshBtn: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  startProtocolBtn: {
    padding: '8px 20px',
    border: 'none',
    background: '#111',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  activityLogBtn: {
    padding: '8px 16px',
    border: '2px solid #e5e7eb',
    background: 'white',
    color: '#374151',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    display: 'inline-block'
  },
  purchasesSection: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    background: '#fffbeb',
    borderRadius: '12px',
    border: '2px solid #f59e0b',
    overflow: 'hidden'
  },
  purchasesHeader: {
    padding: '16px 20px',
    background: '#fef3c7',
    borderBottom: '1px solid #fcd34d',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  purchasesTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#92400e'
  },
  purchasesSubtitle: {
    fontSize: '13px',
    color: '#b45309'
  },
  purchasesTable: {
    background: 'white'
  },
  startBtn: {
    background: '#f0fdf4',
    borderColor: '#22c55e',
    color: '#166534'
  },
  statsBar: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    borderLeft: '4px solid #e5e7eb'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111'
  },
  categoryFilters: {
    maxWidth: '1400px',
    margin: '0 auto 20px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  categoryTab: {
    padding: '8px 14px',
    border: '2px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  categoryTabActive: {
    background: '#111',
    color: 'white',
    borderColor: '#111'
  },
  tableContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: '0.5px'
  },
  row: {
    borderBottom: '1px solid #f3f4f6'
  },
  cell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111'
  },
  cellActions: {
    padding: '12px 16px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '500'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginRight: '8px'
  },
  daysLeft: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  deliveryBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  actionBtn: {
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  },
  logBtn: {
    background: '#f0fdf4',
    borderColor: '#22c55e',
    color: '#166534'
  },
  renewBtn: {
    background: '#fffbeb',
    borderColor: '#f59e0b',
    color: '#92400e'
  },
  deleteBtn: {
    background: '#fef2f2',
    borderColor: '#dc2626',
    color: '#dc2626'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    color: '#6b7280',
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px'
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
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#111'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  modalCancelBtn: {
    padding: '10px 20px',
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  modalConfirmBtn: {
    padding: '10px 20px',
    border: 'none',
    background: '#111',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  
  // Form styles
  formGroup: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white'
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  infoBox: {
    background: '#f3f4f6',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151'
  },
  
  // Patient search
  searchDropdown: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '200px',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  searchResult: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6'
  },
  selectedPatientBadge: {
    background: '#f3f4f6',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  changeBtn: {
    padding: '4px 12px',
    border: '1px solid #d1d5db',
    background: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#6b7280'
  },
  
  // Toast
  toast: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 1001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }
};
