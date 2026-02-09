// /pages/admin/service-log.js
// Unified Service Log - Multi-Service Visit Entry
// Range Medical - 2026-02-09
//
// NEW Flow:
// 1. Click "+ New Entry"
// 2. Search/select patient → shows their active protocols
// 3. VISIT BUILDER: Add multiple services to the visit
//    - "+ Add Service" → pick type → configure → adds to list
//    - If no protocol exists → show protocol creation form
// 4. Review all items → "Save Visit"
// 5. System processes all entries, creates protocols as needed

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// SERVICE CONFIGURATION
// ============================================

const SERVICE_TYPES = [
  { id: 'testosterone', label: 'Testosterone / HRT', icon: '💉', programType: 'hrt' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '📉', programType: 'weight_loss' },
  { id: 'vitamin', label: 'Vitamin Injection', icon: '💊', programType: 'vitamin' },
  { id: 'peptide', label: 'Peptide', icon: '🧬', programType: 'peptide' },
  { id: 'iv_therapy', label: 'IV Therapy', icon: '💧', programType: 'iv_therapy' },
  { id: 'hbot', label: 'HBOT', icon: '🫁', programType: 'hbot' },
  { id: 'red_light', label: 'Red Light Therapy', icon: '🔴', programType: 'red_light' }
];

