// /pages/admin/injection-logs.js
// Injection Logs - Track injections and medication pickups
// Range Medical
// UPDATED: 2026-01-16 - Fixed female HRT dosages, syncs with protocols

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// MEDICATION OPTIONS
// ============================================

const TESTOSTERONE_OPTIONS = {
  male: {
    label: 'Male HRT (200mg/ml)',
    medication: 'Testosterone Cypionate 200mg/ml',
    dosages: [
      { value: '0.3ml/60mg', label: '0.3ml (60mg)' },
      { value: '0.35ml/70mg', label: '0.35ml (70mg)' },
      { value: '0.4ml/80mg', label: '0.4ml (80mg)' },
      { value: '0.5ml/100mg', label: '0.5ml (100mg)' },
      { value: 'custom', label: 'Custom dose' }
    ]
  },
  female: {
    label: 'Female HRT (100mg/ml)',
    medication: 'Testosterone Cypionate 100mg/ml',
    dosages: [
      { value: '0.1ml/10mg', label: '0.1ml (10mg)' },
      { value: '0.15ml/15mg', label: '0.15ml (15mg)' },
      { value: '0.2ml/20mg', label: '0.2ml (20mg)' },
      { value: '0.25ml/25mg', label: '0.25ml (25mg)' },
      { value: '0.3ml/30mg', label: '0.3ml (30mg)' },
      { value: '0.4ml/40mg', label: '0.4ml (40mg)' },
      { value: '0.5ml/50mg', label: '0.5ml (50mg)' },
      { value: 'custom', label: 'Custom dose' }
    ]
  }
};

const TESTOSTERONE_PICKUP_OPTIONS = {
  prefilled: {
    label: 'Prefilled Syringes',
    quantities: [4, 8]
  },
  vial: {
    label: 'Vial',
    quantities: [1]
  }
};

const WEIGHT_LOSS_OPTIONS = {
  medications: [
    { value: 'Semaglutide', label: 'Semaglutide' },
    { value: 'Tirzepatide', label: 'Tirzepatide' },
    { value: 'Retatrutide', label: 'Retatrutide' }
  ],
  dosages: {
    Semaglutide: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'],
    Tirzepatide: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
    Retatrutide: ['1mg', '2mg', '4mg', '6mg', '8mg', '10mg', '12mg']
  }
};

