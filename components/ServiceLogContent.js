// components/ServiceLogContent.js
// Reusable Service Log content — used in both /admin/service-log page and Command Center tab

import { useState, useEffect } from 'react';
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
  { value: 'Taurine', label: 'Taurine' },
  { value: 'Toradol', label: 'Toradol' }
];

const PEPTIDE_OPTIONS = [
  { value: 'BPC-157', label: 'BPC-157' },
  { value: 'TB-500', label: 'TB-500' },
  { value: 'BPC-157/TB-500', label: 'BPC-157 + TB-500' },
  { value: 'BPC-157/Thymosin Beta 4', label: 'BPC-157 + Thymosin Beta 4' },
  { value: 'Sermorelin', label: 'Sermorelin' },
  { value: 'Tesamorelin', label: 'Tesamorelin' },
  { value: 'CJC-1295/Ipamorelin', label: 'CJC-1295/Ipamorelin' },
  { value: 'PT-141', label: 'PT-141' },
  { value: 'Semax', label: 'Semax' },
  { value: 'Selank', label: 'Selank' },
  { value: 'MOTS-C', label: 'MOTS-C' },
  { value: 'SS-31', label: 'SS-31' },
  { value: 'AOD-9604', label: 'AOD-9604' },
  { value: 'Other', label: 'Other (specify in notes)' }
];

const IV_OPTIONS = [
  { value: 'Range Energy IV', label: 'Range Energy IV' },
  { value: 'Range Hydration IV', label: 'Range Hydration IV' },
  { value: 'Range Immune IV', label: 'Range Immune IV' },
  { value: 'Range Glow IV', label: 'Range Glow IV' },
  { value: 'Range Brain IV', label: 'Range Brain IV' },
  { value: 'Range Performance IV', label: 'Range Performance IV' },
  { value: 'Range NAD+ IV 250mg', label: 'Range NAD+ IV 250mg' },
  { value: 'Range NAD+ IV 500mg', label: 'Range NAD+ IV 500mg' },
  { value: 'Range NAD+ IV 750mg', label: 'Range NAD+ IV 750mg' },
  { value: 'Range NAD+ IV 1000mg', label: 'Range NAD+ IV 1000mg' },
  { value: 'Range Methylene Blue IV', label: 'Range Methylene Blue IV' },
  { value: 'Range High-Dose Vitamin C', label: 'Range High-Dose Vitamin C' },
  { value: 'Range Magnesium IV', label: 'Range Magnesium IV' },
  { value: 'Custom Range IV', label: 'Custom Range IV' }
];

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
      { value: 'daily', label: 'Daily' },
      { value: '5x_weekly', label: '5 times a week' },
      { value: '4x_weekly', label: '4 times a week' },
      { value: '3x_weekly', label: '3 times a week' },
      { value: '2x_weekly', label: '2 times a week' },
      { value: 'weekly', label: '1 time a week' }
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

