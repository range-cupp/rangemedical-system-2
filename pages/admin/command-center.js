// /pages/admin/command-center.js
// Range Medical Command Center - Unified Admin Dashboard
// 6 tabs: Overview, Leads, Protocols, Patients, Injections, Send Forms

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_COLORS = {
  weight_loss: '#FF8C00',
  hrt: '#4488FF',
  peptide: '#00CC66',
  iv: '#9966FF',
  hbot: '#FFCC00',
  rlt: '#FF6666',
  injection: '#A0A0A0',
  labs: '#66CCCC',
  other: '#888888',
};

const CATEGORY_LABELS = {
  weight_loss: 'Weight Loss',
  hrt: 'HRT',
  peptide: 'Peptide',
  iv: 'IV Therapy',
  hbot: 'HBOT',
  rlt: 'Red Light',
  injection: 'Injection',
  labs: 'Labs',
};

// ============================================
// INJECTION LOG CONSTANTS
// ============================================

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
// SEND FORMS CONSTANTS
// ============================================

const AVAILABLE_FORMS = [
  { id: 'intake', name: 'Medical Intake', icon: '📋', time: '10 min', required: true },
  { id: 'hipaa', name: 'HIPAA Privacy Notice', icon: '🔒', time: '3 min', required: true },
  { id: 'blood-draw', name: 'Blood Draw Consent', icon: '🩸', time: '2 min' },
  { id: 'hrt', name: 'HRT Consent', icon: '💊', time: '5 min' },
  { id: 'peptide', name: 'Peptide Therapy Consent', icon: '🧬', time: '5 min' },
  { id: 'iv', name: 'IV & Injection Consent', icon: '💧', time: '5 min' },
  { id: 'hbot', name: 'HBOT Consent', icon: '🫁', time: '5 min' },
  { id: 'weight-loss', name: 'Weight Loss Consent', icon: '⚖️', time: '5 min' },
  { id: 'red-light', name: 'Red Light Therapy', icon: '🔴', time: '5 min' },
];

const QUICK_SELECTIONS = [
  { label: 'New Patient', forms: ['intake', 'hipaa'] },
  { label: 'HRT Patient', forms: ['intake', 'hipaa', 'hrt', 'blood-draw'] },
  { label: 'Weight Loss', forms: ['intake', 'hipaa', 'weight-loss', 'blood-draw'] },
  { label: 'IV Therapy', forms: ['intake', 'hipaa', 'iv'] },
  { label: 'Peptides', forms: ['intake', 'hipaa', 'peptide'] },
  { label: 'HBOT', forms: ['intake', 'hipaa', 'hbot'] },
  { label: 'Red Light', forms: ['intake', 'hipaa', 'red-light'] },
];

const URGENCY_COLORS = {
  expired: '#FF4444',
  critical: '#FF4444',
  warning: '#FF8C00',
  active: '#00CC66',
  fresh: '#4488FF',
};

const LEAD_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  'appointment-booked': 'Appt Booked',
  converted: 'Converted',
  'no-response': 'No Response',
};

const GHL_LOCATION_ID = 'WICdvbXmTjQORW6GiHWW';

