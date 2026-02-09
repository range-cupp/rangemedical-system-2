// /pages/admin/service-log.js
// Unified Service Log - Track ALL services delivered
// Range Medical - 2026-02-09
//
// This is the master log for everything that "leaves the building":
// - Injections (testosterone, weight loss, vitamins, peptides)
// - Medication pickups (testosterone vials, weight loss supplies, peptides)
// - Sessions (IV therapy, HBOT, Red Light)
//
// When you log something here, the system automatically:
// 1. Checks if patient has a package with credits for this service
// 2. Decrements from package (or flags for billing if no package)
// 3. Creates/updates protocol for tracking (refills, follow-ups)
// 4. Syncs to GHL if applicable

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// SERVICE OPTIONS
// ============================================

const SERVICE_CATEGORIES = [
  { id: 'testosterone', label: 'Testosterone', icon: '💉' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '📉' },
  { id: 'vitamin', label: 'Vitamin Injections', icon: '💊' },
  { id: 'peptide', label: 'Peptides', icon: '🧬' },
  { id: 'iv_therapy', label: 'IV Therapy', icon: '💧' },
  { id: 'hbot', label: 'HBOT', icon: '🫁' },
  { id: 'red_light', label: 'Red Light', icon: '🔴' }
];

const TESTOSTERONE_OPTIONS = {
  male: {
    label: 'Male HRT (200mg/ml)',
    medication: 'Testosterone Cypionate 200mg/ml',
    dosages: [
      { value: '0.2ml/40mg', label: '0.2ml (40mg)' },
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
  { value: 'B12', label: 'B12', price: 35 },
  { value: 'B-Complex', label: 'B-Complex', price: 35 },
  { value: 'Amino Blend', label: 'Amino Blend', price: 45 },
  { value: 'Biotin', label: 'Biotin', price: 35 },
  { value: 'Vitamin D3', label: 'Vitamin D3', price: 45 },
  { value: 'Glutathione', label: 'Glutathione', price: 65 },
  { value: 'NAD+ 50mg', label: 'NAD+ 50mg', price: 50 },
  { value: 'NAD+ 100mg', label: 'NAD+ 100mg', price: 100 },
  { value: 'L-Carnitine', label: 'L-Carnitine', price: 45 },
  { value: 'Lipo-C', label: 'Lipo-C', price: 45 }
];

const PEPTIDE_OPTIONS = [
  { value: 'BPC-157', label: 'BPC-157' },
  { value: 'TB-500', label: 'TB-500' },
  { value: 'BPC-157/TB-500', label: 'BPC-157 + TB-500' },
  { value: 'Sermorelin', label: 'Sermorelin' },
  { value: 'Tesamorelin', label: 'Tesamorelin' },
  { value: 'CJC-1295/Ipamorelin', label: 'CJC-1295/Ipamorelin' },
  { value: 'Semaglutide (peptide)', label: 'Semaglutide' },
  { value: 'PT-141', label: 'PT-141' },
  { value: 'Semax', label: 'Semax' },
  { value: 'Selank', label: 'Selank' },
  { value: 'MOTS-C', label: 'MOTS-C' },
  { value: 'SS-31', label: 'SS-31' },
  { value: 'Other', label: 'Other (specify in notes)' }
];

const IV_OPTIONS = [
  { value: 'Energy IV', label: 'Energy IV', price: 225 },
  { value: 'Hydration IV', label: 'Hydration IV', price: 175 },
  { value: 'Immune IV', label: 'Immune IV', price: 225 },
  { value: 'Glow IV', label: 'Glow IV', price: 275 },
  { value: 'Brain IV', label: 'Brain IV', price: 275 },
  { value: 'Performance IV', label: 'Performance IV', price: 275 },
  { value: 'NAD+ IV 250mg', label: 'NAD+ IV 250mg', price: 375 },
  { value: 'NAD+ IV 500mg', label: 'NAD+ IV 500mg', price: 525 },
  { value: 'NAD+ IV 750mg', label: 'NAD+ IV 750mg', price: 650 },
  { value: 'NAD+ IV 1000mg', label: 'NAD+ IV 1000mg', price: 775 },
  { value: 'Methylene Blue IV', label: 'Methylene Blue IV', price: 197 },
  { value: 'High-Dose Vitamin C', label: 'High-Dose Vitamin C', price: 225 },
  { value: 'Custom Range IV', label: 'Custom Range IV', price: 275 }
];

const HBOT_OPTIONS = [
  { value: 'HBOT Single Session', label: 'Single Session (60 min)', price: 185 },
  { value: 'HBOT Package Session', label: 'Package Session', price: null }
];

const RED_LIGHT_OPTIONS = [
  { value: 'Red Light Single', label: 'Single Session (15-20 min)', price: 85 },
  { value: 'Red Light Package Session', label: 'Package Session', price: null }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ServiceLog() {
  const router = useRouter();
  const { patient_id, tab } = router.query;

  const [activeTab, setActiveTab] = useState(tab || 'testosterone');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    log_type: 'injection', // injection, pickup, session
    category: 'testosterone',
    hrt_type: 'male',
    medication: '',
    dosage: '',
    custom_dosage: '',
    pickup_type: 'vial',
    quantity: 1,
    week_supply: 4,
    weight: '',
    duration: 60,
    entry_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    notes: ''
  });

  // Edit mode
  const [editingLog, setEditingLog] = useState(null);

  // Patient search
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // Package info for selected patient
  const [patientPackages, setPatientPackages] = useState([]);
  const [checkingPackages, setCheckingPackages] = useState(false);

  // Update active tab from URL
  useEffect(() => {
    if (tab && SERVICE_CATEGORIES.find(c => c.id === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

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
        selectPatient(patient);
      }
    }
  }, [patient_id, patients]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/service-log?category=${activeTab}&limit=100`);
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
      const res = await fetch('/api/patients?limit=2000');
      const data = await res.json();
      if (data.patients && data.patients.length > 0) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Check patient packages when patient is selected
  const checkPatientPackages = async (patientId) => {
    if (!patientId) return;

    setCheckingPackages(true);
    try {
      const res = await fetch(`/api/service-log/check-packages?patient_id=${patientId}&category=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setPatientPackages(data.packages || []);
      }
    } catch (err) {
      console.error('Error checking packages:', err);
      setPatientPackages([]);
    } finally {
      setCheckingPackages(false);
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

    // Check for packages
    checkPatientPackages(patient.id);
  };

  const getLogTypeOptions = () => {
    switch (activeTab) {
      case 'testosterone':
      case 'weight_loss':
      case 'peptide':
        return [
          { value: 'injection', label: '💉 In-Clinic Injection' },
          { value: 'pickup', label: '📦 Medication Pickup' }
        ];
      case 'vitamin':
        return [
          { value: 'injection', label: '💉 Injection' }
        ];
      case 'iv_therapy':
      case 'hbot':
      case 'red_light':
        return [
          { value: 'session', label: '✅ Session Completed' }
        ];
      default:
        return [{ value: 'injection', label: '💉 Injection' }];
    }
  };

  const openModal = () => {
    setEditingLog(null);
    if (patients.length === 0) fetchPatients();

    setPatientSearch('');
    setPatientPackages([]);

    // Set default log_type based on category
    let defaultLogType = 'injection';
    if (['iv_therapy', 'hbot', 'red_light'].includes(activeTab)) {
      defaultLogType = 'session';
    }

    // Set default medication
    let defaultMedication = '';
    if (activeTab === 'weight_loss') defaultMedication = 'Semaglutide';
    if (activeTab === 'iv_therapy') defaultMedication = 'Energy IV';
    if (activeTab === 'hbot') defaultMedication = 'HBOT Single Session';
    if (activeTab === 'red_light') defaultMedication = 'Red Light Single';

    setFormData(prev => ({
      ...prev,
      patient_id: '',
      patient_name: '',
      category: activeTab,
      log_type: defaultLogType,
      dosage: '',
      custom_dosage: '',
      weight: '',
      medication: defaultMedication,
      notes: '',
      entry_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    }));
    setShowModal(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);

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
      weight: log.weight || '',
      duration: log.duration || 60,
      entry_date: (log.entry_date || log.created_at || '').split('T')[0],
      notes: log.notes || ''
    });
    setPatientSearch(log.patient_name || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPatientSearch('');
    setPatientPackages([]);
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
        payload.supply_type = formData.pickup_type === 'vial' ? 'vial_10ml' :
          formData.quantity === 8 ? 'prefilled_4week' : 'prefilled_2week';
        payload.quantity = formData.quantity;

        if (formData.pickup_type === 'vial') {
          const totalMg = formData.hrt_type === 'male' ? 2000 : 1000;
          const match = formData.dosage.match(/(\d+)mg/);
          let weeks = 12;
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
        payload.weight = formData.weight ? parseFloat(formData.weight) : null;
      } else {
        payload.quantity = formData.week_supply;
        payload.dosage = `${formData.week_supply} week supply`;
      }
    } else if (activeTab === 'vitamin') {
      payload.medication = formData.medication;
      payload.dosage = 'Standard';
    } else if (activeTab === 'peptide') {
      payload.medication = formData.medication;
      if (formData.log_type === 'injection') {
        payload.dosage = formData.dosage || 'Standard';
      } else {
        payload.quantity = formData.quantity || 1;
        payload.dosage = `${formData.quantity || 1} vial`;
      }
    } else if (activeTab === 'iv_therapy') {
      payload.medication = formData.medication;
      payload.duration = formData.duration || 60;
    } else if (activeTab === 'hbot') {
      payload.medication = formData.medication;
      payload.duration = 60; // HBOT is always 60 min
    } else if (activeTab === 'red_light') {
      payload.medication = formData.medication;
      payload.duration = formData.duration || 20;
    }

    try {
      const isEditing = !!editingLog;
      const url = isEditing ? `/api/service-log?id=${editingLog.id}` : '/api/service-log';
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

        // Show feedback
        let message = `✓ Entry ${isEditing ? 'updated' : 'saved'}!`;

        if (data.package_update) {
          if (data.package_update.decremented) {
            message += `\n\n📦 Package updated: ${data.package_update.remaining} sessions remaining`;
          } else if (data.package_update.no_package) {
            message += `\n\n⚠️ No package found - this should be billed separately`;
          }
        }

        if (data.protocol_update?.created) {
          message += `\n\n📋 New protocol created for tracking`;
        } else if (data.protocol_update?.updated) {
          message += `\n\n📋 Protocol updated`;
        }

        alert(message);
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
      const res = await fetch(`/api/service-log?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    let d;
    if (dateStr.length === 10 && dateStr.includes('-')) {
      d = new Date(dateStr + 'T00:00:00');
    } else {
      d = new Date(dateStr);
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
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
    const cat = SERVICE_CATEGORIES.find(c => c.id === activeTab);
    return cat ? cat.label : activeTab;
  };

  const getCategoryIcon = () => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === activeTab);
    return cat ? cat.icon : '📋';
  };

  const getTypeBadge = (entryType) => {
    switch (entryType) {
      case 'pickup':
        return { label: '📦 Pickup', bg: '#dbeafe', color: '#1d4ed8' };
      case 'session':
        return { label: '✅ Session', bg: '#f3e8ff', color: '#7c3aed' };
      case 'injection':
      default:
        return { label: '💉 Injection', bg: '#dcfce7', color: '#166534' };
    }
  };

  return (
    <>
      <Head>
        <title>Service Log | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>

        <h1 style={styles.title}>Service Log</h1>
        <p style={styles.subtitle}>Log all services delivered — injections, pickups, and sessions</p>

        {/* Category Tabs */}
        <div style={styles.tabsWrapper}>
          <div style={styles.tabs}>
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === cat.id ? styles.tabActive : {})
                }}
                onClick={() => {
                  setActiveTab(cat.id);
                  router.push(`/admin/service-log?tab=${cat.id}`, undefined, { shallow: true });
                }}
              >
                <span style={styles.tabIcon}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
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
            + Log {getCategoryLabel()}
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
                <th style={styles.th}>SERVICE</th>
                <th style={styles.th}>DETAILS</th>
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
                filteredLogs.map(log => {
                  const badge = getTypeBadge(log.entry_type);
                  return (
                    <tr key={log.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div>{formatDate(log.entry_date || log.created_at)}</div>
                        <div style={styles.timeText}>{formatTime(log.created_at)}</div>
                      </td>
                      <td style={styles.td}>
                        <Link href={`/admin/patients/${log.patient_id}`} style={styles.patientLink}>
                          {log.patient_name || 'Unknown'}
                        </Link>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.typeBadge,
                          background: badge.bg,
                          color: badge.color
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={styles.td}>{log.medication || '-'}</td>
                      <td style={styles.td}>
                        {log.dosage || '-'}
                        {log.weight && <span style={styles.weightText}> • {log.weight} lbs</span>}
                        {log.duration && ['iv_therapy', 'hbot', 'red_light'].includes(log.category) &&
                          <span style={styles.durationText}> • {log.duration} min</span>
                        }
                      </td>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <span>Today: <strong>{logs.filter(l => {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
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
                <h2 style={styles.modalTitle}>
                  {getCategoryIcon()} {editingLog ? 'Edit' : 'Log'} {getCategoryLabel()}
                </h2>
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
                        setPatientPackages([]);
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
                              <div style={{ fontWeight: '500' }}>{displayName}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {p.phone || p.email || 'No contact'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Package Status */}
                  {formData.patient_id && (
                    <div style={styles.packageStatus}>
                      {checkingPackages ? (
                        <span style={styles.packageChecking}>Checking packages...</span>
                      ) : patientPackages.length > 0 ? (
                        <div style={styles.packageFound}>
                          ✅ Active package: {patientPackages[0].name || patientPackages[0].program_name}
                          <span style={styles.packageCredits}>
                            {patientPackages[0].sessions_remaining || (patientPackages[0].total_sessions - (patientPackages[0].sessions_used || 0))} sessions remaining
                          </span>
                        </div>
                      ) : (
                        <div style={styles.packageNotFound}>
                          ⚠️ No active package for {getCategoryLabel()} — will need to be billed
                        </div>
                      )}
                    </div>
                  )}
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

                {/* Type (Injection/Pickup/Session) */}
                {getLogTypeOptions().length > 1 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Type</label>
                    <div style={styles.radioGroup}>
                      {getLogTypeOptions().map(opt => (
                        <label key={opt.value} style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="log_type"
                            value={opt.value}
                            checked={formData.log_type === opt.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* === TESTOSTERONE FIELDS === */}
                {activeTab === 'testosterone' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>HRT Type</label>
                      <select
                        value={formData.hrt_type}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          hrt_type: e.target.value,
                          dosage: ''
                        }))}
                        style={styles.select}
                      >
                        <option value="male">Male HRT (200mg/ml)</option>
                        <option value="female">Female HRT (100mg/ml)</option>
                      </select>
                    </div>

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

                    {formData.log_type === 'pickup' && (
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

                        {formData.pickup_type === 'prefilled' && (
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
                        )}

                        {formData.pickup_type === 'vial' && formData.dosage && (
                          <div style={styles.infoBox}>
                            {(() => {
                              const totalMg = formData.hrt_type === 'male' ? 2000 : 1000;
                              const match = formData.dosage.match(/(\d+)mg/);
                              if (match) {
                                const dosePerInjection = parseInt(match[1]);
                                const weeklyMg = dosePerInjection * 2;
                                const weeks = Math.floor(totalMg / weeklyMg);
                                return `📅 ≈ ${weeks} weeks supply (at ${dosePerInjection}mg × 2/week)`;
                              }
                              return '10ml vial';
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* === WEIGHT LOSS FIELDS === */}
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
                      <>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Current Weight (lbs) *</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.weight || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            placeholder="e.g. 215.5"
                            style={styles.input}
                            required
                          />
                        </div>
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
                      </>
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

                {/* === VITAMIN FIELDS === */}
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

                {/* === PEPTIDE FIELDS === */}
                {activeTab === 'peptide' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Peptide</label>
                      <select
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                        style={styles.select}
                        required
                      >
                        <option value="">Select peptide...</option>
                        {PEPTIDE_OPTIONS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.log_type === 'injection' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosage</label>
                        <input
                          type="text"
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g. 500mcg, 1mg..."
                          style={styles.input}
                        />
                      </div>
                    )}

                    {formData.log_type === 'pickup' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Quantity (vials)</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                          style={styles.input}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* === IV THERAPY FIELDS === */}
                {activeTab === 'iv_therapy' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>IV Type</label>
                      <select
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                        style={styles.select}
                        required
                      >
                        <option value="">Select IV...</option>
                        {IV_OPTIONS.map(iv => (
                          <option key={iv.value} value={iv.value}>{iv.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Duration (minutes)</label>
                      <select
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        style={styles.select}
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">120 minutes</option>
                        <option value="180">180 minutes (NAD+)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* === HBOT FIELDS === */}
                {activeTab === 'hbot' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Session Type</label>
                    <select
                      value={formData.medication}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                      style={styles.select}
                      required
                    >
                      {HBOT_OPTIONS.map(h => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                    <div style={styles.infoBox}>
                      🫁 60-minute session at 2.0 ATA
                    </div>
                  </div>
                )}

                {/* === RED LIGHT FIELDS === */}
                {activeTab === 'red_light' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Session Type</label>
                      <select
                        value={formData.medication}
                        onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                        style={styles.select}
                        required
                      >
                        {RED_LIGHT_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Duration (minutes)</label>
                      <select
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        style={styles.select}
                      >
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                      </select>
                    </div>
                  </>
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
    maxWidth: '1400px',
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
    marginBottom: '4px',
    color: '#111'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px'
  },
  tabsWrapper: {
    overflowX: 'auto',
    marginBottom: '24px',
    paddingBottom: '4px'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    minWidth: 'max-content'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    background: '#111',
    color: 'white'
  },
  tabIcon: {
    fontSize: '14px'
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
  weightText: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500'
  },
  durationText: {
    fontSize: '12px',
    color: '#6b7280'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '500'
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
    width: '500px',
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
    gap: '16px',
    flexWrap: 'wrap'
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
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#166534',
    marginTop: '8px'
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
  packageStatus: {
    marginTop: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px'
  },
  packageChecking: {
    color: '#6b7280'
  },
  packageFound: {
    background: '#f0fdf4',
    color: '#166534',
    padding: '10px 12px',
    borderRadius: '8px'
  },
  packageCredits: {
    display: 'block',
    fontSize: '12px',
    marginTop: '4px',
    opacity: 0.8
  },
  packageNotFound: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '10px 12px',
    borderRadius: '8px'
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