const VITAMIN_OPTIONS = [
  { value: 'B12', label: 'B12' },
  { value: 'B-Complex', label: 'B-Complex' },
  { value: 'Amino Blend', label: 'Amino Blend' },
  { value: 'Biotin', label: 'Biotin' },
  { value: 'Vitamin D3', label: 'Vitamin D3' },
  { value: 'Glutathione', label: 'Glutathione' },
  { value: 'NAD+ 50mg', label: 'NAD+ 50mg' },
  { value: 'NAD+ 100mg', label: 'NAD+ 100mg' },
  { value: 'L-Carnitine', label: 'L-Carnitine' },
  { value: 'Lipo-C', label: 'Lipo-C' }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function InjectionLogs() {
  const router = useRouter();
  const { patient_id } = router.query;
  
  const [activeTab, setActiveTab] = useState('testosterone');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    log_type: 'injection',
    category: 'testosterone',
    hrt_type: 'male',
    medication: '',
    dosage: '',
    custom_dosage: '',
    pickup_type: 'vial',
    quantity: 1,
    week_supply: 4,
    entry_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  // Edit mode
  const [editingLog, setEditingLog] = useState(null);
  
  // Patient search
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // Load logs
  useEffect(() => {
    fetchLogs();
    fetchPatients();
  }, [activeTab]);

  // Pre-select patient if passed in URL
  useEffect(() => {
    if (patient_id && patients.length > 0) {
      const patient = patients.find(p => p.id === patient_id);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patient_id: patient.id,
          patient_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
        }));
        setPatientSearch(`${patient.first_name || ''} ${patient.last_name || ''}`.trim());
      }
    }
  }, [patient_id, patients]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/injection-logs?category=${activeTab}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      const res = await fetch('/api/patients?limit=2000');
      const data = await res.json();
      console.log('Patients response:', data);
      if (data.patients && data.patients.length > 0) {
        setPatients(data.patients);
        console.log('Loaded', data.patients.length, 'patients');
      } else if (data.error) {
        console.error('API error:', data.error);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Filter patients based on search
  useEffect(() => {
    if (patientSearch.length >= 1 && patients.length > 0) {
      const term = patientSearch.toLowerCase();
      const filtered = patients.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
        const altName = (p.name || '').toLowerCase();
        const phone = (p.phone || '').replace(/\D/g, '');
        const email = (p.email || '').toLowerCase();
        return fullName.includes(term) || altName.includes(term) || phone.includes(term) || email.includes(term);
      }).slice(0, 10);
      setFilteredPatients(filtered);
      setShowPatientDropdown(filtered.length > 0);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  }, [patientSearch, patients]);

  const selectPatient = (patient) => {
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || patient.email || 'Unknown';
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: name
    }));
    setPatientSearch(name);
    setShowPatientDropdown(false);
  };

  const openModal = () => {
    setEditingLog(null);
    // Make sure patients are loaded
    if (patients.length === 0) {
      fetchPatients();
    }
    setPatientSearch('');
    setFormData(prev => ({
      ...prev,
      patient_id: '',
      patient_name: '',
      category: activeTab,
      log_type: 'injection',
      dosage: '',
      custom_dosage: '',
      medication: activeTab === 'weight_loss' ? 'Semaglutide' : '',
      notes: '',
      entry_date: new Date().toISOString().split('T')[0]
    }));
    setShowModal(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    
    // Parse the log data to fill the form
    const isPickup = log.entry_type === 'pickup';
    const isMale = (log.medication || '').toLowerCase().includes('male');
    
    setFormData({
      patient_id: log.patient_id,
      patient_name: log.patient_name || '',
      log_type: log.entry_type || 'injection',
      category: log.category || activeTab,
      hrt_type: isMale ? 'male' : 'female',
      medication: log.medication || '',
      dosage: log.dosage || '',
      custom_dosage: '',
      pickup_type: (log.supply_type || '').includes('vial') ? 'vial' : 'prefilled',
      quantity: log.quantity || 1,
      week_supply: log.quantity || 4,
      entry_date: (log.entry_date || log.created_at || '').split('T')[0],
      notes: log.notes || ''
    });
    setPatientSearch(log.patient_name || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPatientSearch('');
    setFormData(prev => ({
      ...prev,
      patient_id: '',
      patient_name: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      alert('Please select a patient');
      return;
    }

    // Build payload
    const payload = {
      patient_id: formData.patient_id,
      category: activeTab,
      entry_type: formData.log_type,
      entry_date: formData.entry_date,
      notes: formData.notes || null
    };

    // Add category-specific fields
    if (activeTab === 'testosterone') {
      payload.medication = formData.hrt_type === 'male' ? 'Male HRT' : 'Female HRT';
      
      if (formData.log_type === 'injection') {
        payload.dosage = formData.dosage === 'custom' ? formData.custom_dosage : formData.dosage;
      } else {
        // Pickup
        payload.supply_type = formData.pickup_type === 'vial' ? 'vial_10ml' : 
          formData.quantity === 8 ? 'prefilled_4week' : 'prefilled_2week';
        payload.quantity = formData.quantity;
        
        if (formData.pickup_type === 'vial') {
          // Include dosage for vial so we can calculate duration
          const totalMg = formData.hrt_type === 'male' ? 2000 : 1000;
          const match = formData.dosage.match(/(\d+)mg/);
          let weeks = 12; // default
          if (match) {
            const dosePerInjection = parseInt(match[1]);
            const weeklyMg = dosePerInjection * 2;
            weeks = Math.floor(totalMg / weeklyMg);
          }
          payload.dosage = `1 vial @ ${formData.dosage} (${weeks} weeks)`;
        } else {
          payload.dosage = `${formData.quantity} prefilled @ ${formData.dosage}`;
        }
      }
    } else if (activeTab === 'weight_loss') {
      payload.medication = formData.medication;
      
      if (formData.log_type === 'injection') {
        payload.dosage = formData.dosage;
      } else {
        payload.quantity = formData.week_supply;
        payload.dosage = `${formData.week_supply} week supply`;
      }
    } else if (activeTab === 'vitamin') {
      payload.medication = formData.medication;
      payload.dosage = 'Standard';
    }

    try {
      const isEditing = !!editingLog;
      const url = isEditing ? `/api/injection-logs?id=${editingLog.id}` : '/api/injection-logs';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        closeModal();
        setEditingLog(null);
        fetchLogs();
        
        // Show feedback about protocol sync
        if (data.protocol_update?.updated) {
          alert(`✓ Entry ${isEditing ? 'updated' : 'saved'}!\n\nProtocol updated:\n- Last refill: ${data.protocol_update.new_last_refill_date || 'updated'}\n- Supply type: ${data.protocol_update.changes?.supply_type || 'unchanged'}`);
        } else if (data.protocol_update?.reason) {
          alert(`✓ Entry ${isEditing ? 'updated' : 'saved'}.\n\n⚠️ Protocol not updated: ${data.protocol_update.reason}`);
        } else {
          // Just saved the log, no protocol sync attempted
        }
      } else {
        alert('Error: ' + (data.error || 'Failed to save'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error saving entry');
    }
  };

  const deleteLog = async (id) => {
    if (!confirm('Delete this entry?')) return;
    
    try {
      const res = await fetch(`/api/injection-logs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patientName = (log.patient_name || '').toLowerCase();
    const medication = (log.medication || '').toLowerCase();
    return patientName.includes(term) || medication.includes(term);
  });

  const getCategoryLabel = () => {
    switch(activeTab) {
      case 'testosterone': return 'Testosterone';
      case 'weight_loss': return 'Weight Loss';
      case 'vitamin': return 'Vitamin Injections';
      default: return activeTab;
    }
  };

  return (
    <>
      <Head>
        <title>Injection Logs | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
        
        <h1 style={styles.title}>Injection Logs</h1>

        {/* Category Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'testosterone', label: 'Testosterone' },
            { id: 'weight_loss', label: 'Weight Loss' },
            { id: 'vitamin', label: 'Vitamin Injections' }
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions Bar */}
        <div style={styles.actionsBar}>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button style={styles.newEntryBtn} onClick={openModal}>
            + New Entry
          </button>
        </div>

        {/* Logs Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>PATIENT</th>
                <th style={styles.th}>TYPE</th>
                <th style={styles.th}>MEDICATION</th>
                <th style={styles.th}>DOSE/DETAILS</th>
                <th style={styles.th}>NOTES</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={styles.loading}>Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="7" style={styles.empty}>No entries found</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div>{formatDate(log.entry_date || log.created_at)}</div>
                      <div style={styles.timeText}>{formatTime(log.created_at)}</div>
                    </td>
                    <td style={styles.td}>{log.patient_name || 'Unknown'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        background: log.entry_type === 'pickup' ? '#dbeafe' : '#dcfce7',
                        color: log.entry_type === 'pickup' ? '#1d4ed8' : '#166534'
                      }}>
                        {log.entry_type === 'pickup' ? '📦 Pickup' : '💉 Injection'}
                      </span>
                    </td>
                    <td style={styles.td}>{log.medication || '-'}</td>
                    <td style={styles.td}>{log.dosage || '-'}</td>
                    <td style={styles.td}>{log.notes || '-'}</td>
                    <td style={styles.td}>
                      <button 
                        style={styles.editBtn}
                        onClick={() => openEditModal(log)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        style={styles.deleteBtn}
                        onClick={() => deleteLog(log.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <span>Today: <strong>{logs.filter(l => {
            const today = new Date().toISOString().split('T')[0];
            const logDate = (l.entry_date || l.created_at || '').split('T')[0];
            return logDate === today;
          }).length}</strong></span>
          <span style={{ marginLeft: '24px' }}>This Week: <strong>{logs.filter(l => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const logDate = new Date(l.entry_date || l.created_at);
            return logDate >= weekAgo;
          }).length}</strong></span>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{editingLog ? 'Edit' : 'New'} {getCategoryLabel()} Entry</h2>
                <button style={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Patient Search */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setFormData(prev => ({ ...prev, patient_id: '', patient_name: '' }));
                      }}
                      placeholder="Type to search patient..."
                      style={styles.input}
                      autoComplete="off"
                    />
                    {showPatientDropdown && filteredPatients.length > 0 && (
                      <div style={styles.dropdown}>
                        {filteredPatients.map(p => {
                          const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || p.email || p.phone || 'Unknown';
                          return (
                            <div
                              key={p.id}
                              style={styles.dropdownItem}
                              onClick={() => selectPatient(p)}
                            >
                              <div style={{ fontWeight: '500' }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {p.phone || p.email || 'No contact'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                    style={styles.input}
                    required
                  />
                </div>

                {/* Type (Injection vs Pickup) */}
                {activeTab !== 'vitamin' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Type</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="log_type"
                          value="injection"
                          checked={formData.log_type === 'injection'}
                          onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                        />
                        💉 In-Clinic Injection
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="log_type"
                          value="pickup"
                          checked={formData.log_type === 'pickup'}
                          onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                        />
                        📦 Medication Pickup
                      </label>
                    </div>
                  </div>
                )}

                {/* Testosterone Fields */}
                {activeTab === 'testosterone' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>HRT Type</label>
                      <select
                        value={formData.hrt_type}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          hrt_type: e.target.value,
                          dosage: '' // Reset dosage when type changes
                        }))}
                        style={styles.select}
                      >
                        <option value="male">Male HRT (200mg/ml)</option>
                        <option value="female">Female HRT (100mg/ml)</option>
                      </select>
                    </div>

                    {formData.log_type === 'injection' ? (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosage *</label>
                        <select
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          style={styles.select}
                          required
                        >
                          <option value="">Select dosage...</option>
                          {TESTOSTERONE_OPTIONS[formData.hrt_type].dosages.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        {formData.dosage === 'custom' && (
                          <input
                            type="text"
                            placeholder="Enter custom dosage..."
                            value={formData.custom_dosage}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_dosage: e.target.value }))}
                            style={{ ...styles.input, marginTop: '8px' }}
                            required
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Pickup Type</label>
                          <select
                            value={formData.pickup_type}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              pickup_type: e.target.value,
                              quantity: e.target.value === 'vial' ? 1 : 4
                            }))}
                            style={styles.select}
                          >
                            <option value="vial">Vial (10ml)</option>
                            <option value="prefilled">Prefilled Syringes</option>
                          </select>
                        </div>

                        {formData.pickup_type === 'vial' && (
                          <>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Patient's Weekly Dose *</label>
                              <select
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                style={styles.select}
                                required
                              >
                                <option value="">Select dose...</option>
                                {TESTOSTERONE_OPTIONS[formData.hrt_type].dosages
                                  .filter(d => d.value !== 'custom')
                                  .map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                  ))
                                }
                              </select>
                            </div>
                            <div style={styles.infoBox}>
                              <div>10ml vial @ {formData.hrt_type === 'male' ? '200mg/ml (2000mg total)' : '100mg/ml (1000mg total)'}</div>
                              {formData.dosage && (
                                <div style={{ marginTop: '8px', fontWeight: '600', color: '#059669' }}>
                                  {(() => {
                                    const totalMg = formData.hrt_type === 'male' ? 2000 : 1000;
                                    const match = formData.dosage.match(/(\d+)mg/);
                                    if (match) {
                                      const dosePerInjection = parseInt(match[1]);
                                      const weeklyMg = dosePerInjection * 2; // 2x per week
                                      const weeks = Math.floor(totalMg / weeklyMg);
                                      return `≈ ${weeks} weeks supply (at ${dosePerInjection}mg × 2/week)`;
                                    }
                                    return '';
                                  })()}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {formData.pickup_type === 'prefilled' && (
                          <>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Dose per Syringe</label>
                              <select
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                style={styles.select}
                                required
                              >
                                <option value="">Select dose...</option>
                                {TESTOSTERONE_OPTIONS[formData.hrt_type].dosages
                                  .filter(d => d.value !== 'custom')
                                  .map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                  ))
                                }
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Quantity</label>
                              <select
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                style={styles.select}
                              >
                                <option value="4">4 syringes (2 week supply)</option>
                                <option value="8">8 syringes (4 week supply)</option>
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Weight Loss Fields */}
                {activeTab === 'weight_loss' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Medication</label>
                      <select
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          medication: e.target.value,
                          dosage: ''
                        }))}
                        style={styles.select}
                      >
                        {WEIGHT_LOSS_OPTIONS.medications.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.log_type === 'injection' ? (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosage *</label>
                        <select
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          style={styles.select}
                          required
                        >
                          <option value="">Select dosage...</option>
                          {(WEIGHT_LOSS_OPTIONS.dosages[formData.medication] || []).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Supply Duration</label>
                        <select
                          value={formData.week_supply}
                          onChange={(e) => setFormData(prev => ({ ...prev, week_supply: parseInt(e.target.value) }))}
                          style={styles.select}
                        >
                          <option value="2">2 weeks (2 injections)</option>
                          <option value="4">4 weeks (4 injections)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Vitamin Fields */}
                {activeTab === 'vitamin' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Injection Type</label>
                    <select
                      value={formData.medication}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                      style={styles.select}
                      required
                    >
                      <option value="">Select injection...</option>
                      {VITAMIN_OPTIONS.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    style={styles.textarea}
                    rows={2}
                  />
                </div>

                {/* Submit */}
                <button type="submit" style={styles.submitBtn}>
                  {editingLog ? 'Update Entry' : 'Save Entry'}
                </button>
              </form>
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  backLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#111'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s'
  },
  tabActive: {
    background: '#111',
    color: 'white'
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '16px'
  },
  searchInput: {
    flex: 1,
    maxWidth: '300px',
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  newEntryBtn: {
    padding: '10px 20px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    borderBottom: '2px solid #e5e7eb',
    background: '#fafafa',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151'
  },
  timeText: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  typeBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 8px',
    marginRight: '4px'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  stats: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#6b7280'
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
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '480px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  radioGroup: {
    display: 'flex',
    gap: '16px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  infoBox: {
    padding: '12px 14px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '16px'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '2px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 10
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px'
  }
};