export default function ServiceLogContent() {
  // View state
  const [viewCategory, setViewCategory] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit log state
  const [editingLog, setEditingLog] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);

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

  // Protocol selection state (for services with multiple active protocols)
  const [selectedProtocolId, setSelectedProtocolId] = useState(null);
  const [availableProtocols, setAvailableProtocols] = useState([]);

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
      const res = await fetch('/api/admin/command-center');
      const data = await res.json();
      if (data.success && data.protocols) {
        const patientActiveProtocols = data.protocols
          .filter(p => p.patient_id === patientId && p.status === 'active')
          .map(p => {
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
    setSelectedProtocolId(null);
    setAvailableProtocols([]);
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
    setSelectedProtocolId(null);
    setAvailableProtocols([]);
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

    const protocol = getProtocolForService(serviceType.id);

    if (serviceType.id === 'vitamin') {
      // Vitamin: handle multiple active protocols (e.g. B12 12-pack + NAD+ 12-pack)
      const protocols = getProtocolsForService(serviceType.id);
      setAvailableProtocols(protocols);
      setEntryType('injection');
      setProtocolData(prev => ({ ...prev, frequency: 'weekly' }));

      if (protocols.length === 1) {
        // Single protocol — auto-select it
        setSelectedProtocolId(protocols[0].id);
        setShowProtocolForm(false);
      } else if (protocols.length > 1) {
        // Multiple protocols — show selector, don't auto-link
        setSelectedProtocolId(null);
        setShowProtocolForm(false);
      } else {
        // No protocols — show protocol creation form
        setSelectedProtocolId(null);
        setShowProtocolForm(true);
      }
    } else if (serviceType.id === 'weight_loss') {
      // Weight loss: auto-link to existing protocol so protocol_id is explicitly passed to API
      const protocols = getProtocolsForService(serviceType.id);
      setAvailableProtocols(protocols);
      setEntryType('injection');
      setFormData(prev => ({ ...prev, medication: protocol?.medication || 'Semaglutide', dosage: protocol?.selected_dose || '' }));
      setProtocolData(prev => ({ ...prev, frequency: 'weekly', deliveryMethod: 'in_clinic' }));

      if (protocols.length >= 1) {
        setSelectedProtocolId(protocols[0].id);
        setShowProtocolForm(false);
      } else {
        setSelectedProtocolId(null);
        setShowProtocolForm(true);
      }
    } else {
      setShowProtocolForm(!protocol);
      setSelectedProtocolId(null);
      setAvailableProtocols([]);

      if (serviceType.id === 'iv_therapy') {
        setFormData(prev => ({ ...prev, medication: protocol?.medication || 'Energy IV' }));
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
      } else if (serviceType.id === 'peptide') {
        // Auto-fill from protocol if exists, default to med_pickup for take-home
        if (protocol) {
          setFormData(prev => ({ ...prev, medication: protocol.medication || '', dosage: protocol.selected_dose || '' }));
          setEntryType(protocol.delivery_method === 'take_home' ? 'med_pickup' : 'injection');
        } else {
          setEntryType('injection');
        }
        setProtocolData(prev => ({ ...prev, frequency: 'daily', duration: '30' }));
      } else if (serviceType.id === 'testosterone') {
        setEntryType(protocol?.delivery_method === 'take_home' ? 'pickup' : 'injection');
        setProtocolData(prev => ({ ...prev, frequency: '2x_weekly', supplyType: 'prefilled' }));
      }
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
      createProtocol: showProtocolForm,
      protocolId: selectedProtocolId || null
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

  const getProtocolsForService = (serviceId) => {
    const programType = SERVICE_TYPES.find(s => s.id === serviceId)?.programType;
    return patientProtocols.filter(p => p.program_type === programType);
  };

  const handleSubmitVisit = async () => {
    if (!selectedPatient || visitItems.length === 0) return;

    setSubmitting(true);
    const results = [];
    const errors = [];

    for (const item of visitItems) {
      try {
        const payload = {
          patient_id: selectedPatient.id,
          category: item.serviceType.id,
          entry_type: item.entryType,
          entry_date: visitDate,
          notes: item.formData.notes || null,
          protocol_id: item.protocolId || null
        };

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
            payload.dosage = item.formData.dosage
              ? `${item.formData.quantity} week supply @ ${item.formData.dosage}`
              : `${item.formData.quantity} week supply`;
          }
        } else if (item.serviceType.id === 'vitamin') {
          payload.medication = item.formData.medication;
          payload.quantity = item.formData.quantity || 1;
          payload.dosage = item.formData.quantity > 1 ? `${item.formData.quantity} injections` : 'Standard';
        } else if (item.serviceType.id === 'peptide') {
          payload.medication = item.formData.medication;
          if (item.entryType === 'injection') {
            payload.dosage = item.formData.dosage || 'Standard';
          } else if (item.entryType === 'med_pickup') {
            payload.entry_type = 'pickup';
            payload.quantity = item.formData.quantity || 1;
            payload.dosage = item.formData.dosage || 'Standard';
            payload.supply_type = 'medication';
          } else {
            payload.quantity = item.formData.quantity || 1;
            payload.dosage = item.formData.dosage
              ? `${item.formData.quantity} vial(s) @ ${item.formData.dosage}`
              : `${item.formData.quantity} vial(s)`;
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

          if (protocolRes.ok) {
            const pData = await protocolRes.json();
            // Pass the newly created protocol_id to the service log so it links correctly
            if (pData.protocol?.id) {
              payload.protocol_id = pData.protocol.id;
            }
          } else {
            const pErr = await protocolRes.json();
            console.error('Protocol creation error:', pErr);
          }
        }

        const res = await fetch('/api/service-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          results.push({ item, success: true, data });
          // Warn if protocol update failed silently
          if (data.protocol_update && !data.protocol_update.updated && !data.protocol_update.created) {
            console.warn('Protocol update failed:', data.protocol_update);
          }
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
      // Re-fetch protocols so UI reflects updated next_expected_date
      if (selectedPatient) {
        fetchPatientProtocols(selectedPatient.id);
      }
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
      if (res.ok) {
        fetchLogs();
      } else {
        const data = await res.json().catch(() => ({}));
        alert('Failed to delete entry: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const saveEditLog = async () => {
    if (!editingLog) return;
    try {
      const res = await fetch(`/api/service-log?id=${editingLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: editingLog.entry_type,
          entry_date: editingLog.entry_date,
          medication: editingLog.medication || null,
          dosage: editingLog.dosage || null,
          weight: editingLog.weight ? parseFloat(editingLog.weight) : null,
          quantity: editingLog.quantity ? parseInt(editingLog.quantity) : null,
          supply_type: editingLog.supply_type || null,
          duration: editingLog.duration ? parseInt(editingLog.duration) : null,
          notes: editingLog.notes || null
        })
      });
      if (res.ok) {
        setEditingLog(null);
        fetchLogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Error saving log:', err);
      alert('Error saving log');
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
    <div style={slcStyles.wrapper}>
      {/* Top bar with button */}
      <div style={slcStyles.topBar}>
        <button style={slcStyles.newEntryBtn} onClick={openModal}>
          + New Entry
        </button>
      </div>

      {/* Filters */}
      <div style={slcStyles.filters}>
        <div style={slcStyles.filterTabs}>
          <button
            style={{ ...slcStyles.filterTab, ...(viewCategory === 'all' ? slcStyles.filterTabActive : {}) }}
            onClick={() => setViewCategory('all')}
          >
            All
          </button>
          {SERVICE_TYPES.map(st => (
            <button
              key={st.id}
              style={{ ...slcStyles.filterTab, ...(viewCategory === st.id ? slcStyles.filterTabActive : {}) }}
              onClick={() => setViewCategory(st.id)}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={slcStyles.searchBar}>
          <input
            type="text"
            placeholder="Search by patient or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={slcStyles.searchInput}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div style={slcStyles.tableContainer}>
        <table style={slcStyles.table}>
          <thead>
            <tr>
              <th style={slcStyles.th}>Date</th>
              <th style={slcStyles.th}>Patient</th>
              <th style={slcStyles.th}>Service</th>
              <th style={slcStyles.th}>Type</th>
              <th style={slcStyles.th}>Details</th>
              <th style={slcStyles.th}>Notes</th>
              <th style={slcStyles.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={slcStyles.emptyState}>Loading...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="7" style={slcStyles.emptyState}>No entries found</td></tr>
            ) : (
              filteredLogs.map(log => {
                const badge = getTypeBadge(log.entry_type);
                return (
                  <tr key={log.id} style={slcStyles.tr}>
                    <td style={slcStyles.td}>{formatDate(log.entry_date || log.created_at)}</td>
                    <td style={slcStyles.td}>
                      <Link href={`/admin/patients/${log.patient_id}`} style={slcStyles.patientLink}>
                        {log.patient_name || 'Unknown'}
                      </Link>
                    </td>
                    <td style={slcStyles.td}>
                      <span style={slcStyles.serviceLabel}>
                        {getServiceIcon(log.category)} {getServiceLabel(log.category)}
                      </span>
                    </td>
                    <td style={slcStyles.td}>
                      <span style={{ ...slcStyles.badge, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={slcStyles.td}>
                      {log.medication && <span>{log.medication}</span>}
                      {log.dosage && <span style={slcStyles.doseText}> • {log.dosage}</span>}
                      {log.weight && <span style={slcStyles.weightText}> • {log.weight} lbs</span>}
                    </td>
                    <td style={slcStyles.td}>{log.notes || '-'}</td>
                    <td style={{ ...slcStyles.td, whiteSpace: 'nowrap' }}>
                      <button style={slcStyles.editBtn} onClick={() => setEditingLog({ ...log })} title="Edit">✏️</button>
                      <button style={slcStyles.deleteBtn} onClick={() => deleteLog(log.id)}>×</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div style={slcStyles.stats}>
        Today: <strong>{logs.filter(l => {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
          return (l.entry_date || '').split('T')[0] === today;
        }).length}</strong>
        <span style={{ marginLeft: '24px' }}>This Week: <strong>{logs.filter(l => {
          const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(l.entry_date || l.created_at) >= weekAgo;
        }).length}</strong></span>
      </div>

      {/* ===== EDIT LOG MODAL ===== */}
      {editingLog && (
        <div style={slcStyles.modalOverlay} onClick={() => setEditingLog(null)}>
          <div style={{ ...slcStyles.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={slcStyles.modalHeader}>
              <h2 style={slcStyles.modalTitle}>Edit Service Log</h2>
              <button style={slcStyles.modalClose} onClick={() => setEditingLog(null)}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={slcStyles.editLabel}>Date</label>
                  <input type="date" value={editingLog.entry_date?.split('T')[0] || ''} onChange={e => setEditingLog({ ...editingLog, entry_date: e.target.value })} style={slcStyles.editInput} />
                </div>
                <div>
                  <label style={slcStyles.editLabel}>Type</label>
                  <select value={editingLog.entry_type || 'injection'} onChange={e => setEditingLog({ ...editingLog, entry_type: e.target.value })} style={slcStyles.editInput}>
                    <option value="injection">Injection</option>
                    <option value="pickup">Pickup</option>
                    <option value="session">Session</option>
                  </select>
                </div>
                <div>
                  <label style={slcStyles.editLabel}>Medication</label>
                  <input type="text" value={editingLog.medication || ''} onChange={e => setEditingLog({ ...editingLog, medication: e.target.value })} style={slcStyles.editInput} />
                </div>
                <div>
                  <label style={slcStyles.editLabel}>Dosage</label>
                  <input type="text" value={editingLog.dosage || ''} onChange={e => setEditingLog({ ...editingLog, dosage: e.target.value })} style={slcStyles.editInput} />
                </div>
                <div>
                  <label style={slcStyles.editLabel}>Weight (lbs)</label>
                  <input type="number" step="0.1" value={editingLog.weight || ''} onChange={e => setEditingLog({ ...editingLog, weight: e.target.value })} style={slcStyles.editInput} />
                </div>
                <div>
                  <label style={slcStyles.editLabel}>Quantity</label>
                  <input type="number" value={editingLog.quantity || ''} onChange={e => setEditingLog({ ...editingLog, quantity: e.target.value })} style={slcStyles.editInput} />
                </div>
              </div>
              <div>
                <label style={slcStyles.editLabel}>Notes</label>
                <textarea value={editingLog.notes || ''} onChange={e => setEditingLog({ ...editingLog, notes: e.target.value })} rows={3} style={{ ...slcStyles.editInput, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setEditingLog(null)} style={{ padding: '8px 20px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={saveEditLog} style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== NEW ENTRY MODAL ===== */}
      {showModal && (
        <div style={slcStyles.modalOverlay}>
          <div style={slcStyles.modal}>
            {/* Header */}
            <div style={slcStyles.modalHeader}>
              <div style={slcStyles.modalHeaderLeft}>
                {modalStep > 1 && modalStep !== 2 && (
                  <button style={slcStyles.backBtn} onClick={() => setModalStep(modalStep === 3 ? 2 : 3)}>←</button>
                )}
                <h2 style={slcStyles.modalTitle}>
                  {modalStep === 1 && 'Select Patient'}
                  {modalStep === 2 && `Visit for ${selectedPatient?.displayName}`}
                  {modalStep === 3 && 'Add Service'}
                </h2>
              </div>
              <button style={slcStyles.closeBtn} onClick={closeModal}>×</button>
            </div>

            {/* Step 1: Patient Selection */}
            {modalStep === 1 && (
              <div style={slcStyles.modalBody}>
                <div style={slcStyles.formGroup}>
                  <label style={slcStyles.label}>Search Patient</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setSelectedPatient(null);
                      }}
                      placeholder="Type name or phone..."
                      style={slcStyles.input}
                      autoFocus
                    />
                    {showPatientDropdown && (
                      <div style={slcStyles.dropdown}>
                        {filteredPatients.map(p => {
                          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Unknown';
                          return (
                            <div key={p.id} style={slcStyles.dropdownItem} onClick={() => selectPatient(p)}>
                              <div style={slcStyles.dropdownName}>{name}</div>
                              <div style={slcStyles.dropdownSub}>{p.phone || p.email || 'No contact'}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPatient && (
                  <div style={slcStyles.selectedPatientCard}>
                    <div style={slcStyles.selectedPatientName}>{selectedPatient.displayName}</div>
                    <div style={slcStyles.selectedPatientContact}>
                      {selectedPatient.phone || selectedPatient.email}
                    </div>

                    {/* Patient's Protocols */}
                    <div style={slcStyles.protocolsSection}>
                      <div style={slcStyles.protocolsHeader}>Active Protocols</div>
                      {loadingProtocols ? (
                        <div style={slcStyles.protocolsLoading}>Loading...</div>
                      ) : patientProtocols.length === 0 ? (
                        <div style={slcStyles.noProtocols}>No active protocols</div>
                      ) : (
                        <div style={slcStyles.protocolsList}>
                          {patientProtocols.map(p => (
                            <div key={p.id} style={slcStyles.protocolItem}>
                              <span style={slcStyles.protocolName}>{p.program_name || p.program_type}</span>
                              {p.total_sessions > 0 && (
                                <span style={slcStyles.protocolSessions}>
                                  {p.total_sessions - (p.sessions_used || 0)} of {p.total_sessions} remaining
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      style={slcStyles.continueBtn}
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
              <div style={slcStyles.modalBody}>
                {/* Visit Date */}
                <div style={slcStyles.formGroup}>
                  <label style={slcStyles.label}>Visit Date</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    style={{ ...slcStyles.input, maxWidth: '180px' }}
                  />
                </div>

                {/* Visit Items List */}
                <div style={slcStyles.visitItemsSection}>
                  <div style={slcStyles.visitItemsHeader}>
                    <span>Services ({visitItems.length})</span>
                  </div>

                  {visitItems.length === 0 ? (
                    <div style={slcStyles.noVisitItems}>
                      No services added yet. Click below to add services.
                    </div>
                  ) : (
                    <div style={slcStyles.visitItemsList}>
                      {visitItems.map((item, idx) => (
                        <div key={item.id} style={slcStyles.visitItem}>
                          <div style={slcStyles.visitItemMain}>
                            <span style={slcStyles.visitItemIcon}>{item.serviceType.icon}</span>
                            <div style={slcStyles.visitItemDetails}>
                              <div style={slcStyles.visitItemTitle}>{item.serviceType.label}</div>
                              <div style={slcStyles.visitItemSub}>
                                {getItemSummary(item)}
                                {item.createProtocol && (
                                  <span style={slcStyles.newProtocolBadge}>+ New Protocol</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            style={slcStyles.removeItemBtn}
                            onClick={() => removeVisitItem(item.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button style={slcStyles.addServiceBtn} onClick={openAddService}>
                    + Add Service
                  </button>
                </div>

                {/* Save Visit */}
                {visitItems.length > 0 && (
                  <button
                    style={slcStyles.submitBtn}
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
              <div style={slcStyles.modalBody}>
                {/* Service Type Selection */}
                {!currentServiceType ? (
                  <div style={slcStyles.serviceGrid}>
                    {SERVICE_TYPES.map(st => {
                      const protocols = getProtocolsForService(st.id);
                      return (
                        <button
                          key={st.id}
                          style={slcStyles.serviceCard}
                          onClick={() => selectServiceType(st)}
                        >
                          <span style={slcStyles.serviceIcon}>{st.icon}</span>
                          <span style={slcStyles.serviceName}>{st.label}</span>
                          {protocols.length > 1 ? (
                            <span style={slcStyles.serviceProtocolActive}>
                              ✓ {protocols.length} active protocols
                            </span>
                          ) : protocols.length === 1 ? (
                            <span style={slcStyles.serviceProtocolActive}>
                              ✓ Active protocol
                              {protocols[0].total_sessions > 0 &&
                                ` (${protocols[0].total_sessions - (protocols[0].sessions_used || 0)} left)`
                              }
                            </span>
                          ) : (
                            <span style={slcStyles.serviceProtocolNone}>No protocol</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Service type header */}
                    <div style={slcStyles.serviceTypeHeader}>
                      <span style={slcStyles.serviceTypeIcon}>{currentServiceType.icon}</span>
                      <span style={slcStyles.serviceTypeName}>{currentServiceType.label}</span>
                      <button style={slcStyles.changeServiceBtn} onClick={() => setCurrentServiceType(null)}>
                        Change
                      </button>
                    </div>

                    {/* Protocol creation notice */}
                    {showProtocolForm && (
                      <div style={slcStyles.protocolNotice}>
                        <strong>No active protocol</strong> — Fill in the protocol details below to create one.
                      </div>
                    )}

                    {/* === TESTOSTERONE === */}
                    {currentServiceType.id === 'testosterone' && (
                      <>
                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Type</label>
                          <div style={slcStyles.toggleGroup}>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'injection' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('injection')}
                            >
                              💉 In-Clinic Injection
                            </button>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'pickup' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('pickup')}
                            >
                              📦 Medication Pickup
                            </button>
                          </div>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>HRT Type</label>
                          <select
                            value={formData.hrt_type}
                            onChange={(e) => setFormData(prev => ({ ...prev, hrt_type: e.target.value, dosage: '' }))}
                            style={slcStyles.select}
                          >
                            <option value="male">Male HRT (200mg/ml)</option>
                            <option value="female">Female HRT (100mg/ml)</option>
                          </select>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Dosage</label>
                          <select
                            value={formData.dosage}
                            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                            style={slcStyles.select}
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
                              style={{ ...slcStyles.input, marginTop: '8px' }}
                            />
                          )}
                        </div>

                        {entryType === 'pickup' && (
                          <>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Pickup Type</label>
                              <select
                                value={formData.pickup_type}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  pickup_type: e.target.value,
                                  quantity: e.target.value === 'vial' ? 1 : 4
                                }))}
                                style={slcStyles.select}
                              >
                                <option value="vial">Vial (10ml)</option>
                                <option value="prefilled">Prefilled Syringes</option>
                              </select>
                            </div>

                            {formData.pickup_type === 'prefilled' && (
                              <div style={slcStyles.formGroup}>
                                <label style={slcStyles.label}>Quantity</label>
                                <select
                                  value={formData.quantity}
                                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                  style={slcStyles.select}
                                >
                                  <option value="4">4 syringes (2 weeks)</option>
                                  <option value="6">6 syringes (3 weeks)</option>
                                  <option value="8">8 syringes (4 weeks)</option>
                                </select>
                              </div>
                            )}
                          </>
                        )}

                        {/* Protocol fields for HRT */}
                        {showProtocolForm && (
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Supply Type</label>
                              <select
                                value={protocolData.supplyType}
                                onChange={(e) => setProtocolData(prev => ({ ...prev, supplyType: e.target.value }))}
                                style={slcStyles.select}
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
                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Type</label>
                          <div style={slcStyles.toggleGroup}>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'injection' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('injection')}
                            >
                              💉 In-Clinic Injection
                            </button>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'pickup' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('pickup')}
                            >
                              📦 Medication Pickup
                            </button>
                          </div>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Medication</label>
                          <select
                            value={formData.medication}
                            onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value, dosage: '' }))}
                            style={slcStyles.select}
                          >
                            {WEIGHT_LOSS_MEDS.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>

                        {entryType === 'injection' && (
                          <>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Current Weight (lbs)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.weight}
                                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                placeholder="e.g. 215.5"
                                style={slcStyles.input}
                              />
                            </div>

                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Dosage</label>
                              <select
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                style={slcStyles.select}
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
                          <>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Dosage</label>
                              <select
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                style={slcStyles.select}
                              >
                                <option value="">Select dosage...</option>
                                {Array.from({ length: 30 }, (_, i) => {
                                  const mg = (i + 1) * 0.5;
                                  const label = mg % 1 === 0 ? `${mg}mg` : `${mg.toFixed(1)}mg`;
                                  return <option key={mg} value={label}>{label}</option>;
                                })}
                              </select>
                            </div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Supply Duration</label>
                              <select
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                style={slcStyles.select}
                              >
                                <option value="1">1 week</option>
                                <option value="2">2 weeks</option>
                                <option value="3">3 weeks</option>
                                <option value="4">4 weeks</option>
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* === VITAMINS === */}
                    {currentServiceType.id === 'vitamin' && (
                      <>
                        {/* Protocol selector when patient has 2+ vitamin protocols */}
                        {availableProtocols.length > 1 && (
                          <div style={slcStyles.formGroup}>
                            <label style={slcStyles.label}>Link to Protocol</label>
                            <select
                              value={selectedProtocolId || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__new__') {
                                  setSelectedProtocolId(null);
                                  setShowProtocolForm(true);
                                } else if (val) {
                                  setSelectedProtocolId(val);
                                  setShowProtocolForm(false);
                                } else {
                                  setSelectedProtocolId(null);
                                  setShowProtocolForm(false);
                                }
                              }}
                              style={slcStyles.select}
                            >
                              <option value="">Select protocol...</option>
                              {availableProtocols.map(p => {
                                const remaining = (p.total_sessions || 0) - (p.sessions_used || 0);
                                const name = p.program_name || p.medication || 'Vitamin Protocol';
                                return (
                                  <option key={p.id} value={p.id}>
                                    {name}{p.total_sessions > 0 ? ` (${remaining} of ${p.total_sessions} remaining)` : ''}
                                  </option>
                                );
                              })}
                              <option value="__new__">+ New protocol</option>
                            </select>
                          </div>
                        )}

                        {/* Single protocol indicator */}
                        {availableProtocols.length === 1 && (
                          <div style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px', fontSize: '13px', color: '#166534', marginBottom: '12px' }}>
                            Linked to: <strong>{availableProtocols[0].program_name || availableProtocols[0].medication || 'Vitamin Protocol'}</strong>
                            {availableProtocols[0].total_sessions > 0 &&
                              ` (${availableProtocols[0].total_sessions - (availableProtocols[0].sessions_used || 0)} of ${availableProtocols[0].total_sessions} remaining)`
                            }
                          </div>
                        )}

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Injection</label>
                          <select
                            value={formData.medication}
                            onChange={(e) => {
                              const med = e.target.value;
                              setFormData(prev => ({ ...prev, medication: med }));
                              // Auto-match protocol by medication name when multiple protocols exist
                              if (availableProtocols.length > 1 && med) {
                                const medLower = med.toLowerCase();
                                const match = availableProtocols.find(p => {
                                  const pMed = (p.medication || p.program_name || '').toLowerCase();
                                  return pMed.includes(medLower) || medLower.includes(pMed);
                                });
                                if (match) {
                                  setSelectedProtocolId(match.id);
                                  setShowProtocolForm(false);
                                }
                              }
                            }}
                            style={slcStyles.select}
                          >
                            <option value="">Select injection...</option>
                            {VITAMIN_OPTIONS.map(v => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Quantity</label>
                          <select
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                            style={slcStyles.select}
                          >
                            <option value="1">1 injection</option>
                            <option value="2">2 injections</option>
                            <option value="3">3 injections</option>
                            <option value="4">4 pack</option>
                            <option value="8">8 pack</option>
                            <option value="10">10 pack</option>
                            <option value="12">12 pack</option>
                          </select>
                        </div>

                        {/* Protocol fields for Vitamins */}
                        {showProtocolForm && (
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Frequency</label>
                              <select
                                value={protocolData.frequency}
                                onChange={(e) => setProtocolData(prev => ({ ...prev, frequency: e.target.value }))}
                                style={slcStyles.select}
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
                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Type</label>
                          <div style={slcStyles.toggleGroup}>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'injection' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('injection')}
                            >
                              💉 In-Clinic Injection
                            </button>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'pickup' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('pickup')}
                            >
                              📦 Vial Pickup
                            </button>
                            <button
                              style={{ ...slcStyles.toggleBtn, ...(entryType === 'med_pickup' ? slcStyles.toggleBtnActive : {}) }}
                              onClick={() => setEntryType('med_pickup')}
                            >
                              💊 Medication Pickup
                            </button>
                          </div>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Peptide</label>
                          <select
                            value={formData.medication}
                            onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                            style={slcStyles.select}
                          >
                            <option value="">Select peptide...</option>
                            {formData.medication && !PEPTIDE_OPTIONS.find(p => p.value === formData.medication) && (
                              <option value={formData.medication}>{formData.medication} (from protocol)</option>
                            )}
                            {PEPTIDE_OPTIONS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        {entryType === 'injection' && (
                          <div style={slcStyles.formGroup}>
                            <label style={slcStyles.label}>Dosage</label>
                            <input
                              type="text"
                              value={formData.dosage}
                              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                              placeholder="e.g. 500mcg, 1mg..."
                              style={slcStyles.input}
                            />
                          </div>
                        )}

                        {entryType === 'pickup' && (
                          <>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Dosage</label>
                              <input
                                type="text"
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g. 500mcg, 1mg..."
                                style={slcStyles.input}
                              />
                            </div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Quantity (vials)</label>
                              <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                style={slcStyles.input}
                              />
                            </div>
                          </>
                        )}

                        {entryType === 'med_pickup' && (
                          <>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Dosage</label>
                              <input
                                type="text"
                                value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g. 500mcg, 1mg..."
                                style={slcStyles.input}
                              />
                            </div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                                style={slcStyles.input}
                              />
                            </div>
                          </>
                        )}

                        {/* Protocol fields for Peptides */}
                        {showProtocolForm && (
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formRow}>
                              <div style={slcStyles.formGroup}>
                                <label style={slcStyles.label}>Frequency</label>
                                <select
                                  value={protocolData.frequency}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, frequency: e.target.value }))}
                                  style={slcStyles.select}
                                >
                                  <option value="">Select...</option>
                                  {PROTOCOL_CONFIG.peptide.frequencies.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={slcStyles.formGroup}>
                                <label style={slcStyles.label}>Duration</label>
                                <select
                                  value={protocolData.duration}
                                  onChange={(e) => setProtocolData(prev => ({ ...prev, duration: e.target.value }))}
                                  style={slcStyles.select}
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
                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>IV Type</label>
                          <select
                            value={formData.medication}
                            onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                            style={slcStyles.select}
                          >
                            <option value="">Select IV...</option>
                            {IV_OPTIONS.map(iv => (
                              <option key={iv.value} value={iv.value}>{iv.label}</option>
                            ))}
                          </select>
                        </div>

                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Duration</label>
                          <select
                            value={formData.duration}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                            style={slcStyles.select}
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
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Total Sessions</label>
                              <select
                                value={protocolData.totalSessions}
                                onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                style={slcStyles.select}
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
                        <div style={slcStyles.infoBox}>
                          🫁 60-minute session at 2.0 ATA
                        </div>

                        {showProtocolForm && (
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Total Sessions</label>
                              <select
                                value={protocolData.totalSessions}
                                onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                style={slcStyles.select}
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
                        <div style={slcStyles.formGroup}>
                          <label style={slcStyles.label}>Duration</label>
                          <select
                            value={formData.duration}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                            style={slcStyles.select}
                          >
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="20">20 minutes</option>
                          </select>
                        </div>

                        {showProtocolForm && (
                          <div style={slcStyles.protocolFields}>
                            <div style={slcStyles.protocolFieldsTitle}>Protocol Details</div>
                            <div style={slcStyles.formGroup}>
                              <label style={slcStyles.label}>Total Sessions</label>
                              <select
                                value={protocolData.totalSessions}
                                onChange={(e) => setProtocolData(prev => ({ ...prev, totalSessions: e.target.value }))}
                                style={slcStyles.select}
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
                    <div style={slcStyles.formGroup}>
                      <label style={slcStyles.label}>Notes (optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional notes..."
                        style={slcStyles.textarea}
                        rows={2}
                      />
                    </div>

                    {/* Add to Visit */}
                    <button
                      style={slcStyles.addToVisitBtn}
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
  );
}

// ============================================
// STYLES (prefixed to avoid conflicts)
// ============================================

const slcStyles = {
  wrapper: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  newEntryBtn: {
    padding: '10px 20px',
    background: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  filterTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterTab: {
    padding: '6px 14px',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterTabActive: {
    background: '#1A1A1A',
    color: '#FFFFFF',
    borderColor: '#1A1A1A',
  },
  searchBar: {
    marginBottom: '0',
  },
  searchInput: {
    padding: '10px 16px',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    color: '#1A1A1A',
    fontSize: '14px',
    width: '100%',
    maxWidth: '300px',
  },
  tableContainer: {
    overflowX: 'auto',
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #E5E5E5',
    color: '#666',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    background: '#F9FAFB',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    color: '#1A1A1A',
  },
  patientLink: {
    color: '#1A1A1A',
    textDecoration: 'none',
    fontWeight: '500',
  },
  serviceLabel: {
    fontSize: '13px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  doseText: {
    color: '#666',
    fontSize: '13px',
  },
  weightText: {
    color: '#059669',
    fontSize: '13px',
    fontWeight: '500',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '18px',
    cursor: 'pointer',
  },
  editLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '4px',
  },
  editInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
  stats: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    fontSize: '14px',
    color: '#666',
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
    zIndex: 10000
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