// Protocol frequency options
const FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: '1x daily (AM)', label: '1x daily (AM)' },
  { value: '1x daily (PM/bedtime)', label: '1x daily (PM/bedtime)' },
  { value: '2x daily', label: '2x daily' },
  { value: '3x daily', label: '3x daily' },
  { value: '5 on / 2 off', label: '5 on / 2 off' },
  { value: 'Every other day', label: 'Every other day' },
  { value: '3x per week', label: '3x per week' },
  { value: '2x per week', label: '2x per week' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Every 2 weeks', label: 'Every 2 weeks' },
  { value: 'PRN', label: 'PRN (as needed)' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles'
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function getPatientName(protocol) {
  if (protocol.patients?.name) return protocol.patients.name;
  if (protocol.patients?.first_name) {
    return `${protocol.patients.first_name} ${protocol.patients.last_name || ''}`.trim();
  }
  return protocol.patient_name || 'Unknown';
}

function getProtocolStatus(protocol) {
  const { program_type, delivery_method, end_date, total_sessions, sessions_used, start_date } = protocol;

  // Session-based
  if (delivery_method === 'in_clinic' && total_sessions > 0) {
    const used = sessions_used || 0;
    const remaining = total_sessions - used;
    return `${used}/${total_sessions} sessions`;
  }

  // Date-based
  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
  } else if (program_type === 'weight_loss' && start_date && total_sessions) {
    endDateObj = new Date(start_date);
    endDateObj.setDate(endDateObj.getDate() + (total_sessions * 7));
  }

  if (endDateObj) {
    const now = new Date();
    const daysLeft = Math.floor((endDateObj - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    return `${daysLeft} days left`;
  }

  return 'Active';
}

function openGHL(contactId) {
  if (!contactId) return;
  window.open(`https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts/detail/${contactId}`, '_blank');
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [protocolFilter, setProtocolFilter] = useState({ status: 'active', category: 'all', delivery: 'all', search: '' });
  const [leadFilter, setLeadFilter] = useState({ status: 'all', search: '' });
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailData, setPatientDetailData] = useState(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [pdfSlideOut, setPdfSlideOut] = useState({ open: false, url: '', title: '' });

  // Injection logs state
  const [injectionCategory, setInjectionCategory] = useState('testosterone');
  const [injectionLogs, setInjectionLogs] = useState([]);
  const [injectionLoading, setInjectionLoading] = useState(false);
  const [showInjectionModal, setShowInjectionModal] = useState(false);
  const [injectionFormData, setInjectionFormData] = useState({
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
    weight: '',
    entry_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
    notes: ''
  });
  const [injectionPatientSearch, setInjectionPatientSearch] = useState('');
  const [showInjectionPatientDropdown, setShowInjectionPatientDropdown] = useState(false);
  const [injectionSearchTerm, setInjectionSearchTerm] = useState('');

  // Send forms state
  const [formEntryMode, setFormEntryMode] = useState('search');
  const [formPhone, setFormPhone] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [selectedForms, setSelectedForms] = useState(['intake', 'hipaa']);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [recentSends, setRecentSends] = useState([]);
  const [formPatientSearch, setFormPatientSearch] = useState('');
  const [selectedFormPatient, setSelectedFormPatient] = useState(null);
  const [showFormPatientDropdown, setShowFormPatientDropdown] = useState(false);

  // Protocol assignment state
  const [templates, setTemplates] = useState({ grouped: {} });
  const [peptides, setPeptides] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    peptideId: '',
    selectedDose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch data
  useEffect(() => {
    fetchData();
    fetchTemplates();
    fetchPeptides();
  }, []);

  // Fetch injection logs when category changes
  useEffect(() => {
    if (activeTab === 'injections') {
      fetchInjectionLogs();
    }
  }, [activeTab, injectionCategory]);

  // Fetch detailed patient data when a patient is selected
  useEffect(() => {
    if (selectedPatient?.id) {
      fetchPatientDetails(selectedPatient.id);
    } else {
      setPatientDetailData(null);
    }
  }, [selectedPatient?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/command-center');
      const result = await res.json();
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchInjectionLogs = async () => {
    setInjectionLoading(true);
    try {
      const res = await fetch(`/api/injection-logs?category=${injectionCategory}&limit=100`);
      const result = await res.json();
      if (result.success) {
        setInjectionLogs(result.logs || []);
      }
    } catch (err) {
      console.error('Error fetching injection logs:', err);
    }
    setInjectionLoading(false);
  };

  const fetchPatientDetails = async (patientId) => {
    setPatientDetailLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const result = await res.json();
      if (result.patient) {
        setPatientDetailData({
          intakes: result.intakes || [],
          consents: result.consents || [],
          activeProtocols: result.activeProtocols || [],
          completedProtocols: result.completedProtocols || [],
          labs: result.labs || [],
          medicalDocuments: result.medicalDocuments || [],
          appointments: result.appointments || [],
        });
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
    setPatientDetailLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const res = await fetch('/api/protocols/templates');
      const data = await res.json();
      console.log('Templates loaded:', data.grouped ? Object.keys(data.grouped).length + ' categories' : 'none');
      if (data.grouped) setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Failed to load protocol templates. Please refresh the page.');
    }
  };

  const fetchPeptides = async () => {
    try {
      const res = await fetch('/api/peptides');
      const data = await res.json();
      if (data.peptides) setPeptides(data.peptides);
    } catch (error) {
      console.error('Error fetching peptides:', error);
    }
  };

  // Protocol assignment handlers
  const openAssignModal = () => {
    console.log('Opening assign modal for patient:', selectedPatient?.id, selectedPatient?.name);
    console.log('Templates available:', Object.keys(templates.grouped || {}).length, 'categories');
    setAssignForm({
      templateId: '',
      peptideId: '',
      selectedDose: '',
      frequency: '',
      deliveryMethod: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAssignModal(true);
  };

  const getSelectedTemplate = () => {
    if (!assignForm.templateId) return null;
    for (const category of Object.values(templates.grouped || {})) {
      const found = category.find(t => t.id === assignForm.templateId);
      if (found) return found;
    }
    return null;
  };

  const getSelectedPeptide = () => peptides.find(p => p.id === assignForm.peptideId) || null;
  const isPeptideTemplate = () => getSelectedTemplate()?.name?.toLowerCase().includes('peptide');
  const isNADTemplate = () => getSelectedTemplate()?.name?.toLowerCase().includes('nad+');
  const isInjectionTemplate = () => getSelectedTemplate()?.category === 'injection';

  const NAD_DOSE_OPTIONS = ['25mg', '50mg', '100mg', '125mg', '150mg'];
  const DELIVERY_METHOD_OPTIONS = [
    { value: 'in_clinic', label: 'In Clinic' },
    { value: 'take_home', label: 'Take Home' }
  ];

  const handleAssignProtocol = async () => {
    if (!selectedPatient?.id || !assignForm.templateId) {
      alert('Please select a protocol template');
      return;
    }

    try {
      const res = await fetch('/api/protocols/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          patientName: selectedPatient.name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim(),
          templateId: assignForm.templateId,
          peptideId: assignForm.peptideId,
          selectedDose: assignForm.selectedDose,
          frequency: assignForm.frequency,
          startDate: assignForm.startDate,
          notes: assignForm.notes,
          purchaseId: assignForm.purchaseId || null,
          deliveryMethod: assignForm.deliveryMethod || null
        })
      });

      if (res.ok) {
        setShowAssignModal(false);
        // Refresh patient data
        fetchPatientDetails(selectedPatient.id);
        fetchData();
        alert('Protocol assigned successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to assign protocol');
      }
    } catch (error) {
      console.error('Error assigning protocol:', error);
      alert('Error assigning protocol');
    }
  };

  // Filter patients for injection modal
  const filteredInjectionPatients = useMemo(() => {
    if (!injectionPatientSearch || injectionPatientSearch.length < 1 || !data?.patients) return [];
    const term = injectionPatientSearch.toLowerCase();
    return data.patients.filter(p => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
      const altName = (p.name || '').toLowerCase();
      const phone = (p.phone || '').replace(/\D/g, '');
      return fullName.includes(term) || altName.includes(term) || phone.includes(term);
    }).slice(0, 10);
  }, [injectionPatientSearch, data?.patients]);

  // Filter patients for send forms
  const filteredFormPatients = useMemo(() => {
    if (!formPatientSearch || !data?.patients) return [];
    const query = formPatientSearch.toLowerCase();
    return data.patients.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    ).slice(0, 20);
  }, [formPatientSearch, data?.patients]);

  // Filtered injection logs
  const filteredInjectionLogs = useMemo(() => {
    if (!injectionSearchTerm) return injectionLogs;
    const term = injectionSearchTerm.toLowerCase();
    return injectionLogs.filter(log => {
      const patientName = (log.patient_name || '').toLowerCase();
      const medication = (log.medication || '').toLowerCase();
      return patientName.includes(term) || medication.includes(term);
    });
  }, [injectionLogs, injectionSearchTerm]);

  // Filtered protocols
  const filteredProtocols = useMemo(() => {
    if (!data?.protocols) return [];
    let list = protocolFilter.status === 'completed' ? (data.completedProtocols || []) : data.protocols;

    if (protocolFilter.category !== 'all') {
      list = list.filter(p => p.program_type === protocolFilter.category);
    }
    if (protocolFilter.delivery !== 'all') {
      list = list.filter(p => p.delivery_method === protocolFilter.delivery);
    }
    if (protocolFilter.search) {
      const s = protocolFilter.search.toLowerCase();
      list = list.filter(p =>
        getPatientName(p).toLowerCase().includes(s) ||
        (p.medication || '').toLowerCase().includes(s) ||
        (p.program_name || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, protocolFilter]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    let list = data.leads;

    if (leadFilter.status !== 'all') {
      list = list.filter(l => l.status === leadFilter.status);
    }
    if (leadFilter.search) {
      const s = leadFilter.search.toLowerCase();
      list = list.filter(l =>
        (l.name || '').toLowerCase().includes(s) ||
        (l.phone || '').includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, leadFilter]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    if (!patientSearch) return data.patients.slice(0, 50);
    const s = patientSearch.toLowerCase();
    return data.patients.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.first_name || '').toLowerCase().includes(s) ||
      (p.last_name || '').toLowerCase().includes(s) ||
      (p.phone || '').includes(s) ||
      (p.email || '').toLowerCase().includes(s)
    ).slice(0, 50);
  }, [data, patientSearch]);

  // Patient details
  const patientDetails = useMemo(() => {
    if (!selectedPatient || !data) return null;
    const protocols = patientDetailData?.activeProtocols || (data.protocols || []).filter(p => p.patient_id === selectedPatient.id);
    const completedProtocols = patientDetailData?.completedProtocols || (data.completedProtocols || []).filter(p => p.patient_id === selectedPatient.id);
    const injectionLogs = (data.injectionLogs || []).filter(l => l.patient_id === selectedPatient.id).slice(0, 10);
    const purchases = (data.purchases || []).filter(p => p.patient_id === selectedPatient.id);
    const intakes = patientDetailData?.intakes || [];
    const consents = patientDetailData?.consents || [];
    const labs = patientDetailData?.labs || [];
    return { protocols, completedProtocols, injectionLogs, purchases, intakes, consents, labs };
  }, [selectedPatient, data, patientDetailData]);

  if (loading) {
    return (
      <div style={styles.container}>
        <Head><title>Command Center | Range Medical</title></Head>
        <div style={styles.loading}>Loading Command Center...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head><title>Command Center | Range Medical</title></Head>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Command Center | Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '4295373617400545');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=4295373617400545&ev=PageView&noscript=1" />
        </noscript>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Command Center</h1>
            <span style={styles.subtitle}>Range Medical</span>
          </div>
          <button onClick={fetchData} style={styles.refreshBtn}>Refresh</button>
        </header>

        {/* Tabs */}
        <nav style={styles.tabs}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'leads', label: 'Leads', icon: '🎯', badge: data?.stats?.needsProtocol },
            { id: 'protocols', label: 'Protocols', icon: '💊', badge: data?.stats?.endingSoon },
            { id: 'patients', label: 'Patients', icon: '👥' },
            { id: 'injections', label: 'Injections', icon: '💉' },
            { id: 'forms', label: 'Send Forms', icon: '📤' },
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {tab.badge > 0 && <span style={styles.tabBadge}>{tab.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={styles.main}>
          {activeTab === 'overview' && (
            <OverviewTab
              data={data}
              setActiveTab={setActiveTab}
              onAssignFromPurchase={(purchase) => {
                // Find patient from data.patients
                const patient = data.patients?.find(p => p.id === purchase.patient_id);
                if (patient) {
                  setSelectedPatient(patient);
                  setAssignForm({
                    templateId: '',
                    peptideId: '',
                    selectedDose: '',
                    frequency: '',
                    startDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    purchaseId: purchase.id,
                    purchaseItem: purchase.item_name
                  });
                  setShowAssignModal(true);
                } else {
                  alert('Patient not found. Please assign from the Patients tab.');
                }
              }}
            />
          )}
          {activeTab === 'leads' && (
            <LeadsTab
              data={data}
              leads={filteredLeads}
              filter={leadFilter}
              setFilter={setLeadFilter}
            />
          )}
          {activeTab === 'protocols' && (
            <ProtocolsTab
              data={data}
              protocols={filteredProtocols}
              filter={protocolFilter}
              setFilter={setProtocolFilter}
            />
          )}
          {activeTab === 'patients' && (
            <PatientsTab
              patients={filteredPatients}
              search={patientSearch}
              setSearch={setPatientSearch}
              selected={selectedPatient}
              setSelected={setSelectedPatient}
              details={patientDetails}
              detailLoading={patientDetailLoading}
              data={data}
              openPdf={(url, title) => setPdfSlideOut({ open: true, url, title })}
              onAssignProtocol={openAssignModal}
            />
          )}
          {activeTab === 'injections' && (
            <InjectionsTab
              category={injectionCategory}
              setCategory={setInjectionCategory}
              logs={filteredInjectionLogs}
              loading={injectionLoading}
              searchTerm={injectionSearchTerm}
              setSearchTerm={setInjectionSearchTerm}
              showModal={showInjectionModal}
              setShowModal={setShowInjectionModal}
              formData={injectionFormData}
              setFormData={setInjectionFormData}
              patientSearch={injectionPatientSearch}
              setPatientSearch={setInjectionPatientSearch}
              filteredPatients={filteredInjectionPatients}
              showPatientDropdown={showInjectionPatientDropdown}
              setShowPatientDropdown={setShowInjectionPatientDropdown}
              fetchLogs={fetchInjectionLogs}
            />
          )}
          {activeTab === 'forms' && (
            <SendFormsTab
              patients={data?.patients || []}
              entryMode={formEntryMode}
              setEntryMode={setFormEntryMode}
              phone={formPhone}
              setPhone={setFormPhone}
              firstName={formFirstName}
              setFirstName={setFormFirstName}
              selectedForms={selectedForms}
              setSelectedForms={setSelectedForms}
              status={formStatus}
              setStatus={setFormStatus}
              loading={formLoading}
              setLoading={setFormLoading}
              recentSends={recentSends}
              setRecentSends={setRecentSends}
              patientSearch={formPatientSearch}
              setPatientSearch={setFormPatientSearch}
              selectedPatient={selectedFormPatient}
              setSelectedPatient={setSelectedFormPatient}
              filteredPatients={filteredFormPatients}
              showDropdown={showFormPatientDropdown}
              setShowDropdown={setShowFormPatientDropdown}
            />
          )}
        </main>
      </div>

      {/* PDF Slide-out Viewer */}
      {pdfSlideOut.open && (
        <>
          <div
            style={styles.pdfOverlay}
            onClick={() => setPdfSlideOut({ open: false, url: '', title: '' })}
          />
          <div style={styles.pdfSlideOut}>
            <div style={styles.pdfSlideOutHeader}>
              <h3 style={styles.pdfSlideOutTitle}>{pdfSlideOut.title}</h3>
              <button
                style={styles.pdfSlideOutClose}
                onClick={() => setPdfSlideOut({ open: false, url: '', title: '' })}
              >
                ×
              </button>
            </div>
            <iframe
              src={pdfSlideOut.url}
              style={styles.pdfSlideOutFrame}
              title={pdfSlideOut.title}
            />
          </div>
        </>
      )}

      {/* Assign Protocol Modal */}
      {showAssignModal && selectedPatient && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign Protocol</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowAssignModal(false)}>×</button>
            </div>

            <div style={styles.assignModalPatient}>
              <span style={styles.assignModalPatientLabel}>Patient:</span>
              <span style={styles.assignModalPatientName}>
                {selectedPatient.name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
              </span>
            </div>

            {assignForm.purchaseItem && (
              <div style={{ padding: '12px 24px', background: '#F0FDF4', borderBottom: '1px solid #E5E5E5' }}>
                <span style={{ fontSize: '12px', color: '#166534' }}>
                  📦 Creating protocol for: <strong>{assignForm.purchaseItem}</strong>
                </span>
              </div>
            )}

            <div style={styles.modalFormGroup}>
              <label style={styles.formLabel}>Protocol Template *</label>
              {Object.keys(templates.grouped || {}).length === 0 ? (
                <div style={{ padding: '12px', background: '#FEF3C7', borderRadius: '6px', color: '#92400E', fontSize: '13px' }}>
                  Loading templates... If this persists, please refresh the page.
                </div>
              ) : (
                <select
                  value={assignForm.templateId}
                  onChange={e => setAssignForm({...assignForm, templateId: e.target.value, peptideId: '', selectedDose: ''})}
                  style={styles.formSelect}
                >
                  <option value="">Select template...</option>
                  {Object.entries(templates.grouped || {}).map(([category, temps]) => (
                    <optgroup key={category} label={category}>
                      {temps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {isPeptideTemplate() && (
              <>
                <div style={styles.modalFormGroup}>
                  <label style={styles.formLabel}>Select Peptide</label>
                  <select
                    value={assignForm.peptideId}
                    onChange={e => setAssignForm({...assignForm, peptideId: e.target.value})}
                    style={styles.formSelect}
                  >
                    <option value="">Select peptide...</option>
                    {peptides.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {getSelectedPeptide()?.dose_options?.length > 0 && (
                  <div style={styles.modalFormGroup}>
                    <label style={styles.formLabel}>Dose</label>
                    <select
                      value={assignForm.selectedDose}
                      onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}
                      style={styles.formSelect}
                    >
                      <option value="">Select dose...</option>
                      {getSelectedPeptide().dose_options.map(dose => <option key={dose} value={dose}>{dose}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* NAD+ Dose Selection */}
            {isNADTemplate() && (
              <div style={styles.modalFormGroup}>
                <label style={styles.formLabel}>NAD+ Dose *</label>
                <select
                  value={assignForm.selectedDose}
                  onChange={e => setAssignForm({...assignForm, selectedDose: e.target.value})}
                  style={styles.formSelect}
                >
                  <option value="">Select dose...</option>
                  {NAD_DOSE_OPTIONS.map(dose => <option key={dose} value={dose}>{dose}</option>)}
                </select>
              </div>
            )}

            {/* Delivery Method for Injection Templates */}
            {isInjectionTemplate() && (
              <div style={styles.modalFormGroup}>
                <label style={styles.formLabel}>Delivery Method *</label>
                <select
                  value={assignForm.deliveryMethod || ''}
                  onChange={e => setAssignForm({...assignForm, deliveryMethod: e.target.value})}
                  style={styles.formSelect}
                >
                  <option value="">Select delivery method...</option>
                  {DELIVERY_METHOD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.modalFormGroup}>
              <label style={styles.formLabel}>Frequency</label>
              <select
                value={assignForm.frequency}
                onChange={e => setAssignForm({...assignForm, frequency: e.target.value})}
                style={styles.formSelect}
              >
                <option value="">Select frequency...</option>
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.formLabel}>Start Date</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={e => setAssignForm({...assignForm, startDate: e.target.value})}
                style={styles.formInput}
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.formLabel}>Notes</label>
              <textarea
                value={assignForm.notes}
                onChange={e => setAssignForm({...assignForm, notes: e.target.value})}
                style={{ ...styles.formInput, minHeight: '60px', resize: 'vertical' }}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalSubmitBtn}
                onClick={handleAssignProtocol}
                disabled={!assignForm.templateId}
              >
                Assign Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #FFFFFF;
          color: #1A1A1A;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F5F5F5; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
        input::placeholder { color: #9CA3AF; }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function OverviewTab({ data, setActiveTab, onAssignFromPurchase }) {
  const stats = data?.stats || {};
  const recentPurchases = (data?.purchases || []).slice(0, 10);
  const endingSoon = (data?.protocols || []).filter(p =>
    p.urgency === 'critical' || p.urgency === 'warning'
  ).slice(0, 10);
  const sessionAlerts = data?.sessionAlerts || [];

  return (
    <div style={styles.overviewGrid}>
      {/* Session Alerts Banner - Top Priority */}
      {sessionAlerts.length > 0 && (
        <div style={styles.sessionAlertsBanner}>
          <div style={styles.sessionAlertsIcon}>🚨</div>
          <div style={styles.sessionAlertsContent}>
            <strong style={styles.sessionAlertsTitle}>
              {sessionAlerts.length} Session Alert{sessionAlerts.length > 1 ? 's' : ''} - Payment Needed
            </strong>
            <div style={styles.sessionAlertsList}>
              {sessionAlerts.slice(0, 5).map((alert, i) => {
                const patientName = alert.patients?.name ||
                  `${alert.patients?.first_name || ''} ${alert.patients?.last_name || ''}`.trim() || 'Patient';
                const isOverdraft = alert.alert_type === 'sessions_exceeded';
                const metadata = alert.metadata || {};
                return (
                  <div key={alert.id || i} style={styles.sessionAlertItem}>
                    <span style={{
                      ...styles.sessionAlertBadge,
                      background: isOverdraft ? '#DC2626' : '#F59E0B'
                    }}>
                      {isOverdraft ? 'OVERDRAFT' : 'EXHAUSTED'}
                    </span>
                    <span style={styles.sessionAlertPatient}>{patientName}</span>
                    <span style={styles.sessionAlertDetail}>
                      {metadata.program_type?.toUpperCase()} - {metadata.sessions_used}/{metadata.total_sessions} sessions
                    </span>
                    {alert.patients?.phone && (
                      <a href={`tel:${alert.patients.phone}`} style={styles.sessionAlertPhone}>
                        📞 {alert.patients.phone}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <StatCard label="New Leads" value={stats.newLeads || 0} color="#4488FF" onClick={() => setActiveTab('leads')} />
        <StatCard label="Active Protocols" value={stats.activeProtocols || 0} color="#00CC66" onClick={() => setActiveTab('protocols')} />
        <StatCard label="Ending Soon" value={stats.endingSoon || 0} color="#FF8C00" onClick={() => setActiveTab('protocols')} />
        <StatCard label="Needs Protocol" value={stats.needsProtocol || 0} color="#FF4444" onClick={() => setActiveTab('leads')} />
        <StatCard label="Session Alerts" value={stats.sessionAlerts || 0} color="#DC2626" />
        <StatCard label="Total Patients" value={stats.totalPatients || 0} color="#9966FF" onClick={() => setActiveTab('patients')} />
      </div>

      {/* Two Column Layout */}
      <div style={styles.overviewColumns}>
        {/* Left Column */}
        <div style={styles.overviewColumn}>
          {/* Protocols by Category */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Active Protocols by Category</h3>
            <div style={styles.categoryBars}>
              {Object.entries(data?.protocolsByCategory || {}).map(([cat, count]) => (
                <div key={cat} style={styles.categoryBar}>
                  <div style={styles.categoryLabel}>
                    <span style={{ ...styles.categoryDot, background: CATEGORY_COLORS[cat] || '#888' }} />
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  <div style={styles.categoryBarOuter}>
                    <div style={{
                      ...styles.categoryBarInner,
                      width: `${Math.min(100, (count / (stats.activeProtocols || 1)) * 100)}%`,
                      background: CATEGORY_COLORS[cat] || '#888',
                    }} />
                  </div>
                  <span style={styles.categoryCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Recent Purchases</h3>
            <div style={styles.activityList}>
              {recentPurchases.map((p, i) => (
                <div key={p.id || i} style={styles.activityItem}>
                  <div style={styles.activityMain}>
                    <span style={styles.activityName}>{p.patient_name || 'Unknown'}</span>
                    <span style={styles.activityDesc}>{p.item_name}</span>
                  </div>
                  <div style={styles.activityMeta}>
                    <span style={styles.activityAmount}>${p.display_amount || p.amount}</span>
                    <span style={styles.activityTime}>{timeAgo(p.purchase_date)}</span>
                  </div>
                </div>
              ))}
              {recentPurchases.length === 0 && (
                <div style={styles.emptyState}>No recent purchases</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.overviewColumn}>
          {/* Needs Protocol Alert */}
          {(data?.purchasesNeedingProtocol || []).length > 0 && (
            <div style={{ ...styles.card, background: '#FFF7ED', borderColor: '#FB923C', borderWidth: '2px' }}>
              <h3 style={{ ...styles.cardTitle, color: '#C2410C' }}>
                Needs Protocol ({data.purchasesNeedingProtocol.length})
              </h3>
              <div style={styles.activityList}>
                {data.purchasesNeedingProtocol.slice(0, 10).map((p, i) => (
                  <div key={p.id || i} style={{ ...styles.activityItem, alignItems: 'center' }}>
                    <div style={{ ...styles.activityMain, flex: 1 }}>
                      <span style={styles.activityName}>{p.patient_name || 'Unknown'}</span>
                      <span style={styles.activityDesc}>{p.item_name}</span>
                    </div>
                    <div style={{ ...styles.activityMeta, marginRight: '12px' }}>
                      <span style={styles.activityAmount}>${p.display_amount || p.amount}</span>
                      <span style={styles.activityTime}>{timeAgo(p.purchase_date)}</span>
                    </div>
                    <button
                      onClick={() => onAssignFromPurchase(p)}
                      style={{
                        padding: '6px 12px',
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Create Protocol
                    </button>
                  </div>
                ))}
              </div>
              {data.purchasesNeedingProtocol.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span style={{ color: '#C2410C', fontSize: '13px' }}>
                    +{data.purchasesNeedingProtocol.length - 10} more
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ending Soon */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Ending Soon</h3>
            <div style={styles.protocolList}>
              {endingSoon.map((p, i) => (
                <div key={p.id || i} style={styles.protocolRow}>
                  <span style={{ ...styles.urgencyDot, background: URGENCY_COLORS[p.urgency] }} />
                  <span style={styles.protocolName}>{getPatientName(p)}</span>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                    {CATEGORY_LABELS[p.program_type] || p.program_type}
                  </span>
                  <span style={styles.protocolStatus}>{getProtocolStatus(p)}</span>
                </div>
              ))}
              {endingSoon.length === 0 && (
                <div style={styles.emptyState}>No protocols ending soon</div>
              )}
            </div>
          </div>

          {/* Weekly Pickups - Take-home Weight Loss */}
          {((data?.weeklyPickups?.overdue || []).length > 0 ||
            (data?.weeklyPickups?.dueToday || []).length > 0 ||
            (data?.weeklyPickups?.needsPayment || []).length > 0) && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📦 Weekly Pickups (Weight Loss)</h3>

              {/* Needs Payment */}
              {(data?.weeklyPickups?.needsPayment || []).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: '#DC2626', marginBottom: '8px' }}>
                    💰 Needs Payment ({data.weeklyPickups.needsPayment.length})
                  </h4>
                  <div style={styles.protocolList}>
                    {data.weeklyPickups.needsPayment.slice(0, 5).map((p, i) => (
                      <div key={p.id || i} style={styles.protocolRow}>
                        <span style={styles.protocolName}>{getPatientName(p)}</span>
                        <span style={{ color: '#DC2626', fontSize: '12px' }}>
                          {p.sessions_used}/{p.total_sessions} used
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue Pickups */}
              {(data?.weeklyPickups?.overdue || []).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: '#F59E0B', marginBottom: '8px' }}>
                    ⚠️ Overdue ({data.weeklyPickups.overdue.length})
                  </h4>
                  <div style={styles.protocolList}>
                    {data.weeklyPickups.overdue.slice(0, 5).map((p, i) => (
                      <div key={p.id || i} style={styles.protocolRow}>
                        <span style={styles.protocolName}>{getPatientName(p)}</span>
                        <span style={{ color: '#F59E0B', fontSize: '12px' }}>
                          {p.days_overdue} days overdue
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Today */}
              {(data?.weeklyPickups?.dueToday || []).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: '#10B981', marginBottom: '8px' }}>
                    ✅ Due Today ({data.weeklyPickups.dueToday.length})
                  </h4>
                  <div style={styles.protocolList}>
                    {data.weeklyPickups.dueToday.map((p, i) => (
                      <div key={p.id || i} style={styles.protocolRow}>
                        <span style={styles.protocolName}>{getPatientName(p)}</span>
                        <span style={{ color: '#10B981', fontSize: '12px' }}>
                          {p.sessions_used || 0}/{p.total_sessions} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {(data?.weeklyPickups?.upcoming || []).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                    📅 This Week ({data.weeklyPickups.upcoming.length})
                  </h4>
                  <div style={styles.protocolList}>
                    {data.weeklyPickups.upcoming.slice(0, 5).map((p, i) => (
                      <div key={p.id || i} style={styles.protocolRow}>
                        <span style={styles.protocolName}>{getPatientName(p)}</span>
                        <span style={{ color: '#6B7280', fontSize: '12px' }}>
                          {p.next_expected_date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* In-Clinic Overdue */}
          {(data?.inClinicData?.overdue || []).length > 0 && (
            <div style={{ ...styles.card, background: '#FEF2F2', borderColor: '#EF4444', borderWidth: '2px' }}>
              <h3 style={{ ...styles.cardTitle, color: '#DC2626' }}>
                Overdue Visits ({data.inClinicData.overdue.length})
              </h3>
              <div style={styles.protocolList}>
                {data.inClinicData.overdue.slice(0, 5).map((p, i) => (
                  <div key={p.id || i} style={styles.protocolRow}>
                    <span style={styles.protocolName}>{getPatientName(p)}</span>
                    <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                      {CATEGORY_LABELS[p.program_type] || p.program_type}
                    </span>
                    <span style={{ ...styles.protocolStatus, color: '#FF4444' }}>
                      {p.days_overdue} days overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadsTab({ data, leads, filter, setFilter }) {
  const [expandedLead, setExpandedLead] = useState(null);

  return (
    <div style={styles.tabContent}>
      {/* Needs Protocol Banner */}
      {(data?.purchasesNeedingProtocol || []).length > 0 && (
        <div style={styles.alertBanner}>
          <div style={styles.alertIcon}>⚠️</div>
          <div style={styles.alertContent}>
            <strong>{data.purchasesNeedingProtocol.length} purchase(s) need protocol assignment</strong>
            <div style={styles.alertItems}>
              {data.purchasesNeedingProtocol.slice(0, 3).map((p, i) => (
                <span key={i} style={styles.alertItem}>
                  {p.patient_name}: {p.item_name} (${p.display_amount || p.amount})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search leads..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          style={styles.searchInput}
        />
        <div style={styles.filterPills}>
          {['all', 'new', 'contacted', 'no-response'].map(status => (
            <button
              key={status}
              style={{
                ...styles.filterPill,
                ...(filter.status === status ? styles.filterPillActive : {}),
              }}
              onClick={() => setFilter({ ...filter, status })}
            >
              {status === 'all' ? 'All' : LEAD_STATUS_LABELS[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div style={styles.leadsList}>
        {leads.map(lead => (
          <div key={lead.id} style={styles.leadCard}>
            <div
              style={styles.leadHeader}
              onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
            >
              <div style={styles.leadInfo}>
                <span style={styles.leadName}>{lead.name || 'Unknown'}</span>
                <span style={styles.leadContact}>
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.email && <span style={{ marginLeft: '12px' }}>{lead.email}</span>}
                </span>
              </div>
              <div style={styles.leadMeta}>
                <span style={{
                  ...styles.leadStatus,
                  background: lead.status === 'new' ? '#4488FF' :
                             lead.status === 'contacted' ? '#00CC66' :
                             lead.status === 'no-response' ? '#FF4444' :
                             lead.status === 'appointment-booked' ? '#9966FF' : '#666',
                }}>
                  {LEAD_STATUS_LABELS[lead.status] || lead.status}
                </span>
                <span style={styles.leadTime}>{timeAgo(lead.created_at)}</span>
              </div>
            </div>

            {expandedLead === lead.id && (
              <div style={styles.leadExpanded}>
                <div style={styles.leadTags}>
                  {(lead.tags || []).slice(0, 5).map((tag, i) => (
                    <span key={i} style={styles.leadTag}>{tag}</span>
                  ))}
                  <span style={styles.leadSource}>{lead.source}</span>
                </div>
                <div style={styles.leadActions}>
                  {lead.phone && (
                    <>
                      <a href={`sms:${lead.phone}`} style={styles.actionBtn}>📱 Text</a>
                      <a href={`tel:${lead.phone}`} style={styles.actionBtn}>📞 Call</a>
                    </>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} style={styles.actionBtn}>📧 Email</a>
                  )}
                  <button
                    style={styles.actionBtn}
                    onClick={() => openGHL(lead.ghl_contact_id)}
                  >
                    🔗 Open GHL
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {leads.length === 0 && (
          <div style={styles.emptyState}>No leads found</div>
        )}
      </div>
    </div>
  );
}

function ProtocolsTab({ data, protocols, filter, setFilter }) {
  return (
    <div style={styles.tabContent}>
      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search protocols..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          style={styles.searchInput}
        />
        <div style={styles.filterGroup}>
          <div style={styles.filterPills}>
            {['active', 'completed'].map(status => (
              <button
                key={status}
                style={{
                  ...styles.filterPill,
                  ...(filter.status === status ? styles.filterPillActive : {}),
                }}
                onClick={() => setFilter({ ...filter, status })}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.filterPills}>
            {['all', 'in_clinic', 'take_home'].map(delivery => (
              <button
                key={delivery}
                style={{
                  ...styles.filterPill,
                  ...(filter.delivery === delivery ? styles.filterPillActive : {}),
                }}
                onClick={() => setFilter({ ...filter, delivery })}
              >
                {delivery === 'all' ? 'All' : delivery === 'in_clinic' ? 'In Clinic' : 'Take Home'}
              </button>
            ))}
          </div>
          <div style={styles.filterPills}>
            <button
              style={{
                ...styles.filterPill,
                ...(filter.category === 'all' ? styles.filterPillActive : {}),
              }}
              onClick={() => setFilter({ ...filter, category: 'all' })}
            >
              All
            </button>
            {Object.keys(CATEGORY_LABELS).map(cat => (
              <button
                key={cat}
                style={{
                  ...styles.filterPill,
                  ...(filter.category === cat ? { ...styles.filterPillActive, background: CATEGORY_COLORS[cat] } : {}),
                }}
                onClick={() => setFilter({ ...filter, category: cat })}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Delivery</th>
              <th style={styles.th}>Program</th>
              <th style={styles.th}>Progress</th>
              <th style={styles.th}>Started</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map(protocol => (
              <tr key={protocol.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={{ ...styles.urgencyDot, background: URGENCY_COLORS[protocol.urgency] || '#666' }} />
                </td>
                <td style={styles.td}>
                  <span style={styles.patientLink}>{getPatientName(protocol)}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[protocol.program_type] }}>
                    {CATEGORY_LABELS[protocol.program_type] || protocol.program_type}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.deliveryBadge}>
                    {protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'}
                  </span>
                </td>
                <td style={styles.td}>{protocol.program_name || protocol.medication || '-'}</td>
                <td style={{ ...styles.td, color: URGENCY_COLORS[protocol.urgency] }}>
                  {getProtocolStatus(protocol)}
                </td>
                <td style={styles.td}>{formatDate(protocol.start_date)}</td>
                <td style={styles.td}>
                  <button
                    style={styles.smallBtn}
                    onClick={() => openGHL(protocol.patients?.ghl_contact_id)}
                  >
                    GHL
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {protocols.length === 0 && (
          <div style={styles.emptyState}>No protocols found</div>
        )}
      </div>
    </div>
  );
}

function PatientsTab({ patients, search, setSearch, selected, setSelected, details, detailLoading, data, openPdf, onAssignProtocol }) {
  const CONSENT_ICONS = {
    hipaa: '🔒',
    hrt: '💉',
    peptide: '🧬',
    'weight-loss': '⚖️',
    iv: '💧',
    hbot: '🫁',
    'blood-draw': '🩸',
    'red-light': '🔴',
  };

  const getConsentIcon = (type) => {
    const t = (type || '').toLowerCase();
    for (const [key, icon] of Object.entries(CONSENT_ICONS)) {
      if (t.includes(key)) return icon;
    }
    return '📝';
  };

  const formatConsentType = (type) => {
    if (!type) return 'Consent';
    return type
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div style={styles.patientsLayout}>
      {/* Patient List */}
      <div style={styles.patientList}>
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.patientListItems}>
          {patients.map(patient => (
            <div
              key={patient.id}
              style={{
                ...styles.patientItem,
                ...(selected?.id === patient.id ? styles.patientItemSelected : {}),
              }}
              onClick={() => setSelected(patient)}
            >
              <div style={styles.patientItemName}>
                {patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown'}
              </div>
              <div style={styles.patientItemMeta}>
                {patient.phone && <span>{patient.phone}</span>}
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <div style={styles.emptyState}>No patients found</div>
          )}
        </div>
      </div>

      {/* Patient Detail */}
      <div style={styles.patientDetail}>
        {selected ? (
          <>
            <div style={styles.patientHeader}>
              <h2 style={styles.patientName}>
                {selected.name || `${selected.first_name || ''} ${selected.last_name || ''}`.trim()}
              </h2>
              <div style={styles.patientContact}>
                {selected.phone && <span>{selected.phone}</span>}
                {selected.email && <span>{selected.email}</span>}
              </div>
              <div style={styles.patientSince}>
                Patient since {formatDate(selected.created_at)}
              </div>
            </div>

            <div style={styles.patientActions}>
              {selected.phone && (
                <>
                  <a href={`sms:${selected.phone}`} style={styles.actionBtn}>📱 Text</a>
                  <a href={`tel:${selected.phone}`} style={styles.actionBtn}>📞 Call</a>
                </>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} style={styles.actionBtn}>📧 Email</a>
              )}
              <button
                style={styles.actionBtn}
                onClick={() => openGHL(selected.ghl_contact_id)}
              >
                🔗 Open GHL
              </button>
            </div>

            {detailLoading && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                Loading patient details...
              </div>
            )}

            {/* Intake Forms */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>
                📋 Intake Forms ({details?.intakes?.length || 0})
              </h3>
              {(details?.intakes || []).map(intake => (
                <div key={intake.id} style={styles.detailItem}>
                  <span style={styles.intakeIcon}>📋</span>
                  <span style={styles.detailItemName}>
                    Medical Intake
                    {intake.first_name && ` - ${intake.first_name} ${intake.last_name || ''}`}
                  </span>
                  <span style={{ ...styles.consentStatus, color: '#16A34A' }}>
                    ✓ Submitted
                  </span>
                  <span style={styles.detailItemDate}>{formatDate(intake.submitted_at)}</span>
                  {intake.pdf_url && (
                    <button
                      style={styles.viewPdfBtn}
                      onClick={() => openPdf(intake.pdf_url, `Medical Intake - ${intake.first_name || ''} ${intake.last_name || ''}`)}
                    >
                      View PDF
                    </button>
                  )}
                </div>
              ))}
              {!detailLoading && (details?.intakes || []).length === 0 && (
                <div style={styles.emptyState}>No intake forms submitted</div>
              )}
            </div>

            {/* Consent Forms */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>
                ✍️ Consent Forms ({details?.consents?.length || 0})
              </h3>
              {(details?.consents || []).map(consent => (
                <div key={consent.id} style={styles.detailItem}>
                  <span style={styles.consentIcon}>{getConsentIcon(consent.consent_type)}</span>
                  <span style={styles.detailItemName}>
                    {formatConsentType(consent.consent_type)}
                  </span>
                  <span style={{
                    ...styles.consentStatus,
                    color: consent.consent_given ? '#16A34A' : '#DC2626'
                  }}>
                    {consent.consent_given ? '✓ Signed' : 'Pending'}
                  </span>
                  <span style={styles.detailItemDate}>{formatDate(consent.consent_date || consent.submitted_at)}</span>
                  {consent.pdf_url && (
                    <button
                      style={styles.viewPdfBtn}
                      onClick={() => openPdf(consent.pdf_url, `${formatConsentType(consent.consent_type)} Consent`)}
                    >
                      View PDF
                    </button>
                  )}
                </div>
              ))}
              {!detailLoading && (details?.consents || []).length === 0 && (
                <div style={styles.emptyState}>No consent forms submitted</div>
              )}
            </div>

            {/* Active Protocols */}
            <div style={styles.detailSection}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Active Protocols ({details?.protocols?.length || 0})</h3>
                <button
                  style={styles.addProtocolBtn}
                  onClick={onAssignProtocol}
                >
                  + Assign Protocol
                </button>
              </div>
              {(details?.protocols || []).map(p => (
                <div key={p.id} style={styles.detailItem}>
                  <span style={{ ...styles.categoryBadge, background: CATEGORY_COLORS[p.program_type] }}>
                    {CATEGORY_LABELS[p.program_type] || p.program_type}
                  </span>
                  <span style={styles.detailItemName}>{p.program_name || p.medication}</span>
                  <span style={{ color: URGENCY_COLORS[p.urgency] }}>{getProtocolStatus(p)}</span>
                </div>
              ))}
              {(details?.protocols || []).length === 0 && (
                <div style={styles.emptyState}>No active protocols</div>
              )}
            </div>

            {/* Labs */}
            {(details?.labs || []).length > 0 && (
              <div style={styles.detailSection}>
                <h3 style={styles.detailTitle}>🧪 Lab Results ({details?.labs?.length || 0})</h3>
                {(details?.labs || []).map(lab => (
                  <div key={lab.id} style={styles.detailItem}>
                    <span style={styles.detailItemType}>{lab.lab_type || 'Lab'}</span>
                    <span style={styles.detailItemName}>{lab.panel_type || lab.lab_panel || 'Results'}</span>
                    <span style={styles.detailItemDate}>{formatDate(lab.completed_date || lab.created_at)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Injection Logs */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Recent Injection Logs</h3>
              {(details?.injectionLogs || []).map(log => (
                <div key={log.id} style={styles.detailItem}>
                  <span style={styles.detailItemType}>{log.log_type}</span>
                  <span style={styles.detailItemName}>{log.medication || log.category}</span>
                  <span style={styles.detailItemDate}>{formatDateTime(log.logged_at)}</span>
                </div>
              ))}
              {(details?.injectionLogs || []).length === 0 && (
                <div style={styles.emptyState}>No injection logs</div>
              )}
            </div>

            {/* Purchase History */}
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>Purchase History</h3>
              {(details?.purchases || []).map(p => (
                <div key={p.id} style={styles.detailItem}>
                  <span style={styles.detailItemName}>{p.item_name}</span>
                  <span style={styles.detailItemAmount}>${p.display_amount || p.amount}</span>
                  <span style={styles.detailItemDate}>{formatDate(p.purchase_date)}</span>
                </div>
              ))}
              {(details?.purchases || []).length === 0 && (
                <div style={styles.emptyState}>No purchases</div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.patientDetailEmpty}>
            Select a patient to view details
          </div>
        )}
      </div>
    </div>
  );
}

function InjectionsTab({
  category, setCategory, logs, loading, searchTerm, setSearchTerm,
  showModal, setShowModal, formData, setFormData,
  patientSearch, setPatientSearch, filteredPatients,
  showPatientDropdown, setShowPatientDropdown, fetchLogs
}) {
  const formatLogDate = (dateStr) => {
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

  const formatLogTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const getCategoryLabel = () => {
    switch(category) {
      case 'testosterone': return 'Testosterone';
      case 'weight_loss': return 'Weight Loss';
      case 'vitamin': return 'Vitamin Injection';
      default: return category;
    }
  };

  const openModal = () => {
    setPatientSearch('');
    setFormData(prev => ({
      ...prev,
      patient_id: '',
      patient_name: '',
      category: category,
      log_type: 'injection',
      dosage: '',
      custom_dosage: '',
      weight: '',
      medication: category === 'weight_loss' ? 'Semaglutide' : '',
      notes: '',
      entry_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    }));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPatientSearch('');
    setFormData(prev => ({ ...prev, patient_id: '', patient_name: '' }));
  };

  const selectPatient = (patient) => {
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'Unknown';
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: name
    }));
    setPatientSearch(name);
    setShowPatientDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patient_id) {
      alert('Please select a patient');
      return;
    }

    const payload = {
      patient_id: formData.patient_id,
      category: category,
      entry_type: formData.log_type,
      entry_date: formData.entry_date,
      notes: formData.notes || null
    };

    if (category === 'testosterone') {
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
    } else if (category === 'weight_loss') {
      payload.medication = formData.medication;
      if (formData.log_type === 'injection') {
        payload.dosage = formData.dosage;
        payload.weight = formData.weight ? parseFloat(formData.weight) : null;
      } else {
        payload.quantity = formData.week_supply;
        payload.dosage = `${formData.week_supply} week supply`;
      }
    } else if (category === 'vitamin') {
      payload.medication = formData.medication;
      payload.dosage = 'Standard';
    }

    try {
      const res = await fetch('/api/injection-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        closeModal();
        fetchLogs();
        if (data.protocol_update?.updated) {
          alert(`✓ Entry saved!\n\nProtocol updated:\n- Last refill: ${data.protocol_update.new_last_refill_date || 'updated'}`);
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
      if (res.ok) fetchLogs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div style={styles.tabContent}>
      {/* Category Tabs */}
      <div style={styles.injectionTabs}>
        {[
          { id: 'testosterone', label: 'Testosterone' },
          { id: 'weight_loss', label: 'Weight Loss' },
          { id: 'vitamin', label: 'Vitamin Injections' }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.injectionTab,
              ...(category === tab.id ? styles.injectionTabActive : {})
            }}
            onClick={() => setCategory(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div style={styles.injectionActions}>
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
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Medication</th>
              <th style={styles.th}>Dose/Details</th>
              <th style={styles.th}>Notes</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={styles.emptyState}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={styles.emptyState}>No entries found</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div>{formatLogDate(log.entry_date || log.created_at)}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{formatLogTime(log.created_at)}</div>
                  </td>
                  <td style={styles.td}>{log.patient_name || 'Unknown'}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: log.entry_type === 'pickup' ? '#DBEAFE' : '#DCFCE7',
                      color: log.entry_type === 'pickup' ? '#1D4ED8' : '#166534'
                    }}>
                      {log.entry_type === 'pickup' ? '📦 Pickup' : '💉 Injection'}
                    </span>
                  </td>
                  <td style={styles.td}>{log.medication || '-'}</td>
                  <td style={styles.td}>{log.dosage || '-'}</td>
                  <td style={styles.td}>{log.notes || '-'}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.deleteLogBtn}
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
      <div style={styles.injectionStats}>
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
              <h2 style={styles.modalTitle}>New {getCategoryLabel()} Entry</h2>
              <button style={styles.modalCloseBtn} onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Patient Search */}
              <div style={styles.modalFormGroup}>
                <label style={styles.formLabel}>Patient *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setFormData(prev => ({ ...prev, patient_id: '', patient_name: '' }));
                      setShowPatientDropdown(true);
                    }}
                    placeholder="Type to search patient..."
                    style={styles.formInput}
                    autoComplete="off"
                  />
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div style={styles.patientDropdown}>
                      {filteredPatients.map(p => {
                        const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Unknown';
                        return (
                          <div
                            key={p.id}
                            style={styles.patientDropdownItem}
                            onClick={() => selectPatient(p)}
                          >
                            <div style={{ fontWeight: '500' }}>{displayName}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
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
              <div style={styles.modalFormGroup}>
                <label style={styles.formLabel}>Date *</label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                  style={styles.formInput}
                  required
                />
              </div>

              {/* Type (Injection vs Pickup) */}
              {category !== 'vitamin' && (
                <div style={styles.modalFormGroup}>
                  <label style={styles.formLabel}>Type</label>
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
              {category === 'testosterone' && (
                <>
                  <div style={styles.modalFormGroup}>
                    <label style={styles.formLabel}>HRT Type</label>
                    <select
                      value={formData.hrt_type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        hrt_type: e.target.value,
                        dosage: ''
                      }))}
                      style={styles.formSelect}
                    >
                      <option value="male">Male HRT (200mg/ml)</option>
                      <option value="female">Female HRT (100mg/ml)</option>
                    </select>
                  </div>

                  <div style={styles.modalFormGroup}>
                    <label style={styles.formLabel}>Dosage *</label>
                    <select
                      value={formData.dosage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      style={styles.formSelect}
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
                        style={{ ...styles.formInput, marginTop: '8px' }}
                        required
                      />
                    )}
                  </div>

                  {formData.log_type === 'pickup' && (
                    <div style={styles.modalFormGroup}>
                      <label style={styles.formLabel}>Pickup Type</label>
                      <select
                        value={formData.pickup_type}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pickup_type: e.target.value,
                          quantity: e.target.value === 'vial' ? 1 : 4
                        }))}
                        style={styles.formSelect}
                      >
                        <option value="vial">Vial (10ml)</option>
                        <option value="prefilled">Prefilled Syringes</option>
                      </select>
                    </div>
                  )}

                  {formData.log_type === 'pickup' && formData.pickup_type === 'prefilled' && (
                    <div style={styles.modalFormGroup}>
                      <label style={styles.formLabel}>Quantity</label>
                      <select
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                        style={styles.formSelect}
                      >
                        <option value="4">4 syringes (2 weeks)</option>
                        <option value="8">8 syringes (4 weeks)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Weight Loss Fields */}
              {category === 'weight_loss' && (
                <>
                  <div style={styles.modalFormGroup}>
                    <label style={styles.formLabel}>Medication</label>
                    <select
                      value={formData.medication}
                      onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value, dosage: '' }))}
                      style={styles.formSelect}
                    >
                      {WEIGHT_LOSS_OPTIONS.medications.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.log_type === 'injection' ? (
                    <>
                      <div style={styles.modalFormGroup}>
                        <label style={styles.formLabel}>Dosage *</label>
                        <select
                          value={formData.dosage}
                          onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                          style={styles.formSelect}
                          required
                        >
                          <option value="">Select dosage...</option>
                          {(WEIGHT_LOSS_OPTIONS.dosages[formData.medication] || []).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.modalFormGroup}>
                        <label style={styles.formLabel}>Weight (lbs)</label>
                        <input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="Optional"
                          style={styles.formInput}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={styles.modalFormGroup}>
                      <label style={styles.formLabel}>Week Supply</label>
                      <select
                        value={formData.week_supply}
                        onChange={(e) => setFormData(prev => ({ ...prev, week_supply: parseInt(e.target.value) }))}
                        style={styles.formSelect}
                      >
                        <option value="4">4 weeks</option>
                        <option value="8">8 weeks</option>
                        <option value="12">12 weeks</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Vitamin Fields */}
              {category === 'vitamin' && (
                <div style={styles.modalFormGroup}>
                  <label style={styles.formLabel}>Vitamin Type *</label>
                  <select
                    value={formData.medication}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                    style={styles.formSelect}
                    required
                  >
                    <option value="">Select vitamin...</option>
                    {VITAMIN_OPTIONS.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div style={styles.modalFormGroup}>
                <label style={styles.formLabel}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  style={{ ...styles.formInput, minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Save Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SendFormsTab({
  patients, entryMode, setEntryMode, phone, setPhone,
  firstName, setFirstName, selectedForms, setSelectedForms,
  status, setStatus, loading, setLoading, recentSends, setRecentSends,
  patientSearch, setPatientSearch, selectedPatient, setSelectedPatient,
  filteredPatients, showDropdown, setShowDropdown
}) {
  const formatPhone = (value) => {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setShowDropdown(false);
    if (patient.phone) setPhone(formatPhone(patient.phone));
    if (patient.name) {
      const nameParts = patient.name.split(' ');
      setFirstName(nameParts[0] || '');
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPhone('');
    setFirstName('');
  };

  const toggleForm = (formId) => {
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const applyQuickSelection = (formIds) => {
    setSelectedForms(formIds);
  };

  const getSortedForms = (formIds) => {
    const formOrder = AVAILABLE_FORMS.map(f => f.id);
    return [...formIds].sort((a, b) => formOrder.indexOf(a) - formOrder.indexOf(b));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit phone number' });
      return;
    }

    if (selectedForms.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one form to send' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Sending forms...' });

    try {
      const sortedForms = getSortedForms(selectedForms);

      const response = await fetch('/api/send-forms-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits,
          firstName: firstName.trim() || null,
          formIds: sortedForms
        })
      });

      const result = await response.json();

      if (response.ok) {
        const formNames = sortedForms.map(id =>
          AVAILABLE_FORMS.find(f => f.id === id)?.name
        ).join(', ');

        setStatus({ type: 'success', message: `✓ ${selectedForms.length} form(s) sent to ${phone}` });
        setRecentSends(prev => [{
          phone,
          firstName: firstName.trim() || selectedPatient?.name || 'Patient',
          forms: formNames,
          count: selectedForms.length,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 9)]);

        setPhone('');
        setFirstName('');
        setSelectedPatient(null);
        setPatientSearch('');
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to send' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formsTabContent}>
      <div style={styles.formsCard}>
        <h2 style={styles.formsCardTitle}>Send Patient Forms</h2>

        <form onSubmit={handleSubmit}>
          {/* Mode Toggle */}
          <div style={styles.modeToggle}>
            <button
              type="button"
              style={{ ...styles.modeBtn, ...(entryMode === 'search' ? styles.modeBtnActive : {}) }}
              onClick={() => { setEntryMode('search'); clearPatient(); }}
            >
              🔍 Search Patient
            </button>
            <button
              type="button"
              style={{ ...styles.modeBtn, ...(entryMode === 'manual' ? styles.modeBtnActive : {}) }}
              onClick={() => { setEntryMode('manual'); clearPatient(); }}
            >
              ✏️ Enter Manually
            </button>
          </div>

          {entryMode === 'search' && (
            <>
              {selectedPatient ? (
                <div style={styles.selectedPatientCard}>
                  <div style={styles.selectedPatientInfo}>
                    <div style={styles.selectedPatientName}>✓ {selectedPatient.name}</div>
                    <div style={styles.selectedPatientPhone}>{formatPhone(selectedPatient.phone) || selectedPatient.email || 'No contact info'}</div>
                  </div>
                  <button type="button" style={styles.changePatientBtn} onClick={clearPatient}>
                    Change
                  </button>
                </div>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Search by Name, Email, or Phone</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Start typing patient name..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      style={styles.formInput}
                    />
                    {showDropdown && patientSearch && (
                      <div style={styles.patientDropdown}>
                        {filteredPatients.length === 0 ? (
                          <div style={styles.patientDropdownEmpty}>No patients found</div>
                        ) : (
                          filteredPatients.map(patient => (
                            <div
                              key={patient.id}
                              style={styles.patientDropdownItem}
                              onClick={() => selectPatient(patient)}
                            >
                              <div style={{ fontWeight: '600' }}>{patient.name}</div>
                              <div style={{ fontSize: '12px', color: '#737373' }}>
                                {formatPhone(patient.phone) || patient.email || 'No contact'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {(entryMode === 'manual' || selectedPatient) && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                  style={{ ...styles.formInput, fontSize: '18px', textAlign: 'center', letterSpacing: '0.025em' }}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>First Name (for personalized message)</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Optional"
                  style={styles.formInput}
                />
              </div>
            </>
          )}

          {/* Quick Selections */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Quick Select</label>
            <div style={styles.quickBtns}>
              {QUICK_SELECTIONS.map(qs => {
                const isActive = qs.forms.length === selectedForms.length &&
                  qs.forms.every(f => selectedForms.includes(f));
                return (
                  <button
                    key={qs.label}
                    type="button"
                    style={{ ...styles.quickBtn, ...(isActive ? styles.quickBtnActive : {}) }}
                    onClick={() => applyQuickSelection(qs.forms)}
                  >
                    {qs.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Selection */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Select Forms to Send</label>
            <div style={styles.formsGrid}>
              {AVAILABLE_FORMS.map(form => {
                const isSelected = selectedForms.includes(form.id);
                return (
                  <div
                    key={form.id}
                    style={{ ...styles.formItem, ...(isSelected ? styles.formItemSelected : {}) }}
                    onClick={() => toggleForm(form.id)}
                  >
                    <div style={{ ...styles.formCheckbox, ...(isSelected ? styles.formCheckboxSelected : {}) }}>
                      {isSelected && '✓'}
                    </div>
                    <span style={{ fontSize: '20px' }}>{form.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{form.name}</div>
                      <div style={{ fontSize: '11px', color: '#737373' }}>{form.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={styles.selectionActions}>
              <span style={{ fontSize: '14px', color: '#525252' }}>
                <strong>{selectedForms.length}</strong> form(s) selected
              </span>
              <div>
                <button type="button" style={styles.textBtn} onClick={() => setSelectedForms(AVAILABLE_FORMS.map(f => f.id))}>
                  Select All
                </button>
                <button type="button" style={{ ...styles.textBtn, marginLeft: '12px' }} onClick={() => setSelectedForms([])}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={styles.sendBtn}
            disabled={loading || (entryMode === 'search' && !selectedPatient)}
          >
            {loading ? 'Sending...' : `Send ${selectedForms.length} Form(s)`}
          </button>

          {status.message && (
            <div style={{
              ...styles.statusMessage,
              background: status.type === 'error' ? '#FEF2F2' : status.type === 'success' ? '#F0FDF4' : '#F5F5F5',
              color: status.type === 'error' ? '#DC2626' : status.type === 'success' ? '#16A34A' : '#525252',
              borderColor: status.type === 'error' ? '#DC2626' : status.type === 'success' ? '#16A34A' : '#D4D4D4',
            }}>
              {status.message}
            </div>
          )}
        </form>

        {/* Recent Sends */}
        {recentSends.length > 0 && (
          <div style={styles.recentSends}>
            <div style={styles.recentTitle}>Recent Sends</div>
            <div style={styles.recentList}>
              {recentSends.map((send, i) => (
                <div key={i} style={styles.recentItem}>
                  <div style={styles.recentTop}>
                    <span><strong>{send.firstName}</strong> · {send.phone}</span>
                    <span style={{ color: '#A3A3A3', fontSize: '12px' }}>{send.time}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#737373' }}>{send.forms}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, onClick }) {
  return (
    <div
      style={{ ...styles.statCard, borderColor: color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ============================================
// STYLES - Light Theme
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#FFFFFF',
    color: '#1A1A1A',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    fontSize: '16px',
    color: '#DC2626',
  },
  retryBtn: {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: '#1A1A1A',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E5E5',
    background: '#FAFAFA',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#1A1A1A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '0 24px',
    borderBottom: '1px solid #E5E5E5',
    overflowX: 'auto',
    background: '#FAFAFA',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 20px',
    background: 'transparent',
    color: '#666',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#1A1A1A',
    borderBottomColor: '#1A1A1A',
  },
  tabIcon: {
    fontSize: '16px',
  },
  tabLabel: {},
  tabBadge: {
    padding: '2px 8px',
    background: '#DC2626',
    color: '#fff',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
  },
  main: {
    padding: '24px',
    minHeight: 'calc(100vh - 140px)',
    background: '#F5F5F5',
  },
  tabContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // Overview
  overviewGrid: {},
  sessionAlertsBanner: {
    display: 'flex',
    gap: '16px',
    padding: '16px 20px',
    background: '#FEF2F2',
    border: '2px solid #DC2626',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  sessionAlertsIcon: {
    fontSize: '28px',
  },
  sessionAlertsContent: {
    flex: 1,
  },
  sessionAlertsTitle: {
    color: '#991B1B',
    fontSize: '16px',
    display: 'block',
    marginBottom: '12px',
  },
  sessionAlertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sessionAlertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #FECACA',
    flexWrap: 'wrap',
  },
  sessionAlertBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  sessionAlertPatient: {
    fontWeight: '600',
    color: '#1A1A1A',
    fontSize: '14px',
  },
  sessionAlertDetail: {
    color: '#666',
    fontSize: '13px',
  },
  sessionAlertPhone: {
    marginLeft: 'auto',
    color: '#2563EB',
    fontSize: '13px',
    textDecoration: 'none',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderLeft: '3px solid',
    borderRadius: '8px',
    padding: '16px 20px',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  overviewColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  overviewColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1A1A1A',
  },
  categoryBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  categoryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '120px',
    fontSize: '13px',
    color: '#555',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  categoryBarOuter: {
    flex: 1,
    height: '8px',
    background: '#E5E5E5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  categoryBarInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  categoryCount: {
    width: '30px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #EEEEEE',
  },
  activityMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  activityName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1A1A1A',
  },
  activityDesc: {
    fontSize: '12px',
    color: '#666',
  },
  activityMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  activityAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
  },
  activityTime: {
    fontSize: '11px',
    color: '#888',
  },
  protocolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  protocolRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #EEEEEE',
  },
  urgencyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  protocolName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    color: '#1A1A1A',
  },
  categoryBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  protocolStatus: {
    fontSize: '12px',
    color: '#666',
    minWidth: '100px',
    textAlign: 'right',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },

  // Leads
  alertBanner: {
    display: 'flex',
    gap: '16px',
    padding: '16px 20px',
    background: '#FFF7ED',
    border: '1px solid #FB923C',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  alertIcon: {
    fontSize: '24px',
  },
  alertContent: {
    flex: 1,
    color: '#9A3412',
  },
  alertItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  alertItem: {
    fontSize: '12px',
    color: '#B45309',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
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
  filterPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterPill: {
    padding: '6px 14px',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '20px',
    color: '#555',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterPillActive: {
    background: '#1A1A1A',
    color: '#FFFFFF',
    borderColor: '#1A1A1A',
  },
  leadsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  leadCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  leadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  leadInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  leadName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  leadContact: {
    fontSize: '13px',
    color: '#666',
  },
  leadMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  leadStatus: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
  },
  leadTime: {
    fontSize: '12px',
    color: '#888',
  },
  leadExpanded: {
    padding: '16px 20px',
    background: '#F9FAFB',
    borderTop: '1px solid #E5E5E5',
  },
  leadTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  leadTag: {
    padding: '3px 8px',
    background: '#E5E5E5',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#555',
  },
  leadSource: {
    padding: '3px 8px',
    background: '#D1FAE5',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#047857',
  },
  leadActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  actionBtn: {
    padding: '8px 14px',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    color: '#1A1A1A',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },

  // Protocols Table
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
  },
  patientLink: {
    fontWeight: '500',
    color: '#1A1A1A',
  },
  deliveryBadge: {
    padding: '3px 8px',
    background: '#F3F4F6',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#555',
  },
  smallBtn: {
    padding: '4px 10px',
    background: '#F3F4F6',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    color: '#555',
    fontSize: '11px',
    cursor: 'pointer',
  },

  // Patients
  patientsLayout: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 200px)',
  },
  patientList: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  patientListItems: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  patientItem: {
    padding: '12px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    border: '1px solid transparent',
  },
  patientItemSelected: {
    background: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  patientItemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1A1A1A',
  },
  patientItemMeta: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px',
  },
  patientDetail: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    padding: '24px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  patientDetailEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#888',
  },
  patientHeader: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E5E5E5',
  },
  patientName: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#1A1A1A',
  },
  patientContact: {
    display: 'flex',
    gap: '20px',
    marginTop: '8px',
    fontSize: '14px',
    color: '#555',
  },
  patientSince: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#888',
  },
  patientActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  detailSection: {
    marginBottom: '24px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    color: '#1A1A1A',
  },
  addProtocolBtn: {
    padding: '6px 12px',
    background: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '13px',
  },
  detailItemName: {
    flex: 1,
    color: '#1A1A1A',
  },
  detailItemType: {
    padding: '2px 8px',
    background: '#F3F4F6',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#555',
  },
  detailItemAmount: {
    fontWeight: '600',
    color: '#059669',
  },
  detailItemDate: {
    color: '#888',
    fontSize: '12px',
  },
  intakeIcon: {
    fontSize: '16px',
    marginRight: '4px',
  },
  consentIcon: {
    fontSize: '16px',
    marginRight: '4px',
  },
  consentStatus: {
    fontSize: '12px',
    fontWeight: '600',
  },
  viewPdfBtn: {
    padding: '4px 8px',
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '4px',
    color: '#1D4ED8',
    fontSize: '11px',
    fontWeight: '500',
    textDecoration: 'none',
    marginLeft: 'auto',
    cursor: 'pointer',
  },

  // PDF Slide-out Styles
  pdfOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  pdfSlideOut: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '60%',
    maxWidth: '800px',
    height: '100vh',
    background: '#FFFFFF',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.2s ease-out',
  },
  pdfSlideOutHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E5E5E5',
    background: '#FAFAFA',
  },
  pdfSlideOutTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#1A1A1A',
  },
  pdfSlideOutClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  pdfSlideOutFrame: {
    flex: 1,
    width: '100%',
    border: 'none',
  },

  // Injections Tab Styles
  injectionTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  injectionTab: {
    padding: '10px 20px',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  injectionTabActive: {
    background: '#1A1A1A',
    color: '#FFFFFF',
    borderColor: '#1A1A1A',
  },
  injectionActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
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
  },
  injectionStats: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#555',
  },
  deleteLogBtn: {
    padding: '4px 10px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '4px',
    color: '#DC2626',
    fontSize: '16px',
    cursor: 'pointer',
  },

  // Modal Styles
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
    zIndex: 1000,
  },
  modal: {
    background: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E5E5',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  modalFormGroup: {
    marginBottom: '16px',
    padding: '0 24px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    color: '#1A1A1A',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    color: '#1A1A1A',
  },
  radioGroup: {
    display: 'flex',
    gap: '16px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  patientDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  patientDropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #F3F4F6',
  },
  patientDropdownEmpty: {
    padding: '12px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
  submitBtn: {
    width: 'calc(100% - 48px)',
    margin: '16px 24px 24px',
    padding: '12px',
    background: '#1A1A1A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  assignModalPatient: {
    padding: '12px 24px',
    background: '#F0FDF4',
    borderBottom: '1px solid #E5E5E5',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  assignModalPatientLabel: {
    fontSize: '13px',
    color: '#555',
  },
  assignModalPatientName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#166534',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E5E5E5',
    marginTop: '8px',
  },
  modalCancelBtn: {
    padding: '10px 20px',
    background: '#FFFFFF',
    color: '#555',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    padding: '10px 20px',
    background: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Send Forms Tab Styles
  formsTabContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  formsCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  formsCardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#1A1A1A',
  },
  modeToggle: {
    display: 'flex',
    gap: '0',
    marginBottom: '20px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    background: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRight: '1px solid #D1D5DB',
  },
  modeBtnActive: {
    background: '#1A1A1A',
    color: '#FFFFFF',
  },
  selectedPatientCard: {
    background: '#F0FDF4',
    border: '1px solid #16A34A',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPatientInfo: {},
  selectedPatientName: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#166534',
  },
  selectedPatientPhone: {
    fontSize: '13px',
    color: '#15803D',
  },
  changePatientBtn: {
    background: 'none',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
  },
  quickBtns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    background: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  quickBtnActive: {
    background: '#1A1A1A',
    color: '#FFFFFF',
    borderColor: '#1A1A1A',
  },
  formsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  formItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: '1px solid #E5E5E5',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  formItemSelected: {
    borderColor: '#1A1A1A',
    background: '#F5F5F5',
  },
  formCheckbox: {
    width: '18px',
    height: '18px',
    border: '2px solid #D1D5DB',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    flexShrink: 0,
  },
  formCheckboxSelected: {
    background: '#1A1A1A',
    borderColor: '#1A1A1A',
    color: '#FFFFFF',
  },
  selectionActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #E5E5E5',
  },
  textBtn: {
    fontSize: '12px',
    color: '#555',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  sendBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '6px',
    background: '#1A1A1A',
    color: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginTop: '16px',
  },
  statusMessage: {
    marginTop: '12px',
    padding: '12px',
    textAlign: 'center',
    fontWeight: '500',
    borderRadius: '6px',
    border: '1px solid',
  },
  recentSends: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #E5E5E5',
  },
  recentTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#737373',
    marginBottom: '12px',
  },
  recentList: {},
  recentItem: {
    padding: '10px 0',
    borderBottom: '1px solid #E5E5E5',
    fontSize: '14px',
  },
  recentTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
};

// Media query styles would be handled in the global CSS or with a useMediaQuery hook