const TESTOSTERONE_OPTIONS = {
  male: {
    label: 'Male HRT (200mg/ml)',
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

const WEIGHT_LOSS_MEDS = [
  { value: 'Semaglutide', label: 'Semaglutide', dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'] },
  { value: 'Tirzepatide', label: 'Tirzepatide', dosages: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'] },
  { value: 'Retatrutide', label: 'Retatrutide', dosages: ['1mg', '2mg', '4mg', '6mg', '8mg', '10mg', '12mg'] }
];

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
  { value: 'Lipo-C', label: 'Lipo-C' },
  { value: 'Taurine', label: 'Taurine' }
];

const PEPTIDE_OPTIONS = [
  { value: 'BPC-157', label: 'BPC-157' },
  { value: 'TB-500', label: 'TB-500' },
  { value: 'BPC-157/TB-500', label: 'BPC-157 + TB-500' },
  { value: 'Sermorelin', label: 'Sermorelin' },
  { value: 'Tesamorelin', label: 'Tesamorelin' },
  { value: 'CJC-1295/Ipamorelin', label: 'CJC-1295/Ipamorelin' },
  { value: 'PT-141', label: 'PT-141' },
  { value: 'Semax', label: 'Semax' },
  { value: 'Selank', label: 'Selank' },
  { value: 'MOTS-C', label: 'MOTS-C' },
  { value: 'SS-31', label: 'SS-31' },
  { value: 'Other', label: 'Other (specify in notes)' }
];

const IV_OPTIONS = [
  { value: 'Energy IV', label: 'Energy IV' },
  { value: 'Hydration IV', label: 'Hydration IV' },
  { value: 'Immune IV', label: 'Immune IV' },
  { value: 'Glow IV', label: 'Glow IV' },
  { value: 'Brain IV', label: 'Brain IV' },
  { value: 'Performance IV', label: 'Performance IV' },
  { value: 'NAD+ IV 250mg', label: 'NAD+ IV 250mg' },
  { value: 'NAD+ IV 500mg', label: 'NAD+ IV 500mg' },
  { value: 'NAD+ IV 750mg', label: 'NAD+ IV 750mg' },
  { value: 'NAD+ IV 1000mg', label: 'NAD+ IV 1000mg' },
  { value: 'Methylene Blue IV', label: 'Methylene Blue IV' },
  { value: 'High-Dose Vitamin C', label: 'High-Dose Vitamin C' },
  { value: 'Custom Range IV', label: 'Custom Range IV' }
];

// Protocol creation options (from protocols/new.js)
const PROTOCOL_CONFIG = {
  peptide: {
    frequencies: [
      { value: 'daily', label: 'Once daily' },
      { value: '2x_daily', label: 'Twice daily' }
    ],
    durations: [
      { value: 10, label: '10 days' },
      { value: 30, label: '30 days' },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' }
    ]
  },
  hrt: {
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    supplyTypes: [
      { value: 'prefilled', label: 'Prefilled Syringes (8/month)' },
      { value: 'vial', label: 'Vial (10ml)' }
    ]
  },
  weight_loss: {
    frequencies: [{ value: 'weekly', label: 'Once per week' }]
  },
  vitamin: {
    frequencies: [
      { value: 'weekly', label: 'Weekly' },
      { value: '2x_weekly', label: '2x per week' },
      { value: 'as_needed', label: 'As needed' }
    ]
  },
  iv_therapy: {
    frequencies: [{ value: 'as_scheduled', label: 'As scheduled' }],
    sessions: [1, 5, 10, 20]
  },
  hbot: {
    frequencies: [{ value: 'as_scheduled', label: 'As scheduled' }],
    sessions: [1, 5, 10, 20, 40]
  },
  red_light: {
    frequencies: [{ value: 'as_scheduled', label: 'As scheduled' }],
    sessions: [1, 5, 10, 20]
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ServiceLog() {
  const router = useRouter();
  const { tab } = router.query;

  // View state
  const [viewCategory, setViewCategory] = useState(tab || 'all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: patient, 2: visit builder, 3: add service, 4: protocol creation

  // Patient selection
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientProtocols, setPatientProtocols] = useState([]);
  const [loadingProtocols, setLoadingProtocols] = useState(false);

  // Visit items (multi-service)
  const [visitItems, setVisitItems] = useState([]);
  const [visitDate, setVisitDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));

  // Current service being added
  const [currentServiceType, setCurrentServiceType] = useState(null);
  const [entryType, setEntryType] = useState('injection');
  const [formData, setFormData] = useState({
    hrt_type: 'male',
    medication: '',
    dosage: '',
    custom_dosage: '',
    weight: '',
    quantity: 1,
    pickup_type: 'vial',
    duration: 60,
    notes: ''
  });

  // Protocol creation (when no protocol exists)
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [protocolData, setProtocolData] = useState({
    frequency: '',
    duration: '',
    totalSessions: '',
    supplyType: '',
    deliveryMethod: 'take_home'
  });

  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    fetchLogs();
    fetchPatients();
  }, [viewCategory]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const categoryParam = viewCategory === 'all' ? '' : `category=${viewCategory}&`;
      const res = await fetch(`/api/service-log?${categoryParam}limit=100`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
    setLoading(false);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients?limit=2000');
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchPatientProtocols = async (patientId) => {
    setLoadingProtocols(true);
    try {
      // Use the same Command Center endpoint as the main dashboard
      // This ensures both views show the same protocol data
      const res = await fetch('/api/admin/command-center');
      const data = await res.json();
      if (data.success && data.protocols) {
        // Filter active protocols for this patient
        const patientActiveProtocols = data.protocols
          .filter(p => p.patient_id === patientId && p.status === 'active')
          .map(p => {
            // Normalize program_type to match SERVICE_TYPES
            let normalizedType = p.program_type?.toLowerCase() || '';
            if (normalizedType === 'hrt' || normalizedType.includes('testosterone')) {
              normalizedType = 'hrt';
            } else if (normalizedType.includes('weight') || normalizedType.includes('semaglutide') || normalizedType.includes('tirzepatide')) {
              normalizedType = 'weight_loss';
            } else if (normalizedType.includes('vitamin') || normalizedType.includes('b12')) {
              normalizedType = 'vitamin';
            } else if (normalizedType.includes('peptide') || normalizedType.includes('bpc') || normalizedType.includes('tb-500')) {
              normalizedType = 'peptide';
            } else if (normalizedType.includes('iv') || normalizedType.includes('infusion')) {
              normalizedType = 'iv_therapy';
            } else if (normalizedType.includes('hbot') || normalizedType.includes('hyperbaric')) {
              normalizedType = 'hbot';
            } else if (normalizedType.includes('red') || normalizedType.includes('light') || normalizedType.includes('rlt')) {
              normalizedType = 'red_light';
            }
            return { ...p, program_type: normalizedType };
          });
        setPatientProtocols(patientActiveProtocols);
      } else {
        setPatientProtocols([]);
      }
    } catch (err) {
      console.error('Error fetching protocols:', err);
      setPatientProtocols([]);
    }
    setLoadingProtocols(false);
  };

  // Patient search filtering
  useEffect(() => {
    if (patientSearch.length >= 1 && patients.length > 0) {
      const term = patientSearch.toLowerCase();
      const filtered = patients.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
        const phone = (p.phone || '').replace(/\D/g, '');
        const email = (p.email || '').toLowerCase();
        return fullName.includes(term) || phone.includes(term) || email.includes(term);
      }).slice(0, 10);
      setFilteredPatients(filtered);
      setShowPatientDropdown(filtered.length > 0 && !selectedPatient);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  }, [patientSearch, patients, selectedPatient]);

  // Modal functions
  const openModal = () => {
    setShowModal(true);
    setModalStep(1);
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientProtocols([]);
    setVisitItems([]);
    setVisitDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }));
    setCurrentServiceType(null);
    resetFormData();
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientProtocols([]);
    setVisitItems([]);
    setCurrentServiceType(null);
  };

  const resetFormData = () => {
    setEntryType('injection');
    setFormData({
      hrt_type: 'male',
      medication: '',
      dosage: '',
      custom_dosage: '',
      weight: '',
      quantity: 1,
      pickup_type: 'vial',
      duration: 60,
      notes: ''
    });
    setProtocolData({
      frequency: '',
      duration: '',
      totalSessions: '',
      supplyType: '',
      deliveryMethod: 'take_home'
    });
    setShowProtocolForm(false);
  };

  const selectPatient = (patient) => {
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'Unknown';
    setSelectedPatient({ ...patient, displayName: name });
    setPatientSearch(name);
    setShowPatientDropdown(false);
    fetchPatientProtocols(patient.id);
  };

  const goToVisitBuilder = () => {
    setModalStep(2);
  };

  const openAddService = () => {
    setModalStep(3);
    setCurrentServiceType(null);
    resetFormData();
  };

  const selectServiceType = (serviceType) => {
    setCurrentServiceType(serviceType);

    // Check if patient has protocol for this service
    const protocol = getProtocolForService(serviceType.id);
    setShowProtocolForm(!protocol);

    // Set defaults based on service type
    if (serviceType.id === 'weight_loss') {
      setFormData(prev => ({ ...prev, medication: 'Semaglutide' }));
      setEntryType('injection');
      setProtocolData(prev => ({ ...prev, frequency: 'weekly' }));
    } else if (serviceType.id === 'iv_therapy') {
      setFormData(prev => ({ ...prev, medication: 'Energy IV' }));
      setEntryType('session');
      setProtocolData(prev => ({ ...prev, frequency: 'as_scheduled', totalSessions: '1' }));
    } else if (serviceType.id === 'hbot') {
      setFormData(prev => ({ ...prev, medication: 'HBOT Session' }));
      setEntryType('session');
      setProtocolData(prev => ({ ...prev, frequency: 'as_scheduled', totalSessions: '1' }));
    } else if (serviceType.id === 'red_light') {
      setFormData(prev => ({ ...prev, medication: 'Red Light Session', duration: 20 }));
      setEntryType('session');
      setProtocolData(prev => ({ ...prev, frequency: 'as_scheduled', totalSessions: '1' }));
    } else if (serviceType.id === 'vitamin') {
      setEntryType('injection');
      setProtocolData(prev => ({ ...prev, frequency: 'weekly' }));
    } else if (serviceType.id === 'peptide') {
      setEntryType('injection');
      setProtocolData(prev => ({ ...prev, frequency: 'daily', duration: '30' }));
    } else if (serviceType.id === 'testosterone') {
      setEntryType('injection');
      setProtocolData(prev => ({ ...prev, frequency: '2x_weekly', supplyType: 'prefilled' }));
    }
  };

  const addServiceToVisit = () => {
    if (!currentServiceType) return;

    const item = {
      id: Date.now(),
      serviceType: currentServiceType,
      entryType,
      formData: { ...formData },
      protocolData: showProtocolForm ? { ...protocolData } : null,
      createProtocol: showProtocolForm
    };

    setVisitItems([...visitItems, item]);
    setModalStep(2);
    resetFormData();
    setCurrentServiceType(null);
  };

  const removeVisitItem = (itemId) => {
    setVisitItems(visitItems.filter(item => item.id !== itemId));
  };

  const getProtocolForService = (serviceId) => {
    const programType = SERVICE_TYPES.find(s => s.id === serviceId)?.programType;
    return patientProtocols.find(p => p.program_type === programType);
  };

  const handleSubmitVisit = async () => {
    if (!selectedPatient || visitItems.length === 0) return;

    setSubmitting(true);
    const results = [];
    const errors = [];

    for (const item of visitItems) {
      try {
        // Build payload
        const payload = {
          patient_id: selectedPatient.id,
          category: item.serviceType.id,
          entry_type: item.entryType,
          entry_date: visitDate,
          notes: item.formData.notes || null
        };

        // Add type-specific fields
        if (item.serviceType.id === 'testosterone') {
          payload.medication = item.formData.hrt_type === 'male' ? 'Male HRT' : 'Female HRT';
          if (item.entryType === 'injection') {
            payload.dosage = item.formData.dosage === 'custom' ? item.formData.custom_dosage : item.formData.dosage;
          } else {
            payload.supply_type = item.formData.pickup_type === 'vial' ? 'vial_10ml' :
              item.formData.quantity === 8 ? 'prefilled_4week' : 'prefilled_2week';
            payload.quantity = item.formData.quantity;
            if (item.formData.pickup_type === 'vial') {
              const totalMg = item.formData.hrt_type === 'male' ? 2000 : 1000;
              const match = item.formData.dosage.match(/(\d+)mg/);
              let weeks = 12;
              if (match) {
                const dosePerInjection = parseInt(match[1]);
                const weeklyMg = dosePerInjection * 2;
                weeks = Math.floor(totalMg / weeklyMg);
              }
              payload.dosage = `1 vial @ ${item.formData.dosage} (${weeks} weeks)`;
            } else {
              payload.dosage = `${item.formData.quantity} prefilled @ ${item.formData.dosage}`;
            }
          }
        } else if (item.serviceType.id === 'weight_loss') {
          payload.medication = item.formData.medication;
          if (item.entryType === 'injection') {
            payload.dosage = item.formData.dosage;
            payload.weight = item.formData.weight ? parseFloat(item.formData.weight) : null;
          } else {
            payload.quantity = item.formData.quantity;
            payload.dosage = `${item.formData.quantity} week supply`;
          }
        } else if (item.serviceType.id === 'vitamin') {
          payload.medication = item.formData.medication;
          payload.quantity = item.formData.quantity || 1;
          payload.dosage = item.formData.quantity > 1 ? `${item.formData.quantity} injections` : 'Standard';
        } else if (item.serviceType.id === 'peptide') {
          payload.medication = item.formData.medication;
          if (item.entryType === 'injection') {
            payload.dosage = item.formData.dosage || 'Standard';
          } else {
            payload.quantity = item.formData.quantity || 1;
            payload.dosage = `${item.formData.quantity} vial(s)`;
          }
        } else if (item.serviceType.id === 'iv_therapy') {
          payload.medication = item.formData.medication;
          payload.duration = item.formData.duration;
        } else if (item.serviceType.id === 'hbot') {
          payload.medication = 'HBOT Session';
          payload.duration = 60;
        } else if (item.serviceType.id === 'red_light') {
          payload.medication = 'Red Light Session';
          payload.duration = item.formData.duration || 20;
        }

        // If creating a new protocol, do that first
        if (item.createProtocol && item.protocolData) {
          const protocolPayload = {
            patient_id: selectedPatient.id,
            program_type: item.serviceType.programType,
            program_name: item.formData.medication || item.serviceType.label,
            medication: item.formData.medication || null,
            dose: item.formData.dosage || null,
            frequency: item.protocolData.frequency || null,
            delivery_method: item.protocolData.deliveryMethod || 'take_home',
            supply_type: item.protocolData.supplyType || null,
            total_sessions: item.protocolData.totalSessions ? parseInt(item.protocolData.totalSessions) : null,
            start_date: visitDate
          };

          const protocolRes = await fetch('/api/protocols/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(protocolPayload)
          });

          if (!protocolRes.ok) {
            const pErr = await protocolRes.json();
            console.error('Protocol creation error:', pErr);
          }
        }

        // Create the service log entry
        const res = await fetch('/api/service-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          results.push({ item, success: true, data });
        } else {
          errors.push({ item, error: data.error });
        }
      } catch (err) {
        errors.push({ item, error: err.message });
      }
    }

    setSubmitting(false);

    if (errors.length === 0) {
      closeModal();
      fetchLogs();
      alert(`✓ ${results.length} service(s) logged for ${selectedPatient.displayName}`);
    } else {
      alert(`Logged ${results.length} service(s), ${errors.length} error(s):\n${errors.map(e => e.error).join('\n')}`);
      if (results.length > 0) {
        fetchLogs();
      }
    }
  };

  const deleteLog = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/service-log?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = dateStr.length === 10 ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
  };

  const getServiceIcon = (category) => {
    const service = SERVICE_TYPES.find(s => s.id === category);
    return service ? service.icon : '📋';
  };

  const getServiceLabel = (category) => {
    const service = SERVICE_TYPES.find(s => s.id === category);
    return service ? service.label : category;
  };

  const getTypeBadge = (entryType) => {
    switch (entryType) {
      case 'pickup': return { label: '📦 Pickup', bg: '#dbeafe', color: '#1d4ed8' };
      case 'session': return { label: '✅ Session', bg: '#f3e8ff', color: '#7c3aed' };
      default: return { label: '💉 Injection', bg: '#dcfce7', color: '#166534' };
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (log.patient_name || '').toLowerCase().includes(term) ||
           (log.medication || '').toLowerCase().includes(term);
  });

  const getItemSummary = (item) => {
    let summary = item.formData.medication || item.serviceType.label;
    if (item.formData.quantity > 1) {
      summary += ` x${item.formData.quantity}`;
    }
    if (item.formData.dosage && item.formData.dosage !== 'Standard') {
      summary += ` @ ${item.formData.dosage}`;
    }
    return summary;
  };

  return (
    <>
      <Head>
        <title>Service Log | Range Medical</title>
      </Head>

      <div style={styles.container}>
        <Link href="/admin/command-center" style={styles.backLink}>← Back to Command Center</Link>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Service Log</h1>
            <p style={styles.subtitle}>Track all services delivered</p>
          </div>
          <button style={styles.newEntryBtn} onClick={openModal}>
            + New Entry
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          <button
            style={{ ...styles.filterTab, ...(viewCategory === 'all' ? styles.filterTabActive : {}) }}
            onClick={() => setViewCategory('all')}
          >
            All
          </button>
          {SERVICE_TYPES.map(st => (
            <button
              key={st.id}
              style={{ ...styles.filterTab, ...(viewCategory === st.id ? styles.filterTabActive : {}) }}
              onClick={() => setViewCategory(st.id)}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by patient or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Logs Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>Service</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Notes</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={styles.emptyState}>Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="7" style={styles.emptyState}>No entries found</td></tr>
              ) : (
                filteredLogs.map(log => {
                  const badge = getTypeBadge(log.entry_type);
                  return (
                    <tr key={log.id} style={styles.tr}>
                      <td style={styles.td}>{formatDate(log.entry_date || log.created_at)}</td>
                      <td style={styles.td}>
                        <Link href={`/admin/patients/${log.patient_id}`} style={styles.patientLink}>
                          {log.patient_name || 'Unknown'}
                        </Link>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.serviceLabel}>
                          {getServiceIcon(log.category)} {getServiceLabel(log.category)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {log.medication && <span>{log.medication}</span>}
                        {log.dosage && <span style={styles.doseText}> • {log.dosage}</span>}
                        {log.weight && <span style={styles.weightText}> • {log.weight} lbs</span>}
                      </td>
                      <td style={styles.td}>{log.notes || '-'}</td>
                      <td style={styles.td}>
                        <button style={styles.deleteBtn} onClick={() => deleteLog(log.id)}>×</button>
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
          Today: <strong>{logs.filter(l => {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
            return (l.entry_date || '').split('T')[0] === today;
          }).length}</strong>
          <span style={{ marginLeft: '24px' }}>This Week: <strong>{logs.filter(l => {
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(l.entry_date || l.created_at) >= weekAgo;
          }).length}</strong></span>
        </div>

        {/* ===== NEW ENTRY MODAL ===== */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              {/* Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  {modalStep > 1 && modalStep !== 2 && (
                    <button style={styles.backBtn} onClick={() => setModalStep(modalStep === 3 ? 2 : 3)}>←</button>
                  )}
                  <h2 style={styles.modalTitle}>
                    {modalStep === 1 && 'Select Patient'}
                    {modalStep === 2 && `Visit for ${selectedPatient?.displayName}`}
                    {modalStep === 3 && 'Add Service'}
                  </h2>
                </div>
                <button style={styles.closeBtn} onClick={closeModal}>×</button>
              </div>

              {/* Step 1: Patient Selection */}
              {modalStep === 1 && (
                <div style={styles.modalBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Search Patient</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          setSelectedPatient(null);
                        }}
                        placeholder="Type name or phone..."
                        style={styles.input}
                        autoFocus
                      />
                      {showPatientDropdown && (
                        <div style={styles.dropdown}>
                          {filteredPatients.map(p => {
                            const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Unknown';
                            return (
                              <div key={p.id} style={styles.dropdownItem} onClick={() => selectPatient(p)}>
                                <div style={styles.dropdownName}>{name}</div>
                                <div style={styles.dropdownSub}>{p.phone || p.email || 'No contact'}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedPatient && (
                    <div style={styles.selectedPatientCard}>
                      <div style={styles.selectedPatientName}>{selectedPatient.displayName}</div>
                      <div style={styles.selectedPatientContact}>
                        {selectedPatient.phone || selectedPatient.email}
                      </div>

                      {/* Patient's Protocols */}
                      <div style={styles.protocolsSection}>
                        <div style={styles.protocolsHeader}>Active Protocols</div>
                        {loadingProtocols ? (
                          <div style={styles.protocolsLoading}>Loading...</div>
                        ) : patientProtocols.length === 0 ? (
                          <div style={styles.noProtocols}>No active protocols</div>
                        ) : (
                          <div style={styles.protocolsList}>
                            {patientProtocols.map(p => (
                              <div key={p.id} style={styles.protocolItem}>
                                <span style={styles.protocolName}>{p.program_name || p.program_type}</span>
                                {p.total_sessions > 0 && (
                                  <span style={styles.protocolSessions}>
                                    {p.total_sessions - (p.sessions_used || 0)} of {p.total_sessions} remaining
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        style={styles.continueBtn}
                        onClick={goToVisitBuilder}
                      >
                        Continue →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Visit Builder */}
              {modalStep === 2 && (
                <div style={styles.modalBody}>
                  {/* Visit Date */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Visit Date</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      style={{ ...styles.input, maxWidth: '180px' }}
                    />
                  </div>

                  {/* Visit Items List */}
                  <div style={styles.visitItemsSection}>
                    <div style={styles.visitItemsHeader}>
                      <span>Services ({visitItems.length})</span>
                    </div>

                    {visitItems.length === 0 ? (
                      <div style={styles.noVisitItems}>
                        No services added yet. Click below to add services.
                      </div>
                    ) : (
                      <div style={styles.visitItemsList}>
                        {visitItems.map((item, idx) => (
                          <div key={item.id} style={styles.visitItem}>
                            <div style={styles.visitItemMain}>
                              <span style={styles.visitItemIcon}>{item.serviceType.icon}</span>
                              <div style={styles.visitItemDetails}>
                                <div style={styles.visitItemTitle}>{item.serviceType.label}</div>
                                <div style={styles.visitItemSub}>
                                  {getItemSummary(item)}
                                  {item.createProtocol && (
                                    <span style={styles.newProtocolBadge}>+ New Protocol</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              style={styles.removeItemBtn}
                              onClick={() => removeVisitItem(item.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button style={styles.addServiceBtn} onClick={openAddService}>
                      + Add Service
                    </button>
                  </div>

                  {/* Save Visit */}
                  {visitItems.length > 0 && (
                    <button
                      style={styles.submitBtn}
                      onClick={handleSubmitVisit}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : `Save Visit (${visitItems.length} service${visitItems.length > 1 ? 's' : ''})`}
                    </button>
                  )}
                </div>
              )}

              {/* Step 3: Add Service */}
              {modalStep === 3 && (
                <div style={styles.modalBody}>
                  {/* Service Type Selection */}
                  {!currentServiceType ? (
                    <div style={styles.serviceGrid}>
                      {SERVICE_TYPES.map(st => {
                        const protocol = getProtocolForService(st.id);
                        return (
                          <button
                            key={st.id}
                            style={styles.serviceCard}
                            onClick={() => selectServiceType(st)}
                          >
                            <span style={styles.serviceIcon}>{st.icon}</span>
                            <span style={styles.serviceName}>{st.label}</span>
                            {protocol ? (
                              <span style={styles.serviceProtocolActive}>
                                ✓ Active protocol
                                {protocol.total_sessions > 0 &&
                                  ` (${protocol.total_sessions - (protocol.sessions_used || 0)} left)`
                                }
                              </span>
                            ) : (
                              <span style={styles.serviceProtocolNone}>No protocol</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {/* Service type header */}
                      <div style={styles.serviceTypeHeader}>
                        <span style={styles.serviceTypeIcon}>{currentServiceType.icon}</span>
                        <span style={styles.serviceTypeName}>{currentServiceType.label}</span>
                        <button style={styles.changeServiceBtn} onClick={() => setCurrentServiceType(null)}>
                          Change
                        </button>
                      </div>

                      {/* Protocol creation notice */}
                      {showProtocolForm && (
                        <div style={styles.protocolNotice}>
                          <strong>No active protocol</strong> — Fill in the protocol details below to create one.
                        </div>
                      )}

                      {/* === TESTOSTERONE === */}
                      {currentServiceType.id === 'testosterone' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Type</label>
                            <div style={styles.toggleGroup}>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'injection' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('injection')}
                              >
                                💉 In-Clinic Injection
                              </button>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'pickup' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('pickup')}
                              >
                                📦 Medication Pickup
                              </button>
                            </div>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>HRT Type</label>
                            <select
                              value={formData.hrt_type}
                              onChange={(e) => setFormData(prev => ({ ...prev, hrt_type: e.target.value, dosage: '' }))}
                              style={styles.select}
                            >
                              <option value="male">Male HRT (200mg/ml)</option>
                              <option value="female">Female HRT (100mg/ml)</option>
                            </select>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Dosage</label>
                            <select
                              value={formData.dosage}
                              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                              style={styles.select}
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
                              />
                            )}
                          </div>

                          {entryType === 'pickup' && (
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
                                    <option value="4">4 syringes (2 weeks)</option>
                                    <option value="8">8 syringes (4 weeks)</option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}

                          {/* Protocol fields for HRT */}
                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Supply Type</label>
                                <select
                                  value={protocolData.supplyType}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, supplyType: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.hrt.supplyTypes.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* === WEIGHT LOSS === */}
                      {currentServiceType.id === 'weight_loss' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Type</label>
                            <div style={styles.toggleGroup}>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'injection' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('injection')}
                              >
                                💉 In-Clinic Injection
                              </button>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'pickup' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('pickup')}
                              >
                                📦 Medication Pickup
                              </button>
                            </div>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Medication</label>
                            <select
                              value={formData.medication}
                              onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value, dosage: '' }))}
                              style={styles.select}
                            >
                              {WEIGHT_LOSS_MEDS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          </div>

                          {entryType === 'injection' && (
                            <>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Current Weight (lbs)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={formData.weight}
                                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                  placeholder="e.g. 215.5"
                                  style={styles.input}
                                />
                              </div>

                              <div style={styles.formGroup}>
                                <label style={styles.label}>Dosage</label>
                                <select
                                  value={formData.dosage}
                                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select dosage...</option>
                                  {(WEIGHT_LOSS_MEDS.find(m => m.value === formData.medication)?.dosages || []).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}

                          {entryType === 'pickup' && (
                            <div style={styles.formGroup}>
                              <label style={styles.label}>Supply Duration</label>
                              <select
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                style={styles.select}
                              >
                                <option value="2">2 weeks</option>
                                <option value="4">4 weeks</option>
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {/* === VITAMINS === */}
                      {currentServiceType.id === 'vitamin' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Injection</label>
                            <select
                              value={formData.medication}
                              onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                              style={styles.select}
                            >
                              <option value="">Select injection...</option>
                              {VITAMIN_OPTIONS.map(v => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                              ))}
                            </select>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Quantity</label>
                            <select
                              value={formData.quantity}
                              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                              style={styles.select}
                            >
                              <option value="1">1 injection</option>
                              <option value="2">2 injections</option>
                              <option value="3">3 injections</option>
                            </select>
                          </div>

                          {/* Protocol fields for Vitamins */}
                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Frequency</label>
                                <select
                                  value={protocolData.frequency}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, frequency: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.vitamin.frequencies.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* === PEPTIDES === */}
                      {currentServiceType.id === 'peptide' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Type</label>
                            <div style={styles.toggleGroup}>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'injection' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('injection')}
                              >
                                💉 In-Clinic Injection
                              </button>
                              <button
                                style={{ ...styles.toggleBtn, ...(entryType === 'pickup' ? styles.toggleBtnActive : {}) }}
                                onClick={() => setEntryType('pickup')}
                              >
                                📦 Vial Pickup
                              </button>
                            </div>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Peptide</label>
                            <select
                              value={formData.medication}
                              onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                              style={styles.select}
                            >
                              <option value="">Select peptide...</option>
                              {PEPTIDE_OPTIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>

                          {entryType === 'injection' && (
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

                          {entryType === 'pickup' && (
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

                          {/* Protocol fields for Peptides */}
                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Frequency</label>
                                  <select
                                    value={protocolData.frequency}
                                    onChange={(e) => setProtocolData(prev => ({ ...prev, frequency: e.target.value }))}
                                    style={styles.select}
                                  >
                                    <option value="">Select...</option>
                                    {PROTOCOL_CONFIG.peptide.frequencies.map(f => (
                                      <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={styles.formGroup}>
                                  <label style={styles.label}>Duration</label>
                                  <select
                                    value={protocolData.duration}
                                    onChange={(e) => setProtocolData(prev => ({ ...prev, duration: e.target.value }))}
                                    style={styles.select}
                                  >
                                    <option value="">Select...</option>
                                    {PROTOCOL_CONFIG.peptide.durations.map(d => (
                                      <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* === IV THERAPY === */}
                      {currentServiceType.id === 'iv_therapy' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>IV Type</label>
                            <select
                              value={formData.medication}
                              onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                              style={styles.select}
                            >
                              <option value="">Select IV...</option>
                              {IV_OPTIONS.map(iv => (
                                <option key={iv.value} value={iv.value}>{iv.label}</option>
                              ))}
                            </select>
                          </div>

                          <div style={styles.formGroup}>
                            <label style={styles.label}>Duration</label>
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

                          {/* Protocol fields for IV */}
                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Total Sessions</label>
                                <select
                                  value={protocolData.totalSessions}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.iv_therapy.sessions.map(s => (
                                    <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* === HBOT === */}
                      {currentServiceType.id === 'hbot' && (
                        <>
                          <div style={styles.infoBox}>
                            🫁 60-minute session at 2.0 ATA
                          </div>

                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Total Sessions</label>
                                <select
                                  value={protocolData.totalSessions}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.hbot.sessions.map(s => (
                                    <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* === RED LIGHT === */}
                      {currentServiceType.id === 'red_light' && (
                        <>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Duration</label>
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

                          {showProtocolForm && (
                            <div style={styles.protocolFields}>
                              <div style={styles.protocolFieldsTitle}>Protocol Details</div>
                              <div style={styles.formGroup}>
                                <label style={styles.label}>Total Sessions</label>
                                <select
                                  value={protocolData.totalSessions}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                  style={styles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.red_light.sessions.map(s => (
                                    <option key={s} value={s}>{s} session{s > 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Notes */}
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Notes (optional)</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes..."
                          style={styles.textarea}
                          rows={2}
                        />
                      </div>

                      {/* Add to Visit */}
                      <button
                        style={styles.addToVisitBtn}
                        onClick={addServiceToVisit}
                      >
                        Add to Visit
                      </button>
                    </>
                  )}
                </div>
              )}
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
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '16px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  newEntryBtn: {
    padding: '12px 24px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  filterTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  filterTab: {
    padding: '8px 14px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer'
  },
  filterTabActive: {
    background: '#111',
    color: '#fff'
  },
  searchBar: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  tableContainer: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    background: '#fafafa',
    borderBottom: '2px solid #e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151'
  },
  patientLink: {
    color: '#111',
    textDecoration: 'none',
    fontWeight: '500'
  },
  serviceLabel: {
    fontSize: '13px'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  doseText: {
    color: '#6b7280',
    fontSize: '13px'
  },
  weightText: {
    color: '#059669',
    fontSize: '13px',
    fontWeight: '500'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '18px',
    cursor: 'pointer'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  stats: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#6b7280'
  },

  // Modal
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
    borderRadius: '16px',
    width: '560px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: '#6b7280'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },

  // Form elements
  formGroup: {
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
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
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#fff'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6'
  },
  dropdownName: {
    fontWeight: '500'
  },
  dropdownSub: {
    fontSize: '12px',
    color: '#6b7280'
  },

  // Selected patient card
  selectedPatientCard: {
    marginTop: '16px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb'
  },
  selectedPatientName: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  selectedPatientContact: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px'
  },
  protocolsSection: {
    marginBottom: '16px'
  },
  protocolsHeader: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  protocolsLoading: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  noProtocols: {
    fontSize: '14px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  protocolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  protocolItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#fff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  protocolName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  protocolSessions: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500'
  },
  continueBtn: {
    width: '100%',
    padding: '12px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Visit Builder
  visitItemsSection: {
    marginTop: '16px'
  },
  visitItemsHeader: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  noVisitItems: {
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  visitItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px'
  },
  visitItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px'
  },
  visitItemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  visitItemIcon: {
    fontSize: '20px'
  },
  visitItemDetails: {
    flex: 1
  },
  visitItemTitle: {
    fontWeight: '600',
    fontSize: '14px'
  },
  visitItemSub: {
    fontSize: '13px',
    color: '#6b7280'
  },
  newProtocolBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    padding: '2px 6px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500'
  },
  removeItemBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  addServiceBtn: {
    width: '100%',
    padding: '12px',
    background: '#f3f4f6',
    color: '#374151',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  // Service type grid
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  serviceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  serviceIcon: {
    fontSize: '28px',
    marginBottom: '8px'
  },
  serviceName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
    textAlign: 'center'
  },
  serviceProtocolActive: {
    fontSize: '11px',
    color: '#059669',
    fontWeight: '500'
  },
  serviceProtocolNone: {
    fontSize: '11px',
    color: '#9ca3af'
  },

  // Service type header
  serviceTypeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    background: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  serviceTypeIcon: {
    fontSize: '24px'
  },
  serviceTypeName: {
    flex: 1,
    fontWeight: '600',
    fontSize: '16px'
  },
  changeServiceBtn: {
    padding: '4px 10px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },

  // Protocol form
  protocolNotice: {
    padding: '12px 14px',
    background: '#fef3c7',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '16px'
  },
  protocolFields: {
    padding: '14px',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  protocolFieldsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  },

  // Toggle buttons
  toggleGroup: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    flex: 1,
    padding: '10px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  toggleBtnActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111'
  },

  infoBox: {
    padding: '12px',
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#166534',
    fontWeight: '500',
    marginBottom: '16px'
  },

  addToVisitBtn: {
    width: '100%',
    padding: '14px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px'
  }
};
